"use client";

/**
 * The History Clock map: pick a region on the world map (or from the list),
 * drag the time slider, and read which powers rule there, which ones rise or
 * break nearby in time, and the monuments, thinkers, arts and turning points
 * closest to that year.
 */
import { useEffect, useState } from "react";
import s from "./sketch.module.css";
import type { CountryShape, Pin } from "@/lib/history-clock/world";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/history-clock/world";
import {
  YEAR_MAX,
  YEAR_MIN,
  formatSpan,
  formatYear,
  kindLabels,
  nearestTo,
  regions,
  risesAndFalls,
  rulingAt,
  type Entry,
  type Kind,
  type Region,
} from "@/lib/history-clock/regions";

const jumps = [-2500, -1000, -300, 1, 500, 1000, 1500, 1800, 1950];

const kindStyle: Record<Kind, { badge: string; icon: string }> = {
  empire: { badge: "bg-[#8a4f7d] text-white", icon: "♛" },
  monument: { badge: "bg-[#d9653b] text-[#1f2433]", icon: "⌂" },
  thinker: { badge: "bg-[#2f7f7a] text-white", icon: "✎" },
  arts: { badge: "bg-[#e8b64c] text-[#1f2433]", icon: "♪" },
  event: { badge: "bg-[#1f2433] text-[#fbf3e0]", icon: "!" },
};

const countryToRegion = new Map<string, Region>();
for (const r of regions) for (const c of r.countries) countryToRegion.set(c, r);

function shortYear(year: number) {
  return year < 0 ? `${-year} BCE` : `${year}`;
}

function lanes(entries: Entry[]) {
  // Greedy lane packing so overlapping dynasties sit on separate rows.
  const ends: number[] = [];
  return entries
    .slice()
    .sort((a, b) => a.from - b.from)
    .map((e) => {
      const end = e.to ?? YEAR_MAX;
      let lane = ends.findIndex((x) => x < e.from);
      if (lane === -1) {
        lane = ends.length;
        ends.push(end);
      } else ends[lane] = end;
      return { e, lane };
    });
}

/** Position of a year along a strip that runs from `start` to today, in percent. */
const pct = (year: number, start: number) =>
  ((Math.min(Math.max(year, start), YEAR_MAX) - start) / (YEAR_MAX - start)) * 100;

export default function HistoryMap({ countries, pins }: { countries: CountryShape[]; pins: Pin[] }) {
  const [regionId, setRegionId] = useState("kerala");
  const [year, setYear] = useState(1500);
  const [playing, setPlaying] = useState(false);

  const region = regions.find((r) => r.id === regionId) ?? regions[0];
  const ruling = rulingAt(region, year);
  const changes = risesAndFalls(region, year);
  const nearby = nearestTo(region, year);
  const empireLanes = lanes(region.entries.filter((e) => e.kind === "empire"));
  const laneCount = Math.max(1, ...empireLanes.map((l) => l.lane + 1));
  // The dynasty strip zooms to the region's own span, so short modern reigns stay visible.
  const stripStart = Math.max(YEAR_MIN, Math.min(...region.entries.map((e) => e.from)) - 100);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setYear((y) => Math.min(YEAR_MAX, y + (y < 0 ? 25 : 10)));
    }, 120);
    return () => clearInterval(timer);
  }, [playing]);

  if (playing && year >= YEAR_MAX) setPlaying(false);

  const activeRegions = new Set(regions.filter((r) => rulingAt(r, year).length > 0).map((r) => r.id));

  const choose = (id: string) => {
    setRegionId(id);
    document.getElementById("hc-panel")?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-8">
      {/* Region picker, for touch and keyboard */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4a4f5e]">1 · Pick a place</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Regions">
          {regions.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setRegionId(r.id)}
                aria-pressed={r.id === regionId}
                className={`${s.chip} ${r.id === regionId ? s.chipOn : ""}`}
              >
                <span
                  aria-hidden="true"
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-[#1f2433]"
                  style={{ background: r.colour }}
                />
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* The map */}
      <div className={`${s.card} overflow-hidden p-2 sm:p-4`}>
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="h-auto w-full"
          role="group"
          aria-label={`World map. Selected: ${region.name}. Choose a coloured region.`}
        >
          <defs>
            <filter id="hc-sketch" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" />
            </filter>
            <pattern id="hc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#e9dcbc" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#d6c69f" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#cfe6e2" rx="14" />
          <g filter="url(#hc-sketch)">
            {countries.map((c) => {
              const r = countryToRegion.get(c.id);
              const selected = r?.id === regionId;
              const fill = r ? r.colour : "url(#hc-hatch)";
              const opacity = r ? (selected ? 1 : activeRegions.has(r.id) ? 0.7 : 0.4) : 1;
              return (
                <path
                  key={`${c.id}-${c.name}`}
                  d={c.d}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke="#1f2433"
                  strokeWidth={selected ? 2.2 : 0.8}
                  className={r ? "cursor-pointer" : undefined}
                  onClick={r ? () => choose(r.id) : undefined}
                >
                  <title>{r ? `${c.name}: ${r.name}` : `${c.name} (no entries yet)`}</title>
                </path>
              );
            })}
          </g>
          {pins.map((p) => {
            const r = regions.find((x) => x.id === p.regionId);
            if (!r) return null;
            const selected = r.id === regionId;
            return (
              <g
                key={p.regionId}
                transform={`translate(${p.x} ${p.y})`}
                className="cursor-pointer"
                onClick={() => choose(r.id)}
              >
                <title>{r.name}</title>
                <path
                  d="M0 0 c-7 -10 -12 -15 -12 -22 a12 12 0 0 1 24 0 c0 7 -5 12 -12 22 z"
                  fill={selected ? r.colour : "#fffaf0"}
                  stroke="#1f2433"
                  strokeWidth="2.5"
                />
                <circle cx="0" cy="-22" r="4.5" fill={selected ? "#fffaf0" : r.colour} stroke="#1f2433" strokeWidth="1.5" />
                <text x="15" y="-18" fontSize="15" fontWeight="700" fill="#1f2433" stroke="#fffaf0" strokeWidth="3" paintOrder="stroke">
                  {r.name}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="px-2 pt-2 text-xs text-[#4a4f5e]">
          Coloured places have entries. Brighter colour means a dynasty in our list holds power there in {formatYear(year)}.
          Hatched countries have no entries yet. Borders are today&rsquo;s, for orientation only.
        </p>
      </div>

      {/* Time slider */}
      <div className={`${s.card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4a4f5e]">2 · Slide through time</p>
            <p className={`${s.hand} mt-1 text-5xl leading-none sm:text-6xl`} aria-live="polite">
              {formatYear(year)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${s.btn} ${s.btnPlain} !px-3 !py-1.5 text-sm`} onClick={() => setYear((y) => Math.max(YEAR_MIN, y - 100))}>
              −100 yrs
            </button>
            <button type="button" className={`${s.btn} ${s.btnPlain} !px-3 !py-1.5 text-sm`} onClick={() => setYear((y) => Math.min(YEAR_MAX, y + 100))}>
              +100 yrs
            </button>
            <button
              type="button"
              className={`${s.btn} ${s.btnTeal} !px-3 !py-1.5 text-sm`}
              onClick={() => {
                if (!playing && year >= YEAR_MAX) setYear(YEAR_MIN);
                setPlaying((p) => !p);
              }}
              aria-pressed={playing}
            >
              {playing ? "❚❚ Pause" : "▶ Play"}
            </button>
          </div>
        </div>
        <label htmlFor="hc-year" className="sr-only">
          Year
        </label>
        <input
          id="hc-year"
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={5}
          value={year}
          onChange={(e) => {
            setPlaying(false);
            setYear(Number(e.target.value));
          }}
          aria-valuetext={formatYear(year)}
          className={`${s.slider} mt-6`}
        />
        <div className="mt-2 flex justify-between text-xs font-semibold text-[#4a4f5e]">
          <span>3200 BCE</span>
          <span>1 CE</span>
          <span>2025 CE</span>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Jump to a year">
          {jumps.map((j) => (
            <li key={j}>
              <button
                type="button"
                className={`${s.chip} ${year === j ? s.chipOn : ""}`}
                onClick={() => {
                  setPlaying(false);
                  setYear(j);
                }}
              >
                {shortYear(j)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* What was happening */}
      <section
        id="hc-panel"
        tabIndex={-1}
        aria-labelledby="hc-panel-title"
        className={`${s.card} p-5 outline-none sm:p-8`}
        style={{ borderTop: `10px solid ${region.colour}` }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4a4f5e]">3 · See what was going on</p>
        <h2 id="hc-panel-title" className={`${s.hand} mt-1 text-4xl leading-tight sm:text-5xl`}>
          {region.name} in {formatYear(year)}
        </h2>
        <p className="mt-2 text-[#4a4f5e]">{region.blurb}</p>

        {/* Dynasty strip */}
        <div className="mt-6">
          <p className="text-sm font-semibold">Who ruled when</p>
          <div
            className="relative mt-2 rounded-lg border-2 border-[#1f2433] bg-[#fffaf0]"
            style={{ height: `${laneCount * 22 + 10}px` }}
          >
            {empireLanes.map(({ e, lane }) => {
              const left = pct(e.from, stripStart);
              const width = Math.max(0.8, pct(e.to ?? YEAR_MAX, stripStart) - left);
              const on = e.from <= year && (e.to ?? YEAR_MAX) >= year;
              return (
                <button
                  key={e.name}
                  type="button"
                  title={`${e.name} (${formatSpan(e)})`}
                  aria-label={`Jump to the start of ${e.name}, ${formatSpan(e)}`}
                  onClick={() => {
                    setPlaying(false);
                    setYear(Math.max(YEAR_MIN, e.from));
                  }}
                  className="absolute h-4 rounded-full border-[1.5px] border-[#1f2433] focus-visible:outline-2 focus-visible:outline-[#d9653b]"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `${lane * 22 + 6}px`,
                    background: on ? region.colour : "#e9dcbc",
                  }}
                />
              );
            })}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-[#d9653b]"
              style={{ left: `${pct(year, stripStart)}%`, opacity: year < stripStart ? 0.3 : 1 }}
            />
          </div>
          <div className="mt-1 flex justify-between gap-3 text-xs text-[#4a4f5e]">
            <span>{formatYear(stripStart)}</span>
            <span>Tap a bar to jump to the year that power began.</span>
            <span>today</span>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className={`${s.hand} text-2xl`}>♛ In power</h3>
            {ruling.length ? (
              <ul className="mt-3 space-y-3">
                {ruling.map((e) => (
                  <li key={e.name} className="rounded-xl border-2 border-[#1f2433] bg-[#fffaf0] p-4">
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-sm text-[#4a4f5e]">{formatSpan(e)}</p>
                    <p className="mt-1 text-sm leading-6">{e.note}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border-2 border-dashed border-[#1f2433]/50 p-4 text-sm text-[#4a4f5e]">
                None of our entries cover this year here. That is a gap in this first version, not an empty
                stretch of history.
              </p>
            )}

            <h3 className={`${s.hand} mt-8 text-2xl`}>⚒ Rising and breaking (±100 years)</h3>
            {changes.length ? (
              <ul className="mt-3 space-y-2">
                {changes.map(({ entry, what, at }) => (
                  <li key={`${entry.name}-${what}`} className="flex gap-3 text-sm leading-6">
                    <span
                      className={`mt-0.5 shrink-0 rounded-md border-[1.5px] border-[#1f2433] px-2 text-xs font-bold leading-5 ${
                        what === "rises" ? "bg-[#bfe0dc]" : "bg-[#f4c3b0]"
                      }`}
                    >
                      {what === "rises" ? "rises" : "breaks"}
                    </span>
                    <span>
                      <strong>{entry.name}</strong> · {entry.approx ? "c. " : ""}
                      {formatYear(at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[#4a4f5e]">No empire in our list forms or falls within a century of this year.</p>
            )}
          </div>

          <div>
            <h3 className={`${s.hand} text-2xl`}>✎ Around this time</h3>
            <ul className="mt-3 space-y-3">
              {nearby.map((e) => (
                <li key={e.name} className="rounded-xl border-2 border-[#1f2433] bg-[#fffaf0] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border-[1.5px] border-[#1f2433] px-2 text-xs font-bold leading-5 ${kindStyle[e.kind].badge}`}>
                      <span aria-hidden="true">{kindStyle[e.kind].icon} </span>
                      {kindLabels[e.kind]}
                    </span>
                    <span className="text-sm text-[#4a4f5e]">{formatSpan(e)}</span>
                  </div>
                  <p className="mt-2 font-semibold">{e.name}</p>
                  <p className="mt-1 text-sm leading-6">{e.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
