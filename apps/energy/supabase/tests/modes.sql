\i 02_sim.sql
set test.uid = '00000000-0000-0000-0000-000000000001';
select public.em_enrol('{1,2,3,4}') is not null;
select public.em_settings(null, '{00:00,00:01,00:02}', 30) is not null;
select public.t_day(i/100.0) is not null from generate_series(1,1) i;
\echo --- 15 more days
select public.t_day(0.21); select public.t_day(0.22); select public.t_day(0.23); select public.t_day(0.24); select public.t_day(0.25);
\echo --- bonus after 2h
select public.t_shift('100 minutes');
select public.em_feed()->'next';
select public.em_start_sitting()->'sitting'->>'kind';
select s.kind, s.new_count, s.review_count, cardinality(s.cards) from energy_manager.sittings s where finished_at is null;
select public.t_rate(3) from generate_series(1,12) where false;
do $$ begin perform public.t_rate(3) from generate_series(1,15); end $$;
\echo --- exam cap: exam in 10 days
select public.t_shift('1 day');
select public.em_settings(energy_manager.today_ist() + 10, '{00:00}', 30)->>'mode';
select public.em_start_sitting()->'sitting'->>'kind';
select public.t_rate(4);
select card_id, due_at, interval_days from energy_manager.card_state order by last_reviewed_at desc limit 1;
\echo --- revision mode days
select (public.em_feed()->'exam'->>'daysLeft');
\echo --- cram: exam in 2 days
select public.t_shift('1 day');
select public.em_settings(energy_manager.today_ist() + 2, '{00:00}', 30)->'quota', public.em_feed()->>'mode', public.em_feed()->'next';
do $$ begin perform public.t_rate(3) from generate_series(1,15); end $$;
do $$ begin perform public.em_start_sitting(); raise notice 'unexpected: cram sitting opened without a break'; exception when others then raise notice 'expected: %', sqlerrm; end $$;
select x.n, c.id, c.flash, s2.recent from energy_manager.sittings s, unnest(s.cards) with ordinality x(cid,n) join energy_manager.cards c on c.id = x.cid left join energy_manager.card_state s2 on s2.card_id = c.id where s.finished_at is null order by n;
do $$ begin perform public.t_rate(3) from generate_series(1,15); end $$;
select public.em_feed()->'next', public.em_feed()->'quota';
\echo --- exam day
select public.t_shift('2 days');
select public.em_feed()->>'mode', public.em_feed()->'next', public.em_feed()->'quota';
select public.em_start_sitting()->'sitting'->>'kind';
\echo --- after exam
select public.t_shift('2 days');
select public.em_feed()->>'mode', public.em_feed()->'exam'->>'daysLeft';
select public.em_delete_me();
select count(*) from energy_manager.card_state;
