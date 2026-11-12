import type { Metadata } from "next";
import Link from "next/link";
import { addPerson, resetPassword, updatePerson } from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import { listPeople, listTasks } from "@/office/data";
import { requireAdmin } from "@/office/session";
import { ROLE_LABEL, type Role } from "@/office/types";

export const metadata: Metadata = { title: "People" };

function RoleSelect({ value }: { value?: Role }) {
  return (
    <label className="label">
      Role
      <select name="role" defaultValue={value ?? "employee"} className="field">
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function PeoplePage() {
  const officer = await requireAdmin();
  const [people, open] = await Promise.all([listPeople(), listTasks({ status: "open" })]);
  const openCount = (id: string) => open.filter((t) => t.assignee_id === id).length;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="h1">People</h1>
        <p className="mt-1 muted">
          Admins manage people and settings. Managers assign and follow up every task. Employees see only their own tasks.
        </p>
      </div>

      <details className="card" open={people.length <= 1}>
        <summary className="cursor-pointer font-semibold text-indigo-200">Add a person</summary>
        <ActionForm action={addPerson} submit="Add and create login" pendingLabel="Creating…" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label">
              Full name
              <input name="full_name" required maxLength={120} className="field" />
            </label>
            <label className="label">
              Email (their login)
              <input name="email" type="email" required maxLength={200} className="field" />
            </label>
            <label className="label">
              Phone
              <input name="phone" type="tel" maxLength={40} className="field" />
            </label>
            <label className="label">
              Designation
              <input name="designation" maxLength={120} className="field" placeholder="e.g. Coordinator" />
            </label>
            <RoleSelect />
          </div>
        </ActionForm>
      </details>

      <ul className="grid gap-3">
        {people.map((p) => (
          <li key={p.id} className={`card grid gap-3 ${p.active ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base font-semibold">{p.full_name}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{ROLE_LABEL[p.role]}</span>
              {!p.active ? <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-200">Switched off</span> : null}
              {p.active && p.must_change_password ? (
                <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs text-amber-100">Has not signed in yet</span>
              ) : null}
              {p.id === officer.person.id ? <span className="text-xs text-white/45">You</span> : null}
              <Link href={`/office/tasks?person=${p.id}`} className="ml-auto text-sm text-indigo-200 hover:underline">
                {openCount(p.id)} open task{openCount(p.id) === 1 ? "" : "s"}
              </Link>
            </div>
            <p className="text-sm text-white/60">
              {[p.designation, p.email, p.phone].filter(Boolean).join(" · ")}
            </p>
            <details>
              <summary className="cursor-pointer text-sm text-indigo-200">Edit, switch off or reset password</summary>
              <div className="mt-3 grid gap-6">
                <ActionForm action={updatePerson} submit="Save" reset={false}>
                  <input type="hidden" name="id" value={p.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="label">
                      Full name
                      <input name="full_name" required defaultValue={p.full_name} maxLength={120} className="field" />
                    </label>
                    <label className="label">
                      Phone
                      <input name="phone" type="tel" defaultValue={p.phone ?? ""} maxLength={40} className="field" />
                    </label>
                    <label className="label">
                      Designation
                      <input name="designation" defaultValue={p.designation ?? ""} maxLength={120} className="field" />
                    </label>
                    <RoleSelect value={p.role} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={p.active} /> Active (untick to switch off their login at once; their work stays)
                  </label>
                </ActionForm>
                <div className="border-t border-white/10 pt-4">
                  <ActionForm action={resetPassword} submit="Reset password" buttonClass="btn-ghost" pendingLabel="Resetting…" reset={false}>
                    <input type="hidden" name="id" value={p.id} />
                    <p className="text-sm text-white/60">Gives them a new temporary password. Their old one stops working.</p>
                  </ActionForm>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
