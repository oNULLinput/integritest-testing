// Test setup file for Jest
// Mock browser APIs and global objects

const jest = require("jest") // Import jest to declare the variable

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup DOM environment
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
})

// Mock window.confirm
window.confirm = jest.fn()

// Mock window.alert
window.alert = jest.fn()

// Mock Date.now for consistent testing
const mockDateNow = 1640995200000 // 2022-01-01 00:00:00 UTC
Date.now = jest.fn(() => mockDateNow)

// Reset all mocks before each test
const beforeEach = require("jest").beforeEach // Import beforeEach to declare the variable

beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()

  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()

  // Clear DOM
  document.body.innerHTML = ""
  document.head.innerHTML = ""
})
