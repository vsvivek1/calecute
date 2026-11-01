-- Geological Assistant: one learner's progress for the admin progress board.
-- Needs 0004 (is_admin). Read-only and additive: one function, nothing else.
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
        select q.kind, q.module_id, q.total, q.correct, q.wrong, q.score, q.finished_at
        from geological_assistant.quiz_attempts q
        where q.user_id = p_user_id and q.course_id = p_course_id
        order by q.finished_at desc nulls last limit 200) a), '[]'::json)
  );
end $$;
revoke all on function geological_assistant.admin_user_progress(text, uuid) from public, anon;
grant execute on function geological_assistant.admin_user_progress(text, uuid) to authenticated;
