import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DailyDo — Smart Task Management | Calecutech",
  description:
    "DailyDo is a task management web app for individuals and teams. Create offices, manage projects, assign tasks, and track progress — all in real time.",
};

const features = [
  {
    title: "Task Management",
    desc: "Create, assign, and track tasks by date with time scheduling. Never lose track of what needs to be done.",
    color: "bg-blue-100 dark:bg-blue-900/30",
    emoji: "✅",
  },
  {
    title: "Office & Team Collaboration",
    desc: "Create offices, invite members, and assign roles — Admin, Manager, or Member — to keep your team organised.",
    color: "bg-purple-100 dark:bg-purple-900/30",
    emoji: "🏢",
  },
  {
    title: "Projects",
    desc: "Organise tasks under projects and control visibility so each team member sees only what's relevant to them.",
    color: "bg-teal-100 dark:bg-teal-900/30",
    emoji: "📁",
  },
  {
    title: "My Tasks View",
    desc: "A personal task dashboard with Past, Today, Future, and Unlisted views so you always know what's next.",
    color: "bg-green-100 dark:bg-green-900/30",
    emoji: "📋",
  },
  {
    title: "Carry Forward",
    desc: "Missed tasks automatically carry forward with history tracking — clearly marked as \"Missed ×N\" so nothing slips through.",
    color: "bg-orange-100 dark:bg-orange-900/30",
    emoji: "🔁",
  },
  {
    title: "Cross-Office Transfer",
    desc: "Move or share tasks and projects between offices to keep work flowing across your organisation.",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    emoji: "🔀",
  },
  {
    title: "Recurring Tasks",
    desc: "Set up daily, weekly, or monthly recurring tasks and let DailyDo handle the scheduling automatically.",
    color: "bg-red-100 dark:bg-red-900/30",
    emoji: "📅",
  },
  {
    title: "Voice Input",
    desc: "Add tasks hands-free using voice input powered by the Web Speech API — faster than typing.",
    color: "bg-pink-100 dark:bg-pink-900/30",
    emoji: "🎙️",
  },
  {
    title: "Flexible Billing",
    desc: "Free, Family, and Office plans. Pay via Stripe or Razorpay — whichever works best for you.",
    color: "bg-indigo-100 dark:bg-indigo-900/30",
    emoji: "💳",
  },
  {
    title: "Real-time Updates",
    desc: "Built on Firebase and Firestore for live, instant updates across your whole team — no refreshing needed.",
    color: "bg-cyan-100 dark:bg-cyan-900/30",
    emoji: "⚡",
  },
];

const screenshots = [
  { label: "Dashboard View", color: "from-blue-500 to-indigo-600" },
  { label: "My Tasks", color: "from-purple-500 to-pink-600" },
  { label: "Office Management", color: "from-teal-500 to-green-600" },
  { label: "Project Board", color: "from-orange-500 to-red-600" },
];

export default function DailyDoPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-1.5 text-sm text-black/60 dark:border-white/15 dark:text-white/60">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Live at dailydo.calecutech.com
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          DailyDo
        </h1>
        <p className="mt-3 text-xl font-medium text-black/70 dark:text-white/70">
          Smart Task Management
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base text-black/60 dark:text-white/60">
          DailyDo helps individuals and teams stay on top of their work with
          structured task management, real-time collaboration, and smart
          scheduling — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="https://dailydo.calecutech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            Open DailyDo
          </a>
          <Link
            href="/contact"
            className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            Get in touch
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Features</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Everything your team needs to manage work effectively.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-black/10 p-6 dark:border-white/15"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${f.color}`}
              >
                {f.emoji}
              </div>
              <h3 className="mt-4 text-base font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Screenshots</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">
          A look inside the app — product is actively updated.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {screenshots.map((s) => (
            <div
              key={s.label}
              className={`flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color}`}
            >
              <span className="text-lg font-semibold text-white/90">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-black/40 dark:text-white/40">
          Screenshots coming soon — the app is live and actively updated.
        </p>
      </section>

      {/* Pricing callout */}
      <section className="mt-20">
        <div className="rounded-2xl border border-black/10 p-8 dark:border-white/15">
          <h2 className="text-2xl font-semibold">Plans</h2>
          <p className="mt-2 text-black/60 dark:text-white/60">
            Start for free. Upgrade when your team grows.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                name: "Free",
                desc: "Personal use, single office, core features.",
                highlight: false,
              },
              {
                name: "Family",
                desc: "Small households or groups, shared tasks and projects.",
                highlight: true,
              },
              {
                name: "Office",
                desc: "Full team collaboration with unlimited members and projects.",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-5 ${
                  plan.highlight
                    ? "border-foreground bg-foreground text-background"
                    : "border-black/10 dark:border-white/15"
                }`}
              >
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p
                  className={`mt-2 text-sm ${
                    plan.highlight
                      ? "text-background/70"
                      : "text-black/60 dark:text-white/60"
                  }`}
                >
                  {plan.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-2xl font-semibold">Ready to get organised?</h2>
        <p className="mt-3 text-black/60 dark:text-white/60">
          Start using DailyDo for free today — no credit card required.
        </p>
        <a
          href="https://dailydo.calecutech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          Try it free
        </a>
      </section>
    </div>
  );
}
