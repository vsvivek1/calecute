/**
 * /admin/users — who is an admin, and which districts they cover.
 *
 * SUPER_ADMIN only. This page is the reason no email address is hardcoded
 * anywhere in the codebase: who holds which role is a database row, changed
 * here, and every change is written to the audit log.
 *
 * A district admin with no districts is refused rather than created, because
 * such an account can see nothing and the failure would look like a bug.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { api, getDistricts, getReportCatalogue } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ActionForm } from "@/components/agents/ActionForm";
import { upsertAdmin } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin users",
  robots: { index: false, follow: false },
};

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  districts: "ALL" | Array<{ districtId: number; nameEn: string; nameMl: string }>;
}

export default async function AdminUsersPage() {
  const session = await requireRole("/admin/users", ["SUPER_ADMIN"]);

  const [catalogue, districtList, users] = await Promise.all([
    getReportCatalogue(session.token),
    getDistricts(),
    api.get<{ data: AdminUser[] }>("/admin/users", { token: session.token }),
  ]);

  return (
    <div className="app-shell">
      <AdminNav
        email={session.me.user?.email ?? ""}
        role={session.me.user?.role ?? ""}
        scope="all districts"
        tabs={(catalogue.data ?? [])
          .filter((r): r is { slug: string; title: string } => Boolean(r.slug && r.title))
          .map((r) => ({ slug: r.slug, title: r.title }))}
      />

      <main className="admin-wrap">
        <h1>Admin users
        </h1>

        <section>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Districts</th>
                  <th>Last signed in</th>
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.districts === "ALL"
                        ? "all"
                        : user.districts.map((d) => d.nameEn).join(", ") || "none"}
                    </td>
                    <td>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString("en-IN")
                        : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Grant a role
          </h2>
          <div className="panel">
            <ActionForm
              action={upsertAdmin}
              label={"Save"}
            >
              <p className="chips-note">
                
                  Works for an existing account or a new one. The role takes
                  effect the first time they sign in with Google — no invitation
                  email is sent.
                
              </p>

              <div className="field">
                <label htmlFor="email">
                  Email address
                </label>
                <input type="email" id="email" name="email" required />
              </div>

              <div className="field">
                <label htmlFor="role">
                  Role
                </label>
                <select id="role" name="role" defaultValue="DISTRICT_ADMIN">
                  <option value="DISTRICT_ADMIN">District admin</option>
                  <option value="SUPER_ADMIN">Super admin</option>
                  <option value="AGENT">Agent (remove admin rights)</option>
                </select>
              </div>

              <fieldset>
                <legend>
                  Districts (district admins only)
                </legend>
                <div className="district-grid">
                  {(districtList.data ?? []).map((district) => (
                    <div className="choice" key={district.id}>
                      <input
                        type="checkbox"
                        id={`district-${district.id}`}
                        name="districtIds"
                        value={district.id}
                      />
                      <label htmlFor={`district-${district.id}`}>{district.nameEn}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </ActionForm>
          </div>
        </section>
      </main>
    </div>
  );
}
