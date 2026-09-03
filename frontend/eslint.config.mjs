import js from "@eslint/js";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";

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
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: "readonly",
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      // Components referenced as <Jsx /> count as usage (kills the huge
      // stream of false "defined but never used" warnings).
      "react/jsx-uses-vars": "error",
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
