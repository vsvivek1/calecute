/**
 * Where careers applications go.
 *
 * Applications are written straight from the browser into the
 * `careers_applications` table and `careers-cvs` storage bucket of the
 * company's Supabase project ("Bankers Gold", ap-south-1). Row-level security
 * lets the public key insert and upload only: nobody can read applications
 * back through it. Read them in the Supabase dashboard.
 *
 * The publishable key is meant to ship to browsers; it is not a secret.
 */
export const CAREERS_SUPABASE_URL = "https://filvvtvboxyflunoipvf.supabase.co";
export const CAREERS_SUPABASE_KEY = "sb_publishable_NBDvtuAINIRRYXqiVOyuGA_AKj5qKP3";

export const CV_BUCKET = "careers-cvs";
export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";
export const CAREERS_URL = `${SITE_ORIGIN}/careers`;
