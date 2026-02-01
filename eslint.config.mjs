import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from "globals";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      obsidianmd: obsidianmd,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "args": "none" }],
      "@typescript-eslint/ban-ts-comment": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-inferrable-types": ["error", { "ignoreParameters": true, "ignoreProperties": true }],
      // Recommended rules from obsidianmd
      ...obsidianmd.configs.recommended.rules,
    }
  },
  {
    ignores: [
      "node_modules/",
      "main.js",
      "esbuild.config.mjs",
      "version-bump.mjs",
      "release/",
      "tmp/"
    ]
  }
);
