"use client";

/**
 * Step 2 of signup: the six required fields, and nothing else.
 *
 * Six is the whole list — name, mobile, district, panchayat, ward, occupation.
 * No PAN, no bank details, no documents, no photograph. The public page states
 * that explicitly, so this form has to keep the promise.
 *
 * Geography is dependent: choosing a district loads its panchayats, choosing a
 * panchayat loads its wards. Both are fetched from the API on demand rather
 * than shipped up front — Kerala has 941 panchayats and sending all of them to
 * a phone to populate a dropdown would be absurd.
 *
 * Two anti-abuse measures live here, and neither is a CAPTCHA, which would cost
 * more conversions on a low-end phone than it would prevent abuse:
 *   - a honeypot field, positioned off-screen and hidden from assistive
 *     technology, which a form-filling bot completes and a person cannot;
 *   - a signed form token issued by the API, which measures elapsed time
 *     against its own clock. A client-reported duration would just be a number
 *     a bot could choose.
 */
import { useActionState, useEffect, useState } from "react";
import { submitSignup, type FormState } from "@/app/(agents)/agents/signup/actions";
import {
  signup as copy,
} from "@/lib/agents/content";
import { SubmitButton } from "./SubmitButton";

interface Option {
  id: number;
  nameEn: string;
}

interface LocalBodyOption extends Option {
  remaining: number;
  slotCapacity: number;
  signupsOpen: boolean;
}

interface WardOption {
  id: number;
  number: number;
  nameEn: string | null;
  nameMl?: string | null;
}

function Label({ text, htmlFor }: { text: string; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor}>{text}
    </label>
  );
}

export function SignupForm({
  districts,
  termsVersion,
  apiBase,
  initialDistrictId,
  initialLocalBodyId,
  defaultName,
  formToken,
}: {
  districts: Option[];
  termsVersion: string;
  apiBase: string;
  initialDistrictId?: number;
  initialLocalBodyId?: number;
  defaultName: string;
  formToken: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitSignup, {});

  const [districtId, setDistrictId] = useState(initialDistrictId ?? 0);
  const [query, setQuery] = useState("");
  const [bodies, setBodies] = useState<LocalBodyOption[]>([]);
  const [localBodyId, setLocalBodyId] = useState(initialLocalBodyId ?? 0);
  // Temporary: municipalities and corporations are not seeded yet, so a reader
  // in a town has nothing to pick. See migration 0006.
  const [notListed, setNotListed] = useState(false);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingBodies, setLoadingBodies] = useState(false);

  /*
   * Panchayats for the chosen district, debounced against the search box.
   *
   * The empty case is derived at render (see `visibleBodies` below) rather than
   * written back into state from inside the effect — clearing state
   * synchronously in an effect triggers a second render pass for something the
   * component already knows.
   */
  useEffect(() => {
    if (!districtId) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      // Inside the timeout, not in the effect body: a synchronous setState
      // during an effect forces an extra render pass before the fetch even
      // starts.
      setLoadingBodies(true);
      try {
        const url = new URL(`${apiBase}/geography/local-bodies`);
        url.searchParams.set("districtId", String(districtId));
        url.searchParams.set("limit", "200");
        if (query.trim()) url.searchParams.set("q", query.trim());
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        const payload = await response.json();
        if (!cancelled) setBodies(payload.data ?? []);
      } catch {
        if (!cancelled) setBodies([]);
      } finally {
        if (!cancelled) setLoadingBodies(false);
      }
    }, query ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [districtId, query, apiBase]);

  /* Wards for the chosen panchayat. Same derivation rule as above. */
  useEffect(() => {
    if (!localBodyId) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `${apiBase}/geography/local-bodies/${localBodyId}/wards`,
          { headers: { Accept: "application/json" } },
        );
        const payload = await response.json();
        if (!cancelled) setWards(payload.data ?? []);
      } catch {
        if (!cancelled) setWards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localBodyId, apiBase]);

  // Derived, so a cleared district shows no stale panchayats even though the
  // fetched list is still in state.
  const visibleBodies = districtId ? bodies : [];
  const visibleWards = localBodyId ? wards : [];

  // A find over at most 200 rows; memoising it would cost more than it saves.
  const chosenBody = visibleBodies.find((b) => b.id === localBodyId);

  const fieldError = (name: string) => state.fields?.[name];

  return (
    <form action={action} noValidate>
      <input type="hidden" name="termsVersion" value={termsVersion} />
      <input type="hidden" name="formToken" value={formToken} />

      {/*
        The honeypot. Off-screen rather than display:none, because some bots
        skip hidden inputs but fill positioned ones. aria-hidden and
        tabIndex -1 keep it away from screen readers and keyboard users.
      */}
      <div className="trap" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.error && (
        <p className="notice stop" role="alert">
          {state.error}
          {state.code && <span className="field-hint">{state.code}</span>}
        </p>
      )}

      <div className="field">
        <Label text={copy.fields.name} htmlFor="name" />
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={state.values?.name ?? defaultName}
          autoComplete="name"
          aria-invalid={Boolean(fieldError("name"))}
        />
        {fieldError("name") && <p className="field-hint">{fieldError("name")}</p>}
      </div>

      <div className="field">
        <Label text={copy.fields.mobile} htmlFor="mobile" />
        <input
          type="tel"
          id="mobile"
          name="mobile"
          required
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={13}
          defaultValue={state.values?.mobile ?? ""}
          aria-invalid={Boolean(fieldError("mobile"))}
          aria-describedby="mobile-hint"
        />
        <p className="field-hint" id="mobile-hint">{copy.hints.mobileNotVerified}
        </p>
        {fieldError("mobile") && <p className="field-hint">{fieldError("mobile")}</p>}
      </div>

      <div className="field">
        <Label text={copy.fields.district} htmlFor="districtId" />
        <select
          id="districtId"
          name="districtId"
          required
          value={districtId || ""}
          onChange={(event) => {
            setDistrictId(Number(event.target.value));
            setLocalBodyId(0);
            setQuery("");
          }}
        >
          <option value="" disabled>
            — Select —
          </option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.nameEn}
            </option>
          ))}
        </select>
      </div>

      {districtId > 0 && (
        <>
          <div className="field">
            <label htmlFor="localBodySearch">{copy.hints.searchLocalBody}
            </label>
            <input
              type="search"
              id="localBodySearch"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>

          <div className="field">
            <Label text={copy.fields.localBody} htmlFor="localBodyId" />
            <select
              id="localBodyId"
              name="localBodyId"
              required={!notListed}
              disabled={notListed}
              value={notListed ? "" : localBodyId || ""}
              onChange={(event) => setLocalBodyId(Number(event.target.value))}
            >
              <option value="" disabled>
                {loadingBodies ? "…" : "— Select —"}
              </option>
              {visibleBodies.map((body) => (
                <option
                  key={body.id}
                  value={body.id}
                  disabled={!body.signupsOpen || body.remaining <= 0}
                >
                  {body.nameEn}
                  {body.signupsOpen
                    ? ` — ${body.remaining}/${body.slotCapacity}`
                    : " — closed"}
                </option>
              ))}
            </select>
            {chosenBody && !notListed && (
              <p className="field-hint">
                  {chosenBody.remaining} of {chosenBody.slotCapacity} places left
                
              </p>
            )}
          </div>

          {/*
            The escape hatch. Only panchayats are seeded, so a reader in a
            municipality or corporation finds nothing in the list above. Saying
            so and taking the name is better than leaving them stuck on a form
            that cannot be completed.
          */}
          <div className="choice">
            <input
              type="checkbox"
              id="notListed"
              checked={notListed}
              onChange={(event) => {
                setNotListed(event.target.checked);
                if (event.target.checked) setLocalBodyId(0);
              }}
            />
            <label htmlFor="notListed">{copy.hints.notListed}
            </label>
          </div>

          {notListed && (
            <div className="field">
              <Label
                text={"Municipality or corporation name"}
                htmlFor="pendingLocalBodyName"
              />
              <input
                type="text"
                id="pendingLocalBodyName"
                name="pendingLocalBodyName"
                required
                defaultValue={state.values?.pendingLocalBodyName ?? ""}
                autoComplete="off"
                aria-describedby="not-listed-note"
              />
              <p className="field-hint" id="not-listed-note">{copy.hints.notListedNote}
              </p>
            </div>
          )}
        </>
      )}

      {localBodyId > 0 && !notListed && (
        <div className="field">
          <Label text={copy.fields.ward} htmlFor="wardId" />
          <select id="wardId" name="wardId" defaultValue="">
            <option value="">— {copy.hints.wardOptional} —</option>
            {visibleWards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.number}
                {ward.nameEn ? ` · ${ward.nameEn}` : ""}
              </option>
            ))}
          </select>
          {visibleWards.length === 0 && (
            <p className="field-hint">Ward list not available for this panchayat. It is optional.
            </p>
          )}
        </div>
      )}

      <div className="field">
        <Label text={copy.fields.occupation} htmlFor="occupation" />
        <input
          type="text"
          id="occupation"
          name="occupation"
          required
          defaultValue={state.values?.occupation ?? ""}
          aria-invalid={Boolean(fieldError("occupation"))}
        />
      </div>

      {/* Unticked by default, and the duplicate-PAN rule is stated here because
          this is the moment the applicant agrees to it. */}
      <div className="choice">
        <input type="checkbox" id="acceptedTerms" name="acceptedTerms" required />
        <label htmlFor="acceptedTerms">{copy.consent.terms}
        </label>
      </div>

      <p className="chips-note">{copy.consent.duplicateWarning}
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <SubmitButton
          label={copy.submit}
          pendingLabel={"Submitting…"}
        />
      </div>
    </form>
  );
}
