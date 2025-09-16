module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.spec.js"],
  collectCoverageFrom: ["public/**/*.js", "!public/**/*.min.js", "!public/**/node_modules/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/public/$1",
  },
  globals: {
    window: {},
    document: {},
    localStorage: {},
    sessionStorage: {},
  },
}
