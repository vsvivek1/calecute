#!/bin/sh
# Vercel runs this instead of `npm run build`. It applies pending migrations
# and the idempotent seed before building, using the database credentials
# already stored in the Vercel project, so nobody has to run them by hand.
# The unpooled Neon URL is preferred: migrations run multi-statement
# transactions that a transaction-mode pooler may not carry.
#
# Only production builds migrate. Preview builds (every PR push) share the
# same DATABASE_URL, so a migration in an unmerged PR would otherwise reach the
# live database before anyone merged it.
set -e
DB="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
if [ -z "$DB" ]; then
  echo "vercel-build: no DATABASE_URL; skipping migrate and seed"
elif [ -n "$VERCEL_ENV" ] && [ "$VERCEL_ENV" != "production" ]; then
  echo "vercel-build: $VERCEL_ENV build; skipping migrate and seed (production builds only)"
else
  DATABASE_URL="$DB" node scripts/migrate.mts
  DATABASE_URL="$DB" node scripts/seed.mts
fi
npm run build
