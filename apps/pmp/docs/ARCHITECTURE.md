# PMP Prep architecture

One Next.js codebase builds the website (Vercel) and the Android app
(Capacitor wraps a static export). Since v1.1 it follows the Recallio
"Spaced Loop" method: the app decides what to study, one card at a time.

## Screens

| Route | What it is |
|---|---|
| `/` | Landing page (web only; the app jumps to `/study`) |
| `/sample` | A free 10-card sitting, same card and ratings as the full app |
| `/study` | The Daily Feed: the only study screen. Onboarding, sittings, between-sitting screen, mock exams, after-exam card |
| `/study/profile` | Exam date, study times, minutes a day, reminders, account, delete progress |
| `/unlock` | Licence: claim after Stripe, restore by email |

The app bar on `/study` holds only the profile button. There are no topic,
domain or mode menus.

## Learning engine (`src/lib/engine`, pure TypeScript, unit-tested)

- `scheduler.ts`: FSRS via `ts-fsrs`, day-based. Ratings Didn't get it /
  Tough / Understood / So simple → Again / Hard / Good / Easy. Exam cap (no
  review after exam day − 3). Honesty checks (1 in 5 first-time "So simple"
  return in 1–3 days; a miss resets the card). Tough → easy classification.
  Migration from v1 SM-2 state.
- `plan.ts`: daily quota from the exam date: learn phase, revision window
  (last ~15% of days, max 14), cram (last 2 days), exam day, after.
- `sitting.ts`: up to 10 cards. Earlier misses (max 2), due reviews (lowest
  predicted recall first, up to 60%), new cards by exam domain weight, then
  more reviews. Easiest card first and last; topics spread apart.
- `report.ts`: weekly report, readiness, quick checks, focus size.
- `timing.ts`: minimum seconds before Check and rating buttons unlock.

## State (`src/lib/feed.ts`)

Everything lives in `localStorage` key `pmp.loop` on the device: profile,
card states, a 120-day review log, tallies, mocks, day records and the
current sitting, including the card on screen (chosen answer, revealed or
not, foreground time). Reload, back or kill+reopen return to the same card.
v1 progress (`pmp.progress`) is migrated on first open.

Feed rules: a quota sitting opens 45 min after the last one; once the quota
is done, up to two bonus sittings, each 90 min apart; none 10 PM–6 AM. Cram
mode uses 5-min breaks. A timed mock is offered between sittings weekly once
40 cards are seen (60 questions; 180 in the revision window; one on exam
day − 2).

## Platform (`src/lib/platform`)

- `alerts.ts`: Android local notifications (heads-up channel), scheduled
  for the next 14 days at each study time and redone on every open; today's
  are skipped once the quota is done. Web: an `.ics` calendar file.
- `speech.ts`: read-aloud with device text-to-speech.
- `timer.ts`: foreground-only timer that saves itself.
- `components/AppShell.tsx`: Android back button never leaves a card.

## Server

Unchanged: `/api/checkout`, `/api/license/{claim,restore,verify}`,
`/api/bank` (full bank only for a valid licence key).
