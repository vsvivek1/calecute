import Link from "next/link";
import { PageShell } from "@/components/quizkerala/PageShell";
import { FAQ } from "@/lib/quizkerala/content";

export const metadata = { title: "Frequently asked questions" };

export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PageShell
      path="/quizkerala/faq"
      title="Frequently asked questions"
      intro="Quick answers about playing, scoring and your account."
    >
      <div className="prose">
        {FAQ.map((f) => (
          <details className="faq-item" key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <p style={{ marginTop: "2rem" }}>
          Still stuck? <Link href="/quizkerala/contact">Contact support</Link>.
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </PageShell>
  );
}
