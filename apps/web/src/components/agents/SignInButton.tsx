/**
 * The Google sign-in control, and the two WhatsApp links that belong with it.
 *
 * A plain link, not a button that calls a script. That is deliberate: this is
 * the single most important action on the page, and making it depend on
 * Google's Identity Services bundle loading would mean that on a slow
 * connection the one thing a convinced reader wants to do is the one thing that
 * does not work yet. A link works the moment the HTML arrives.
 *
 * The channel and the contact number sit here rather than in a section of their
 * own further down. Someone who has read enough to act is deciding between
 * three things at that moment — register, follow, or ask a question first — and
 * a reader who is not ready to hand over a Google account should not have to
 * scroll past the thing they are unsure about to find the way to ask about it.
 */
import {
  company,
  formattedContactNumber,
  page as copy,
  whatsappContactUrl,
} from "@/lib/agents/content";

export function SignInButton({ repeated = false }: { repeated?: boolean }) {
  return (
    <section aria-labelledby={repeated ? "signin-repeat" : "signin"}>
      <h2 id={repeated ? "signin-repeat" : "signin"} className="visually-hidden-not">Register
      </h2>
      <a className="button" href="/auth/google/start?returnTo=/agents/signup">
        <span>{copy.signIn.label}
        </span>
      </a>

      <div className="link-row">
        <a
          className="verify-link"
          href={company.whatsappChannel}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Join the WhatsApp channel</span>
        </a>
        <a
          className="verify-link"
          href={whatsappContactUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            {copy.contact.label} · {formattedContactNumber()}
          </span>
        </a>
      </div>
    </section>
  );
}
