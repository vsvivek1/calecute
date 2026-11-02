# PMP Prep tech stack

| Need | Choice | Why |
|---|---|---|
| Web + app UI | Next.js 16, React 19 | One codebase for the site that sells and the app that teaches |
| Android | Capacitor 7 (static export) | Reuses the web pages; Play package `com.calecutech.pmpprep` |
| Spaced repetition | `ts-fsrs` 5.4.2 | Official FSRS port for TypeScript; same algorithm family as Recallio's Dart `fsrs` |
| Alerts | `@capacitor/local-notifications` 7.0.7 | Study-time alerts without a push server |
| Back button | `@capacitor/app` 7.1.2 | Keeps the back button from skipping a card |
| Read aloud | `@capacitor-community/text-to-speech` 6.1.0; Web Speech API on web | Android WebView has no reliable speech synthesis |
| Payments | Stripe Checkout, HMAC licence keys | No accounts needed |
| Storage | `localStorage` | Offline-first; no learner data leaves the device |

Recallio's standard stack is Flutter + Supabase. PMP Prep stays on Next.js
because its sales happen on the website; see `UPGRADE_PLAN.md`.
