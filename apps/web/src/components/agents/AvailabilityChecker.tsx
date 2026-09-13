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
      <p className="notice warn">{copy.availability.noData}
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
        <p>{body?.nameEn ?? ""}
        </p>

        {open ? (
          <>
            <p className="slots">
              <span className="count">{availability.remaining}</span>
              <span className="of">
                of {availability.slotCapacity} places left
              </span>
            </p>
            <p>
                {availability.filled} of {availability.slotCapacity} already taken
              
            </p>
            <a
              className="button"
              href={`/auth/google/start?returnTo=${encodeURIComponent(
                `/agents/signup?district=${district}&panchayat=${localBody}`,
              )}`}
            >
              <span>Apply for this panchayat
              </span>
            </a>
          </>
        ) : availability.state === "FULL" ? (
          <>
            <p className="notice warn">{copy.availability.full}
            </p>
            {(availability.waitlisted ?? 0) > 0 && (
              <p className="button-note">
                {availability.waitlisted} already waiting
              </p>
            )}
            <a
              className="button secondary"
              href={`/auth/google/start?returnTo=${encodeURIComponent(
                `/agents/waitlist?district=${district}&panchayat=${localBody}`,
              )}`}
            >
              <span>Join the waiting list
              </span>
            </a>
          </>
        ) : (
          <p className="notice">{copy.availability.closed}
          </p>
        )}

        <p className="button-note">
          <a href="/agents#availability">Check a different panchayat
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

        <p className="button-note">{districtName?.nameEn ?? ""}
        </p>

        <div className="field">
          <label htmlFor="q">{signupCopy.hints.searchLocalBody}
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
              {query
                ? "No panchayat matched that search."
                : copy.availability.noData}
            
          </p>
        ) : (
          <div className="field">
            <label htmlFor="panchayat">{signupCopy.fields.localBody}
            </label>
            <select id="panchayat" name="panchayat">
              <option value="" disabled selected>
                — Select —
              </option>
              {bodies.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.nameEn}
                  {row.signupsOpen
                    ? ` (${row.remaining}/${row.slotCapacity})`
                    : " (closed)"}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit">
          <span>Check
          </span>
        </button>
      </form>
    );
  }

  /* ---------------------------------------- step 1: choose a district */
  return (
    <form method="get" action="/agents#availability">
      <div className="field">
        <label htmlFor="district">{signupCopy.fields.district}
        </label>
        <select id="district" name="district">
          <option value="" disabled selected>
            — Select —
          </option>
          {districts.map((row) => (
            <option key={row.id} value={row.id}>
              {row.nameEn}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">
        <span>Continue
        </span>
      </button>
    </form>
  );
}
