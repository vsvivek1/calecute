\i 02_sim.sql
set test.uid = '00000000-0000-0000-0000-000000000001';
select public.em_enrol('{1,2,3,4}') is not null;
select public.em_settings(null, '{00:00,00:01,00:02}', 30) is not null;
select public.t_day(0.3) is not null; select public.t_day(0.31) is not null; select public.t_day(0.32) is not null;select public.t_day(0.33) is not null;
select public.t_shift('1 day');
update energy_manager.profiles set exam_date = energy_manager.today_ist();
select public.em_feed()->>'mode', public.em_feed()->'next', public.em_feed()->'quota';
select public.em_start_sitting()->'sitting'->>'kind';
select s.kind, s.new_count, s.review_count, cardinality(s.cards) from energy_manager.sittings s where finished_at is null;
do $$ begin perform public.t_rate(3) from generate_series(1,15); end $$;
select public.em_feed()->'next', public.em_feed()->'quota';
select public.t_shift('1 day');
select public.em_feed()->>'mode', public.em_feed()->'quota', public.em_feed()->'next';
\echo welcome back after 3 days away
select public.t_shift('3 days');
update energy_manager.profiles set exam_date = null;
select public.em_start_sitting()->'sitting'->>'kind';
select s.kind, s.new_count, s.review_count, cardinality(s.cards) from energy_manager.sittings s where finished_at is null;
\echo revision mode
do $$ begin perform public.t_rate(3) from generate_series(1,15); end $$;
select public.t_shift('1 day');
update energy_manager.profiles set exam_date = energy_manager.today_ist() + 12;
select public.em_feed()->>'mode', public.em_feed()->'quota';
update energy_manager.profiles set created_at = now() - interval '300 days';
delete from energy_manager.day_plans where day = energy_manager.today_ist();
select public.em_feed()->>'mode', public.em_feed()->'quota';
select new_quota, review_quota from energy_manager.day_plans where day = energy_manager.today_ist();
