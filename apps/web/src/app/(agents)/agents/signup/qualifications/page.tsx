/**
 * /agents/signup/qualifications — step 3, optional.
 */
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth-guard";
import { signup as copy } from "@/lib/agents/content";
import { QualificationsForm } from "@/components/agents/QualificationsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Additional details",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function QualificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireSession("/agents/signup/qualifications");
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  return (
    <>

      <header className="masthead">
        <span className="mark" aria-hidden="true" />
        <span className="who">
          <strong lang="en">Calecute Technologies (OPC) Pvt Ltd</strong>
        </span>
      </header>

      <div className="content">
        <main className="wrap" style={{ paddingTop: "2.5rem" }}>
          <span className="eyebrow" lang="en">
            Step 3 of 3 · optional
          </span>

          {code && (
            <p className="notice ok">Application received. Your agent code:
              <span className="code-badge" style={{ marginTop: "0.6rem" }}>
                {code}
              </span>
            </p>
          )}

          <h1>{copy.step3Heading}
          </h1>

          <div className="panel" style={{ marginTop: "1.75rem" }}>
            <QualificationsForm />
          </div>
        </main>
      </div>
    </>
  );
}
