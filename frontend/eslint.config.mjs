import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";

const nextCoreWebVitals = nextPlugin.configs["core-web-vitals"];

export default [
  js.configs.recommended,
  nextCoreWebVitals,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "warn",
      "@next/next/no-img-element": "error",
      "prefer-const": "warn",
      "no-duplicate-imports": "warn",
    },
  },
  {
    ignores: ["node_modules", ".next", "out", "**/*.d.ts"],
  },
];
