import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    extends: [...nextCoreWebVitals, ...nextTypescript],
    rules: {
      // Disable overly strict rule that conflicts with real-world data fetching
      "react-hooks/set-state-in-effect": "off",

      // Catch unused variables + unused constants
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Disable base rule (TypeScript handles this)
      "no-unused-vars": "off",
    },
  },
]);
