#!/bin/sh
# Vercel runs this instead of `npm run build`. It applies pending migrations
# and the idempotent seed before building, using the database credentials
# already stored in the Vercel project, so nobody has to run them by hand.
# The unpooled Neon URL is preferred: migrations run multi-statement
# transactions that a transaction-mode pooler may not carry.
set -e
DB="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
if [ -z "$DB" ]; then
  echo "vercel-build: no DATABASE_URL; skipping migrate and seed"
else
  DATABASE_URL="$DB" node scripts/migrate.mts
  DATABASE_URL="$DB" node scripts/seed.mts
fi
npm run build
