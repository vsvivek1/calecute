"use client";

/**
 * A small wrapper for one-shot admin actions.
 *
 * Every admin action is a real form POST with a pending state and a result
 * message. The pending state matters more than it looks: approving an agent on
 * a slow connection appears to do nothing for a second or two, and an admin
 * working through a queue will click twice.
 */
import { useActionState } from "react";
import type { ActionState } from "@/app/(agents)/admin/actions";
import { En, Ml } from "./Bilingual";
import { SubmitButton } from "./SubmitButton";

export function ActionForm({
  action,
  label,
  pendingLabel,
  hidden,
  children,
  variant,
}: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  label: { ml: string; en: string };
  pendingLabel?: { ml: string; en: string };
  hidden?: Record<string, string | number>;
  children?: React.ReactNode;
  variant?: "secondary";
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="action-form">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
      {children}

      {state.error && (
        <p className="notice stop" role="alert">
          <En>{state.error}</En>
        </p>
      )}
      {state.ok && (
        <p className="notice ok" role="status">
          <En>{state.ok}</En>
        </p>
      )}

      <div className={variant === "secondary" ? "action-secondary" : undefined}>
        <SubmitButton
          label={label}
          pendingLabel={pendingLabel ?? { ml: "…", en: "Working…" }}
        />
      </div>
    </form>
  );
}

/** Label + control pair, used by the admin forms. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: { ml: string; en: string };
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        <Ml>{label.ml}</Ml>
        <En>{label.en}</En>
      </label>
      {children}
      {hint && <p className="field-hint" lang="en">{hint}</p>}
    </div>
  );
}
