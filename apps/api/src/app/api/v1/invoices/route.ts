/**
 * POST /api/v1/invoices   issue the GST invoice for a captured payment
 * GET  /api/v1/invoices   list this product's invoices for one buyer
 *
 * Every Calecute product invoices through here so the whole GSTIN has one
 * number series (see drizzle/0010_invoices.sql). Server key only: an invoice
 * is a tax document, and a client key ships inside an app.
 *
 * POST is idempotent on `paymentRef`: a retried webhook gets the invoice
 * already issued, with 200 instead of 201. The amount is what the buyer paid,
 * GST included; the split comes from the product's SAC and rate.
 */
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { ok, serviceRoute } from "@/lib/route";
import { parseBody, parseQuery } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { invoices } from "@/db/schema";
import { isValidGstin, GST_STATES } from "@/lib/invoice";
import { invoiceResponse, issueInvoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidGstin, "Not a valid GSTIN");

const bodySchema = z.object({
  /** The product system's payment id, e.g. Razorpay's pay_…. */
  paymentRef: z.string().trim().min(1).max(120),
  /** The product system's user id, for listing a buyer's invoices later. */
  customerRef: z.string().trim().min(1).max(120).nullish(),
  /** What the buyer paid, GST included, in paise. */
  amountPaise: z.number().int().min(1),
  paidAt: z.coerce.date(),
  /** The invoice line. Defaults to the product's name. */
  description: z.string().trim().min(1).max(200).nullish(),
  buyer: z
    .object({
      name: z.string().trim().min(1).max(200).nullish(),
      email: z.string().trim().toLowerCase().email().max(200).nullish(),
      gstin: gstin.nullish(),
      stateCode: z
        .string()
        .trim()
        .refine((code) => code in GST_STATES, "Not a GST state code")
        .nullish(),
    })
    .nullish(),
});

const querySchema = z.object({
  customerRef: z.string().trim().min(1).max(120),
});

export const POST = handler(
  serviceRoute(
    { name: "invoices.issue", kinds: ["server"], limit: RULES.service },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const { invoice, created } = await issueInvoice(ctx.tx, ctx.product!.id, body);
      return ok(ctx, invoiceResponse(ctx.request.url, invoice), created ? 201 : 200);
    },
  ),
);

export const GET = handler(
  serviceRoute(
    { name: "invoices.list", kinds: ["server"], limit: RULES.service },
    async (ctx) => {
      const query = parseQuery(ctx.url, querySchema);
      const rows = await ctx.tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.productId, ctx.product!.id),
            eq(invoices.customerRef, query.customerRef),
          ),
        )
        .orderBy(desc(invoices.issuedAt))
        .limit(100);
      const numberOf = new Map(rows.map((r) => [r.id, r.number]));
      return ok(ctx, {
        items: rows.map((r) =>
          invoiceResponse(ctx.request.url, r, r.originalInvoiceId ? numberOf.get(r.originalInvoiceId) : null),
        ),
      });
    },
  ),
);

export const OPTIONS = preflight;
