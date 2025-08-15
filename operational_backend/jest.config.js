module.exports = {
  // Run tests from one of these patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],
  
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/test'],
  
  // The test environment that will be used for testing
  testEnvironment: 'node',
  
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover'
  ],
  
  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],
  
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // This option allows use of a custom test runner
  testRunner: 'jest-circus/runner',
  
  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  testURL: 'http://localhost',
  
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Indicates whether each individual test should be reported during the run
  verbose: true
};
