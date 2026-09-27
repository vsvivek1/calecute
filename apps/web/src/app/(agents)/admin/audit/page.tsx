/**
 * /admin/audit — the immutable trail.
 *
 * SUPER_ADMIN only. Read-only by construction: the table has no UPDATE or
 * DELETE policy, the application role lacks the privilege, and a trigger
 * rejects both. There is no write endpoint — entries are written by the actions
 * themselves, inside the same transaction as the change they describe, so an
 * action that rolled back leaves no trace and an audited action definitely
 * happened.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { api, getReportCatalogue } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false },
};

interface AuditRow {
  id: number;
  createdAt: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
}

export default async function AuditPage() {
  const session = await requireRole("/admin/audit", ["SUPER_ADMIN"]);
  const [catalogue, log] = await Promise.all([
    getReportCatalogue(session.token),
    api.get<{ data: AuditRow[] }>("/admin/audit-log?limit=100", {
      token: session.token,
    }),
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
        <h1>Audit log
        </h1>
        <p className="chips-note">
          
            Every admin action, append-only. Entries cannot be edited or deleted
            by anyone, including a super admin.
          
        </p>

        <div className="table-scroll" style={{ marginTop: "1.5rem" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {(log.data ?? []).map((row) => (
                <tr key={row.id}>
                  <td>
                    {new Date(row.createdAt).toLocaleString("en-IN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>{row.actorEmail ?? "—"}</td>
                  <td>{row.action}</td>
                  <td>
                    {row.entityType}
                    {row.entityId ? ` #${row.entityId}` : ""}
                  </td>
                  <td>
                    {/* Values are scrubbed server-side; no PAN or mobile
                        reaches an audit row. */}
                    <code style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>
                      {JSON.stringify(row.after ?? {}).slice(0, 120)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(log.data ?? []).length === 0 && (
          <p className="chips-note">
            Nothing recorded yet.
          </p>
        )}
      </main>
    </div>
  );
}
