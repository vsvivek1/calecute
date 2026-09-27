/**
 * /agents/dashboard — the agent's home screen.
 *
 * One API call fills the whole page. That is deliberate on the target device: a
 * budget Android phone on one bar of 4G, where four sequential round trips is
 * the difference between usable and not.
 *
 * The payout prompt is the most considered thing here. An agent with a balance
 * they cannot withdraw needs to know exactly what is blocking it, so the
 * pending amount and the specific reason sit together — not a generic "complete
 * your profile" nag.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getAgentDashboard } from "@/lib/api/client";
import { Rupees } from "@/components/agents/Money";
import { ShareRow } from "@/components/agents/ShareRow";
import { AgentNav } from "@/components/agents/AgentNav";
import { company, formattedContactNumber, whatsappContactUrl } from "@/lib/agents/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  WAITLISTED: "Waitlisted",
  WITHDRAWN: "Withdrawn",
};

const BLOCKED_REASON: Record<string, string> = {
  PAN_NOT_SUBMITTED: "Add your PAN to withdraw.",
  PAN_UNDER_REVIEW: "Your PAN is being verified.",
};

export default async function AgentDashboard() {
  const session = await requireRole("/agents/dashboard", ["AGENT"]);

  // An account with no application belongs in the signup flow, not here.
  if (!session.me.agent) redirect("/agents/signup");

  const dashboard = await getAgentDashboard(session.token);
  const status = STATUS_LABEL[dashboard.agent?.status ?? ""] ?? {
    ml: dashboard.agent?.status ?? "",
    en: dashboard.agent?.status ?? "",
  };

  const blocked = dashboard.payout?.withdrawalBlocked;
  const reason = dashboard.payout?.blockedReason
    ? BLOCKED_REASON[dashboard.payout.blockedReason]
    : null;

  return (
    <>

      <div className="app-shell">
        <AgentNav email={session.me.user?.email ?? ""} current="dashboard" />

        <main className="wrap" style={{ paddingTop: "2rem" }}>
          {/* Agent code and sharing — the thing they came for. */}
          <section>
            <span className="eyebrow">
              Agent code
            </span>
            <p>
              <span className="code-badge">{dashboard.referral?.code}</span>
            </p>
            <p className="chips-note">{status}
            </p>
          </section>

          <section>
            <div className="panel">
              <div className="share-grid">
                <div>
                  <ShareRow
                    link={dashboard.referral?.link ?? ""}
                    whatsappUrl={dashboard.referral?.whatsappShareUrl ?? ""}
                  />
                </div>
                <div className="qr-holder">
                  {/* Proxied so the bearer token never has to live in a URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="qr"
                    src="/agents/dashboard/qr"
                    alt="QR code linking to your referral page"
                    width={220}
                    height={220}
                  />
                  <a className="chips-note" href="/agents/dashboard/qr?format=svg" download>
                    Download SVG
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/*
            The channel, asked for once and early.
            Product news, price changes and payout dates go out there and
            nowhere else, so an agent who does not follow it misses the things
            that affect what they earn. Stated as the reason, not as a nag.
          */}
          <section>
            <div className="panel emphasis">
              <h2>Follow the WhatsApp channel</h2>
              <p>
                New products, price changes and payout dates are announced
                there. It is the only place we announce them.
              </p>
              <p style={{ marginTop: "1rem" }}>
                <a
                  className="button"
                  href={company.whatsappChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Follow the channel</span>
                </a>
              </p>
              <p className="chips-note" style={{ marginTop: "0.75rem" }}>
                Something wrong, or a question?{" "}
                <a
                  href={whatsappContactUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp {formattedContactNumber()}
                </a>
              </p>
            </div>
          </section>

          {/* Earnings. */}
          <section>
            <h2>Earnings
            </h2>
            <div className="stat-row">
              <div className="stat accent">
                <div className="label">
                  Pending
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.pendingPaise} />
                </div>
              </div>
              <div className="stat">
                <div className="label">
                  Paid
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.paidPaise} />
                </div>
              </div>
              <div className="stat">
                <div className="label">
                  Lifetime
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.lifetimePaise} />
                </div>
              </div>
              <div className="stat">
                <div className="label">
                  TDS withheld
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.tdsWithheldPaise} />
                </div>
              </div>
            </div>

            <p style={{ marginTop: "1rem" }}>
              <a href="/agents/dashboard/earnings">See every commission</a>
            </p>

            {blocked && (
              <div className="notice warn">{reason ?? "Complete payout setup to withdraw."}
                <p style={{ marginTop: "0.75rem" }}>
                  <a className="button secondary" href="/agents/dashboard/profile">
                    <span>Set up payouts
                    </span>
                  </a>
                </p>
              </div>
            )}
          </section>

          {/* Customers. */}
          <section>
            <h2>Customers
            </h2>
            {(dashboard.customers?.total ?? 0) === 0 ? (
              <p className="chips-note">No customers yet. Share your link to get started.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard.customers?.recent ?? []).map((customer) => (
                      <tr key={customer.customerId}>
                        <td>{customer.displayName}</td>
                        <td>{customer.status}</td>
                        <td>
                          {customer.lockedAt
                            ? new Date(customer.lockedAt).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(dashboard.customers?.total ?? 0) > 5 && (
              <p style={{ marginTop: "1rem" }}>
                <a href="/agents/dashboard/customers">
                  See all {dashboard.customers?.total} customers
                </a>
              </p>
            )}
          </section>

          {/* Products. */}
          <section>
            <h2>Your products
            </h2>
            {(dashboard.products?.length ?? 0) === 0 ? (
              <p className="chips-note">
                Nothing assigned yet — an administrator assigns these.{" "}
                <a href="/agents/dashboard/products">See everything we make</a>.
              </p>
            ) : (
              <ul className="chips">
                {(dashboard.products ?? []).map((product) => (
                  <li key={product.id}>{product.nameEn}
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: "1rem" }}>
              <a href="/agents/dashboard/products">Products and sales material</a>
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
