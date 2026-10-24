// Daily Instagram content made from the course itself: fact-card posts and quiz reels.
// Each run picks the next item for its slot, renders it, and (with --live) posts it.
// Free (organic) posts only: nothing here creates paid ads or spends money.
//
//   node marketing/instagram-ads/daily.mjs render card <0-4> [outDir]   render today's card post N
//   node marketing/instagram-ads/daily.mjs render reel <0-2> [outDir]   render today's quiz reel N
//   node marketing/instagram-ads/daily.mjs publish <outDir> [--live]    post what render wrote
//
// Options: --day=YYYY-MM-DD picks the items for another day (for previews).
//
// The order is fixed by cards.json, so each card or question is posted once: day D, slot S
// takes item D*5+S (cards) or D*3+S (reels) from a queue that puts past-paper facts first,
// then high-frequency ones, rotates the five units, and skips anything flagged "verify".
//
// Publishing needs a public URL for the file. The workflow pushes it to the `ig-media`
// branch and passes MEDIA_URL (a jsDelivr link to that commit). Secrets as in publish.mjs.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const cfg = JSON.parse(readFileSync(join(here, "ads.json"), "utf8"));
const deck = JSON.parse(readFileSync(join(root, "docs/geological-assistant/db/cards.json"), "utf8"));
const D = cfg.daily;

const argv = process.argv.slice(2);
const live = argv.includes("--live");
const dayArg = (argv.find((a) => a.startsWith("--day=")) || "").slice(6);
const [cmd, a1, a2] = argv.filter((a) => !a.startsWith("--"));

// ---------- picking ----------
const IST = 5.5 * 3_600_000;
const dayNumber = (iso) => Math.floor(Date.parse(iso + "T00:00:00Z") / 86_400_000);
const today = dayArg || new Date(Date.now() + IST).toISOString().slice(0, 10);
const day = dayNumber(today) - dayNumber(D.start);

const h = (s) => createHash("sha1").update(s).digest("hex");
const tier = (x) => (x.p?.length ? 0 : 3) + { h: 0, m: 1, l: 2 }[x.f];
const readable = (x) => x.k !== "q" || (x.q.length <= 150 && x.o.reduce((n, o) => n + o.length, 0) <= 200);

// Queue: by tier, then the five units in turn, shuffled (stably) inside each unit.
function queue(kind) {
  const items = deck.cards.filter((x) => x.k === kind && !x.c && readable(x));
  const out = [];
  for (const t of [...new Set(items.map(tier))].sort()) {
    const units = [1, 2, 3, 4, 5].map((u) => items.filter((x) => tier(x) === t && x.u === u).sort((a, b) => (h(a.id) < h(b.id) ? -1 : 1)));
    for (let i = 0; units.some((u) => i < u.length); i++) for (const u of units) if (u[i]) out.push(u[i]);
  }
  return out;
}

function pick(kind, slot) {
  const perDay = kind === "f" ? D.cardsPerDay : D.reelsPerDay;
  if (!(slot >= 0 && slot < perDay)) throw new Error(`Slot must be 0-${perDay - 1}`);
  const q = queue(kind);
  const n = Math.max(day, 0) * perDay + slot;
  return { item: q[n % q.length], n: n + 1 };
}

// ---------- captions ----------
const C = cfg.course;
const unitName = (u) => deck.units[String(u)];
const paper = (x) => (x.p?.length ? x.p[0].replace(/\s*\(.*?\)\s*/g, " ").trim() : "");
const tags = `${cfg.hashtags} #GeologyFacts #KeralaPSCExam`;
const join_ = `Kerala PSC Geological Assistant exam: ${C.examDate}. ${C.name} has 1,854 fact cards like this and 1,212 exam-style questions across all 5 units, with a plan for every day.\n\n${C.price} once, lifetime access.\n👉 Join at ${C.signupShort} (link in bio)`;

function cardCaption(x, n) {
  return [
    `Geological Assistant fact #${n} · ${x.s}`,
    x.a,
    `Why: ${x.w}`,
    paper(x) ? `Asked before: ${paper(x)}.` : "",
    join_,
    "📌 Save this for revision. 📤 Share it with a friend writing the exam.",
    tags,
  ].filter(Boolean).join("\n\n");
}

function reelCaption(x) {
  return [
    `Kerala PSC Geological Assistant: can you answer before the timer runs out? ⏱️`,
    `${x.q}\n${x.o.map((o, i) => `${"ABCD"[i]}) ${o}`).join("\n")}`,
    "Comment your answer 👇 The reel shows the answer and the reason.",
    join_,
    "📤 Tag a friend writing the exam on 2 December.",
    tags,
  ].join("\n\n");
}

const reelComment = (x) => `Answer: ${"ABCD"[x.x]}) ${x.o[x.x]}. ${x.e}\n\n1,211 more questions like this at ${C.signupShort}`;

// ---------- rendering ----------
const logo = readFileSync(join(root, "apps/web/public/geological-assistant/assets/logo.svg"), "utf8");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fit = (len, steps) => steps.find(([max]) => len <= max)?.[1] ?? steps.at(-1)[1];

const css = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#16202a;--ink2:#1f2c38;--fg:#f1e7d8;--mut:#c9b9a2;--acc:#d2621f;--acc2:#ec8a48;--water:#7cc3dd;--s1:#d9a066;
--disp:"Fraunces",Georgia,serif;--sans:"Inter",system-ui,sans-serif}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:var(--sans);color:var(--fg);background:radial-gradient(120% 80% at 80% 0%,#3a2e27 0%,var(--ink2) 45%,var(--ink) 100%);position:relative}
.frame{position:absolute;inset:0;display:flex;flex-direction:column;padding:var(--pad)}
.brand{display:flex;align-items:center;gap:18px;font-weight:700;font-size:34px;letter-spacing:-.01em}
.brand svg{width:64px;height:64px;border-radius:14px}
.brand .n{margin-left:auto;font-size:26px;color:var(--mut);font-weight:700}
.grow{flex:1;display:flex;flex-direction:column;justify-content:center}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:34px}
.chip{border:2px solid rgba(241,231,216,.25);border-radius:999px;padding:9px 22px;font-size:23px;font-weight:700;letter-spacing:.06em;color:var(--s1);text-transform:uppercase}
.chip.pp{border-color:rgba(124,195,221,.5);color:var(--water)}
.fact{font-family:var(--disp);font-weight:800;line-height:1.16;letter-spacing:-.01em}
.why{margin-top:34px;border-left:6px solid var(--water);padding:6px 0 6px 26px;color:#d6e7ee;line-height:1.42}
.why b{color:var(--water)}
.q{font-family:var(--disp);font-weight:800;line-height:1.14;letter-spacing:-.01em}
.opts{display:grid;gap:18px;margin-top:40px}
.opt{display:flex;align-items:center;gap:22px;background:rgba(255,253,248,.07);border:2px solid rgba(241,231,216,.18);border-radius:22px;padding:22px 26px;font-weight:600;line-height:1.25}
.opt i{font-style:normal;flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:rgba(241,231,216,.12);font-weight:800;font-size:28px}
.opt.right{border-color:#6fc49c;background:rgba(111,196,156,.16)}.opt.right i{background:#6fc49c;color:#10201a}
.opt.dim{opacity:.4}
.timer{display:flex;align-items:center;gap:22px;margin-top:40px;font-size:30px;font-weight:700;color:var(--mut)}
.timer b{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;background:var(--acc);color:#fff;font-size:52px;font-family:var(--disp)}
.bar{flex:1;height:14px;border-radius:9px;background:rgba(241,231,216,.12);overflow:hidden}.bar div{height:100%;background:var(--acc2)}
.cta{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:36px}
.btn{background:var(--acc);color:#fff;font-weight:800;border-radius:24px;padding:24px 36px;font-size:34px;box-shadow:0 16px 40px rgba(210,98,31,.35);white-space:nowrap}
.url{font-size:26px;color:var(--mut);font-weight:600;text-align:right;line-height:1.3}
.big{font-family:var(--disp);font-weight:800;font-size:96px;line-height:1.02;letter-spacing:-.02em}
.big em{font-style:italic;background:linear-gradient(90deg,var(--acc2),var(--s1) 55%,var(--water));-webkit-background-clip:text;background-clip:text;color:transparent}
.stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:44px}
.stat{background:rgba(255,253,248,.07);border:1.5px solid rgba(241,231,216,.16);border-radius:22px;padding:18px 24px}
.stat b{display:block;font-family:var(--disp);font-size:52px;line-height:1}.stat span{display:block;margin-top:6px;font-size:22px;color:var(--mut);font-weight:600}
.strata{position:absolute;left:0;bottom:0;width:100%;height:var(--strata);opacity:.9;z-index:-1}
`;
const strata = `<svg class="strata" viewBox="0 0 1080 300" preserveAspectRatio="none">
<path d="M0 60 Q270 0 540 50 T1080 40 V300 H0Z" fill="#d9a066" opacity=".55"/>
<path d="M0 120 Q300 70 560 120 T1080 100 V300 H0Z" fill="#c4793d" opacity=".55"/>
<path d="M0 180 Q260 140 540 185 T1080 165 V300 H0Z" fill="#8a5a3b" opacity=".7"/>
<path d="M0 240 Q300 205 560 245 T1080 225 V300 H0Z" fill="#5c4033"/></svg>`;

const page = (inner, w, h, pad, strataH) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,800;1,9..144,800&family=Inter:wght@400;600;700;800&display=block">
<style>${css}:root{--w:${w}px;--h:${h}px;--pad:${pad};--strata:${strataH}px}</style></head>
<body>${strata}<div class="frame">${inner}</div></body></html>`;

const brand = (n) => `<div class="brand">${logo}<span>${C.name}</span>${n ? `<span class="n">${n}</span>` : ""}</div>`;
const chips = (x) => `<div class="chips"><span class="chip">Unit ${x.u} · ${esc(x.s.split(":")[0])}</span>${paper(x) ? `<span class="chip pp">Past paper</span>` : ""}</div>`;
const cta = (label) => `<div class="cta"><div class="btn">${label}</div><div class="url">calecutech.com<br>/geological-assistant</div></div>`;

// Feed card, 1080x1350 (4:5 portrait takes the most room in the feed).
const cardHtml = (x, n) => page(`${brand(`Fact #${n}`)}<div class="grow">${chips(x)}
  <div class="fact" style="font-size:${fit(x.a.length, [[110, 66], [160, 58], [210, 50], [999, 44]])}px">${esc(x.a)}</div>
  <div class="why" style="font-size:${fit(x.w.length, [[120, 32], [180, 29], [999, 26]])}px"><b>Why:</b> ${esc(x.w)}</div>
  </div>${cta(`1,854 cards like this · ${C.price}`)}`, 1080, 1350, "68px 72px 76px", 150);

// Reel frames, 1080x1920, with room left for Instagram's top bar and caption area.
const REEL_PAD = "200px 76px 340px";
const qSize = (x) => fit(x.q.length, [[70, 76], [110, 66], [999, 56]]);
const oSize = (x) => fit(Math.max(...x.o.map((o) => o.length)), [[25, 38], [45, 33], [999, 29]]);
const qHtml = (x, left, total) => page(`${brand("Quiz")}<div class="grow">${chips(x)}
  <div class="q" style="font-size:${qSize(x)}px">${esc(x.q)}</div>
  <div class="opts">${x.o.map((o, i) => `<div class="opt" style="font-size:${oSize(x)}px"><i>${"ABCD"[i]}</i>${esc(o)}</div>`).join("")}</div>
  <div class="timer"><b>${left}</b><div class="bar"><div style="width:${(left / total) * 100}%"></div></div><span>Answer?</span></div>
  </div>`, 1080, 1920, REEL_PAD, 300);
const aHtml = (x) => page(`${brand("Answer")}<div class="grow">${chips(x)}
  <div class="q" style="font-size:${Math.round(qSize(x) * 0.8)}px">${esc(x.q)}</div>
  <div class="opts">${x.o.map((o, i) => `<div class="opt ${i === x.x ? "right" : "dim"}" style="font-size:${oSize(x)}px"><i>${"ABCD"[i]}</i>${esc(o)}</div>`).join("")}</div>
  <div class="why" style="font-size:${fit(x.e.length, [[150, 33], [999, 29]])}px"><b>Why:</b> ${esc(x.e)}</div>
  </div>`, 1080, 1920, REEL_PAD, 300);
const endHtml = () => page(`${brand()}<div class="grow">
  <div class="big">${esc(C.examDate)}.<br><em>Start today.</em></div>
  <div class="stats"><div class="stat"><b>1,854</b><span>fact cards</span></div><div class="stat"><b>1,212</b><span>exam-style MCQs</span></div><div class="stat"><b>20 min</b><span>a day</span></div></div>
  </div>${cta(`Join · ${C.price}`)}`, 1080, 1920, REEL_PAD, 300);

async function shots(list, outDir) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const pg = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [file, html, w, h] of list) {
    await pg.setViewportSize({ width: w, height: h });
    await pg.setContent(html, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
    if (await pg.evaluate(() => document.querySelector(".frame").scrollHeight > innerHeight + 1)) console.warn(`! ${file}: content overflows`);
    await pg.screenshot({ path: join(outDir, file), type: "jpeg", quality: 92 });
  }
  await browser.close();
}

async function render(kind, slot, outDir) {
  mkdirSync(outDir, { recursive: true });
  if (kind === "card") {
    const { item: x, n } = pick("f", slot);
    await shots([["card.jpg", cardHtml(x, n), 1080, 1350]], outDir);
    const post = { kind: "card", id: x.id, file: "card.jpg", caption: cardCaption(x, n) };
    writeFileSync(join(outDir, "post.json"), JSON.stringify(post, null, 2));
    return console.log(`Day ${today} card ${slot}: ${x.id} (#${n}) -> ${join(outDir, "card.jpg")}`);
  }
  if (kind !== "reel") throw new Error('Kind must be "card" or "reel"');
  const { item: x } = pick("q", slot);
  const T = D.reelSeconds;
  const frames = [];
  for (let s = T.question; s >= 1; s--) frames.push([`q${s}.jpg`, qHtml(x, s, T.question), 1080, 1920]);
  frames.push(["a.jpg", aHtml(x), 1080, 1920], ["end.jpg", endHtml(), 1080, 1920]);
  await shots(frames, outDir);
  // One second per countdown frame, then the answer, then the sign-up card. Silent audio track
  // because some Instagram upload paths reject video without one.
  const seq = [...frames.slice(0, T.question).map(([f]) => [f, 1]), ["a.jpg", T.answer], ["end.jpg", T.end]];
  const args = ["-y", "-loglevel", "error"];
  for (const [f, d] of seq) args.push("-loop", "1", "-framerate", "30", "-t", String(d), "-i", join(outDir, f));
  const total = seq.reduce((t, [, d]) => t + d, 0);
  args.push("-f", "lavfi", "-t", String(total), "-i", "anullsrc=r=44100:cl=stereo");
  args.push("-filter_complex", `${seq.map((_, i) => `[${i}:v]`).join("")}concat=n=${seq.length}:v=1:a=0,format=yuv420p[v]`,
    "-map", "[v]", "-map", `${seq.length}:a`, "-c:v", "libx264", "-r", "30", "-c:a", "aac", "-shortest", "-movflags", "+faststart", join(outDir, "reel.mp4"));
  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });
  const post = { kind: "reel", id: x.id, file: "reel.mp4", caption: reelCaption(x), comment: reelComment(x) };
  writeFileSync(join(outDir, "post.json"), JSON.stringify(post, null, 2));
  console.log(`Day ${today} reel ${slot}: ${x.id} -> ${join(outDir, "reel.mp4")}`);
}

// ---------- publishing ----------
const env = process.env;
const GRAPH = `https://graph.facebook.com/${env.META_GRAPH_VERSION || "v23.0"}`;
let fakeId = 0;
async function api(method, path, params = {}) {
  console.log(`${live ? "→" : "[dry run]"} ${method} ${path}`, JSON.stringify(params, null, 2));
  if (!live) return { id: `DRY_${++fakeId}`, status_code: "FINISHED" };
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));
  body.set("access_token", env.META_ACCESS_TOKEN);
  const res = await fetch(method === "GET" ? `${GRAPH}${path}?${body}` : `${GRAPH}${path}`, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${method} ${path} failed: ${JSON.stringify(json.error || json)}`);
  return json;
}

async function publish(outDir) {
  const post = JSON.parse(readFileSync(join(outDir, "post.json"), "utf8"));
  if (live && !(env.META_ACCESS_TOKEN && env.IG_USER_ID)) throw new Error("Missing secrets: META_ACCESS_TOKEN and/or IG_USER_ID");
  if (live && !env.MEDIA_URL) throw new Error("MEDIA_URL is not set (the public URL of the rendered file)");
  const url = env.MEDIA_URL || `https://example.invalid/${post.file}`;
  const ig = env.IG_USER_ID || "IG_USER_ID";
  const params = post.kind === "reel"
    ? { media_type: "REELS", video_url: url, caption: post.caption, share_to_feed: "true" }
    : { image_url: url, caption: post.caption };
  const { id: container } = await api("POST", `/${ig}/media`, params);
  for (let i = 0; i < 36; i++) {
    const { status_code } = await api("GET", `/${container}`, { fields: "status_code" });
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Container ${container}: ${status_code}`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  const { id: media } = await api("POST", `/${ig}/media_publish`, { creation_id: container });
  console.log(`Published ${post.kind} ${post.id} as media ${media}`);
  if (post.comment) await api("POST", `/${media}/comments`, { message: post.comment });
}

if (cmd === "render") await render(a1, Number(a2), resolve(argv.filter((a) => !a.startsWith("--"))[3] || "ig-out"));
else if (cmd === "publish") await publish(resolve(a1 || "ig-out"));
else {
  console.error("Usage: daily.mjs render card|reel <slot> [outDir] [--day=YYYY-MM-DD] | publish <outDir> [--live]");
  process.exit(2);
}
