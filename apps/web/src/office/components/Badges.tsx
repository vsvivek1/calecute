import { PRIORITY_LABEL, STATUS_LABEL, type Priority, type Status } from "../types";

const STATUS_CLASS: Record<Status, string> = {
  not_started: "bg-white/8 text-white/70 ring-white/15",
  in_progress: "bg-indigo-500/15 text-indigo-200 ring-indigo-400/30",
  blocked: "bg-rose-500/15 text-rose-200 ring-rose-400/40",
  done: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
};

const PRIORITY_CLASS: Record<Priority, string> = {
  low: "text-white/50",
  normal: "text-white/70",
  high: "text-amber-200",
  urgent: "text-rose-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  if (priority === "normal") return null;
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${PRIORITY_CLASS[priority]}`}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
