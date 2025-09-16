# Unit Testing Guide for IntegriTest System

This document provides comprehensive instructions for running unit tests in Visual Studio Code for the IntegriTest system.

## Overview

The test suite covers all JavaScript utilities and classes in the project:

- **DateUtils**: Time formatting, date calculations, relative time display
- **ValidationUtils**: Input validation (email, exam codes, names, etc.)
- **StorageUtils**: Local storage operations with error handling
- **UIUtils**: User interface helpers (messages, loading, dialogs)
- **SecurityUtils**: Session management, password hashing, validation
- **AnalyticsUtils**: Event tracking and analytics storage
- **CacheManager**: Memory and localStorage caching with TTL
- **ErrorHandler**: Global error handling and user-friendly error display

## Prerequisites

### Required VS Code Extensions

1. **Jest** - Provides Jest test runner integration
2. **Jest Runner** - Adds "Run Test" and "Debug Test" buttons
3. **JavaScript and TypeScript Nightly** - Enhanced JS/TS support
4. **Test Explorer UI** - Visual test explorer panel

### Installation Commands

\`\`\`bash
# Install testing dependencies (if not already installed)
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event jest-environment-jsdom @types/jest

# Install Jest globally (optional, for command line usage)
npm install -g jest
\`\`\`

## Running Tests in VS Code

### Method 1: Using VS Code Test Explorer

1. Open the **Test Explorer** panel (View → Test Explorer)
2. Click the **Refresh** button to discover tests
3. Run individual tests by clicking the play button next to each test
4. Run all tests by clicking the play button at the top level

### Method 2: Using Jest Extension

1. Open any test file (`.test.js` or `.spec.js`)
2. Click **"Run Test"** or **"Debug Test"** buttons that appear above each test
3. Use **Ctrl+Shift+P** → "Jest: Start Runner" to start the Jest watcher

### Method 3: Using Integrated Terminal

\`\`\`bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch mode)
npm run test:ci

# Debug tests with Node.js inspector
npm run test:debug
\`\`\`

## Test File Structure

\`\`\`
tests/
├── setup.js                    # Jest configuration and mocks
├── utils/
│   ├── DateUtils.test.js       # Date and time utility tests
│   ├── ValidationUtils.test.js # Input validation tests
│   ├── StorageUtils.test.js    # localStorage operation tests
│   ├── UIUtils.test.js         # UI helper function tests
│   ├── SecurityUtils.test.js   # Security utility tests
│   └── AnalyticsUtils.test.js  # Analytics tracking tests
└── classes/
    ├── CacheManager.test.js    # Cache management tests
    └── ErrorHandler.test.js    # Error handling tests
\`\`\`

## VS Code Configuration

### Settings.json Configuration

Add these settings to your VS Code `settings.json`:

\`\`\`json
{
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": {
    "watch": true,
    "onStartup": ["all-tests"]
  },
  "jest.showCoverageOnLoad": true,
  "jest.coverageFormatter": "DefaultFormatter",
  "testing.automaticallyOpenPeekView": "failureInVisibleDocument"
}
\`\`\`

### Launch.json for Debugging

Create `.vscode/launch.json` for debugging tests:

\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    },
    {
      "name": "Debug Current Jest Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasenameNoExtension}", "--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true,
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
\`\`\`

## Test Coverage

### Viewing Coverage Reports

1. Run `npm run test:coverage`
2. Open `coverage/lcov-report/index.html` in your browser
3. Or use the VS Code **Coverage Gutters** extension to see inline coverage

### Coverage Targets

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Writing New Tests

### Test File Template

\`\`\`javascript
describe('YourUtility', () => {
  let YourUtility;

  beforeAll(() => {
    // Setup utility or mock implementation
  });

  beforeEach(() => {
    // Reset state before each test
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = YourUtility.methodName(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
\`\`\`

### Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Mock external dependencies** (localStorage, fetch, etc.)
4. **Test edge cases** and error conditions
5. **Keep tests isolated** - each test should be independent
6. **Use beforeEach/afterEach** for setup and cleanup

## Troubleshooting

### Common Issues

1. **Tests not discovered**: Check that test files end with `.test.js` or `.spec.js`
2. **Module import errors**: Ensure Jest configuration includes proper module mapping
3. **DOM not available**: Use `@jest-environment jsdom` comment at top of test files
4. **Async tests failing**: Use `async/await` or return promises in tests

### Debug Tips

1. Use `console.log()` in tests for debugging
2. Add `debugger;` statements and run with `npm run test:debug`
3. Use VS Code breakpoints in test files
4. Check Jest output in the integrated terminal

## Continuous Integration

The test suite is configured to run in CI environments with:

\`\`\`bash
npm run test:ci
\`\`\`

This command:
- Runs all tests once (no watch mode)
- Generates coverage reports
- Exits with proper error codes for CI/CD pipelines

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [VS Code Jest Extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
