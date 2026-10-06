import Link from "next/link";
import { PageShell } from "@/components/quizkerala/PageShell";
import { CONTACT, QUIZKERALA } from "@/lib/quizkerala/content";

export const metadata = { title: "Contact and support" };

const mail = (subject: string) =>
  `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;

export default function Contact() {
  return (
    <PageShell
      path="/quizkerala/contact"
      title="Contact and support"
      intro="We read every message and reply within two working days."
    >
      <div className="prose" style={{ maxWidth: "none" }}>
        <div className="contact-grid">
          <div className="card">
            <h3>Player help</h3>
            <p>Trouble signing in, a quiz that will not open, or a score that looks wrong. Include the quiz code.</p>
            <a className="btn btn-primary" href={mail("QuizKerala support")}>
              Email support
            </a>
          </div>
          <div className="card">
            <h3>Organisers</h3>
            <p>Get organiser access, or ask about running a large or private quiz.</p>
            <a className="btn btn-secondary" href={mail("QuizKerala organiser access")}>
              Request access
            </a>
          </div>
          <div className="card">
            <h3>Report a problem</h3>
            <p>Cheating, an offensive display name, a wrong answer key, or a safety concern.</p>
            <a className="btn btn-secondary" href={mail("QuizKerala report")}>
              Report it
            </a>
          </div>
          <div className="card">
            <h3>Privacy and deletion</h3>
            <p>Ask what we hold about you, correct it, or delete your account.</p>
            <Link className="btn btn-secondary" href="/quizkerala/delete-account">
              Delete account
            </Link>
          </div>
        </div>

        <h2>Sign-in help</h2>
        <p>
          {QUIZKERALA.name} uses Google sign-in only. If sign-in fails, make
          sure you are using a Google account you can open in your browser,
          allow pop-ups for the site, and try again. In the Android app, update
          Chrome from the Play Store, because the app opens the quiz in a
          Chrome window.
        </p>

        <h2>Write to us</h2>
        <p>
          <strong>Email:</strong> <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <br />
          <strong>Publisher:</strong> {CONTACT.company}
          <br />
          <strong>Address:</strong> {CONTACT.address}
        </p>
      </div>
    </PageShell>
  );
}
