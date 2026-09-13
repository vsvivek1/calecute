/**
 * /agents/og-preview — the source artwork for the Open Graph image.
 *
 * Why this exists instead of next/og
 * ----------------------------------
 * next/og renders through Satori, which lays out text without a shaping engine.
 * Malayalam needs GSUB substitution — conjuncts, reordered vowel signs, chillu
 * forms — and without it every conjunct renders with a visible chandrakkala
 * where a ligature belongs. It looks, to a Malayali reader, like broken text.
 * On the single asset that does most of the recruiting, that is not acceptable.
 *
 * So the artwork is a real page, shaped by the browser, captured once at
 * 1200x630 and committed as public/og/agents.png. The image is static — no
 * per-request data — so generating it at request time bought nothing anyway.
 *
 * To regenerate: see scripts/capture-og.md.
 */
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OgPreview() {
  return (
    <div
      id="og-card"
      style={{
        width: 1200,
        height: 630,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#06080c",
        padding: "72px 80px",
        overflow: "hidden",
      }}
    >
      <div>
        <div
          lang="en"
          style={{
            fontFamily: "var(--font-latin)",
            fontSize: 24,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#34d399",
          }}
        >
          Calecute Technologies
        </div>

        {/* Two lines, deliberately. A third would be unreadable at the ~200px
            width a WhatsApp chat list renders this at. */}
        <div
          lang="ml"
          style={{
            marginTop: 40,
            fontSize: 84,
            lineHeight: 1.24,
            color: "#f2f5f9",
            letterSpacing: "-0.02em",
          }}
        >
          കമ്മീഷൻ ഏജന്റുമാരെ
          <br />
          ആവശ്യമുണ്ട്
        </div>

        <div lang="ml" style={{ marginTop: 30, fontSize: 34, color: "#9aa6b8" }}>
          ഓരോ പഞ്ചായത്തിലും 10 ഏജന്റുമാർ
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>
        {/* The three facts that answer a sceptical reader's first objection. */}
        <div style={{ display: "flex", gap: 14 }}>
          {["ഫീസില്ല", "നിക്ഷേപമില്ല", "കമ്മീഷൻ 10%"].map((chip) => (
            <div
              key={chip}
              lang="ml"
              style={{
                fontSize: 28,
                color: "#f2f5f9",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                padding: "10px 22px",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
        <div
          lang="en"
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-latin)",
            fontSize: 24,
            color: "#7d8798",
          }}
        >
          calecutech.com/agents
        </div>
      </div>
    </div>
  );
}
