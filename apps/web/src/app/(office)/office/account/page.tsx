import type { Metadata } from "next";
import { setOwnPassword, signOut } from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import { requireOfficer } from "@/office/session";
import { ROLE_LABEL } from "@/office/types";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { person } = await requireOfficer();
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <div>
        <h1 className="h1">Your account</h1>
        <p className="mt-1 muted">
          {person.full_name} · {person.email} · {ROLE_LABEL[person.role]}
        </p>
      </div>
      <section className="card grid gap-3">
        <h2 className="h2">Change password</h2>
        <ActionForm action={setOwnPassword} submit="Change password">
          <label className="label">
            New password
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className="field" />
          </label>
          <label className="label">
            Type it again
            <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className="field" />
          </label>
        </ActionForm>
      </section>
      <form action={signOut}>
        <button type="submit" className="btn-ghost">
          Sign out
        </button>
      </form>
    </div>
  );
}
