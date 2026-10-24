#!/usr/bin/env bash
# Runs the engine against a throwaway local Postgres with a stub auth schema.
# Usage: PGHOST=/path/to/socket PGPORT=5432 supabase/tests/run.sh
# Loads migrations 0001-0004 and all cards, then simulates learners:
#   40_days.sql  40 days of study with random ratings (quota done each day)
#   modes.sql    bonus gap, exam cap, cram mode, delete my data
#   exam_day.sql exam day, welcome back, revision window
set -euo pipefail
cd "$(dirname "$0")/.."
P="psql -U ${PGUSER:-postgres} -v ON_ERROR_STOP=1 -q"
$P -c 'drop database if exists em_test' -c 'create database em_test'
$P -d em_test -f tests/00_auth_stub.sql
for f in migrations/000[1-3]*.sql; do $P -d em_test -f "$f"; done
for f in seed/cards-*.sql; do $P -d em_test -f "$f" >/dev/null; done
$P -d em_test -f migrations/0004_recallio_rules.sql
cd tests
for t in 40_days.sql modes.sql exam_day.sql; do
  echo "== $t"
  $P -d em_test -At -f "$t" | grep -v '^{"pos"'
done
