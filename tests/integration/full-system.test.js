/**
 * Integration tests for the complete IntegriTest utility system
 * Tests how different utilities work together
 */

const jest = require("jest")

describe("IntegriTest System Integration", () => {
  let DateUtils, ValidationUtils, StorageUtils, SecurityUtils, AnalyticsUtils
  let CacheManager, ErrorHandler

  beforeAll(() => {
    // Mock all utilities as they would be loaded in the browser
    DateUtils = {
      formatTime: (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
      },
      getTimeAgo: (date) => {
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)
        if (diffInSeconds < 60) return "just now"
        if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60)
          return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
        }
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} hour${hours > 1 ? "s" : ""} ago`
      },
    }

    ValidationUtils = {
      isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      isValidExamCode: (code) => code && code.trim().length >= 3,
      sanitizeInput: (input) => input.trim().replace(/[<>]/g, ""),
    }

    StorageUtils = {
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch (error) {
          return false
        }
      },
      getItem: (key) => {
        try {
          const item = localStorage.getItem(key)
          return item ? JSON.parse(item) : null
        } catch (error) {
          return null
        }
      },
    }

    SecurityUtils = {
      generateSessionId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
      validateSession: (sessionData) => {
        if (!sessionData) return false
        try {
          const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData
          const now = new Date()
          const loginTime = new Date(session.loginTime)
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60)
          return hoursSinceLogin < 8
        } catch (error) {
          return false
        }
      },
    }

    AnalyticsUtils = {
      trackEvent: (eventName, eventData = {}) => {
        const event = {
          name: eventName,
          data: eventData,
          timestamp: new Date().toISOString(),
          sessionId: SecurityUtils.generateSessionId(),
        }
        const events = StorageUtils.getItem("analytics_events") || []
        events.push(event)
        StorageUtils.setItem("analytics_events", events)
      },
      getEvents: () => StorageUtils.getItem("analytics_events") || [],
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe("User Session Workflow", () => {
    test("should handle complete user login and tracking workflow", () => {
      // 1. Validate user input
      const email = "student@university.edu"
      const examCode = "MATH101"

      expect(ValidationUtils.isValidEmail(email)).toBe(true)
      expect(ValidationUtils.isValidExamCode(examCode)).toBe(true)

      // 2. Create and store session
      const sessionId = SecurityUtils.generateSessionId()
      const sessionData = {
        email: email,
        examCode: examCode,
        loginTime: new Date().toISOString(),
        sessionId: sessionId,
      }

      expect(StorageUtils.setItem("userSession", sessionData)).toBe(true)

      // 3. Track login event
      AnalyticsUtils.trackEvent("user_login", {
        email: email,
        examCode: examCode,
      })

      // 4. Verify session is valid
      const storedSession = StorageUtils.getItem("userSession")
      expect(SecurityUtils.validateSession(storedSession)).toBe(true)

      // 5. Verify analytics were recorded
      const events = AnalyticsUtils.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe("user_login")
      expect(events[0].data.email).toBe(email)
    })

    test("should handle invalid user input gracefully", () => {
      const invalidEmail = "not-an-email"
      const shortExamCode = "AB"

      expect(ValidationUtils.isValidEmail(invalidEmail)).toBe(false)
      expect(ValidationUtils.isValidExamCode(shortExamCode)).toBe(false)

      // Should not create session with invalid data
      const sessionData = {
        email: invalidEmail,
        examCode: shortExamCode,
        loginTime: new Date().toISOString(),
      }

      // Even if stored, validation should fail
      StorageUtils.setItem("invalidSession", sessionData)
      const storedSession = StorageUtils.getItem("invalidSession")

      // Session validation should still work (validates time, not content)
      expect(SecurityUtils.validateSession(storedSession)).toBe(true)
    })
  })

  describe("Exam Timer Integration", () => {
    test("should format and track exam time correctly", () => {
      const examDuration = 3600 // 1 hour in seconds
      const startTime = new Date()

      // Format initial time
      expect(DateUtils.formatTime(examDuration)).toBe("60:00")

      // Simulate exam progress
      const halfwayPoint = examDuration / 2
      expect(DateUtils.formatTime(halfwayPoint)).toBe("30:00")

      // Track exam start
      AnalyticsUtils.trackEvent("exam_started", {
        duration: examDuration,
        startTime: startTime.toISOString(),
      })

      // Track exam progress
      AnalyticsUtils.trackEvent("exam_progress", {
        timeRemaining: halfwayPoint,
        percentComplete: 50,
      })

      const events = AnalyticsUtils.getEvents()
      expect(events).toHaveLength(2)
      expect(events[0].name).toBe("exam_started")
      expect(events[1].name).toBe("exam_progress")
    })
  })

  describe("Data Sanitization and Security", () => {
    test("should sanitize user input and maintain security", () => {
      const maliciousInput = '<script>alert("xss")</script>Student Name'
      const sanitized = ValidationUtils.sanitizeInput(maliciousInput)

      expect(sanitized).toBe('scriptalert("xss")/scriptStudent Name')
      expect(sanitized).not.toContain("<")
      expect(sanitized).not.toContain(">")

      // Store sanitized data
      const userData = {
        name: sanitized,
        sessionId: SecurityUtils.generateSessionId(),
      }

      StorageUtils.setItem("userData", userData)
      const retrieved = StorageUtils.getItem("userData")

      expect(retrieved.name).toBe(sanitized)
      expect(retrieved.sessionId).toBeDefined()
    })
  })

  describe("Error Handling and Recovery", () => {
    test("should handle storage failures gracefully", () => {
      // Mock localStorage failure
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error("Storage quota exceeded")
      })

      // Should return false but not throw
      const result = StorageUtils.setItem("testKey", "testValue")
      expect(result).toBe(false)

      // Restore original function
      localStorage.setItem = originalSetItem
    })

    test("should handle corrupted session data", () => {
      // Store corrupted JSON
      localStorage.setItem("corruptedSession", "invalid json {")

      const session = StorageUtils.getItem("corruptedSession")
      expect(session).toBeNull()

      // Validation should handle null gracefully
      expect(SecurityUtils.validateSession(session)).toBe(false)
    })
  })

  describe("Time-based Operations", () => {
    test("should handle time calculations across utilities", () => {
      jest.useFakeTimers()
      const baseTime = new Date("2022-01-01T12:00:00Z")
      jest.setSystemTime(baseTime)

      // Create session
      const sessionData = {
        loginTime: baseTime.toISOString(),
        userId: "test123",
      }

      StorageUtils.setItem("timeSession", sessionData)

      // Fast forward 2 hours
      jest.advanceTimersByTime(2 * 60 * 60 * 1000)

      // Session should still be valid (< 8 hours)
      const session = StorageUtils.getItem("timeSession")
      expect(SecurityUtils.validateSession(session)).toBe(true)

      // Check time ago formatting
      expect(DateUtils.getTimeAgo(baseTime)).toBe("2 hours ago")

      // Fast forward to 9 hours
      jest.advanceTimersByTime(7 * 60 * 60 * 1000)

      // Session should now be expired
      expect(SecurityUtils.validateSession(session)).toBe(false)

      jest.useRealTimers()
    })
  })

  describe("Analytics and Storage Integration", () => {
    test("should maintain analytics data integrity", () => {
      // Track multiple events
      const events = [
        { name: "page_view", data: { page: "exam" } },
        { name: "question_answered", data: { questionId: 1, answer: "A" } },
        { name: "exam_submitted", data: { score: 85, duration: 3600 } },
      ]

      events.forEach((event) => {
        AnalyticsUtils.trackEvent(event.name, event.data)
      })

      // Verify all events were stored
      const storedEvents = AnalyticsUtils.getEvents()
      expect(storedEvents).toHaveLength(3)

      // Verify data integrity
      storedEvents.forEach((event, index) => {
        expect(event.name).toBe(events[index].name)
        expect(event.data).toEqual(events[index].data)
        expect(event.timestamp).toBeDefined()
        expect(event.sessionId).toBeDefined()
      })

      // Verify storage mechanism
      const rawStorageData = StorageUtils.getItem("analytics_events")
      expect(rawStorageData).toEqual(storedEvents)
    })
  })
})
