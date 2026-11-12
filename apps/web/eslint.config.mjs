import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The staff office is a self-contained module (src/office, src/app/(office),
  // supabase/office) so another company can copy it into their own site.
  // It must not lean on the marketing site's code, and the site must not
  // lean on it. The site's proxy.ts is the one bridge.
  {
    files: ["src/office/**", "src/app/(office)/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib", "@/lib/*", "@/components", "@/components/*", "@/app/*"],
              message: "Office code must stay self-contained: import only from @/office or packages.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**"],
    ignores: ["src/office/**", "src/app/(office)/**", "src/proxy.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/office", "@/office/*"],
              message: "The website must not import office code (only src/proxy.ts may).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Deno code (Supabase Edge Functions), checked by Supabase, not here.
    "supabase/**",
  ]),
]);

export default eslintConfig;
