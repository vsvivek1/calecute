# Recallio Energy Manager (Flutter, Android + web)

The Energy Manager course as a Recallio app: one codebase for Android
(`com.calecutech.energymanager`) and the web. The engine, feed and card
widgets live in `packages/recallio_core`; this folder is the course shell
(config, theme, content).

- Content: `python3 tool/build_content.py` rebuilds `assets/content.json`
  from `apps/energy/content/paper1..4.json`.
- Run: `flutter run -d chrome` or `flutter run -d <android device>`.
- Web build: `flutter build web --release --no-web-resources-cdn`
  (CanvasKit is served from the site, not Google's CDN).
- Backend: USS Supabase project, schema `energy_manager`, RPC `em_sync`.
  Override with `--dart-define=SUPABASE_URL=… --dart-define=SUPABASE_ANON_KEY=…`.
- Android sign-in redirect: `com.calecutech.energymanager://login-callback`
  must be listed in Supabase Auth → URL configuration.
- CI: `.github/workflows/energy-app.yml` builds the APK and the web bundle.
