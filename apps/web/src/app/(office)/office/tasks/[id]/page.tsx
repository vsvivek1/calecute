import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addContact,
  addStep,
  clearBottleneck,
  closeTask,
  deleteTask,
  raiseBottleneck,
  removeContact,
  removeFile,
  reopenTask,
  startTask,
  updateTask,
} from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import { PriorityTag, StatusBadge } from "@/office/components/Badges";
import TaskFields from "@/office/components/TaskFields";
import TaskFileUploader from "@/office/components/TaskFileUploader";
import { getTask, getTaskDetail, listPeople } from "@/office/data";
import { dueLabel, showDate, showDateTime, todayIn } from "@/office/dates";
import { isLead, requireOfficer } from "@/office/session";

export const metadata: Metadata = { title: "Task" };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const officer = await requireOfficer();
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const lead = isLead(officer);
  const me = officer.person.id;
  const tz = officer.settings.timezone;
  const today = todayIn(tz);
  const [{ steps, bottlenecks, contacts, files }, people] = await Promise.all([
    getTaskDetail(task.id),
    lead ? listPeople({ activeOnly: true }) : Promise.resolve([]),
  ]);

  const closed = task.status === "done";
  const overdue = !closed && task.due_date !== null && task.due_date < today;
  const open = bottlenecks.filter((b) => !b.cleared_at);
  const cleared = bottlenecks.filter((b) => b.cleared_at);

  return (
    <div className="grid gap-6">
      <div>
        <Link href={lead ? "/office/tasks" : "/office"} className="text-sm text-white/55 hover:underline">
          ← {lead ? "Schedule" : "My tasks"}
        </Link>
      </div>

      {/* ---------------------------------------------------------- header */}
      <section className={`card grid gap-3 ${overdue ? "ring-1 ring-rose-400/50" : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityTag priority={task.priority} />
          <span className={`text-sm ${overdue ? "font-semibold text-rose-300" : "text-white/60"}`}>
            {closed ? `Closed ${task.closed_at ? showDateTime(task.closed_at, tz) : ""}` : dueLabel(task.due_date, today)}
          </span>
        </div>
        <h1 className="h1">{task.title}</h1>
        {task.details ? <p className="whitespace-pre-line text-white/80">{task.details}</p> : null}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-white/45">Assigned to</dt>
            <dd>{task.assignee?.full_name}</dd>
          </div>
          <div>
            <dt className="text-white/45">Assigned by</dt>
            <dd>{task.assigner?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-white/45">Start</dt>
            <dd>{task.start_date ? showDate(task.start_date, today) : "—"}</dd>
          </div>
          <div>
            <dt className="text-white/45">Due</dt>
            <dd>{task.due_date ? showDate(task.due_date, today) : "—"}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          {task.status === "not_started" ? (
            <ActionForm action={startTask} submit="Start work" reset={false}>
              <input type="hidden" name="id" value={task.id} />
            </ActionForm>
          ) : null}
          {closed && lead ? (
            <ActionForm action={reopenTask} submit="Reopen task" buttonClass="btn-ghost" reset={false}>
              <input type="hidden" name="id" value={task.id} />
            </ActionForm>
          ) : null}
        </div>

        {lead ? (
          <details className="rounded-xl border border-white/10 p-3">
            <summary className="cursor-pointer text-sm text-indigo-200">Edit or reassign</summary>
            <ActionForm action={updateTask} submit="Save changes" reset={false} className="mt-3">
              <input type="hidden" name="id" value={task.id} />
              <TaskFields people={people} defaults={task} />
            </ActionForm>
            <div className="mt-6 border-t border-white/10 pt-4">
              <ActionForm action={deleteTask} submit="Delete task" buttonClass="btn-danger" reset={false}>
                <input type="hidden" name="id" value={task.id} />
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" name="confirm" value="yes" /> Delete this task and all its steps, contacts and files
                </label>
              </ActionForm>
            </div>
          </details>
        ) : null}
      </section>

      {/* ---------------------------------------------------------- result */}
      {closed ? (
        <section className="card grid gap-2 ring-1 ring-emerald-400/30">
          <h2 className="h2">Result</h2>
          <p className="whitespace-pre-line">{task.result}</p>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* -------------------------------------------------------- steps */}
        <section className="grid content-start gap-3">
          <h2 className="h2">
            Steps done <span className="text-white/40">{steps.length}</span>
          </h2>
          {!closed ? (
            <div className="card">
              <ActionForm action={addStep} submit="Add step">
                <input type="hidden" name="task_id" value={task.id} />
                <label className="label">
                  What did you do?
                  <textarea name="note" required rows={3} maxLength={4000} className="field" placeholder="e.g. Collected invoices from accounts, uploaded to the GST portal" />
                </label>
                <label className="label w-fit">
                  Date
                  <input type="date" name="done_on" defaultValue={today} max={today} className="field" />
                </label>
              </ActionForm>
            </div>
          ) : null}
          {steps.length ? (
            <ol className="relative grid gap-4 border-l border-white/10 pl-5">
              {steps.map((s) => (
                <li key={s.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-400" aria-hidden />
                  <p className="text-xs text-white/50">
                    {showDate(s.done_on, today)} · {s.author?.full_name}
                  </p>
                  <p className="whitespace-pre-line">{s.note}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No steps yet.</p>
          )}

          {!closed ? (
            <div className="card mt-2 grid gap-2">
              <h2 className="h2">Finish this task</h2>
              <p className="muted">Write what came of it. Clear any open bottleneck first.</p>
              <ActionForm action={closeTask} submit="Close with result" reset={false}>
                <input type="hidden" name="id" value={task.id} />
                <textarea name="result" required rows={3} maxLength={8000} className="field" placeholder="e.g. GSTR-3B filed, ARN AA321124..." />
              </ActionForm>
            </div>
          ) : null}
        </section>

        <div className="grid content-start gap-6">
          {/* ------------------------------------------------------ bottlenecks */}
          <section className="grid gap-3">
            <h2 className="h2">
              Bottlenecks <span className="text-white/40">{open.length ? `${open.length} open` : ""}</span>
            </h2>
            {open.map((b) => (
              <div key={b.id} className="card grid gap-2 ring-1 ring-amber-300/40">
                <p>{b.description}</p>
                <p className="text-xs text-white/50">
                  {b.unblock_by ? `Needs ${b.unblock_by} · ` : ""}raised by {b.author?.full_name}, {showDateTime(b.raised_at, tz)}
                </p>
                <details>
                  <summary className="cursor-pointer text-sm text-indigo-200">Mark cleared</summary>
                  <ActionForm action={clearBottleneck} submit="Cleared" className="mt-2">
                    <input type="hidden" name="id" value={b.id} />
                    <input name="clearing_note" maxLength={2000} className="field" placeholder="How was it solved? (optional)" />
                  </ActionForm>
                </details>
              </div>
            ))}
            {!closed ? (
              <details className="card">
                <summary className="cursor-pointer text-sm text-amber-200">Raise a bottleneck</summary>
                <ActionForm action={raiseBottleneck} submit="Raise" className="mt-3">
                  <input type="hidden" name="task_id" value={task.id} />
                  <label className="label">
                    What is blocking the work?
                    <textarea name="description" required rows={2} maxLength={2000} className="field" />
                  </label>
                  <label className="label">
                    Who or what can unblock it?
                    <input name="unblock_by" maxLength={500} className="field" placeholder="e.g. Accountant, client approval" />
                  </label>
                </ActionForm>
              </details>
            ) : null}
            {cleared.length ? (
              <details>
                <summary className="cursor-pointer text-sm text-white/55">{cleared.length} cleared</summary>
                <ul className="mt-2 grid gap-2">
                  {cleared.map((b) => (
                    <li key={b.id} className="card text-sm">
                      <p className="text-white/70 line-through decoration-white/30">{b.description}</p>
                      {b.clearing_note ? <p className="mt-1">{b.clearing_note}</p> : null}
                      <p className="mt-1 text-xs text-white/45">
                        Cleared by {b.clearer?.full_name}, {b.cleared_at ? showDateTime(b.cleared_at, tz) : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>

          {/* ------------------------------------------------------ contacts */}
          <section className="grid gap-3">
            <h2 className="h2">
              Key contacts <span className="text-white/40">{contacts.length || ""}</span>
            </h2>
            {contacts.map((c) => (
              <div key={c.id} className="card grid gap-1 text-sm">
                <p className="text-base font-semibold">{c.name}</p>
                {c.job_title || c.organisation ? (
                  <p className="text-white/65">{[c.job_title, c.organisation].filter(Boolean).join(", ")}</p>
                ) : null}
                <p className="flex flex-wrap gap-x-4">
                  {c.phone ? (
                    <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="text-indigo-200 hover:underline">
                      {c.phone}
                    </a>
                  ) : null}
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="break-all text-indigo-200 hover:underline">
                      {c.email}
                    </a>
                  ) : null}
                </p>
                {c.note ? <p className="whitespace-pre-line text-white/75">{c.note}</p> : null}
                {c.added_by === me || lead ? (
                  <ActionForm action={removeContact} submit="Remove" buttonClass="text-xs text-white/45 hover:text-rose-300" pendingLabel="Removing…" reset={false}>
                    <input type="hidden" name="id" value={c.id} />
                  </ActionForm>
                ) : null}
              </div>
            ))}
            <details className="card">
              <summary className="cursor-pointer text-sm text-indigo-200">Add a contact</summary>
              <ActionForm action={addContact} submit="Add contact" className="mt-3">
                <input type="hidden" name="task_id" value={task.id} />
                <label className="label">
                  Name
                  <input name="name" required maxLength={120} className="field" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="label">
                    Organisation
                    <input name="organisation" maxLength={160} className="field" />
                  </label>
                  <label className="label">
                    Job title
                    <input name="job_title" maxLength={120} className="field" />
                  </label>
                  <label className="label">
                    Phone
                    <input name="phone" type="tel" maxLength={40} className="field" />
                  </label>
                  <label className="label">
                    Email
                    <input name="email" type="email" maxLength={200} className="field" />
                  </label>
                </div>
                <label className="label">
                  Note
                  <textarea name="note" rows={2} maxLength={2000} className="field" placeholder="What they helped with, best time to call" />
                </label>
              </ActionForm>
            </details>
          </section>

          {/* ------------------------------------------------------ files */}
          <section className="grid gap-3">
            <h2 className="h2">
              Files <span className="text-white/40">{files.length || ""}</span>
            </h2>
            {files.length ? (
              <ul className="card grid gap-2 text-sm">
                {files.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 break-all text-indigo-200 hover:underline">
                        {f.name}
                      </a>
                    ) : (
                      <span className="break-all">{f.name}</span>
                    )}
                    <span className="text-xs text-white/45">{formatSize(f.size_bytes)}</span>
                    {f.uploaded_by === me || lead ? (
                      <ActionForm action={removeFile} submit="Remove" buttonClass="text-xs text-white/45 hover:text-rose-300" pendingLabel="Removing…" reset={false} className="ml-auto">
                        <input type="hidden" name="id" value={f.id} />
                      </ActionForm>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <TaskFileUploader taskId={task.id} />
            <p className="text-xs text-white/40">Up to 10 MB each. Receipts, acknowledgements, photos.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
