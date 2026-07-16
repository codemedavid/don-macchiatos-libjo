/**
 * Jest is scoped to pure TypeScript logic modules only (lib/format, lib/sales,
 * lib/theme). React Native / Expo screens are verified on-device, not in Jest,
 * so we intentionally avoid the heavy jest-expo RN preset here.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "tsconfig.test.json" },
    ],
  },
  collectCoverageFrom: ["lib/format.ts", "lib/sales.ts", "lib/theme.ts"],
};
