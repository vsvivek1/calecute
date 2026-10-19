#!/usr/bin/env sh
# Runs the migration, the seed and the RLS suite against a throwaway local
# database. Needs a local Postgres 14+ superuser; PGHOST etc. are honoured.
set -eu
cd "$(dirname "$0")/.."
DB=pta_rls_$$
createdb "$DB"
trap 'dropdb "$DB"' EXIT
psql -q -o /dev/null -v ON_ERROR_STOP=1 -d "$DB" \
  -f tests/supabase_stub.sql -f migrations/0001_pta.sql -f migrations/0002_api.sql -f migrations/0003_hardening.sql -f seed.sql -f tests/rls.sql -f tests/api.sql
