-- Bulk card loader used by supabase/seed/cards-*.sql.
-- Upserts cards from a JSON array; reloading a card re-activates it.
create or replace function energy_manager.load_cards(p jsonb) returns int
language sql set search_path = '' as $$
  with x as (
    insert into energy_manager.cards
      (id, paper_id, topic, kind, front, back, explain, steps, flash, source, order_index)
    select c->>'id', (c->>'paper')::smallint, c->>'topic', c->>'kind', c->>'front', c->>'back',
           c->>'explain', nullif(c->'steps', 'null'::jsonb), coalesce((c->>'flash')::boolean, false),
           c->>'source', (c->>'order')::int
    from jsonb_array_elements(p) c
    on conflict (id) do update set
      paper_id = excluded.paper_id, topic = excluded.topic, kind = excluded.kind,
      front = excluded.front, back = excluded.back, explain = excluded.explain,
      steps = excluded.steps, flash = excluded.flash, source = excluded.source,
      order_index = excluded.order_index, active = true
    returning 1
  )
  select count(*)::int from x
$$;

revoke all on function energy_manager.load_cards(jsonb) from public;
