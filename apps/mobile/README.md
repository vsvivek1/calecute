# History Clock mobile app (preview)

A small Flutter preview of History Clock by Calecutech. One screen: what History Clock is, buttons that open the web map and the Kerala quiz, and links to the privacy, terms, account-deletion and contact pages. It has no login, no analytics, no ads and no network calls of its own; it only opens web pages in the browser.

It exists so the Android listing, package ID and signing can be set up while the full app (Prompt 3 in the planning ZIP: map, timeline, Google sign-in, shared API) is built. The full app should grow inside this folder and keep the same package ID.

## IDs

| | Value |
|---|---|
| Android application ID | `com.calecutech.historyclock` (`android/app/build.gradle.kts`) |
| iOS bundle ID | `com.calecutech.historyclock` |
| App name on device | History Clock |
| Version | `version:` in `pubspec.yaml` (`1.0.0+1`; bump the `+N` build number for every upload) |

The Android application ID is permanent once the first build reaches Google Play.

## Run and check

```sh
cd apps/mobile
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter run            # on a connected device or emulator
flutter build apk --debug
```

CI (`.github/workflows/mobile.yml`) runs format, analyze, tests and a debug APK build on every pull request that touches this folder, and attaches the APK to the run.

## Release signing

Release builds sign with the key named in `android/key.properties`. That file and the keystore are git-ignored and must never be committed.

1. Create an upload key once and keep it backed up somewhere safe:
   ```sh
   keytool -genkey -v -keystore ~/history-clock-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Create `apps/mobile/android/key.properties`:
   ```properties
   storePassword=...
   keyPassword=...
   keyAlias=upload
   storeFile=/absolute/path/to/history-clock-upload.jks
   ```
3. Build the bundle for Play: `flutter build appbundle --release` (output in `build/app/outputs/bundle/release/`).

Without `key.properties`, release builds fall back to the debug key, which Play rejects.

Use Play App Signing: Google holds the app signing key and you keep only the upload key. Add the upload key's SHA-1 and SHA-256 (`keytool -list -v -keystore ...`) and the Play app-signing key's fingerprints to Firebase when Google sign-in is added.

## Before the first Play release

- Google Play developer account for Calecutech, with identity verification done.
- App icon and splash in the History Clock style (the defaults are still the Flutter logo).
- Store listing: short and full description, at least two phone screenshots, a 512×512 icon and a 1024×500 feature graphic.
- Data safety form: no data collected or shared. Content rating questionnaire, target audience, ads declaration (no ads), app access (no login).
- Confirm the linked pages are live: `/history-clock`, `/history-clock/app`, `/history-clock/quiz`, `/history-clock/privacy`, `/history-clock/terms`, `/history-clock/delete-account`, `/contact` on calecutech.com. The policy pages still have legal `TODO`s (see `docs/HISTORY_CLOCK.md`).
- Start with internal or closed testing. Play can reject a link-only app for limited functionality, and new personal developer accounts must run a closed test with testers before production access.
- Revisit the privacy policy, Data safety form and this README before adding Firebase, analytics, crash reporting or any other SDK.
