/**
 * /agents/signup — step 2 of the flow.
 *
 * Step 1 was Google Sign-In, so reaching this page means there is a session.
 * The eligibility check happens server-side before anything renders: an account
 * that already has an application never sees the form, it sees its status.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-guard";
import { getDistricts, getEligibility } from "@/lib/api/client";
import { signup as copy } from "@/lib/agents/content";
import { En, Ml } from "@/components/agents/Bilingual";
import { SignupForm } from "@/components/agents/SignupForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "രജിസ്ട്രേഷൻ",
  // An application form has no business in a search index.
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function toId(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession("/agents/signup");
  const params = await searchParams;

  const [eligibility, districtList] = await Promise.all([
    getEligibility(session.token),
    getDistricts(),
  ]);

  // Already applied: show where they stand rather than a form they cannot use.
  if (!eligibility.canApply && eligibility.existingApplication) {
    redirect("/agents/dashboard");
  }

  const termsVersion = eligibility.currentTerms?.version;
  if (!termsVersion) {
    return (
      <main className="wrap" style={{ paddingTop: "6rem" }}>
        <p className="notice stop">
          <Ml>രജിസ്ട്രേഷൻ ഇപ്പോൾ ലഭ്യമല്ല. പിന്നീട് ശ്രമിക്കുക.</Ml>
          <En>
            Registration is unavailable: no terms version is published. Run the
            seed script.
          </En>
        </p>
      </main>
    );
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

  return (
    <>

      <header className="masthead">
        <span className="mark" aria-hidden="true" />
        <span className="who">
          <strong lang="en">Calecute Technologies (OPC) Pvt Ltd</strong>
          <span lang="en">{session.me.user?.email}</span>
        </span>
      </header>

      <div className="content">
        <main className="wrap" style={{ paddingTop: "2.5rem" }}>
          <span className="eyebrow" lang="en">
            Step 2 of 3
          </span>
          <h1>
            <Ml>{copy.step2Heading.ml}</Ml>
            <En>{copy.step2Heading.en}</En>
          </h1>

          <div className="panel" style={{ marginTop: "1.75rem" }}>
            <SignupForm
              districts={districtList.data ?? []}
              termsVersion={termsVersion}
              apiBase={apiBase}
              initialDistrictId={toId(first(params.district))}
              initialLocalBodyId={toId(first(params.panchayat))}
              defaultName={session.me.user?.name ?? ""}
              // Stamped server-side: the timing check must not trust a clock
              // the client controls.
              renderedAt={Date.now()}
            />
          </div>
        </main>
      </div>
    </>
  );
}
