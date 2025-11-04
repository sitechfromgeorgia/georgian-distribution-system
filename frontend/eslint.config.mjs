import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  // Next.js core web vitals rules
  {
    name: "next/core-web-vitals",
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  // Basic TS support without project inference
  {
    files: ["**/*.{ts,tsx}", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      // Georgian Distribution System - Custom Rules

      // Prevent console statements (use logger instead)
      "no-console": ["warn", {
        allow: ["error"] // Allow console.error for critical failures
      }],

      // Prevent debugger statements
      "no-debugger": "warn",

      // Prefer logger for all logging
      // Custom message to guide developers
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name!='error']",
          message: "Use logger from @/lib/logger instead of console. Example: logger.info('message', { context })"
        }
      ],
    },
  },
  // Ignores - migrated from .eslintignore
  {
    ignores: [
      // Build outputs
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      
      // Dependencies
      "node_modules/**",
      
      // TypeScript generated files
      "next-env.d.ts",
      "*.tsbuildinfo",
      
      // Coverage and test outputs
      "coverage/**",
      ".nyc_output/**",
      
      // Cache directories
      ".cache/**",
      ".parcel-cache/**",
      ".eslintcache",
      
      // Package manager files
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      
      // Minified files
      "**/*.min.js",
      "**/*.min.css",
      
      // Public assets
      "public/**",
      
      // Generated types
      "src/types/supabase.ts",
    ],
  },
];
