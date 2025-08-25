module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.spec.js'],
  verbose: true,
  setupFiles: ['<rootDir>/tests/e2e/setup/env.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/hooks.js'],
};
