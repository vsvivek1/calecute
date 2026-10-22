# Upgrade plan: Energy Manager web app to the Recallio rules

Audit of `apps/energy` (as merged in calecute#64 and #66) against the Recallio
fixed rules, written 2026-10-22. The Energy Manager edition is a **web app**
(Next.js on Vercel, data in the USS Supabase project, schema `energy_manager`),
not a Flutter app, so each rule is applied in its web form.

## Fixed rules

| # | Rule | Before | After this upgrade |
|---|------|--------|--------------------|
| 1 | The app decides | Met. Only choice is which papers to enrol in. | Kept. |
| 2 | One menu: the daily feed | Not met. App bar had My papers, Invite, Sign out; invite strip sat above the feed. | App bar holds only a profile button and the gift icon. Papers, exam date, study times, sign out and delete live in the profile page. Invite card shows only after the quota is done. |
| 3 | No scrolling, no skipping | Partly. One card at a time, but a reload threw away the queue and started again. | The current sitting (card list and position) is saved in the database. Reload, back button or a new device resumes the same card. The only way forward is a rating. |
| 4 | Four ratings | Partly. Again/Hard/Good/Easy labels, SM-2 scheduler. | Buttons read Didn't get it · Tough · Understood · So simple, mapped to FSRS Again/Hard/Good/Easy. FSRS-5 runs in the database. |
| 5 | Minimum time on every card and step | Not met. | Rating and "Next step" buttons unlock after a minimum time (formula from the learning engine), with a quiet filling ring. The timer pauses while the tab is hidden and survives a reload. |
| 6 | At most 10 cards per sitting | Not met. Whole day in one queue. | Sittings of 10 slots; a solved problem takes 2 slots. "Didn't get it" cards return once at the end of the sitting. |
| 7 | Sittings at set times | Not met. One evening reminder while the tab was open. | Study times (default 7:00, 13:00, 20:00 IST) set in the profile. Each quota sitting opens at its study time; the feed header shows the quota and the next sitting time. Bonus sittings open 90 minutes after the last one, at most 2 a day, never in quiet hours. Browser notifications fire at study times while a tab is open. |
| 8 | Exam date drives the plan | Not met. Fixed 8 new cards per paper per day. | Official date record in `energy_manager.exam_info`; the learner may set their own. New cards per day = cards left ÷ learning days. Revision window and 2-day cram mode switch on by themselves. Intervals are capped so every card returns before exam day − 3. |
| 9 | Content from the official syllabus | Met. Cards come from the BEE guide books (2,185 cards, each names its page). | Kept. |
| 10 | AI only through the server | Met (no AI yet). | Kept. AI help is a later step. |
| 11 | Weekly report | Not met. | Later step (see below). This upgrade stores the data it needs: ever tough, last three ratings, became easy / still tough counts. |

## Exam date

The 26th National Certification Examination ran on 25 to 27 September 2026
(Paper 1 and 2 on the 25th, Paper 3 and 4 on the 26th), per the official
prospectus on nceexam.in. It is over. The 27th exam is not announced yet, so the
app pre-fills **24 September 2027 (a Friday, like 25 September 2026), status estimated**, from last year's
pattern. Update the row in `energy_manager.exam_info` once BEE publishes the
27th prospectus.

## Deliberate differences from the Android rules

- **English only.** The BEE exam is national and its books are in English, so
  the Malayalam half of "Malayalam + English everywhere" does not apply here.
- **Web alerts.** A web page cannot ring like an alarm when closed. This step
  shows study-time notifications while a tab is open (or the app is installed
  as a PWA and running). True closed-browser alerts need Web Push with a
  scheduled sender; that is the next step.
- **No home-screen widget.** The quota sits in the feed header instead.
- **Delete account** removes the learner's Energy Manager data only. The
  Google sign-in is shared across USS apps, so the login itself stays.

## Upgrade order (one commit each)

1. This plan, `ARCHITECTURE.md`, `TECH_STACK.md`.
2. Database: FSRS-5 scheduler, exam date, learner settings, daily plan,
   sittings, cram mode (`supabase/migrations/0004_recallio_rules.sql`).
   Earlier SM-2 progress is converted (interval becomes stability). There
   were no learners yet when this was written.
3. Feed: saved sittings, minimum-time ring, new rating buttons, learn and
   recall views, "Didn't get it" shows the explanation.
4. Single menu: profile page, gift icon only, invite after quota.
5. Study-time alerts in the browser.

## Later steps

- Web Push for alerts when the browser is closed.
- Weekly report (email + feed card) with Became easy / Still tough and the
  retention review.
- Honesty checks for "So simple" and one-minute quick checks.
- Tests from past papers (the 2023 to 2025 papers are in the project folder).
- AI explanations through a Supabase Edge Function, with a Report button.
- Summary cards per topic for cram mode (cram now reuses tough and
  high-yield cards).
