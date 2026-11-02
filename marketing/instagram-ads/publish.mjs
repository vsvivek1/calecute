// Posts the creatives in ads.json to Instagram as free (organic) posts, stories
// and reels. It never creates paid ads. Dry run by default: it prints every
// request and sends nothing unless --live is passed.
//
//   node marketing/instagram-ads/publish.mjs post  <id> [--live]   feed post (1080x1080) + answer comment
//   node marketing/instagram-ads/publish.mjs story <id> [--live]   story (1080x1920)
//   node marketing/instagram-ads/publish.mjs reel [id]  [--live]   the 13.5s quiz reel, or a concept's 8s reel
//   node marketing/instagram-ads/publish.mjs auto <am|pm> [--live] next item in the schedule (ads.json "schedule")
//   node marketing/instagram-ads/publish.mjs check                 read-only: confirms the secrets work
//
// Environment (GitHub Actions secrets, never committed):
//   META_ACCESS_TOKEN   long-lived system-user token (see README.md for the permissions)
//   IG_USER_ID          Instagram professional account id
//   META_GRAPH_VERSION  optional, defaults to v23.0
//   ADS_MEDIA_BASE      optional public URL of the rendered files,
//                       defaults to https://calecutech.com/geological-assistant/ads
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(here, "ads.json"), "utf8"));

const argv = process.argv.slice(2);
const live = argv.includes("--live");
const [cmd, id] = argv.filter((a) => !a.startsWith("--"));

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
  console.log(`${live ? "→" : "[dry run]"} ${method} ${path}`, JSON.stringify(params, null, 2));
  if (!live) return { id: `DRY_${++fakeId}`, status_code: "FINISHED" };
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, typeof v === "string" ? v : JSON.stringify(v));
  body.set("access_token", env.META_ACCESS_TOKEN);
  const url = method === "GET" ? `${GRAPH}${path}?${body}` : `${GRAPH}${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method, body });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`${method} ${path} failed: ${JSON.stringify(json.error || json)}`);
  return json;
}

const caption = (c) => `${c.caption_en}\n\n${cfg.hashtags}`;
const adById = (x) => {
  const ad = cfg.ads.find((a) => a.id === x);
  if (!ad) throw new Error(`Unknown ad id "${x}". Known: ${cfg.ads.map((a) => a.id).join(", ")}`);
  return ad;
};

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

// No id: the main quiz reel. With an id: that concept's short reel (rendered when ads.json sets "reel": true).
async function reel(x) {
  const ad = x ? adById(x) : cfg.reel;
  const file = x ? `${ad.id}-reel.mp4` : "reel-story.mp4";
  await publish({ media_type: "REELS", video_url: `${MEDIA}/${file}`, caption: caption(ad), share_to_feed: "true" });
}

// Read-only: confirms the token and account id work. Always talks to Meta, never posts.
async function check() {
  if (!env.META_ACCESS_TOKEN || !env.IG_USER_ID) throw new Error("Missing secrets: META_ACCESS_TOKEN and/or IG_USER_ID");
  const params = new URLSearchParams({ fields: "username,name,media_count,followers_count", access_token: env.META_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${env.IG_USER_ID}?${params}`);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`Check failed: ${JSON.stringify(json.error || json)}`);
  console.log(`OK: connected to @${json.username} (${json.media_count} posts, ${json.followers_count} followers). Nothing was posted.`);
}

// Scheduled posting: "am" posts the next feed item, "pm" the next story.
// The item is picked by days since schedule.start, so each slot walks its list in order.
async function auto(slot) {
  const s = cfg.schedule;
  const list = s[slot];
  if (!list) throw new Error(`Unknown slot "${slot}". Use: ${Object.keys(s).filter((k) => Array.isArray(s[k])).join(", ")}`);
  const day = Math.floor((Date.now() - Date.parse(s.start)) / 86_400_000);
  if (day < 0) return console.log(`Schedule starts ${s.start}; nothing to post yet.`);
  const item = list[day % list.length];
  console.log(`Day ${day}, ${slot}: ${item}`);
  const [kind, x] = item.split(":");
  if (kind === "reel") return reel(x);
  if (kind === "post") return post(x);
  if (kind === "story") return story(x);
  throw new Error(`Bad schedule item "${item}"`);
}

const run = { post: () => post(id), story: () => story(id), reel: () => reel(id), check, auto: () => auto(id) }[cmd];
if (!run) {
  console.error("Usage: publish.mjs check | post|story <id> | reel [id] | auto <am|pm> [--live]");
  process.exit(2);
}
await run();
