import Link from "next/link";
import { dueLabel } from "../dates";
import type { ActionState, Task } from "../types";
import ActionForm from "./ActionForm";
import { PriorityTag, StatusBadge } from "./Badges";

/** One task in a list. `quickStep` adds an inline "Add step" box. */
export default function TaskCard({
  task,
  today,
  showAssignee,
  quickStep,
}: {
  task: Task;
  today: string;
  showAssignee?: boolean;
  quickStep?: (prev: ActionState | null, fd: FormData) => Promise<ActionState>;
}) {
  const overdue = task.status !== "done" && task.due_date !== null && task.due_date < today;
  return (
    <li
      className={`card grid gap-2 ${overdue ? "ring-1 ring-rose-400/50" : ""} ${task.status === "blocked" ? "ring-1 ring-amber-300/40" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} />
        <PriorityTag priority={task.priority} />
        <span className={`ml-auto text-xs ${overdue ? "font-semibold text-rose-300" : "text-white/55"}`}>
          {task.status === "done" ? "Done" : dueLabel(task.due_date, today)}
        </span>
      </div>
      <Link href={`/office/tasks/${task.id}`} className="text-base font-semibold leading-snug hover:underline">
        {task.title}
      </Link>
      {showAssignee && task.assignee ? <p className="text-sm text-white/60">{task.assignee.full_name}</p> : null}
      {quickStep && task.status !== "done" ? (
        <details className="group">
          <summary className="cursor-pointer text-sm text-indigo-200 hover:underline">Add a step</summary>
          <ActionForm action={quickStep} submit="Add step" className="mt-2">
            <input type="hidden" name="task_id" value={task.id} />
            <textarea name="note" required rows={2} placeholder="What did you do?" className="field" />
          </ActionForm>
        </details>
      ) : null}
    </li>
  );
}
