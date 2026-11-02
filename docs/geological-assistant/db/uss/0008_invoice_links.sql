-- Geological Assistant: GST billing details and invoice links, inside schema geological_assistant (USS).
-- Additive only. Nothing in public or auth is changed.
--
-- Invoices are NOT issued here. Every Calecute app sells under one GSTIN, so the invoice number
-- series and the PDFs live in the shared Calecute billing service (repo vsvivek1/calecute-billing, POST /api/v1/invoices and
-- /api/v1/credit-notes). ga-razorpay-webhook calls it after each capture or refund and keeps the
-- number and PDF link on the order, so the study page can list a buyer's invoices.

-- What the buyer asked to appear on the invoice, captured at checkout.
alter table geological_assistant.payment_orders
  add column billing_name text,
  add column billing_state_code text check (billing_state_code ~ '^\d{2}$'),
  add column billing_gstin text,
  -- Filled by the webhook from the invoicing API.
  add column invoice_no text,
  add column invoice_pdf_url text,
  add column credit_note_no text,
  add column credit_note_pdf_url text;
