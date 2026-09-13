-- Ward becomes a required part of an application.
--
-- Why this exists
-- ---------------
-- Ward was optional because the LGD export we have carries no ward names, so
-- the picker had nothing to offer and the form said "optional". That was the
-- wrong trade: the ward is the whole point of the coverage model — a district
-- admin allocating territory needs to know where inside a panchayat an agent
-- actually is, and an applicant knows their own ward number without being told.
--
-- So the form asks for the NUMBER, not a name from a list we do not have. A
-- number given by a resident of that panchayat is a fact; a name we invented
-- would not be. The ward row is created on demand with status PENDING, which is
-- exactly what that status was defined to mean: this ward exists, we have not
-- loaded its name yet. Loading the official ward export later fills in names
-- against rows that are already correctly numbered.
--
-- Applicants in a municipality or corporation have no local body row to hang a
-- ward off (see 0006), so their ward number is parked alongside the name they
-- typed and resolved when the urban geography is loaded.

ALTER TABLE public.agents
  ADD COLUMN pending_ward_number smallint;

-- A placed agent has a real ward row; an unplaced one has the number they
-- typed. This mirrors agents_local_body_or_pending_check and is enforced for
-- the same reason: half-placed rows are the ones nobody notices.
ALTER TABLE public.agents
  ADD CONSTRAINT agents_ward_or_pending_check CHECK (
    (local_body_id IS NOT NULL AND ward_id IS NOT NULL AND pending_ward_number IS NULL)
    OR (local_body_id IS NULL AND ward_id IS NULL AND pending_ward_number IS NOT NULL)
  );

ALTER TABLE public.agents
  ADD CONSTRAINT agents_pending_ward_number_check CHECK (
    pending_ward_number IS NULL
    OR (pending_ward_number BETWEEN 1 AND 100)
  );

-- Resolve a ward number to a ward id, creating the row the first time anyone in
-- that ward applies.
--
-- SECURITY DEFINER because calecute_app has no INSERT on public.wards and must
-- not get one: this function is the only way the application may add a ward,
-- and it can only add a numbered placeholder to a local body that exists. It
-- cannot set a name, an LGD code, or a status.
--
-- The upper bound is a sanity limit, not an official count. Kerala's largest
-- corporation has 100 wards; a gram panchayat has roughly 13 to 23. Rejecting
-- 500 costs nothing and stops a fat-fingered entry becoming a permanent row.
CREATE OR REPLACE FUNCTION app.ward_for(p_local_body_id bigint, p_number smallint)
  RETURNS bigint
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id bigint;
BEGIN
  IF p_number IS NULL OR p_number < 1 OR p_number > 100 THEN
    RAISE EXCEPTION 'ward number out of range: %', p_number
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.local_bodies WHERE id = p_local_body_id) THEN
    RAISE EXCEPTION 'local body % does not exist', p_local_body_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  SELECT id INTO v_id
    FROM public.wards
   WHERE local_body_id = p_local_body_id AND number = p_number;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- ON CONFLICT rather than a plain INSERT: two applicants from the same ward
  -- can submit at the same moment, and wards_body_number_idx would fail one of
  -- them for no reason the applicant could act on.
  INSERT INTO public.wards (local_body_id, number, status)
  VALUES (p_local_body_id, p_number, 'PENDING')
  ON CONFLICT (local_body_id, number) DO UPDATE SET number = EXCLUDED.number
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION app.ward_for(bigint, smallint) TO calecute_app;
