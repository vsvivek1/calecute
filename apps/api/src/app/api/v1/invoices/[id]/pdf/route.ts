/**
 * GET /api/v1/invoices/{id}/pdf?token=…
 *
 * The invoice or credit note as a PDF. No key: the link carries the
 * invoice's own random token, so whoever holds the link (the buyer, through
 * their app) can open it and nobody can guess another. A wrong token and an
 * unknown id are the same 404.
 */
import { sql } from "drizzle-orm";
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { publicRoute } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { ApiError } from "@/lib/errors";
import { RULES } from "@/lib/ratelimit";
import { invoicePdf } from "@/lib/export/invoice-pdf";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  token: z.string().trim().regex(/^[0-9a-f]{32}$/),
  download: z.enum(["0", "1"]).default("0"),
});

type LinkRow = Record<string, unknown> & {
  id: number;
  doc_type: string;
  number: string;
  issued_at: Date | string;
  original_invoice_id: number | null;
  payment_ref: string;
  refund_ref: string | null;
  seller_name: string;
  seller_address: string;
  seller_state_code: string;
  seller_gstin: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_gstin: string | null;
  place_of_supply: string;
  description: string;
  sac: string;
  gst_rate_bps: number;
  taxable_paise: number | string;
  cgst_paise: number | string;
  sgst_paise: number | string;
  igst_paise: number | string;
  total_paise: number | string;
};

export const GET = handler(async (request, context) => {
  const { id } = await (context as unknown as { params: Promise<{ id: string }> }).params;
  const invoiceId = Number(id);
  if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
    throw new ApiError("NOT_FOUND", "No such invoice");
  }

  return publicRoute({ name: "invoices.pdf", limit: RULES.publicRead }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);
    const rows = await ctx.tx.execute<LinkRow>(
      sql`SELECT * FROM app.invoice_for_link(${invoiceId}, ${query.token})`,
    );
    const row = rows[0];
    if (!row) throw new ApiError("NOT_FOUND", "No such invoice");

    let originalNumber: string | null = null;
    if (row.original_invoice_id) {
      const original = await ctx.tx.execute<{ number: string | null }>(
        sql`SELECT app.invoice_number_for_link(${row.original_invoice_id}) AS number`,
      );
      originalNumber = original[0]?.number ?? null;
    }

    const bytes = await invoicePdf({
      docType: row.doc_type,
      number: row.number,
      issuedAt: new Date(row.issued_at),
      originalNumber,
      sellerName: row.seller_name,
      sellerAddress: row.seller_address,
      sellerStateCode: row.seller_state_code,
      sellerGstin: row.seller_gstin,
      buyerName: row.buyer_name,
      buyerEmail: row.buyer_email,
      buyerGstin: row.buyer_gstin,
      placeOfSupply: row.place_of_supply,
      paymentRef: row.payment_ref,
      refundRef: row.refund_ref,
      description: row.description,
      sac: row.sac,
      gstRateBps: Number(row.gst_rate_bps),
      taxablePaise: Number(row.taxable_paise),
      cgstPaise: Number(row.cgst_paise),
      sgstPaise: Number(row.sgst_paise),
      igstPaise: Number(row.igst_paise),
      totalPaise: Number(row.total_paise),
    });

    const filename = row.number.replace(/\//g, "-");
    return new Response(bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${query.download === "1" ? "attachment" : "inline"}; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
        ...ctx.rateHeaders,
      },
    });
  })(request);
});

export const OPTIONS = preflight;
