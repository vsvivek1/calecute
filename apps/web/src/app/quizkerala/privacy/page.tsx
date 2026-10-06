import { PageShell, Clause } from "@/components/quizkerala/PageShell";
import {
  CONTACT,
  DATA_COLLECTED,
  QK_PROCESSORS,
  QUIZKERALA,
} from "@/lib/quizkerala/content";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <PageShell
      path="/quizkerala/privacy"
      title="Privacy Policy"
      updated={QUIZKERALA.policyUpdated}
      intro={`What ${QUIZKERALA.name} collects, why, who sees it, and how to delete it. This policy covers the ${QUIZKERALA.name} Android app (${QUIZKERALA.androidPackage}) and the website at ${QUIZKERALA.appUrl.replace("https://", "")}.`}
    >
      <div className="prose">
        <Clause n={1} heading="Who we are">
          <p>
            {QUIZKERALA.name} is operated by {CONTACT.company}, {CONTACT.address}{" "}
            (&ldquo;we&rdquo;). We decide how your data is used and are
            responsible for it.
          </p>
        </Clause>

        <Clause n={2} heading="What we collect">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Type</th><th>Data</th><th>Why</th></tr>
              </thead>
              <tbody>
                {DATA_COLLECTED.map((d) => (
                  <tr key={d.category}>
                    <td>{d.category}</td>
                    <td>{d.items.join(", ")}</td>
                    <td>{d.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            We set one sign-in cookie to keep you signed in. We use no
            advertising or third-party analytics cookies.
          </p>
        </Clause>

        <Clause n={3} heading="What we do not collect">
          <ul>
            <li>Your Google password. Google signs you in and tells us only your name, email address and profile picture.</li>
            <li>Your contacts, location, camera, microphone, photos, call logs or SMS. The app does not ask for these permissions.</li>
            <li>Advertising identifiers. There is no advertising in {QUIZKERALA.name}.</li>
            <li>Payment details. Playing is free.</li>
          </ul>
        </Clause>

        <Clause n={4} heading="Who can see your data">
          <ul>
            <li>
              <strong>Other players</strong> of a quiz you join see your
              display name, profile picture, score, time and rank on that
              quiz&apos;s leaderboard. They never see your email address.
            </li>
            <li>
              <strong>The organiser</strong> of a quiz you join sees the same,
              plus your answers for that quiz, so they can check results.
            </li>
            <li>
              <strong>Service providers</strong> who run parts of the service
              for us, under contract and only on our instructions:
            </li>
          </ul>
          <ul>
            {QK_PROCESSORS.map((p) => (
              <li key={p.name}>
                <strong>{p.name}.</strong> {p.role}{" "}
                <a href={p.policy} target="_blank" rel="noopener noreferrer">
                  Their privacy policy
                </a>
                .
              </li>
            ))}
          </ul>
          <p>
            We do not sell or rent your data, and we share it with no one else
            unless the law requires us to.
          </p>
        </Clause>

        <Clause n={5} heading="How long we keep it">
          <p>
            Your account and quiz history are kept while your account exists.
            Server logs are deleted after 30 days. When you delete your
            account we delete your data within 30 days, as described on the{" "}
            <a href="/quizkerala/delete-account">Delete Account</a> page.
          </p>
        </Clause>

        <Clause n={6} heading="Security">
          <p>
            All traffic is encrypted with HTTPS. Correct answers are never sent
            to your device before a quiz closes. Data is stored with our
            hosting providers in encrypted databases, and only the team members
            who run the service can reach it.
          </p>
        </Clause>

        <Clause n={7} heading="Children">
          <p>
            You must be at least {QUIZKERALA.minimumAge} to create an account.
            If you are under 18, a parent or guardian should agree to your use
            of {QUIZKERALA.name}. {QUIZKERALA.name} is not designed for
            children under {QUIZKERALA.minimumAge}, and if we learn we hold
            data about one, we delete it. See our{" "}
            <a href="/quizkerala/child-safety">Child Safety Standards</a>.
          </p>
        </Clause>

        <Clause n={8} heading="Your rights">
          <p>
            Under India&apos;s Digital Personal Data Protection Act, 2023, and
            similar laws where you live, you can ask us to:
          </p>
          <ul>
            <li>tell you what personal data we hold about you;</li>
            <li>correct or complete it;</li>
            <li>delete it, by deleting your account;</li>
            <li>stop using it, by withdrawing consent, which means deleting your account;</li>
            <li>nominate someone to exercise these rights for you.</li>
          </ul>
          <p>
            We process your data because you asked us to provide the quiz
            service when you signed in, and you can withdraw that consent at
            any time. If you are unhappy with our answer you may complain to
            the Data Protection Board of India.
          </p>
        </Clause>

        <Clause n={9} heading="Grievance officer and contact">
          <p>
            {CONTACT.grievanceOfficer}, {CONTACT.company}, {CONTACT.address}.
            Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. We
            acknowledge complaints within 48 hours and resolve them within 30
            days.
          </p>
        </Clause>

        <Clause n={10} heading="Changes">
          <p>
            If we change this policy we will update the date at the top and,
            for significant changes, tell you in the app before they take
            effect.
          </p>
        </Clause>
      </div>
    </PageShell>
  );
}
