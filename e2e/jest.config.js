module.exports = {
  testTimeout: 180000,
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testRunner: 'jest-circus/runner',
  setupFilesAfterEnv: ['<rootDir>/init.fixed.js'],
  testMatch: ['<rootDir>/*.e2e.test.js'],
  maxWorkers: 1,
  reporters: ['detox/runners/jest/reporter']
};
