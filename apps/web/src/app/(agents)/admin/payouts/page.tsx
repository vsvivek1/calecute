/**
 * /admin/payouts — PAN verification and payout batches.
 *
 * Two jobs that belong together because one gates the other: commission is only
 * pulled into a batch for an agent whose PAN is verified and whose mobile is
 * confirmed. The liability report shows exactly who is stuck and why.
 *
 * An admin never sees a PAN here, only the mask. Verification means checking it
 * against whatever offline record exists and recording the decision.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { api, getReportCatalogue, runReport } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ActionForm } from "@/components/agents/ActionForm";
import { ReportTable } from "@/components/agents/ReportTable";
import { createPayoutBatch, decidePan, markBatchPaid } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Payouts",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = ["DISTRICT_ADMIN", "SUPER_ADMIN"] as const;

interface Batch {
  id: number;
  period: string;
  status: string;
  markedPaidAt: string | null;
  note: string | null;
}

export default async function AdminPayoutsPage() {
  const session = await requireRole("/admin/payouts", ADMIN_ROLES);
  const isSuper = session.me.user?.role === "SUPER_ADMIN";

  const [catalogue, liability, batches] = await Promise.all([
    getReportCatalogue(session.token),
    runReport(session.token, "outstanding-liability"),
    api
      .get<{ data: Batch[] }>("/admin/payout-batches", { token: session.token })
      .catch(() => ({ data: [] as Batch[] })),
  ]);

  const blocked = (liability.data ?? []).filter((row) => row.payable === "no");

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
        current="outstanding-liability"
      />

      <main className="admin-wrap">
        <h1>Payouts
        </h1>

        {/* Who is owed money but cannot be paid, and why. */}
        <section>
          <h2>Blocked from payout
          </h2>
          {blocked.length === 0 ? (
            <p className="chips-note">
              Nobody is blocked. Every agent with a balance can be paid.
            </p>
          ) : (
            <div className="review-list">
              {blocked.map((row) => (
                <article className="panel review-card" key={String(row.id ?? row.code)}>
                  <header>
                    <span className="code-badge" style={{ fontSize: "0.95rem" }}>
                      {String(row.code ?? "")}
                    </span>
                    <span className="chips-note" lang="en">
                      {String(row.name ?? "")} · {String(row.district ?? "")} · owed ₹
                      {String(row.outstanding ?? "0")} · PAN {String(row.pan ?? "")}
                    </span>
                  </header>

                  {isSuper ? (
                    <div className="review-actions">
                      <ActionForm
                        action={decidePan}
                        hidden={{ agentId: String(row.id ?? ""), decision: "VERIFIED" }}
                        label={"Verify PAN"}
                      />
                      <ActionForm
                        action={decidePan}
                        hidden={{ agentId: String(row.id ?? ""), decision: "REJECTED" }}
                        label={"Reject PAN"}
                        variant="secondary"
                      >
                        <input type="text" name="note" placeholder="Note (optional)" />
                      </ActionForm>
                    </div>
                  ) : (
                    <p className="chips-note">
                      PAN decisions are made by a super admin.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Batches. SUPER_ADMIN only, because these move money. */}
        <section>
          <h2>Payout batches
          </h2>

          {isSuper && (
            <div className="panel" style={{ marginBottom: "1.25rem" }}>
              <ActionForm
                action={createPayoutBatch}
                label={"Open a batch"}
              >
                <p className="chips-note">
                  
                    Gathers every releasable commission for the month — verified
                    PAN and confirmed mobile only, as the published terms say.
                  
                </p>
                <div className="filters" style={{ marginBottom: 0 }}>
                  <div className="field">
                    <label htmlFor="period">
                      Period
                    </label>
                    <input
                      type="text"
                      id="period"
                      name="period"
                      placeholder="2026-09"
                      pattern="\d{4}-\d{2}"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="batch-note">
                      Note
                    </label>
                    <input type="text" id="batch-note" name="note" />
                  </div>
                </div>
              </ActionForm>
            </div>
          )}

          {(batches.data ?? []).length === 0 ? (
            <p className="chips-note">
              No batches yet.
            </p>
          ) : (
            <div className="review-list">
              {(batches.data ?? []).map((batch) => (
                <article className="panel review-card" key={batch.id}>
                  <header>
                    <span className="code-badge" style={{ fontSize: "0.95rem" }}>
                      {batch.period}
                    </span>
                    <span className="chips-note" lang="en">
                      {batch.status}
                      {batch.markedPaidAt
                        ? ` · paid ${new Date(batch.markedPaidAt).toLocaleDateString("en-IN")}`
                        : ""}
                    </span>
                  </header>

                  {isSuper && batch.status !== "PAID" && (
                    <ActionForm
                      action={markBatchPaid}
                      hidden={{ batchId: batch.id }}
                      label={"Mark paid"}
                      pendingLabel={"Recording…"}
                    >
                      <input
                        type="text"
                        name="reference"
                        placeholder="Bank reference (required)"
                        aria-label="Bank reference"
                      />
                    </ActionForm>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* The full liability picture. */}
        <section>
          <h2>Outstanding commission
          </h2>
          <ReportTable
            columns={liability.columns ?? []}
            rows={liability.data ?? []}
            empty="Nothing outstanding."
          />
        </section>
      </main>
    </div>
  );
}
