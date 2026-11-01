-- Geological Assistant: placement test (day 1) and weekly test (day 7, 14, ...).
-- Needs 0001 and 0006. Additive: widens the attempt kinds, stores per-unit scores,
-- and lets the admin progress board show them. Apply only after the owner's go-ahead.

alter table geological_assistant.quiz_attempts drop constraint if exists quiz_attempts_kind_check;
alter table geological_assistant.quiz_attempts add constraint quiz_attempts_kind_check
  check (kind in ('unit', 'mock', 'placement', 'weekly'));

-- {"1": {"right": 7, "total": 10}, ...}: how the learner did in each unit on this test.
alter table geological_assistant.quiz_attempts add column if not exists unit_scores jsonb;

-- Same as 0006, plus the per-unit scores.
create or replace function geological_assistant.admin_user_progress(p_course_id text, p_user_id uuid)
returns json language plpgsql stable security definer set search_path to '' as $$
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  return json_build_object(
    'email', coalesce((select p.email from geological_assistant.user_profile p where p.user_id = p_user_id),
                      (select u.email from auth.users u where u.id = p_user_id)),
    'states', coalesce((select json_agg(json_build_object(
        'card_id', s.card_id, 'interval_days', s.interval_days, 'reps', s.reps, 'lapses', s.lapses,
        'due_at', s.due_at, 'last_reviewed_at', s.last_reviewed_at))
      from geological_assistant.user_card_state s
      join geological_assistant.cards c on c.id = s.card_id
      where s.user_id = p_user_id and c.course_id = p_course_id), '[]'::json),
    'attempts', coalesce((select json_agg(a order by a.finished_at desc nulls last) from (
        select q.kind, q.module_id, q.total, q.correct, q.wrong, q.score, q.finished_at, q.unit_scores
        from geological_assistant.quiz_attempts q
        where q.user_id = p_user_id and q.course_id = p_course_id
        order by q.finished_at desc nulls last limit 200) a), '[]'::json)
  );
end $$;
