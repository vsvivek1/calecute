"use client";

/**
 * Step 3: the optional qualification questions.
 *
 * Optional means optional. Every field can be left blank, the whole step can be
 * skipped with one tap, and skipping changes nothing about the application. The
 * heading says so in Malayalam, which is the wording the brief specified:
 * "ഇത് നിർബന്ധമല്ല. തിരഞ്ഞെടുപ്പിൽ സഹായിക്കും."
 *
 * The answers exist so an admin can prioritise — an Akshaya operator with four
 * hours a day and reach into government offices is a different prospect from
 * someone with none of that — not to filter anyone out.
 */
import { useActionState } from "react";
import {
  submitQualifications,
  type FormState,
} from "@/app/(agents)/agents/signup/actions";
import {
  computerOptions,
  educationOptions,
  experienceOptions,
  hoursOptions,
  reachOptions,
  signup as copy,
  yesNoOptions,
  type Bilingual,
} from "@/lib/agents/content";
import { En, Ml } from "./Bilingual";
import { SubmitButton } from "./SubmitButton";

type Choice = { value: string } & Bilingual;

function RadioGroup({
  name,
  legend,
  options,
}: {
  name: string;
  legend: Bilingual;
  options: Choice[];
}) {
  return (
    <fieldset>
      <legend>
        <Ml>{legend.ml}</Ml>
        <En>{legend.en}</En>
      </legend>
      {options.map((option) => (
        <div className="choice" key={option.value}>
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
          />
          <label htmlFor={`${name}-${option.value}`}>
            <Ml>{option.ml}</Ml>
            <En>{option.en}</En>
          </label>
        </div>
      ))}
    </fieldset>
  );
}

function CheckboxGroup({
  name,
  legend,
  options,
}: {
  name: string;
  legend: Bilingual;
  options: Choice[];
}) {
  return (
    <fieldset>
      <legend>
        <Ml>{legend.ml}</Ml>
        <En>{legend.en}</En>
      </legend>
      {options.map((option) => (
        <div className="choice" key={option.value}>
          <input
            type="checkbox"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
          />
          <label htmlFor={`${name}-${option.value}`}>
            <Ml>{option.ml}</Ml>
            <En>{option.en}</En>
          </label>
        </div>
      ))}
    </fieldset>
  );
}

export function QualificationsForm() {
  const [state, action] = useActionState<FormState, FormData>(
    submitQualifications,
    {},
  );

  return (
    <form action={action}>
      {state.error && (
        <p className="notice stop" role="alert">
          <Ml>{state.error}</Ml>
        </p>
      )}

      <RadioGroup
        name="education"
        legend={copy.fields.education}
        options={educationOptions}
      />
      <CheckboxGroup
        name="experience"
        legend={copy.fields.experience}
        options={experienceOptions}
      />
      <RadioGroup name="hoursPerDay" legend={copy.fields.hours} options={hoursOptions} />
      <RadioGroup name="hasVehicle" legend={copy.fields.vehicle} options={yesNoOptions} />
      <RadioGroup
        name="computerLiteracy"
        legend={copy.fields.computer}
        options={computerOptions}
      />
      <CheckboxGroup name="reach" legend={copy.fields.reach} options={reachOptions} />

      <div style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
        <SubmitButton
          label={copy.save}
          pendingLabel={{ ml: "സേവ് ചെയ്യുന്നു…", en: "Saving…" }}
        />
        {/* Skipping is a first-class action, not a link buried in small print. */}
        <a className="button secondary" href="/agents/signup/done">
          <span>
            <Ml>{copy.skip.ml}</Ml>
            <En>{copy.skip.en}</En>
          </span>
        </a>
      </div>
    </form>
  );
}
