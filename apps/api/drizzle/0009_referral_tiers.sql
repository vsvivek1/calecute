-- Two tiers of referrer in one shared system.
--
-- Why this migration exists
-- ------------------------
-- Until now the only people who could earn from a referral were commission
-- agents: vetted, placed in a panchayat, paid 10% flat. The owner's decision is
-- that every signed-in user of every Calecute app also gets an invite code with
-- no application and no KYC, and that sellers earn a rate set per product.
--
--   USER tier    every app user, automatically. On a PAID product they earn
--                1% (100 bps) of each payment a friend makes, as cash through
--                the existing commission pipeline. On a FREE product they earn
--                one diamond per friend who joins — recognition, never money.
--   SELLER tier  the existing agents. 10% to 30% of the fee, set per product.
--
-- The two tiers share one `agents` table so attribution, commissions, payouts
-- and the leaderboard have exactly one code namespace and one ledger. The cost
-- of that is a looser `agents` row: the seller-only columns become nullable
-- and a CHECK keeps them mandatory for sellers.
--
-- Product apps authenticate with an API key (product_api_keys) and run as the
-- new `SERVICE` role, which is deliberately narrower than SUPER_ADMIN: it may
-- write the product-system tables and read only what those writes need. It
-- never sees payout profiles, seller mobile numbers, or another product's
-- members.

-- ------------------------------------------------------------------ enums

CREATE TYPE agent_tier AS ENUM ('USER', 'SELLER');

-- ------------------------------------------------------------------- users
-- A product user is identified as `<product_slug>:<their uid in that app>`.
-- They have no Google identity here and may have no email address.

ALTER TABLE public.users ALTER COLUMN google_sub DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.users ADD COLUMN external_ref text;

ALTER TABLE public.users
  ADD CONSTRAINT users_external_ref_unique UNIQUE (external_ref);

-- At least one identity, always.
ALTER TABLE public.users
  ADD CONSTRAINT users_identity_check CHECK (
    google_sub IS NOT NULL OR external_ref IS NOT NULL
  );

-- Product users must carry a ref; Google users must carry an email. A member
-- of two apps is two users rows (the ref is namespaced per product), so the
-- email uniqueness that protects Google sign-in applies only to Google rows.
ALTER TABLE public.users
  ADD CONSTRAINT users_product_user_check CHECK (
    external_ref IS NULL OR google_sub IS NULL
  );
ALTER TABLE public.users
  ADD CONSTRAINT users_google_email_check CHECK (
    google_sub IS NULL OR email IS NOT NULL
  );

DROP INDEX IF EXISTS users_email_idx;
CREATE UNIQUE INDEX users_email_idx
  ON public.users (lower(email))
  WHERE external_ref IS NULL;

-- ---------------------------------------------------------------- products

ALTER TABLE public.products
  ADD COLUMN fee_paise bigint,
  ADD COLUMN seller_rate_bps smallint NOT NULL DEFAULT 1000,
  ADD COLUMN user_rate_bps smallint NOT NULL DEFAULT 100,
  ADD COLUMN web_url text,
  ADD COLUMN play_url text,
  ADD COLUMN android_package text;

COMMENT ON COLUMN public.products.fee_paise IS
  'NULL means the product is free: referrers earn diamonds, never money.';

ALTER TABLE public.products
  ADD CONSTRAINT products_seller_rate_check CHECK (
    seller_rate_bps BETWEEN 1000 AND 3000
  );
ALTER TABLE public.products
  ADD CONSTRAINT products_user_rate_check CHECK (
    user_rate_bps BETWEEN 0 AND 1000
  );
ALTER TABLE public.products
  ADD CONSTRAINT products_fee_check CHECK (
    fee_paise IS NULL OR fee_paise >= 0
  );

-- ------------------------------------------------------------------ agents

ALTER TABLE public.agents
  ADD COLUMN tier agent_tier NOT NULL DEFAULT 'SELLER',
  ADD COLUMN display_name text,
  ADD COLUMN source_product_id bigint REFERENCES public.products(id);

ALTER TABLE public.agents ALTER COLUMN district_id        DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN mobile             DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN occupation         DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN terms_version      DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN terms_accepted_at  DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN privacy_consent_at DROP NOT NULL;

-- Everything a seller application has always required stays required for a
-- seller. Only a USER-tier row may leave these empty.
ALTER TABLE public.agents
  ADD CONSTRAINT agents_seller_fields_check CHECK (
    tier <> 'SELLER'
    OR (
      district_id IS NOT NULL
      AND mobile IS NOT NULL
      AND occupation IS NOT NULL
      AND terms_version IS NOT NULL
      AND terms_accepted_at IS NOT NULL
      AND privacy_consent_at IS NOT NULL
    )
  );

-- A USER-tier referrer has no product to sell and no geography; it is only a
-- source product and a display name.
ALTER TABLE public.agents
  ADD CONSTRAINT agents_user_tier_check CHECK (
    tier <> 'USER'
    OR (source_product_id IS NOT NULL AND local_body_id IS NULL AND ward_id IS NULL)
  );

-- The two placement constraints from 0006 and 0007 assumed every row is a
-- seller. Re-stated with the tier guard; the ward one keeps NOT VALID for the
-- same reason it was NOT VALID before (pre-ward applications exist).
ALTER TABLE public.agents DROP CONSTRAINT agents_local_body_or_pending_check;
ALTER TABLE public.agents
  ADD CONSTRAINT agents_local_body_or_pending_check CHECK (
    tier = 'USER'
    OR (local_body_id IS NOT NULL AND pending_local_body_name IS NULL)
    OR (local_body_id IS NULL AND pending_local_body_name IS NOT NULL)
  );

ALTER TABLE public.agents DROP CONSTRAINT agents_ward_or_pending_check;
ALTER TABLE public.agents
  ADD CONSTRAINT agents_ward_or_pending_check CHECK (
    tier = 'USER'
    OR (local_body_id IS NOT NULL AND ward_id IS NOT NULL AND pending_ward_number IS NULL)
    OR (local_body_id IS NULL AND ward_id IS NULL AND pending_ward_number IS NOT NULL)
  ) NOT VALID;

CREATE INDEX agents_tier_idx ON public.agents (tier);
CREATE INDEX agents_source_product_idx ON public.agents (source_product_id);

-- ------------------------------------------------------------- customers
-- Customers are namespaced per product (`<slug>:<ref>`); the product id is
-- stored too so a service key can be scoped to its own product's rows.

ALTER TABLE public.customers
  ADD COLUMN product_id bigint REFERENCES public.products(id);
CREATE INDEX customers_product_idx ON public.customers (product_id);

-- ------------------------------------------------------------ commissions
-- A USER-tier referrer has no geography. The ledger row records the tier so
-- reports can split the two, and geography becomes optional for that tier
-- only — sellers still cannot earn without a placement.

ALTER TABLE public.commissions ADD COLUMN tier agent_tier;
ALTER TABLE public.commissions ALTER COLUMN district_id   DROP NOT NULL;
ALTER TABLE public.commissions ALTER COLUMN local_body_id DROP NOT NULL;

ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_geography_check CHECK (
    (tier IS NOT DISTINCT FROM 'USER')
    OR (district_id IS NOT NULL AND local_body_id IS NOT NULL)
  );

CREATE INDEX commissions_tier_idx ON public.commissions (tier);

-- ------------------------------------------------------- product_api_keys
-- Plaintext keys look like `ck_live_<32 chars>` (client, shipped inside an
-- app: low trust) or `sk_live_<32 chars>` (server). Only the SHA-256 hex of
-- the plaintext is stored; the plaintext is shown once at minting.

CREATE TABLE public.product_api_keys (
  id          bigserial PRIMARY KEY,
  product_id  bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('client', 'server')),
  key_hash    text NOT NULL UNIQUE,
  label       text NOT NULL,
  created_by  bigint REFERENCES public.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

CREATE INDEX product_api_keys_product_idx ON public.product_api_keys (product_id);

-- --------------------------------------------------------- diamond_awards
-- One diamond per friend who joins a FREE product through a USER-tier code.
-- The customer id is unique, so a friend can be counted once, ever.

CREATE TABLE public.diamond_awards (
  id          bigserial PRIMARY KEY,
  agent_id    bigint NOT NULL REFERENCES public.agents(id),
  product_id  bigint NOT NULL REFERENCES public.products(id),
  customer_id bigint NOT NULL UNIQUE REFERENCES public.customers(id),
  amount      integer NOT NULL DEFAULT 1 CHECK (amount > 0),
  awarded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX diamond_awards_agent_idx ON public.diamond_awards (agent_id);
CREATE INDEX diamond_awards_product_idx ON public.diamond_awards (product_id);

-- -------------------------------------------------------- referral_clicks
-- A counter behind the /r/<code> redirect. No user id, no full IP: the hash
-- is of the truncated prefix, and is only there to spot a click farm.

CREATE TABLE public.referral_clicks (
  id          bigserial PRIMARY KEY,
  code        text NOT NULL,
  product_id  bigint REFERENCES public.products(id),
  source      text,
  ip_hash     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX referral_clicks_code_idx ON public.referral_clicks (code);
CREATE INDEX referral_clicks_created_idx ON public.referral_clicks (created_at);

-- -------------------------------------------------------------- grants
-- 0002 set default privileges for future tables, but the default applies to
-- tables created by the role that ran 0002; stating the grants here makes the
-- migration correct regardless of which role applies it.

GRANT SELECT, INSERT, UPDATE ON public.product_api_keys TO calecute_app;
GRANT SELECT, INSERT ON public.diamond_awards TO calecute_app;
GRANT SELECT, INSERT ON public.referral_clicks TO calecute_app;
GRANT USAGE, SELECT ON SEQUENCE public.product_api_keys_id_seq TO calecute_app;
GRANT USAGE, SELECT ON SEQUENCE public.diamond_awards_id_seq TO calecute_app;
GRANT USAGE, SELECT ON SEQUENCE public.referral_clicks_id_seq TO calecute_app;

-- ----------------------------------------------------------- RLS helpers

-- A product app calling with its API key. `app.product_id` is set alongside
-- `app.role` by the service route wrapper and is empty for everyone else.
CREATE OR REPLACE FUNCTION app.is_service() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT app.current_role() = 'SERVICE';
$$;

CREATE OR REPLACE FUNCTION app.current_product_id() RETURNS bigint
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.product_id', true), '')::bigint;
$$;

-- The product a payment belongs to, read without policies so a policy on
-- commissions can refer to payments without recursing through payments_scope
-- (which itself refers to commissions).
CREATE OR REPLACE FUNCTION app.payment_product_id(p_payment_id bigint) RETURNS bigint
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT p.product_id FROM public.payments p WHERE p.id = p_payment_id;
$$;

-- The referral lookups a product system needs, without a SELECT grant on
-- seller rows. A seller's agent row carries a mobile number and an
-- occupation; a service key must be able to attribute a customer to a seller
-- code without reading either. These return exactly the columns the claim
-- and payment endpoints use and nothing else.
CREATE OR REPLACE FUNCTION app.agent_for_referral(p_code text, p_id bigint)
  RETURNS TABLE (
    id bigint, agent_code text, status text, tier text,
    district_id bigint, local_body_id bigint, user_id bigint,
    user_external_ref text, first_sale_at timestamptz
  )
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT a.id, a.agent_code, a.status::text, a.tier::text,
           a.district_id, a.local_body_id, a.user_id,
           u.external_ref, a.first_sale_at
      FROM public.agents a
      JOIN public.users u ON u.id = a.user_id
     WHERE (p_code IS NOT NULL AND a.agent_code = p_code)
        OR (p_id IS NOT NULL AND a.id = p_id)
     LIMIT 1;
$$;

-- Stamping the first sale on a seller row from a service request, which has
-- no UPDATE on seller rows. Sets the column once and never moves it.
CREATE OR REPLACE FUNCTION app.stamp_first_sale(p_agent_id bigint, p_paid_at timestamptz)
  RETURNS void
  LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    UPDATE public.agents
       SET first_sale_at = p_paid_at, updated_at = now()
     WHERE id = p_agent_id AND first_sale_at IS NULL;
$$;

-- Aggregates for one referrer across every product. Counts and sums only;
-- a service key reading its member's stats learns nothing about who the
-- friends are.
CREATE OR REPLACE FUNCTION app.referrer_stats(p_agent_id bigint)
  RETURNS TABLE (
    friends_joined integer, paying_friends integer, diamonds integer,
    pending_paise bigint, paid_paise bigint, lifetime_paise bigint
  )
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT
      (SELECT count(*)::int FROM public.attributions at
        WHERE at.agent_id = p_agent_id),
      (SELECT count(*)::int FROM public.attributions at
         JOIN public.customers c ON c.id = at.customer_id
        WHERE at.agent_id = p_agent_id AND c.status = 'ACTIVE'),
      (SELECT COALESCE(sum(d.amount), 0)::int FROM public.diamond_awards d
        WHERE d.agent_id = p_agent_id),
      (SELECT COALESCE(sum(net_commission_paise), 0)::bigint FROM public.commissions
        WHERE agent_id = p_agent_id AND status IN ('ACCRUED', 'APPROVED')),
      (SELECT COALESCE(sum(net_commission_paise), 0)::bigint FROM public.commissions
        WHERE agent_id = p_agent_id AND status = 'PAID'),
      (SELECT COALESCE(sum(net_commission_paise), 0)::bigint FROM public.commissions
        WHERE agent_id = p_agent_id AND status NOT IN ('CANCELLED', 'FORFEITED'));
$$;

-- The public leaderboard. SECURITY DEFINER for the same reason as the slot
-- counts in 0003: an anonymous visitor may see no agent row at all, and the
-- page must still be true. Nothing identifying crosses the boundary — the
-- name is masked to first name plus last initial before it leaves the
-- function, and no id, code, email or mobile is returned.
--
-- p_product_slug NULL means every product. Earnings count net commission that
-- was not cancelled or forfeited. A referrer appears once they have at least
-- one friend, diamond or paisa.
CREATE OR REPLACE FUNCTION app.public_leaderboard(p_product_slug text, lim integer)
  RETURNS TABLE (
    rank integer, display_name text, tier text, diamonds integer,
    friends_joined integer, paying_friends integer, earned_net_paise bigint
  )
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    WITH prod AS (
      SELECT p.id FROM public.products p WHERE p.slug = p_product_slug
    ),
    friends AS (
      SELECT at.agent_id,
             count(*)::int AS joined,
             count(*) FILTER (WHERE c.status = 'ACTIVE')::int AS paying
        FROM public.attributions at
        JOIN public.customers c ON c.id = at.customer_id
       WHERE p_product_slug IS NULL OR c.product_id = (SELECT id FROM prod)
       GROUP BY at.agent_id
    ),
    gems AS (
      SELECT d.agent_id, sum(d.amount)::int AS diamonds
        FROM public.diamond_awards d
       WHERE p_product_slug IS NULL OR d.product_id = (SELECT id FROM prod)
       GROUP BY d.agent_id
    ),
    earned AS (
      SELECT cm.agent_id, sum(cm.net_commission_paise)::bigint AS net
        FROM public.commissions cm
        JOIN public.payments p ON p.id = cm.payment_id
       WHERE cm.status NOT IN ('CANCELLED', 'FORFEITED')
         AND (p_product_slug IS NULL OR p.product_id = (SELECT id FROM prod))
       GROUP BY cm.agent_id
    ),
    named AS (
      SELECT a.id,
             a.tier::text AS tier,
             regexp_split_to_array(
               btrim(COALESCE(NULLIF(btrim(a.display_name), ''), u.name, 'Member')),
               '\s+'
             ) AS parts,
             COALESCE(f.joined, 0) AS joined,
             COALESCE(f.paying, 0) AS paying,
             COALESCE(g.diamonds, 0) AS diamonds,
             COALESCE(e.net, 0)::bigint AS net
        FROM public.agents a
        JOIN public.users u ON u.id = a.user_id
        LEFT JOIN friends f ON f.agent_id = a.id
        LEFT JOIN gems g ON g.agent_id = a.id
        LEFT JOIN earned e ON e.agent_id = a.id
       WHERE a.status = 'APPROVED'
         AND u.status = 'ACTIVE'
         AND (COALESCE(f.joined, 0) > 0 OR COALESCE(g.diamonds, 0) > 0 OR COALESCE(e.net, 0) > 0)
    )
    SELECT
      (row_number() OVER (ORDER BY n.net DESC, n.diamonds DESC, n.joined DESC, n.id))::int AS rank,
      CASE
        WHEN array_length(n.parts, 1) > 1
          THEN n.parts[1] || ' ' || upper(left(n.parts[array_length(n.parts, 1)], 1)) || '.'
        ELSE n.parts[1]
      END AS display_name,
      n.tier,
      n.diamonds,
      n.joined AS friends_joined,
      n.paying AS paying_friends,
      n.net AS earned_net_paise
    FROM named n
    ORDER BY n.net DESC, n.diamonds DESC, n.joined DESC, n.id
    LIMIT LEAST(GREATEST(COALESCE(lim, 50), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION app.is_service() TO calecute_app;
GRANT EXECUTE ON FUNCTION app.current_product_id() TO calecute_app;
GRANT EXECUTE ON FUNCTION app.payment_product_id(bigint) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.agent_for_referral(text, bigint) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.stamp_first_sale(bigint, timestamptz) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.referrer_stats(bigint) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.public_leaderboard(text, integer) TO calecute_app;

-- ---------------------------------------------------------- RLS policies
-- Every policy that gated product-system writes on SUPER_ADMIN now also
-- admits SERVICE, scoped to the key's own product wherever the row knows its
-- product. Policies are DROPped and re-CREATEd rather than ALTERed so the
-- full predicate is readable here.

-- users: a service key sees, creates and updates only product users
-- (external_ref set), and only as AGENT. Google users stay invisible to it.
DROP POLICY IF EXISTS users_self_read ON public.users;
CREATE POLICY users_self_read ON public.users FOR SELECT
  USING (
    id = app.current_user_id()
    OR app.is_super_admin()
    OR (app.is_service() AND public.users.external_ref IS NOT NULL)
    OR (
      app.current_role() = 'DISTRICT_ADMIN'
      AND EXISTS (
        SELECT 1 FROM public.agents a
         WHERE a.user_id = public.users.id
           AND app.can_see_district(a.district_id)
      )
    )
  );

DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE
  USING (
    id = app.current_user_id()
    OR app.is_super_admin()
    OR (app.is_service() AND public.users.external_ref IS NOT NULL)
  )
  WITH CHECK (
    id = app.current_user_id()
    OR app.is_super_admin()
    OR (app.is_service() AND public.users.external_ref IS NOT NULL AND role = 'AGENT')
  );

DROP POLICY IF EXISTS users_super_insert ON public.users;
CREATE POLICY users_super_insert ON public.users FOR INSERT
  WITH CHECK (
    app.is_super_admin()
    OR (
      app.is_service()
      AND public.users.external_ref IS NOT NULL
      AND public.users.google_sub IS NULL
      AND role = 'AGENT'
    )
  );

-- agents: a service key handles only USER-tier rows it created itself.
-- Seller rows are reached through app.agent_for_referral(), never selected.
DROP POLICY IF EXISTS agents_self_read ON public.agents;
CREATE POLICY agents_self_read ON public.agents FOR SELECT
  USING (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
    OR (
      app.is_service()
      AND tier = 'USER'
      AND source_product_id = app.current_product_id()
    )
  );

DROP POLICY IF EXISTS agents_self_insert ON public.agents;
CREATE POLICY agents_self_insert ON public.agents FOR INSERT
  WITH CHECK (
    user_id = app.current_user_id()
    OR (
      app.is_service()
      AND tier = 'USER'
      AND status = 'APPROVED'
      AND source_product_id = app.current_product_id()
    )
  );

DROP POLICY IF EXISTS agents_update ON public.agents;
CREATE POLICY agents_update ON public.agents FOR UPDATE
  USING (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
    OR (
      app.is_service()
      AND tier = 'USER'
      AND source_product_id = app.current_product_id()
    )
  )
  WITH CHECK (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
    OR (
      app.is_service()
      AND tier = 'USER'
      AND source_product_id = app.current_product_id()
    )
  );

-- customers: scoped to the key's product.
DROP POLICY IF EXISTS customers_scope ON public.customers;
CREATE POLICY customers_scope ON public.customers FOR SELECT
  USING (
    app.is_super_admin()
    OR app.can_see_district(public.customers.district_id)
    OR (app.is_service() AND public.customers.product_id = app.current_product_id())
    OR EXISTS (
      SELECT 1 FROM public.attributions att
       WHERE att.customer_id = public.customers.id
         AND att.agent_id = app.current_agent_id()
    )
  );

DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert ON public.customers FOR INSERT
  WITH CHECK (
    app.is_super_admin()
    OR (app.is_service() AND public.customers.product_id = app.current_product_id())
  );

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update ON public.customers FOR UPDATE
  USING (
    app.is_super_admin()
    OR (app.is_service() AND public.customers.product_id = app.current_product_id())
  )
  WITH CHECK (
    app.is_super_admin()
    OR (app.is_service() AND public.customers.product_id = app.current_product_id())
  );

-- attributions: an attribution row holds only ids and a code. Not scoped by
-- product through customers, because customers_scope already refers to
-- attributions and Postgres refuses mutually recursive policies.
DROP POLICY IF EXISTS attributions_scope ON public.attributions;
CREATE POLICY attributions_scope ON public.attributions FOR SELECT
  USING (
    agent_id = app.current_agent_id()
    OR app.is_super_admin()
    OR app.is_service()
    OR EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND app.can_see_district(a.district_id)
    )
  );

DROP POLICY IF EXISTS attributions_insert ON public.attributions;
CREATE POLICY attributions_insert ON public.attributions FOR INSERT
  WITH CHECK (app.is_super_admin() OR app.is_service());

DROP POLICY IF EXISTS attribution_attempts_insert ON public.attribution_attempts;
CREATE POLICY attribution_attempts_insert ON public.attribution_attempts FOR INSERT
  WITH CHECK (app.is_super_admin() OR app.is_service());

-- payments: a service key writes and reads back its own product's payments.
--
-- CASE rather than OR, deliberately. payments_scope looks at commissions and
-- commissions_scope (below) looks at payments through app.payment_product_id;
-- SQL does not promise short-circuit evaluation of OR, so a SERVICE request
-- could otherwise bounce between the two policies until the stack ran out.
-- CASE does promise its order: the service branch never touches commissions
-- and the user branch never calls the function.
DROP POLICY IF EXISTS payments_scope ON public.payments;
CREATE POLICY payments_scope ON public.payments FOR SELECT
  USING (
    CASE
      WHEN app.is_super_admin() THEN true
      WHEN app.is_service() THEN public.payments.product_id = app.current_product_id()
      ELSE EXISTS (
        SELECT 1 FROM public.commissions c
         WHERE c.payment_id = public.payments.id
           AND (
             c.agent_id = app.current_agent_id()
             OR app.can_see_district(c.district_id)
           )
      )
    END
  );

DROP POLICY IF EXISTS payments_insert ON public.payments;
CREATE POLICY payments_insert ON public.payments FOR INSERT
  WITH CHECK (
    app.is_super_admin()
    OR (app.is_service() AND public.payments.product_id = app.current_product_id())
  );

-- commissions: the service may insert and read back rows for its own
-- product's payments. It still cannot approve, pay or cancel anything —
-- those stay with the admin roles through commissions_admin_write.
DROP POLICY IF EXISTS commissions_scope ON public.commissions;
CREATE POLICY commissions_scope ON public.commissions FOR SELECT
  USING (
    CASE
      WHEN app.is_super_admin() THEN true
      WHEN app.is_service()
        THEN app.payment_product_id(public.commissions.payment_id) = app.current_product_id()
      ELSE agent_id = app.current_agent_id() OR app.can_see_district(district_id)
    END
  );

CREATE POLICY commissions_service_insert ON public.commissions FOR INSERT
  WITH CHECK (
    app.is_service()
    AND app.payment_product_id(public.commissions.payment_id) = app.current_product_id()
  );

-- product_api_keys: super admins only. The service route looks a key up on
-- the owner connection before any role is set, so no policy admits SERVICE.
ALTER TABLE public.product_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_api_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY product_api_keys_super ON public.product_api_keys FOR ALL
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- diamond_awards: an agent sees their own; a service key sees and writes its
-- own product's.
ALTER TABLE public.diamond_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_awards FORCE ROW LEVEL SECURITY;

CREATE POLICY diamond_awards_read ON public.diamond_awards FOR SELECT
  USING (
    agent_id = app.current_agent_id()
    OR app.is_admin()
    OR (app.is_service() AND public.diamond_awards.product_id = app.current_product_id())
  );

CREATE POLICY diamond_awards_insert ON public.diamond_awards FOR INSERT
  WITH CHECK (
    app.is_super_admin()
    OR (app.is_service() AND public.diamond_awards.product_id = app.current_product_id())
  );

-- referral_clicks: written by the anonymous redirect, read by admins.
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY referral_clicks_insert ON public.referral_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY referral_clicks_read ON public.referral_clicks FOR SELECT
  USING (app.is_admin());
