// office-admin: the only code that holds the Supabase secret key.
//
// Creating a login, resetting a password and switching someone off all need
// the auth admin API, which needs the secret key. That key never goes to the
// website: the website calls this function with the signed-in person's own
// access token, and this function checks who they are before doing anything.
//
// Actions (POST JSON { action, ...fields }):
//   create_person        admin   -> { ok, id, temp_password }
//   update_person        admin   -> { ok }
//   reset_password       admin   -> { ok, temp_password }
//   change_own_password  anyone with an active office account -> { ok }
//
// Deployed with verify_jwt off because it verifies the token itself (works
// with both legacy and new Supabase JWT signing keys).

import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function secretKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    const first = parsed.default ?? Object.values(parsed)[0];
    if (first) return first;
  }
  throw new Error("No Supabase secret key in the function environment");
}

const admin = createClient(SUPABASE_URL, secretKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ROLES = ["admin", "manager", "employee"] as const;
type Role = (typeof ROLES)[number];

// No 0/O, 1/l/I: the password is read out over the phone or typed from WhatsApp.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function tempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fail = (message: string, status = 400) => json({ error: message }, status);

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

async function audit(actor: string, action: string, target: string | null, details: Record<string, unknown>) {
  await admin.from("office_audit_log").insert({
    actor_id: actor,
    action,
    target_type: "person",
    target_id: target,
    details,
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail("POST only", 405);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail("Not signed in", 401);

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return fail("Not signed in", 401);
  const callerId = userData.user.id;

  const { data: caller } = await admin
    .from("office_people")
    .select("id, role, active")
    .eq("id", callerId)
    .maybeSingle();
  if (!caller || !caller.active) return fail("No office access", 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Bad request");
  }

  const action = body.action;

  if (action === "change_own_password") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) return fail("Use at least 8 characters");
    if (password.length > 72) return fail("Use at most 72 characters");
    const { error } = await admin.auth.admin.updateUserById(callerId, { password });
    if (error) return fail(error.message);
    await admin.from("office_people").update({ must_change_password: false }).eq("id", callerId);
    return json({ ok: true });
  }

  if (caller.role !== "admin") return fail("Only an admin can do this", 403);

  if (action === "create_person") {
    const fullName = text(body.full_name, 120);
    const email = text(body.email, 200)?.toLowerCase() ?? null;
    const role = body.role as Role;
    if (!fullName) return fail("Enter the person's name");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email");
    if (!ROLES.includes(role)) return fail("Pick a role");

    const password = tempPassword();
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "Could not create the login";
      return fail(/already|registered|exists/i.test(msg) ? "That email already has a login" : msg);
    }

    const { error: insertError } = await admin.from("office_people").insert({
      id: created.user.id,
      full_name: fullName,
      email,
      phone: text(body.phone, 40),
      designation: text(body.designation, 120),
      role,
      active: true,
      must_change_password: true,
    });
    if (insertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return fail(insertError.message);
    }
    await audit(callerId, "person.added", created.user.id, { email, role });
    return json({ ok: true, id: created.user.id, temp_password: password });
  }

  if (action === "update_person") {
    const id = typeof body.id === "string" ? body.id : "";
    const { data: before } = await admin.from("office_people").select("*").eq("id", id).maybeSingle();
    if (!before) return fail("Person not found", 404);

    const patch: Record<string, unknown> = {};
    if ("full_name" in body) {
      const v = text(body.full_name, 120);
      if (!v) return fail("Enter the person's name");
      patch.full_name = v;
    }
    if ("phone" in body) patch.phone = text(body.phone, 40);
    if ("designation" in body) patch.designation = text(body.designation, 120);
    if ("role" in body) {
      if (!ROLES.includes(body.role as Role)) return fail("Pick a role");
      patch.role = body.role;
    }
    if ("active" in body) patch.active = body.active === true;

    const { error } = await admin.from("office_people").update(patch).eq("id", id);
    if (error) {
      return fail(/active admin/.test(error.message) ? "There must always be at least one active admin" : error.message);
    }

    if ("active" in patch && patch.active !== before.active) {
      // A ban stops new sign-ins and token refreshes; the database already
      // refuses an inactive person's data, so access ends at once either way.
      await admin.auth.admin.updateUserById(id, {
        ban_duration: patch.active ? "none" : "876000h",
      });
      await audit(callerId, patch.active ? "person.reactivated" : "person.deactivated", id, {});
    }
    if ("role" in patch && patch.role !== before.role) {
      await audit(callerId, "person.role_changed", id, { from: before.role, to: patch.role });
    }
    return json({ ok: true });
  }

  if (action === "reset_password") {
    const id = typeof body.id === "string" ? body.id : "";
    const { data: person } = await admin.from("office_people").select("id").eq("id", id).maybeSingle();
    if (!person) return fail("Person not found", 404);
    const password = tempPassword();
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return fail(error.message);
    await admin.from("office_people").update({ must_change_password: true }).eq("id", id);
    await audit(callerId, "person.password_reset", id, {});
    return json({ ok: true, temp_password: password });
  }

  return fail("Unknown action");
});
