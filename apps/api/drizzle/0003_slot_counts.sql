-- Aggregate counts that must be true regardless of who is asking.
--
-- The problem these solve
-- ----------------------
-- The public recruitment page states how many places are left in a panchayat.
-- That number is a trust signal: a suspicious visitor checking it against
-- reality is exactly the audience the page is written for.
--
-- But counting `agents` under row-level security returns what the CALLER may
-- see, and an anonymous visitor may see no agent rows at all. So every
-- panchayat reported itself as empty, and a full one would still have accepted
-- an eleventh application.
--
-- SECURITY DEFINER is the right tool here and the scope is deliberately narrow:
-- these functions return counts only. No agent row, no name, no mobile number
-- crosses the boundary — just an integer that is meant to be public.
--
-- `SET search_path` on each function closes the usual SECURITY DEFINER hole,
-- where a caller-controlled schema shadows `public` and substitutes its own
-- table.

CREATE OR REPLACE FUNCTION app.filled_slots(target bigint) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT count(*)::int FROM public.agents
     WHERE local_body_id = target
       AND status IN ('PENDING_REVIEW', 'APPROVED');
$$;

CREATE OR REPLACE FUNCTION app.waitlist_size(target bigint) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT count(*)::int FROM public.waitlist_entries
     WHERE local_body_id = target AND cleared_at IS NULL;
$$;

-- Set-returning variant, so the searchable picker gets every body's usage in one
-- join rather than one function call per row.
CREATE OR REPLACE FUNCTION app.slot_usage()
  RETURNS TABLE (local_body_id bigint, filled integer, pending integer,
                 approved integer, waiting integer)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT lb.id,
           COALESCE(a.filled, 0)::int,
           COALESCE(a.pending, 0)::int,
           COALESCE(a.approved, 0)::int,
           COALESCE(w.waiting, 0)::int
      FROM public.local_bodies lb
      LEFT JOIN (
        SELECT ag.local_body_id,
               count(*) FILTER (WHERE ag.status IN ('PENDING_REVIEW','APPROVED')) AS filled,
               count(*) FILTER (WHERE ag.status = 'PENDING_REVIEW') AS pending,
               count(*) FILTER (WHERE ag.status = 'APPROVED') AS approved
          FROM public.agents ag GROUP BY ag.local_body_id
      ) a ON a.local_body_id = lb.id
      LEFT JOIN (
        SELECT we.local_body_id, count(*) AS waiting
          FROM public.waitlist_entries we WHERE we.cleared_at IS NULL
          GROUP BY we.local_body_id
      ) w ON w.local_body_id = lb.id;
$$;

GRANT EXECUTE ON FUNCTION app.filled_slots(bigint) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.waitlist_size(bigint) TO calecute_app;
GRANT EXECUTE ON FUNCTION app.slot_usage() TO calecute_app;
