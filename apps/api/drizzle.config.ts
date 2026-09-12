import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Hand-written policy/function migrations live alongside the generated ones.
  verbose: true,
  strict: true,
} satisfies Config;
