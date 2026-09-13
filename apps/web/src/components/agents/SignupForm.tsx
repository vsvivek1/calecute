"use client";

/**
 * Step 2 of signup: the six required fields, and nothing else.
 *
 * Six is the whole list — name, mobile, district, panchayat, ward, occupation.
 * No PAN, no bank details, no documents, no photograph. The public page states
 * that explicitly, so this form has to keep the promise.
 *
 * Geography: choosing a district loads that district's local bodies, all of
 * them at once — a district has 50 to 90, which is small enough to send and
 * removes the round trip per keystroke. They populate a <datalist>, so the
 * applicant types into ONE box and the browser filters as they go. There used
 * to be a search box and a separate dropdown; two controls for one answer read
 * as a mistake, and it was.
 *
 * The typed name is matched back to an id, and the id is what gets submitted.
 * A name that matches nothing leaves the hidden field empty and the form says
 * so, rather than posting a name the API cannot place.
 *
 * Ward is a NUMBER, not a name from a list. No ward names are loaded for any
 * local body in Kerala, so there is no list to offer — but every resident knows
 * their own ward number, and it is the unit territory is allocated in. The API
 * creates the ward row from the number.
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
  filled: number;
  signupsOpen: boolean;
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
  const [bodies, setBodies] = useState<LocalBodyOption[]>([]);
  /** What is typed in the picker. The id below is derived from it. */
  const [bodyName, setBodyName] = useState("");
  // Temporary: municipalities and corporations are not seeded yet, so a reader
  // in a town has nothing to pick. See migration 0006.
  const [notListed, setNotListed] = useState(false);
  const [loadingBodies, setLoadingBodies] = useState(false);

  /*
   * Every local body in the chosen district, once. Filtering then happens in
   * the browser via the datalist, so typing costs nothing.
   */
  useEffect(() => {
    if (!districtId) return;

    let cancelled = false;
    (async () => {
      // Inside the async body, not the effect body: a synchronous setState
      // during an effect forces an extra render pass before the fetch starts.
      setLoadingBodies(true);
      try {
        const url = new URL(`${apiBase}/geography/local-bodies`);
        url.searchParams.set("districtId", String(districtId));
        url.searchParams.set("limit", "200");
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        const payload = await response.json();
        if (!cancelled) setBodies(payload.data ?? []);
      } catch {
        if (!cancelled) setBodies([]);
      } finally {
        if (!cancelled) setLoadingBodies(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [districtId, apiBase]);

  // Derived, so a cleared district shows no stale panchayats even though the
  // fetched list is still in state.
  const visibleBodies = districtId ? bodies : [];

  /*
   * The typed name resolved to a row. Compared case- and space-insensitively
   * because the datalist inserts the exact string but a person typing it by
   * hand will not.
   */
  const typed = bodyName.trim().toLowerCase();
  const chosenBody = typed
    ? visibleBodies.find((b) => b.nameEn.trim().toLowerCase() === typed)
    : undefined;
  const localBodyId = chosenBody?.id ?? 0;

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
            // A name from the previous district cannot be right here.
            setBodyName("");
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
          {/*
            One box, not two. The datalist gives the browser's own filtering
            and its own keyboard and touch handling, which beats anything
            re-implemented here and costs no JavaScript.
          */}
          <div className="field">
            <Label text={copy.fields.localBody} htmlFor="localBodyName" />
            <input
              type="text"
              id="localBodyName"
              list="localBodyOptions"
              value={bodyName}
              disabled={notListed}
              required={!notListed}
              onChange={(event) => setBodyName(event.target.value)}
              autoComplete="off"
              enterKeyHint="next"
              placeholder={loadingBodies ? "Loading…" : "Start typing"}
              aria-describedby="local-body-hint"
              aria-invalid={Boolean(typed) && !chosenBody && !notListed}
            />
            <datalist id="localBodyOptions">
              {visibleBodies.map((body) => (
                <option key={body.id} value={body.nameEn} />
              ))}
            </datalist>

            {/* The id is what is submitted; the name is only how it is chosen. */}
            <input
              type="hidden"
              name="localBodyId"
              value={notListed || !localBodyId ? "" : localBodyId}
            />

            <p className="field-hint" id="local-body-hint">
              {notListed
                ? copy.hints.notListed
                : chosenBody
                  ? chosenBody.signupsOpen
                    ? chosenBody.filled === 1
                      ? "1 person has applied here so far"
                      : `${chosenBody.filled} people have applied here so far`
                    : "Registration is closed for this one."
                  : typed
                    ? "No match yet — keep typing, or tick the box below."
                    : copy.hints.searchLocalBody}
            </p>
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
                if (event.target.checked) setBodyName("");
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

          {/*
            Required, and asked as a number: no ward names are loaded for any
            local body in Kerala, so a dropdown would be empty. The applicant
            knows their own ward number.
          */}
          <div className="field">
            <Label text={copy.fields.ward} htmlFor="wardNumber" />
            <input
              type="number"
              id="wardNumber"
              name="wardNumber"
              required
              min={1}
              max={100}
              step={1}
              inputMode="numeric"
              defaultValue={state.values?.wardNumber ?? ""}
              autoComplete="off"
              aria-invalid={Boolean(fieldError("wardNumber"))}
              aria-describedby="ward-hint"
            />
            <p className="field-hint" id="ward-hint">{copy.hints.ward}
            </p>
            {fieldError("wardNumber") && (
              <p className="field-hint">{fieldError("wardNumber")}</p>
            )}
          </div>
        </>
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
