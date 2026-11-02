/**
 * Issuing invoices and credit notes. The arithmetic is in lib/invoice.ts;
 * this file is the database side, shared by the three invoice routes.
 *
 * Idempotency is by the product system's own references: a second call for
 * the same payment (or refund) returns the document already issued. A
 * transaction-scoped advisory lock on that reference serialises concurrent
 * retries, so two webhook deliveries arriving together cannot both take a
 * number.
 */
import { and, eq, sql } from "drizzle-orm";
import type { ScopedDb } from "@/db/rls";
import { invoiceSeller, invoices, products } from "@/db/schema";
import { ApiError } from "./errors";
import { financialYearOf } from "./money";
import {
  formatInvoiceNumber,
  placeOfSupply,
  splitGst,
  type InvoiceDocType,
} from "./invoice";

type InvoiceRow = typeof invoices.$inferSelect;

export interface IssueInvoiceInput {
  paymentRef: string;
  customerRef?: string | null;
  amountPaise: number;
  paidAt: Date;
  description?: string | null;
  buyer?: {
    name?: string | null;
    email?: string | null;
    gstin?: string | null;
    stateCode?: string | null;
  } | null;
}

export interface IssueCreditNoteInput {
  paymentRef: string;
  refundRef: string;
  amountPaise: number;
  refundedAt: Date;
}

async function lock(tx: ScopedDb, key: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
}

async function nextNumber(tx: ScopedDb, docType: InvoiceDocType, at: Date) {
  const financialYear = financialYearOf(at);
  const rows = await tx.execute<{ serial: number }>(
    sql`SELECT app.next_invoice_serial(${docType}, ${financialYear}) AS serial`,
  );
  const serial = Number(rows[0].serial);
  return { financialYear, number: formatInvoiceNumber(docType, financialYear, serial) };
}

async function seller(tx: ScopedDb) {
  const [row] = await tx.select().from(invoiceSeller).limit(1);
  if (!row) throw new ApiError("INTERNAL_ERROR", "Invoice seller details are not set");
  return row;
}

export async function issueInvoice(
  tx: ScopedDb,
  productId: number,
  input: IssueInvoiceInput,
): Promise<{ invoice: InvoiceRow; created: boolean }> {
  await lock(tx, `invoice:${productId}:${input.paymentRef}`);

  const [existing] = await tx
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.productId, productId),
        eq(invoices.paymentRef, input.paymentRef),
        eq(invoices.docType, "INVOICE"),
      ),
    )
    .limit(1);
  if (existing) return { invoice: existing, created: false };

  const [product] = await tx
    .select({ nameEn: products.nameEn, sac: products.sac, gstRateBps: products.gstRateBps })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) throw new ApiError("NOT_FOUND", "Unknown product");

  const s = await seller(tx);
  const pos = placeOfSupply({
    buyerGstin: input.buyer?.gstin,
    buyerStateCode: input.buyer?.stateCode,
    sellerStateCode: s.stateCode,
  });
  const registered = s.gstin !== null;
  const split = splitGst(input.amountPaise, {
    rateBps: product.gstRateBps,
    intraState: pos === s.stateCode,
    registered,
  });
  const { financialYear, number } = await nextNumber(tx, "INVOICE", input.paidAt);

  const [invoice] = await tx
    .insert(invoices)
    .values({
      docType: "INVOICE",
      number,
      financialYear,
      issuedAt: input.paidAt,
      productId,
      paymentRef: input.paymentRef,
      customerRef: input.customerRef ?? null,
      sellerName: s.legalName,
      sellerAddress: s.address,
      sellerStateCode: s.stateCode,
      sellerGstin: s.gstin,
      buyerName: input.buyer?.name ?? null,
      buyerEmail: input.buyer?.email ?? null,
      buyerGstin: input.buyer?.gstin ?? null,
      placeOfSupply: pos,
      description: input.description || product.nameEn,
      sac: product.sac,
      gstRateBps: registered ? product.gstRateBps : 0,
      ...split,
    })
    .returning();
  return { invoice, created: true };
}

/**
 * A credit note against a payment's invoice, with the tax reversed in
 * proportion. 404 when the payment was never invoiced.
 */
export async function issueCreditNote(
  tx: ScopedDb,
  productId: number,
  input: IssueCreditNoteInput,
): Promise<{ invoice: InvoiceRow; created: boolean }> {
  await lock(tx, `credit:${productId}:${input.refundRef}`);

  const [existing] = await tx
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.productId, productId),
        eq(invoices.refundRef, input.refundRef),
        eq(invoices.docType, "CREDIT_NOTE"),
      ),
    )
    .limit(1);
  if (existing) return { invoice: existing, created: false };

  const [original] = await tx
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.productId, productId),
        eq(invoices.paymentRef, input.paymentRef),
        eq(invoices.docType, "INVOICE"),
      ),
    )
    .limit(1);
  if (!original) throw new ApiError("NOT_FOUND", "No invoice for that paymentRef");

  // Everything already credited against this invoice, so refunds never exceed it.
  const [{ credited }] = await tx
    .select({ credited: sql<number>`coalesce(sum(${invoices.totalPaise}), 0)::bigint` })
    .from(invoices)
    .where(and(eq(invoices.originalInvoiceId, original.id), eq(invoices.docType, "CREDIT_NOTE")));
  if (Number(credited) + input.amountPaise > original.totalPaise) {
    throw new ApiError("UNPROCESSABLE", "Refunds would exceed the invoice total", {
      details: { invoiceTotalPaise: original.totalPaise, alreadyCreditedPaise: Number(credited) },
    });
  }

  const split = splitGst(input.amountPaise, {
    rateBps: original.gstRateBps,
    intraState: original.placeOfSupply === original.sellerStateCode,
    registered: original.sellerGstin !== null,
  });
  const { financialYear, number } = await nextNumber(tx, "CREDIT_NOTE", input.refundedAt);

  const [note] = await tx
    .insert(invoices)
    .values({
      docType: "CREDIT_NOTE",
      number,
      financialYear,
      issuedAt: input.refundedAt,
      productId,
      paymentRef: original.paymentRef,
      refundRef: input.refundRef,
      originalInvoiceId: original.id,
      customerRef: original.customerRef,
      sellerName: original.sellerName,
      sellerAddress: original.sellerAddress,
      sellerStateCode: original.sellerStateCode,
      sellerGstin: original.sellerGstin,
      buyerName: original.buyerName,
      buyerEmail: original.buyerEmail,
      buyerGstin: original.buyerGstin,
      placeOfSupply: original.placeOfSupply,
      description: `Refund against invoice ${original.number}`,
      sac: original.sac,
      gstRateBps: original.gstRateBps,
      ...split,
    })
    .returning();
  return { invoice: note, created: true };
}

/** An invoice as the API returns it. `pdfUrl` opens without any key. */
export function invoiceResponse(requestUrl: string, row: InvoiceRow, originalNumber?: string | null) {
  const origin = new URL(requestUrl).origin;
  return {
    id: row.id,
    type: row.docType,
    number: row.number,
    financialYear: row.financialYear,
    issuedAt: row.issuedAt.toISOString(),
    paymentRef: row.paymentRef,
    refundRef: row.refundRef,
    originalNumber: originalNumber ?? null,
    customerRef: row.customerRef,
    seller: {
      name: row.sellerName,
      address: row.sellerAddress,
      stateCode: row.sellerStateCode,
      gstin: row.sellerGstin,
    },
    buyer: { name: row.buyerName, email: row.buyerEmail, gstin: row.buyerGstin },
    placeOfSupply: row.placeOfSupply,
    description: row.description,
    sac: row.sac,
    gstRateBps: row.gstRateBps,
    taxablePaise: row.taxablePaise,
    cgstPaise: row.cgstPaise,
    sgstPaise: row.sgstPaise,
    igstPaise: row.igstPaise,
    totalPaise: row.totalPaise,
    pdfUrl: `${origin}/api/v1/invoices/${row.id}/pdf?token=${row.viewToken}`,
  };
}
