/**
 * POST /api/v1/credit-notes
 *
 * Issues the credit note for a refund against the invoice of `paymentRef`,
 * with the tax reversed in proportion. Partial refunds are fine; refunds
 * beyond the invoice total are refused. Idempotent on `refundRef`. Server key
 * only, like POST /invoices.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { ok, serviceRoute } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { invoiceResponse, issueCreditNote } from "@/lib/invoices";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  paymentRef: z.string().trim().min(1).max(120),
  /** The product system's refund id, e.g. Razorpay's rfnd_…. */
  refundRef: z.string().trim().min(1).max(120),
  /** The amount refunded, GST included, in paise. */
  amountPaise: z.number().int().min(1),
  refundedAt: z.coerce.date(),
});

export const POST = handler(
  serviceRoute(
    { name: "credit-notes.issue", kinds: ["server"], limit: RULES.service },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const { invoice, created } = await issueCreditNote(ctx.tx, ctx.product!.id, body);
      return ok(ctx, invoiceResponse(ctx.request.url, invoice), created ? 201 : 200);
    },
  ),
);

export const OPTIONS = preflight;
