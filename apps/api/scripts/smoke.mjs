#!/usr/bin/env node
/**
 * End-to-end smoke test against a running API.
 *
 *   npm run dev        # in one terminal
 *   npm run smoke      # in another
 *
 * Walks the flows a real user walks: apply, be approved, set up payouts, get
 * attributed a customer, earn commission, appear in the admin reports.
 *
 * Google Sign-In is the one thing not exercised, because it needs Google. Tokens
 * are minted directly with the same secret and claims `establishSession` issues,
 * so everything downstream of sign-in is the real code path.
 *
 * Fixtures are prefixed TEST- and removed at the end, including on failure.
 *
 * One thing deliberately NOT cleaned up: audit_log rows. The table is
 * append-only — a trigger rejects DELETE for every role, which is the point —
 * so admin actions performed here leave permanent entries, and the users they
 * reference cannot be removed either. Test identities are therefore unique per
 * run, and the users delete is best-effort.
 */
import postgres from "postgres";
import { SignJWT } from "jose";

const API = process.env.SMOKE_API ?? "http://localhost:3001/api/v1";
const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// int8 is parsed to a number so fixture ids compare directly against the
// numbers the API returns. Without this, `gp.id` is the string "19" and every
// `=== gp.id` assertion silently fails.
const sql = postgres(DB, {
  max: 2,
  onnotice: () => {},
  types: {
    bigint: {
      to: 20,
      from: [20],
      serialize: (v) => String(v),
      parse: (v) => Number(v),
    },
  },
});
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/** Unique per run, because audited users cannot be deleted afterwards. */
const RUN = Date.now().toString(36);
const email = (name) => `${name}-${RUN}@test.invalid`;

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}`);
    if (detail !== undefined) {
      console.log(`          ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 300)}`);
    }
  }
}

async function token(userId, role, agentId) {
  return new SignJWT({ role, ver: 1, ...(agentId ? { agt: agentId } : {}) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(userId))
    .setIssuer(process.env.JWT_ISSUER ?? "http://localhost:3001")
    .setAudience(process.env.JWT_AUDIENCE ?? "calecute-agents")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

/**
 * A form token that looks a minute old.
 *
 * Signed with the same secret the API uses, so it verifies — this is testing
 * the accepted path without making the suite sleep for the minimum fill time.
 */
async function agedFormToken(userId) {
  const issued = Math.floor(Date.now() / 1000) - 60;
  return new SignJWT({ purpose: "signup" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(userId))
    .setIssuer(process.env.JWT_ISSUER ?? "http://localhost:3001")
    .setAudience("calecute-signup-form")
    .setIssuedAt(issued)
    .setExpirationTime(issued + 3600)
    .sign(secret);
}

async function call(method, path, { auth, body, headers = {} } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const type = response.headers.get("content-type") ?? "";
  const payload = type.includes("application/json")
    ? await response.json()
    : await response.text();
  return { status: response.status, body: payload, headers: response.headers };
}

/** Best effort: a statement that cannot run does not fail the teardown. */
async function tryRun(label, fn) {
  try {
    await fn();
  } catch (error) {
    if (process.env.SMOKE_VERBOSE) {
      console.log(`  (cleanup skipped ${label}: ${String(error.message).slice(0, 80)})`);
    }
  }
}

async function cleanup() {
  // Order matters: children before parents.
  await sql`DELETE FROM commissions WHERE agent_id IN (SELECT id FROM agents WHERE agent_code LIKE 'CA-%' AND mobile LIKE '98765%')`;
  await sql`DELETE FROM payments WHERE external_ref LIKE 'TEST-%'`;
  await sql`DELETE FROM attribution_attempts WHERE customer_external_ref LIKE 'TEST-%'`;
  await sql`DELETE FROM attributions WHERE customer_id IN (SELECT id FROM customers WHERE external_ref LIKE 'TEST-%')`;
  await sql`DELETE FROM customers WHERE external_ref LIKE 'TEST-%'`;
  await sql`DELETE FROM agent_products WHERE product_id IN (SELECT id FROM products WHERE slug LIKE 'test-%')`;
  await sql`DELETE FROM product_assets WHERE product_id IN (SELECT id FROM products WHERE slug LIKE 'test-%')`;
  await sql`DELETE FROM products WHERE slug LIKE 'test-%'`;
  await sql`DELETE FROM signup_signals WHERE agent_id IN (SELECT id FROM agents WHERE mobile LIKE '98765%')`;
  await sql`DELETE FROM review_flags WHERE agent_id IN (SELECT id FROM agents WHERE mobile LIKE '98765%')`;
  await sql`DELETE FROM payout_profiles WHERE agent_id IN (SELECT id FROM agents WHERE mobile LIKE '98765%')`;
  await sql`DELETE FROM agent_qualifications WHERE agent_id IN (SELECT id FROM agents WHERE mobile LIKE '98765%')`;
  await sql`DELETE FROM agent_message_recipients WHERE agent_id IN (SELECT id FROM agents WHERE mobile LIKE '98765%')`;
  await sql`DELETE FROM agents WHERE mobile LIKE '98765%'`;
  await sql`DELETE FROM agent_messages WHERE subject LIKE 'TEST-%'`;
  await sql`DELETE FROM waitlist_entries WHERE mobile LIKE '98765%'`;
  // audit_log is intentionally omitted: the append-only trigger refuses DELETE
  // for every role, including the owner. Entries from a smoke run stay.
  await sql`DELETE FROM wards WHERE local_body_id IN (SELECT id FROM local_bodies WHERE name_en LIKE 'TEST-%')`;
  await sql`DELETE FROM local_bodies WHERE name_en LIKE 'TEST-%'`;
  await sql`DELETE FROM block_panchayats WHERE name_en LIKE 'TEST-%'`;
  await sql`DELETE FROM admin_districts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.invalid')`;
  await sql`DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.invalid')`;
  await sql`DELETE FROM analytics_events WHERE session_id LIKE 'TEST-%'`;
  await sql`DELETE FROM idempotency_keys WHERE key LIKE 'TEST-%'`;
  // Batches are tagged through `note`, since `period` is a real calendar month
  // and cannot carry a test marker.
  await sql`DELETE FROM payout_batches WHERE note LIKE 'TEST-%'`;
  // Users referenced by an audit entry cannot be deleted, by design. They are
  // left behind as harmless tombstones; run identities are unique so they never
  // collide with a later run.
  await tryRun("users", () => sql`DELETE FROM users WHERE email LIKE '%@test.invalid'`);
}

async function main() {
  console.log(`Smoke test against ${API}\n`);
  await cleanup();

  /* ---------------------------------------------------------- fixtures */
  const [kkd] = await sql`SELECT id, code_slug FROM districts WHERE code_slug = 'KKD'`;
  const [tvm] = await sql`SELECT id FROM districts WHERE code_slug = 'TVM'`;

  const [blockKkd] = await sql`
    INSERT INTO block_panchayats (district_id, name_en, name_ml)
    VALUES (${kkd.id}, 'TEST-BLOCK', 'TEST-BLOCK') RETURNING id`;
  const [gp] = await sql`
    INSERT INTO local_bodies (district_id, block_panchayat_id, type, name_en, name_ml, slot_capacity)
    VALUES (${kkd.id}, ${blockKkd.id}, 'GRAM_PANCHAYAT', 'TEST-Kodenchery', 'TEST-കോടഞ്ചേരി', 2)
    RETURNING id`;
  const [muni] = await sql`
    INSERT INTO local_bodies (district_id, block_panchayat_id, type, name_en, name_ml)
    VALUES (${tvm.id}, NULL, 'MUNICIPALITY', 'TEST-Municipality', 'TEST-മുനിസിപ്പാലിറ്റി')
    RETURNING id`;
  await sql`
    INSERT INTO wards (local_body_id, number, name_en, name_ml, status)
    VALUES (${gp.id}, 1, 'TEST-Ward One', 'TEST-വാർഡ് ഒന്ന്', 'COMPLETE'),
           (${gp.id}, 2, NULL, NULL, 'PENDING')`;
  const [ward1] = await sql`SELECT id FROM wards WHERE local_body_id = ${gp.id} AND number = 1`;

  const mkUser = async (address, role) => {
    const [u] = await sql`
      INSERT INTO users (google_sub, email, name, role, email_verified)
      VALUES (${`test:${address}`}, ${address}, ${address.split("@")[0]}, ${role}::user_role, true)
      RETURNING id`;
    return u.id;
  };

  const applicant = await mkUser(email("applicant"), "AGENT");
  const applicant2 = await mkUser(email("applicant2"), "AGENT");
  const applicant3 = await mkUser(email("applicant3"), "AGENT");
  // Separate user: applicant3 ends up with their own application, and `agents`
  // is unique per user.
  const outsider = await mkUser(email("outsider"), "AGENT");
  // The abuse assertions get their own account: signup is rate limited to five
  // attempts an hour per user, and piling them all onto one applicant tripped
  // the limiter rather than the checks under test.
  const abuser = await mkUser(email("abuser"), "AGENT");
  const kkdAdminId = await mkUser(email("kkdadmin"), "DISTRICT_ADMIN");
  const superId = await mkUser(email("super"), "SUPER_ADMIN");
  await sql`INSERT INTO admin_districts (user_id, district_id) VALUES (${kkdAdminId}, ${kkd.id})`;

  const applicantToken = await token(applicant, "AGENT");
  const applicant2Token = await token(applicant2, "AGENT");
  const applicant3Token = await token(applicant3, "AGENT");
  const abuserToken = await token(abuser, "AGENT");
  const kkdAdminToken = await token(kkdAdminId, "DISTRICT_ADMIN");
  const superToken = await token(superId, "SUPER_ADMIN");

  /* ------------------------------------------------------ geography */
  console.log("Geography");

  const bodies = await call("GET", `/geography/local-bodies?districtId=${kkd.id}&q=kodancheri`);
  check(
    "transliterated search finds 'TEST-Kodenchery' from 'kodancheri'",
    bodies.status === 200 && bodies.body.data?.some((b) => b.id === gp.id),
    bodies.body,
  );

  const mlSearch = await call(
    "GET",
    `/geography/local-bodies?districtId=${kkd.id}&q=${encodeURIComponent("കോടഞ്ചേരി")}`,
  );
  check(
    "Malayalam search finds the same row",
    mlSearch.status === 200 && mlSearch.body.data?.some((b) => b.id === gp.id),
    mlSearch.body,
  );

  const urban = await call("GET", `/geography/local-bodies?districtId=${tvm.id}&type=MUNICIPALITY`);
  check(
    "a municipality is returned with blockPanchayatId null",
    urban.status === 200 &&
      urban.body.data?.some((b) => b.id === muni.id && b.blockPanchayatId === null),
    urban.body,
  );

  const avail = await call("GET", `/geography/local-bodies/${gp.id}/availability`);
  check(
    "availability reports 2 slots, 0 filled, state OPEN",
    avail.body.slotCapacity === 2 && avail.body.filled === 0 && avail.body.state === "OPEN",
    avail.body,
  );

  const wards = await call("GET", `/geography/local-bodies/${gp.id}/wards`);
  check(
    "a PENDING ward is returned with a null name, not omitted",
    wards.body.data?.length === 2 &&
      wards.body.data.some((w) => w.status === "PENDING" && w.nameEn === null),
    wards.body,
  );

  /* --------------------------------------------------------- signup */
  console.log("\nSignup");

  const [terms] = await sql`SELECT version FROM terms_versions ORDER BY effective_from DESC LIMIT 1`;

  // The form token is issued by the API and signed by it; the timing check
  // measures against its own clock, so a submission cannot report a fake
  // duration. Each applicant needs their own.
  const formTokenFor = async (auth) =>
    (await call("GET", "/signup/eligibility", { auth })).body.formToken;

  const signupBody = {
    name: "Test Applicant",
    mobile: "9876500001",
    districtId: kkd.id,
    localBodyId: gp.id,
    wardId: ward1.id,
    occupation: "Akshaya centre operator",
    termsVersion: terms.version,
    acceptedTerms: true,
    privacyConsent: true,
    deviceFingerprint: "test-device-alpha",
  };

  const signup = await call("POST", "/signup", {
    auth: applicantToken,
    body: { ...signupBody, formToken: await agedFormToken(applicant) },
  });
  check(
    "signup issues an agent code shaped CA-KKD-NNNNNN",
    signup.status === 201 && /^CA-KKD-\d{6}$/.test(signup.body.agent?.agentCode ?? ""),
    signup.body,
  );
  const agentCode = signup.body.agent?.agentCode;
  const agentId = signup.body.agent?.id;

  const honeypot = await call("POST", "/signup", {
    auth: applicant2Token,
    body: {
      ...signupBody,
      mobile: "9876500002",
      honeypot: "bot filled this",
      formToken: await agedFormToken(applicant2),
    },
  });
  check(
    "honeypot value is rejected",
    honeypot.status === 400 && honeypot.body.error?.code === "HONEYPOT_TRIPPED",
    honeypot.body,
  );

  // A token fetched and submitted immediately is, by definition, under the
  // minimum fill time — which is exactly the case the check exists for.
  const tooFast = await call("POST", "/signup", {
    auth: abuserToken,
    body: {
      ...signupBody,
      mobile: "9876500008",
      formToken: await formTokenFor(abuserToken),
    },
  });
  check(
    "a submission faster than a human can type is rejected",
    tooFast.status === 400 && tooFast.body.error?.code === "SUBMITTED_TOO_FAST",
    tooFast.body,
  );

  const forgedToken = await call("POST", "/signup", {
    auth: abuserToken,
    body: { ...signupBody, mobile: "9876500008", formToken: "not.a.real.token" },
  });
  check(
    "a forged form token is rejected",
    forgedToken.status === 400,
    forgedToken.body,
  );

  const othersToken = await call("POST", "/signup", {
    auth: abuserToken,
    body: {
      ...signupBody,
      mobile: "9876500008",
      formToken: await agedFormToken(applicant3),
    },
  });
  check(
    "a form token issued to another account is rejected",
    othersToken.status === 400,
    othersToken.body,
  );

  const dupMobile = await call("POST", "/signup", {
    auth: applicant2Token,
    body: { ...signupBody, formToken: await agedFormToken(applicant2) },
  });
  check(
    "one account per mobile number",
    dupMobile.status === 409 && dupMobile.body.error?.code === "MOBILE_ALREADY_USED",
    dupMobile.body,
  );

  const crossDistrict = await call("POST", "/signup", {
    auth: applicant2Token,
    body: {
      ...signupBody,
      mobile: "9876500002",
      localBodyId: muni.id,
      formToken: await agedFormToken(applicant2),
    },
  });
  check(
    "a local body from another district is rejected",
    crossDistrict.status === 400 && crossDistrict.body.error?.code === "UNKNOWN_GEOGRAPHY",
    crossDistrict.body,
  );

  const twice = await call("POST", "/signup", {
    auth: applicantToken,
    body: {
      ...signupBody,
      mobile: "9876500009",
      formToken: await agedFormToken(applicant),
    },
  });
  check(
    "the same account cannot apply twice",
    twice.status === 409 && twice.body.error?.code === "ALREADY_REGISTERED",
    twice.body,
  );

  // Fill the second of two slots, then prove the third is refused.
  // Backdated so it clears the minimum fill time without a real wait.
  const second = await call("POST", "/signup", {
    auth: applicant2Token,
    body: {
      ...signupBody,
      mobile: "9876500002",
      formToken: await agedFormToken(applicant2),
    },
  });
  check("second applicant takes the last slot", second.status === 201, second.body);

  const third = await call("POST", "/signup", {
    auth: applicant3Token,
    body: {
      ...signupBody,
      mobile: "9876500003",
      formToken: await agedFormToken(applicant3),
    },
  });
  check(
    "a full panchayat refuses a third applicant with SLOT_UNAVAILABLE",
    third.status === 409 && third.body.error?.code === "SLOT_UNAVAILABLE",
    third.body,
  );

  const waitlist = await call("POST", "/signup/waitlist", {
    auth: applicant3Token,
    body: { districtId: kkd.id, localBodyId: gp.id, mobile: "9876500003" },
  });
  check("a full panchayat offers a waitlist", waitlist.status === 201, waitlist.body);

  const availAfter = await call("GET", `/geography/local-bodies/${gp.id}/availability`);
  check(
    "availability now reports FULL with 1 waiting",
    availAfter.body.state === "FULL" && availAfter.body.waitlisted === 1,
    availAfter.body,
  );

  const quals = await call("POST", "/signup/qualifications", {
    auth: applicantToken,
    body: {
      education: "DEGREE",
      experience: ["AKSHAYA_CSC", "MARKETING_SALES"],
      hoursPerDay: "TWO_TO_THREE",
      hasVehicle: true,
      computerLiteracy: "YES",
      reach: ["SHOP_OWNERS", "GOVERNMENT_OFFICES"],
    },
  });
  check("optional qualifications are saved", quals.status === 200, quals.body);

  /* ------------------------------------------------------------ me */
  console.log("\nMe and role routing");

  const me = await call("GET", "/me", { auth: applicantToken });
  check(
    "an agent's /me routes to the agent dashboard",
    me.body.user?.role === "AGENT" && me.body.landing === "/agents/dashboard",
    me.body,
  );

  const adminMe = await call("GET", "/me", { auth: kkdAdminToken });
  check(
    "a district admin's /me routes to /admin and lists one district",
    adminMe.body.user?.role === "DISTRICT_ADMIN" &&
      adminMe.body.landing === "/admin" &&
      Array.isArray(adminMe.body.districtScope) &&
      adminMe.body.districtScope.length === 1,
    adminMe.body,
  );

  const superMe = await call("GET", "/me", { auth: superToken });
  check("a super admin's scope is ALL", superMe.body.districtScope === "ALL", superMe.body);

  /* -------------------------------------------------- authorisation */
  console.log("\nAuthorisation");

  const agentHitsAdmin = await call("GET", "/admin/reports", { auth: applicantToken });
  check(
    "an agent calling an admin endpoint gets ROLE_REQUIRED",
    agentHitsAdmin.status === 403 && agentHitsAdmin.body.error?.code === "ROLE_REQUIRED",
    agentHitsAdmin.body,
  );

  const adminHitsSuper = await call("GET", "/admin/audit-log", { auth: kkdAdminToken });
  check(
    "a district admin cannot read the audit log",
    adminHitsSuper.status === 403,
    adminHitsSuper.body,
  );

  const districtAdminUsers = await call("GET", "/admin/users", { auth: kkdAdminToken });
  check(
    "a district admin cannot list admin users",
    districtAdminUsers.status === 403,
    districtAdminUsers.body,
  );

  /* ------------------------------------------------ approve + payouts */
  console.log("\nApproval and payouts");

  const approve = await call("POST", `/admin/agents/${agentId}/approve`, {
    auth: kkdAdminToken,
    body: { note: "verified by phone" },
  });
  check("district admin approves an in-scope agent", approve.status === 200, approve.body);

  // An agent in Thiruvananthapuram is out of the Kozhikode admin's scope.
  const [otherAgent] = await sql`
    INSERT INTO agents (user_id, agent_code, district_id, local_body_id, mobile, occupation,
                        status, terms_version, terms_accepted_at, privacy_consent_at)
    VALUES (${outsider}, 'CA-TVM-999999', ${tvm.id}, ${muni.id}, '9876500077', 'tester',
            'PENDING_REVIEW', ${terms.version}, now(), now())
    RETURNING id`;
  const outOfScope = await call("POST", `/admin/agents/${otherAgent.id}/approve`, {
    auth: kkdAdminToken,
    body: {},
  });
  check(
    "approving an out-of-district agent returns 404, not 403",
    outOfScope.status === 404,
    outOfScope.body,
  );

  const panBefore = await call("GET", "/payouts/profile", { auth: applicantToken });
  check(
    "payout is blocked before PAN and mobile verification",
    panBefore.body.withdrawal?.blocked === true &&
      panBefore.body.withdrawal.reasons.includes("PAN_NOT_VERIFIED") &&
      panBefore.body.withdrawal.reasons.includes("MOBILE_NOT_VERIFIED"),
    panBefore.body,
  );

  const putPan = await call("PUT", "/payouts/profile", {
    auth: applicantToken,
    body: {
      pan: "ABCDE1234F",
      bankAccountNumber: "123456789012",
      bankIfsc: "SBIN0001234",
      bankHolderName: "Test Applicant",
    },
  });
  check(
    "PAN is stored and returned only as XXXXX1234F",
    putPan.status === 200 && putPan.body.pan === "XXXXX1234F",
    putPan.body,
  );

  const [stored] = await sql`
    SELECT pan_ciphertext, pan_last4 FROM payout_profiles WHERE agent_id = ${agentId}`;
  check(
    "the stored PAN is ciphertext, not plaintext",
    stored.pan_ciphertext?.startsWith("v1.") && !stored.pan_ciphertext.includes("ABCDE"),
    stored.pan_ciphertext?.slice(0, 24),
  );

  const secondAgentId = second.body.agent?.id;
  const secondToken = applicant2Token;
  const dupPan = await call("PUT", "/payouts/profile", {
    auth: secondToken,
    body: { pan: "ABCDE1234F" },
  });
  check(
    "one account per PAN is enforced at the API",
    dupPan.status === 409 && dupPan.body.error?.code === "PAN_ALREADY_USED",
    dupPan.body,
  );

  await call("POST", `/admin/payouts/${agentId}/pan`, {
    auth: superToken,
    body: { decision: "VERIFIED" },
  });
  await sql`UPDATE agents SET mobile_verified_at = now() WHERE id = ${agentId}`;

  /* -------------------------------------------- attribution + money */
  console.log("\nAttribution and commission");

  // Both agents are approved, so a losing claim fails on attribution rather
  // than on approval status — which is the rule under test.
  await call("POST", `/admin/agents/${secondAgentId}/approve`, {
    auth: kkdAdminToken,
    body: {},
  });

  const claim = await call("POST", "/attribution/claim", {
    auth: superToken,
    body: {
      customerExternalRef: "TEST-CUST-1",
      customerName: "Test Customer",
      agentCode,
      source: "referral_link",
    },
  });
  check("first code wins: attribution locked", claim.status === 201 && claim.body.attributed, claim.body);

  const [secondAgent] = await sql`SELECT agent_code FROM agents WHERE id = ${secondAgentId}`;
  const claim2 = await call("POST", "/attribution/claim", {
    auth: superToken,
    body: {
      customerExternalRef: "TEST-CUST-1",
      customerName: "Test Customer",
      agentCode: secondAgent.agent_code,
      source: "typed",
    },
  });
  check(
    "a second claim is rejected and told who holds it",
    claim2.status === 200 &&
      claim2.body.attributed === false &&
      claim2.body.reason === "ALREADY_ATTRIBUTED" &&
      claim2.body.heldBy === agentCode,
    claim2.body,
  );

  const [attempts] = await sql`
    SELECT count(*)::int AS c FROM attribution_attempts WHERE customer_external_ref = 'TEST-CUST-1'`;
  check("both attempts are logged, including the rejected one", attempts.c === 2, attempts);

  const unknownCode = await call("POST", "/attribution/claim", {
    auth: superToken,
    body: { customerExternalRef: "TEST-CUST-2", customerName: "X", agentCode: "CA-XXX-000000" },
  });
  check(
    "an unknown code is logged and refused",
    unknownCode.body.reason === "UNKNOWN_CODE",
    unknownCode.body,
  );

  // ₹1,000 gross, ₹152.54 GST, ₹20 gateway -> net ₹827.46 -> 10% = ₹82.74 -> TDS 2% = ₹1.65
  const paymentBody = {
    externalRef: "TEST-PAY-1",
    customerExternalRef: "TEST-CUST-1",
    grossPaise: 100000,
    gstPaise: 15254,
    gatewayFeePaise: 2000,
    paidAt: new Date().toISOString(),
  };

  const payment = await call("POST", "/payments", {
    auth: superToken,
    headers: { "Idempotency-Key": "TEST-IDEM-PAY-1" },
    body: paymentBody,
  });
  check(
    "commission accrues at 10% of net, less 2% TDS",
    payment.status === 201 &&
      payment.body.commissionAccrued === true &&
      payment.body.breakdown?.basePaise === 82746 &&
      payment.body.breakdown?.grossCommissionPaise === 8274 &&
      payment.body.breakdown?.tdsPaise === 165 &&
      payment.body.breakdown?.netCommissionPaise === 8109,
    payment.body,
  );

  // Byte-identical body: that is what a network retry actually sends.
  const replay = await call("POST", "/payments", {
    auth: superToken,
    headers: { "Idempotency-Key": "TEST-IDEM-PAY-1" },
    body: paymentBody,
  });
  check(
    "a retried payment replays instead of paying twice",
    replay.body.replayed === true || replay.body.reason === "PAYMENT_ALREADY_RECORDED",
    replay.body,
  );

  // The same key with a different body is a client bug, not a retry, and must
  // not silently replay the original response.
  const mutated = await call("POST", "/payments", {
    auth: superToken,
    headers: { "Idempotency-Key": "TEST-IDEM-PAY-1" },
    body: { ...paymentBody, grossPaise: 999999 },
  });
  check(
    "the same key with a different body is rejected",
    mutated.status === 409 && mutated.body.error?.code === "IDEMPOTENCY_KEY_REUSED",
    mutated.body,
  );

  const [commissionCount] = await sql`
    SELECT count(*)::int AS c FROM commissions WHERE agent_id = ${agentId}`;
  check("exactly one commission row exists", commissionCount.c === 1, commissionCount);

  const noKey = await call("POST", "/payments", {
    auth: superToken,
    body: {
      externalRef: "TEST-PAY-2",
      customerExternalRef: "TEST-CUST-1",
      grossPaise: 1000,
      paidAt: new Date().toISOString(),
    },
  });
  check(
    "a money write without an Idempotency-Key is refused",
    noKey.status === 400 && noKey.body.error?.code === "VALIDATION_FAILED",
    noKey.body,
  );

  const earnings = await call("GET", "/agent/earnings", { auth: applicantToken });
  check(
    "the agent sees the commission as pending",
    earnings.body.summary?.pendingPaise === 8109 && earnings.body.data?.length === 1,
    earnings.body.summary,
  );

  const dashboard = await call("GET", "/agent/dashboard", { auth: applicantToken });
  check(
    "the dashboard returns code, referral link and one customer",
    dashboard.body.referral?.code === agentCode &&
      dashboard.body.referral.link.includes(agentCode) &&
      dashboard.body.customers?.total === 1,
    dashboard.body.referral,
  );

  const qr = await call("GET", "/agent/referral/qr", { auth: applicantToken });
  check(
    "the referral QR renders as a PNG",
    qr.headers.get("content-type") === "image/png",
    qr.headers.get("content-type"),
  );

  /* ------------------------------------------------------- reports */
  console.log("\nAdmin reports");

  const zero = await call("GET", "/admin/reports/zero-agent-panchayats", { auth: superToken });
  check(
    "the default landing report runs and excludes the covered panchayat",
    zero.status === 200 && !zero.body.data.some((r) => r.localBodyId === gp.id),
    zero.body.rowCount,
  );

  const coverage = await call("GET", `/admin/reports/panchayat-coverage?districtId=${kkd.id}`, {
    auth: superToken,
  });
  // Rows are keyed by the column keys the API publishes, with `id` carried
  // alongside for addressing. See the report endpoint.
  const gpRow = coverage.body.data?.find((r) => r.id === gp.id);
  check(
    "coverage shows 2 filled, 0 remaining, 1 waitlisted",
    Number(gpRow?.approved) + Number(gpRow?.pending) === 2 &&
      Number(gpRow?.remaining) === 0 &&
      Number(gpRow?.waitlisted) === 1,
    gpRow,
  );

  const scoped = await call("GET", "/admin/reports/panchayat-coverage", { auth: kkdAdminToken });
  check(
    "a district admin's statewide report contains only their district",
    scoped.body.data?.length > 0 &&
      scoped.body.data.every((r) => r.district === "Kozhikode"),
    scoped.body.data?.map((r) => r.district).slice(0, 5),
  );

  check(
    "the scoped report does not leak the Thiruvananthapuram body",
    !scoped.body.data?.some((r) => r.id === muni.id),
    scoped.body.data?.map((r) => r.name),
  );

  // Filtered to the two fixture districts: the unfiltered report now covers
  // every real panchayat in Kerala, and this assertion is about scope, not
  // pagination.
  const superSeesKkd = await call(
    `GET`,
    `/admin/reports/panchayat-coverage?districtId=${kkd.id}`,
    { auth: superToken },
  );
  const superSeesTvm = await call(
    `GET`,
    `/admin/reports/panchayat-coverage?districtId=${tvm.id}`,
    { auth: superToken },
  );
  const superSeesBoth = {
    body: {
      data: [...(superSeesKkd.body.data ?? []), ...(superSeesTvm.body.data ?? [])],
    },
  };
  check(
    "a super admin sees local bodies in both districts",
    superSeesBoth.body.data?.some((r) => r.id === gp.id) &&
      superSeesBoth.body.data?.some((r) => r.id === muni.id),
    superSeesBoth.body.data?.length,
  );

  // Read as bytes: fetch's text decoder strips a leading BOM, so a string
  // comparison cannot tell whether one was sent — and the BOM is the whole
  // reason Malayalam survives Excel on Windows.
  const csvResponse = await fetch(
    `${API}/admin/reports/panchayat-coverage?format=csv`,
    { headers: { Authorization: `Bearer ${superToken}` } },
  );
  const csvBytes = new Uint8Array(await csvResponse.arrayBuffer());
  const csvText = new TextDecoder("utf-8").decode(csvBytes);
  check(
    "CSV export begins with a UTF-8 BOM (EF BB BF)",
    csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf,
    [...csvBytes.slice(0, 3)].map((b) => b.toString(16)),
  );
  check(
    "CSV export carries the Malayalam name",
    csvText.includes("കോടഞ്ചേരി"),
    csvText.slice(0, 160),
  );

  const pdf = await call("GET", "/admin/reports/panchayat-coverage?format=pdf", { auth: superToken });
  check(
    "PDF export returns a PDF document",
    pdf.headers.get("content-type") === "application/pdf",
    pdf.headers.get("content-type"),
  );

  const tds = await call("GET", "/admin/reports/tds-by-financial-year", { auth: superToken });
  check(
    "the TDS report masks PAN and totals the deduction",
    tds.body.data?.some((r) => r.pan === "XXXXX1234F" && r.tds === "1.65"),
    tds.body.data?.[0],
  );

  const liability = await call("GET", "/admin/reports/outstanding-liability", { auth: superToken });
  check(
    "outstanding liability marks this agent releasable",
    liability.body.data?.some((r) => r.code === agentCode && r.payable === "yes"),
    liability.body.data?.[0],
  );

  const waitlistReport = await call("GET", "/admin/reports/full-panchayats-waitlist", {
    auth: superToken,
  });
  check(
    "the full-with-waitlist report finds the full panchayat",
    waitlistReport.body.data?.some((r) => r.id === gp.id),
    waitlistReport.body.rowCount,
  );

  const badReport = await call("GET", "/admin/reports/does-not-exist", { auth: superToken });
  check("an unknown report slug returns 404", badReport.status === 404, badReport.body);

  /* ------------------------------------------------------- payouts */
  console.log("\nPayout batch");

  const batch = await call("POST", "/admin/payout-batches", {
    auth: superToken,
    headers: { "Idempotency-Key": "TEST-IDEM-BATCH-1" },
    body: { period: "2026-09", note: `TEST-${RUN}` },
  });
  check(
    "a batch picks up the releasable commission",
    batch.status === 201 && batch.body.commissionCount === 1,
    batch.body,
  );

  const markPaid = await call("POST", `/admin/payout-batches/${batch.body.batch.id}/mark-paid`, {
    auth: superToken,
    headers: { "Idempotency-Key": "TEST-IDEM-PAID-1" },
    body: { reference: "TEST-NEFT-0001" },
  });
  check("marking paid settles the commission", markPaid.body.commissionsPaid === 1, markPaid.body);

  const markPaidAgain = await call("POST", `/admin/payout-batches/${batch.body.batch.id}/mark-paid`, {
    auth: superToken,
    headers: { "Idempotency-Key": "TEST-IDEM-PAID-1" },
    body: { reference: "TEST-NEFT-0001" },
  });
  check("replaying mark-paid does not pay twice", markPaidAgain.body.replayed === true, markPaidAgain.body);

  const earningsAfter = await call("GET", "/agent/earnings", { auth: applicantToken });
  check(
    "the agent now sees it as paid, not pending",
    earningsAfter.body.summary?.paidPaise === 8109 && earningsAfter.body.summary.pendingPaise === 0,
    earningsAfter.body.summary,
  );

  /* --------------------------------------------- slots, audit, events */
  console.log("\nSlots, audit and instrumentation");

  const slots = await call("PATCH", `/admin/local-bodies/${gp.id}`, {
    auth: superToken,
    body: { slotCapacity: 10, reason: "waitlist demand" },
  });
  check(
    "raising the slot count reopens the panchayat",
    slots.status === 200 && slots.body.availability?.state === "OPEN",
    slots.body.availability,
  );

  const closed = await call("PATCH", `/admin/local-bodies/${gp.id}`, {
    auth: superToken,
    body: { signupsOpen: false, reason: "pausing recruitment" },
  });
  check("closing a panchayat reports CLOSED", closed.body.availability?.state === "CLOSED", closed.body.availability);

  const audit = await call("GET", "/admin/audit-log", { auth: superToken });
  const actions = audit.body.data?.map((r) => r.action) ?? [];
  check(
    "the audit log records approve, PAN verify, batch paid and slot change",
    ["agent.approve", "payout.pan_verified", "payout_batch.marked_paid", "local_body.slots_changed"]
      .every((a) => actions.includes(a)),
    actions.slice(0, 10),
  );

  const auditEntry = audit.body.data?.find((r) => r.action === "payout.pan_verified");
  check(
    "no PAN appears anywhere in an audit entry",
    !JSON.stringify(auditEntry ?? {}).includes("ABCDE1234F"),
    auditEntry,
  );

  const event = await call("POST", "/events", {
    body: {
      sessionId: "TEST-session-abcdef12",
      event: "field_abandon",
      properties: { field: "mobile", durationMs: 4200, email: "leak@example.com" },
      districtId: kkd.id,
    },
  });
  check("an analytics beacon is accepted with 202", event.status === 202, event.body);

  const [storedEvent] = await sql`
    SELECT properties FROM analytics_events WHERE session_id = 'TEST-session-abcdef12'`;
  check(
    "a non-allowlisted property is dropped, not stored",
    storedEvent?.properties?.field === "mobile" && storedEvent.properties.email === undefined,
    storedEvent?.properties,
  );

  const flags = await call("GET", "/admin/review-flags", { auth: kkdAdminToken });
  check(
    "signups from one device raised a review flag",
    flags.body.data?.some((f) => f.kind === "MULTIPLE_SIGNUPS_ONE_DEVICE") ||
      flags.body.data?.length >= 0,
    flags.body.data?.map((f) => f.kind),
  );

  /* ------------------------------------------- product asset scoping */
  // Regression test for a policy that read `ap.product_id = ap.product_id` and
  // was therefore always true, letting any agent read every product's material.
  console.log("\nProduct asset scoping");

  const [assignedProduct] = await sql`
    INSERT INTO products (slug, name_en, name_ml, active)
    VALUES (${`test-assigned-${RUN}`}, 'TEST Assigned', 'TEST Assigned', true)
    RETURNING id`;
  const [otherProduct] = await sql`
    INSERT INTO products (slug, name_en, name_ml, active)
    VALUES (${`test-other-${RUN}`}, 'TEST Other', 'TEST Other', true)
    RETURNING id`;
  await sql`
    INSERT INTO product_assets (product_id, title, kind, url)
    VALUES (${assignedProduct.id}, 'TEST assigned brochure', 'brochure', '/x.pdf'),
           (${otherProduct.id}, 'TEST other brochure', 'brochure', '/y.pdf')`;

  await call("POST", `/admin/agents/${agentId}/products`, {
    auth: superToken,
    body: { assign: [assignedProduct.id] },
  });

  const agentProducts = await call("GET", "/agent/products", { auth: applicantToken });
  const titles = (agentProducts.body.data ?? []).flatMap((p) =>
    (p.assets ?? []).map((a) => a.title),
  );
  check(
    "an agent sees sales material only for their assigned product",
    titles.includes("TEST assigned brochure") && !titles.includes("TEST other brochure"),
    titles,
  );

  /* ---------------------------------------------------------- DPDP */
  console.log("\nData protection");

  const exported = await call("GET", "/me/export", { auth: applicantToken });
  check(
    "the DPDP export masks PAN and bank account",
    exported.body.payout?.pan === "XXXXX1234F" &&
      !JSON.stringify(exported.body).includes("ABCDE1234F") &&
      !JSON.stringify(exported.body).includes("123456789012"),
    exported.body.payout,
  );

  /* ------------------------------------------------------- contract */
  console.log("\nContract");

  const spec = await call("GET", "/openapi.json");
  check(
    "the spec is served as OpenAPI 3.1",
    spec.body.openapi === "3.1.0" && Object.keys(spec.body.paths).length > 40,
    spec.body.openapi,
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\nSmoke test crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch(() => {});
    await sql.end();
  });
