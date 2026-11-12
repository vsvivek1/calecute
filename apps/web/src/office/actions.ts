"use server";

/**
 * Every write the office screens make. Each one runs as the signed-in person
 * through their own Supabase session, so the database's rules apply exactly
 * as they would to anyone calling the API directly; the checks here only make
 * the error messages friendlier.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FILES_BUCKET } from "./config";
import { isDate } from "./dates";
import { getOfficer } from "./session";
import { serverClient } from "./supabase/server";
import type { ActionState, Priority, Role } from "./types";

type Fd = FormData;

const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];
const ROLES: Role[] = ["admin", "manager", "employee"];

function str(fd: Fd, key: string, max = 4000): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function optional(fd: Fd, key: string, max = 4000): string | null {
  return str(fd, key, max) || null;
}

function dateOrNull(fd: Fd, key: string): string | null {
  const v = str(fd, key, 10);
  return isDate(v) ? v : null;
}

/** Database errors are written for people already; RLS ones are not. */
function friendly(error: { message: string; code?: string } | null): string {
  if (!error) return "Something went wrong. Try again.";
  if (/row-level security|permission denied/i.test(error.message)) {
    return "You don't have permission to do that.";
  }
  if (error.code === "23514" && /office_tasks_dates/.test(error.message)) {
    return "The due date cannot be before the start date.";
  }
  return error.message;
}

function done(message?: string): ActionState {
  revalidatePath("/office", "layout");
  return { ok: true, message };
}

async function invokeAdmin(body: Record<string, unknown>): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const supabase = await serverClient();
  const { data, error } = await supabase.functions.invoke("office-admin", { body });
  if (error) {
    // FunctionsHttpError carries the function's JSON body in `context`.
    let message = "Something went wrong. Try again.";
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const parsed = (await ctx.json()) as { error?: string };
        if (parsed.error) message = parsed.error;
      }
    } catch {
      /* keep the generic message */
    }
    return { error: message };
  }
  return { data: data as Record<string, unknown> };
}

// ----------------------------------------------------------------- sign in

export async function signIn(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const email = str(fd, "email", 200).toLowerCase();
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: /banned/i.test(error.message) ? "This account has been switched off." : "Wrong email or password." };
  }

  const { data: person } = await supabase
    .from("office_people")
    .select("must_change_password, active")
    .eq("email", email)
    .maybeSingle();
  if (!person || !person.active) {
    await supabase.auth.signOut();
    return { error: "This login has no office access. Ask your admin." };
  }
  redirect(person.must_change_password ? "/login/new-password" : "/office");
}

export async function signOut(): Promise<void> {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setOwnPassword(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  const confirm = typeof fd.get("confirm") === "string" ? (fd.get("confirm") as string) : "";
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const { officer } = await getOfficer();
  if (!officer) redirect("/login");

  const result = await invokeAdmin({ action: "change_own_password", password });
  if (result.error) return { error: result.error };

  if (fd.get("next") === "office") redirect("/office");
  return done("Password changed.");
}

// ----------------------------------------------------------------- tasks

export async function createTask(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const title = str(fd, "title", 200);
  const assigneeId = str(fd, "assignee_id", 40);
  const priority = str(fd, "priority", 10) as Priority;
  if (!title) return { error: "Give the task a title." };
  if (!assigneeId) return { error: "Pick who it is for." };

  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("office_tasks")
    .insert({
      title,
      details: optional(fd, "details", 8000),
      assignee_id: assigneeId,
      start_date: dateOrNull(fd, "start_date"),
      due_date: dateOrNull(fd, "due_date"),
      priority: PRIORITIES.includes(priority) ? priority : "normal",
    })
    .select("id")
    .single();
  if (error || !data) return { error: friendly(error) };
  revalidatePath("/office", "layout");
  redirect(`/office/tasks/${data.id}`);
}

export async function updateTask(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const id = str(fd, "id", 40);
  const title = str(fd, "title", 200);
  const priority = str(fd, "priority", 10) as Priority;
  if (!title) return { error: "Give the task a title." };

  const supabase = await serverClient();
  const { error } = await supabase
    .from("office_tasks")
    .update({
      title,
      details: optional(fd, "details", 8000),
      assignee_id: str(fd, "assignee_id", 40),
      start_date: dateOrNull(fd, "start_date"),
      due_date: dateOrNull(fd, "due_date"),
      priority: PRIORITIES.includes(priority) ? priority : "normal",
    })
    .eq("id", id);
  if (error) return { error: friendly(error) };
  return done("Saved.");
}

export async function deleteTask(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const id = str(fd, "id", 40);
  if (fd.get("confirm") !== "yes") return { error: "Tick the box to confirm." };
  const supabase = await serverClient();

  // Remove its files from storage first; the rows go with the task.
  const { data: files } = await supabase.from("office_task_files").select("path").eq("task_id", id);
  if (files?.length) await supabase.storage.from(FILES_BUCKET).remove(files.map((f) => f.path));

  const { error, count } = await supabase.from("office_tasks").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: friendly(error) };
  if (!count) return { error: "You don't have permission to do that." };
  revalidatePath("/office", "layout");
  redirect("/office/tasks");
}

export async function startTask(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const supabase = await serverClient();
  const { error } = await supabase
    .from("office_tasks")
    .update({ status: "in_progress" })
    .eq("id", str(fd, "id", 40))
    .eq("status", "not_started");
  if (error) return { error: friendly(error) };
  return done();
}

export async function closeTask(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const result = str(fd, "result", 8000);
  if (!result) return { error: "Write the result before closing the task." };
  const supabase = await serverClient();
  const { error } = await supabase
    .from("office_tasks")
    .update({ status: "done", result })
    .eq("id", str(fd, "id", 40));
  if (error) return { error: friendly(error) };
  return done("Task closed.");
}

export async function reopenTask(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const supabase = await serverClient();
  const { error } = await supabase
    .from("office_tasks")
    .update({ status: "in_progress" })
    .eq("id", str(fd, "id", 40));
  if (error) return { error: friendly(error) };
  return done("Task reopened.");
}

// ----------------------------------------------------------------- task updates

export async function addStep(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const note = str(fd, "note", 4000);
  if (!note) return { error: "Write what was done." };
  const supabase = await serverClient();
  const doneOn = dateOrNull(fd, "done_on");
  const { error } = await supabase.from("office_task_steps").insert({
    task_id: str(fd, "task_id", 40),
    note,
    ...(doneOn ? { done_on: doneOn } : {}),
  });
  if (error) return { error: friendly(error) };
  return done("Step added.");
}

export async function raiseBottleneck(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const description = str(fd, "description", 2000);
  if (!description) return { error: "Say what is blocking the work." };
  const supabase = await serverClient();
  const { error } = await supabase.from("office_task_bottlenecks").insert({
    task_id: str(fd, "task_id", 40),
    description,
    unblock_by: optional(fd, "unblock_by", 500),
  });
  if (error) return { error: friendly(error) };
  return done("Bottleneck raised. The task is marked blocked.");
}

export async function clearBottleneck(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const supabase = await serverClient();
  const { error, count } = await supabase
    .from("office_task_bottlenecks")
    .update({ clearing_note: optional(fd, "clearing_note", 2000), cleared_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", str(fd, "id", 40))
    .is("cleared_at", null);
  if (error) return { error: friendly(error) };
  if (!count) return { error: "Already cleared." };
  return done("Cleared.");
}

export async function addContact(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const name = str(fd, "name", 120);
  if (!name) return { error: "Enter the contact's name." };
  const supabase = await serverClient();
  const { error } = await supabase.from("office_task_contacts").insert({
    task_id: str(fd, "task_id", 40),
    name,
    organisation: optional(fd, "organisation", 160),
    job_title: optional(fd, "job_title", 120),
    phone: optional(fd, "phone", 40),
    email: optional(fd, "email", 200),
    note: optional(fd, "note", 2000),
  });
  if (error) return { error: friendly(error) };
  return done("Contact added.");
}

export async function removeContact(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const supabase = await serverClient();
  const { error, count } = await supabase
    .from("office_task_contacts")
    .delete({ count: "exact" })
    .eq("id", str(fd, "id", 40));
  if (error) return { error: friendly(error) };
  if (!count) return { error: "You don't have permission to do that." };
  return done();
}

/** The browser uploads the file to storage; this records it on the task. */
export async function recordFile(input: {
  taskId: string;
  path: string;
  name: string;
  size: number;
  mime: string;
}): Promise<ActionState> {
  const supabase = await serverClient();
  const { error } = await supabase.from("office_task_files").insert({
    task_id: input.taskId,
    path: input.path,
    name: input.name.slice(0, 200),
    size_bytes: input.size,
    mime: input.mime.slice(0, 120) || null,
  });
  if (error) {
    await supabase.storage.from(FILES_BUCKET).remove([input.path]);
    return { error: friendly(error) };
  }
  return done("File added.");
}

export async function removeFile(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const id = str(fd, "id", 40);
  const supabase = await serverClient();
  const { data: file } = await supabase.from("office_task_files").select("path").eq("id", id).maybeSingle();
  if (!file) return { error: "File not found." };
  const { error, count } = await supabase.from("office_task_files").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: friendly(error) };
  if (!count) return { error: "You don't have permission to do that." };
  await supabase.storage.from(FILES_BUCKET).remove([file.path]);
  return done();
}

// ----------------------------------------------------------------- people

export async function addPerson(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const role = str(fd, "role", 10) as Role;
  const result = await invokeAdmin({
    action: "create_person",
    full_name: str(fd, "full_name", 120),
    email: str(fd, "email", 200),
    phone: optional(fd, "phone", 40),
    designation: optional(fd, "designation", 120),
    role: ROLES.includes(role) ? role : "employee",
  });
  if (result.error) return { error: result.error };
  revalidatePath("/office", "layout");
  return {
    ok: true,
    message: `Added. Send ${str(fd, "full_name", 120)} their email and this temporary password. They will set their own password when they first sign in at /login.`,
    secret: String(result.data?.temp_password ?? ""),
  };
}

export async function updatePerson(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const role = str(fd, "role", 10) as Role;
  const result = await invokeAdmin({
    action: "update_person",
    id: str(fd, "id", 40),
    full_name: str(fd, "full_name", 120),
    phone: optional(fd, "phone", 40),
    designation: optional(fd, "designation", 120),
    role: ROLES.includes(role) ? role : undefined,
    active: fd.get("active") === "on",
  });
  if (result.error) return { error: result.error };
  return done("Saved.");
}

export async function resetPassword(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const result = await invokeAdmin({ action: "reset_password", id: str(fd, "id", 40) });
  if (result.error) return { error: result.error };
  revalidatePath("/office", "layout");
  return {
    ok: true,
    message: "New temporary password. They will be asked to change it when they sign in.",
    secret: String(result.data?.temp_password ?? ""),
  };
}

// ----------------------------------------------------------------- settings

export async function saveSettings(_: ActionState | null, fd: Fd): Promise<ActionState> {
  const companyName = str(fd, "company_name", 120);
  const timezone = str(fd, "timezone", 60) || "Asia/Kolkata";
  if (!companyName) return { error: "Enter the company name." };
  const supabase = await serverClient();
  const { error, count } = await supabase
    .from("office_settings")
    .update({ company_name: companyName, timezone }, { count: "exact" })
    .eq("id", true);
  if (error) return { error: friendly(error) };
  if (!count) return { error: "You don't have permission to do that." };
  return done("Saved.");
}

/** The browser uploads the logo to storage; this points settings at it. */
export async function setLogo(path: string | null): Promise<ActionState> {
  const supabase = await serverClient();
  const { data: before } = await supabase.from("office_settings").select("logo_path").maybeSingle();
  const { error, count } = await supabase
    .from("office_settings")
    .update({ logo_path: path }, { count: "exact" })
    .eq("id", true);
  if (error) return { error: friendly(error) };
  if (!count) return { error: "You don't have permission to do that." };
  if (before?.logo_path && before.logo_path !== path) {
    await supabase.storage.from(FILES_BUCKET).remove([before.logo_path]);
  }
  return done(path ? "Logo updated." : "Logo removed.");
}
