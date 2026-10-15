import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

import { INT_ARRAY_ARGS, type RpcName } from './rpc-names';

/**
 * The demo database: the same migrations and seed a real project gets, in an
 * in-process Postgres. One per server instance, so it resets on a cold start.
 */
let db: Promise<PGlite> | null = null;

const FILES = [
  'tests/supabase_stub.sql',
  'migrations/0001_pta.sql',
  'migrations/0002_api.sql',
  'seed.sql',
];

async function open(): Promise<PGlite> {
  const dir = path.join(process.cwd(), 'supabase');
  const pg = new PGlite();
  for (const f of FILES) await pg.exec(await readFile(path.join(dir, f), 'utf8'));
  return pg;
}

function database() {
  db ??= open().catch((e) => {
    db = null;
    throw e;
  });
  return db;
}

const ARG = /^p_[a-z_]+$/;

function encode(name: string, v: unknown) {
  if (v === undefined) return null;
  if (INT_ARRAY_ARGS.has(name) && Array.isArray(v)) return `{${v.map(Number).join(',')}}`;
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

/**
 * Calls pta.<fn> as `email`, inside a transaction that drops to the
 * `authenticated` role, exactly as PostgREST does for a signed-in user.
 * Row-level security therefore applies in the demo just as it does live.
 */
export async function demoRpc<T>(
  email: string,
  fn: RpcName,
  args: Record<string, unknown>,
): Promise<T> {
  const pg = await database();
  const names = Object.keys(args).filter((k) => args[k] !== undefined);
  for (const k of names) if (!ARG.test(k)) throw new Error(`Bad argument ${k}`);
  const call = `pta.${fn}(${names.map((k, i) => `${k} => $${i + 1}`).join(', ')})`;
  const values = names.map((k) => encode(k, args[k]));

  return pg.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ email }),
    ]);
    await tx.exec('set local role authenticated');
    const res = await tx.query<{ r: T }>(`select to_jsonb(${call}) as r`, values);
    return (res.rows[0]?.r ?? null) as T;
  });
}
