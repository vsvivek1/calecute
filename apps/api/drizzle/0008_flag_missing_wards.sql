-- Flag the applications that predate the ward requirement.
--
-- Separate from 0007 because ALTER TYPE ... ADD VALUE cannot be used in the
-- same transaction that adds it: Postgres refuses to use a new enum label until
-- the transaction that created it has committed. So 0007 adds the label and
-- this migration uses it.
--
-- One flag per agent, and re-running produces no duplicates.
INSERT INTO public.review_flags (agent_id, kind, status, detail)
SELECT a.id,
       'WARD_MISSING',
       'OPEN',
       jsonb_build_object(
         'reason', 'Filed before the ward became a required field.',
         'action', 'Ask the agent for their ward number and set it.'
       )
  FROM public.agents a
 WHERE a.local_body_id IS NOT NULL
   AND a.ward_id IS NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.review_flags f
      WHERE f.agent_id = a.id AND f.kind = 'WARD_MISSING'
   );
