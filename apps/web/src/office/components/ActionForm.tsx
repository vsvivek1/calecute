"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { ActionState } from "../types";

type Action = (prev: ActionState | null, fd: FormData) => Promise<ActionState>;

/**
 * A form wired to a Server Action, showing its error or message inline.
 * Submits through onSubmit (not the `action` prop) so React does not clear
 * the fields when the server says something is wrong; they clear only on
 * success, and only when `reset` is true.
 */
export default function ActionForm({
  action,
  children,
  submit,
  pendingLabel = "Saving…",
  reset = true,
  className = "",
  buttonClass = "btn-primary",
  footer,
}: {
  action: Action;
  children?: ReactNode;
  submit: string;
  pendingLabel?: string;
  reset?: boolean;
  className?: string;
  buttonClass?: string;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && reset) ref.current?.reset();
  }, [state, reset]);

  return (
    <form
      ref={ref}
      className={`grid gap-3 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? pendingLabel : submit}
        </button>
        {footer}
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function Feedback({ state }: { state: ActionState | null }) {
  if (!state) return null;
  return (
    <div aria-live="polite" className="grid gap-2">
      {state.error ? (
        <p role="alert" className="text-sm text-rose-300">
          {state.error}
        </p>
      ) : null}
      {state.message ? <p className="text-sm text-emerald-300">{state.message}</p> : null}
      {state.secret ? <Secret value={state.secret} /> : null}
    </div>
  );
}

function Secret({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3">
      <code className="font-mono text-lg tracking-wider text-amber-100 select-all">{value}</code>
      <button
        type="button"
        className="btn-ghost text-xs"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => setCopied(true));
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="text-xs text-amber-100/70">Shown once. It is not stored anywhere you can see again.</span>
    </div>
  );
}
