\i 01_helpers.sql
create or replace function public.t_day(seed float) returns jsonb language plpgsql as $$
declare f jsonb; n int := 0; r int; x float; sittings int := 0;
begin
  perform setseed(seed); perform public.t_shift(interval '1 day');
  loop
    f := public.em_feed();
    exit when (f->'next'->>'kind') is distinct from 'quota' and (f->>'openSitting') is null;
    if (f->>'openSitting') is null then
      if not (f->'next'->>'openNow')::boolean then perform public.t_shift(interval '15 minutes'); continue; end if;
      perform public.em_start_sitting(); sittings := sittings + 1;
    end if;
    loop
      x := random();
      r := case when x < 0.1 then 1 when x < 0.3 then 2 when x < 0.8 then 3 else 4 end;
      f := public.t_rate(r);
      exit when f is null or (f->>'finished')::boolean;
      n := n + 1;
    end loop;
    exit when sittings > 10;
  end loop;
  return public.em_feed()->'quota' || jsonb_build_object('sittings', sittings, 'mode', public.em_feed()->>'mode');
end $$;
