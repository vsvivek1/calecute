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
import { En, Ml } from "./Bilingual";

export function SignInButton({ repeated = false }: { repeated?: boolean }) {
  return (
    <section aria-labelledby={repeated ? "signin-repeat" : "signin"}>
      <h2 id={repeated ? "signin-repeat" : "signin"} className="visually-hidden-not">
        <Ml>രജിസ്റ്റർ ചെയ്യുക</Ml>
        <En>Register</En>
      </h2>
      <a className="button" href="/auth/google/start?returnTo=/agents/signup">
        <span>
          <Ml>{copy.signIn.label.ml}</Ml>
          <En>{copy.signIn.label.en}</En>
        </span>
      </a>
      <p className="button-note">
        <Ml>{copy.signIn.note.ml}</Ml>
        <En>{copy.signIn.note.en}</En>
      </p>
    </section>
  );
}
