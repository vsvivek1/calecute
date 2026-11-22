/**
 * The office module's only configuration: which Supabase project it talks to.
 * Company name, logo and timezone live in the database (office_settings), so
 * another company changes them on the Settings screen, not here.
 *
 * Both values are public by design: the publishable key is meant for
 * browsers, and the database's row-level security decides what it can reach.
 */
export const OFFICE_SUPABASE_URL = process.env.NEXT_PUBLIC_OFFICE_SUPABASE_URL ?? "";
export const OFFICE_SUPABASE_KEY = process.env.NEXT_PUBLIC_OFFICE_SUPABASE_KEY ?? "";

export const officeConfigured = Boolean(OFFICE_SUPABASE_URL && OFFICE_SUPABASE_KEY);

/** Private storage bucket for task files and the company logo. */
export const FILES_BUCKET = "office-files";
export const FILE_MAX_BYTES = 10 * 1024 * 1024;
