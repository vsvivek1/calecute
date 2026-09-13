#!/usr/bin/env node
/**
 * Mints a session cookie for local development.
 *
 * Google Sign-In needs real OAuth credentials, which are placeholders here, so
 * there is no way to reach the authenticated pages in a browser locally without
 * this. It signs a token with the same secret and claims the API issues, then
 * prints the cookie to paste into devtools.
 *
 * Development only. It refuses to run when NODE_ENV is production, and the
 * secret it signs with is the local one — a token from here is worthless
 * against a real deployment.
 */
import postgres from "postgres";
import { SignJWT } from "jose";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to mint a development session in production.");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run dev:session --workspace=apps/api -- <email>");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

const [user] = await sql`
  SELECT u.id, u.role, a.id AS agent_id
    FROM users u LEFT JOIN agents a ON a.user_id = u.id
   WHERE lower(u.email) = lower(${email})`;

if (!user) {
  console.error(`No user with email ${email}. Seeded super admins:`);
  const admins = await sql`SELECT email FROM users WHERE role = 'SUPER_ADMIN'`;
  for (const row of admins) console.error(`  ${row.email}`);
  await sql.end();
  process.exit(1);
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const accessToken = await new SignJWT({
  role: user.role,
  ver: 1,
  ...(user.agent_id ? { agt: Number(user.agent_id) } : {}),
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(String(user.id))
  .setIssuer(process.env.JWT_ISSUER ?? "http://localhost:3001")
  .setAudience(process.env.JWT_AUDIENCE ?? "calecute-agents")
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(secret);

console.log(`user ${user.id} · ${user.role}${user.agent_id ? ` · agent ${user.agent_id}` : ""}\n`);
console.log("Paste into the browser console on http://localhost:3000 :\n");
console.log(`document.cookie = "ct_at=${accessToken}; path=/";`);
console.log(`\nOr with curl:\n  -H 'Cookie: ct_at=${accessToken}'`);

await sql.end();
