# Referral scheme: how an app plugs in

One referral system is shared by every Calecute app. It lives in `apps/api`
(the agent-programme API at `api.calecutech.com`) and is reached over HTTP
only. This document is the integration contract for a product app; the
OpenAPI document at `apps/api/openapi/openapi.json` is the authoritative
schema.

## The rules

Two tiers of referrer, one code namespace, one ledger.

| | USER tier | SELLER tier |
|---|---|---|
| Who | every signed-in user of any app, automatically | the vetted commission agents (`agents.tier = 'SELLER'`) |
| Code | `RF-` + 6 characters, e.g. `RF-7K2M9Q` | `CA-<district>-<seq>`, e.g. `CA-KKD-000123` |
| Paid product | **1 % of the fee** on every payment the friend makes (`products.user_rate_bps`, default 100) | **10 % to 30 % of the fee**, set per product (`products.seller_rate_bps`, 1000..3000) |
| Free product | **1 diamond** per friend who joins (`diamond_awards`) — recognition, never money | nothing (sellers do not sell free products) |
| Payout | existing commissions → payout pipeline, 2 % TDS under 194H | unchanged |

"Fee" means the net payment: gross − GST − gateway fee (`payments.net_paise`).
A product is free when `products.fee_paise IS NULL`.

Attribution is **first code wins**: one row per customer, forever. No
self-referral. Every attempt is logged.

The public leaderboard (`/rewards` on the website, `GET /public/leaderboard`)
ranks both tiers across all apps with names masked to first name + last
initial.

## Getting a key

Each product has API keys of two kinds. Only the SHA-256 is stored; the
plaintext is shown once.

| kind | prefix | where it lives | may call |
|---|---|---|---|
| `client` | `ck_live_…` | inside the mobile app / browser bundle (treated as public) | `POST /members`, `GET /members/{ref}`, `POST /attribution/claim` |
| `server` | `sk_live_…` | the product's backend only | all of the above **and** `POST /payments` |

Mint one:

```sh
# offline, against DATABASE_URL
cd apps/api
node --env-file-if-exists=.env.local scripts/mint-api-key.mts quizkerala client "Android 1.0"
node --env-file-if-exists=.env.local scripts/mint-api-key.mts quizkerala server "billing worker"

# or over HTTP as a SUPER_ADMIN
curl -X POST https://api.calecutech.com/api/v1/admin/products/42/api-keys \
  -H "Authorization: Bearer <super admin jwt>" -H "Content-Type: application/json" \
  -d '{"kind":"client","label":"Android 1.0"}'
```

Revoke with `DELETE /admin/products/{id}/api-keys/{keyId}`. Send the key as
`X-Api-Key: ck_live_…` on every call. Every call is scoped to that one
product by Postgres row-level security (`app.role = 'SERVICE'`,
`app.product_id = <id>`): a key cannot read another product's members or
customers, and no key can read payout profiles or seller contact details.

A SUPER_ADMIN JWT is still accepted on `/attribution/claim` and `/payments`;
such a caller names the product in the body (`productSlug` / `productId`).

## Identifiers

The app passes **its own user id** everywhere. The API namespaces it as
`<product_slug>:<id>`:

- `users.external_ref` for a member (the referrer),
- `customers.external_ref` for a friend who joined (the referred).

The same app user is therefore both a potential referrer and a potential
customer, under the same id. Sending `customerExternalRef` equal to the code
owner's own id is refused as `SELF_REFERRAL`.

## What to call, and when

### 1. On sign-in → `POST /members`

Gives the user their invite code. Idempotent; call it every sign-in.

```sh
curl -X POST https://api.calecutech.com/api/v1/members \
  -H "X-Api-Key: ck_live_…" -H "Content-Type: application/json" \
  -d '{"externalRef":"firebase-uid-123","name":"Vivek Sankaran","email":"v@example.com","pictureUrl":null}'
```

```json
{
  "code": "RF-7K2M9Q",
  "link": "https://calecutech.com/r/RF-7K2M9Q?app=quizkerala",
  "whatsappShareUrl": "https://wa.me/?text=…",
  "qrUrl": "https://api.calecutech.com/api/v1/public/qr?code=RF-7K2M9Q&app=quizkerala",
  "tier": "USER",
  "status": "APPROVED",
  "stats": {
    "friendsJoined": 3, "payingFriends": 1, "diamonds": 2,
    "earnings": { "pendingPaise": 490, "paidPaise": 0, "lifetimePaise": 490, "currency": "INR" }
  },
  "product": { "slug": "quizkerala", "name": "QuizKerala", "isFree": true, "userRateBps": 100 }
}
```

201 on first creation, 200 after. `GET /members/{externalRef}` returns the
same shape (404 until the POST has happened). Show `code`, `link` and the
QR; the `stats` block is the "invite friends" screen.

### 2. On join with a code → `POST /attribution/claim`

When a new user signs up and a code is present (typed, from the link, from
the Play install referrer, or scanned), claim it. Do this **after** the
user's own `POST /members` if you want both; order does not matter.

```sh
curl -X POST https://api.calecutech.com/api/v1/attribution/claim \
  -H "X-Api-Key: ck_live_…" -H "Content-Type: application/json" \
  -H "Idempotency-Key: join-firebase-uid-456" \
  -d '{"customerExternalRef":"firebase-uid-456","customerName":"Anu Thomas","agentCode":"RF-7K2M9Q","source":"install_referrer"}'
```

Responses (`AttributionResult`):

- `201 {"attributed":true,"agentCode":"RF-7K2M9Q","tier":"USER","customerId":9,"diamondAwarded":true}`
  — on a free product the referrer just earned a diamond; on a paid one
  nothing happens until step 3.
- `200 {"attributed":false,"reason":"UNKNOWN_CODE" | "AGENT_NOT_APPROVED" | "SELF_REFERRAL" | "ALREADY_ATTRIBUTED", …}`
  — `ALREADY_ATTRIBUTED` carries `heldBy` and `heldSince`.

`Idempotency-Key` is optional here (recommended). Codes are
case-insensitive; `CA-…` seller codes and `RF-…` member codes both work.

### 3. On payment → `POST /payments` (server key only)

From the backend that confirms a payment (webhook handler, not the app).
`Idempotency-Key` is **required**; `externalRef` must be your unique payment
id.

```sh
curl -X POST https://api.calecutech.com/api/v1/payments \
  -H "X-Api-Key: sk_live_…" -H "Content-Type: application/json" \
  -H "Idempotency-Key: razorpay_pay_Abc123" \
  -d '{"externalRef":"pay_Abc123","customerExternalRef":"firebase-uid-456","grossPaise":59900,"gstPaise":9136,"gatewayFeePaise":1200,"paidAt":"2026-10-18T09:30:00Z"}'
```

```json
{
  "recorded": true, "paymentId": 77, "commissionAccrued": true, "commissionId": 31,
  "agentCode": "RF-7K2M9Q", "tier": "USER", "product": "pmp-prep",
  "breakdown": { "basePaise": 49564, "rateBps": 100, "grossCommissionPaise": 495, "tdsRateBps": 200, "tdsPaise": 9, "netCommissionPaise": 486 },
  "replayed": false
}
```

Amounts are integer paise. The rate is chosen server-side from the
attribution's tier and the product's rates; the app never sends a rate.
`commissionAccrued:false` with a `reason` (`NO_ATTRIBUTION`,
`AGENT_NOT_APPROVED`, `AGENT_NOT_PLACED`) still records the payment.
404 means the customer was never claimed (joined without a code).

## Links, QR and the Play install referrer

A member's link is `https://calecutech.com/r/<CODE>?app=<slug>`. The website
(`apps/web/src/app/r/[code]/route.ts`) logs the click and redirects:

- Android user-agent and the product has `play_url` →
  `play_url&referrer=ref%3D<CODE>`. The Play Store hands
  `ref=<CODE>` to the app on first launch through the
  [Install Referrer API](https://developer.android.com/google/play/installreferrer);
  parse `referrer`, read `ref`, and call step 2 with `source: "install_referrer"`.
- otherwise the product's `web_url` with `?ref=<CODE>` appended;
- otherwise `/apps/<slug>?ref=<CODE>`; unknown app → `/?ref=<CODE>`.

A web app should read `ref` from the URL on landing, keep it until sign-up,
then call step 2 with `source: "referral_link"`.

QR: `GET /public/qr?code=<CODE>&app=<slug>[&format=svg]` is a public PNG/SVG
of the link (also in `qrUrl` of the member response). Nothing to ship in the
app.

Seller links keep their existing form, `https://calecutech.com/agents?ref=CA-…`.

## Leaderboard and product facts (public, no key)

- `GET /public/leaderboard?app=<slug>&limit=50` → `{ rows: [{ rank, displayName, tier, diamonds, friendsJoined, payingFriends, earnedNetPaise }] }`, cached 60 s. Omit `app` for all products.
- `GET /public/products` / `GET /public/products/{slug}` → fee, rates, `webUrl`, `playUrl`, `androidPackage`.

## Admin

- `PATCH /admin/products/{id}` (SUPER_ADMIN): `feePaise` (null = free),
  `sellerRateBps` 1000..3000, `userRateBps` 0..1000, `webUrl`, `playUrl`,
  `androidPackage`, `active`. Audited.
- `GET|POST /admin/products/{id}/api-keys`, `DELETE …/api-keys/{keyId}`.
- `GET /agent/earnings` (sellers, web dashboard) returns `terms.rates`, the
  rate per product for that agent's tier.

## Data model (apps/api/drizzle/0009_referral_tiers.sql)

- `agents.tier` (`USER|SELLER`, default SELLER), `display_name`,
  `source_product_id`; seller-only columns nullable with
  `agents_seller_fields_check`.
- `users.external_ref` (unique), `google_sub` nullable; one or the other.
- `products.fee_paise`, `seller_rate_bps`, `user_rate_bps`, `web_url`,
  `play_url`, `android_package`.
- `product_api_keys`, `diamond_awards` (unique per customer),
  `referral_clicks`, `customers.product_id`, `commissions.tier`.
- RLS role `SERVICE` with `app.is_service()` / `app.current_product_id()`;
  SECURITY DEFINER helpers `app.agent_for_referral`, `app.stamp_first_sale`,
  `app.referrer_stats`, `app.public_leaderboard`.

## After deploying

```sh
npm run db:migrate --workspace=apps/api   # applies 0009
npm run db:seed    --workspace=apps/api   # products with fees and URLs
npm run mint-api-key --workspace=apps/api -- quizkerala client "Web"
```

Then set fees and rates for paid products with `PATCH /admin/products/{id}`.
