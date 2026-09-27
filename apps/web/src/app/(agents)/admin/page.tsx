/**
 * /admin — the admin landing view.
 *
 * It opens on PANCHAYATS WITH ZERO AGENTS, sorted by district. That is a
 * deliberate choice from the brief and worth restating: this list is the
 * programme's work queue. An admin arriving here should see where recruitment
 * has to go next, not a menu that makes them go looking for it.
 *
 * A district admin sees only their districts. That scoping is enforced in the
 * database, so this page does not filter and could not leak another district's
 * rows even if it tried.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getReportCatalogue, runReport } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ReportTable } from "@/components/agents/ReportTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = ["DISTRICT_ADMIN", "SUPER_ADMIN"] as const;

export default async function AdminHome() {
  const session = await requireRole("/admin", ADMIN_ROLES);

  const catalogue = await getReportCatalogue(session.token);
  const landing = catalogue.defaultReport ?? "zero-agent-panchayats";

  const [zeroAgents, belowThreshold, coverage] = await Promise.all([
    runReport(session.token, landing),
    runReport(session.token, "below-threshold-panchayats"),
    runReport(session.token, "panchayat-coverage"),
  ]);

  // Rows arrive keyed by the column keys the API publishes — see the coverage
  // report's column list: district, capacity, approved, pending, remaining…
  const filledOf = (row: Record<string, unknown>) =>
    Number(row.approved ?? 0) + Number(row.pending ?? 0);

  const covered = (coverage.data ?? []).filter((row) => filledOf(row) > 0);
  const totalBodies = coverage.data?.length ?? 0;
  const totalSlots = (coverage.data ?? []).reduce(
    (sum, row) => sum + Number(row.capacity ?? 0),
    0,
  );
  const totalFilled = (coverage.data ?? []).reduce(
    (sum, row) => sum + filledOf(row),
    0,
  );
  const waitlisted = (coverage.data ?? []).reduce(
    (sum, row) => sum + Number(row.waitlisted ?? 0),
    0,
  );

  const scope =
    session.me.districtScope === "ALL"
      ? "all districts"
      : `${(session.me.districtScope as number[]).length} district(s)`;

  // Coverage by district, for the bar chart.
  const byDistrict = new Map<string, { total: number; covered: number }>();
  for (const row of coverage.data ?? []) {
    const key = String(row.district ?? "—");
    const entry = byDistrict.get(key) ?? { total: 0, covered: 0 };
    entry.total += 1;
    if (filledOf(row) > 0) entry.covered += 1;
    byDistrict.set(key, entry);
  }
  const districtRows = [...byDistrict.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <>
      <div className="app-shell">
        <AdminNav
          email={session.me.user?.email ?? ""}
          role={session.me.user?.role ?? ""}
          scope={scope}
          tabs={(catalogue.data ?? [])
            .filter((r): r is { slug: string; title: string } =>
              Boolean(r.slug && r.title),
            )
            .map((r) => ({ slug: r.slug, title: r.title }))}
        />

        <main className="admin-wrap">
          <div className="stat-row">
            <div className="stat accent">
              <div className="label">
                Panchayats with zero agents
              </div>
              <div className="value">{zeroAgents.rowCount ?? 0}</div>
            </div>
            <div className="stat">
              <div className="label">
                Below threshold (1–2)
              </div>
              <div className="value">{belowThreshold.rowCount ?? 0}</div>
            </div>
            <div className="stat">
              <div className="label">
                Covered
              </div>
              <div className="value">
                {covered.length}
                <span style={{ fontSize: "0.9rem", color: "var(--ink-faint)" }}>
                  {" "}
                  / {totalBodies}
                </span>
              </div>
            </div>
            <div className="stat">
              <div className="label">
                Slots filled
              </div>
              <div className="value">
                {totalFilled}
                <span style={{ fontSize: "0.9rem", color: "var(--ink-faint)" }}>
                  {" "}
                  / {totalSlots}
                </span>
              </div>
            </div>
            <div className="stat">
              <div className="label">
                On waitlists
              </div>
              <div className="value">{waitlisted}</div>
            </div>
          </div>

          {/* Coverage per district, so the gap is visible at a glance. */}
          <section>
            <h2>Coverage by district
            </h2>
            <div className="chart">
              {districtRows.map(([district, counts]) => {
                const percent = counts.total
                  ? Math.round((counts.covered / counts.total) * 100)
                  : 0;
                return (
                  <div className="chart-row" key={district}>
                    <span>{district}</span>
                    <span className="chart-track">
                      <span className="chart-fill" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="num">
                      {counts.covered}/{counts.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* The landing report itself. */}
          <section>
            <h2>{zeroAgents.report?.title ?? "Panchayats with zero agents"}
            </h2>
            <p className="chips-note">
              {zeroAgents.report?.description ?? ""}
            </p>

            <p style={{ margin: "1rem 0" }}>
              <a
                className="button secondary"
                href={`/admin/reports/${landing}`}
                style={{ width: "auto", display: "inline-flex" }}
              >
                <span>Open full report, filters and export
                </span>
              </a>
            </p>

            {zeroAgents.truncated && (
              <p className="notice warn">
                
                  Showing the first {zeroAgents.rowCount} rows. Filter by district
                  or export to see everything.
                
              </p>
            )}

            <ReportTable
              columns={zeroAgents.columns ?? []}
              rows={(zeroAgents.data ?? []).slice(0, 50)}
              empty="Every panchayat in your scope has at least one agent."
            />
          </section>
        </main>
      </div>
    </>
  );
}
