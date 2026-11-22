import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signIn } from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import { officeConfigured } from "@/office/config";
import { getOfficer } from "@/office/session";

export const metadata: Metadata = { title: "Staff login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const { officer } = await getOfficer();
  if (officer) redirect(officer.person.must_change_password ? "/login/new-password" : "/office");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Staff</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to the office</h1>
        <p className="mt-2 muted">Use the email and password your admin gave you.</p>

        {!officeConfigured ? (
          <p className="card mt-8 text-sm text-amber-200">The office is not set up on this site yet.</p>
        ) : (
          <div className="card mt-8">
            {e === "noaccess" ? (
              <p role="alert" className="mb-4 text-sm text-rose-300">
                This login has no office access, or it has been switched off. Ask your admin.
              </p>
            ) : null}
            <ActionForm action={signIn} submit="Sign in" pendingLabel="Signing in…" reset={false} buttonClass="btn-primary w-full">
              <label className="label">
                Email
                <input name="email" type="email" autoComplete="username" required className="field" />
              </label>
              <label className="label">
                Password
                <input name="password" type="password" autoComplete="current-password" required className="field" />
              </label>
            </ActionForm>
          </div>
        )}
        <p className="mt-6 text-center text-xs text-white/40">Forgot your password? Ask your admin to reset it.</p>
      </div>
    </main>
  );
}
