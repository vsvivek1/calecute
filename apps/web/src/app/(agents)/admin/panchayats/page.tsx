/**
 * /admin/panchayats — slot counts, and opening or closing a panchayat.
 *
 * Two levers, both audited. The list is searchable because Kerala has 941
 * panchayats and scrolling to one is not a workflow.
 */
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guard";
import { getDistricts, getReportCatalogue, searchLocalBodies } from "@/lib/api/client";
import { AdminNav } from "@/components/agents/AdminNav";
import { ActionForm } from "@/components/agents/ActionForm";
import { updateLocalBody } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Panchayats",
  robots: { index: false, follow: false },
};

const ADMIN_ROLES = ["DISTRICT_ADMIN", "SUPER_ADMIN"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function PanchayatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("/admin/panchayats", ADMIN_ROLES);
  const params = await searchParams;
  const districtId = Number(one(params.districtId)) || undefined;
  const query = one(params.q);

  const [catalogue, districtList, bodies] = await Promise.all([
    getReportCatalogue(session.token),
    getDistricts(),
    // Only search once something narrows it: 941 rows of forms helps nobody.
    districtId || query
      ? searchLocalBodies({ districtId, q: query || undefined, limit: 60 })
      : Promise.resolve({ data: [] as Awaited<ReturnType<typeof searchLocalBodies>>["data"] }),
  ]);

  const scope =
    session.me.districtScope === "ALL"
      ? "all districts"
      : `${(session.me.districtScope as number[]).length} district(s)`;

  return (
    <div className="app-shell">
      <AdminNav
        email={session.me.user?.email ?? ""}
        role={session.me.user?.role ?? ""}
        scope={scope}
        tabs={(catalogue.data ?? [])
          .filter((r): r is { slug: string; title: string } => Boolean(r.slug && r.title))
          .map((r) => ({ slug: r.slug, title: r.title }))}
      />

      <main className="admin-wrap">
        <h1>Panchayat settings
        </h1>
        <p className="chips-note">
          
            Change how many agents a panchayat may hold, or stop it accepting new
            applications. Both are recorded in the audit log.
          
        </p>

        <form method="get" className="filters" style={{ marginTop: "1.5rem" }}>
          <div className="field">
            <label htmlFor="districtId">District
            </label>
            <select id="districtId" name="districtId" defaultValue={String(districtId ?? "")}>
              <option value="">All in scope</option>
              {(districtList.data ?? []).map((district) => (
                <option key={district.id} value={district.id}>
                  {district.nameEn}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="q">
              Search
            </label>
            <input type="search" id="q" name="q" defaultValue={query} />
          </div>
          <button type="submit">
            <span>
              Find
            </span>
          </button>
        </form>

        {(bodies.data ?? []).length === 0 ? (
          <p className="chips-note">
            
              {districtId || query
                ? "No panchayat matched."
                : "Choose a district or search to begin."}
            
          </p>
        ) : (
          <div className="review-list">
            {(bodies.data ?? []).map((body) => (
              <article className="panel review-card" key={body.id}>
                <header>
                  <span>
                      {body.nameEn} · {body.type?.replace(/_/g, " ").toLowerCase()}
                    
                  </span>
                  <span className="chips-note">
                    {body.filled}/{body.slotCapacity} filled
                    {(body.waitlisted ?? 0) > 0 ? ` · ${body.waitlisted} waiting` : ""}
                    {body.signupsOpen ? "" : " · closed"}
                  </span>
                </header>

                <div className="review-actions">
                  <ActionForm
                    action={updateLocalBody}
                    hidden={{ localBodyId: body.id ?? 0 }}
                    label={"Save"}
                  >
                    <div className="filters" style={{ marginBottom: 0 }}>
                      <div className="field">
                        <label htmlFor={`slots-${body.id}`}>
                          Slots
                        </label>
                        <input
                          type="number"
                          id={`slots-${body.id}`}
                          name="slotCapacity"
                          min={0}
                          max={500}
                          defaultValue={body.slotCapacity}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`open-${body.id}`}>
                          Signups
                        </label>
                        <select
                          id={`open-${body.id}`}
                          name="signupsOpen"
                          defaultValue={String(body.signupsOpen)}
                        >
                          <option value="true">Open</option>
                          <option value="false">Closed</option>
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor={`reason-${body.id}`}>
                          Reason
                        </label>
                        <input
                          type="text"
                          id={`reason-${body.id}`}
                          name="reason"
                          placeholder="For the audit log"
                        />
                      </div>
                    </div>
                  </ActionForm>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
