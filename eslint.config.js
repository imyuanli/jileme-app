const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended")

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*"],
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": ["off"],
      "react/jsx-curly-brace-presence": [
        "error",
        {
          props: "never",
          children: "never",
        },
      ],
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-spacing": ["error", "never"],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-native",
              importNames: ["Text"],
              message: "Use @/components/ui/text instead.",
            },
          ],
        },
      ],
    },
  },
])
