-- Geological Assistant (Ground Water Dept, Kerala PSC Cat. 46/2011): one new course on the shared engine.
-- Run BEFORE 0008_geological_assistant_seed.sql. Nothing here touches other courses.
begin;

-- English-only content: Malayalam is optional for this course.
alter table public.cards alter column statement_ml drop not null;

insert into public.courses (
  id, code, name, department, total_marks, mock_question_count, mock_duration_minutes,
  negative_mark_fraction, default_plan_days, is_free_course, price_minor, price_currency
) values (
  'geological-assistant', '46/2011', 'Geological Assistant',
  'Ground Water Department, Kerala', 100, 100, 75, 0.3333, 60, false, 300000, 'INR'
) on conflict (id) do update set
  name = excluded.name, price_minor = excluded.price_minor, price_currency = excluded.price_currency;

commit;
-- Price: 300000 paise = Rs 3,000 one-time. razorpay-create-order reads this; the app never sends a price.
-- One-time payment.captured => subscriptions.current_period_end null => lifetime (see razorpay-webhook).
