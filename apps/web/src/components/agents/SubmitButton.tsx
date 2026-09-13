"use client";

/**
 * A submit button that reports the pending state.
 *
 * The connection this is designed for is slow enough that a form can appear to
 * do nothing for several seconds. Without feedback people press again, and on
 * signup a double submission is the difference between one application and a
 * confusing 409.
 */
import { useFormStatus } from "react-dom";

export function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const shown = pending ? pendingLabel : label;
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      <span>{shown}
      </span>
    </button>
  );
}
