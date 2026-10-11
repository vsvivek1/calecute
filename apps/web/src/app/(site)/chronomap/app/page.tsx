import Link from "next/link";
import type { Metadata } from "next";
import TimelinePreview from "@/components/chronomap/TimelinePreview";
import { contactEmail, chronomap } from "@/lib/chronomap/content";

export const metadata: Metadata = {
  title: "Chronomap Preview | Calecutech",
  description: "A preview of the Chronomap interface. The full app is not live yet.",
  // A demonstration state, not a page to index or link from search results.
  robots: { index: false, follow: true },
};

export default function ChronomapAppPreviewPage() {
  return (
    <div className="bg-[#101c33] text-[#f5efe2]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <p
          role="status"
          className="inline-block rounded-full border border-[#c9a86a] px-4 py-1.5 text-sm font-medium text-[#c9a86a]"
        >
          Preview · The full app is not live yet
        </p>
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Chronomap preview
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#dfe4ee]">
          This page shows how Chronomap is designed to work. It has no map data, no search, and no
          sign-in, and it does not save anything you do here.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <TimelinePreview large />
            <p className="mt-4 text-sm text-[#c9cfdb]">
              Illustrative demonstration state. The events shown are sample entries, not live data.
            </p>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#c9a86a]/30 p-6">
              <h2 className="text-lg font-semibold">What is missing</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-[#dfe4ee]">
                <li>An interactive world map to choose regions</li>
                <li>The full historical dataset, with sources for each entry</li>
                <li>Saved places and guided journeys</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#c9a86a]/30 p-6">
              <h2 className="text-lg font-semibold">Want to hear when it opens?</h2>
              <p className="mt-3 leading-7 text-[#dfe4ee]">
                Email us at{" "}
                <a className="underline underline-offset-2" href={`mailto:${contactEmail}?subject=Chronomap%20updates`}>
                  {contactEmail}
                </a>{" "}
                with the subject &ldquo;Chronomap updates&rdquo;. We will reply to that message only.
              </p>
            </div>
            <Link
              href="/chronomap"
              className="inline-block text-[#c9a86a] underline underline-offset-4 hover:text-[#d9b97f]"
            >
              Back to {chronomap.name} overview
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
