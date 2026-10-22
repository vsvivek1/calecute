# Upgrading PMP Prep to the Recallio method

PMP Prep was a dashboard of study modes (daily review, drills, domain and
topic practice, mocks). Recallio apps let the app decide what to study, one
card at a time. This plan lists each Recallio rule, where PMP Prep stood, and
what the upgrade does. PMP Prep stays a Next.js + Capacitor app (one codebase
for the website and the Android app); the Recallio standard stack is Flutter,
but a rewrite would drop the website, which is where PMP Prep sells.

PMP candidates are adults in the US, so the Malayalam, parent-report and
child-consent parts of Recallio do not apply. The report goes to the learner.

| # | Rule | Before | After |
|---|---|---|---|
| 1 | The app decides | Learner picked mode, domain or topic | Scheduler picks every card; topic and domain browsers removed |
| 2 | One menu: the Daily Feed | Dashboard with 4 modes, domain and topic lists | `/study` is the feed. App bar: profile button only |
| 3 | No scrolling, no skipping | Free navigation, Exit button | One card at a time; the sitting and the card's state are saved, so reload, back or kill+reopen return to the same card. Android back button is swallowed in the feed |
| 4 | Four ratings | Right/wrong + "I'm guessing" | Didn't get it · Tough · Understood · So simple → FSRS Again · Hard · Good · Easy. After a wrong answer only the first two are enabled |
| 5 | Minimum time | None | Check and rating buttons unlock after a time based on word count; the timer pauses when the tab or app is in the background and is saved per card |
| 6 | At most 10 per sitting | 20-question daily review | Sittings of up to 10 (5–10 from quick checks) |
| 7 | Sittings at set times | None | Study times in profile; Android local notifications at each time; web gets an add-to-calendar file. Quota in the feed header; "quota complete" once a day; bonus sittings only after a 90-minute gap, max 2 a day |
| 8 | Exam date drives the plan | None | Exam date asked at onboarding (PMP candidates book their own date). Planner works back from it; cram mode in the last 2 days |
| 9 | Official syllabus | Bank written to the 2026 ECO | Unchanged. New cards are mixed by ECO domain weight |
| 10 | AI only through the server | No AI | No AI added yet |
| 11 | Weekly report | None | Report card in the feed each week: became easy, still tough, slipped, tests, focus, readiness, retention review |

Added rules: honesty checks for "So simple" (1 in 5 return early as a check),
quick checks (never called IQ), no review scheduled after exam day − 3, sittings
start and end with an easy card, audio button (device text-to-speech), offline
after the bank loads.

Not done in this upgrade: home-screen quota widget (needs native Android
code), emailed weekly report (needs an email provider), AI explanations,
referral module, sync between devices.

Progress migration: old SM-2 states in `pmp.progress` are converted on first
open. Cards with a review history keep their interval as FSRS stability and
their due date; topic and domain tallies and mock history are kept.
