# Energy Manager (Recallio) — tech stack

| Need | Choice | Why |
|---|---|---|
| Web app | Next.js 16 (App Router), React 19 | Same stack as the rest of the calecute monorepo; Vercel hosting. |
| Auth | Supabase Auth, Google sign-in (`@supabase/ssr`) | Shared with the USS apps; one Google account works across them. |
| Database and engine | Postgres (USS Supabase project), PL/pgSQL | The plan, sittings and scheduler run next to the data, so every device sees the same sitting and no logic ships to the browser. |
| Spaced repetition | FSRS-5 written in SQL (`energy_manager.fsrs_next`) | The Recallio rules ask for FSRS. No maintained Postgres FSRS package exists; the formulas are short and the default weights are in `energy_manager.config`. |
| Alerts | Browser Notification API + service worker (`public/sw.js`) | Works while a tab or the installed PWA is running. Web Push for closed-browser alerts is a later step. |
| Read aloud | Web Speech API (`speechSynthesis`) | Built into browsers; nothing to install. |
| Referral | Calecute API (`src/lib/referral.ts`) | Shared referral scheme; key stays on the server. |
