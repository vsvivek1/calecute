export const metadata = {
  title: "Privacy Policy | Calecutech",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: June 22, 2026
      </p>

      <div className="mt-8 space-y-6 text-black/80 dark:text-white/80">
        <p>
          Calecute Technologies LLC (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;) operates calecutech.com. This page explains what
          information we collect, how we use it, and how you can request its
          deletion.
        </p>

        <section>
          <h2 className="text-xl font-medium">Information we collect</h2>
          <p className="mt-2">
            When you sign in with Google or contact us, we may collect your
            name, email address, and basic profile information provided by
            the authentication provider.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">How we use it</h2>
          <p className="mt-2">
            We use this information to operate your account, respond to
            inquiries, and provide our services. We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Data deletion</h2>
          <p className="mt-2">
            You can request deletion of your data at any time. See our{" "}
            <a className="underline" href="/data-deletion">
              Data Deletion page
            </a>{" "}
            for instructions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">Contact</h2>
          <p className="mt-2">
            Questions about this policy can be sent to{" "}
            <a className="underline" href="mailto:vivek@calecutech.com">
              vivek@calecutech.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
