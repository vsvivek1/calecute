/**
 * /admin/agents — the approval queue.
 *
 * Applications waiting on a decision, oldest first, because someone who applied
 * a week ago has been waiting a week. Approve needs no reason; reject and
 * suspend both do, and the applicant sees it.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getReportCatalogue, runReport } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ActionForm } from "@/components/agents/ActionForm";
import { approveAgent, rejectAgent } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Approvals",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = ["DISTRICT_ADMIN", "SUPER_ADMIN"] as const;

export default async function AdminAgentsPage() {
  const session = await requireRole("/admin/agents", ADMIN_ROLES);
  const [catalogue, pending] = await Promise.all([
    getReportCatalogue(session.token),
    runReport(session.token, "pending-verification"),
  ]);

  const scope =
    session.me.districtScope === "ALL"
      ? "all districts"
      : `${(session.me.districtScope as number[]).length} district(s)`;

  return (
    <div className="app-shell">
      <AdminNav
        email={session.me.user?.email ?? ""}
        role={session.me.user?.role ?? ""}
        scope={scope}
        tabs={(catalogue.data ?? [])
          .filter((r): r is { slug: string; title: string } => Boolean(r.slug && r.title))
          .map((r) => ({ slug: r.slug, title: r.title }))}
        current="pending-verification"
      />

      <main className="admin-wrap">
        <h1>Applications awaiting a decision
        </h1>

        {(pending.data ?? []).length === 0 ? (
          <p className="chips-note" style={{ marginTop: "1.5rem" }}>Nothing waiting. 
          </p>
        ) : (
          <div className="review-list">
            {(pending.data ?? []).map((row) => (
              <article className="panel review-card" key={String(row.id ?? row.code)}>
                <header>
                  <span className="code-badge" style={{ fontSize: "0.95rem" }}>
                    {String(row.code ?? "")}
                  </span>
                  <span className="chips-note">
                    waiting {String(row.days ?? "?")} day
                    {String(row.days) === "1" ? "" : "s"}
                  </span>
                </header>

                <dl className="review-facts">
                  <div>
                    <dt>Name</dt>
                    <dd>{String(row.name ?? "—")}</dd>
                  </div>
                  <div>
                    <dt>Where</dt>
                    <dd>
                      {String(row.bodyMl ?? row.body ?? "—")}
                      <span style={{ color: "var(--ink-faint)" }}>
                        {" "}
                        · {String(row.district ?? "")}
                        {row.ward && row.ward !== "—" ? ` · ward ${row.ward}` : ""}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Occupation</dt>
                    <dd>{String(row.occupation ?? "—")}</dd>
                  </div>
                  <div>
                    <dt>Background</dt>
                    <dd>
                      {String(row.education ?? "—")} · {String(row.hours ?? "—")} per day
                    </dd>
                  </div>
                </dl>

                <div className="review-actions">
                  <ActionForm
                    action={approveAgent}
                    hidden={{ agentId: String(row.id ?? "") }}
                    label={"Approve"}
                    pendingLabel={"Approving…"}
                  />

                  <ActionForm
                    action={rejectAgent}
                    hidden={{ agentId: String(row.id ?? "") }}
                    label={"Reject"}
                    pendingLabel={"Rejecting…"}
                    variant="secondary"
                  >
                    {/* Required: the applicant is shown this. */}
                    <input
                      type="text"
                      name="reason"
                      placeholder="Reason (the applicant sees this)"
                      aria-label="Reason for rejection"
                    />
                  </ActionForm>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
