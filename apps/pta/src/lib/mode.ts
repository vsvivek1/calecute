/**
 * Demo mode runs the real schema and the real functions on an in-process
 * Postgres with the sample school loaded. It exists so the product can be
 * looked at before a Supabase project is provisioned, and it switches off the
 * moment Supabase is configured.
 */
export const DEMO =
  process.env.PTA_DEMO === '1' && !process.env.NEXT_PUBLIC_SUPABASE_URL;

/** The people in the sample school, as shown on the demo sign-in page. */
export const DEMO_PEOPLE = [
  { email: 'parent@example.com', label: 'Parent', who: 'Meera Nair, mother of Aditi (5 A) and Arjun (8 B)' },
  { email: 'anitha@example.com', label: 'Class teacher', who: 'Anitha K, Grade 5 A' },
  { email: 'office@example.com', label: 'School office', who: 'Admin for the whole school' },
] as const;

export const DEMO_COOKIE = 'pta_demo_as';
