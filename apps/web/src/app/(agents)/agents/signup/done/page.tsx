/**
 * /agents/signup/done — confirmation.
 *
 * Says what happens next and nothing else. No upsell, no "share with ten
 * friends", no countdown to approval — the application is with a human now and
 * pretending otherwise would undo the page that got them here.
 */
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth-guard";
import { signup as copy } from "@/lib/agents/content";
import { En, Ml } from "@/components/agents/Bilingual";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "അപേക്ഷ ലഭിച്ചു",
  robots: { index: false, follow: false },
};

export default async function SignupDonePage() {
  const session = await requireSession("/agents/signup/done");
  const agentCode = session.me.agent?.agentCode;

  return (
    <>

      <header className="masthead">
        <span className="mark" aria-hidden="true" />
        <span className="who">
          <strong lang="en">Calecute Technologies (OPC) Pvt Ltd</strong>
        </span>
      </header>

      <div className="content">
        <main className="wrap" style={{ paddingTop: "4rem" }}>
          <h1>
            <Ml>{copy.success.heading.ml}</Ml>
            <En>{copy.success.heading.en}</En>
          </h1>

          {agentCode && (
            <p style={{ margin: "1.5rem 0" }}>
              <span className="code-badge">{agentCode}</span>
            </p>
          )}

          <div style={{ maxWidth: "32rem" }}>
            <Ml>{copy.success.body.ml}</Ml>
            <En>{copy.success.body.en}</En>
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <a className="button" href="/agents/dashboard">
              <span>
                <Ml>ഡാഷ്ബോർഡിലേക്ക്</Ml>
                <En>Go to dashboard</En>
              </span>
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
