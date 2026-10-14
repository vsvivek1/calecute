/**
 * Illustrative product screens for the home page, drawn in HTML and CSS so
 * they stay sharp, cost no image weight, and follow the page's fonts. The
 * figures in them are sample values, not live data.
 */

function Phone({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-[230px] shrink-0 rounded-[2.4rem] border border-white/15 bg-[#0d0d14] p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] ${className}`}
    >
      <div className="relative h-[460px] overflow-hidden rounded-[2rem]">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

export function AuctionScreen() {
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(170deg,#3b0f24,#1d0912)] px-4 pb-4 pt-10 text-[#f6e3d6]">
      <div className="flex items-center justify-between text-[10px] text-[#f6e3d6]/60">
        <span>Live auction</span>
        <span className="flex items-center gap-1 text-[#f2c46d]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="home-ping absolute inline-flex h-full w-full rounded-full bg-[#f2c46d]" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#f2c46d]" />
          </span>
          04:12 left
        </span>
      </div>
      <div className="mt-3 aspect-square rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#f2c46d_0%,#c98a3a_35%,#5a1838_75%)] p-3">
        <div className="flex h-full items-center justify-center">
          <div className="h-24 w-24 rounded-full border-[10px] border-[#f6dca0] shadow-[0_0_40px_rgba(242,196,109,0.7)]" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-[#f6e3d6]/60">Lot 14 · 22K chain · 18.4 g</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">₹1,42,500</p>
      <p className="text-[10px] text-[#f6e3d6]/50">Current highest bid</p>
      <div className="mt-auto rounded-xl bg-[#f2c46d] py-2.5 text-center text-xs font-semibold text-[#3b0f24]">
        Place bid
      </div>
    </div>
  );
}

export function TasksScreen() {
  const tasks = [
    { t: "Review client proposal", done: true, who: "AK" },
    { t: "Ship onboarding screens", done: true, who: "RS" },
    { t: "Daily report to Kochi office", done: false, who: "VS" },
    { t: "Fix billing webhook", done: false, who: "NM" },
    { t: "Plan sprint 14", done: false, who: "AK" },
  ];
  return (
    <div className="flex h-full flex-col bg-white px-4 pb-4 pt-10 text-zinc-900">
      <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600">Today</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight">Team tasks</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full w-2/5 rounded-full bg-blue-600" />
      </div>
      <ul className="mt-4 space-y-2">
        {tasks.map((x) => (
          <li
            key={x.t}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 px-2.5 py-2 text-[11px]"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] ${
                x.done ? "bg-blue-600 text-white" : "border border-zinc-300"
              }`}
            >
              {x.done ? "✓" : ""}
            </span>
            <span className={`flex-1 ${x.done ? "text-zinc-400 line-through" : ""}`}>{x.t}</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[8px] font-semibold">
              {x.who}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 text-[11px] text-white">
        <span className="h-2 w-2 rounded-full bg-red-500" /> Dictate a task…
      </div>
    </div>
  );
}

export function LeaderboardScreen() {
  const rows = [
    { n: "Anjali", s: 980, t: "41s" },
    { n: "Rahul", s: 980, t: "44s" },
    { n: "Fathima", s: 940, t: "39s" },
    { n: "Arjun", s: 910, t: "52s" },
    { n: "Meera", s: 870, t: "47s" },
  ];
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(170deg,#065f46,#022c22)] px-4 pb-4 pt-10 text-white">
      <p className="text-[10px] uppercase tracking-wider text-emerald-300">Quiz · Code K7Q2</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight">Leaderboard</p>
      <ol className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.n}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[11px] ${
              i === 0 ? "bg-emerald-400 text-emerald-950" : "bg-white/10"
            }`}
          >
            <span className="w-3 font-semibold">{i + 1}</span>
            <span className="flex-1 font-medium">{r.n}</span>
            <span className="tabular-nums opacity-70">{r.t}</span>
            <span className="w-8 text-right font-semibold tabular-nums">{r.s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-auto text-center text-[10px] text-emerald-200/70">Ties go to the faster player</p>
    </div>
  );
}

/** The three-phone stage under the hero headline. */
export function HeroStage() {
  return (
    <div className="relative mx-auto flex h-[420px] max-w-4xl items-start justify-center [perspective:1600px] sm:h-[500px]">
      <div className="home-float absolute left-1/2 top-12 hidden -translate-x-[150%] sm:block [animation-delay:-2s]">
        <Phone className="[transform:rotateY(18deg)_rotateZ(-6deg)] opacity-90">
          <TasksScreen />
        </Phone>
      </div>
      <div className="home-float absolute left-1/2 top-12 hidden translate-x-[50%] sm:block [animation-delay:-4.5s]">
        <Phone className="[transform:rotateY(-18deg)_rotateZ(6deg)] opacity-90">
          <LeaderboardScreen />
        </Phone>
      </div>
      <div className="home-float relative z-10">
        <Phone className="scale-105 shadow-[0_50px_120px_-20px_rgba(168,58,94,0.6)]">
          <AuctionScreen />
        </Phone>
      </div>
    </div>
  );
}
