import type { Metadata } from "next";
import Link from "next/link";
import { addStep } from "@/office/actions";
import TaskCard from "@/office/components/TaskCard";
import { listOpenBottlenecks, listTasks, recentSteps } from "@/office/data";
import { addDays, showDate, todayIn } from "@/office/dates";
import { isLead, requireOfficer } from "@/office/session";
import { PRIORITY_ORDER, type Task } from "@/office/types";

export const metadata: Metadata = { title: "Overview" };

function byUrgency(a: Task, b: Task) {
  const due = (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
  return due !== 0 ? due : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

function Group({
  title,
  tasks,
  today,
  empty,
  showAssignee,
  quickStep,
}: {
  title: string;
  tasks: Task[];
  today: string;
  empty?: string;
  showAssignee?: boolean;
  quickStep?: boolean;
}) {
  if (!tasks.length && !empty) return null;
  return (
    <section className="grid gap-3">
      <h2 className="h2">
        {title} <span className="text-white/40">{tasks.length}</span>
      </h2>
      {tasks.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} today={today} showAssignee={showAssignee} quickStep={quickStep ? addStep : undefined} />
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  );
}

export default async function OfficeHome() {
  const officer = await requireOfficer();
  const today = todayIn(officer.settings.timezone);
  const lead = isLead(officer);

  const mine = (await listTasks({ assigneeId: officer.person.id, status: "open" })).sort(byUrgency);
  const myOverdue = mine.filter((t) => t.due_date && t.due_date < today);
  const myToday = mine.filter((t) => t.due_date === today);
  const myUpcoming = mine.filter((t) => !t.due_date || t.due_date > today);

  const firstName = officer.person.full_name.split(" ")[0];

  if (!lead) {
    return (
      <div className="grid gap-8">
        <div>
          <h1 className="h1">Hello, {firstName}</h1>
          <p className="mt-1 muted">
            {mine.length
              ? `You have ${mine.length} open task${mine.length === 1 ? "" : "s"}. Add a step whenever you make progress.`
              : "No open tasks. Your admin will assign work here."}
          </p>
        </div>
        <Group title="Overdue" tasks={myOverdue} today={today} quickStep />
        <Group title="Due today" tasks={myToday} today={today} quickStep />
        <Group title="Upcoming" tasks={myUpcoming} today={today} quickStep empty={mine.length ? undefined : "Nothing yet."} />
      </div>
    );
  }

  const [all, bottlenecks, steps] = await Promise.all([listTasks({ status: "open" }), listOpenBottlenecks(), recentSteps()]);
  const overdue = all.filter((t) => t.due_date && t.due_date < today).sort(byUrgency);
  const dueThisWeek = all.filter((t) => t.due_date && t.due_date >= today && t.due_date <= addDays(today, 6));
  const blocked = all.filter((t) => t.status === "blocked");

  const stats = [
    { label: "Open tasks", value: all.length, href: "/office/tasks" },
    { label: "Overdue", value: overdue.length, href: "/office/tasks?status=overdue", alert: overdue.length > 0 },
    { label: "Blocked", value: blocked.length, href: "/office/tasks?status=blocked", alert: blocked.length > 0 },
    { label: "Due in 7 days", value: dueThisWeek.length, href: "/office/tasks?view=week" },
  ];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Hello, {firstName}</h1>
          <p className="mt-1 muted">{showDate(today)} overview of everyone&apos;s work.</p>
        </div>
        <Link href="/office/tasks/new" className="btn-primary">
          Assign a task
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`card block hover:bg-white/[0.06] ${s.alert ? "ring-1 ring-rose-400/50" : ""}`}>
              <span className={`block text-3xl font-semibold ${s.alert ? "text-rose-200" : ""}`}>{s.value}</span>
              <span className="muted">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="grid content-start gap-3">
          <h2 className="h2">
            Open bottlenecks <span className="text-white/40">{bottlenecks.length}</span>
          </h2>
          {bottlenecks.length ? (
            <ul className="grid gap-3">
              {bottlenecks.map((b) => (
                <li key={b.id} className="card grid gap-1 ring-1 ring-amber-300/40">
                  {b.task ? (
                    <Link href={`/office/tasks/${b.task.id}`} className="font-semibold hover:underline">
                      {b.task.title}
                    </Link>
                  ) : null}
                  <p className="text-sm">{b.description}</p>
                  <p className="text-xs text-white/50">
                    {b.task?.assignee?.full_name}
                    {b.unblock_by ? ` · needs ${b.unblock_by}` : ""} · since {showDate(b.raised_at.slice(0, 10), today)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing is blocked.</p>
          )}
        </section>

        <section className="grid content-start gap-3">
          <h2 className="h2">Latest progress</h2>
          {steps.length ? (
            <ul className="card grid gap-3">
              {steps.map((s) => (
                <li key={s.id} className="grid gap-0.5 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm">{s.note}</p>
                  <p className="text-xs text-white/50">
                    {s.author?.full_name} · {showDate(s.done_on, today)} ·{" "}
                    {s.task ? (
                      <Link href={`/office/tasks/${s.task.id}`} className="hover:underline">
                        {s.task.title}
                      </Link>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No steps recorded yet.</p>
          )}
        </section>
      </div>

      <Group title="Overdue" tasks={overdue} today={today} showAssignee empty="Nothing overdue." />
      {mine.length ? <Group title="Assigned to you" tasks={mine} today={today} quickStep /> : null}
    </div>
  );
}
