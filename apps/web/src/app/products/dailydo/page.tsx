import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DailyDo — Team Task & Compliance Platform | Calecutech",
  description:
    "DailyDo is a workplace productivity platform for individuals, teams, and organisations — combining task management, brainstorming, AI meeting minutes, and compliance inspections in one place.",
};

const capabilities = [
  {
    emoji: "✅",
    color: "bg-blue-100 dark:bg-blue-900/30",
    title: "Daily Task Management",
    desc: "Your personal task inbox, every day.",
    items: [
      "Add tasks with due dates, times, and alarms",
      "Assign tasks to team members instantly",
      "Break tasks into subtasks and steps",
      "Carry unfinished tasks forward automatically",
      "Voice dictation — speak your tasks hands-free",
      "Recurring tasks for daily / weekly / monthly work",
    ],
  },
  {
    emoji: "🏢",
    color: "bg-amber-100 dark:bg-amber-900/30",
    title: "Offices & Team Collaboration",
    desc: "Bring your whole team under one roof.",
    items: [
      "Create organisations and sub-offices",
      "Invite members by email with role-based access",
      "Owner → Admin → Manager → Member hierarchy",
      "Broadcast tasks to all members at once",
      "Real-time member management and reporting",
    ],
  },
  {
    emoji: "📁",
    color: "bg-purple-100 dark:bg-purple-900/30",
    title: "Projects",
    desc: "Organise work around goals, not just dates.",
    items: [
      "Create projects scoped to one or many offices",
      "Restrict project visibility to specific members",
      "Group and filter tasks by project",
      "Transfer and merge projects across offices",
      "Track open vs. closed projects with target dates",
    ],
  },
  {
    emoji: "💡",
    color: "bg-violet-100 dark:bg-violet-900/30",
    title: "Brainstorm Sessions",
    desc: "Structured idea collection with your team.",
    items: [
      "Anonymous or named idea submissions",
      "Voting rounds to surface the best ideas",
      "AI-powered suggestion engine (6 tailored ideas per session)",
      "Convert winning ideas directly into tasks",
      "Link sessions to one or multiple projects",
    ],
  },
  {
    emoji: "🎙️",
    color: "bg-teal-100 dark:bg-teal-900/30",
    title: "Meetings & AI Minutes",
    desc: "Never lose a decision or action item again.",
    items: [
      "Record live meeting transcripts with speaker labels",
      "Generate AI minutes of meeting in one click",
      "Structured output: agenda, decisions, action items",
      "Convert action items to tasks with one tap",
      "Link meetings to your office and projects",
    ],
  },
  {
    emoji: "🛡️",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Inspection & Compliance",
    desc: "Audit-ready inspections with AI reporting.",
    items: [
      "Safety, process, office, equipment, environmental & quality templates",
      "Pre-built checklists — Pass / Fail / N/A / Observation",
      "Auto-generate findings with severity levels",
      "Assign responsible person and due date per finding",
      "AI compliance score, executive summary & recommendations",
      "Printable report with full findings table",
    ],
  },
  {
    emoji: "📊",
    color: "bg-rose-100 dark:bg-rose-900/30",
    title: "Reports & Analytics",
    desc: "See what got done — and what didn't.",
    items: [
      "Daily completion reports per person or team",
      "Filter by date range, project, or member",
      "Recurring task adherence tracking",
      "Carried-forward task history",
    ],
  },
  {
    emoji: "🔔",
    color: "bg-indigo-100 dark:bg-indigo-900/30",
    title: "Browser Notifications",
    desc: "Stay informed without refreshing.",
    items: [
      "Push alerts when a new invitation arrives",
      "Notify when a task is assigned to you today",
      "Works in browser — no app install needed",
      "Enable with one click in the sidebar",
    ],
  },
];

const howItWorks = [
  { step: "1", title: "Create your office", desc: "Set up an organisation or office in seconds. Add sub-offices for departments or locations." },
  { step: "2", title: "Invite your team", desc: "Send email invitations. Members join with their Google account and get instant access." },
  { step: "3", title: "Assign & track tasks", desc: "Create tasks for today, assign to members, set deadlines. Incomplete tasks carry forward." },
  { step: "4", title: "Collaborate & report", desc: "Brainstorm ideas, record meetings, run inspections, and see daily completion reports." },
];

const comingSoon = [
  "Kanban Board", "RACI Matrix", "Work Breakdown Structure",
  "Delphi Consensus Sessions", "Advanced Tasks with Cost & Resource Tracking",
  "Threaded Discussions", "Suggestion Voting", "Employee Submissions",
];

const plans = [
  {
    name: "Personal",
    price: "Free",
    subtext: "Forever",
    desc: "For individuals tracking their own work.",
    features: ["Unlimited personal tasks", "Voice dictation", "Auto carry-forward", "Recurring tasks", "Daily reports", "Free starter credits"],
    highlight: false,
  },
  {
    name: "Family / Team",
    price: "₹499 / mo",
    subtext: "$4.99 / mo",
    desc: "For small teams and families.",
    features: ["Everything in Personal", "1 office", "Up to 10 members", "Brainstorm & voting", "AI meeting minutes", "Project management"],
    highlight: true,
  },
  {
    name: "Office",
    price: "₹799 / user / mo",
    subtext: "$9.99 / user / mo",
    desc: "For businesses that need more.",
    features: ["Everything in Team", "Unlimited offices", "Inspections module", "Broadcast tasks", "Advanced roles", "Priority support"],
    highlight: false,
  },
];

export default function DailyDoPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">

      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-1.5 text-sm text-black/60 dark:border-white/15 dark:text-white/60">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Live at dailydo.calecutech.com
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">DailyDo</h1>
        <p className="mt-3 text-xl font-medium text-black/70 dark:text-white/70">
          The operating system for your team&apos;s day
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base text-black/60 dark:text-white/60">
          DailyDo combines task management, team collaboration, brainstorming, AI meeting minutes, and compliance inspections — in one place. Built for real work.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="https://dailydo.calecutech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Open DailyDo →
          </a>
          <Link
            href="/contact"
            className="rounded-full border border-black/10 px-6 py-3 text-sm font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>

      {/* What is DailyDo */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">What is DailyDo?</h2>
        <p className="mt-3 text-black/60 dark:text-white/60 leading-relaxed max-w-3xl">
          DailyDo is a workplace productivity platform that starts with the simplest thing — your daily task list — and scales up to team offices, projects, compliance inspections, AI meeting minutes, and brainstorm sessions. It&apos;s one tab that replaces five tools.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "👤", title: "Personal", desc: "Your daily to-do list with carry-forward, voice input, and recurring tasks." },
            { emoji: "👥", title: "Teams", desc: "Invite members, assign roles, broadcast tasks, run meetings and brainstorms." },
            { emoji: "🛡️", title: "Compliance", desc: "Safety, process, and office inspections with AI-generated reports and findings." },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="rounded-xl border border-black/10 p-5 dark:border-white/15">
              <div className="text-2xl mb-3">{emoji}</div>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Full capabilities</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">Everything that&apos;s live and ready to use today.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div key={cap.title} className="rounded-xl border border-black/10 p-6 dark:border-white/15">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${cap.color}`}>
                {cap.emoji}
              </div>
              <h3 className="mt-4 text-base font-semibold">{cap.title}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{cap.desc}</p>
              <ul className="mt-3 space-y-1.5">
                {cap.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-black/60 dark:text-white/60">
                    <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* AI features */}
      <section className="mt-20">
        <div className="rounded-2xl bg-black p-8 text-white dark:bg-white dark:text-black">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold dark:bg-black/10">
            ✨ AI-powered features
          </div>
          <h2 className="mt-4 text-2xl font-semibold">Built-in AI — no extra setup</h2>
          <p className="mt-2 text-white/70 dark:text-black/60 text-sm leading-relaxed max-w-xl">
            DailyDo uses Claude AI behind the scenes so your team gets smart assistance without any integration work.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: "🎙️", title: "Meeting Minutes", desc: "Record a transcript → get a structured summary with decisions and action items." },
              { emoji: "💡", title: "Brainstorm Ideas", desc: "Stuck? Get 6 AI-suggested ideas tailored to your session topic and existing submissions." },
              { emoji: "🛡️", title: "Inspection Reports", desc: "Complete a checklist → get a compliance score, executive summary, and recommendations." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-xl bg-white/10 p-4 dark:bg-black/10">
                <div className="text-xl mb-2">{emoji}</div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-white/70 dark:text-black/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-white/50 dark:text-black/40">AI features use a credit system. Each account starts with free credits. Credits never expire.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">Up and running in under 5 minutes.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map(({ step, title, desc }) => (
            <div key={step}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">
                {step}
              </div>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coming soon */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Coming soon</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">We&apos;re building fast. These modules are next.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {comingSoon.map((f) => (
            <span key={f} className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-20">
        <h2 className="text-2xl font-semibold">Plans</h2>
        <p className="mt-2 text-black/60 dark:text-white/60">Start for free. Upgrade when your team grows.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {plans.map(({ name, price, subtext, desc, features, highlight }) => (
            <div
              key={name}
              className={`rounded-2xl border p-6 flex flex-col ${
                highlight
                  ? "border-foreground bg-foreground text-background"
                  : "border-black/10 dark:border-white/15"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-background/60" : "text-black/40 dark:text-white/40"}`}>
                {name}
              </p>
              <p className={`mt-1 text-2xl font-bold ${highlight ? "text-background" : ""}`}>{price}</p>
              <p className={`text-xs ${highlight ? "text-background/60" : "text-black/40 dark:text-white/40"}`}>{subtext}</p>
              <p className={`mt-3 text-sm flex-1 ${highlight ? "text-background/70" : "text-black/60 dark:text-white/60"}`}>{desc}</p>
              <ul className="mt-4 space-y-2 mb-6">
                {features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${highlight ? "text-background/80" : "text-black/60 dark:text-white/60"}`}>
                    <span className={`shrink-0 mt-0.5 ${highlight ? "text-background/60" : "text-green-500"}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://dailydo.calecutech.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-center text-sm font-semibold py-2.5 rounded-xl transition-opacity hover:opacity-80 ${
                  highlight
                    ? "bg-background text-foreground"
                    : "bg-foreground text-background"
                }`}
              >
                Get started free
              </a>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-black/40 dark:text-white/40">
          AI features use credits · ₹50 = 100 credits / $1 = 100 credits · Credits never expire
        </p>
      </section>

      {/* CTA */}
      <section className="mt-20 text-center">
        <h2 className="text-2xl font-semibold">Ready to get organised?</h2>
        <p className="mt-3 text-black/60 dark:text-white/60">
          Join teams already using DailyDo to plan, collaborate, and deliver — for free.
        </p>
        <a
          href="https://dailydo.calecutech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          Start free today →
        </a>
        <p className="mt-3 text-xs text-black/40 dark:text-white/40">No credit card · Google sign-in · Free forever plan</p>
      </section>

    </div>
  );
}
