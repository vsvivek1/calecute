/**
 * Every environment variable the API needs, read once and validated loudly.
 *
 * Nothing here is optional-with-a-silent-default: a missing secret should stop
 * the deployment, not produce an app that quietly issues unsigned tokens.
 */
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),

  /** Google OAuth client used by the web frontend (authorization code flow). */
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  /** Android's client id, if different. Both are accepted audiences. */
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),

  /** 32+ byte secret, base64. Signs our access and refresh tokens. */
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default("https://api.calecutech.com"),
  JWT_AUDIENCE: z.string().default("calecute-agents"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),

  /** 32-byte key, base64. AES-256-GCM for PAN and bank account numbers. */
  PII_ENCRYPTION_KEY: z.string().min(32),
  /** Separate key so a fingerprint leak does not help decrypt anything. */
  PII_FINGERPRINT_KEY: z.string().min(32),

  /** Comma-separated origins allowed to call the API from a browser. */
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid API environment configuration — ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

/**
 * Only the database URL, checked on its own.
 *
 * The db client is created when a route module loads, which `next build` does
 * while collecting page data. Reading the full env there made the build need
 * every secret (JWT, PII keys, Google OAuth), so Preview builds without them
 * failed. The other secrets are still checked by env() on first request.
 */
export function databaseUrl(): string {
  const parsed = schema.shape.DATABASE_URL.safeParse(process.env.DATABASE_URL);
  if (!parsed.success) {
    throw new Error("Invalid API environment configuration — DATABASE_URL is not set");
  }
  return parsed.data;
}

export function allowedOrigins(): string[] {
  return env()
    .CORS_ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}
