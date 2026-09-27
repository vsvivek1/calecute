/**
 * /admin/reports/{slug} — any report, with filters and export.
 *
 * One page for all sixteen. The slug picks the report, the API describes its
 * columns, and the filter set is uniform — so a report added on the server
 * appears here complete, with no frontend change.
 *
 * CSV and PDF export are plain links to the API with the same filters applied,
 * carried through a small proxy route that attaches the bearer token.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getDistricts, getReportCatalogue, runReport } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ReportTable } from "@/components/agents/ReportTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Report",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = ["DISTRICT_ADMIN", "SUPER_ADMIN"] as const;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await requireRole(`/admin/reports/${slug}`, ADMIN_ROLES);

  const catalogue = await getReportCatalogue(session.token);
  const definition = (catalogue.data ?? []).find((r) => r.slug === slug);
  if (!definition) notFound();

  const filter = {
    districtId: one(query.districtId),
    from: one(query.from),
    to: one(query.to),
  };

  const [report, districtList] = await Promise.all([
    runReport(session.token, slug, filter),
    getDistricts(),
  ]);

  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value) exportQuery.set(key, value);
  }
  const exportBase = `/admin/reports/${slug}/export?${exportQuery}`;

  const scope =
    session.me.districtScope === "ALL"
      ? "all districts"
      : `${(session.me.districtScope as number[]).length} district(s)`;

  return (
    <>
      <div className="app-shell">
        <AdminNav
          email={session.me.user?.email ?? ""}
          role={session.me.user?.role ?? ""}
          scope={scope}
          tabs={(catalogue.data ?? [])
            .filter((r): r is { slug: string; title: string } =>
              Boolean(r.slug && r.title),
            )
            .map((r) => ({ slug: r.slug, title: r.title }))}
          current={slug}
        />

        <main className="admin-wrap">
          <h1>
            {report.report?.title ?? slug}
          </h1>
          <p className="chips-note">
            {report.report?.description ?? ""}
          </p>

          {/* A GET form, so a filtered report is a shareable URL. */}
          <form method="get" className="filters" style={{ marginTop: "1.5rem" }}>
            <div className="field">
              <label htmlFor="districtId">District
              </label>
              <select id="districtId" name="districtId" defaultValue={filter.districtId}>
                <option value="">All in scope</option>
                {(districtList.data ?? []).map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="from">
                From
              </label>
              <input type="date" id="from" name="from" defaultValue={filter.from} />
            </div>
            <div className="field">
              <label htmlFor="to">
                To
              </label>
              <input type="date" id="to" name="to" defaultValue={filter.to} />
            </div>
            <button type="submit">
              <span>
                Apply
              </span>
            </button>
          </form>

          {/* Plain spans, not : that renders a block and would stack the
              count and the two export links onto separate lines. */}
          <p className="chips-note">
            {report.rowCount} row{report.rowCount === 1 ? "" : "s"}
            {" · "}
            <a href={`${exportBase}&format=csv`}>Export CSV</a>
            {" · "}
            <a href={`${exportBase}&format=pdf`}>Export PDF</a>
          </p>

          {report.truncated && (
            <p className="notice warn">
              Row cap reached — this report is truncated. Narrow the filters or
              use the CSV export.
            </p>
          )}

          <ReportTable
            columns={report.columns ?? []}
            rows={report.data ?? []}
            empty="Nothing matches these filters."
          />
        </main>
      </div>
    </>
  );
}
