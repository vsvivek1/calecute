import type { Metadata } from "next";
import Link from "next/link";
import { PriorityTag, StatusBadge } from "@/office/components/Badges";
import { listPeople, listTasks } from "@/office/data";
import { addDays, dueLabel, isDate, showDate, showWeekday, todayIn, weekStart } from "@/office/dates";
import { requireLead } from "@/office/session";
import { STATUS_LABEL, type Person, type Status, type Task } from "@/office/types";

export const metadata: Metadata = { title: "Schedule" };

type StatusFilter = Status | "open" | "all" | "overdue";
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "All open" },
  { value: "overdue", label: "Overdue" },
  { value: "blocked", label: STATUS_LABEL.blocked },
  { value: "not_started", label: STATUS_LABEL.not_started },
  { value: "in_progress", label: STATUS_LABEL.in_progress },
  { value: "done", label: STATUS_LABEL.done },
  { value: "all", label: "Everything" },
];

interface Search {
  person?: string;
  status?: string;
  from?: string;
  to?: string;
  view?: string;
  week?: string;
}

function qs(base: Search, patch: Partial<Search>): string {
  const merged = { ...base, ...patch };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/office/tasks?${s}` : "/office/tasks";
}

/** Days a task occupies on the calendar: start..due, or just whichever is set. */
function spans(task: Task, day: string): boolean {
  const start = task.start_date ?? task.due_date;
  const end = task.due_date ?? task.start_date;
  if (!start || !end) return false;
  return start <= day && day <= end;
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<Search> }) {
  const officer = await requireLead();
  const sp = await searchParams;
  const today = todayIn(officer.settings.timezone);

  const view = sp.view === "week" ? "week" : "list";
  const status = (STATUS_FILTERS.some((f) => f.value === sp.status) ? sp.status : "open") as StatusFilter;
  const from = isDate(sp.from) ? sp.from : undefined;
  const to = isDate(sp.to) ? sp.to : undefined;
  const week = weekStart(isDate(sp.week) ? sp.week : today);

  const people = await listPeople();
  const person = people.some((p) => p.id === sp.person) ? sp.person : undefined;

  const tasks = await listTasks({
    assigneeId: person,
    status: status === "overdue" ? "open" : status,
    dueFrom: view === "list" ? from : undefined,
    dueTo: view === "list" ? to : status === "overdue" ? addDays(today, -1) : undefined,
  });
  const shown = status === "overdue" ? tasks.filter((t) => t.due_date && t.due_date < today) : tasks;
  const current: Search = { person, status: status === "open" ? undefined : status, from, to, view: view === "list" ? undefined : view };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Schedule</h1>
          <p className="mt-1 muted">Everyone&apos;s tasks. Overdue and blocked work is highlighted.</p>
        </div>
        <Link href="/office/tasks/new" className="btn-primary">
          Assign a task
        </Link>
      </div>

      <form method="get" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <input type="hidden" name="view" value={view === "week" ? "week" : ""} />
        <label className="label">
          Person
          <select name="person" defaultValue={person ?? ""} className="field">
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
                {p.active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          Status
          <select name="status" defaultValue={status} className="field">
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {view === "list" ? (
          <>
            <label className="label">
              Due from
              <input type="date" name="from" defaultValue={from} className="field" />
            </label>
            <label className="label">
              Due to
              <input type="date" name="to" defaultValue={to} className="field" />
            </label>
          </>
        ) : (
          <label className="label lg:col-span-2">
            Week of
            <input type="date" name="week" defaultValue={week} className="field" />
          </label>
        )}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Show
          </button>
          <Link href={view === "week" ? "/office/tasks?view=week" : "/office/tasks"} className="btn-ghost">
            Clear
          </Link>
        </div>
      </form>

      <div className="flex gap-1 text-sm" role="tablist" aria-label="View">
        <Link
          href={qs(current, { view: undefined, week: undefined })}
          aria-current={view === "list" ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 ${view === "list" ? "bg-white text-black" : "text-white/70 hover:bg-white/10"}`}
        >
          List
        </Link>
        <Link
          href={qs(current, { view: "week", from: undefined, to: undefined })}
          aria-current={view === "week" ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 ${view === "week" ? "bg-white text-black" : "text-white/70 hover:bg-white/10"}`}
        >
          Week by person
        </Link>
      </div>

      {view === "list" ? <TaskList tasks={shown} today={today} /> : <WeekGrid tasks={shown} people={people} person={person} week={week} today={today} current={current} />}
    </div>
  );
}

function TaskList({ tasks, today }: { tasks: Task[]; today: string }) {
  if (!tasks.length) return <p className="muted">No tasks match.</p>;
  return (
    <div className="card overflow-hidden p-0">
      <ul className="divide-y divide-white/5">
        {tasks.map((t) => {
          const overdue = t.status !== "done" && t.due_date !== null && t.due_date < today;
          return (
            <li
              key={t.id}
              className={`grid gap-1 px-4 py-3 sm:grid-cols-[1fr_10rem_9rem_8rem] sm:items-center sm:gap-4 ${
                overdue ? "bg-rose-500/[0.07]" : t.status === "blocked" ? "bg-amber-300/[0.06]" : ""
              }`}
            >
              <div className="min-w-0">
                <Link href={`/office/tasks/${t.id}`} className="font-medium hover:underline">
                  {t.title}
                </Link>{" "}
                <PriorityTag priority={t.priority} />
              </div>
              <span className="text-sm text-white/70">{t.assignee?.full_name}</span>
              <span className={`text-sm ${overdue ? "font-semibold text-rose-300" : "text-white/60"}`}>
                {t.status === "done" ? `Closed ${showDate(t.closed_at?.slice(0, 10) ?? null, today)}` : dueLabel(t.due_date, today)}
              </span>
              <span>
                <StatusBadge status={t.status} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function WeekGrid({
  tasks,
  people,
  person,
  week,
  today,
  current,
}: {
  tasks: Task[];
  people: Person[];
  person?: string;
  week: string;
  today: string;
  current: Search;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const rows = people
    .filter((p) => (person ? p.id === person : true))
    .map((p) => ({ person: p, tasks: tasks.filter((t) => t.assignee_id === p.id) }))
    .filter((r) => r.person.active || r.tasks.length);

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Link href={qs(current, { view: "week", week: addDays(week, -7) })} className="btn-ghost">
          ← Previous
        </Link>
        <Link href={qs(current, { view: "week", week: undefined })} className="btn-ghost">
          This week
        </Link>
        <Link href={qs(current, { view: "week", week: addDays(week, 7) })} className="btn-ghost">
          Next →
        </Link>
        <span className="ml-auto text-white/55">
          {showDate(days[0], today)} – {showDate(days[6], today)}
        </span>
      </div>
      {/* Scrolls sideways inside its own box on a phone; the page never does. */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-white/60">
              <th scope="col" className="sticky left-0 z-10 w-40 bg-[#0d0d13] px-3 py-2 font-medium">
                Person
              </th>
              {days.map((d) => (
                <th key={d} scope="col" className={`px-2 py-2 font-medium ${d === today ? "text-indigo-200" : ""}`}>
                  {showWeekday(d)} <span className="text-white/40">{showDate(d, today)}</span>
                </th>
              ))}
              <th scope="col" className="px-2 py-2 font-medium">
                No dates
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ person: p, tasks: own }) => (
              <tr key={p.id} className="border-t border-white/5 align-top">
                <th scope="row" className="sticky left-0 z-10 bg-[#0d0d13] px-3 py-2 text-left font-medium">
                  {p.full_name}
                  {!p.active ? <span className="block text-xs text-white/40">inactive</span> : null}
                </th>
                {days.map((d) => (
                  <td key={d} className={`px-1.5 py-1.5 ${d === today ? "bg-indigo-500/[0.06]" : ""}`}>
                    <div className="grid gap-1">
                      {own.filter((t) => spans(t, d)).map((t) => (
                        <Chip key={t.id} task={t} today={today} />
                      ))}
                    </div>
                  </td>
                ))}
                <td className="px-1.5 py-1.5">
                  <div className="grid gap-1">
                    {own.filter((t) => !t.start_date && !t.due_date).map((t) => (
                      <Chip key={t.id} task={t} today={today} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ task, today }: { task: Task; today: string }) {
  const overdue = task.status !== "done" && task.due_date !== null && task.due_date < today;
  const tone =
    task.status === "done"
      ? "bg-emerald-500/10 text-emerald-100/80 line-through decoration-emerald-200/40"
      : overdue
        ? "bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/50"
        : task.status === "blocked"
          ? "bg-amber-300/15 text-amber-100 ring-1 ring-amber-300/40"
          : "bg-white/[0.07] text-white/90";
  return (
    <Link href={`/office/tasks/${task.id}`} className={`block truncate rounded-lg px-2 py-1 text-xs hover:brightness-125 ${tone}`} title={task.title}>
      {task.title}
    </Link>
  );
}
