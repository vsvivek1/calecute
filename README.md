# calecutech.com

Marketing site and the Kerala commission agent programme.

Two independently deployable Next.js apps in one repository:

| | | Holds a DB credential |
|---|---|---|
| `apps/web` | The public site, the recruitment page, agent and admin areas | no |
| `apps/api` | REST API at `/api/v1`, the only thing that touches Postgres | yes |

The frontend reaches the API over HTTP and nothing else. It imports no server
module and holds no connection string, so it can be replaced without touching
the API — and an Android app can be written against the same endpoints with no
API change.

---

## Before this can go live

Work through this list. Items marked **blocking** stop the product functioning.

### 1. Provision Postgres — blocking

Neon via the Vercel Marketplace is the intended target. Any Postgres 14+ works;
`pg_trgm` is the only extension required.

```bash
vercel integration add neon      # or bring your own DATABASE_URL
```

**The role in `DATABASE_URL` must not be a superuser.** Superusers bypass
row-level security silently — every policy becomes inert and nothing errors.
Requests drop to the unprivileged `calecute_app` role regardless, but do not
rely on that alone.

### 2. Set environment variables — blocking

`apps/api` (see `apps/api/.env.example`):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Non-superuser role |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Web OAuth client |
| `GOOGLE_ANDROID_CLIENT_ID` | Optional, accepted as a second audience |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `PII_ENCRYPTION_KEY` | `openssl rand -base64 32` — **losing this loses every stored PAN** |
| `PII_FINGERPRINT_KEY` | `openssl rand -base64 32`, different from the above |
| `JWT_ISSUER`, `JWT_AUDIENCE` | Must match between deployments |
| `CORS_ALLOWED_ORIGINS` | Exact frontend origins, comma separated |
| `PUBLIC_WEB_ORIGIN` | Used to build agent referral links |

`apps/web` (see `apps/web/.env.example`):

| Variable | Notes |
|---|---|
| `API_BASE_URL` | Server-side calls, including `/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | Browser calls, same value |
| `NEXT_PUBLIC_SITE_ORIGIN` | Canonical URLs and Open Graph |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Public client id only — never the secret |

The API refuses to start if any of its variables is missing. That is deliberate:
a missing signing key should stop a deployment, not produce an app that issues
unsigned tokens.

### 3. Configure Google OAuth — blocking

Authorised redirect URI: `https://<your-domain>/auth/callback`
(and `http://localhost:3000/auth/callback` for development).
Scopes: `openid email profile`. Nothing else is requested.

### 4. Migrate and seed — blocking

```bash
npm run db:migrate --workspace=apps/api
npm run db:seed    --workspace=apps/api
```

Migrations do **not** run automatically on deploy. `0001_rls.sql` and its
successors change access control and should not ride along with a routine
deploy.

The seed is idempotent. It creates Kerala, the 14 districts, the initial terms
version, and the two `SUPER_ADMIN` accounts (`info@calecutech.com`,
`vs.vivek1@gmail.com`) — attached to a real Google identity on first sign-in. It
prints a completeness report against official totals.

### 5. Finish the geography — blocking for towns

**941 gram panchayats are loaded. The 87 municipalities and 6 corporations are
not**, so nobody in a town can apply. One download fixes it — see
[docs/GEOGRAPHY.md](docs/GEOGRAPHY.md).

### 6. Supply the remaining content

Two placeholders render as visible red-dashed tokens so they cannot ship
unnoticed. Both live in `apps/web/src/lib/agents/content.ts`:

- `company.whatWeDo` — one sentence, Malayalam and English
- `company.registeredOffice` — the address as filed

Already supplied: CIN `U62013KL2026OPC105471`, WhatsApp contact 8547985289,
WhatsApp channel link.

### 7. Wire an SMS provider

Mobile verification **throws in production** until one exists. See
`apps/api/src/lib/otp.ts`. An Indian DLT-registered sender is required, and the
template must be registered before a single message is delivered.

### 8. Choose an analytics tool

Funnel events are recorded in our own `analytics_events` table, which carries no
PII and powers the funnel report. If you want a third-party tool, add it as a
second sink in `POST /api/v1/events`.

### 9. Add products

The catalogue is empty. Assignment, sales material and the agent dashboard all
work; there is nothing to assign yet.

### 10. Decide a retention period

The brief asks for a stated retention period for applicants never onboarded.
`DELETE /api/v1/me` tombstones on request, but nothing expires automatically.

---

## Deploying

Two Vercel projects from this repository:

| Project | Root directory |
|---|---|
| API | `apps/api` |
| Web | `apps/web` |

Build command is the default for both. The API build regenerates the OpenAPI
document and the Postman collection before compiling.

---

## Developing

```bash
npm install
createdb calecute_dev
cp apps/api/.env.example apps/api/.env.local     # then fill it in
cp apps/web/.env.example apps/web/.env.local

npm run db:migrate --workspace=apps/api
npm run db:seed    --workspace=apps/api

npm run dev:api --workspace-root    # API on :3001
npm run dev     --workspace-root    # web on :3000
```

Google credentials are placeholders locally, so sign-in will not complete. To
reach the authenticated pages:

```bash
npm run dev:session --workspace=apps/api -- vs.vivek1@gmail.com
```

It prints a cookie to paste into the browser console. Development only.

### Commands worth knowing

| Command | Does |
|---|---|
| `npm run verify --workspace=apps/api` | Typecheck, regenerate the spec, check route coverage, run the RLS suite |
| `npm run smoke --workspace=apps/api` | 68 end-to-end assertions against a running API |
| `npm run db:verify --workspace=apps/api` | 23 row-level-security assertions, rolled back |
| `npm run geo:convert --workspace=apps/api` | LGD exports → loader CSV |
| `npm run postman --workspace=apps/api` | Regenerate the Postman collection |
| `npm run api:types --workspace=apps/web` | Regenerate frontend types from the spec |
| `npm run build:og --workspace=apps/web` | Rebuild the Open Graph image |
| `npm run build:font --workspace=apps/web` | Re-subset the Malayalam font |

---

## How it fits together

**The contract is `apps/api/openapi/openapi.json`.** The frontend's types are
generated from it, the Postman collection is generated from it, and
`check-spec-coverage.mjs` fails the build if a route is undocumented or a
documented path has no route.

**Authorisation is in the database.** Every request opens a transaction, drops
to an unprivileged role, and stamps the caller's identity onto it. Postgres
row-level security decides what rows exist. No endpoint writes a district
filter by hand.

**Money is integer paise everywhere.** Commission arithmetic lives in one module
and is re-checked by database `CHECK` constraints.

**Endpoints that write money require an `Idempotency-Key`.**

---

## Reading further

| | |
|---|---|
| [docs/ROLES.md](docs/ROLES.md) | Role and permission matrix, and where each rule is enforced |
| [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) | Every judgement call, every override, every known limitation |
| [docs/GEOGRAPHY.md](docs/GEOGRAPHY.md) | Data sourcing, completeness, how to finish it |
| `apps/api/postman/` | Generated Postman collection, 54 requests |
