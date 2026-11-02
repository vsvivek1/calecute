import 'server-only';

/**
 * Calecute "Invite friends & get rewards" (shared referral scheme, see
 * docs/referral-architecture.md). Product slug: recallio-energy-manager.
 *
 * The key stays on the server. With no key set every call returns null and
 * the invite card hides itself, so the app works before the key exists.
 */
const KEY = process.env.CALECUTE_API_KEY;
const BASE = process.env.CALECUTE_API_URL ?? 'https://api.calecutech.com/api/v1';

export type Member = {
  code: string;
  link: string;
  whatsappShareUrl: string;
  qrUrl: string;
  stats: {
    friendsJoined: number;
    payingFriends: number;
    diamonds: number;
    earnings: { pendingPaise: number; paidPaise: number; lifetimePaise: number; currency: string };
  };
  product: { slug: string; name: string; isFree: boolean; userRateBps: number };
};

export const referralEnabled = () => Boolean(KEY);

async function call<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': KEY, ...(init.headers ?? {}) },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // The referral scheme must never break studying.
    return null;
  }
}

/** Creates (or returns) the signed-in user's invite code. Idempotent. */
export function ensureMember(u: { id: string; name: string | null; email: string | null; avatar: string | null }) {
  return call<Member>('/members', {
    method: 'POST',
    body: JSON.stringify({ externalRef: u.id, name: u.name ?? u.email ?? 'Student', email: u.email, pictureUrl: u.avatar }),
  });
}

const CODE = /^[A-Z0-9-]{3,40}$/;

/** First code wins; the API refuses self-referral and repeat claims. */
export function claimReferral(u: { id: string; name: string | null }, code: string) {
  const agentCode = code.trim().toUpperCase();
  if (!CODE.test(agentCode)) return Promise.resolve(null);
  return call('/attribution/claim', {
    method: 'POST',
    headers: { 'Idempotency-Key': `join-${u.id}` },
    body: JSON.stringify({
      customerExternalRef: u.id,
      customerName: u.name ?? 'Student',
      agentCode,
      source: 'referral_link',
    }),
  });
}
