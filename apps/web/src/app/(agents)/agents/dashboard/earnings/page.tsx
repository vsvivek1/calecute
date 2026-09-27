/**
 * /agents/dashboard/earnings — the totals, and the rows behind them.
 *
 * The ledger is the point. A totals card on its own is something an agent has
 * to take on trust, and this whole programme is built for people who have every
 * reason not to extend trust to a recruiter. Each line names the customer, the
 * payment it came from, the gross, the TDS deducted and the net, so the number
 * at the top can be checked rather than believed.
 *
 * The rate and the TDS section come from the API, never hardcoded here: they
 * are published terms, and two places stating them is one place to get wrong.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getAgentEarnings } from "@/lib/api/client";
import { Rupees } from "@/components/agents/Money";
import { AgentNav } from "@/components/agents/AgentNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Earnings",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  ACCRUED: "Accrued",
  APPROVED: "Approved for payout",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  FORFEITED: "Forfeited",
};

export default async function EarningsPage() {
  const session = await requireRole("/agents/dashboard/earnings", ["AGENT"]);
  const earnings = await getAgentEarnings(session.token);

  const rows = earnings.data ?? [];
  const summary = earnings.summary ?? {};
  const terms = earnings.terms ?? {};
  const rate = terms.rateBps != null ? terms.rateBps / 100 : null;
  const tds = terms.tdsRateBps != null ? terms.tdsRateBps / 100 : null;

  return (
    <div className="app-shell">
      <AgentNav email={session.me.user?.email ?? ""} current="earnings" />

      <main className="wrap" style={{ paddingTop: "1.5rem" }}>
        <h1>Earnings</h1>

        <section>
          <div className="stat-row">
            <div className="stat accent">
              <div className="label">Pending</div>
              <div className="value">
                <Rupees paise={summary.pendingPaise} />
              </div>
            </div>
            <div className="stat">
              <div className="label">Paid</div>
              <div className="value">
                <Rupees paise={summary.paidPaise} />
              </div>
            </div>
            <div className="stat">
              <div className="label">Lifetime</div>
              <div className="value">
                <Rupees paise={summary.lifetimePaise} />
              </div>
            </div>
            <div className="stat">
              <div className="label">TDS withheld</div>
              <div className="value">
                <Rupees paise={summary.tdsWithheldPaise} />
              </div>
            </div>
          </div>

          {rate != null && (
            <p className="chips-note">
              {rate}% of every payment a customer you referred makes
              {terms.basis ? `, ${terms.basis.toLowerCase()}` : ""}
              {tds != null
                ? `. ${tds}% TDS is deducted under section ${terms.tdsSection ?? "194H"} and paid to the Income Tax Department against your PAN`
                : ""}
              .
            </p>
          )}
        </section>

        <section>
          <h2>Commission ledger</h2>
          {rows.length === 0 ? (
            <p className="chips-note">
              Nothing yet. A line appears here each time a customer who used
              your code makes a payment.
            </p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th>Commission</th>
                    <th>TDS</th>
                    <th>Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.accruedAt
                          ? new Date(row.accruedAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>{row.customerName ?? "—"}</td>
                      <td>
                        <Rupees paise={row.basePaise} />
                      </td>
                      <td>
                        <Rupees paise={row.grossCommissionPaise} />
                      </td>
                      <td>
                        <Rupees paise={row.tdsPaise} />
                      </td>
                      <td>
                        <Rupees paise={row.netCommissionPaise} />
                      </td>
                      <td>{STATUS_LABEL[row.status] ?? row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <p className="chips-note">
            <a href="/agents/dashboard/profile">
              Add your PAN and bank details
            </a>{" "}
            to release a payout.
          </p>
        </section>
      </main>
    </div>
  );
}
