-- Missing write policies on `customers`.
--
-- `customers` had a SELECT policy and nothing else, so the attribution endpoint
-- could not create a customer record and the whole referral path failed with a
-- 500. Caught by scripts/smoke.mjs.
--
-- Writes here come from a product system authenticating with a service
-- credential, never from a browser, so SUPER_ADMIN is the correct gate — the
-- same one already used for payments and attributions.

CREATE POLICY customers_insert ON public.customers FOR INSERT
  WITH CHECK (app.is_super_admin());

-- Status moves LEAD -> ACTIVE when a payment arrives.
CREATE POLICY customers_update ON public.customers FOR UPDATE
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());
