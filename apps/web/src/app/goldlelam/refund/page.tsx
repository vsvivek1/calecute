import { LegalPage, Clause } from "@/components/goldlelam/LegalPage";
import { DraftNotice } from "@/components/goldlelam/DraftNotice";
import { GOLDLELAM, CONTACT } from "@/lib/goldlelam/content";

export const metadata = { title: "Refund Policy" };

export default function GoldLelamRefund() {
  return (
    <LegalPage
      title="Refund Policy"
      updated={GOLDLELAM.policyUpdated}
      intro={
        <>
          This page explains how an earnest money deposit (EMD) you pay
          through {GOLDLELAM.name} is refunded. {GOLDLELAM.name} facilitates
          the payment; the bank running the auction controls the deposit and
          decides when it is refunded, adjusted, or forfeited.
        </>
      }
    >
      <DraftNotice />

      <Clause n={1} heading="The EMD is bank-controlled">
        <p>
          Each listing bank sets its own EMD amount, and its own rules for
          when a deposit is refunded, adjusted against a winning bid, or
          forfeited. {GOLDLELAM.name} collects the payment on the
          bank&apos;s behalf through our payment provider and does not
          decide the outcome.
        </p>
      </Clause>

      <Clause n={2} heading="If you don't win the lot">
        <p>
          Your EMD is refunded by the bank to the account or payment method
          it collects refund details for, on that bank&apos;s own timeline.
          Typical bank timelines run 3–15 business days after the auction
          closes; the exact timeline for a specific auction is stated on
          that auction&apos;s listing.
        </p>
      </Clause>

      <Clause n={3} heading="If you win the lot">
        <p>
          Your EMD is adjusted against the amount you owe, per the terms the
          bank stated for that auction.
        </p>
      </Clause>

      <Clause n={4} heading="If a deposit is forfeited">
        <p>
          A bank may forfeit an EMD where a winning bidder fails to complete
          payment and collection within the time the bank set, or under any
          other condition that bank&apos;s own auction rules state. That
          decision belongs to the bank, not to {GOLDLELAM.name}.
        </p>
      </Clause>

      <Clause n={5} heading="If an auction is cancelled or postponed">
        <p>
          Where a bank cancels or postpones an auction, EMDs already paid
          for it are refunded in full, on that bank&apos;s timeline.
        </p>
      </Clause>

      <Clause n={6} heading="If your refund hasn't arrived">
        <p>
          Check the timeline stated on the auction listing first. If it has
          passed, write to us at{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> with the
          auction and bank name, and we will follow up with the bank on your
          behalf — {GOLDLELAM.name} does not hold or control the funds, so
          we cannot issue the refund directly.
        </p>
      </Clause>
    </LegalPage>
  );
}
