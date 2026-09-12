import { company, officeLines } from "@/lib/company";

export const metadata = {
  title: "Refund & Cancellation Policy | Calecutech",
  description:
    "How cancellations and refunds work for Calecutech development projects and SaaS subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">
        Refund &amp; Cancellation Policy
      </h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: August 11, 2026
      </p>

      <div className="mt-8 space-y-6 text-black/80 dark:text-white/80">
        <p>
          This policy explains how cancellations and refunds are handled for
          services and products sold by {company.legalName} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). It applies to both development engagements and
          subscription products such as DailyDo.
        </p>

        <section>
          <h2 className="text-xl font-medium">SaaS subscriptions</h2>
          <p className="mt-2">
            Subscriptions are billed monthly in advance and renew automatically
            until cancelled. You may cancel at any time from your account
            settings or by emailing us. On cancellation, your plan stays active
            until the end of the billing period already paid for, and you are
            not charged again.
          </p>
          <p className="mt-2">
            If you are charged in error — a duplicate charge, a charge after a
            cancellation, or a charge on an account you did not authorise —
            contact us within 7 days and we will refund it in full. Partial
            refunds for unused time within a billing period are handled on a
            case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Fixed-price projects</h2>
          <p className="mt-2">
            Fixed-price work is invoiced against agreed milestones. You may
            cancel a project at any time in writing. On cancellation:
          </p>
          <ul className="mt-3 space-y-2 pl-5 list-disc">
            <li>
              Milestones already completed and delivered are non-refundable.
            </li>
            <li>
              Any amount paid in advance for work not yet started is refunded in
              full.
            </li>
            <li>
              Work in progress on the current milestone is charged pro rata
              against the effort spent, and the balance is refunded.
            </li>
          </ul>
          <p className="mt-3">
            If we cancel a project for any reason other than non-payment or
            breach of our{" "}
            <a className="underline" href="/terms">
              Terms of Service
            </a>
            , we refund all amounts paid for undelivered work.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Hourly contracts</h2>
          <p className="mt-2">
            Hourly work is invoiced monthly in arrears for hours actually
            worked, so there is nothing to refund on cancellation. Either party
            may end an hourly contract with 14 days&rsquo; written notice. Any
            retainer held in advance and not consumed is returned in full.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">How to request a refund</h2>
          <p className="mt-2">
            Email{" "}
            <a className="underline" href={`mailto:${company.email}`}>
              {company.email}
            </a>{" "}
            with your invoice number or the email address on the account, and a
            short description of the issue. We acknowledge every request within
            2 business days and aim to resolve it within 7 business days.
          </p>
          <p className="mt-2">
            Approved refunds are issued to the original payment method.
            Depending on your bank or card issuer, the funds typically appear
            within 5&ndash;10 business days of the refund being processed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Chargebacks</h2>
          <p className="mt-2">
            If you believe a charge is incorrect, please contact us before
            raising a chargeback with your bank. We resolve almost all billing
            issues directly and far faster than the dispute process.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Contact</h2>
          <p className="mt-2">
            {company.legalName}
            <br />
            {officeLines.join(", ")}
            <br />
            <a className="underline" href={`mailto:${company.email}`}>
              {company.email}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
