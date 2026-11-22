export type Role = "admin" | "manager" | "employee";
export type Status = "not_started" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "normal" | "high" | "urgent";

export interface Person {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  role: Role;
  active: boolean;
  must_change_password: boolean;
}

export interface Settings {
  company_name: string;
  logo_path: string | null;
  timezone: string;
}

export interface Task {
  id: string;
  title: string;
  details: string | null;
  assignee_id: string;
  assigned_by: string | null;
  start_date: string | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  result: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { id: string; full_name: string } | null;
  assigner?: { full_name: string } | null;
}

export interface Step {
  id: string;
  done_on: string;
  note: string;
  created_at: string;
  author: { full_name: string } | null;
}

export interface Bottleneck {
  id: string;
  task_id: string;
  description: string;
  unblock_by: string | null;
  raised_at: string;
  cleared_at: string | null;
  clearing_note: string | null;
  author: { full_name: string } | null;
  clearer: { full_name: string } | null;
}

export interface Contact {
  id: string;
  name: string;
  organisation: string | null;
  job_title: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  added_by: string;
}

export interface TaskFile {
  id: string;
  path: string;
  name: string;
  size_bytes: number;
  mime: string | null;
  created_at: string;
  uploaded_by: string;
}

/** What every Server Action returns to its form. */
export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Shown once, e.g. a temporary password. */
  secret?: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

export const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
