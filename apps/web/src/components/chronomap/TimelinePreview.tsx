/**
 * A static picture of the Chronomap interface: a region, a timeline and the
 * layers it can show. It is not a map and it is not wired to any data. It is
 * decorative, so the caption beside it carries the meaning for screen readers.
 */
const layers = [
  { label: "Empires & borders", on: true },
  { label: "Monuments", on: true },
  { label: "Thinkers", on: true },
  { label: "Arts & literature", on: false },
  { label: "Trade routes", on: false },
];

const events = [
  {
    kind: "Empire",
    title: "Chola rule under Rajaraja I",
    detail: "Reigned 985–1014 CE",
  },
  {
    kind: "Monument",
    title: "Brihadisvara Temple, Thanjavur",
    detail: "Completed c. 1010 CE",
  },
];

export default function TimelinePreview({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-[#c9a86a]/40 bg-[#fbf7ec] p-5 text-[#1d2538] shadow-xl shadow-black/20 ${
        large ? "sm:p-8" : ""
      }`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#1d2538]/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#7d5e22]">Region</p>
          <p className="font-serif text-lg font-semibold">South India</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-[#7d5e22]">Around</p>
          <p className="font-serif text-lg font-semibold">c. 1000 CE</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-[#101c33]/15">
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#101c33]/60" />
          <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#7d5e22] bg-[#fbf7ec] shadow" />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#4a5264]">
          <span>500 CE</span>
          <span>1000 CE</span>
          <span>1500 CE</span>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2 text-xs">
        {layers.map((layer) => (
          <li
            key={layer.label}
            className={`rounded-full border px-3 py-1 ${
              layer.on
                ? "border-[#101c33] bg-[#101c33] text-[#f5efe2]"
                : "border-[#1d2538]/25 text-[#4a5264]"
            }`}
          >
            {layer.on ? "✓ " : ""}
            {layer.label}
          </li>
        ))}
      </ul>

      <ul className="mt-5 space-y-3">
        {events.map((event) => (
          <li key={event.title} className="rounded-xl border border-[#1d2538]/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7d5e22]">{event.kind}</p>
            <p className="mt-1 font-medium">{event.title}</p>
            <p className="text-sm text-[#4a5264]">{event.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
