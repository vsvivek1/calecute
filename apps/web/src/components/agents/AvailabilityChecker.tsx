/**
 * Live slot availability for a chosen panchayat.
 *
 * Works with JavaScript disabled. The whole thing is three plain GET forms that
 * narrow the URL one step at a time:
 *
 *   /agents                          -> pick a district
 *   /agents?district=11              -> search and pick a panchayat
 *   /agents?district=11&panchayat=19 -> see the live count
 *
 * Each step is a server render, so a reader on a ₹8,000 phone with JavaScript
 * off — or with JavaScript that has not finished parsing yet — still gets the
 * number. On this page that matters more than the interaction being slick: the
 * count is a trust signal, and a trust signal that fails to appear is worse than
 * one that takes a round trip.
 *
 * The number itself is read from the database on every request. Never cached,
 * never rounded, never dramatised. If a panchayat is full it says so and offers
 * the waitlist.
 */
import type { Availability, District, LocalBody } from "@/lib/api/client";
import { page as copy, signup as signupCopy } from "@/lib/agents/content";
import { En, Ml } from "./Bilingual";

function toId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Everything this component needs, fetched by the caller.
 *
 * The component is deliberately synchronous and pure. The public page is
 * rendered to static markup by a route handler, and `renderToStaticMarkup` does
 * not await async components — so data fetching happens one level up and the
 * rendering stays a plain function of its inputs.
 */
export interface AvailabilityData {
  districts: District[];
  bodies: LocalBody[];
  availability: Availability | null;
  /** True when the API could not be reached; the section degrades quietly. */
  unavailable: boolean;
}

export function AvailabilityChecker({
  districtId,
  localBodyId,
  query,
  data,
}: {
  districtId?: string;
  localBodyId?: string;
  query?: string;
  data: AvailabilityData;
}) {
  const district = toId(districtId);
  const localBody = toId(localBodyId);
  const { districts } = data;

  if (data.unavailable) {
    return (
      <p className="notice warn">
        <Ml>{copy.availability.noData.ml}</Ml>
        <En>{copy.availability.noData.en}</En>
      </p>
    );
  }

  /* ------------------------------------------------- step 3: the count */
  if (district && localBody && data.availability) {
    const availability = data.availability;
    const body = data.bodies.find((row) => row.id === localBody);
    const open = availability.state === "OPEN";

    return (
      <div>
        <p>
          <Ml>{body?.nameMl ?? ""}</Ml>
          <En>{body?.nameEn ?? ""}</En>
        </p>

        {open ? (
          <>
            <p className="slots">
              <span className="count">{availability.remaining}</span>
              <span className="of" lang="en">
                of {availability.slotCapacity} places left
              </span>
            </p>
            <p>
              <Ml>ഒഴിവുള്ള സ്ഥാനങ്ങൾ</Ml>
              <En>
                {availability.filled} of {availability.slotCapacity} already taken
              </En>
            </p>
            <a
              className="button"
              href={`/auth/google/start?returnTo=${encodeURIComponent(
                `/agents/signup?district=${district}&panchayat=${localBody}`,
              )}`}
            >
              <span>
                <Ml>ഈ പഞ്ചായത്തിൽ രജിസ്റ്റർ ചെയ്യുക</Ml>
                <En>Apply for this panchayat</En>
              </span>
            </a>
          </>
        ) : availability.state === "FULL" ? (
          <>
            <p className="notice warn">
              <Ml>{copy.availability.full.ml}</Ml>
              <En>{copy.availability.full.en}</En>
            </p>
            {(availability.waitlisted ?? 0) > 0 && (
              <p className="button-note" lang="en">
                {availability.waitlisted} already waiting
              </p>
            )}
            <a
              className="button secondary"
              href={`/auth/google/start?returnTo=${encodeURIComponent(
                `/agents/waitlist?district=${district}&panchayat=${localBody}`,
              )}`}
            >
              <span>
                <Ml>വെയിറ്റിംഗ് ലിസ്റ്റിൽ ചേരുക</Ml>
                <En>Join the waiting list</En>
              </span>
            </a>
          </>
        ) : (
          <p className="notice">
            <Ml>{copy.availability.closed.ml}</Ml>
            <En>{copy.availability.closed.en}</En>
          </p>
        )}

        <p className="button-note">
          <a href="/agents#availability">
            <Ml>മറ്റൊരു പഞ്ചായത്ത് നോക്കുക</Ml>
            <En>Check a different panchayat</En>
          </a>
        </p>
      </div>
    );
  }

  /* --------------------------------------- step 2: choose a panchayat */
  if (district) {
    const bodies = data.bodies;
    const districtName = districts.find((d) => d.id === district);

    return (
      <form method="get" action="/agents#availability">
        <input type="hidden" name="district" value={district} />

        <p className="button-note">
          <Ml>{districtName?.nameMl ?? ""}</Ml>
          <En>{districtName?.nameEn ?? ""}</En>
        </p>

        <div className="field">
          <label htmlFor="q">
            <Ml>{signupCopy.hints.searchLocalBody.ml}</Ml>
            <En>{signupCopy.hints.searchLocalBody.en}</En>
          </label>
          <input
            type="search"
            id="q"
            name="q"
            defaultValue={query ?? ""}
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>

        {bodies.length === 0 ? (
          <p className="notice warn">
            <Ml>{copy.availability.noData.ml}</Ml>
            <En>
              {query
                ? "No panchayat matched that search."
                : copy.availability.noData.en}
            </En>
          </p>
        ) : (
          <div className="field">
            <label htmlFor="panchayat">
              <Ml>{signupCopy.fields.localBody.ml}</Ml>
              <En>{signupCopy.fields.localBody.en}</En>
            </label>
            <select id="panchayat" name="panchayat">
              <option value="" disabled selected>
                — തിരഞ്ഞെടുക്കുക —
              </option>
              {bodies.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.nameMl} · {row.nameEn}
                  {row.signupsOpen
                    ? ` (${row.remaining}/${row.slotCapacity})`
                    : " (closed)"}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit">
          <span>
            <Ml>കാണുക</Ml>
            <En>Check</En>
          </span>
        </button>
      </form>
    );
  }

  /* ---------------------------------------- step 1: choose a district */
  return (
    <form method="get" action="/agents#availability">
      <div className="field">
        <label htmlFor="district">
          <Ml>{signupCopy.fields.district.ml}</Ml>
          <En>{signupCopy.fields.district.en}</En>
        </label>
        <select id="district" name="district">
          <option value="" disabled selected>
            — തിരഞ്ഞെടുക്കുക —
          </option>
          {districts.map((row) => (
            <option key={row.id} value={row.id}>
              {row.nameMl} · {row.nameEn}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">
        <span>
          <Ml>തുടരുക</Ml>
          <En>Continue</En>
        </span>
      </button>
    </form>
  );
}
