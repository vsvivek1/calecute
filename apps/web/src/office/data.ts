import "server-only";

import { FILES_BUCKET } from "./config";
import { serverClient } from "./supabase/server";
import type { Bottleneck, Contact, Person, Status, Step, Task, TaskFile } from "./types";

const TASK_COLUMNS =
  "*, assignee:office_people!office_tasks_assignee_id_fkey(id, full_name), assigner:office_people!office_tasks_assigned_by_fkey(full_name)";

export async function listPeople(opts: { activeOnly?: boolean } = {}): Promise<Person[]> {
  const supabase = await serverClient();
  let q = supabase.from("office_people").select("*").order("full_name");
  if (opts.activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Person[];
}

export interface TaskFilter {
  assigneeId?: string;
  status?: Status | "open" | "all";
  dueFrom?: string;
  dueTo?: string;
}

/** Row-level security already limits an employee to their own tasks. */
export async function listTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const supabase = await serverClient();
  let q = supabase.from("office_tasks").select(TASK_COLUMNS).limit(1000);
  if (filter.assigneeId) q = q.eq("assignee_id", filter.assigneeId);
  if (filter.status === "open") q = q.neq("status", "done");
  else if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
  if (filter.dueFrom) q = q.gte("due_date", filter.dueFrom);
  if (filter.dueTo) q = q.lte("due_date", filter.dueTo);
  const { data } = await q.order("due_date", { ascending: true, nullsFirst: false }).order("created_at");
  return (data ?? []) as unknown as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await serverClient();
  const { data } = await supabase.from("office_tasks").select(TASK_COLUMNS).eq("id", id).maybeSingle();
  return (data as unknown as Task) ?? null;
}

export async function getTaskDetail(id: string) {
  const supabase = await serverClient();
  const [steps, bottlenecks, contacts, files] = await Promise.all([
    supabase
      .from("office_task_steps")
      .select("id, done_on, note, created_at, author:office_people!office_task_steps_author_id_fkey(full_name)")
      .eq("task_id", id)
      .order("done_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("office_task_bottlenecks")
      .select(
        "id, task_id, description, unblock_by, raised_at, cleared_at, clearing_note, author:office_people!office_task_bottlenecks_author_id_fkey(full_name), clearer:office_people!office_task_bottlenecks_cleared_by_fkey(full_name)",
      )
      .eq("task_id", id)
      .order("raised_at", { ascending: false }),
    supabase.from("office_task_contacts").select("*").eq("task_id", id).order("created_at"),
    supabase.from("office_task_files").select("*").eq("task_id", id).order("created_at", { ascending: false }),
  ]);

  const fileRows = (files.data ?? []) as TaskFile[];
  let links: Record<string, string> = {};
  if (fileRows.length) {
    const { data: signed } = await supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrls(
        fileRows.map((f) => f.path),
        60 * 60,
      );
    links = Object.fromEntries((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));
  }

  return {
    steps: (steps.data ?? []) as unknown as Step[],
    bottlenecks: (bottlenecks.data ?? []) as unknown as Bottleneck[],
    contacts: (contacts.data ?? []) as Contact[],
    files: fileRows.map((f) => ({ ...f, url: links[f.path] ?? null })),
  };
}

export interface OpenBottleneck {
  id: string;
  description: string;
  unblock_by: string | null;
  raised_at: string;
  task: { id: string; title: string; assignee: { full_name: string } | null } | null;
}

export async function listOpenBottlenecks(): Promise<OpenBottleneck[]> {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("office_task_bottlenecks")
    .select(
      "id, description, unblock_by, raised_at, task:office_tasks!inner(id, title, assignee:office_people!office_tasks_assignee_id_fkey(full_name))",
    )
    .is("cleared_at", null)
    .order("raised_at");
  return (data ?? []) as unknown as OpenBottleneck[];
}

/** Last few steps across all visible tasks, newest first. */
export async function recentSteps(limit = 8) {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("office_task_steps")
    .select(
      "id, done_on, note, created_at, author:office_people!office_task_steps_author_id_fkey(full_name), task:office_tasks!inner(id, title)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as (Step & { task: { id: string; title: string } | null })[];
}

export async function logoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await serverClient();
  const { data } = await supabase.storage.from(FILES_BUCKET).createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}
