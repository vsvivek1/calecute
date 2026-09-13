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
import { En, Ml } from "@/components/agents/Bilingual";
import { Rupees } from "@/components/agents/Money";
import { ShareRow } from "@/components/agents/ShareRow";
import { AgentNav } from "@/components/agents/AgentNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ഡാഷ്ബോർഡ്",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { ml: string; en: string }> = {
  PENDING_REVIEW: { ml: "പരിശോധനയിൽ", en: "Under review" },
  APPROVED: { ml: "അംഗീകരിച്ചു", en: "Approved" },
  REJECTED: { ml: "നിരസിച്ചു", en: "Rejected" },
  SUSPENDED: { ml: "താൽക്കാലികമായി നിർത്തി", en: "Suspended" },
  WAITLISTED: { ml: "വെയിറ്റിംഗ് ലിസ്റ്റിൽ", en: "Waitlisted" },
  WITHDRAWN: { ml: "പിൻവലിച്ചു", en: "Withdrawn" },
};

const BLOCKED_REASON: Record<string, { ml: string; en: string }> = {
  PAN_NOT_SUBMITTED: {
    ml: "പണം പിൻവലിക്കാൻ പാൻ നൽകണം.",
    en: "Add your PAN to withdraw.",
  },
  PAN_UNDER_REVIEW: {
    ml: "പാൻ പരിശോധനയിലാണ്.",
    en: "Your PAN is being verified.",
  },
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
            <span className="eyebrow" lang="en">
              Agent code
            </span>
            <p>
              <span className="code-badge">{dashboard.referral?.code}</span>
            </p>
            <p className="chips-note">
              <Ml>{status.ml}</Ml>
              <En>{status.en}</En>
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
                    <En>Download SVG</En>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Earnings. */}
          <section>
            <h2>
              <Ml>വരുമാനം</Ml>
              <En>Earnings</En>
            </h2>
            <div className="stat-row">
              <div className="stat accent">
                <div className="label" lang="en">
                  Pending
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.pendingPaise} />
                </div>
              </div>
              <div className="stat">
                <div className="label" lang="en">
                  Paid
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.paidPaise} />
                </div>
              </div>
              <div className="stat">
                <div className="label" lang="en">
                  Lifetime
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.lifetimePaise} />
                </div>
              </div>
              <div className="stat">
                <div className="label" lang="en">
                  TDS withheld
                </div>
                <div className="value">
                  <Rupees paise={dashboard.earnings?.tdsWithheldPaise} />
                </div>
              </div>
            </div>

            {blocked && (
              <div className="notice warn">
                <Ml>
                  {reason?.ml ?? "പണം പിൻവലിക്കാൻ വിവരങ്ങൾ പൂർത്തിയാക്കുക."}
                </Ml>
                <En>{reason?.en ?? "Complete payout setup to withdraw."}</En>
                <p style={{ marginTop: "0.75rem" }}>
                  <a className="button secondary" href="/agents/dashboard/payouts">
                    <span>
                      <Ml>പണം സ്വീകരിക്കാൻ സജ്ജമാക്കുക</Ml>
                      <En>Set up payouts</En>
                    </span>
                  </a>
                </p>
              </div>
            )}
          </section>

          {/* Customers. */}
          <section>
            <h2>
              <Ml>ഉപഭോക്താക്കൾ</Ml>
              <En>Customers</En>
            </h2>
            {(dashboard.customers?.total ?? 0) === 0 ? (
              <p className="chips-note">
                <Ml>ഇതുവരെ ഉപഭോക്താക്കളില്ല. നിങ്ങളുടെ ലിങ്ക് പങ്കുവയ്ക്കുക.</Ml>
                <En>No customers yet. Share your link to get started.</En>
              </p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th lang="en">Customer</th>
                      <th lang="en">Status</th>
                      <th lang="en">Since</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard.customers?.recent ?? []).map((customer) => (
                      <tr key={customer.customerId}>
                        <td>{customer.displayName}</td>
                        <td lang="en">{customer.status}</td>
                        <td lang="en">
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
                  <En>See all {dashboard.customers?.total} customers</En>
                </a>
              </p>
            )}
          </section>

          {/* Products. */}
          <section>
            <h2>
              <Ml>ഉൽപ്പന്നങ്ങൾ</Ml>
              <En>Your products</En>
            </h2>
            {(dashboard.products?.length ?? 0) === 0 ? (
              <p className="chips-note">
                <Ml>ഇതുവരെ ഉൽപ്പന്നങ്ങൾ നൽകിയിട്ടില്ല.</Ml>
                <En>No products assigned yet. An administrator assigns these.</En>
              </p>
            ) : (
              <ul className="chips">
                {(dashboard.products ?? []).map((product) => (
                  <li key={product.id}>
                    <Ml>{product.nameMl}</Ml>
                    <En>{product.nameEn}</En>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
