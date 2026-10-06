import { PageShell, Clause } from "@/components/quizkerala/PageShell";
import { CONTACT, QUIZKERALA } from "@/lib/quizkerala/content";

export const metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <PageShell
      path="/quizkerala/terms"
      title="Terms of Use"
      updated={QUIZKERALA.policyUpdated}
      intro={`These terms are an agreement between you and ${CONTACT.company} for using ${QUIZKERALA.name}. By signing in you accept them.`}
    >
      <div className="prose">
        <Clause n={1} heading="Your account">
          <p>
            You sign in with your own Google account and must be at least{" "}
            {QUIZKERALA.minimumAge}. If you are under 18 you confirm a parent
            or guardian agrees. One person, one account: do not share it or
            create extra accounts to play a quiz again.
          </p>
        </Clause>

        <Clause n={2} heading="Fair play">
          <ul>
            <li>Each account gets one attempt per quiz. The server&apos;s clock and scoring are final.</li>
            <li>Do not use bots, scripts, multiple accounts, or anyone else&apos;s help where the organiser forbids it.</li>
            <li>Do not try to read answers from the network, change the timer, or interfere with the service.</li>
            <li>We log unusual patterns. We may disqualify an attempt or suspend an account that breaks these rules, and remove it from the leaderboard.</li>
          </ul>
        </Clause>

        <Clause n={3} heading="Your display name">
          <p>
            Your Google name is shown on leaderboards. It must not be
            offensive, impersonate someone, or advertise. We may hide or
            change a display name that does.
          </p>
        </Clause>

        <Clause n={4} heading="Organisers">
          <p>
            Organisers are responsible for the questions they write, the
            accuracy of the answer key, and any prizes they promise. Questions
            must not copy material you have no right to use, or contain
            anything hateful, sexual, or unlawful. We are not a party to any
            prize or reward an organiser offers and do not guarantee it.
          </p>
        </Clause>

        <Clause n={5} heading="Results">
          <p>
            Ranking is by score, then shorter time, then earlier submission.
            A leaderboard marked Final is not recomputed except to remove an
            attempt disqualified for cheating or to correct an error in the
            answer key, which the organiser may ask us to do.
          </p>
        </Clause>

        <Clause n={6} heading="Our content">
          <p>
            The {QUIZKERALA.name} name, logo, app and website belong to{" "}
            {CONTACT.company}. Questions belong to whoever wrote them. You may
            not copy or resell question banks from the service.
          </p>
        </Clause>

        <Clause n={7} heading="Availability">
          <p>
            We provide {QUIZKERALA.name} as it is and as available. We work to
            keep it running during quizzes but cannot promise it will never be
            interrupted. If an outage affects a quiz, the organiser may extend
            or rerun it.
          </p>
        </Clause>

        <Clause n={8} heading="Liability">
          <p>
            To the extent the law allows, we are not liable for indirect or
            consequential loss, or for a lost prize, arising from your use of{" "}
            {QUIZKERALA.name}. Nothing here limits liability that cannot be
            limited by law.
          </p>
        </Clause>

        <Clause n={9} heading="Ending your use">
          <p>
            You can stop at any time and delete your account from the app or
            via our <a href="/quizkerala/delete-account">Delete Account</a>{" "}
            page. We may suspend accounts that break these terms.
          </p>
        </Clause>

        <Clause n={10} heading="Law and contact">
          <p>
            These terms are governed by the laws of India, and the courts at
            Kozhikode, Kerala have jurisdiction. Questions:{" "}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </p>
        </Clause>
      </div>
    </PageShell>
  );
}
