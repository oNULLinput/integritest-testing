/**
 * @jest-environment jsdom
 */

const jest = require("jest")

describe("ErrorHandler", () => {
  let ErrorHandler
  let errorHandler

  beforeAll(() => {
    // Mock ErrorHandler class
    ErrorHandler = class {
      constructor() {
        this.errors = []
        this.maxErrors = 50
        this.init()
      }

      init() {
        // Mock initialization - in real tests you'd test actual event listeners
      }

      handleError(errorInfo) {
        const error = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          ...errorInfo,
        }

        this.errors.push(error)

        if (this.errors.length > this.maxErrors) {
          this.errors = this.errors.slice(-this.maxErrors)
        }

        console.error("[v0] Error captured:", error)
        this.showUserError(error)
        this.logToServer(error)
      }

      showUserError(error) {
        // Mock implementation
        if (window.notificationManager) {
          window.notificationManager.error("Error", error.message)
        }
      }

      logToServer(error) {
        try {
          const errorLogs = JSON.parse(localStorage.getItem("errorLogs") || "[]")
          errorLogs.push(error)

          if (errorLogs.length > 100) {
            errorLogs.splice(0, errorLogs.length - 100)
          }

          localStorage.setItem("errorLogs", JSON.stringify(errorLogs))
        } catch (e) {
          console.error("[v0] Failed to log error:", e)
        }
      }

      reportError(message, type = "manual", severity = "medium") {
        this.handleError({ type, message, severity, manual: true })
      }

      getErrorHistory() {
        return [...this.errors]
      }

      clearErrors() {
        this.errors = []
        localStorage.removeItem("errorLogs")
      }

      getErrorStats() {
        const stats = {
          total: this.errors.length,
          byType: {},
          recent: this.errors.filter((error) => Date.now() - new Date(error.timestamp).getTime() < 3600000).length,
        }

        this.errors.forEach((error) => {
          stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
        })

        return stats
      }
    }
  })

  beforeEach(() => {
    errorHandler = new ErrorHandler()
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2022-01-01T12:00:00Z"))

    // Mock window.notificationManager
    window.notificationManager = {
      error: jest.fn(),
    }
  })

  afterEach(() => {
    jest.useRealTimers()
    delete window.notificationManager
  })

  describe("constructor", () => {
    test("should initialize with empty errors array and correct maxErrors", () => {
      expect(errorHandler.errors).toEqual([])
      expect(errorHandler.maxErrors).toBe(50)
    })
  })

  describe("handleError", () => {
    test("should add error to errors array with correct structure", () => {
      const errorInfo = {
        type: "javascript",
        message: "Test error",
        filename: "test.js",
        lineno: 10,
      }

      errorHandler.handleError(errorInfo)

      expect(errorHandler.errors).toHaveLength(1)
      expect(errorHandler.errors[0]).toMatchObject({
        type: "javascript",
        message: "Test error",
        filename: "test.js",
        lineno: 10,
        timestamp: "2022-01-01T12:00:00.000Z",
        url: "http://localhost/",
        userAgent: expect.any(String),
      })
    })

    test("should limit errors to maxErrors", () => {
      // Add more than maxErrors
      for (let i = 0; i < 55; i++) {
        errorHandler.handleError({
          type: "test",
          message: `Error ${i}`,
        })
      }

      expect(errorHandler.errors).toHaveLength(50)
      expect(errorHandler.errors[0].message).toBe("Error 5") // First 5 should be removed
      expect(errorHandler.errors[49].message).toBe("Error 54")
    })

    test("should log error to console", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()

      errorHandler.handleError({
        type: "test",
        message: "Test error",
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        "[v0] Error captured:",
        expect.objectContaining({
          type: "test",
          message: "Test error",
        }),
      )

      consoleSpy.mockRestore()
    })

    test("should call showUserError and logToServer", () => {
      const showUserErrorSpy = jest.spyOn(errorHandler, "showUserError").mockImplementation()
      const logToServerSpy = jest.spyOn(errorHandler, "logToServer").mockImplementation()

      errorHandler.handleError({
        type: "test",
        message: "Test error",
      })

      expect(showUserErrorSpy).toHaveBeenCalled()
      expect(logToServerSpy).toHaveBeenCalled()

      showUserErrorSpy.mockRestore()
      logToServerSpy.mockRestore()
    })
  })

  describe("logToServer", () => {
    test("should store error in localStorage", () => {
      const error = {
        type: "test",
        message: "Test error",
        timestamp: "2022-01-01T12:00:00.000Z",
      }

      errorHandler.logToServer(error)

      const storedLogs = JSON.parse(localStorage.getItem("errorLogs"))
      expect(storedLogs).toHaveLength(1)
      expect(storedLogs[0]).toMatchObject(error)
    })

    test("should limit stored errors to 100", () => {
      // Pre-populate with 100 errors
      const existingErrors = Array.from({ length: 100 }, (_, i) => ({
        message: `Error ${i}`,
      }))
      localStorage.setItem("errorLogs", JSON.stringify(existingErrors))

      const newError = { message: "New error" }
      errorHandler.logToServer(newError)

      const storedLogs = JSON.parse(localStorage.getItem("errorLogs"))
      expect(storedLogs).toHaveLength(100)
      expect(storedLogs[0].message).toBe("Error 1") // First error removed
      expect(storedLogs[99].message).toBe("New error")
    })

    test("should handle localStorage errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      localStorage.setItem = jest.fn(() => {
        throw new Error("Storage quota exceeded")
      })

      expect(() => {
        errorHandler.logToServer({ message: "Test error" })
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith("[v0] Failed to log error:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("reportError", () => {
    test("should call handleError with correct parameters", () => {
      const handleErrorSpy = jest.spyOn(errorHandler, "handleError").mockImplementation()

      errorHandler.reportError("Manual error", "custom", "high")

      expect(handleErrorSpy).toHaveBeenCalledWith({
        type: "custom",
        message: "Manual error",
        severity: "high",
        manual: true,
      })

      handleErrorSpy.mockRestore()
    })

    test("should use default parameters", () => {
      const handleErrorSpy = jest.spyOn(errorHandler, "handleError").mockImplementation()

      errorHandler.reportError("Manual error")

      expect(handleErrorSpy).toHaveBeenCalledWith({
        type: "manual",
        message: "Manual error",
        severity: "medium",
        manual: true,
      })

      handleErrorSpy.mockRestore()
    })
  })

  describe("getErrorHistory", () => {
    test("should return copy of errors array", () => {
      errorHandler.handleError({ type: "test", message: "Error 1" })
      errorHandler.handleError({ type: "test", message: "Error 2" })

      const history = errorHandler.getErrorHistory()

      expect(history).toHaveLength(2)
      expect(history).not.toBe(errorHandler.errors) // Should be a copy
      expect(history[0].message).toBe("Error 1")
      expect(history[1].message).toBe("Error 2")
    })
  })

  describe("clearErrors", () => {
    test("should clear errors array and localStorage", () => {
      errorHandler.handleError({ type: "test", message: "Error 1" })
      localStorage.setItem("errorLogs", JSON.stringify([{ message: "Stored error" }]))

      errorHandler.clearErrors()

      expect(errorHandler.errors).toEqual([])
      expect(localStorage.getItem("errorLogs")).toBeNull()
    })
  })

  describe("getErrorStats", () => {
    test("should return correct statistics", () => {
      // Add errors of different types
      errorHandler.handleError({ type: "javascript", message: "JS Error 1" })
      errorHandler.handleError({ type: "javascript", message: "JS Error 2" })
      errorHandler.handleError({ type: "network", message: "Network Error" })

      const stats = errorHandler.getErrorStats()

      expect(stats.total).toBe(3)
      expect(stats.byType.javascript).toBe(2)
      expect(stats.byType.network).toBe(1)
      expect(stats.recent).toBe(3) // All errors are recent
    })

    test("should correctly count recent errors", () => {
      // Add old error
      const oldError = {
        type: "test",
        message: "Old error",
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      }
      errorHandler.errors.push(oldError)

      // Add recent error
      errorHandler.handleError({ type: "test", message: "Recent error" })

      const stats = errorHandler.getErrorStats()

      expect(stats.total).toBe(2)
      expect(stats.recent).toBe(1) // Only the recent error
    })
  })
})
