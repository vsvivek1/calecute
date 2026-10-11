# Geological Assistant on the USS Supabase project

The course lives in its own schema, `geological_assistant`, inside the USS project
(`vspbbwpehvenmxddgbhm`). Nothing in `public` or `auth` is touched. Move it later with
`pg_dump -n geological_assistant`.

- `0001_geological_assistant_schema.sql`: tables, RLS, `has_active_subscription()`, course row.
  **Applied 11 Oct 2026** (with the 5 units).
- `seed/seed_01..12.sql`: 1,854 cards, 1,212 questions, 3,602 question links. Not applied yet.
  Run in order in the SQL editor (each part is about 250 KB), or `psql "$DB_URL" -f` each file.
  Safe to re-run.

To use it from apps:
1. Dashboard > Project Settings > Data API > Exposed schemas: add `geological_assistant`.
2. supabase-js: `createClient(url, key, { db: { schema: 'geological_assistant' } })`.
3. Edge functions (`razorpay-create-order`, `razorpay-webhook`) read `courses.price_minor` and
   write `subscriptions` in this schema via the service role.

Content (`cards`, `questions`, `question_cards`) is readable only by signed-in users with an
active subscription (RLS). `courses` and `modules` are public for the shop page.
