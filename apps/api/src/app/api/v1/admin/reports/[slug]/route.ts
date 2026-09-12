/**
 * GET /api/v1/admin/reports/{slug}[?format=json|csv|pdf&districtId=&from=&to=]
 *
 * One endpoint for every report. The slug selects the query; the filters and
 * format are uniform.
 *
 * Access control is not in this file. The role gate below rejects a
 * non-admin, and everything finer — which districts this admin may see — is
 * enforced by row-level security inside the transaction. A DISTRICT_ADMIN
 * running the statewide coverage report gets their districts and nothing else,
 * without any endpoint here knowing that happened.
 */
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseQuery } from "@/lib/validation";
import { notFound } from "@/lib/errors";
import { REPORTS, reportFilterSchema } from "@/lib/reports";
import { csvResponse, toCsv } from "@/lib/export/csv";
import { pdfResponse, toPdf } from "@/lib/export/pdf";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, context) => {
  const { slug } = await (
    context as unknown as { params: Promise<{ slug: string }> }
  ).params;

  return authedRoute(
    { name: "admin.reports.run", roles: ADMIN_ROLES },
    async (ctx) => {
      const report = REPORTS[slug];
      if (!report) throw notFound(`Report "${slug}"`);

      const filter = parseQuery(ctx.url, reportFilterSchema);
      const rows = await report.run(ctx.tx, filter);
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `${report.slug}-${stamp}`;

      if (filter.format === "csv") {
        return csvResponse(toCsv(rows, report.columns), filename, ctx.rateHeaders);
      }

      if (filter.format === "pdf") {
        const bytes = await toPdf({
          title: report.title,
          subtitle: report.description,
          rows,
          columns: report.columns,
          generatedFor: `user ${ctx.actor.userId} (${ctx.actor.role})`,
        });
        return pdfResponse(bytes, filename, ctx.rateHeaders);
      }

      return ok(ctx, {
        report: {
          slug: report.slug,
          title: report.title,
          description: report.description,
        },
        filter: {
          districtId: filter.districtId ?? null,
          blockId: filter.blockId ?? null,
          localBodyId: filter.localBodyId ?? null,
          wardId: filter.wardId ?? null,
          from: filter.from ?? null,
          to: filter.to ?? null,
          limit: filter.limit,
        },
        columns: report.columns.map((c) => ({ key: c.key, header: c.header })),
        rowCount: rows.length,
        // Reports are capped rather than paginated: they are aggregates meant
        // to be read whole or exported. Hitting the cap is surfaced, not hidden.
        truncated: rows.length >= filter.limit,
        data: rows,
      });
    },
  )(request);
});

export const OPTIONS = preflight;
