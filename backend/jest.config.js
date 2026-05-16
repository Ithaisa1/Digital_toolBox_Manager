/**
 * Configuración de Jest para tests de integración del backend.
 * Solo ejecuta archivos en tests/ (no los .test.js sueltos en src/).
 */
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
