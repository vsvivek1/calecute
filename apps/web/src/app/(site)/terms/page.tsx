export const metadata = {
  title: "Terms of Service | Calecutech",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: July 1, 2026
      </p>

      <div className="mt-8 space-y-6 text-black/80 dark:text-white/80">
        <p>
          These Terms of Service govern your use of the software development
          services, subscription products (including DailyDo), and websites
          operated by Calecute Technologies LLC (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By using our services, you agree to these terms.
        </p>

        <section>
          <h2 className="text-xl font-medium">What we provide</h2>
          <p className="mt-2">
            We provide custom web development, mobile app development, SaaS
            product development, and backend and API systems on a contract
            basis, and we operate our own subscription products. Client
            engagements are additionally governed by the written scope and quote
            agreed for that project, which prevails over these terms where the
            two conflict.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Use of the service</h2>
          <p className="mt-2">
            DailyDo is a team task planning tool. You may use it for lawful
            personal or business purposes. You are responsible for all activity
            that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Accounts</h2>
          <p className="mt-2">
            You must sign in with a valid Google account. You are responsible
            for keeping your account secure. We reserve the right to suspend or
            terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Your data</h2>
          <p className="mt-2">
            You retain ownership of the tasks, projects, and content you create.
            We do not sell your data. See our{" "}
            <a className="underline" href="/privacy">
              Privacy Policy
            </a>{" "}
            for details on how we handle your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Billing</h2>
          <p className="mt-2">
            We charge under one of three models, agreed in writing before work
            begins: fixed-price projects invoiced at milestones, monthly SaaS
            subscriptions, and hourly development contracts invoiced monthly in
            arrears.
          </p>
          <p className="mt-2">
            Paid plans (Family, Office) are billed as described at the time of
            purchase. Subscriptions renew automatically unless cancelled.
            Invoices for project work are due within 14 days of issue. Full
            cancellation and refund terms are set out in our{" "}
            <a className="underline" href="/refund-policy">
              Refund &amp; Cancellation Policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Availability</h2>
          <p className="mt-2">
            We aim for high availability but do not guarantee uninterrupted
            access. We may modify or discontinue features with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Limitation of liability</h2>
          <p className="mt-2">
            To the extent permitted by law, Calecute Technologies LLC is not
            liable for indirect, incidental, or consequential damages arising
            from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Governing law</h2>
          <p className="mt-2">
            These terms are governed by the laws of the State of Wyoming,
            USA, without regard to its conflict of laws principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Contact</h2>
          <p className="mt-2">
            Calecute Technologies LLC
            <br />
            Operations office: Kozhikode (Calicut), Kerala, India
            <br />
            <a className="underline" href="mailto:info@calecutech.com">
              info@calecutech.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
