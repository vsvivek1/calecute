/** A small picture for each service card, in the same order as `services`. */
export const serviceArt = [
  // Web
  <div key="web" className="rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
    <div className="flex gap-1 border-b border-black/5 px-3 py-2 dark:border-white/5">
      <span className="h-2 w-2 rounded-full bg-red-400" />
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      <span className="h-2 w-2 rounded-full bg-green-400" />
    </div>
    <div className="grid grid-cols-3 gap-2 p-3">
      <div className="col-span-3 h-10 rounded-md bg-[linear-gradient(110deg,#6366f1,#a855f7,#ec4899)]" />
      <div className="h-8 rounded-md bg-black/5 dark:bg-white/10" />
      <div className="h-8 rounded-md bg-black/5 dark:bg-white/10" />
      <div className="h-8 rounded-md bg-black/5 dark:bg-white/10" />
    </div>
  </div>,
  // Mobile
  <div key="mobile" className="mx-auto flex w-24 flex-col gap-1.5 rounded-[1.2rem] border-4 border-zinc-900 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
    <div className="h-10 rounded-lg bg-[linear-gradient(140deg,#ec4899,#f97316)]" />
    <div className="h-2 w-3/4 rounded bg-black/10 dark:bg-white/15" />
    <div className="h-2 w-1/2 rounded bg-black/10 dark:bg-white/15" />
    <div className="mt-1 h-5 rounded-md bg-zinc-900 dark:bg-white/80" />
  </div>,
  // SaaS
  <div key="saas" className="flex items-end gap-1.5">
    {[30, 42, 38, 55, 61, 58, 74, 82, 90].map((h, i) => (
      <div
        key={i}
        style={{ height: `${h}px` }}
        className="w-4 rounded-t-md bg-[linear-gradient(to_top,#7c3aed,#c084fc)] opacity-90"
      />
    ))}
  </div>,
  // Backend
  <pre key="api" className="overflow-hidden rounded-xl bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
    <span className="text-teal-400">POST</span> /v1/orders{"\n"}
    <span className="text-zinc-500">→</span> <span className="text-green-400">201</span> Created{"\n"}
    <span className="text-zinc-500">{"{"}</span> <span className="text-sky-300">&quot;status&quot;</span>: <span className="text-amber-300">&quot;paid&quot;</span> <span className="text-zinc-500">{"}"}</span>
  </pre>,
];
