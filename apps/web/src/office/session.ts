import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { officeConfigured } from "./config";
import { serverClient } from "./supabase/server";
import type { Person, Settings } from "./types";

export interface Officer {
  person: Person;
  settings: Settings;
}

/**
 * Who is signed in, as the database sees them. A person row only comes back
 * for an active member (row-level security), so a deactivated person or a
 * stranger with a Supabase login gets null here and nothing anywhere else.
 */
export const getOfficer = cache(async (): Promise<{ signedIn: boolean; officer: Officer | null }> => {
  if (!officeConfigured) return { signedIn: false, officer: null };
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, officer: null };

  const [{ data: person }, { data: settings }] = await Promise.all([
    supabase.from("office_people").select("*").eq("id", user.id).maybeSingle<Person>(),
    supabase.from("office_settings").select("company_name, logo_path, timezone").maybeSingle<Settings>(),
  ]);
  if (!person || !person.active || !settings) return { signedIn: true, officer: null };
  return { signedIn: true, officer: { person, settings } };
});

/** Any active member. Sends a first-time user to set their password. */
export async function requireOfficer(opts: { allowPasswordChange?: boolean } = {}): Promise<Officer> {
  const { signedIn, officer } = await getOfficer();
  if (!officer) redirect(signedIn ? "/login?e=noaccess" : "/login");
  if (officer.person.must_change_password && !opts.allowPasswordChange) redirect("/login/new-password");
  return officer;
}

export const isLead = (o: Officer) => o.person.role === "admin" || o.person.role === "manager";
export const isAdmin = (o: Officer) => o.person.role === "admin";

/** Admin or manager. The database refuses the data to anyone else anyway. */
export async function requireLead(): Promise<Officer> {
  const officer = await requireOfficer();
  if (!isLead(officer)) redirect("/office");
  return officer;
}

export async function requireAdmin(): Promise<Officer> {
  const officer = await requireOfficer();
  if (!isAdmin(officer)) redirect("/office");
  return officer;
}
