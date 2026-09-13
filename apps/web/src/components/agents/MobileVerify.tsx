"use client";

/**
 * Mobile verification, at payout setup rather than at signup.
 *
 * Deliberate sequencing: an OTP during signup adds a failure point on a weak
 * connection, and the number is not needed until money moves. By the time an
 * agent is here they have a balance and a reason to finish.
 */
import { useActionState } from "react";
import {
  startMobileVerification,
  verifyMobile,
} from "@/app/(agents)/agents/dashboard/payouts/actions";
import type { FormState } from "@/app/(agents)/agents/signup/actions";
import { SubmitButton } from "./SubmitButton";

export function MobileVerify({
  verified,
  codeSent,
}: {
  verified: boolean;
  codeSent: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(verifyMobile, {});
  const [sendState, sendAction] = useActionState<FormState, FormData>(
    startMobileVerification,
    {},
  );

  if (verified) {
    return (
      <p className="notice ok">Mobile number verified.
      </p>
    );
  }

  return (
    <div>
      {(state.error || sendState.error) && (
        <p className="notice stop" role="alert"></p>
      )}

      {!codeSent ? (
        <form action={sendAction}>
          <p className="chips-note">A code is sent to the number you registered with.
          </p>
          <button type="submit" className="button secondary">
            <span>Send code
            </span>
          </button>
        </form>
      ) : (
        <form action={action}>
          <div className="field">
            <label htmlFor="code">Six-digit code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
          </div>
          <SubmitButton
            label={"Verify"}
            pendingLabel={"Checking…"}
          />
        </form>
      )}
    </div>
  );
}
