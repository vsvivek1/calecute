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
import { En, Ml } from "./Bilingual";
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
      <p className="notice ok">
        <Ml>മൊബൈൽ നമ്പർ സ്ഥിരീകരിച്ചു.</Ml>
        <En>Mobile number verified.</En>
      </p>
    );
  }

  return (
    <div>
      {(state.error || sendState.error) && (
        <p className="notice stop" role="alert">
          <Ml>{state.error ?? sendState.error}</Ml>
        </p>
      )}

      {!codeSent ? (
        <form action={sendAction}>
          <p className="chips-note">
            <Ml>രജിസ്റ്റർ ചെയ്ത നമ്പറിലേക്ക് കോഡ് അയയ്ക്കും.</Ml>
            <En>A code is sent to the number you registered with.</En>
          </p>
          <button type="submit" className="button secondary">
            <span>
              <Ml>കോഡ് അയയ്ക്കുക</Ml>
              <En>Send code</En>
            </span>
          </button>
        </form>
      ) : (
        <form action={action}>
          <div className="field">
            <label htmlFor="code">
              <Ml>ആറക്ക കോഡ്</Ml>
              <En>Six-digit code</En>
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
            label={{ ml: "സ്ഥിരീകരിക്കുക", en: "Verify" }}
            pendingLabel={{ ml: "പരിശോധിക്കുന്നു…", en: "Checking…" }}
          />
        </form>
      )}
    </div>
  );
}
