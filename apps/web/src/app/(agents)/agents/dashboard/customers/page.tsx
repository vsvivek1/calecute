/**
 * /agents/dashboard/customers — who the agent referred and what they earn.
 *
 * Only customers locked to this agent's code appear, and that is enforced by
 * row-level security rather than by the query — a modified request returns an
 * empty list, not someone else's customers.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { api } from "@/lib/api/client";
import { Rupees } from "@/components/agents/Money";
import { AgentNav } from "@/components/agents/AgentNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

interface CustomerRow {
  id: number;
  displayName: string;
  status: string;
  lockedAt: string;
  totalPaidPaise: number;
  commissionEarnedPaise: number;
  lastPaymentAt: string | null;
}

export default async function CustomersPage() {
  const session = await requireRole("/agents/dashboard/customers", ["AGENT"]);
  const page = await api.get<{ data: CustomerRow[] }>("/agent/customers?limit=100", {
    token: session.token,
  });
  const rows = page.data ?? [];

  return (
    <>
      <div className="app-shell">
        <AgentNav email={session.me.user?.email ?? ""} current="customers" />
        <main className="wrap" style={{ paddingTop: "1.5rem" }}>
          <h1>Customers
          </h1>

          {rows.length === 0 ? (
            <p className="chips-note" style={{ marginTop: "1.5rem" }}>No customers yet.
            </p>
          ) : (
            <div className="table-scroll" style={{ marginTop: "1.5rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th lang="en">Customer</th>
                    <th lang="en">Status</th>
                    <th lang="en">Since</th>
                    <th lang="en" className="num">They paid</th>
                    <th lang="en" className="num">You earned</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.displayName}</td>
                      <td lang="en">{row.status}</td>
                      <td lang="en">
                        {new Date(row.lockedAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="num">
                        <Rupees paise={row.totalPaidPaise} />
                      </td>
                      <td className="num">
                        <Rupees paise={row.commissionEarnedPaise} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
