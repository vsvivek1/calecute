// The Android app is a static bundle served from the WebView's own origin,
// so it calls the licence and question endpoints cross-origin. Allow exactly
// the Capacitor origins and the local dev server, nothing else.
const ALLOWED = new Set([
  'https://localhost',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3200',
]);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (!origin || !ALLOWED.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const json = (req: Request, body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders(req) });

export const preflight = (req: Request) =>
  new Response(null, { status: 204, headers: corsHeaders(req) });
