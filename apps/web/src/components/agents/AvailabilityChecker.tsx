/**
 * Live slot availability for a chosen panchayat.
 *
 * Works with JavaScript disabled. The whole thing is three plain GET forms that
 * narrow the URL one step at a time:
 *
 *   /agents/availability                          -> pick a district
 *   /agents/availability?district=11              -> pick a panchayat
 *   /agents/availability?district=11&panchayat=19 -> see the live count
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
  districtId?: number;
  localBodyId?: number;
  query?: string;
  data: AvailabilityData;
}) {
  const district = districtId;
  const localBody = localBodyId;
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
        <p>{body?.nameEn ?? ""}</p>

        {open ? (
          <>
            {/*
              How many people have applied — a fact, not a countdown. There is
              no "places left" any more: capacity does not gate registration,
              so presenting one would be turning people away from something
              that would accept them.
            */}
            <p className="slots">
              <span className="count">{availability.filled}</span>
              <span className="of">
                {availability.filled === 1
                  ? copy.availability.appliedOne
                  : copy.availability.applied}
              </span>
            </p>
            <a
              className="button"
              href={`/auth/google/start?returnTo=${encodeURIComponent(
                `/agents/signup?district=${district}&panchayat=${localBody}`,
              )}`}
            >
              <span>Register for this panchayat</span>
            </a>
          </>
        ) : (
          <p className="notice">{copy.availability.closed}</p>
        )}

        <p className="button-note">
          <a href="/agents/availability">Check a different panchayat</a>
        </p>
      </div>
    );
  }

  /* --------------------------------------- step 2: choose a panchayat */
  if (district) {
    const districtName = districts.find((d) => d.id === district);

    /*
     * One box, not a search box and a dropdown. The datalist carries every
     * local body in the district so the browser filters as the visitor types,
     * and the list below narrows on submit for anyone whose browser ignores
     * the datalist or who has JavaScript off entirely.
     */
    const typed = (query ?? "").trim().toLowerCase();
    const matches = typed
      ? data.bodies.filter((row) => row.nameEn.toLowerCase().includes(typed))
      : data.bodies;

    return (
      <form method="get" action="/agents/availability">
        <input type="hidden" name="district" value={district} />

        <p className="button-note">{districtName?.nameEn ?? ""}
        </p>

        <div className="field">
          <label htmlFor="q">{signupCopy.fields.localBody}
          </label>
          <div className="search-row">
            <input
              type="text"
              id="q"
              name="q"
              list="availabilityBodies"
              defaultValue={query ?? ""}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Start typing"
            />
            <button type="submit">
              <span>Check</span>
            </button>
          </div>
          <datalist id="availabilityBodies">
            {data.bodies.map((row) => (
              <option key={row.id} value={row.nameEn} />
            ))}
          </datalist>
        </div>

        {matches.length === 0 ? (
          <p className="notice warn">
            {typed
              ? "No panchayat matched that."
              : copy.availability.noData}
          </p>
        ) : (
          /*
            Names as links, not a second dropdown. A link goes straight to the
            count in one tap, and works with JavaScript off.
          */
          <ul className="pick-list">
            {matches.map((row) => (
              <li key={row.id}>
                <a href={`/agents/availability?district=${district}&panchayat=${row.id}`}>
                  {row.nameEn}
                  {row.signupsOpen ? "" : " (closed)"}
                </a>
              </li>
            ))}
          </ul>
        )}
      </form>
    );
  }

  /* ---------------------------------------- step 1: choose a district */
  return (
    <form method="get" action="/agents/availability">
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
