// @ts-check
const tseslint = require("typescript-eslint");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
);
