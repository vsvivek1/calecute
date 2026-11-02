# Calecutech PTA: Android and iPhone

The parent and class-teacher side of `apps/pta` on a phone. It calls the same
`pta.*` database functions as the web app, so the two always agree.

| | |
|---|---|
| Parents | Today digest, homework (mark done), fees with receipts, grades, attendance calendar and leave requests, activities with permission slips, quizzes, sample tests, notices, complaints |
| Class teachers | Register (everyone starts present), leave approvals, post homework and see seen/done counts |
| Office | Points to the web app; fee and student admin is desk work |

English and Malayalam, switchable from the top bar.

## IDs

| | |
|---|---|
| Android application ID | `com.calecutech.pta` (permanent once on Google Play) |
| iOS bundle ID | `com.calecutech.pta` |
| OAuth redirect | `com.calecutech.pta://login-callback` |

## Running

Against the demo school (no account needed; pick Parent or Class teacher):

```sh
flutter run --dart-define=DEMO_URL=https://<your demo deployment of apps/pta>
```

Against a real Supabase project:

```sh
flutter run --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
            --dart-define=SUPABASE_KEY=sb_publishable_...
```

Parents sign in with a six-digit code sent to the email the school has on
file, or with Google.

## Checks

```sh
dart format lib test
flutter analyze
flutter test        # widget tests run against real responses in test/fixtures
flutter build apk --debug
```

CI (`.github/workflows/pta.yml`) runs all of these on every pull request that
touches `apps/pta_mobile` and attaches the debug APK to the run.

Release builds sign with the key named in `android/key.properties`, exactly
as `apps/mobile/README.md` describes for History Clock (use a separate upload
key for this app). Neither file is committed; without them a release build
falls back to the debug key.
