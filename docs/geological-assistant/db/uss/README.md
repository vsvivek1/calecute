# Geological Assistant on the USS Supabase project

The course lives in its own schema, `geological_assistant`, inside the USS project
(`vspbbwpehvenmxddgbhm`). Nothing in `public` or `auth` is touched. Move it later with
`pg_dump -n geological_assistant`.

- `0001_geological_assistant_schema.sql`: tables, RLS, `has_active_subscription()`, course row.
  **Applied 11 Oct 2026** (with the 5 units).
- `seed/seed_01..12.sql`: 1,854 cards, 1,212 questions, 3,602 question links.
  **Applied 11 Oct 2026** and checked row by row against the source. Safe to re-run.
- `0002_payment_orders.sql`: Razorpay orders table. **Applied 11 Oct 2026.**
- `0004_coupons.sql`: coupons (admin codes 1% to 99% off, spin-wheel codes 10% to 30% off, one spin per
  account, valid 7 days), `quote_price()`, `spin_wheel()`, admin RPCs for the study page's `#/admin` screen.
  Admins are rows in `geological_assistant.admins` (email). Apply **before** deploying the new
  `ga-razorpay-create-order` (it writes `coupon_code` and `list_price_minor`).
- `functions/ga-razorpay-create-order`, `functions/ga-razorpay-webhook`: **deployed 11 Oct 2026**
  to the USS project. They use only this schema. Until the Razorpay secrets are set they answer
  503 and change nothing.

To use it from apps:
1. Dashboard > Project Settings > Data API > Exposed schemas: `geological_assistant` (done).
2. supabase-js: `createClient(url, key, { db: { schema: 'geological_assistant' } })`.

To take payments (owner steps):
1. USS project > Edge Functions > Secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET` (test keys first).
2. Razorpay > Webhooks: `https://vspbbwpehvenmxddgbhm.supabase.co/functions/v1/ga-razorpay-webhook`,
   events `payment.captured` and `refund.processed`, same secret as above.
   Razorpay sends every event to every webhook. This one ignores payments for courses not in this
   schema. The Psc Prep `razorpay-webhook` does not filter, so it would fail on Geological Assistant
   payments if it is ever live on the same Razorpay account at the same time.
3. Console: deploy `apps/recallio` as its own Vercel project (for example
   `geo.recallio.calecutech.com`) with the USS URL and publishable key plus
   `NEXT_PUBLIC_SUPABASE_SCHEMA=geological_assistant`, `NEXT_PUBLIC_PAY_FUNCTION=ga-razorpay-create-order`,
   `NEXT_PUBLIC_FREE_TIER=off`. See `apps/recallio/.env.example`.
4. USS Auth > URL Configuration: add `https://<console host>/auth/callback**`.
5. Point `consoleUrl` in `apps/web/public/geological-assistant/config.js` at that host.
6. One test payment, then `salesOpen: true`.

Content (`cards`, `questions`, `question_cards`) is readable only by signed-in users with an
active subscription (RLS). `courses` and `modules` are public for the shop page.
