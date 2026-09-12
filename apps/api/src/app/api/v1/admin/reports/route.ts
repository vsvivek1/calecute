/**
 * GET /api/v1/admin/reports
 *
 * The catalogue. Lets a client — or the Android app — discover the available
 * reports and their columns without hardcoding a list.
 */
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { REPORTS } from "@/lib/reports";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "admin.reports.list", roles: ADMIN_ROLES }, async (ctx) =>
    ok(ctx, {
      // The default landing view is named here, not chosen by the client.
      defaultReport: "zero-agent-panchayats",
      data: Object.values(REPORTS).map((report) => ({
        slug: report.slug,
        title: report.title,
        description: report.description,
        columns: report.columns.map((column) => ({
          key: column.key,
          header: column.header,
        })),
        formats: ["json", "csv", "pdf"],
        filters: ["districtId", "blockId", "localBodyId", "wardId", "from", "to", "limit"],
      })),
    }),
  ),
);

export const OPTIONS = preflight;
