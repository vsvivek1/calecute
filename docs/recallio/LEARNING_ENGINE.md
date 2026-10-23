# Recallio — learning engine (as built)

The behaviour follows the Recallio skill's `learning-engine.md`. This file records what the code does and where.

| Rule | Where | Notes |
|---|---|---|
| Four ratings → FSRS Again/Hard/Good/Easy | `SchedulerService.review` | Desired retention 0.90. |
| Exam cap (never after exam − 3 days) | `SchedulerService.capToExam` | Inside the window the card returns by tomorrow. |
| "Push again" for still-tough cards | `SchedulerService.review` | A still-tough card's next Tough is scheduled as Again. |
| Honesty check for "So simple" | `SchedulerService.review`, `SittingBuilder.build` | 1 in 5 first-time "So simple" → a recall check 1–3 days later; a miss counts in `honestyMisses`. |
| Minimum time per screen | `minSeconds` | Two words a second, clamped; ×1.3 Malayalam, ×1.1 children. |
| Daily plan and quota | `Planner.plan` | New cards spread over the learn days before the revision window and cram; papers interleaved; low-yield new cards dropped first when time is short. |
| Sitting of at most 10 slots | `SittingBuilder` | Math/steps cards take 2 slots; missed-today first (max 2), then reviews (up to 60%), then new; easiest first and last. |
| Bonus sittings | `BonusRule` | 90 minutes after the last sitting, at most 2 a day, never in quiet hours. |
| Revision window | `Planner.plan` | min(14, 15% of the days from plan start); only high-yield new cards. |
| Cram mode (last 2 days) | `Planner._cramList` | Still-tough cards, one summary per topic, then high-yield facts. |
| Exam morning | `Planner._confidenceList` | The ten best-known cards and a checklist. |
| Weekly report | `WeeklyReport.build` | Every number from the learner's data; readiness shown as a 10% band. |
