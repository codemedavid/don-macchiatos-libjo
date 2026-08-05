const path = require("path");

/**
 * Jest is scoped to pure TypeScript logic modules only — mobile/lib/* plus the
 * Convex-side pure helpers in convex/lib/*. React Native / Expo screens and
 * Convex query handlers are verified on-device, not in Jest, so we
 * intentionally avoid the heavy jest-expo RN preset here.
 *
 * `rootDir` is the repo root so convex/lib modules are inside the coverage
 * scope; `roots` keeps test discovery confined to mobile/__tests__.
 */
module.exports = {
  rootDir: path.join(__dirname, ".."),
  roots: ["<rootDir>/mobile/__tests__"],
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    // Resolved from this file, not <rootDir> — ts-jest lives in mobile/node_modules.
    "^.+\\.ts$": [
      require.resolve("ts-jest"),
      { tsconfig: path.join(__dirname, "tsconfig.test.json") },
    ],
  },
  // Keep reports in mobile/coverage despite the repo-root rootDir.
  coverageDirectory: path.join(__dirname, "coverage"),
  collectCoverageFrom: [
    "mobile/lib/format.ts",
    "mobile/lib/sales.ts",
    "mobile/lib/theme.ts",
    "convex/lib/orderHistory.ts",
  ],
};
