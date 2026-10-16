// Posts the creatives in ads.json to Instagram, or builds them as PAUSED paid ads
// in Meta Ads Manager. Dry run by default: it prints every request and sends
// nothing unless --live is passed.
//
//   node marketing/instagram-ads/publish.mjs post  <id> [--live]   feed post (1080x1080) + answer comment
//   node marketing/instagram-ads/publish.mjs story <id> [--live]   story (1080x1920)
//   node marketing/instagram-ads/publish.mjs reel       [--live]   the 13.5s reel
//   node marketing/instagram-ads/publish.mjs ads [--ids a,b] [--daily 400] [--start 2026-10-18] [--end 2026-12-01] [--live]
//
// Environment (GitHub Actions secrets, never committed):
//   META_ACCESS_TOKEN   long-lived system-user token (see README.md for the permissions)
//   IG_USER_ID          Instagram professional account id
//   FB_PAGE_ID          Facebook Page linked to that Instagram account (ads only)
//   META_AD_ACCOUNT_ID  ad account id, digits only (ads only)
//   META_GRAPH_VERSION  optional, defaults to v23.0
//   ADS_MEDIA_BASE      optional public URL of the rendered files,
//                       defaults to https://calecutech.com/geological-assistant/ads
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(here, "ads.json"), "utf8"));
const mediaDir = join(here, "../../apps/web/public/geological-assistant/ads");

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? def : argv[i + 1];
};
const live = argv.includes("--live");
const VALUED = ["--ids", "--daily", "--start", "--end"];
const [cmd, id] = argv.filter((a, i) => !a.startsWith("--") && !VALUED.includes(argv[i - 1]));

const env = process.env;
const V = env.META_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${V}`;
const MEDIA = (env.ADS_MEDIA_BASE || "https://calecutech.com/geological-assistant/ads").replace(/\/$/, "");

function need(...names) {
  const missing = names.filter((n) => !env[n]);
  if (missing.length && live) throw new Error(`Missing secrets: ${missing.join(", ")}`);
}

let fakeId = 0;
async function api(method, path, params = {}) {
  const shown = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, k === "bytes" ? `<${v.length} base64 chars>` : v]));
  console.log(`${live ? "→" : "[dry run]"} ${method} ${path}`, JSON.stringify(shown, null, 2));
  if (!live) return { id: `DRY_${++fakeId}`, hash: `DRY_HASH_${fakeId}`, status_code: "FINISHED", data: [{ key: "DRY_REGION" }] };
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, typeof v === "string" ? v : JSON.stringify(v));
  body.set("access_token", env.META_ACCESS_TOKEN);
  const url = method === "GET" ? `${GRAPH}${path}?${body}` : `${GRAPH}${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${method} ${path} failed: ${JSON.stringify(json.error || json)}`);
  return json;
}

const caption = (c) => `${c.caption_en}\n\n${c.caption_ml}\n\n${cfg.hashtags}`;
const adById = (x) => {
  const ad = cfg.ads.find((a) => a.id === x);
  if (!ad) throw new Error(`Unknown ad id "${x}". Known: ${cfg.ads.map((a) => a.id).join(", ")}`);
  return ad;
};
const link = (content) =>
  `${cfg.course.url}?utm_source=instagram&utm_medium=paid&utm_campaign=ga-046-2026&utm_content=${content}`;

// Instagram content publishing: create a container, wait until it is processed, publish it.
async function publish(params) {
  need("META_ACCESS_TOKEN", "IG_USER_ID");
  const ig = env.IG_USER_ID || "IG_USER_ID";
  const { id: container } = await api("POST", `/${ig}/media`, params);
  for (let i = 0; i < 30; i++) {
    const { status_code } = await api("GET", `/${container}`, { fields: "status_code" });
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Container ${container}: ${status_code}`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  const { id: media } = await api("POST", `/${ig}/media_publish`, { creation_id: container });
  console.log(`Published media ${media}`);
  return media;
}

async function post(x) {
  const ad = adById(x);
  const media = await publish({ image_url: `${MEDIA}/${ad.id}-square.png`, caption: caption(ad) });
  if (ad.first_comment) await api("POST", `/${media}/comments`, { message: ad.first_comment });
}

async function story(x) {
  const ad = adById(x);
  await publish({ media_type: "STORIES", image_url: `${MEDIA}/${ad.id}-story.png` });
}

async function reel() {
  await publish({ media_type: "REELS", video_url: `${MEDIA}/reel-story.mp4`, caption: caption(cfg.reel), share_to_feed: "true" });
}

// Paid ads: one campaign per objective, one ad set (Kerala, Instagram placements), one ad per creative.
// Everything is created PAUSED, so nothing spends until it is switched on in Ads Manager.
const OBJECTIVE = { traffic: "OUTCOME_TRAFFIC", sales: "OUTCOME_TRAFFIC", engagement: "OUTCOME_ENGAGEMENT" };
const OPTIMISE = { OUTCOME_TRAFFIC: "LANDING_PAGE_VIEWS", OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT" };

async function ads() {
  need("META_ACCESS_TOKEN", "IG_USER_ID", "FB_PAGE_ID", "META_AD_ACCOUNT_ID");
  const act = `/act_${env.META_AD_ACCOUNT_ID || "AD_ACCOUNT_ID"}`;
  const ids = (flag("ids") || cfg.ads.map((a) => a.id).join(",")).split(",");
  const dailyRupees = Number(flag("daily", "400"));
  const start = flag("start", new Date(Date.now() + 864e5).toISOString().slice(0, 10));
  const end = flag("end", "2026-12-01");

  const { data: regions } = await api("GET", "/search", {
    type: "adgeolocation", q: "Kerala", location_types: ["region"], country_code: "IN",
  });
  if (!regions?.length) throw new Error("Could not resolve the Kerala region key");

  const groups = {};
  for (const x of ids) {
    const ad = adById(x);
    (groups[OBJECTIVE[ad.objective] || "OUTCOME_TRAFFIC"] ||= []).push(ad);
  }
  for (const [objective, list] of Object.entries(groups)) {
    const { id: campaign } = await api("POST", `${act}/campaigns`, {
      name: `GA 046/2026 · ${objective.replace("OUTCOME_", "").toLowerCase()}`,
      objective, status: "PAUSED", special_ad_categories: [], buying_type: "AUCTION",
    });
    const { id: adset } = await api("POST", `${act}/adsets`, {
      name: `Kerala 21-40 · Instagram · ₹${dailyRupees}/day`,
      campaign_id: campaign, status: "PAUSED",
      daily_budget: String(dailyRupees * 100), // paise
      billing_event: "IMPRESSIONS", optimization_goal: OPTIMISE[objective], bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      start_time: `${start}T06:00:00+0530`, end_time: `${end}T23:00:00+0530`,
      targeting: {
        geo_locations: { regions: [{ key: regions[0].key }] },
        age_min: 21, age_max: 40,
        publisher_platforms: ["instagram"], instagram_positions: ["stream", "story", "reels", "explore"],
      },
    });
    for (const ad of list) {
      const bytes = readFileSync(join(mediaDir, `${ad.id}-square.png`)).toString("base64");
      const img = await api("POST", `${act}/adimages`, { bytes });
      const hash = live ? Object.values(img.images)[0].hash : img.hash;
      const { id: creative } = await api("POST", `${act}/adcreatives`, {
        name: `GA ${ad.id}`,
        object_story_spec: {
          page_id: env.FB_PAGE_ID || "FB_PAGE_ID",
          instagram_user_id: env.IG_USER_ID || "IG_USER_ID",
          link_data: {
            image_hash: hash, link: link(ad.id), message: `${ad.caption_en}\n\n${ad.caption_ml}`,
            call_to_action: { type: ad.cta, value: { link: link(ad.id) } },
          },
        },
      });
      const { id: adId } = await api("POST", `${act}/ads`, {
        name: `GA ${ad.id}`, adset_id: adset, creative: { creative_id: creative }, status: "PAUSED",
      });
      console.log(`Ad ${ad.id}: ${adId} (PAUSED)`);
    }
  }
  console.log(live ? "Done. Review and switch the campaigns on in Ads Manager." : "Dry run only: nothing was sent. Add --live to create the PAUSED ads.");
}

const run = { post: () => post(id), story: () => story(id), reel, ads }[cmd];
if (!run) {
  console.error("Usage: publish.mjs post|story <id> | reel | ads [--ids a,b] [--daily 400] [--live]");
  process.exit(2);
}
await run();
