import { PageShell } from "@/components/quizkerala/PageShell";
import { CONTACT, QUIZKERALA, company } from "@/lib/quizkerala/content";

export const metadata = { title: "About" };

export default function About() {
  return (
    <PageShell
      path="/quizkerala/about"
      title="About QuizKerala"
      intro="A quiz platform made in Kozhikode, for Kerala's love of a good question."
    >
      <div className="prose">
        <p>
          Kerala has always quizzed: in school assemblies, library halls,
          college fests and on WhatsApp groups. {QUIZKERALA.name} takes the
          part that is hard to run by hand, a fair clock and an honest
          leaderboard, and makes it work on any phone.
        </p>

        <h2>What we believe</h2>
        <ul>
          <li>
            <strong>Fairness first.</strong> The server keeps time, every
            player gets one attempt, and answers stay hidden until a quiz
            closes.
          </li>
          <li>
            <strong>Speed counts.</strong> Knowing the answer is good. Knowing
            it quickly breaks the tie.
          </li>
          <li>
            <strong>Less data, not more.</strong> We ask Google only for your
            name, email and picture, show no ads and sell nothing about you.
          </li>
          <li>
            <strong>Phones are the main screen.</strong> Every page is
            designed for a small screen and a patchy connection first.
          </li>
        </ul>

        <h2>Who we are</h2>
        <p>
          {QUIZKERALA.name} is built and published by {company.legalName}, the
          team behind <a href={`https://${company.domain}`}>{company.domain}</a>,
          from {CONTACT.address}. We also build exam-prep, transport and
          banking apps for Kerala.
        </p>

        <h2>Get in touch</h2>
        <p>
          Ideas, partnerships, a quiz you would like to run, or a question we
          got wrong: write to{" "}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
        </p>
      </div>
    </PageShell>
  );
}
