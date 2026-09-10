// Integration tests hit a *real* Postgres/Auth instance via supabase-js — they need
// `supabase start` (local Docker stack) running, or a linked staging project, and are
// NOT run by `npm test` / CI by default. See __tests__/integration/README.md.
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["babel-jest", { presets: ["babel-preset-expo"] }],
  },
  setupFiles: ["<rootDir>/__tests__/integration/env.js"],
  testTimeout: 20000,
};
