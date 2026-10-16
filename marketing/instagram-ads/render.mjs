// Renders the Instagram ad creatives in ads.json to PNG (1080x1080 feed, 1080x1920 story)
// and stitches the story frames into a 1080x1920 MP4 reel.
//
//   node marketing/instagram-ads/render.mjs [outDir]
//
// Needs Playwright (Chromium) and ffmpeg on PATH. Fonts load from Google Fonts.
import { chromium } from "playwright";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// Defaults to the public folder so the files are served at calecutech.com/geological-assistant/ads/,
// which is where the Instagram API fetches them from.
const outDir = resolve(process.argv[2] || join(here, "../../apps/web/public/geological-assistant/ads"));
const cfg = JSON.parse(readFileSync(join(here, "ads.json"), "utf8"));
const logo = readFileSync(join(here, "../../apps/web/public/geological-assistant/assets/logo.svg"), "utf8");
const C = cfg.course;

const SIZES = { square: [1080, 1080], story: [1080, 1920] };

const css = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#16202a;--ink2:#1f2c38;--fg:#f1e7d8;--mut:#c9b9a2;--acc:#d2621f;--acc2:#ec8a48;--water:#7cc3dd;--cream:#f7f1e6;
--s1:#d9a066;--s2:#c4793d;--s3:#8a5a3b;--s4:#5c4033;--s5:#3a2e27;
--disp:"Fraunces",Georgia,serif;--sans:"Inter",system-ui,sans-serif;--ml:"Noto Sans Malayalam","Inter",sans-serif}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{font-family:var(--sans);color:var(--fg);background:radial-gradient(120% 80% at 80% 0%,#3a2e27 0%,var(--ink2) 45%,var(--ink) 100%);position:relative}
.frame{position:absolute;inset:0;display:flex;flex-direction:column;padding:var(--pad)}
.brand{display:flex;align-items:center;gap:18px;margin-bottom:28px;font-weight:700;font-size:34px;letter-spacing:-.01em}
.brand svg{width:64px;height:64px;border-radius:14px}
.grow{flex:1;display:flex;flex-direction:column;justify-content:center}
.eyebrow{display:inline-block;align-self:flex-start;border:2px solid rgba(241,231,216,.25);border-radius:999px;padding:10px 24px;font-size:24px;font-weight:700;letter-spacing:.08em;color:var(--s1);text-transform:uppercase;margin-bottom:34px}
h1{font-family:var(--disp);font-weight:800;line-height:1.02;letter-spacing:-.02em}
h1 em{font-style:italic;padding-right:.08em;background:linear-gradient(90deg,var(--acc2),var(--s1) 55%,var(--water));-webkit-background-clip:text;background-clip:text;color:transparent}
.ml{font-family:var(--ml)}h1.ml em{font-style:normal}
p.sub{color:var(--mut);line-height:1.38;margin-top:30px}
.stats{display:flex;gap:16px;flex-wrap:wrap;margin-top:40px}
.stat{background:rgba(255,253,248,.07);border:1.5px solid rgba(241,231,216,.16);border-radius:22px;padding:18px 24px;min-width:0}
.stat b{display:block;font-family:var(--disp);font-size:52px;line-height:1;color:var(--fg)}
.stat span{display:block;margin-top:6px;font-size:22px;color:var(--mut);font-weight:600}
.cta{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:40px}
.btn{background:var(--acc);color:#fff;font-weight:800;border-radius:24px;padding:26px 40px;font-size:36px;box-shadow:0 16px 40px rgba(210,98,31,.35);white-space:nowrap}
.url{font-size:26px;color:var(--mut);font-weight:600;text-align:right;line-height:1.3}
.strata{position:absolute;left:0;bottom:0;width:100%;height:var(--strata);opacity:.9;z-index:-1}
.opts{display:grid;gap:var(--og);margin-top:36px}
.opt{display:flex;align-items:center;gap:22px;background:rgba(255,253,248,.07);border:2px solid rgba(241,231,216,.18);border-radius:22px;padding:var(--op);font-size:34px;font-weight:600}
.opt i{font-style:normal;flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:rgba(241,231,216,.12);font-weight:800;font-size:28px}
.opt.right{border-color:#6fc49c;background:rgba(111,196,156,.16)}
.opt.right i{background:#6fc49c;color:#10201a}
.why{margin-top:26px;border-left:5px solid var(--water);padding:6px 0 6px 24px;color:#d6e7ee;font-size:30px;line-height:1.4}
.phone{background:#141c24;border:3px solid #2f3e4b;border-radius:48px;padding:34px 30px;box-shadow:0 40px 80px rgba(0,0,0,.45)}
.phone .top{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:32px}
.pill{background:#24313d;border-radius:999px;padding:8px 18px;font-size:20px;color:#f0c49c;font-weight:700}
.bar{height:10px;border-radius:9px;background:#2f3e4b;margin:22px 0 26px;overflow:hidden}.bar div{height:100%;width:34%;background:var(--acc2)}
.card{background:linear-gradient(160deg,#25485c,#1b3444);border-radius:28px;padding:30px}
.card small{font-size:18px;letter-spacing:.1em;font-weight:800;color:#a9c6d4}
.card h3{font-size:31px;line-height:1.3;margin-top:14px}
.card .w{margin-top:18px;border-left:4px solid var(--water);padding-left:18px;color:#cfe2ea;font-size:23px;line-height:1.4}
.btns{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:22px}
.btns div{border:2px solid #34434f;border-radius:16px;padding:16px 0;text-align:center;font-weight:800;font-size:24px}
.btns div.g{background:var(--acc);border-color:var(--acc)}
.date{font-family:var(--disp);font-weight:800;color:var(--acc2)}
.big{font-family:var(--disp);font-weight:800;line-height:.9}
`;

const strata = `<svg class="strata" viewBox="0 0 1080 300" preserveAspectRatio="none">
<path d="M0 60 Q270 0 540 50 T1080 40 V300 H0Z" fill="#d9a066" opacity=".55"/>
<path d="M0 120 Q300 70 560 120 T1080 100 V300 H0Z" fill="#c4793d" opacity=".55"/>
<path d="M0 180 Q260 140 540 185 T1080 165 V300 H0Z" fill="#8a5a3b" opacity=".7"/>
<path d="M0 240 Q300 205 560 245 T1080 225 V300 H0Z" fill="#5c4033"/></svg>`;

const brand = `<div class="brand">${logo}<span>${C.name}</span></div>`;
const cta = (label, story) => `<div class="cta"><div class="btn">${label}</div>${story ? "" : `<div class="url">${C.shortUrl.replace("/", "<br>/")}</div>`}</div>`;
const storyUrl = (story) => (story ? `<div class="url" style="text-align:left;margin-top:22px;font-size:28px">${C.shortUrl}</div>` : "");

// Each concept returns the inner HTML for a size; `story` is true for 1080x1920.
const T = {
  countdown: (s) => `${brand}<div class="grow">
    <div class="eyebrow">Kerala PSC · Geological Assistant</div>
    <h1 style="font-size:${s ? 116 : 92}px">Exam on <span class="date">2 December.</span><br>Start <em>today.</em></h1>
    <p class="sub ml" style="font-size:${s ? 40 : 34}px;color:var(--fg)">പരീക്ഷ ഡിസംബർ 2-ന്. ഇന്നുതന്നെ തുടങ്ങൂ.</p>
    <div class="stats">
      <div class="stat"><b>1,609</b><span>candidates</span></div>
      <div class="stat"><b>6</b><span>posts</span></div>
      <div class="stat"><b>20 min</b><span>a day is enough</span></div>
    </div>
    ${s ? `<p class="sub" style="font-size:36px">1,854 fact cards and 1,212 exam-style questions across all five units, with a plan for every day until the exam.</p>` : ""}
    </div>${cta(`Join course · ${C.price}`, s)}${storyUrl(s)}`,

  quiz: (s, reveal) => `${brand}<div class="grow">
    <div class="eyebrow" style="${s ? "" : "margin-top:24px"}">${reveal ? "Answer" : "Free question · Unit 5"}</div>
    <h1 style="font-size:${s ? 78 : 56}px">Which packing of equal spheres gives the <em>highest porosity?</em></h1>
    <div class="opts">
      ${["Rhombohedral", "Cubic", "Tetragonal", "Orthorhombic"].map((o, i) => `<div class="opt${reveal && i === 1 ? " right" : ""}"><i>${"ABCD"[i]}</i>${o}${reveal && i === 1 ? " · about 47.6%" : ""}</div>`).join("")}
    </div>
    ${reveal ? `<div class="why">Each sphere sits straight on top of the one below, leaving the most empty space. Rhombohedral is the tightest, about 26%.</div>`
      : `<p class="sub" style="font-size:${s ? 38 : 32}px;color:var(--fg)">Comment your answer 👇</p>`}
    </div>${cta(reveal ? `1,212 more · ${C.price}` : `Try 1,212 more`, s)}${storyUrl(s)}`,

  plan: (s) => `${brand}<div class="grow" style="${s ? "" : "flex-direction:row;align-items:center;gap:44px"}">
    <div style="${s ? "" : "flex:1.05"}">
      <h1 style="font-size:${s ? 104 : 62}px">Open the app.<br><em>The plan is already made.</em></h1>
      <p class="sub" style="font-size:${s ? 36 : 28}px">Revise what is due, learn new facts, quick checks, and a mock when you are ready.</p>
    </div>
    <div class="phone" style="${s ? "margin-top:56px" : "flex:1;transform:rotate(3deg)"}">
      <div class="top"><span>Today</span><span class="pill">18 to revise · 25 new</span></div>
      <div class="bar"><div></div></div>
      <div class="card"><small>UNIT 5 · HYDROGEOLOGY</small>
        <h3>Rhombohedral packing, about 26%. Cubic packing gives the highest, about 47.6%.</h3>
        ${s ? `<div class="w">Why: each sphere nests into the hollows of the layer below, leaving less empty space.</div>` : ""}</div>
      <div class="btns"><div>Again</div><div class="g">Good</div><div>Easy</div></div>
    </div></div>
    ${s ? `<div class="stats"><div class="stat"><b>1,854</b><span>fact cards</span></div><div class="stat"><b>1,212</b><span>MCQs</span></div><div class="stat"><b>5</b><span>units + mocks</span></div></div>` : ""}
    ${cta(`Join course · ${C.price}`, s)}${storyUrl(s)}`,

  malayalam: (s) => `${brand}<div class="grow">
    <div class="eyebrow ml" style="letter-spacing:0">കേരള PSC · ജിയോളജിക്കൽ അസിസ്റ്റന്റ്</div>
    <h1 class="ml" style="font-family:var(--ml);font-weight:800;line-height:1.3;font-size:${s ? 84 : 66}px">ദിവസവും <em>20 മിനിറ്റ്</em> മതി, സിലബസ് മുഴുവൻ പഠിക്കാൻ.</h1>
    <div class="stats ml">
      <div class="stat"><b>1,854</b><span class="ml">ഫാക്റ്റ് കാർഡുകൾ</span></div>
      <div class="stat"><b>1,212</b><span class="ml">ചോദ്യങ്ങൾ</span></div>
      <div class="stat"><b>${s ? "5" : "5"}</b><span class="ml">യൂണിറ്റുകൾ + മോക്ക്</span></div>
    </div>
    <p class="sub ml" style="font-size:${s ? 36 : 30}px">ഒറ്റത്തവണ ${C.price} · ആജീവനാന്ത ആക്സസ് · UPI</p>
    </div><div class="cta"><div class="btn ml">കോഴ്സിൽ ചേരൂ</div>${s ? "" : `<div class="url">${C.shortUrl.replace("/", "<br>/")}</div>`}</div>${storyUrl(s)}`,
};

function page(inner, [w, h]) {
  const story = h > w;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,800;1,9..144,800&family=Inter:wght@400;600;700;800&family=Noto+Sans+Malayalam:wght@400;600;800&display=block">
<style>${css}:root{--w:${w}px;--h:${h}px;--pad:${story ? "220px 76px 300px" : "72px 72px 80px"};--strata:${story ? 300 : 150}px;--og:${story ? "20px" : "14px"};--op:${story ? "24px 28px" : "16px 24px"}}</style>
</head><body>${strata}<div class="frame">${inner}</div></body></html>`;
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const pg = await ctx.newPage();

async function shot(name, html, size) {
  await pg.setViewportSize({ width: size[0], height: size[1] });
  await pg.setContent(html, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  const overflow = await pg.evaluate(() => document.querySelector(".frame").scrollHeight > window.innerHeight + 1);
  if (overflow) console.warn(`! ${name}: content overflows the frame`);
  const file = join(outDir, `${name}.png`);
  await pg.screenshot({ path: file });
  console.log("wrote", file);
  return file;
}

for (const ad of cfg.ads) {
  for (const [label, size] of Object.entries(SIZES)) {
    await shot(`${ad.id}-${label}`, page(T[ad.id](label === "story"), size), size);
  }
}
const reveal = await shot("quiz-reveal-story", page(T.quiz(true, true), SIZES.story), SIZES.story);
await browser.close();

// Reel: question (4s) -> reveal (3.5s) -> plan (3.5s) -> countdown CTA (4s), 0.5s crossfades.
const frames = [["quiz-story", 4], ["quiz-reveal-story", 3.5], ["plan-story", 3.5], ["countdown-story", 4]];
const args = ["-y", "-loglevel", "error"];
for (const [f, d] of frames) args.push("-loop", "1", "-t", String(d), "-i", join(outDir, `${f}.png`));
let filter = "", prev = "[0:v]", offset = 0;
frames.slice(1).forEach(([, ], i) => {
  offset += frames[i][1] - 0.5;
  const out = i === frames.length - 2 ? "[v]" : `[x${i}]`;
  filter += `${prev}[${i + 1}:v]xfade=transition=slideup:duration=0.5:offset=${offset}${out};`;
  prev = out;
});
const total = frames.reduce((t, [, d]) => t + d, 0) - 0.5 * (frames.length - 1);
// Silent stereo track: some Instagram upload paths reject video with no audio stream.
args.push("-f", "lavfi", "-t", String(total), "-i", "anullsrc=r=44100:cl=stereo");
args.push("-filter_complex", filter.replace(/;$/, ""), "-map", "[v]", "-map", `${frames.length}:a`, "-c:a", "aac", "-shortest", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(outDir, "reel-story.mp4"));
if (existsSync(reveal)) {
  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });
  console.log("wrote", join(outDir, "reel-story.mp4"));
}
