-- A dedicated application role, and the guarantee that every request uses it.
--
-- Why this migration exists
-- ------------------------
-- Row-level security is bypassed entirely by superusers, and by the table owner
-- unless FORCE is set. That makes "are the policies actually enforced?" depend
-- on which role the connection string happens to carry — which is exactly the
-- kind of implicit assumption the whole RLS design exists to avoid.
--
-- So: a role that is neither superuser nor owner, holds only DML grants, and
-- has no BYPASSRLS attribute. `withRls` issues SET LOCAL ROLE to it at the
-- start of every transaction, so even a misconfigured DATABASE_URL pointing at
-- an over-privileged role still executes requests under policy.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'calecute_app') THEN
    -- NOLOGIN: nothing connects as this role directly. It is only ever reached
    -- through SET LOCAL ROLE from the connecting role, so it needs no password.
    CREATE ROLE calecute_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

-- The connecting role must be a member of calecute_app to SET ROLE to it.
DO $$
BEGIN
  EXECUTE format('GRANT calecute_app TO %I', current_user);
EXCEPTION WHEN duplicate_object OR invalid_grant_operation THEN
  NULL;
END
$$;

GRANT USAGE ON SCHEMA public, app TO calecute_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO calecute_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO calecute_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO calecute_app;

-- Future tables created by later migrations get the same grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO calecute_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO calecute_app;

-- The audit log is append-only for the application role. The trigger already
-- rejects UPDATE and DELETE, but revoking the privilege means the attempt is
-- refused before it reaches the trigger at all.
REVOKE UPDATE, DELETE ON public.audit_log FROM calecute_app;

-- Geography is reference data loaded by the seed script, which runs as the
-- owner. The application may read it and must never write it.
REVOKE INSERT, UPDATE, DELETE ON
  public.states, public.districts, public.block_panchayats, public.wards
  FROM calecute_app;
-- local_bodies keeps UPDATE: admins change slot capacity and open/close signups.
REVOKE INSERT, DELETE ON public.local_bodies FROM calecute_app;

-- ------------------------------------------------------- helper hardening
--
-- The policy helpers read tables that themselves carry policies. They are made
-- SECURITY DEFINER so a policy evaluation cannot recurse into another policy,
-- and given a fixed search_path so the classic SECURITY DEFINER hijack (a
-- caller-controlled schema shadowing `public`) does not apply.

CREATE OR REPLACE FUNCTION app.visible_districts() RETURNS SETOF bigint
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT d.id FROM public.districts d WHERE app.is_super_admin()
    UNION
    SELECT ad.district_id FROM public.admin_districts ad
     WHERE app.current_role() = 'DISTRICT_ADMIN'
       AND ad.user_id = app.current_user_id();
$$;

CREATE OR REPLACE FUNCTION app.current_agent_id() RETURNS bigint
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT a.id FROM public.agents a WHERE a.user_id = app.current_user_id();
$$;

-- ------------------------------------------------ infrastructure tables
--
-- rate_limit_buckets and idempotency_keys had RLS enabled with no policies,
-- which denies everything to a non-superuser role — it would have silently
-- disabled rate limiting and idempotent retries in production.
--
-- They are deliberately taken out of RLS instead of being given policies.
-- Neither models tenant data: a bucket is a counter keyed by a hashed
-- identifier, and an idempotency row is reachable only by an exact,
-- client-supplied, unguessable key. They are also written from outside the
-- request transaction on purpose, so that a rate-limit increment is not rolled
-- back by the failing request it was counting.

ALTER TABLE public.rate_limit_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys   DISABLE ROW LEVEL SECURITY;

-- Analytics events are written by anonymous page views before any role exists.
GRANT INSERT ON public.analytics_events TO calecute_app;
