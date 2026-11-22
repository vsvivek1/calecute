import { PRIORITY_LABEL, ROLE_LABEL, type Person, type Priority, type Task } from "../types";

/** The fields that say what a task is. Only admins and managers see these. */
export default function TaskFields({
  people,
  defaults = {},
}: {
  people: Person[];
  defaults?: Partial<Pick<Task, "title" | "details" | "assignee_id" | "start_date" | "due_date" | "priority">>;
}) {
  return (
    <>
      <label className="label">
        Task
        <input name="title" required maxLength={200} defaultValue={defaults.title} className="field" placeholder="e.g. File GSTR-3B for October" />
      </label>
      <label className="label">
        Details
        <textarea name="details" rows={4} maxLength={8000} defaultValue={defaults.details ?? ""} className="field" placeholder="What needs doing, and anything they should know" />
      </label>
      <label className="label">
        Assign to
        <select name="assignee_id" required defaultValue={defaults.assignee_id ?? ""} className="field">
          <option value="" disabled>
            Pick a person
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} · {p.designation || ROLE_LABEL[p.role]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="label">
          Start date
          <input type="date" name="start_date" defaultValue={defaults.start_date ?? ""} className="field" />
        </label>
        <label className="label">
          Due date
          <input type="date" name="due_date" defaultValue={defaults.due_date ?? ""} className="field" />
        </label>
        <label className="label">
          Priority
          <select name="priority" defaultValue={defaults.priority ?? "normal"} className="field">
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
