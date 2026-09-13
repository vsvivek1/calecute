# Why bom1

Functions run in **bom1 (Mumbai)**.

Vercel's default is `iad1` (Washington DC). With the database in Singapore and
every user in Kerala, a single page render was: Kerala → Mumbai edge → US East
function → Singapore database → US East → Mumbai → Kerala. Measured from
Kozhikode, the health check — which does one `SELECT 1` — took **600ms warm and
2.7s cold**.

Mumbai is roughly 1,500km from Kerala and ~55ms from the Singapore database, so
the Pacific crossing disappears from every request.

## The database is still in Singapore

Neon was provisioned in `sin1`. Moving it to a closer region means
re-provisioning and re-migrating, which is worth doing if request latency still
matters after this change — each query costs about 55ms from Mumbai, and an
endpoint making three queries pays that three times.

The rate limiter writes one row per request, so it is one of those queries on
every single call. That is the first thing to reconsider if the database moves
no closer.
