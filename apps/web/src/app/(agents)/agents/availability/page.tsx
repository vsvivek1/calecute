/**
 * /agents/availability — how many people have applied in one panchayat.
 *
 * Split out of /agents so that page can be static. The landing page is what
 * every WhatsApp forward opens, and it was being rendered on the server for
 * each of those visits purely because this section reads the URL and the
 * database. Now the landing page is served from the edge and only a reader who
 * actually goes looking for a count pays for a render.
 *
 * Still three plain GET steps, so it still works with JavaScript off:
 *
 *   /agents/availability                          -> pick a district
 *   /agents/availability?district=11              -> pick a panchayat
 *   /agents/availability?district=11&panchayat=19 -> see the count
 */
import type { Metadata } from "next";
import { AvailabilityChecker } from "@/components/agents/AvailabilityChecker";
import { page as copy } from "@/lib/agents/content";
import {
  getAvailability,
  getDistricts,
  searchLocalBodies,
} from "@/lib/api/client";
import type { AvailabilityData } from "@/components/agents/AvailabilityChecker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check a panchayat",
  description:
    "How many people have applied to be a commission agent in your panchayat.",
  alternates: { canonical: "/agents/availability" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Fetch only what the current step needs.
 *
 * Once a district is chosen, ALL of its local bodies are fetched rather than
 * the ones matching the search. That is the same request for every visitor to
 * that district, so the edge caches it, and it lets the picker filter in the
 * browser instead of round-tripping each search.
 */
async function load(
  district: number | undefined,
  panchayat: number | undefined,
): Promise<AvailabilityData> {
  try {
    const districts = (await getDistricts()).data ?? [];
    if (!district) {
      return { districts, bodies: [], availability: null, unavailable: false };
    }

    const bodies =
      (await searchLocalBodies({ districtId: district, limit: 200 })).data ?? [];

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
    return { districts: [], bodies: [], availability: null, unavailable: true };
  }
}

/**
 * A name typed into the picker, resolved to an id.
 *
 * The picker is one text box, so a visitor who types a full name should land
 * straight on the count rather than being shown a list of one.
 */
function resolveTypedName(
  bodies: { id: number; nameEn: string }[],
  query: string | undefined,
): number | undefined {
  if (!query) return undefined;
  const typed = query.trim().toLowerCase();
  if (!typed) return undefined;
  return bodies.find((b) => b.nameEn.trim().toLowerCase() === typed)?.id;
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const districtId = toId(first(params.district));
  const query = first(params.q);

  let panchayatId = toId(first(params.panchayat));
  let data = await load(districtId, panchayatId);

  if (districtId && !panchayatId) {
    panchayatId = resolveTypedName(data.bodies, query);
    if (panchayatId) data = await load(districtId, panchayatId);
  }

  return (
    <div className="content">
      <main className="wrap">
        <section id="availability" aria-labelledby="availability-h">
          <h1 id="availability-h">{copy.availability.heading}</h1>
          <p>{copy.availability.prompt}</p>
          <div className="panel">
            <AvailabilityChecker
              districtId={districtId}
              localBodyId={panchayatId}
              query={query}
              data={data}
            />
          </div>
          <p className="button-note">
            <a href="/agents">Back to the programme</a>
          </p>
        </section>
      </main>
    </div>
  );
}
