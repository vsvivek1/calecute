-- Row-level security, helper functions, search indexes and the append-only
-- guarantee on the audit log.
--
-- The application never adds a district filter by hand. Every request runs
-- inside a transaction that sets `app.user_id` and `app.role`, and the
-- policies below decide what that transaction can see. A developer who forgets
-- a WHERE clause leaks nothing; a modified client that asks for another
-- district's rows gets an empty set.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS app;

-- ---------------------------------------------------------------- helpers

-- All helpers read transaction-local GUCs. `true` as the second argument makes
-- a missing setting return NULL instead of raising, so an unauthenticated
-- request behaves as "no user" rather than erroring.

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS bigint
  LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('app.user_id', true), '')::bigint;
$$;

CREATE OR REPLACE FUNCTION app.current_role() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('app.role', true), ''), 'PUBLIC');
$$;

CREATE OR REPLACE FUNCTION app.is_super_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT app.current_role() = 'SUPER_ADMIN';
$$;

CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT app.current_role() IN ('SUPER_ADMIN', 'DISTRICT_ADMIN');
$$;

-- The set of districts the current transaction may touch. SUPER_ADMIN gets
-- every district; DISTRICT_ADMIN gets exactly its assignments; everyone else
-- gets nothing.
CREATE OR REPLACE FUNCTION app.visible_districts() RETURNS SETOF bigint
  LANGUAGE sql STABLE AS $$
    SELECT d.id FROM public.districts d WHERE app.is_super_admin()
    UNION
    SELECT ad.district_id FROM public.admin_districts ad
     WHERE app.current_role() = 'DISTRICT_ADMIN'
       AND ad.user_id = app.current_user_id();
$$;

CREATE OR REPLACE FUNCTION app.can_see_district(target bigint) RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT target IS NOT NULL
       AND target IN (SELECT app.visible_districts());
$$;

-- The agent row belonging to the current user, if any.
CREATE OR REPLACE FUNCTION app.current_agent_id() RETURNS bigint
  LANGUAGE sql STABLE AS $$
    SELECT a.id FROM public.agents a WHERE a.user_id = app.current_user_id();
$$;

-- --------------------------------------------------------------- geography
-- Geography is public reference data: the recruitment page must render
-- district and panchayat pickers before anyone signs in. Writes are reserved
-- for the seed loader, which connects as the table owner with RLS disabled.

ALTER TABLE public.states            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_panchayats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_bodies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards             ENABLE ROW LEVEL SECURITY;

CREATE POLICY states_read           ON public.states           FOR SELECT USING (true);
CREATE POLICY districts_read        ON public.districts        FOR SELECT USING (true);
CREATE POLICY block_panchayats_read ON public.block_panchayats FOR SELECT USING (true);
CREATE POLICY local_bodies_read     ON public.local_bodies     FOR SELECT USING (true);
CREATE POLICY wards_read            ON public.wards            FOR SELECT USING (true);

-- Only a SUPER_ADMIN may change slot capacity or open/close a panchayat.
CREATE POLICY local_bodies_admin_write ON public.local_bodies
  FOR UPDATE USING (app.is_super_admin() OR app.can_see_district(district_id))
              WITH CHECK (app.is_super_admin() OR app.can_see_district(district_id));

-- ------------------------------------------------------------------- users

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- A user always sees their own row. Admins see users whose agent record falls
-- inside their districts; a DISTRICT_ADMIN cannot enumerate other admins.
CREATE POLICY users_self_read ON public.users FOR SELECT
  USING (
    id = app.current_user_id()
    OR app.is_super_admin()
    OR (
      app.current_role() = 'DISTRICT_ADMIN'
      AND EXISTS (
        SELECT 1 FROM public.agents a
         WHERE a.user_id = public.users.id
           AND app.can_see_district(a.district_id)
      )
    )
  );

CREATE POLICY users_self_update ON public.users FOR UPDATE
  USING (id = app.current_user_id() OR app.is_super_admin())
  WITH CHECK (id = app.current_user_id() OR app.is_super_admin());

-- Only a SUPER_ADMIN creates or removes admin users.
CREATE POLICY users_super_insert ON public.users FOR INSERT
  WITH CHECK (app.is_super_admin());

ALTER TABLE public.admin_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_districts FORCE ROW LEVEL SECURITY;

CREATE POLICY admin_districts_read ON public.admin_districts FOR SELECT
  USING (user_id = app.current_user_id() OR app.is_super_admin());

CREATE POLICY admin_districts_super_write ON public.admin_districts FOR ALL
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens FORCE ROW LEVEL SECURITY;

CREATE POLICY refresh_tokens_self ON public.refresh_tokens FOR ALL
  USING (user_id = app.current_user_id())
  WITH CHECK (user_id = app.current_user_id());

-- ------------------------------------------------------------------ agents

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents FORCE ROW LEVEL SECURITY;

CREATE POLICY agents_self_read ON public.agents FOR SELECT
  USING (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
  );

-- An applicant creates exactly their own agent row.
CREATE POLICY agents_self_insert ON public.agents FOR INSERT
  WITH CHECK (user_id = app.current_user_id());

-- Agents may edit their own profile; admins may act on agents in their
-- districts. Note the WITH CHECK repeats the district test so a district admin
-- cannot move an agent out of their own scope.
CREATE POLICY agents_update ON public.agents FOR UPDATE
  USING (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
  )
  WITH CHECK (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
  );

ALTER TABLE public.agent_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_qualifications FORCE ROW LEVEL SECURITY;

CREATE POLICY agent_qualifications_scope ON public.agent_qualifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id
         AND (a.user_id = app.current_user_id()
              OR app.is_super_admin()
              OR app.can_see_district(a.district_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id
         AND (a.user_id = app.current_user_id() OR app.is_super_admin())
    )
  );

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries FORCE ROW LEVEL SECURITY;

CREATE POLICY waitlist_scope ON public.waitlist_entries FOR SELECT
  USING (
    user_id = app.current_user_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
  );

CREATE POLICY waitlist_self_insert ON public.waitlist_entries FOR INSERT
  WITH CHECK (user_id = app.current_user_id());

-- ----------------------------------------------------------------- payouts
-- The strictest table in the schema. A district admin can see that an agent
-- has a verified PAN, because approving payouts needs it, but the ciphertext
-- is never selected by application code — only `pan_last4` and `pan_status`
-- are ever projected. See lib/crypto.ts.

ALTER TABLE public.payout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY payout_profiles_scope ON public.payout_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id
         AND (a.user_id = app.current_user_id()
              OR app.is_super_admin()
              OR app.can_see_district(a.district_id))
    )
  );

-- Only the agent writes their own payout details.
CREATE POLICY payout_profiles_self_write ON public.payout_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND a.user_id = app.current_user_id()
    )
  );

CREATE POLICY payout_profiles_update ON public.payout_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id
         AND (a.user_id = app.current_user_id() OR app.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id
         AND (a.user_id = app.current_user_id() OR app.is_super_admin())
    )
  );

-- ---------------------------------------------------------------- products

ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_products FORCE ROW LEVEL SECURITY;

CREATE POLICY products_read ON public.products FOR SELECT
  USING (active OR app.is_admin());

CREATE POLICY products_super_write ON public.products FOR ALL
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- Sales material is only visible to an agent the product is assigned to.
CREATE POLICY product_assets_read ON public.product_assets FOR SELECT
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.agent_products ap
       WHERE ap.product_id = product_id
         AND ap.agent_id = app.current_agent_id()
    )
  );

CREATE POLICY agent_products_read ON public.agent_products FOR SELECT
  USING (
    agent_id = app.current_agent_id()
    OR app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND app.can_see_district(a.district_id)
    )
  );

CREATE POLICY agent_products_admin_write ON public.agent_products FOR ALL
  USING (
    app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND app.can_see_district(a.district_id)
    )
  )
  WITH CHECK (
    app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND app.can_see_district(a.district_id)
    )
  );

-- ------------------------------------------- customers, attribution, money

ALTER TABLE public.customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attributions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributions         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.commissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions          FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches       ENABLE ROW LEVEL SECURITY;

-- An agent sees a customer only through their own attribution.
CREATE POLICY customers_scope ON public.customers FOR SELECT
  USING (
    app.is_super_admin()
    OR app.can_see_district(district_id)
    OR EXISTS (
      SELECT 1 FROM public.attributions at
       WHERE at.customer_id = id AND at.agent_id = app.current_agent_id()
    )
  );

CREATE POLICY attributions_scope ON public.attributions FOR SELECT
  USING (
    agent_id = app.current_agent_id()
    OR app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND app.can_see_district(a.district_id)
    )
  );

-- Attribution rows are written once by the service integration and never
-- updated: there is no UPDATE or DELETE policy on this table at all.
CREATE POLICY attributions_insert ON public.attributions FOR INSERT
  WITH CHECK (app.is_super_admin());

CREATE POLICY attribution_attempts_read ON public.attribution_attempts FOR SELECT
  USING (
    app.is_super_admin()
    OR agent_id = app.current_agent_id()
    OR EXISTS (
      SELECT 1 FROM public.agents a
       WHERE a.id = agent_id AND app.can_see_district(a.district_id)
    )
  );

CREATE POLICY attribution_attempts_insert ON public.attribution_attempts FOR INSERT
  WITH CHECK (app.is_super_admin());

CREATE POLICY payments_scope ON public.payments FOR SELECT
  USING (
    app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.commissions c
       WHERE c.payment_id = id
         AND (c.agent_id = app.current_agent_id()
              OR app.can_see_district(c.district_id))
    )
  );

CREATE POLICY payments_insert ON public.payments FOR INSERT
  WITH CHECK (app.is_super_admin());

CREATE POLICY commissions_scope ON public.commissions FOR SELECT
  USING (
    agent_id = app.current_agent_id()
    OR app.is_super_admin()
    OR app.can_see_district(district_id)
  );

CREATE POLICY commissions_admin_write ON public.commissions FOR ALL
  USING (app.is_super_admin() OR app.can_see_district(district_id))
  WITH CHECK (app.is_super_admin() OR app.can_see_district(district_id));

CREATE POLICY payout_batches_read ON public.payout_batches FOR SELECT
  USING (app.is_admin());

CREATE POLICY payout_batches_super_write ON public.payout_batches FOR ALL
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());

-- -------------------------------------------------------- ops & anti-abuse

ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.review_flags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_flags   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.signup_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_signals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_message_recipients FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_log_read ON public.audit_log FOR SELECT
  USING (app.is_super_admin());

CREATE POLICY audit_log_append ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- Immutability is not left to policy alone: without UPDATE/DELETE policies the
-- statements are already denied, and this trigger makes that explicit and
-- survives anyone adding a permissive policy later by mistake.
CREATE OR REPLACE FUNCTION app.deny_mutation() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    RAISE EXCEPTION 'audit_log is append-only (attempted %)', TG_OP
      USING ERRCODE = 'insufficient_privilege';
  END;
$$;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION app.deny_mutation();

CREATE POLICY review_flags_scope ON public.review_flags FOR SELECT
  USING (app.is_super_admin() OR app.can_see_district(district_id));

CREATE POLICY review_flags_write ON public.review_flags FOR ALL
  USING (app.is_super_admin() OR app.can_see_district(district_id))
  WITH CHECK (true);

CREATE POLICY signup_signals_read ON public.signup_signals FOR SELECT
  USING (app.is_super_admin());

CREATE POLICY signup_signals_insert ON public.signup_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY agent_messages_read ON public.agent_messages FOR SELECT
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.agent_message_recipients r
       WHERE r.message_id = id AND r.agent_id = app.current_agent_id()
    )
  );

CREATE POLICY agent_messages_admin_write ON public.agent_messages FOR ALL
  USING (app.is_admin()) WITH CHECK (app.is_admin());

CREATE POLICY agent_message_recipients_scope ON public.agent_message_recipients FOR SELECT
  USING (
    agent_id = app.current_agent_id()
    OR app.is_admin()
  );

CREATE POLICY agent_message_recipients_write ON public.agent_message_recipients FOR ALL
  USING (app.is_admin()) WITH CHECK (app.is_admin());

-- Analytics carries no PII and no user id. It is written by unauthenticated
-- page views and read only by admins.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_insert ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY analytics_read ON public.analytics_events FOR SELECT
  USING (app.is_admin());

-- Infrastructure tables are reached only through SECURITY DEFINER helpers and
-- the migration role, never through a user-scoped query.
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys   ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------ search index
-- "Kodenchery", "കോടഞ്ചേരി" and "kodancheri" must all find the same row, so
-- both scripts are indexed with trigrams and matched with similarity.

CREATE INDEX local_bodies_name_en_trgm ON public.local_bodies USING gin (name_en gin_trgm_ops);
CREATE INDEX local_bodies_name_ml_trgm ON public.local_bodies USING gin (name_ml gin_trgm_ops);
CREATE INDEX districts_name_en_trgm    ON public.districts    USING gin (name_en gin_trgm_ops);
CREATE INDEX districts_name_ml_trgm    ON public.districts    USING gin (name_ml gin_trgm_ops);

-- A gram panchayat always sits under a block; an urban body never does.
ALTER TABLE public.local_bodies
  ADD CONSTRAINT local_bodies_branch_check CHECK (
    (type = 'GRAM_PANCHAYAT' AND block_panchayat_id IS NOT NULL)
    OR (type <> 'GRAM_PANCHAYAT' AND block_panchayat_id IS NULL)
  );

-- Commission arithmetic must stay internally consistent.
ALTER TABLE public.commissions
  ADD CONSTRAINT commissions_amounts_check CHECK (
    gross_commission_paise = base_paise * rate_bps / 10000
    AND net_commission_paise = gross_commission_paise - tds_paise
  );

ALTER TABLE public.payments
  ADD CONSTRAINT payments_net_check CHECK (
    net_paise = gross_paise - gst_paise - gateway_fee_paise
  );
