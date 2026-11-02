import { NextResponse } from 'next/server';

import { demoRpc } from '@/lib/demo-db';
import { DEMO, DEMO_PEOPLE } from '@/lib/mode';
import { isRpc } from '@/lib/rpc-names';

/**
 * The demo database over HTTP, for the Flutter app's demo mode.
 *
 * Exists only when the deployment is in demo mode: on a real deployment this
 * route answers 404 and the app talks to Supabase directly. The data is the
 * sample school, so "sign in as" by email is all the identity it needs.
 */
// Sample data only, so any origin may call it: this is what lets a Flutter
// web or desktop build try the demo too.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

export function OPTIONS() {
  return new NextResponse(null, { status: DEMO ? 204 : 404, headers: DEMO ? CORS : {} });
}

export async function POST(request: Request) {
  if (!DEMO) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

  let body: { fn?: string; args?: Record<string, unknown>; as?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected JSON' }, 400);
  }
  const { fn = '', args = {}, as = '' } = body;
  if (!isRpc(fn)) return json({ error: 'Unknown function' }, 400);
  if (!DEMO_PEOPLE.some((p) => p.email === as)) {
    return json({ error: 'Pick a demo person' }, 401);
  }
  try {
    return json({ data: await demoRpc(as, fn, args) });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
