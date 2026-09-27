import { LegalPage, Clause } from "@/components/goldlelam/LegalPage";
import { DraftNotice } from "@/components/goldlelam/DraftNotice";
import { GOLDLELAM, CONTACT, company } from "@/lib/goldlelam/content";

export const metadata = { title: "Terms of Use" };

export default function GoldLelamTerms() {
  return (
    <LegalPage
      title="Terms of Use"
      updated={GOLDLELAM.policyUpdated}
      intro={
        <>
          These terms govern your use of the {GOLDLELAM.name} app and{" "}
          {GOLDLELAM.webDomain} to browse and bid in gold-loan auctions
          listed by partner banks.
        </>
      }
    >
      <DraftNotice />

      <Clause n={1} heading="Who we are, and who runs the auction">
        <p>
          {GOLDLELAM.name} is a technology platform operated by{" "}
          {company.legalName}. We provide the software a bank uses to list
          its gold-loan auctions and the app you use to browse and bid in
          them.
        </p>
        <p>
          <strong>The bank conducts the auction, not us.</strong> Each
          listing bank sets its own reserve prices, eligibility conditions,
          auction rules, and settlement process, and is solely responsible
          for the lots it lists, the gold&apos;s condition, and the conduct
          of its own auction. {GOLDLELAM.name} is not a party to the sale
          and does not take custody of any gold.
        </p>
      </Clause>

      <Clause n={2} heading="Eligibility and your account">
        <p>
          You must be at least 18 and complete the KYC a bank requires before
          it will accept a bid from you. Your account is yours alone — do
          not share your sign-in with anyone.
        </p>
      </Clause>

      <Clause n={3} heading="Earnest money deposit (EMD)">
        <p>
          A bank may require an earnest money deposit before you can bid in
          its auction. The amount, and the conditions under which it is
          forfeited, refunded, or adjusted against a winning bid, are set by
          that bank — see the{" "}
          <a href="/goldlelam/refund">refund policy</a>. Your payment details
          are entered on our payment provider&apos;s own screen and never
          reach {GOLDLELAM.name}&apos;s servers.
        </p>
      </Clause>

      <Clause n={4} heading="Bidding and bid finality">
        <ul>
          <li>
            A bid, once placed, cannot be withdrawn. Bid only what you are
            able and willing to pay if you win.
          </li>
          <li>
            The highest valid bid standing when an auction closes wins the
            lot, subject to the listing bank&apos;s own auction rules and its
            right to reject a bid, extend, or cancel an auction.
          </li>
          <li>
            Settlement — payment of the balance, and collection of the gold —
            happens directly between you and the listing bank, on that
            bank&apos;s own terms.
          </li>
        </ul>
      </Clause>

      <Clause n={5} heading="What you must not do">
        <ul>
          <li>
            Bid without the genuine intention and ability to pay if you win.
          </li>
          <li>
            Attempt to manipulate an auction — bidding to inflate the price
            with no intention of paying, colluding with another bidder, or
            interfering with the bidding of others.
          </li>
          <li>
            Provide false information for KYC, or bid on behalf of someone
            else without authority to do so.
          </li>
        </ul>
        <p>
          We may suspend or close an account that breaks these terms, and
          will tell you why unless we are prevented from doing so.
        </p>
      </Clause>

      <Clause n={6} heading="Availability">
        <p>
          {GOLDLELAM.name} is provided as it is. We do not guarantee the app
          will be available without interruption, and a technical issue near
          the close of an auction does not extend a bank&apos;s own bidding
          window unless that bank chooses to extend it.
        </p>
      </Clause>

      <Clause n={7} heading="Disputes">
        <p>
          A dispute about a lot, a reserve price, eligibility, or settlement
          is between you and the listing bank; {GOLDLELAM.name} will assist
          in providing records of the bidding but is not a party to that
          dispute. A dispute about the platform itself — your account, the
          app, or these terms — should first be raised with us at{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </Clause>

      <Clause n={8} heading="Liability">
        <p>
          To the extent the law allows, {company.legalName} is not liable
          for the condition, valuation, or title of any lot, for a listing
          bank&apos;s conduct of its own auction, or for any indirect or
          consequential loss. Nothing here limits liability that cannot be
          limited by law.
        </p>
      </Clause>

      <Clause n={9} heading="Governing law">
        <p>
          These terms are governed by the laws of India, and the courts at
          Kozhikode, Kerala have jurisdiction.
        </p>
      </Clause>
    </LegalPage>
  );
}
