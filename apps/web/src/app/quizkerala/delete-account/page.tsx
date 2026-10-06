import { PageShell } from "@/components/quizkerala/PageShell";
import {
  CONTACT,
  DELETES,
  QUIZKERALA,
  RETAINS_ON_DELETE,
} from "@/lib/quizkerala/content";

export const metadata = { title: "Delete your account" };

/**
 * Google Play requires a deletion route that works without installing the
 * app. This is it; the Play Console "Delete account URL" points here.
 */
export default function DeleteAccount() {
  const subject = encodeURIComponent(`Delete my ${QUIZKERALA.name} account`);
  const body = encodeURIComponent(
    `Please delete my ${QUIZKERALA.name} account and all its data.\n\nGoogle account email: \n`,
  );

  return (
    <PageShell
      path="/quizkerala/delete-account"
      title="Delete your account"
      intro={`How to delete your ${QUIZKERALA.name} account and data, with or without the app (${QUIZKERALA.androidPackage}).`}
    >
      <div className="prose">
        <h2>Option 1: in the app</h2>
        <ol>
          <li>Open {QUIZKERALA.name} and sign in.</li>
          <li>Tap your profile picture, then <strong>Delete account</strong>.</li>
          <li>Confirm. Your account is removed straight away.</li>
        </ol>

        <h2>Option 2: by email, no app needed</h2>
        <p>
          Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> from
          the Google account you sign in with, with the subject &ldquo;Delete
          my {QUIZKERALA.name} account&rdquo;. We confirm the request came from
          you, delete the account within 30 days, and email you when it is
          done.
        </p>
        <p>
          <a
            className="btn btn-danger"
            href={`mailto:${CONTACT.email}?subject=${subject}&body=${body}`}
          >
            Request deletion by email
          </a>
        </p>

        <h2>What is deleted</h2>
        <ul>
          {DELETES.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>

        <h2>What is kept, and why</h2>
        <p>{RETAINS_ON_DELETE}</p>

        <div className="notice">
          Want to keep your account but remove some data, such as a single
          quiz attempt? Write to us and we will do that instead.
        </div>
      </div>
    </PageShell>
  );
}
