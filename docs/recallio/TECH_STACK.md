# Recallio — tech stack

Checked on pub.dev on 2026-10-22.

| Need | Choice | Why |
|---|---|---|
| UI | Flutter 3.47 (stable), Dart 3.13 | One codebase for Android and web. |
| Spaced repetition | `fsrs` 2.0.1 behind `SchedulerService` | Official open-spaced-repetition port. Learning/relearning steps are off (day-based); the sitting builder brings "Didn't get it" back the same day. |
| Local state | `shared_preferences` (JSON) | Works the same on Android and web with no native or wasm setup. The state is small (about 150 bytes per card). The skill suggests drift; we can move to it if a course grows past ~20,000 cards. |
| Content | Bundled JSON asset | Offline from the first launch; no download step. |
| Backend, auth, sync | `supabase_flutter` 2.18 | Shared USS Supabase project; Google sign-in through Supabase OAuth. |
| Alerts | `flutter_local_notifications` 22 + `timezone` + `flutter_timezone` | Daily study-time alerts on Android. |
| Audio | `flutter_tts` | Read-aloud button on every card. |
| Links | `url_launcher` | Privacy, terms, delete-account pages. |

## Not built yet

- Home-screen quota widget (`home_widget`) — needs an Android widget layout; next step after the first device test.
- AI help (Edge Function proxy) — needs the Anthropic key set as a Supabase secret.
- Weekly report email — the report card shows in the feed; email needs a mail provider.
- Quick checks (focus and level).
