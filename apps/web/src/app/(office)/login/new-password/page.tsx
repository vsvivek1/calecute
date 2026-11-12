import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setOwnPassword } from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import { requireOfficer } from "@/office/session";

export const metadata: Metadata = { title: "Set your password" };

export default async function NewPasswordPage() {
  const officer = await requireOfficer({ allowPasswordChange: true });
  if (!officer.person.must_change_password) redirect("/office");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Welcome, {officer.person.full_name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Set your own password</h1>
        <p className="mt-2 muted">The one you were given was temporary. Choose one only you know, at least 8 characters.</p>
        <div className="card mt-8">
          <ActionForm action={setOwnPassword} submit="Save and continue" reset={false} buttonClass="btn-primary w-full">
            <input type="hidden" name="next" value="office" />
            <label className="label">
              New password
              <input name="password" type="password" autoComplete="new-password" minLength={8} required className="field" />
            </label>
            <label className="label">
              Type it again
              <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className="field" />
            </label>
          </ActionForm>
        </div>
      </div>
    </main>
  );
}
