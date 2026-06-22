export const metadata = {
  title: "Data Deletion | Calecutech",
};

export default function DataDeletionPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Data Deletion Instructions</h1>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        Last updated: June 22, 2026
      </p>

      <div className="mt-8 space-y-6 text-black/80 dark:text-white/80">
        <p>
          If you signed in to Calecutech using Google Sign-In, you can request
          deletion of all data we hold about you at any time.
        </p>

        <section>
          <h2 className="text-xl font-medium">How to request deletion</h2>
          <p className="mt-2">
            Email{" "}
            <a className="underline" href="mailto:contact@calecutech.com?subject=Data%20Deletion%20Request">
              contact@calecutech.com
            </a>{" "}
            from the email address associated with your account, with the
            subject line &ldquo;Data Deletion Request&rdquo;. Include your
            name and the email you used to sign in.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What happens next</h2>
          <p className="mt-2">
            We will verify your request and permanently delete your account
            data, including any information obtained via Google Sign-In,
            within 30 days. We will confirm by email once the deletion is
            complete.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium">What gets deleted</h2>
          <ul className="mt-2 list-disc pl-6">
            <li>Your name, email, and Google profile information</li>
            <li>Any account or activity data associated with your profile</li>
          </ul>
        </section>

        <p>
          See our{" "}
          <a className="underline" href="/privacy">
            Privacy Policy
          </a>{" "}
          for more information.
        </p>
      </div>
    </div>
  );
}
