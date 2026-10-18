/**
 * The referral rules, checked without a server or a database.
 *
 *   npm test --workspace=apps/api
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  awardsDiamond,
  generateUserCode,
  isUserCode,
  maskDisplayName,
  playReferrerParam,
  rateBpsFor,
  userReferralLink,
  USER_CODE_ALPHABET,
} from "../src/lib/referral.ts";
import { commissionFor } from "../src/lib/money.ts";
import { hashApiKey, kindOfApiKey, mintApiKey } from "../src/lib/apikeys.ts";

const paid = { feePaise: 49900, sellerRateBps: 2000, userRateBps: 100 };
const free = { feePaise: null, sellerRateBps: 1000, userRateBps: 100 };

test("USER tier earns the product's user rate on a paid product", () => {
  assert.equal(rateBpsFor("USER", paid), 100);
  assert.equal(rateBpsFor("USER", { ...paid, userRateBps: 250 }), 250);
});

test("USER tier falls back to 1% when there is no product", () => {
  assert.equal(rateBpsFor("USER", null), 100);
  assert.equal(rateBpsFor("USER", { ...paid, userRateBps: null }), 100);
});

test("SELLER tier earns the product's seller rate", () => {
  assert.equal(rateBpsFor("SELLER", paid), 2000);
  assert.equal(rateBpsFor("SELLER", free), 1000);
  assert.equal(rateBpsFor("SELLER", null), 1000);
});

test("SELLER rate is clamped to the published 10%..30% band", () => {
  assert.equal(rateBpsFor("SELLER", { ...paid, sellerRateBps: 500 }), 1000);
  assert.equal(rateBpsFor("SELLER", { ...paid, sellerRateBps: 9000 }), 3000);
});

test("a diamond is awarded only to a USER-tier referrer on a free product", () => {
  assert.equal(awardsDiamond("USER", free), true);
  assert.equal(awardsDiamond("USER", paid), false);
  assert.equal(awardsDiamond("SELLER", free), false);
  assert.equal(awardsDiamond("SELLER", paid), false);
  assert.equal(awardsDiamond("USER", null), true);
});

test("the ledger arithmetic honours the chosen rate and TDS", () => {
  // Rs 499 net, 1% = Rs 4.99, TDS 2% = 9 paise (floored), net Rs 4.90.
  const user = commissionFor(49900, { rateBps: rateBpsFor("USER", paid) });
  assert.deepEqual(
    [user.grossCommissionPaise, user.tdsPaise, user.netCommissionPaise],
    [499, 9, 490],
  );
  // Same payment to a seller at 20%: Rs 99.80, TDS Rs 1.99, net Rs 97.81.
  const seller = commissionFor(49900, { rateBps: rateBpsFor("SELLER", paid) });
  assert.deepEqual(
    [seller.grossCommissionPaise, seller.tdsPaise, seller.netCommissionPaise],
    [9980, 199, 9781],
  );
  // The database CHECK: gross = base * rate / 10000, integer division.
  assert.equal(user.grossCommissionPaise, Math.floor((49900 * 100) / 10000));
});

test("invite codes are RF- plus six unambiguous characters", () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateUserCode();
    assert.match(code, /^RF-[0-9A-HJKMNP-TV-Z]{6}$/);
    assert.equal(isUserCode(code), true);
    for (const ch of code.slice(3)) assert.ok(USER_CODE_ALPHABET.includes(ch));
  }
  assert.equal(isUserCode("RF-ABCDEI"), false, "I is ambiguous");
  assert.equal(isUserCode("CA-KKD-000123"), false);
});

test("invite codes are deterministic for a given random source", () => {
  const zeros = (n: number) => new Uint8Array(n);
  assert.equal(generateUserCode(zeros), "RF-000000");
  const last = (n: number) => new Uint8Array(n).fill(31);
  assert.equal(generateUserCode(last), "RF-ZZZZZZ");
  const wrap = (n: number) => new Uint8Array(n).fill(32);
  assert.equal(generateUserCode(wrap), "RF-000000", "values wrap modulo the alphabet");
});

test("links and the Play install referrer carry the code", () => {
  process.env.PUBLIC_WEB_ORIGIN = "https://calecutech.com/";
  assert.equal(userReferralLink("RF-ABC234", "quizkerala"), "https://calecutech.com/r/RF-ABC234?app=quizkerala");
  assert.equal(playReferrerParam("RF-ABC234"), "referrer=ref%3DRF-ABC234");
});

test("leaderboard names are masked to first name and last initial", () => {
  assert.equal(maskDisplayName("Vivek Sankaran"), "Vivek S.");
  assert.equal(maskDisplayName("  Anu  "), "Anu");
  assert.equal(maskDisplayName("Mohammed Ali Jinnah"), "Mohammed J.");
  assert.equal(maskDisplayName(""), "Member");
  assert.equal(maskDisplayName(null), "Member");
});

test("API keys are prefixed by kind and stored only as a hash", () => {
  const client = mintApiKey("client");
  const server = mintApiKey("server");
  assert.match(client.plaintext, /^ck_live_[0-9a-hjkmnp-tv-z]{32}$/);
  assert.match(server.plaintext, /^sk_live_[0-9a-hjkmnp-tv-z]{32}$/);
  assert.equal(kindOfApiKey(client.plaintext), "client");
  assert.equal(kindOfApiKey(server.plaintext), "server");
  assert.equal(kindOfApiKey("Bearer eyJ"), null);
  assert.equal(client.hash, hashApiKey(client.plaintext));
  assert.equal(client.hash.length, 64);
  assert.notEqual(client.plaintext, server.plaintext);
});
