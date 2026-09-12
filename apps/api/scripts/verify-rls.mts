#!/usr/bin/env node
/**
 * Proves the row-level security policies do what the brief requires.
 *
 * This is the test that matters most in the whole codebase: the claim is that a
 * modified client cannot read one extra row, and that claim rests entirely on
 * the policies rather than on application code remembering a WHERE clause.
 *
 * Everything runs inside ONE transaction that is rolled back at the end, so the
 * fixtures never persist. The fixture geography is named TEST-* precisely so it
 * could never be mistaken for real Kerala data if a rollback ever failed.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
    console.log(`          expected ${JSON.stringify(expected)}`);
    console.log(`          actual   ${JSON.stringify(actual)}`);
  }
}

async function main() {
  console.log("Row-level security verification\n");

  try {
    await sql.begin(async (tx) => {
      // ---------------------------------------------------------- fixtures
      // Two districts, one local body in each, one agent in each, plus a
      // district admin scoped to the first district only.
      const [d1] = await tx<{ id: number }[]>`
        SELECT id FROM districts WHERE code_slug = 'KKD'`;
      const [d2] = await tx<{ id: number }[]>`
        SELECT id FROM districts WHERE code_slug = 'TVM'`;

      const [b1] = await tx<{ id: number }[]>`
        INSERT INTO block_panchayats (district_id, name_en, name_ml)
        VALUES (${d1.id}, 'TEST-BLOCK-KKD', 'TEST-BLOCK-KKD') RETURNING id`;
      const [b2] = await tx<{ id: number }[]>`
        INSERT INTO block_panchayats (district_id, name_en, name_ml)
        VALUES (${d2.id}, 'TEST-BLOCK-TVM', 'TEST-BLOCK-TVM') RETURNING id`;

      const [lb1] = await tx<{ id: number }[]>`
        INSERT INTO local_bodies (district_id, block_panchayat_id, type, name_en, name_ml)
        VALUES (${d1.id}, ${b1.id}, 'GRAM_PANCHAYAT', 'TEST-GP-KKD', 'TEST-GP-KKD')
        RETURNING id`;
      const [lb2] = await tx<{ id: number }[]>`
        INSERT INTO local_bodies (district_id, block_panchayat_id, type, name_en, name_ml)
        VALUES (${d2.id}, ${b2.id}, 'GRAM_PANCHAYAT', 'TEST-GP-TVM', 'TEST-GP-TVM')
        RETURNING id`;

      const mkUser = async (email: string, role: string) => {
        const [u] = await tx<{ id: number }[]>`
          INSERT INTO users (google_sub, email, name, role)
          VALUES (${`test:${email}`}, ${email}, ${email}, ${role}::user_role)
          RETURNING id`;
        return u.id;
      };

      const agentUser1 = await mkUser("test-agent-kkd@example.invalid", "AGENT");
      const agentUser2 = await mkUser("test-agent-tvm@example.invalid", "AGENT");
      const kkdAdmin = await mkUser("test-admin-kkd@example.invalid", "DISTRICT_ADMIN");
      // A user with no agent record and no district assignment, used to prove
      // that a role claim on its own grants nothing.
      const unassigned = await mkUser("test-unassigned@example.invalid", "AGENT");
      const superAdmin = await mkUser("test-super@example.invalid", "SUPER_ADMIN");

      await tx`
        INSERT INTO admin_districts (user_id, district_id)
        VALUES (${kkdAdmin}, ${d1.id})`;

      const mkAgent = async (
        userId: number,
        districtId: number,
        localBodyId: number,
        code: string,
        mobile: string,
      ) => {
        const [a] = await tx<{ id: number }[]>`
          INSERT INTO agents
            (user_id, agent_code, district_id, local_body_id, mobile, occupation,
             status, terms_version, terms_accepted_at, privacy_consent_at)
          VALUES (${userId}, ${code}, ${districtId}, ${localBodyId}, ${mobile},
                  'tester', 'APPROVED', '2026-09-01', now(), now())
          RETURNING id`;
        return a.id;
      };

      const agent1 = await mkAgent(agentUser1, d1.id, lb1.id, "CA-KKD-TEST01", "9000000001");
      const agent2 = await mkAgent(agentUser2, d2.id, lb2.id, "CA-TVM-TEST01", "9000000002");

      // PAN-bearing payout profiles, to test the strictest table.
      await tx`
        INSERT INTO payout_profiles (agent_id, pan_ciphertext, pan_fingerprint, pan_last4, pan_status)
        VALUES (${agent1}, 'v1.x.y.z', ${"fp-test-1"}, '1234F', 'VERIFIED')`;
      await tx`
        INSERT INTO payout_profiles (agent_id, pan_ciphertext, pan_fingerprint, pan_last4, pan_status)
        VALUES (${agent2}, 'v1.x.y.z', ${"fp-test-2"}, '5678G', 'VERIFIED')`;

      /**
       * Run a query with a given identity, exactly as withRls does — including
       * dropping to the unprivileged application role.
       *
       * The SET ROLE is the part that makes this a real test. The fixtures
       * above are created as the connecting role (a superuser locally, the
       * owner on Neon), which bypasses RLS; the assertions below run as
       * calecute_app, which does not.
       */
      const as = async <T,>(
        userId: number | null,
        role: string,
        run: () => Promise<T>,
      ): Promise<T> => {
        await tx.unsafe("SET LOCAL ROLE calecute_app");
        await tx`SELECT set_config('app.user_id', ${userId === null ? "" : String(userId)}, true)`;
        await tx`SELECT set_config('app.role', ${role}, true)`;
        let result: T;
        try {
          result = await run();
        } finally {
          // Back to the connecting role so later fixture writes still work,
          // and so a leaked setting cannot make a later assertion pass.
          await tx.unsafe("RESET ROLE");
          await tx`SELECT set_config('app.user_id', '', true)`;
          await tx`SELECT set_config('app.role', 'PUBLIC', true)`;
        }
        return result;
      };

      const testAgentCodes = async () => {
        const rows = await tx<{ agent_code: string }[]>`
          SELECT agent_code FROM agents
           WHERE agent_code LIKE 'CA-%-TEST%' ORDER BY agent_code`;
        return rows.map((r) => r.agent_code);
      };

      // ------------------------------------------------- district scoping
      console.log("District admin scoping");

      check(
        "DISTRICT_ADMIN(KKD) sees only the Kozhikode agent",
        await as(kkdAdmin, "DISTRICT_ADMIN", testAgentCodes),
        ["CA-KKD-TEST01"],
      );

      check(
        "SUPER_ADMIN sees both agents",
        await as(superAdmin, "SUPER_ADMIN", testAgentCodes),
        ["CA-KKD-TEST01", "CA-TVM-TEST01"],
      );

      check(
        "anonymous PUBLIC sees no agents at all",
        await as(null, "PUBLIC", testAgentCodes),
        [],
      );

      // A forged role claim is worthless without the matching assignment row.
      // This is the "assume the frontend is hostile" case: even if an attacker
      // minted a token claiming DISTRICT_ADMIN, scope comes from
      // admin_districts, which they are not in.
      check(
        "a user claiming DISTRICT_ADMIN with no assignment sees nothing",
        await as(unassigned, "DISTRICT_ADMIN", testAgentCodes),
        [],
      );

      check(
        "an agent claiming DISTRICT_ADMIN still sees only their own row",
        await as(agentUser1, "DISTRICT_ADMIN", testAgentCodes),
        ["CA-KKD-TEST01"],
      );

      // Worth being explicit about the asymmetry here, because it is a real
      // design decision rather than an oversight:
      //   DISTRICT_ADMIN scope is table-backed — the claim is useless without a
      //   matching admin_districts row, so it survives a forged token.
      //   SUPER_ADMIN is claim-backed — the database trusts app.role alone.
      // The server only ever sets app.role from a signature-verified JWT, so
      // reaching this state already means holding a valid super-admin token.
      // Recorded as a test so the asymmetry is visible, not discovered later.
      check(
        "SUPER_ADMIN is claim-backed: the role setting alone grants full read",
        await as(unassigned, "SUPER_ADMIN", testAgentCodes),
        ["CA-KKD-TEST01", "CA-TVM-TEST01"],
      );

      console.log("\nAgent self-scoping");

      check(
        "AGENT sees only their own agent row",
        await as(agentUser1, "AGENT", testAgentCodes),
        ["CA-KKD-TEST01"],
      );

      check(
        "the other AGENT sees only theirs",
        await as(agentUser2, "AGENT", testAgentCodes),
        ["CA-TVM-TEST01"],
      );

      // ------------------------------------------------------ payout data
      console.log("\nPayout profiles (the strictest table)");

      const panRows = async () => {
        const rows = await tx<{ pan_last4: string }[]>`
          SELECT pan_last4 FROM payout_profiles
           WHERE pan_fingerprint IN ('fp-test-1','fp-test-2')
           ORDER BY pan_last4`;
        return rows.map((r) => r.pan_last4);
      };

      check(
        "AGENT sees only their own PAN record",
        await as(agentUser1, "AGENT", panRows),
        ["1234F"],
      );
      check(
        "DISTRICT_ADMIN(KKD) sees only in-district PAN records",
        await as(kkdAdmin, "DISTRICT_ADMIN", panRows),
        ["1234F"],
      );
      check(
        "PUBLIC sees no PAN records",
        await as(null, "PUBLIC", panRows),
        [],
      );

      // ------------------------------------------- cross-district writes
      console.log("\nCross-district writes");

      const updated = await as(kkdAdmin, "DISTRICT_ADMIN", async () => {
        const rows = await tx<{ id: number }[]>`
          UPDATE agents SET review_note = 'should not happen'
           WHERE id = ${agent2} RETURNING id`;
        return rows.length;
      });
      check(
        "DISTRICT_ADMIN(KKD) cannot update the Thiruvananthapuram agent",
        updated,
        0,
      );

      const updatedOwn = await as(kkdAdmin, "DISTRICT_ADMIN", async () => {
        const rows = await tx<{ id: number }[]>`
          UPDATE agents SET review_note = 'in scope'
           WHERE id = ${agent1} RETURNING id`;
        return rows.length;
      });
      check("DISTRICT_ADMIN(KKD) can update their own district's agent", updatedOwn, 1);

      // --------------------------------------------------- geography read
      console.log("\nPublic geography");

      const districtCount = await as(null, "PUBLIC", async () => {
        const [row] = await tx<{ c: number }[]>`
          SELECT count(*)::int AS c FROM districts`;
        return row.c;
      });
      check("PUBLIC can read all 14 districts for the signup form", districtCount, 14);

      // ------------------------------------------------- audit immutability
      console.log("\nAudit log immutability");

      await as(superAdmin, "SUPER_ADMIN", async () => {
        await tx`
          INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id)
          VALUES (${superAdmin}, 'SUPER_ADMIN', 'agent.approve', 'agent', ${String(agent1)})`;
      });

      let updateBlocked = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`UPDATE audit_log SET action = 'tampered' WHERE entity_type = 'agent'`;
        });
      } catch {
        updateBlocked = true;
      }
      check("UPDATE on audit_log is rejected", updateBlocked, true);

      let deleteBlocked = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`DELETE FROM audit_log WHERE entity_type = 'agent'`;
        });
      } catch {
        deleteBlocked = true;
      }
      check("DELETE on audit_log is rejected", deleteBlocked, true);

      const auditVisibleToDistrictAdmin = await as(
        kkdAdmin,
        "DISTRICT_ADMIN",
        async () => {
          const [row] = await tx<{ c: number }[]>`
            SELECT count(*)::int AS c FROM audit_log`;
          return row.c;
        },
      );
      check(
        "DISTRICT_ADMIN cannot read the audit log (SUPER_ADMIN only)",
        auditVisibleToDistrictAdmin,
        0,
      );

      // ------------------------------------------------ schema invariants
      console.log("\nSchema invariants");

      let branchCheckHeld = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`
            INSERT INTO local_bodies (district_id, block_panchayat_id, type, name_en, name_ml)
            VALUES (${d1.id}, ${b1.id}, 'MUNICIPALITY', 'TEST-BAD', 'TEST-BAD')`;
        });
      } catch {
        branchCheckHeld = true;
      }
      check("a municipality cannot be attached to a block panchayat", branchCheckHeld, true);

      let gpCheckHeld = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`
            INSERT INTO local_bodies (district_id, block_panchayat_id, type, name_en, name_ml)
            VALUES (${d1.id}, NULL, 'GRAM_PANCHAYAT', 'TEST-BAD-2', 'TEST-BAD-2')`;
        });
      } catch {
        gpCheckHeld = true;
      }
      check("a gram panchayat cannot exist without a block", gpCheckHeld, true);

      let mobileCheckHeld = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`
            INSERT INTO agents
              (user_id, agent_code, district_id, local_body_id, mobile, occupation,
               status, terms_version, terms_accepted_at, privacy_consent_at)
            VALUES (${superAdmin}, 'CA-KKD-TEST99', ${d1.id}, ${lb1.id},
                    '9000000001', 'tester', 'APPROVED', '2026-09-01', now(), now())`;
        });
      } catch {
        mobileCheckHeld = true;
      }
      check("one account per mobile number is enforced", mobileCheckHeld, true);

      let panCheckHeld = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`
            UPDATE payout_profiles SET pan_fingerprint = 'fp-test-1'
             WHERE agent_id = ${agent2}`;
        });
      } catch {
        panCheckHeld = true;
      }
      check("one account per PAN is enforced", panCheckHeld, true);

      let commissionCheckHeld = false;
      try {
        await tx.savepoint(async (sp) => {
          await sp`
            INSERT INTO payments (external_ref, customer_id, gross_paise, gst_paise, gateway_fee_paise, net_paise, paid_at)
            VALUES ('TEST-BAD-PAY', 1, 10000, 1000, 200, 9999, now())`;
        });
      } catch {
        commissionCheckHeld = true;
      }
      check("payment net must equal gross less GST less gateway fee", commissionCheckHeld, true);

      // Nothing above is kept.
      throw new Error("__ROLLBACK__");
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "__ROLLBACK__") {
      throw error;
    }
  }

  // Prove the rollback actually happened.
  const [leftover] = await sql<{ c: number }[]>`
    SELECT count(*)::int AS c FROM agents WHERE agent_code LIKE 'CA-%-TEST%'`;
  check("\nfixtures were rolled back (no TEST rows persist)", leftover.c, 0);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
