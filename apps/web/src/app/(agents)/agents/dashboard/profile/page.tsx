/**
 * /agents/dashboard/profile — who the agent is, and everything needed to pay
 * them.
 *
 * Identity and payout details sit on one page on purpose. They were two, and an
 * agent looking for "where do I put my bank account" had no reason to guess a
 * tab called Payouts. Everything about *them* is here.
 *
 * Whatever is blocking a withdrawal is stated at the top with the amount that
 * is waiting, because that is the only honest reason to ask for a PAN: there is
 * money and this is what releases it.
 *
 * Geography is shown but not editable. Moving panchayat vacates one place and
 * takes another and rewrites every coverage report, so it is an admin action on
 * request — the API says the same thing and this page repeats it rather than
 * offering a field that would fail.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getAgentProfile, getPayoutProfile } from "@/lib/api/client";
import { Rupees } from "@/components/agents/Money";
import { PayoutForm } from "@/components/agents/PayoutForm";
import { MobileVerify } from "@/components/agents/MobileVerify";
import { AgentNav } from "@/components/agents/AgentNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const REASON: Record<string, string> = {
  PAN_NOT_VERIFIED: "PAN not yet verified",
  MOBILE_NOT_VERIFIED: "Mobile number not verified",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  WAITLISTED: "Waitlisted",
  WITHDRAWN: "Withdrawn",
};

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("/agents/dashboard/profile", ["AGENT"]);
  const params = await searchParams;

  // Two independent reads; neither blocks the other.
  const [payout, account] = await Promise.all([
    getPayoutProfile(session.token),
    getAgentProfile(session.token),
  ]);
  const profile = account.profile;

  const flag = (k: string) =>
    (Array.isArray(params[k]) ? params[k][0] : params[k]) === "1";

  const place = profile?.localBodyNameEn
    ? `${profile.localBodyNameEn}${
        profile.wardNumber ? `, ward ${profile.wardNumber}` : ""
      }`
    : profile?.pendingLocalBodyName
      ? `${profile.pendingLocalBodyName}${
          profile.pendingWardNumber ? `, ward ${profile.pendingWardNumber}` : ""
        } — not yet placed`
      : null;

  return (
    <div className="app-shell">
      <AgentNav email={session.me.user?.email ?? ""} current="profile" />

      <main className="wrap" style={{ paddingTop: "1.5rem" }}>
        <h1>Profile</h1>

        {flag("saved") && (
          <p className="notice ok" role="status">Saved. Payouts are released once an administrator verifies your PAN.
          </p>
        )}
        {flag("verified") && (
          <p className="notice ok" role="status">Mobile number verified.
          </p>
        )}

        {/* ------------------------------------------------ who they are */}
        <section>
          <h2>Your details</h2>
          <div className="panel">
            <dl className="detail-list">
              <Row label="Name" value={profile?.name ?? null} />
              <Row label="Agent code" value={profile?.agentCode ?? null} />
              <Row
                label="Status"
                value={STATUS_LABEL[profile?.status ?? ""] ?? profile?.status ?? null}
              />
              <Row label="Email" value={profile?.email ?? null} />
              <Row label="Mobile" value={profile?.mobile ?? null} />
              <Row label="District" value={profile?.districtNameEn ?? null} />
              <Row label="Panchayat or municipality" value={place} />
              <Row label="Occupation" value={profile?.occupation ?? null} />
            </dl>
            <p className="field-hint">
              District, panchayat and ward are fixed at signup. Message us on
              WhatsApp if any of them is wrong and we will correct it.
            </p>
          </div>
        </section>

        {/* The prompt: the balance, then exactly what is holding it. */}
        {payout.withdrawal?.blocked && (
          <section>
            <div className="panel">
              <div className="stat accent" style={{ border: 0, padding: 0 }}>
                <div className="label">Waiting to be paid</div>
                <div className="value">
                  <Rupees paise={payout.withdrawal.pendingBalancePaise} />
                </div>
              </div>
              <ul className="plain-list" style={{ marginTop: "1rem" }}>
                {(payout.withdrawal.reasons ?? []).map((code) => (
                  <li key={code}>{REASON[code] ?? code}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <h2>Mobile verification</h2>
          <div className="panel">
            <MobileVerify
              verified={Boolean(payout.mobileVerified)}
              codeSent={flag("sent")}
            />
          </div>
        </section>

        <section>
          <h2>PAN and bank details</h2>
          <div className="panel">
            <PayoutForm
              currentPan={payout.pan ?? null}
              panStatus={payout.panStatus ?? "NOT_SUBMITTED"}
              currentAccount={payout.bankAccount ?? null}
              currentIfsc={payout.bankIfsc ?? null}
              currentHolder={payout.bankHolderName ?? null}
              currentUpi={payout.upiId ?? null}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
