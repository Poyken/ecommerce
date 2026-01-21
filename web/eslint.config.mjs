import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
  // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      
      // === Web Refactoring: Downgrade to warnings ===
      // Unescaped entities: common with Vietnamese text in JSX
      "react/no-unescaped-entities": "warn",
      
      // Unused vars: allow underscore prefix convention
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      
      // Empty object type: common for empty interfaces
      "@typescript-eslint/no-empty-object-type": "warn",
      
      // React Hooks (from React Compiler) - downgrade to warnings
      // These are experimental and cause false positives
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;

