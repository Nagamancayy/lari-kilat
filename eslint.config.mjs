import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/assets/**",
      ".test-build/**",
      "next-env.d.ts",
      "qa/**",
      "pipeline/**",
      "scripts/**",
      "tests/**",
    ],
  },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      // localStorage / matchMedia dibaca setelah mount supaya markup server dan klien sama.
      "react-hooks/set-state-in-effect": "off",
    },
  },
);
