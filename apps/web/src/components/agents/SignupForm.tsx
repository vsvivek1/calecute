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
 *   - a render timestamp, stamped server-side, so the elapsed time is measured
 *     against our clock and cannot be forged by the client.
 */
import { useActionState, useEffect, useMemo, useState } from "react";
import { submitSignup, type FormState } from "@/app/(agents)/agents/signup/actions";
import {
  signup as copy,
  type Bilingual as BilingualText,
} from "@/lib/agents/content";
import { En, Ml } from "./Bilingual";
import { SubmitButton } from "./SubmitButton";

interface Option {
  id: number;
  nameEn: string;
  nameMl: string;
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
  nameMl: string | null;
}

function Label({ text, htmlFor }: { text: BilingualText; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor}>
      <Ml>{text.ml}</Ml>
      <En>{text.en}</En>
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
  renderedAt,
}: {
  districts: Option[];
  termsVersion: string;
  apiBase: string;
  initialDistrictId?: number;
  initialLocalBodyId?: number;
  defaultName: string;
  renderedAt: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(submitSignup, {});

  const [districtId, setDistrictId] = useState(initialDistrictId ?? 0);
  const [query, setQuery] = useState("");
  const [bodies, setBodies] = useState<LocalBodyOption[]>([]);
  const [localBodyId, setLocalBodyId] = useState(initialLocalBodyId ?? 0);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingBodies, setLoadingBodies] = useState(false);

  /* Panchayats for the chosen district, debounced against the search box. */
  useEffect(() => {
    if (!districtId) {
      setBodies([]);
      return;
    }
    let cancelled = false;
    setLoadingBodies(true);

    const timer = setTimeout(async () => {
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

  /* Wards for the chosen panchayat. */
  useEffect(() => {
    if (!localBodyId) {
      setWards([]);
      return;
    }
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

  const chosenBody = useMemo(
    () => bodies.find((b) => b.id === localBodyId),
    [bodies, localBodyId],
  );

  const fieldError = (name: string) => state.fields?.[name];

  return (
    <form action={action} noValidate>
      <input type="hidden" name="termsVersion" value={termsVersion} />
      <input type="hidden" name="renderedAt" value={renderedAt} />

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
          <Ml>{state.error}</Ml>
          {state.code && <En>{state.code}</En>}
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
        <p className="field-hint" id="mobile-hint">
          <Ml>{copy.hints.mobileNotVerified.ml}</Ml>
          <En>{copy.hints.mobileNotVerified.en}</En>
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
            — തിരഞ്ഞെടുക്കുക —
          </option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.nameMl} · {district.nameEn}
            </option>
          ))}
        </select>
      </div>

      {districtId > 0 && (
        <>
          <div className="field">
            <label htmlFor="localBodySearch">
              <Ml>{copy.hints.searchLocalBody.ml}</Ml>
              <En>{copy.hints.searchLocalBody.en}</En>
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
              required
              value={localBodyId || ""}
              onChange={(event) => setLocalBodyId(Number(event.target.value))}
            >
              <option value="" disabled>
                {loadingBodies ? "…" : "— തിരഞ്ഞെടുക്കുക —"}
              </option>
              {bodies.map((body) => (
                <option
                  key={body.id}
                  value={body.id}
                  disabled={!body.signupsOpen || body.remaining <= 0}
                >
                  {body.nameMl} · {body.nameEn}
                  {body.signupsOpen
                    ? ` — ${body.remaining}/${body.slotCapacity}`
                    : " — closed"}
                </option>
              ))}
            </select>
            {chosenBody && (
              <p className="field-hint">
                <Ml>{`${chosenBody.remaining} ഒഴിവ്`}</Ml>
                <En>
                  {chosenBody.remaining} of {chosenBody.slotCapacity} places left
                </En>
              </p>
            )}
          </div>
        </>
      )}

      {localBodyId > 0 && (
        <div className="field">
          <Label text={copy.fields.ward} htmlFor="wardId" />
          <select id="wardId" name="wardId" defaultValue="">
            <option value="">— {copy.hints.wardOptional.ml} —</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.number}
                {ward.nameMl ? ` · ${ward.nameMl}` : ward.nameEn ? ` · ${ward.nameEn}` : ""}
              </option>
            ))}
          </select>
          {wards.length === 0 && (
            <p className="field-hint">
              <Ml>{copy.hints.wardOptional.ml}</Ml>
              <En>Ward list not available for this panchayat. It is optional.</En>
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
        <label htmlFor="acceptedTerms">
          <Ml>{copy.consent.terms.ml}</Ml>
          <En>{copy.consent.terms.en}</En>
        </label>
      </div>

      <p className="chips-note">
        <Ml>{copy.consent.duplicateWarning.ml}</Ml>
        <En>{copy.consent.duplicateWarning.en}</En>
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <SubmitButton
          label={copy.submit}
          pendingLabel={{ ml: "അയയ്ക്കുന്നു…", en: "Submitting…" }}
        />
      </div>
    </form>
  );
}
