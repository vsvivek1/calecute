/**
 * GET /agents — the public recruitment page, served as a static document.
 *
 * Why this is a route handler and not a page
 * ------------------------------------------
 * The performance budget is 150KB total including fonts, on a ₹8,000 Android
 * phone at one bar of 4G. As an App Router page this route measured 230KB: 7.5KB
 * of HTML, a 35KB font, and ~186KB of React and App Router runtime — nine
 * blocking <script> tags and 25KB of inline RSC payload, shipped to a page with
 * no client components and nothing to hydrate.
 *
 * The App Router has no supported per-route opt-out from that runtime. But this
 * page does not need it: it is a document, it has no interactivity, and its one
 * dynamic element (slot availability) is already a plain GET form so that it
 * keeps working with JavaScript disabled.
 *
 * So the same React components are rendered to a string by a small in-repo
 * serialiser (lib/agents/static-render.ts — Next blocks react-dom/server in app
 * code) and returned as HTML. The stack does not change — same Next.js, same React, same
 * components, same API client — the output is just a page instead of an app.
 * The CSS is inlined for the same reason: one fewer blocking round trip.
 *
 * The trade: no client-side navigation from this page, and <head> is written by
 * hand rather than through the metadata API. Both are fine for a document whose
 * job is to be read once and trusted.
 */
import type { NextRequest } from "next/server";
import {
  PublicRecruitmentPage,
  type PublicPageProps,
} from "@/components/agents/PublicRecruitmentPage";
import type { AvailabilityData } from "@/components/agents/AvailabilityChecker";
import {
  getAvailability,
  getDistricts,
  searchLocalBodies,
} from "@/lib/api/client";
import { AGENT_STYLES } from "@/lib/agents/styles";
import { renderToStaticHtml } from "@/lib/agents/static-render";

export const dynamic = "force-dynamic";

const TITLE = "കേരളത്തിലുടനീളം കമ്മീഷൻ ഏജന്റുമാരെ ആവശ്യമുണ്ട്";
const DESCRIPTION =
  "കാലിക്യൂട്ട് ടെക്നോളജീസിന്റെ സോഫ്റ്റ്‌വെയർ ഉൽപ്പന്നങ്ങൾ വിൽക്കാൻ കേരളത്തിലെ ഓരോ പഞ്ചായത്തിലും കമ്മീഷൻ ഏജന്റുമാർ. രജിസ്ട്രേഷൻ ഫീസില്ല, നിക്ഷേപമില്ല. കമ്മീഷൻ 10%.";

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Fetch exactly what the current step needs, and no more.
 *
 * Step 1 needs the district list. Step 2 adds the panchayats for that district.
 * Step 3 adds the live count. Fetching all three every time would triple the
 * work for the common case, which is a first-time visitor who has chosen
 * nothing yet.
 */
async function loadAvailability(
  district: number | undefined,
  panchayat: number | undefined,
  query: string | undefined,
): Promise<AvailabilityData> {
  try {
    const districts = (await getDistricts()).data ?? [];

    if (!district) {
      return { districts, bodies: [], availability: null, unavailable: false };
    }

    const bodies =
      (await searchLocalBodies({ districtId: district, q: query, limit: 200 }))
        .data ?? [];

    if (!panchayat) {
      return { districts, bodies, availability: null, unavailable: false };
    }

    return {
      districts,
      bodies,
      availability: await getAvailability(panchayat),
      unavailable: false,
    };
  } catch {
    // The availability section degrades to a plain message; the rest of the
    // page — the terms, the CIN, the verification link — still does its job.
    return { districts: [], bodies: [], availability: null, unavailable: true };
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin =
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? request.nextUrl.origin;

  const district = params.get("district") ?? undefined;
  const panchayat = params.get("panchayat") ?? undefined;
  const query = params.get("q") ?? undefined;

  const props: PublicPageProps = {
    district,
    panchayat,
    query,
    auth: params.get("auth") ?? undefined,
    signedOut: params.get("signedout") === "1",
    availability: await loadAvailability(
      toId(district ?? null),
      toId(panchayat ?? null),
      query,
    ),
  };

  const body = renderToStaticHtml(PublicRecruitmentPage(props));

  const html = `<!doctype html>
<html lang="ml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttribute(TITLE)}</title>
<meta name="description" content="${escapeAttribute(DESCRIPTION)}">
<link rel="canonical" href="${escapeAttribute(`${origin}/agents`)}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:locale" content="ml_IN">
<meta property="og:title" content="${escapeAttribute(TITLE)}">
<meta property="og:description" content="${escapeAttribute(DESCRIPTION)}">
<meta property="og:url" content="${escapeAttribute(`${origin}/agents`)}">
<meta property="og:image" content="${escapeAttribute(`${origin}/agents/opengraph-image`)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/fonts/noto-malayalam-400.woff2" as="font" type="font/woff2" crossorigin="anonymous">
<style>${AGENT_STYLES}</style>
</head>
<body>${body}</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Short public cache: slot counts change, but not second to second, and a
      // stale-while-revalidate window keeps the page instant for the burst of
      // traffic a WhatsApp forward produces.
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
