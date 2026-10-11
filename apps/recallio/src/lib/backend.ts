/**
 * Which database schema and payment function this deployment talks to.
 *
 * One codebase, several deployments. The default is the Recallio engine in
 * `public`. A course hosted in its own schema (Geological Assistant lives in
 * `geological_assistant` inside the USS project) is a second deployment with
 * these set; nothing else in the app changes.
 */
export const DB_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

export const PAY_FUNCTION =
  process.env.NEXT_PUBLIC_PAY_FUNCTION || 'razorpay-create-order';

/** Paid-only courses have no free cards, so the free-card panel is hidden. */
export const SHOW_FREE_TIER = process.env.NEXT_PUBLIC_FREE_TIER !== 'off';
