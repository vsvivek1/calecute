-- GST invoices and credit notes for every Calecute product, under one GSTIN.
--
-- Why this migration exists
-- ------------------------
-- Every app sells under the same GSTIN, so invoicing cannot live inside any
-- one app: the law wants one consecutive number series per financial year for
-- the whole registration (CGST Rule 46(b)), not one per app. A product system
-- calls POST /invoices with its server key after a payment is captured, and
-- POST /credit-notes after a refund. The API keeps the series, the tax split
-- and the PDF; the app only stores the number and the link it gets back.
--
-- Additive only: new tables, two defaulted columns on products.

-- ------------------------------------------------------------- products
-- What each product's line on an invoice is taxed as. 999293 is commercial
-- training and coaching; 18% GST.
ALTER TABLE public.products
  ADD COLUMN sac text NOT NULL DEFAULT '999293',
  ADD COLUMN gst_rate_bps smallint NOT NULL DEFAULT 1800;

ALTER TABLE public.products
  ADD CONSTRAINT products_gst_rate_check CHECK (gst_rate_bps BETWEEN 0 AND 2800);

-- --------------------------------------------------------------- seller
-- One row: the registration every invoice is issued under. Each invoice
-- copies these fields when it is issued, so editing this row never changes
-- an invoice that has already gone out. A null GSTIN issues plain receipts
-- with no tax (an unregistered seller cannot charge GST).
CREATE TABLE public.invoice_seller (
  id          boolean PRIMARY KEY DEFAULT true CHECK (id),
  legal_name  text NOT NULL,
  address     text NOT NULL,
  state_code  text NOT NULL CHECK (state_code ~ '^\d{2}$'),
  gstin       text CHECK (gstin ~ '^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  email       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.invoice_seller (legal_name, address, state_code, gstin, email)
VALUES (
  'CALECUTE TECHNOLOGIES (OPC) PRIVATE LIMITED',
  '11/698A, Poolakadavu, Marikkunnu (PO), Kozhikode 673012, Kerala, India',
  '32',
  '32AAOCC1290K1ZK',
  'info@calecutech.com'
);

-- Readable by every request (it is printed on every invoice); written only by
-- the owner, through SQL.
REVOKE INSERT, UPDATE, DELETE ON public.invoice_seller FROM calecute_app;
GRANT SELECT ON public.invoice_seller TO calecute_app;

-- ------------------------------------------------------------- counters
-- Reached only through app.next_invoice_number, never directly.
CREATE TABLE public.invoice_counters (
  doc_type        text NOT NULL CHECK (doc_type IN ('INVOICE', 'CREDIT_NOTE')),
  financial_year  text NOT NULL,
  last_serial     integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, financial_year)
);
REVOKE ALL ON public.invoice_counters FROM calecute_app;

-- ------------------------------------------------------------- invoices
CREATE TABLE public.invoices (
  id                   bigserial PRIMARY KEY,
  doc_type             text NOT NULL CHECK (doc_type IN ('INVOICE', 'CREDIT_NOTE')),
  number               text NOT NULL UNIQUE,
  financial_year       text NOT NULL,
  issued_at            timestamptz NOT NULL,
  product_id           bigint NOT NULL REFERENCES public.products(id),
  -- The product system's own payment id (Razorpay pay_…, Play order id).
  payment_ref          text NOT NULL,
  -- Credit notes only: the refund id, and the invoice being credited.
  refund_ref           text,
  original_invoice_id  bigint REFERENCES public.invoices(id),
  -- The product system's user id, so it can list one buyer's invoices.
  customer_ref         text,
  -- Seller, as it was when issued.
  seller_name          text NOT NULL,
  seller_address       text NOT NULL,
  seller_state_code    text NOT NULL,
  seller_gstin         text,
  -- Buyer.
  buyer_name           text,
  buyer_email          text,
  buyer_gstin          text,
  place_of_supply      text NOT NULL,
  -- The one line.
  description          text NOT NULL,
  sac                  text NOT NULL,
  gst_rate_bps         smallint NOT NULL,
  taxable_paise        bigint NOT NULL CHECK (taxable_paise >= 0),
  cgst_paise           bigint NOT NULL DEFAULT 0 CHECK (cgst_paise >= 0),
  sgst_paise           bigint NOT NULL DEFAULT 0 CHECK (sgst_paise >= 0),
  igst_paise           bigint NOT NULL DEFAULT 0 CHECK (igst_paise >= 0),
  total_paise          bigint NOT NULL,
  -- Lets anyone holding the link open the PDF, and nobody else.
  view_token           text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_parts_add_up
    CHECK (taxable_paise + cgst_paise + sgst_paise + igst_paise = total_paise),
  CONSTRAINT invoices_credit_note_shape
    CHECK ((doc_type = 'CREDIT_NOTE') = (refund_ref IS NOT NULL AND original_invoice_id IS NOT NULL))
);

-- One invoice per payment, one credit note per refund, per product.
CREATE UNIQUE INDEX invoices_one_per_payment
  ON public.invoices (product_id, payment_ref) WHERE doc_type = 'INVOICE';
CREATE UNIQUE INDEX invoices_one_per_refund
  ON public.invoices (product_id, refund_ref) WHERE doc_type = 'CREDIT_NOTE';
CREATE INDEX invoices_customer_idx ON public.invoices (product_id, customer_ref, issued_at DESC);

-- Issued documents are never edited or deleted; a mistake is corrected with
-- a credit note.
REVOKE UPDATE, DELETE ON public.invoices FROM calecute_app;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;

CREATE POLICY invoices_read ON public.invoices FOR SELECT
  USING (
    app.is_super_admin()
    OR (app.is_service() AND public.invoices.product_id = app.current_product_id())
  );

CREATE POLICY invoices_insert ON public.invoices FOR INSERT
  WITH CHECK (
    app.is_super_admin()
    OR (app.is_service() AND public.invoices.product_id = app.current_product_id())
  );

-- ------------------------------------------------------------ functions

-- The next number in a series, gapless: the counter row is locked until the
-- issuing transaction ends, and a rollback returns the number.
CREATE OR REPLACE FUNCTION app.next_invoice_serial(p_doc_type text, p_financial_year text)
  RETURNS integer
  LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    INSERT INTO public.invoice_counters AS c (doc_type, financial_year, last_serial)
    VALUES (p_doc_type, p_financial_year, 1)
    ON CONFLICT (doc_type, financial_year)
      DO UPDATE SET last_serial = c.last_serial + 1
    RETURNING last_serial;
$$;

-- An invoice for the public PDF link: the id and the token must both match.
-- Runs as the owner because the anonymous caller has no policy on invoices.
CREATE OR REPLACE FUNCTION app.invoice_for_link(p_id bigint, p_token text)
  RETURNS SETOF public.invoices
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT * FROM public.invoices i
     WHERE i.id = p_id AND i.view_token = p_token;
$$;

-- The number of the invoice a credit note credits, for the same PDF.
CREATE OR REPLACE FUNCTION app.invoice_number_for_link(p_id bigint)
  RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT number FROM public.invoices WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION app.next_invoice_serial(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.invoice_for_link(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app.invoice_number_for_link(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.next_invoice_serial(text, text) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.invoice_for_link(bigint, text) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.invoice_number_for_link(bigint) TO calecute_app;
