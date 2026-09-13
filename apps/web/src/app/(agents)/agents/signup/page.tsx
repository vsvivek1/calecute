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
import { SignupForm } from "@/components/agents/SignupForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register",
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
            Registration is unavailable: no terms version is published. Run the
            seed script.
          
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
          <strong>Calecute Technologies (OPC) Pvt Ltd</strong>
          <span>{session.me.user?.email}</span>
        </span>
      </header>

      <div className="content">
        <main className="wrap" style={{ paddingTop: "2.5rem" }}>
          <span className="eyebrow">
            Step 2 of 3
          </span>
          <h1>{copy.step2Heading}
          </h1>

          <div className="panel" style={{ marginTop: "1.75rem" }}>
            <SignupForm
              /* Only what the form renders. The API also returns Malayalam
                 names and LGD codes; sending them would put them in the
                 client payload for nothing. */
              districts={(districtList.data ?? []).map((d) => ({
                id: d.id ?? 0,
                nameEn: d.nameEn ?? "",
              }))}
              termsVersion={termsVersion}
              apiBase={apiBase}
              initialDistrictId={toId(first(params.district))}
              defaultName={session.me.user?.name ?? ""}
              // Issued and signed by the API. The timing check is measured
              // against its clock, not one this frontend or the browser holds.
              formToken={eligibility.formToken ?? ""}
            />
          </div>
        </main>
      </div>
    </>
  );
}
