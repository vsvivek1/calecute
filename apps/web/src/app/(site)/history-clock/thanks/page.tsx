import Link from "next/link";
import type { Metadata } from "next";
import { ClockMascot } from "@/components/history-clock/Doodles";
import s from "@/components/history-clock/sketch.module.css";
import { contactEmail, historyClock } from "@/lib/history-clock/content";
import { paidSession, paymentsEnabled, stripe } from "@/lib/history-clock/stripe";

export const metadata: Metadata = {
  title: "Thank you | History Clock",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

// Stripe sends the buyer back here with ?session_id=cs_…. We ask Stripe
// whether that session was paid rather than trusting the redirect alone.
async function lookUp(sessionId: string | undefined) {
  if (!paymentsEnabled() || !sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
  const session = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  return session && paidSession(session);
}

export default async function HistoryClockThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { session_id } = await searchParams;
  const paid = await lookUp(typeof session_id === "string" ? session_id : undefined);

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className={`${s.card} mx-auto max-w-xl p-6 text-center sm:p-10`}>
        <ClockMascot className="mx-auto h-32 w-auto" />
        {paid ? (
          <>
            <h1 className={`${s.hand} mt-4 text-5xl leading-tight`}>Thank you!</h1>
            <p className="mt-4 text-lg leading-8 text-[#4a4f5e]">
              Your payment went through. Stripe has emailed a receipt{paid.email ? ` to ${paid.email}` : ""}.
            </p>
          </>
        ) : (
          <>
            <h1 className={`${s.hand} mt-4 text-5xl leading-tight`}>We could not confirm a payment</h1>
            <p className="mt-4 text-lg leading-8 text-[#4a4f5e]">
              If you were charged, write to{" "}
              <a className="underline underline-offset-2" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>{" "}
              and we will sort it out.
            </p>
          </>
        )}
        <p className="mt-8">
          <Link href={historyClock.appPath} className={`${s.btn} ${s.btnPrimary} text-lg`}>
            Back to the map →
          </Link>
        </p>
      </div>
    </section>
  );
}
