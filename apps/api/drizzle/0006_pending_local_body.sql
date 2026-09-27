-- A temporary route in for applicants whose local body is not yet seeded.
--
-- Why this exists
-- ---------------
-- The LGD PRI export covers panchayats only, so all 941 gram panchayats are
-- loaded but the 87 municipalities and 6 corporations are not. Anyone living in
-- a town therefore cannot complete signup at all — the picker has no entry for
-- them and the API rejects an id that is not seeded.
--
-- Rather than invent placeholder geography rows, an applicant may type the name
-- of their municipality or corporation. The application is accepted, marked as
-- unplaced, and an administrator maps it to a real local body once the urban
-- export is loaded.
--
-- THIS IS TEMPORARY. When docs/GEOGRAPHY.md is finished, the text box comes out
-- of the form and the remaining unplaced applications get mapped. The column
-- stays, because by then it holds what people actually typed.
--
-- What the nullable local_body_id costs, stated plainly: an unplaced agent
-- occupies no slot, appears in no coverage report, and cannot be attributed a
-- customer until they are placed. That is the correct behaviour — they are not
-- yet anywhere — but it means unplaced applications must be worked through, not
-- left. app.unplaced_agent_count() and the admin report exist for that.

ALTER TABLE public.agents
  ALTER COLUMN local_body_id DROP NOT NULL;

ALTER TABLE public.agents
  ADD COLUMN pending_local_body_name text;

-- Exactly one of the two must be present: a placed agent has an id, an unplaced
-- one has the name they typed. Neither, or both, is a bug.
ALTER TABLE public.agents
  ADD CONSTRAINT agents_local_body_or_pending_check CHECK (
    (local_body_id IS NOT NULL AND pending_local_body_name IS NULL)
    OR (local_body_id IS NULL AND pending_local_body_name IS NOT NULL)
  );

CREATE INDEX agents_pending_local_body_idx
  ON public.agents (district_id)
  WHERE local_body_id IS NULL;

-- Commissions still require a placed agent: the column stays NOT NULL there,
-- because money has to be attributable to a geography for the revenue reports
-- and for TDS. An unplaced agent cannot be approved, so cannot earn.

CREATE OR REPLACE FUNCTION app.unplaced_agent_count() RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT count(*)::int FROM public.agents WHERE local_body_id IS NULL;
$$;

GRANT EXECUTE ON FUNCTION app.unplaced_agent_count() TO calecute_app;

-- A flag so these surface in the review queue rather than sitting unnoticed.
ALTER TYPE review_flag_kind ADD VALUE IF NOT EXISTS 'LOCAL_BODY_NOT_SEEDED';
