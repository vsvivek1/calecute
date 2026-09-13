/**
 * The Google sign-in control.
 *
 * A plain link, not a button that calls a script. That is deliberate: this is
 * the single most important action on the page, and making it depend on
 * Google's Identity Services bundle loading would mean that on a slow
 * connection the one thing a convinced reader wants to do is the one thing that
 * does not work yet. A link works the moment the HTML arrives.
 *
 * Labelled in both languages, per the brief.
 */
import { page as copy } from "@/lib/agents/content";

export function SignInButton({ repeated = false }: { repeated?: boolean }) {
  return (
    <section aria-labelledby={repeated ? "signin-repeat" : "signin"}>
      <h2 id={repeated ? "signin-repeat" : "signin"} className="visually-hidden-not">Register
      </h2>
      <a className="button" href="/auth/google/start?returnTo=/agents/signup">
        <span>{copy.signIn.label}
        </span>
      </a>
      <p className="button-note">{copy.signIn.note}
      </p>
    </section>
  );
}
