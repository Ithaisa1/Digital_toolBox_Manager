/**
 * Configuración de Jest para los tests del backend.
 * Ejecuta los tests de integración (carpeta tests/) y los unitarios (archivos .test.js en src/).
 */
export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js", "**/src/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/seed.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // Los tests comparten la misma base de datos: se ejecutan de uno en uno
  maxWorkers: 1,
  detectOpenHandles: true,
  forceExit: true,
};
