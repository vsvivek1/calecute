import { company } from "@/lib/company";
import UnauthorizedChargeForm from "@/components/UnauthorizedChargeForm";

export const metadata = {
  title: "Report an Unauthorized Transaction | Calecutech",
  description:
    "Report a charge from a Calecutech app that you did not authorise, request a refund, or learn how to dispute it with your bank.",
};

export default function ReportUnauthorizedTransactionPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">
        Report an Unauthorized Transaction
      </h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: October 4, 2026
      </p>

      <div className="mt-8 space-y-6 text-black/80 dark:text-white/80">
        <p>
          Some purchases in our Android apps are processed directly by{" "}
          {company.legalName} through our own payment provider, rather than by
          Google Play. For those purchases we are the merchant of record, so
          please contact us about any charge you do not recognise.
        </p>

        <section>
          <h2 className="text-xl font-medium">Report it to us</h2>
          <p className="mt-2">
            If you see a charge from one of our apps that you or a member of
            your household did not make, fill in the form below or email{" "}
            <a
              className="underline"
              href={`mailto:${company.email}?subject=Unauthorized%20transaction%20report`}
            >
              {company.email}
            </a>
            . We reply within 2 business days. If we confirm the charge was not
            authorised, we refund it in full to the original payment method and
            cancel any related subscription.
          </p>
        </section>

        <section className="rounded-xl border border-black/10 p-6 dark:border-white/15">
          <UnauthorizedChargeForm />
        </section>

        <section>
          <h2 className="text-xl font-medium">
            Dispute it with your bank or card issuer
          </h2>
          <p className="mt-2">
            You can also dispute the charge directly with your bank, card
            issuer or payment app at any time. Contacting us first is usually
            faster, but you do not need to wait for us before raising a
            dispute or chargeback.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Purchases made through Google Play</h2>
          <p className="mt-2">
            If the charge was billed by Google Play, it will show as
            &ldquo;Google&rdquo; on your statement. Request a refund through
            Google Play or report it to Google as described in{" "}
            <a
              className="underline"
              href="https://support.google.com/googleplay/answer/2479637"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Play&rsquo;s refund help
            </a>
            .
          </p>
        </section>

        <p>
          See our{" "}
          <a className="underline" href="/refund-policy">
            Refund &amp; Cancellation Policy
          </a>{" "}
          for other refund questions.
        </p>
      </div>
    </div>
  );
}
