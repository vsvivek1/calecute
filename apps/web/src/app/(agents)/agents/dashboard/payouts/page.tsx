/**
 * /agents/dashboard/payouts — payout setup.
 *
 * Everything blocking a withdrawal is stated at the top with the amount that is
 * waiting, because that is the only honest reason to ask for a PAN: there is
 * money and this is what releases it.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getPayoutProfile } from "@/lib/api/client";
import { Rupees } from "@/components/agents/Money";
import { PayoutForm } from "@/components/agents/PayoutForm";
import { MobileVerify } from "@/components/agents/MobileVerify";
import { AgentNav } from "@/components/agents/AgentNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Payout setup",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const REASON: Record<string, string> = {
  PAN_NOT_VERIFIED: "PAN not yet verified",
  MOBILE_NOT_VERIFIED: "Mobile number not verified",
};

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("/agents/dashboard/payouts", ["AGENT"]);
  const params = await searchParams;
  const profile = await getPayoutProfile(session.token);

  const flag = (k: string) =>
    (Array.isArray(params[k]) ? params[k][0] : params[k]) === "1";

  return (
    <>
      <div className="app-shell">
        <AgentNav email={session.me.user?.email ?? ""} current="payouts" />

        <main className="wrap" style={{ paddingTop: "1.5rem" }}>
          <h1>Payout setup
          </h1>

          {flag("saved") && (
            <p className="notice ok" role="status">Saved. Payouts are released once an administrator verifies your PAN.
            </p>
          )}
          {flag("verified") && (
            <p className="notice ok" role="status">Mobile number verified.
            </p>
          )}

          {/* The prompt: the balance, then exactly what is holding it. */}
          {profile.withdrawal?.blocked && (
            <div className="panel" style={{ marginTop: "1.5rem" }}>
              <div className="stat accent" style={{ border: 0, padding: 0 }}>
                <div className="label">
                  Waiting to be paid
                </div>
                <div className="value">
                  <Rupees paise={profile.withdrawal.pendingBalancePaise} />
                </div>
              </div>
              <ul className="plain-list" style={{ marginTop: "1rem" }}>
                {(profile.withdrawal.reasons ?? []).map((code) => (
                  <li key={code}>{REASON[code] ?? code}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section>
            <h2>Mobile verification
            </h2>
            <div className="panel">
              <MobileVerify
                verified={Boolean(profile.mobileVerified)}
                codeSent={flag("sent")}
              />
            </div>
          </section>

          <section>
            <h2>PAN and bank details
            </h2>
            <div className="panel">
              <PayoutForm
                currentPan={profile.pan ?? null}
                panStatus={profile.panStatus ?? "NOT_SUBMITTED"}
                currentAccount={profile.bankAccount ?? null}
                currentIfsc={profile.bankIfsc ?? null}
                currentHolder={profile.bankHolderName ?? null}
                currentUpi={profile.upiId ?? null}
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
