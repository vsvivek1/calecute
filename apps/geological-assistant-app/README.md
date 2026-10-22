# Geological Assistant app (Android)

Flutter app for the Kerala PSC Geological Assistant course (Ground Water Department, Cat. 46/2011). Students sign in with Google and study the course they bought on calecutech.com: daily fact cards with spaced repetition, unit quizzes, and a timed mock test.

Plan: `docs/geological-assistant/FLUTTER_PLAN.md` (on the `claude/geological-assistant` branch).

## IDs

| | Value |
|---|---|
| Android application ID | `com.calecutech.geologicalassistant` (`android/app/build.gradle.kts`) |
| App name on device | Geological Assistant |
| Version | `version:` in `pubspec.yaml` (bump the `+N` build number for every upload) |

The application ID is permanent once the first build reaches Google Play.

## What it does

- **Sign-in:** Google, exchanged for a Supabase session (`signInWithIdToken`), the same account as the website.
- **Unlock:** `geological_assistant.has_active_subscription('geological-assistant')`. Purchases happen on the website only. The app sells nothing, shows no price and has no link to buy, to stay within Google Play's payments policy. An account without the course sees "Course not active on this account".
- **Today:** due reviews first, then new cards (25 a day by default, high-priority first, same as the website). Review cards are tested with one of their linked past-paper questions when they have one. Tags on each card: high priority (tier 1), past paper (`source_ref`), verify before exam (`verified = false`).
- **Practice:** 20-question unit quizzes with the answer and the fact behind it after each question; "Read cards" per unit with filters; retry your mistakes.
- **Mock test:** 100 questions (20 per unit), 75 minutes, 1 mark right, minus 1/4 wrong (same as the website since 18 Oct), auto-submit at time out, question palette, mark for review, per-unit result and answer review. Question count and time come from the `courses` row; the 1/4 penalty is fixed in `lib/models.dart` because the row still says 1/3.
- **Offline:** the course is cached on the phone after the first load. Reviews and attempts are saved on the phone and synced to `user_card_state` and `quiz_attempts`, so progress is shared with the website.

## Data

Schema `geological_assistant` in the USS Supabase project. Tables used: `courses`, `modules`, `cards`, `questions`, `question_cards` (read), `user_card_state` (upsert on `user_id,card_id`), `quiz_attempts` (insert). Conventions:

- SM-2: ease starts 2.5 (min 1.3), interval 1 day, then 6, then interval × ease. Ratings again/hard/good/easy = quality 0/3/4/5. A lapse is counted when a learned card is rated again.
- `quiz_attempts.score` = correct − wrong × 1/4. `answers` = `[{q: question_id, a: 'a'..'d' | null}]` (the website writes `{question_id: 'a'}`; the app reads both). `kind` is `unit` (with `module_id`, or null for a mistakes retry) or `mock`.
- A question's unit is the unit most of its linked cards belong to.

## Settings

All via `--dart-define` or `--dart-define-from-file=config/prod.json`. None of them are secret.

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://vspbbwpehvenmxddgbhm.supabase.co` |
| `SUPABASE_ANON_KEY` | USS publishable key (`sb_publishable_...`) |
| `GOOGLE_WEB_CLIENT_ID` | The **web** OAuth client id that USS Supabase Auth > Google uses. Still empty in `config/prod.json`. |

If any value is empty the app runs in **demo mode**: no sign-in, 30 sample cards and 30 sample questions from `assets/demo/sample.json`, progress kept only on the phone.

## Google sign-in setup (owner)

1. Google Cloud console, the project that holds the USS web client: create an **Android** OAuth client for package `com.calecutech.geologicalassistant` with the SHA-1 of the signing key (`keytool -list -v -keystore <keystore>`). Add one for the Play App Signing key too once the app is on Play.
2. Put the web client id in `config/prod.json` as `GOOGLE_WEB_CLIENT_ID`.
3. Supabase USS > Auth > Providers > Google: the web client id must be in the client ids list (it already is if the website's Google login works).

## Run and check

```sh
cd apps/geological-assistant-app
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter run --dart-define-from-file=config/prod.json
flutter build apk --debug --dart-define-from-file=config/prod.json
```

CI (`.github/workflows/geological-assistant-app.yml`) runs format, analyze, tests and a debug APK build on every pull request that touches this folder, and attaches the APK to the run.

## Release signing

`android/app/build.gradle.kts` reads `android/key.properties` (never committed):

```
storeFile=/path/to/geological-assistant-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Without it, release builds fall back to the debug key.

## Release to Google Play

fastlane lives in `android/` (`bundle exec fastlane <lane>`):

| Lane | Does |
|---|---|
| `build` | signed AAB (`config:` = dart-define file, `build_number:`) |
| `production_draft` | uploads the AAB to the **production** track as a **draft** |
| `internal_draft` | uploads the AAB to internal testing as a draft |

The **Geological Assistant release** workflow (`.github/workflows/geological-assistant-release.yml`, run by hand) builds the signed AAB from repository secrets (listed at the top of the file), fails if any config value is empty so a release can never ship in demo mode, checks the AAB is not debug-signed, keeps it as a run artifact for 7 days, and uploads it as a draft. The version code is the run number. A draft never goes live until someone sends it for review in Play Console.

Play only accepts API uploads for an app that already exists in Play Console; if the first API upload is refused, upload the artifact once by hand.

## Not done yet

- Play Billing (plan option A). The app only unlocks courses bought on the website for now.
- Daily reminder notifications.
- Malayalam text (`statement_ml` is in the schema, not filled).
- Store listing, screenshots and data-safety form (Play Console, before sending the production draft for review).
