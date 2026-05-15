export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/seed.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  detectOpenHandles: true,
  forceExit: true,
};
