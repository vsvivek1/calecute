# Recallio apps — architecture

Recallio (method: **Spaced Loop**) is Calecute's family of exam-prep apps. The app decides what the learner studies; the learner only rates each card.

## Layout in this repo

```
packages/recallio_core/     shared engine (Flutter package)
  lib/src/model/            CourseCard, CardProgress, ReviewEntry, LearnerSettings, ExamInfo
  lib/src/engine/           SchedulerService (FSRS), Planner, SittingBuilder, BonusRule,
                            CourseLibrary (topic summaries), WeeklyReport, minSeconds
  lib/src/data/             LocalStore (on-device state), SyncService (Supabase)
  lib/src/ui/               Daily Feed, card widgets, onboarding, profile sheet
  lib/src/alerts/           study-time alerts (Android)
apps/energy_app/            Energy Manager course shell: course config, theme, content pack
apps/energy/supabase/       Energy Manager schema and RPCs in the USS Supabase project
```

A course app is a thin shell: it passes a `CourseConfig` (names, papers, exam info, theme, Supabase keys) and its content pack to `RecallioApp`. Everything else lives in the engine so every course behaves the same.

## Data flow

1. **Content** ships inside the app as a JSON pack (`assets/content/pack.json`), built from the course's content files. Studying works fully offline.
2. **Progress** (FSRS state per card, review log, settings, the open sitting) is written to the device first (`LocalStore`).
3. **Sync**: when signed in and online, `SyncService` pushes changed card states and new review-log rows to Supabase through `public.em_sync`, and pulls states from other devices. Card state: last write wins by `updated_at`. Review log: append only.
4. **Auth**: Supabase Google sign-in (OAuth). The same account works on web and Android. Studying without an account is allowed; progress then stays on that device until the learner signs in.

## The feed

One screen. One card fills it. No skipping: the sitting (card ids, position, seconds already spent on the current card) is saved after every change, so reopening the app returns to the same card. The back button never pops a card. The only way forward is a rating, and the rating buttons unlock after the card's minimum time, counted only while the app is in the foreground.

## Platforms

- **Android**: package `com.calecutech.energymanager`. Alerts use flutter_local_notifications.
- **Web**: the same Flutter code, built with `flutter build web`. No alerts on web (browsers do not allow scheduled alarms); the feed shows the next sitting time instead.
