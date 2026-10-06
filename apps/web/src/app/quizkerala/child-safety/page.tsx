import { PageShell, Clause } from "@/components/quizkerala/PageShell";
import { CONTACT, QUIZKERALA } from "@/lib/quizkerala/content";

export const metadata = { title: "Child Safety Standards" };

/** Published for Google Play's child sexual abuse and exploitation (CSAE) standards declaration. */
export default function ChildSafety() {
  return (
    <PageShell
      path="/quizkerala/child-safety"
      title="Child Safety Standards"
      updated={QUIZKERALA.policyUpdated}
      intro={`${CONTACT.company} has zero tolerance for child sexual abuse and exploitation (CSAE) in ${QUIZKERALA.name}.`}
    >
      <div className="prose">
        <Clause n={1} heading="Our standard">
          <p>
            Content or behaviour that sexualises, grooms, exploits or endangers
            a child is prohibited. This applies to display names, profile
            pictures, quiz questions and anything else on the service.
          </p>
        </Clause>
        <Clause n={2} heading="How the app limits risk">
          <ul>
            <li>There is no chat, messaging or friend feature. Players cannot contact each other through {QUIZKERALA.name}.</li>
            <li>Other players see only a display name, profile picture, score, time and rank.</li>
            <li>Only approved organisers can publish questions, and we can remove any quiz.</li>
            <li>Accounts require a Google sign-in and a minimum age of {QUIZKERALA.minimumAge}.</li>
          </ul>
        </Clause>
        <Clause n={3} heading="Reporting">
          <p>
            Report any concern to{" "}
            <a href={`mailto:${CONTACT.email}?subject=Child safety report`}>
              {CONTACT.email}
            </a>{" "}
            with the subject &ldquo;Child safety report&rdquo;. Include the quiz
            code and the display name involved if you can. We review reports
            within 24 hours.
          </p>
        </Clause>
        <Clause n={4} heading="What we do">
          <p>
            We remove the content, suspend the account, preserve evidence, and
            report confirmed child sexual abuse material to the National Center
            for Missing &amp; Exploited Children (NCMEC) and to Indian law
            enforcement through the National Cyber Crime Reporting Portal
            (cybercrime.gov.in), as the law requires.
          </p>
        </Clause>
        <Clause n={5} heading="Contact for child safety">
          <p>
            {CONTACT.grievanceOfficer}, {CONTACT.company},{" "}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </p>
        </Clause>
      </div>
    </PageShell>
  );
}
