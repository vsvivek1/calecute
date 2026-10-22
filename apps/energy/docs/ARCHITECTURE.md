# Energy Manager (Recallio) — architecture

Web edition of Recallio for the BEE National Certification Examination
(Energy Manager / Energy Auditor). Live at energy.recallio.calecutech.com.

## Pieces

- **Next.js app** (`apps/energy`, Vercel project `calecute-energy`). Server
  components read through `src/lib/data.ts`; client components call the same
  database functions with the signed-in user's session.
- **Database**: schema `energy_manager` in the USS Supabase project. Nothing in
  the schema is exposed over REST; the app calls only `public.em_*`
  functions (security definer, each checks `auth.uid()`).
- **Content**: `content/paper{1..4}.json` → `scripts/build-seed.py` →
  `supabase/seed/cards-*.sql` (upsert, safe to re-run).

## The study engine (all in SQL, `supabase/migrations/0004_recallio_rules.sql`)

1. **Day plan** (`energy_manager.day_plan`, one row per learner per IST day).
   Mode comes from days left to the exam: `learn`, `revision` (last ~2 weeks:
   only high-yield new cards), `cram` (last 2 days), `exam` (exam day: 10 easy
   wins), `after`. New cards per day = cards left ÷ learning days, trimmed to
   the learner's minutes per day. Reviews are capped at 2 × new + 20 so missed
   days spread out.
2. **Sittings** (`energy_manager.sittings`). At most 10 slots (a solved
   problem takes 2) plus up to 2 "Didn't get it" cards from earlier today.
   Order: a likely win first and last, no same topic or two problems back to
   back, new cards in book order. A sitting is saved with its position, so a
   reload resumes the same card. Only `em_rate` moves it forward.
3. **When a sitting opens** (`energy_manager.plan_state`). Quota sitting *k*
   opens at the learner's study time *k* (default 7:00, 13:00, 20:00 IST), at
   least 10 minutes after the last. After the quota: up to 2 bonus sittings,
   each 90 minutes after the last, never in quiet hours (21:30–06:30). Cram
   mode: sittings with 5-minute breaks.
4. **Scheduler** (`energy_manager.fsrs_next`). FSRS-5 with default weights,
   90% retention. Ratings: 1 Didn't get it, 2 Tough, 3 Understood, 4 So simple.
   "Didn't get it" returns once at the end of the sitting. A still-tough card's
   next gap is cut to one day. No review is scheduled after exam day − 3.

Tunable numbers live in `energy_manager.config`; the exam record in
`energy_manager.exam_info`.

## Front end

- `/` — signed out: what this is and sign in. Signed in, not enrolled: pick
  papers. Otherwise the **feed**: header (quota, next sitting, exam countdown),
  then the current card, or a calm "next sitting at …" screen.
- `/profile` — the only menu: papers, exam date, study times, minutes per day,
  alerts, sign out, delete my data.
- `/invite` — referral (gift icon). The invite strip shows only after the
  day's quota is done.
- Card screen: minimum time before buttons unlock (pauses when the tab is
  hidden, survives reload), learn view for new cards, recall view for reviews,
  problems one step at a time, read-aloud button.
