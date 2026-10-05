import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Migration policy: keep legacy UI debt visible without blocking secure
    // production builds. New backend/API code is checked separately with these
    // rules at their inherited error severity.
    files: [
      "app/**/*.tsx",
      "components/**/*.tsx",
      "context/**/*.tsx",
      "hooks/**/*.ts",
      "lib/assessmentGenerator.ts",
      "lib/gamification.ts",
      "lib/offlineStorage.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated PWA bundles and local diagnostic scripts are not application source.
    "public/sw.js",
    "public/workbox-*.js",
    "public/fallback-*.js",
    "scratch/**",
  ]),
]);

export default eslintConfig;
