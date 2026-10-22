create or replace function public.t_shift(h interval) returns void language sql as $$
  update energy_manager.review_log set reviewed_at = reviewed_at - h;
  update energy_manager.card_state set due_at = due_at - h, last_reviewed_at = last_reviewed_at - h,
    introduced_on = ((introduced_on + time '12:00') - h)::date;
  update energy_manager.sittings set started_at = started_at - h, finished_at = finished_at - h,
    day = ((day + time '12:00') - h)::date;
  update energy_manager.day_plans set day = day - 50000;
  update energy_manager.day_plans set day = ((day + 50000 + time '12:00') - h)::date;
$$;
-- Rate the current card of the open sitting with r (or a pattern by position).
create or replace function public.t_rate(r int) returns jsonb language plpgsql as $$
declare s energy_manager.sittings;
begin
  select * into s from energy_manager.sittings where finished_at is null;
  if not found then return null; end if;
  return public.em_rate(s.id, s.cards[s.pos+1], r, 12);
end $$;
