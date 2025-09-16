describe("SecurityUtils", () => {
  let SecurityUtils
  const jest = require("jest") // Declare the jest variable

  beforeAll(() => {
    SecurityUtils = {
      generateSessionId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
      },

      hashPassword: (password) => {
        let hash = 0
        for (let i = 0; i < password.length; i++) {
          const char = password.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash // Convert to 32-bit integer
        }
        return hash.toString()
      },

      validateSession: (sessionData) => {
        if (!sessionData) return false

        try {
          const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData
          const now = new Date()
          const loginTime = new Date(session.loginTime)
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60)

          return hoursSinceLogin < 8
        } catch (error) {
          console.error("[v0] Session validation error:", error)
          return false
        }
      },
    }
  })

  describe("generateSessionId", () => {
    test("should generate unique session IDs", () => {
      const id1 = SecurityUtils.generateSessionId()
      const id2 = SecurityUtils.generateSessionId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe("string")
      expect(id1.length).toBeGreaterThan(10)
    })

    test("should include timestamp component", () => {
      const mockTime = 1640995200000
      Date.now = jest.fn(() => mockTime)

      const sessionId = SecurityUtils.generateSessionId()
      const timestampPart = mockTime.toString(36)

      expect(sessionId).toContain(timestampPart)
    })
  })

  describe("hashPassword", () => {
    test("should hash passwords consistently", () => {
      const password = "testPassword123"
      const hash1 = SecurityUtils.hashPassword(password)
      const hash2 = SecurityUtils.hashPassword(password)

      expect(hash1).toBe(hash2)
      expect(typeof hash1).toBe("string")
    })

    test("should produce different hashes for different passwords", () => {
      const hash1 = SecurityUtils.hashPassword("password1")
      const hash2 = SecurityUtils.hashPassword("password2")

      expect(hash1).not.toBe(hash2)
    })

    test("should handle empty passwords", () => {
      const hash = SecurityUtils.hashPassword("")
      expect(hash).toBe("0")
    })

    test("should handle special characters", () => {
      const hash1 = SecurityUtils.hashPassword("p@ssw0rd!")
      const hash2 = SecurityUtils.hashPassword("password")

      expect(hash1).not.toBe(hash2)
      expect(typeof hash1).toBe("string")
    })
  })

  describe("validateSession", () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date("2022-01-01T12:00:00Z"))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test("should validate active sessions", () => {
      const validSession = {
        loginTime: "2022-01-01T08:00:00Z", // 4 hours ago
      }

      expect(SecurityUtils.validateSession(validSession)).toBe(true)
    })

    test("should reject expired sessions", () => {
      const expiredSession = {
        loginTime: "2022-01-01T03:00:00Z", // 9 hours ago
      }

      expect(SecurityUtils.validateSession(expiredSession)).toBe(false)
    })

    test("should handle string session data", () => {
      const sessionString = JSON.stringify({
        loginTime: "2022-01-01T08:00:00Z",
      })

      expect(SecurityUtils.validateSession(sessionString)).toBe(true)
    })

    test("should handle invalid session data", () => {
      expect(SecurityUtils.validateSession(null)).toBe(false)
      expect(SecurityUtils.validateSession(undefined)).toBe(false)
      expect(SecurityUtils.validateSession("invalid json")).toBe(false)
      expect(SecurityUtils.validateSession({})).toBe(false)
    })

    test("should handle malformed session objects", () => {
      const malformedSession = {
        loginTime: "invalid date",
      }

      expect(SecurityUtils.validateSession(malformedSession)).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })
  })
})
