import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "public/**", "vite.config.js"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node
      }
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react/prop-types": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "react/jsx-no-undef": "off",
      "no-useless-escape": "off",
      "no-prototype-builtins": "off",
      "no-empty": "off",
      "no-sparse-arrays": "off",
      "no-case-declarations": "off",
      "no-func-assign": "off",
      "no-cond-assign": "off",
      "no-constant-condition": "off",
      "no-unsafe-finally": "off"
    },
  },
];
