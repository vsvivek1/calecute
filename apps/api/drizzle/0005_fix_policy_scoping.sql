-- Correcting three policies whose subqueries referenced the wrong table.
--
-- The mistake
-- ----------
-- Inside a policy, an unqualified column name in a subquery resolves against
-- the INNERMOST table first, not against the table the policy protects. Writing
--
--   EXISTS (SELECT 1 FROM agent_products ap WHERE ap.product_id = product_id)
--
-- does not compare against product_assets.product_id. Postgres binds the
-- right-hand side to ap.product_id, producing `ap.product_id = ap.product_id` —
-- always true. Confirmed by reading pg_policy.polqual back:
--
--   product_assets_read -> ap.product_id = ap.product_id   (always true)
--   customers_scope     -> at.customer_id = at.id          (nonsense)
--   payments_scope      -> c.payment_id = c.id             (nonsense)
--
-- Consequences: `product_assets_read` let any agent holding any assignment read
-- every product's sales material, and the two nonsense comparisons hid an
-- agent's own customers and payments from them, which is how this was noticed —
-- the earnings ledger came back empty while the totals were right.
--
-- The fix is to qualify every outer reference with its table name. The other
-- policies in 0001_rls.sql compare against columns that do not exist on the
-- inner table (`a.id = agent_id`, where `agents` has no `agent_id`), so they
-- bound to the outer table as intended and are left alone.

DROP POLICY IF EXISTS product_assets_read ON public.product_assets;
CREATE POLICY product_assets_read ON public.product_assets FOR SELECT
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.agent_products ap
       WHERE ap.product_id = public.product_assets.product_id
         AND ap.agent_id = app.current_agent_id()
    )
  );

DROP POLICY IF EXISTS customers_scope ON public.customers;
CREATE POLICY customers_scope ON public.customers FOR SELECT
  USING (
    app.is_super_admin()
    OR app.can_see_district(public.customers.district_id)
    OR EXISTS (
      SELECT 1 FROM public.attributions att
       WHERE att.customer_id = public.customers.id
         AND att.agent_id = app.current_agent_id()
    )
  );

DROP POLICY IF EXISTS payments_scope ON public.payments;
CREATE POLICY payments_scope ON public.payments FOR SELECT
  USING (
    app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.commissions c
       WHERE c.payment_id = public.payments.id
         AND (
           c.agent_id = app.current_agent_id()
           OR app.can_see_district(c.district_id)
         )
    )
  );

-- agent_messages_read bound correctly only because agent_message_recipients has
-- no `id` column. Qualified anyway, so adding one later cannot silently break it.
DROP POLICY IF EXISTS agent_messages_read ON public.agent_messages;
CREATE POLICY agent_messages_read ON public.agent_messages FOR SELECT
  USING (
    app.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.agent_message_recipients r
       WHERE r.message_id = public.agent_messages.id
         AND r.agent_id = app.current_agent_id()
    )
  );
