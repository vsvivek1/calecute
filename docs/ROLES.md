# Role and permission matrix

Three roles, held on the `users.role` column. Nothing else grants access: there
is no allowlist of email addresses in application code, no role in a cookie, and
no client-side check that matters.

How a role is decided, in order:

1. A user signs in with Google. The API verifies the ID token or authorization
   code **server-side** and looks up (or creates) the user row.
2. A brand new account is always `AGENT`. Elevation happens only through
   `POST /api/v1/admin/users`, which is `SUPER_ADMIN` only and audited.
3. The role is written into a short-lived signed JWT. Every request re-derives
   it from that signature.
4. Inside the request, the role and user id are stamped onto the database
   transaction, and **Postgres row-level security decides what rows exist**.

The last step is the important one. A modified client can claim anything it
likes; it changes what the client draws, not what the database returns.

---

## Summary

| | AGENT | DISTRICT_ADMIN | SUPER_ADMIN |
|---|---|---|---|
| **Scope** | own records only | assigned districts | everything |
| Scope backed by | `agents.user_id` | `admin_districts` rows | the JWT claim alone |
| Survives a forged token | yes | yes | **no** — see below |

`DISTRICT_ADMIN` is *table-backed*: the claim is worthless without a matching
`admin_districts` row, so a forged token grants nothing. `SUPER_ADMIN` is
*claim-backed*: the database trusts `app.role` on its own. Reaching that state
already requires a validly signed super-admin token, so the exposure is the
signing key, not the model — but the asymmetry is deliberate and is asserted in
`scripts/verify-rls.mts` so nobody discovers it by accident.

---

## Read

| Data | AGENT | DISTRICT_ADMIN | SUPER_ADMIN | PUBLIC |
|---|---|---|---|---|
| Districts, blocks, local bodies, wards | all | all | all | **all** |
| Slot availability (counts only) | yes | yes | yes | **yes** |
| Own user record | yes | yes | yes | — |
| Other users | — | agents in scope | all | — |
| Own agent record | yes | — | — | — |
| Agent records | own | in scope | all | — |
| Agent qualifications | own | in scope | all | — |
| Own payout profile (masked) | yes | — | — | — |
| Payout profiles (masked) | own | in scope | all | — |
| **PAN or bank plaintext** | **never** | **never** | **never** | **never** |
| Own customers | yes | — | — | — |
| Customers | attributed to them | in scope | all | — |
| Payments | own commissions | in scope | all | — |
| Commissions | own | in scope | all | — |
| Attribution attempts | own | in scope | all | — |
| Products | assigned | all | all | — |
| Product sales material | assigned only | all | all | — |
| Payout batches | — | yes | yes | — |
| Review flags | — | in scope | all | — |
| Analytics events | — | yes | yes | write only |
| **Audit log** | — | **no** | yes | — |
| Admin users and assignments | — | own row | all | — |

Geography is public on purpose: the recruitment page renders district and
panchayat pickers before anyone signs in. It carries names and ids, nothing
about people.

Slot counts are computed by `SECURITY DEFINER` functions
(`app.filled_slots`, `app.waitlist_size`, `app.slot_usage`) which return
**integers only**. Without them an anonymous visitor counting `agents` sees
zero, and the public page reports every panchayat as empty.

---

## Write

| Action | AGENT | DISTRICT_ADMIN | SUPER_ADMIN |
|---|---|---|---|
| Create own agent application | yes | — | — |
| Edit own name and occupation | yes | — | — |
| Change own district / panchayat / ward | **no** | **no** | **no** |
| Save own qualifications | yes | — | — |
| Join a waitlist | yes | — | — |
| Submit own PAN / bank / UPI | yes | — | — |
| Verify own mobile | yes | — | — |
| Approve / reject / suspend an agent | — | in scope | all |
| Verify or reject a PAN | — | in scope | all |
| Cancel a duplicate PAN (forfeits commission) | — | **no** | yes |
| Assign products to an agent | — | in scope | all |
| Bulk assign products by filter | — | in scope | all |
| Change slot capacity | — | in scope | all |
| Open / close a panchayat | — | in scope | all |
| Message agents | — | in scope | all |
| Resolve review flags | — | in scope | all |
| Create a payout batch | — | **no** | yes |
| Mark a batch paid | — | **no** | yes |
| Record a payment / accrue commission | — | — | yes (service) |
| Claim an attribution | — | — | yes (service) |
| Create or change an admin | — | — | yes |
| Seed or edit geography | — | — | migration role only |
| Edit or delete an audit entry | **nobody** | **nobody** | **nobody** |

Nobody may change an agent's geography, including a super admin, through the
API. Moving a panchayat vacates one slot and consumes another, rewrites every
coverage report, and invalidates an issued agent code. It is a deliberate gap.

Attribution rows have **no UPDATE or DELETE policy at all**. First code wins is
enforced by a unique constraint on `customer_id` plus the absence of any way to
change it.

---

## Where each rule lives

| Rule | Enforced by |
|---|---|
| Role in the token matches the database | `lib/auth/tokens.ts`, re-derived per request |
| Endpoint requires a role | `requireRole` in `lib/auth/context.ts` |
| District scoping | RLS policies via `app.visible_districts()` |
| Report district scoping | `geoWhere()` — mandatory, uses the same function |
| Agent sees only own rows | RLS via `app.current_agent_id()` |
| Audit log immutability | no policy + revoked privilege + `BEFORE UPDATE OR DELETE` trigger |
| One account per mobile | unique index, translated by `db/constraints.ts` |
| One account per PAN | unique index on a keyed HMAC fingerprint |
| First code wins | unique constraint on `attributions.customer_id` |
| Slot capacity | advisory lock + count inside the signup transaction |

Uniqueness is enforced by the **index**, not by a pre-check. A pre-check runs
under RLS and cannot see other people's rows, so it would always pass. The
constraint violation is translated into the right API error instead.

---

## Verifying this document

`scripts/verify-rls.mts` asserts the table above against a real database, as the
unprivileged application role, and rolls back. 23 assertions, run by
`npm run verify --workspace=apps/api`.

It exists because the first version of this schema enforced **none** of it: the
connecting role was a superuser, and superusers bypass row-level security
silently. Every policy was inert and every test would have passed.
