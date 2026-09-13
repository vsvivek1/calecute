# Assumptions

Every judgement call made while building this that was not specified, plus the
places where the brief was overridden and by whom. Read the first two sections
before going live; the rest is for whoever maintains this next.

---

## 1. Things that are still missing or wrong

These will bite. Nothing else in this document will.

| | Status |
|---|---|
| **Urban local bodies** — 87 municipalities, 6 corporations | **Not loaded.** Applicants in towns type the name instead (see below) and must be placed by hand before approval. |
| **Wards** | **Not loaded.** Ward is optional at signup, so this degrades rather than blocks. |
| Registered office address | Placeholder, rendered visibly on the page |
| One sentence on what the company does | Placeholder, rendered visibly on the page |
| Product catalogue | Empty. Assignment works; there is nothing to assign. |
| SMS provider | Not configured. Mobile verification **throws in production**. |
| Analytics tool | None chosen. Events are recorded in our own table. |
| Retention period for unapproved applicants | Placeholder in the privacy policy — someone must decide the number |
| Email / notifications | None. Admin messages are in-app only. |

The two geography gaps are one download away: LGD → Download Directory →
*State and District Wise Urban Local Bodies* → Kerala. See `docs/GEOGRAPHY.md`.

---

## 2. Where the brief was overridden

| Brief said | What was built | Who decided |
|---|---|---|
| Public page under 150KB including fonts | ~238KB critical path, ~368KB settled | Client chose the 3D/WebGL direction over the quiet page that met the budget |
| Public page readable with JS disabled | Requires JavaScript | Same decision |
| "Quiet, not loud. No hero gradients" | Dark WebGL treatment, later stripped of glow at the client's request | Same decision |
| CIN prominent, verification invited | CIN is a small footer line with a plain MCA link | Client: highlighting it "can cause suspicion" |
| Footer: contact email and number | WhatsApp only, 8547985289 | Client |
| Report exports to CSV **and PDF** | Both, but **PDF carries English only** | Technical: pdf-lib does not shape Indic scripts (see §5) |

The first version of the public page was 42.7KB with zero JavaScript and met
every performance line in the brief. It is in the git history at `2604a5b` if
the budget ever matters more than the visual direction.

### Lighthouse, mobile, `/agents`

| | |
|---|---|
| Performance | **97** |
| Accessibility | **100** |
| Best practices | **100** |
| SEO | **100** |
| First Contentful Paint | **0.9s** (brief asked for under 1.5s) |
| Largest Contentful Paint | 2.5s |
| Total Blocking Time | 100ms |
| Cumulative Layout Shift | **0** |

FCP still meets the brief despite the WebGL build, because Three.js is loaded
after first paint and skipped entirely on reduced-motion, save-data, 2g and
low-memory devices. The page weight target is the line that was not met.

Desktop performance scores lower (73) than mobile, which looks wrong but is
not: on an unthrottled connection Three.js downloads and parses immediately
rather than waiting for an idle callback, so blocking time lands inside the
measurement window.

---

## 3. Interpretation of the brief

**"10 agents per panchayat"** is a default, not a constant. `slot_capacity` is
per local body and adjustable by an admin, because the brief also asks for a
"adjust slot count for a panchayat" action. Municipalities and corporations get
the same default.

**"Panchayat"** in the UI means any local body — gram panchayat, municipality or
corporation. They live in one table with a `type`, so the picker and every
report treat them uniformly, as the brief required.

**A slot is consumed by `PENDING_REVIEW` and `APPROVED` agents.** A rejected or
suspended agent frees theirs. Otherwise a burst of spam applications would lock
a panchayat until someone processed them all.

**Commission is calculated on `gross − GST − gateway fee`,** floored to the
paisa at each step. TDS is 2% of the gross commission, not of the payment. Both
are re-checked by a database `CHECK` constraint, so a bug in the arithmetic
cannot write an inconsistent ledger row.

**"Zero sales after 30/60/90 days"** counts from signup, not from approval, and
looks at `first_sale_at`.

**Attribution locks at first claim and is never reassignable** — no UPDATE
policy exists on the table. Rejected claims are logged with the code as
presented, so a dispute is settled from data.

**PAN duplication forfeits commission**, as the accepted terms say. That is
destructive, so it requires `SUPER_ADMIN` and writes a full audit entry.

---

## 4. Security decisions

**The application never connects as a privileged role.** Every request opens a
transaction and issues `SET LOCAL ROLE calecute_app` before touching a row. This
exists because the first implementation connected as a superuser, and superusers
bypass row-level security **silently** — every policy was inert and nothing
failed. Do not remove it, and do not give `calecute_app` `BYPASSRLS`.

**Access tokens are stateless; refresh tokens are not.** Access tokens live 15
minutes and are never checked against the database. Refresh tokens are stored
hashed, rotate on every use, and presenting a rotated one revokes the whole
chain for that user — the only safe response, since a replay and a theft are
indistinguishable.

**Sign-in uses the authorization-code flow, not Google Identity Services.** GIS
would add ~90KB and make the most important action on the page depend on a
third-party script loading. A redirect works as soon as the HTML arrives.

**IP addresses are never stored.** Rate limiting and abuse signals use a
truncated prefix — /24 for IPv4, /48 for IPv6 — specific enough to catch one
person farming accounts, coarse enough not to identify a household.

**Device fingerprints are hashed before storage** and are treated as a weak
signal. They raise a flag for a human; they never block. A shared terminal in an
Akshaya centre is exactly the setting this programme recruits from.

**The signup timing check is server-timed.** The API issues a signed,
short-lived form token and measures elapsed time against its own clock. Asking
the client how long the form took produces a number a bot chooses.

**No CAPTCHA.** The brief ruled it out and the reasoning holds: it costs more
real applicants on a low-end phone than it prevents abuse.

**Rate limiting is Postgres-backed, not Redis.** One upsert per request against
a table that already exists, versus a second vendor and a second failure mode,
for traffic that peaks in the low hundreds per minute. The interface is narrow
enough to swap.

---

## 5. Known technical limitations

**PDF exports contain English only.** `pdf-lib` embeds fonts but does not shape
complex scripts, so Malayalam would render as broken glyphs. Every PDF says so
in its footer, and the CSV — UTF-8 with a BOM, so Excel on Windows reads it —
carries both scripts. Fixing this properly needs a shaping engine or headless
Chromium, which is a heavier dependency than the programme currently justifies.

**The Open Graph image is built by a script, not `next/og`.** Satori has no
shaping engine either: it rendered `കമ്മീഷൻ` as `കമ്‌മീഷന്‍`. `sharp` →
librsvg → HarfBuzz shapes correctly, so the image is generated by
`npm run build:og` and committed.

**Malayalam chillu letters are normalised on import.** LGD publishes the old
consonant + virama + ZWJ sequences; a phone keyboard produces the atomic
characters. Without normalising, `കണ്ണൂർ` typed by a user would not match
`കണ്ണൂര്‍` as stored.

**Search uses trigram similarity**, so transliterations work — verified that
"kodancheri", "Kodenchery" and "കോടഞ്ചേരി" all rank the same row first. It is
not a transliteration engine; a spelling far from both stored names will miss.

**Reports are capped, not paginated.** The default is 2,000 rows, sized to
Kerala's ~1,034 local bodies. Hitting the cap sets `truncated: true` rather than
silently returning half the state — which the 500-row default was doing.

**int8 is parsed to a JS number.** Safe here: ids are sequences and the largest
money value is paise, so the ceiling is around ninety trillion rupees.

---

## 6. Data protection

Only the fields the brief lists are collected. No date of birth, no address, no
document upload, no photograph.

PAN and bank account are encrypted with AES-256-GCM. Duplicate detection uses a
**separately keyed** HMAC fingerprint, so a fingerprint leak does not help
decrypt anything, and the PAN space is small enough that an unkeyed hash would
be trivially reversible.

Plaintext PAN is never returned by any endpoint, to anyone, including its owner
and including a super admin — returning it would put it in browser caches and
proxy logs. Only `XXXXX1234F` is ever rendered. Audit entries are scrubbed
through a key denylist before writing.

Analytics events carry no user id and no PII. Property keys are allowlisted and
values truncated, so a client that sends an email address has it dropped rather
than stored — asserted in the smoke test.

**Retention for applicants never onboarded is not implemented.** The brief asks
for a stated retention period; no automatic deletion exists yet. `DELETE
/api/v1/me` tombstones a user on request, keeping commission and TDS records
because those have statutory retention. Someone must decide the period and add
a scheduled job.

---

## 7. Deployment

Two Vercel projects from one repository, root directories `apps/api` and
`apps/web`. Only the API holds a database credential; the frontend has none and
reaches nothing but the API over HTTP.

Migrations are **not** run automatically on deploy. `npm run db:migrate` is
deliberate, because `0001_rls.sql` and its successors change access control and
should not ride along with a routine deploy.

Everything was verified against local Postgres 14. **Neon was never
provisioned** — that spends money on the client's account. The schema uses
nothing version-specific beyond `pg_trgm`.
