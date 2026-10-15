import Link from "next/link";
import type { Metadata } from "next";
import { ClockMascot } from "@/components/history-clock/Doodles";
import s from "@/components/history-clock/sketch.module.css";
import { SITE_ORIGIN, contactEmail, historyClock } from "@/lib/history-clock/content";
import { formatUsd, paymentsEnabled, priceCents } from "@/lib/history-clock/stripe";

export const metadata: Metadata = {
  title: "Support History Clock | Calecutech",
  description: "Back History Clock with a one-time payment in US dollars. The map and quiz stay free.",
  alternates: { canonical: `${SITE_ORIGIN}/history-clock/support` },
};

// Reads the Stripe env at request time, so the button appears as soon as
// keys are added in Vercel without a code change.
export const dynamic = "force-dynamic";

export default function HistoryClockSupportPage() {
  const open = paymentsEnabled();

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className={`${s.card} mx-auto max-w-xl p-6 text-center sm:p-10`}>
        <ClockMascot className="mx-auto h-32 w-auto" />
        <h1 className={`${s.hand} mt-4 text-5xl leading-tight`}>Support {historyClock.name}</h1>
        <p className="mt-4 text-lg leading-8 text-[#4a4f5e]">
          A one-time payment pays for new regions and hand-checked entries. Everything stays free for everyone.
        </p>
        <p className={`${s.hand} mt-6 text-6xl`}>{formatUsd(priceCents())}</p>
        <p className="text-sm text-[#4a4f5e]">One time, in US dollars. For customers in the USA.</p>

        {open ? (
          <form action="/history-clock/checkout" method="post" className="mt-8">
            <button type="submit" className={`${s.btn} ${s.btnPrimary} text-lg`}>
              Pay with card →
            </button>
          </form>
        ) : (
          <p className={`${s.chip} mt-8 inline-block bg-[#f3e6c8]`}>Payments open soon</p>
        )}

        <p className="mt-8 text-sm text-[#4a4f5e]">
          Payments are handled by Stripe. We never see your card number. Questions or refunds:{" "}
          <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
        <p className="mt-4 text-sm">
          <Link href="/history-clock" className="underline underline-offset-2">
            Back to {historyClock.name}
          </Link>
        </p>
      </div>
    </section>
  );
}
