import { Masthead } from "@/components/goldlelam/Masthead";
import { Footer } from "@/components/goldlelam/Footer";
import { Placeholder } from "@/components/agents/Bilingual";
import { GOLDLELAM, CONTACT, FAQS } from "@/lib/goldlelam/content";

export const metadata = { title: "Support" };

export default function GoldLelamSupport() {
  return (
    <>
      <Masthead />

      <section className="block">
        <div className="wrap">
          <div className="section-heading">
            <h2>Support</h2>
            <p>Answers to what people ask us most about {GOLDLELAM.name}.</p>
          </div>

          <div>
            {FAQS.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>

          <div className="cta-panel" style={{ marginTop: "3rem" }}>
            <h2>Still stuck?</h2>
            <p>
              Write to us and we&apos;ll get back to you, or message us on
              WhatsApp.
            </p>
            <div className="hero-actions" style={{ marginTop: 0 }}>
              <a className="btn btn-primary" href={`mailto:${CONTACT.email}`}>
                Email {CONTACT.email}
              </a>
              <span className="btn btn-secondary" style={{ background: "transparent", borderColor: "rgba(255,255,255,0.5)", color: "#fff" }}>
                WhatsApp: <Placeholder value={CONTACT.whatsapp} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
