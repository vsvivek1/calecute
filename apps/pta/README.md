# Calecutech PTA: web

Attendance, fees, homework, activities, grades, complaints, sample tests,
quizzes and notices, for parents, class teachers and the school office. The
Flutter app in `apps/pta_mobile` is the same product on a phone.

Why it is shaped this way: [docs/PTA_MARKET_STUDY.md](../../docs/PTA_MARKET_STUDY.md).

| Who | Lands on | Can |
|---|---|---|
| Parent | `/` Today | See each child's day, mark homework done, request leave, answer permission slips, take quizzes, raise and follow complaints, open receipts |
| Class teacher | `/teach` | Take the register, approve leave, post homework and see who has seen it, enter and publish marks, set quizzes, share sample tests, post class notices and activities |
| Office (admin) | `/office` | Dashboard, bill fees and record payments, handle complaints, add students, parents, classes and staff, post whole-school notices |

One person can hold several roles (a teacher who is also a parent); a switcher
appears in the top bar.

## How it fits together

```
apps/pta/supabase/migrations/0001_pta.sql   tables + row-level security
apps/pta/supabase/migrations/0002_api.sql   pta.* functions: the API
apps/pta/supabase/migrations/0003_hardening.sql  fixes found on first deploy
            │
            ├── apps/pta (this app)          calls them with supabase-js
            └── apps/pta_mobile (Flutter)    calls them with supabase_flutter
```

**The functions are the contract.** Every screen reads one function and every
button calls one. They run as the signed-in user, so row-level security
decides what anyone sees; neither app holds a rule of its own.

**Identity is the email address.** The office adds a child with a parent's
email; that parent sees the child the first time they sign in. No codes to
hand out, nothing to type.

**Money is integer paise.** Receipts are numbered by the database.

## Demo mode

With no Supabase variables and `PTA_DEMO=1`, the app runs the same migrations
and seed in an in-process Postgres ([PGlite](https://pglite.dev)) and the
sign-in page offers Parent / Class teacher / School office. Row-level security
applies exactly as it does live. Data resets on every cold start.

The demo also serves `POST /api/demo/rpc`, which is how the Flutter app's
demo build reaches the sample school. It answers 404 on a real deployment.

```bash
PTA_DEMO=1 npm run dev --workspace=apps/pta    # localhost:3200
```

## Going live

1. **Supabase project.** Use a new one or an existing one; everything lives
   in the `pta` schema.
   ```bash
   psql "$DATABASE_URL" -f apps/pta/supabase/migrations/0001_pta.sql
   psql "$DATABASE_URL" -f apps/pta/supabase/migrations/0002_api.sql
   psql "$DATABASE_URL" -f apps/pta/supabase/migrations/0003_hardening.sql
   ```
   Then **Settings → API → Exposed schemas: add `pta`.** Without it both apps
   get "schema not found".
2. **First school and admin.** Edit the emails in `supabase/seed.sql` (or
   insert one `pta.schools` row and one `pta.staff` row with `role = 'admin'`)
   and run it. Everything else is done from `/office`.
3. **Auth.** Enable Google (redirect `https://<host>/auth/callback`) and
   Email OTP for the phone app. Add the web origin and
   `com.calecutech.pta://login-callback` to Authentication → URL
   Configuration → Redirect URLs.
4. **Vercel project** with root directory `apps/pta`, and
   `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   Suggested host: `pta.calecutech.com` (CNAME to `cname.vercel-dns.com`).
   A second project with `PTA_DEMO=1` makes a public demo.

## Checks

```bash
npm run typecheck --workspace=apps/pta
PGHOST=... npm run db:test --workspace=apps/pta   # migrations + seed + 97 assertions, rolled back
```

`db:test` needs a local Postgres superuser. It runs the row-level security
suite (`tests/rls.sql`: who can see and change what) and calls every API
function as the role that uses it (`tests/api.sql`).
