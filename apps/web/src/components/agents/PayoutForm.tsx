"use client";

/**
 * PAN and bank details — the only place either is collected.
 *
 * The public page promises that no PAN is asked for at signup, so this form
 * exists precisely to keep that promise: it is reached only from the dashboard,
 * only by an agent who has a balance, and it explains why it is being asked
 * before it asks.
 *
 * The PAN is never rendered back. On error the field clears rather than
 * round-tripping the number through the HTML.
 */
import { useActionState } from "react";
import { savePayoutProfile } from "@/app/(agents)/agents/dashboard/payouts/actions";
import type { FormState } from "@/app/(agents)/agents/signup/actions";
import { En, Ml } from "./Bilingual";
import { SubmitButton } from "./SubmitButton";

export function PayoutForm({
  currentPan,
  panStatus,
  currentAccount,
  currentIfsc,
  currentHolder,
  currentUpi,
}: {
  currentPan: string | null;
  panStatus: string;
  currentAccount: string | null;
  currentIfsc: string | null;
  currentHolder: string | null;
  currentUpi: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(savePayoutProfile, {});

  return (
    <form action={action} noValidate>
      {state.error && (
        <p className="notice stop" role="alert">
          <Ml>{state.error}</Ml>
          {state.code && <En>{state.code}</En>}
        </p>
      )}

      <div className="field">
        <label htmlFor="pan">
          <Ml>പാൻ നമ്പർ</Ml>
          <En>PAN number</En>
        </label>
        {currentPan ? (
          <p className="chips-note">
            <span className="code-badge" style={{ fontSize: "1rem" }}>
              {currentPan}
            </span>{" "}
            <span lang="en">({panStatus})</span>
          </p>
        ) : null}
        <input
          type="text"
          id="pan"
          name="pan"
          placeholder="AAAAA9999A"
          maxLength={10}
          autoComplete="off"
          spellCheck={false}
          style={{ textTransform: "uppercase" }}
          aria-describedby="pan-hint"
        />
        <p className="field-hint" id="pan-hint">
          <Ml>ടിഡിഎസ് ഫയൽ ചെയ്യാൻ ആദായനികുതി വകുപ്പ് ഇത് നിർബന്ധമാക്കുന്നു.</Ml>
          <En>
            Required by the Income Tax Department so TDS can be filed against
            your name. Stored encrypted and never shown in full again.
          </En>
        </p>
      </div>

      <fieldset>
        <legend>
          <Ml>ബാങ്ക് അക്കൗണ്ട്</Ml>
          <En>Bank account</En>
        </legend>

        <div className="field">
          <label htmlFor="bankAccountNumber">
            <Ml>അക്കൗണ്ട് നമ്പർ</Ml>
            <En>Account number</En>
          </label>
          {currentAccount && (
            <p className="chips-note" lang="en">
              Currently {currentAccount}
            </p>
          )}
          <input
            type="text"
            id="bankAccountNumber"
            name="bankAccountNumber"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="bankIfsc">
            <Ml>ഐഎഫ്എസ്‌സി കോഡ്</Ml>
            <En>IFSC code</En>
          </label>
          <input
            type="text"
            id="bankIfsc"
            name="bankIfsc"
            defaultValue={currentIfsc ?? ""}
            maxLength={11}
            autoComplete="off"
            style={{ textTransform: "uppercase" }}
          />
        </div>

        <div className="field">
          <label htmlFor="bankHolderName">
            <Ml>അക്കൗണ്ട് ഉടമയുടെ പേര്</Ml>
            <En>Account holder name</En>
          </label>
          <input
            type="text"
            id="bankHolderName"
            name="bankHolderName"
            defaultValue={currentHolder ?? ""}
            autoComplete="off"
          />
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="upiId">
          <Ml>യുപിഐ ഐഡി</Ml>
          <En>UPI id (instead of a bank account)</En>
        </label>
        <input
          type="text"
          id="upiId"
          name="upiId"
          defaultValue={currentUpi ?? ""}
          placeholder="name@bank"
          autoComplete="off"
        />
      </div>

      <SubmitButton
        label={{ ml: "സേവ് ചെയ്യുക", en: "Save payout details" }}
        pendingLabel={{ ml: "സേവ് ചെയ്യുന്നു…", en: "Saving…" }}
      />
    </form>
  );
}
