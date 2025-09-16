import jest from "jest"

describe("CacheManager", () => {
  let CacheManager
  let cacheManager

  beforeAll(() => {
    // Mock the CacheManager class
    CacheManager = class {
      constructor() {
        this.memoryCache = new Map()
        this.cacheConfig = {
          examList: { ttl: 300000, key: "exam_list" },
          instructorData: { ttl: 600000, key: "instructor_data" },
          examDetails: { ttl: 180000, key: "exam_details" },
          studentSessions: { ttl: 60000, key: "student_sessions" },
        }
      }

      set(key, data, ttl = 300000) {
        const expiresAt = Date.now() + ttl
        this.memoryCache.set(key, { data, expiresAt })

        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify({ data, expiresAt }))
        } catch (e) {
          console.warn("[v0] Cache localStorage failed:", e)
        }
      }

      get(key) {
        const memoryItem = this.memoryCache.get(key)
        if (memoryItem && memoryItem.expiresAt > Date.now()) {
          return memoryItem.data
        }

        try {
          const stored = localStorage.getItem(`cache_${key}`)
          if (stored) {
            const { data, expiresAt } = JSON.parse(stored)
            if (expiresAt > Date.now()) {
              this.memoryCache.set(key, { data, expiresAt })
              return data
            }
          }
        } catch (e) {
          console.warn("[v0] Cache localStorage read failed:", e)
        }

        return null
      }

      invalidate(key) {
        this.memoryCache.delete(key)
        try {
          localStorage.removeItem(`cache_${key}`)
        } catch (e) {
          console.warn("[v0] Cache invalidation failed:", e)
        }
      }

      clear() {
        this.memoryCache.clear()
        try {
          const keys = Object.keys(localStorage)
          keys.forEach((key) => {
            if (key.startsWith("cache_")) {
              localStorage.removeItem(key)
            }
          })
        } catch (e) {
          console.warn("[v0] Cache clear failed:", e)
        }
      }

      async getOrFetch(key, fetchFunction, ttl = 300000) {
        const cached = this.get(key)
        if (cached) {
          return cached
        }

        try {
          const data = await fetchFunction()
          this.set(key, data, ttl)
          return data
        } catch (error) {
          console.error("[v0] Cache fetch failed:", error)
          throw error
        }
      }
    }
  })

  beforeEach(() => {
    cacheManager = new CacheManager()
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2022-01-01T12:00:00Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("constructor", () => {
    test("should initialize with empty memory cache and default config", () => {
      expect(cacheManager.memoryCache).toBeInstanceOf(Map)
      expect(cacheManager.memoryCache.size).toBe(0)
      expect(cacheManager.cacheConfig).toBeDefined()
      expect(cacheManager.cacheConfig.examList.ttl).toBe(300000)
    })
  })

  describe("set", () => {
    test("should store data in memory cache with TTL", () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData, 60000)

      const cached = cacheManager.memoryCache.get("testKey")
      expect(cached.data).toEqual(testData)
      expect(cached.expiresAt).toBe(Date.now() + 60000)
    })

    test("should store data in localStorage", () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData, 60000)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cache_testKey",
        JSON.stringify({ data: testData, expiresAt: Date.now() + 60000 }),
      )
    })

    test("should use default TTL when not specified", () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData)

      const cached = cacheManager.memoryCache.get("testKey")
      expect(cached.expiresAt).toBe(Date.now() + 300000)
    })

    test("should handle localStorage errors gracefully", () => {
      localStorage.setItem.mockImplementationOnce(() => {
        throw new Error("Storage quota exceeded")
      })

      expect(() => {
        cacheManager.set("testKey", { data: "test" })
      }).not.toThrow()

      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe("get", () => {
    test("should retrieve data from memory cache when not expired", () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData, 60000)

      const result = cacheManager.get("testKey")
      expect(result).toEqual(testData)
    })

    test("should return null for expired memory cache", () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData, 60000)

      // Fast forward time beyond expiration
      jest.advanceTimersByTime(70000)

      const result = cacheManager.get("testKey")
      expect(result).toBeNull()
    })

    test("should fallback to localStorage when memory cache is expired", () => {
      const testData = { id: 1, name: "Test" }
      const expiresAt = Date.now() + 60000

      localStorage.getItem.mockReturnValue(JSON.stringify({ data: testData, expiresAt }))

      const result = cacheManager.get("testKey")
      expect(result).toEqual(testData)
      expect(localStorage.getItem).toHaveBeenCalledWith("cache_testKey")
    })

    test("should return null for expired localStorage data", () => {
      const testData = { id: 1, name: "Test" }
      const expiresAt = Date.now() - 10000 // Expired

      localStorage.getItem.mockReturnValue(JSON.stringify({ data: testData, expiresAt }))

      const result = cacheManager.get("testKey")
      expect(result).toBeNull()
    })

    test("should handle localStorage read errors", () => {
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error("localStorage not available")
      })

      const result = cacheManager.get("testKey")
      expect(result).toBeNull()
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe("invalidate", () => {
    test("should remove data from both memory and localStorage", () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData)

      cacheManager.invalidate("testKey")

      expect(cacheManager.memoryCache.has("testKey")).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith("cache_testKey")
    })

    test("should handle localStorage removal errors", () => {
      localStorage.removeItem.mockImplementationOnce(() => {
        throw new Error("Cannot remove item")
      })

      expect(() => {
        cacheManager.invalidate("testKey")
      }).not.toThrow()

      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe("clear", () => {
    test("should clear memory cache and all localStorage cache entries", () => {
      cacheManager.set("key1", "data1")
      cacheManager.set("key2", "data2")

      // Mock localStorage keys
      Object.keys = jest.fn().mockReturnValue(["cache_key1", "cache_key2", "other_key"])

      cacheManager.clear()

      expect(cacheManager.memoryCache.size).toBe(0)
      expect(localStorage.removeItem).toHaveBeenCalledWith("cache_key1")
      expect(localStorage.removeItem).toHaveBeenCalledWith("cache_key2")
      expect(localStorage.removeItem).not.toHaveBeenCalledWith("other_key")
    })
  })

  describe("getOrFetch", () => {
    test("should return cached data when available", async () => {
      const testData = { id: 1, name: "Test" }
      cacheManager.set("testKey", testData)

      const fetchFunction = jest.fn()
      const result = await cacheManager.getOrFetch("testKey", fetchFunction)

      expect(result).toEqual(testData)
      expect(fetchFunction).not.toHaveBeenCalled()
    })

    test("should fetch and cache data when not cached", async () => {
      const testData = { id: 1, name: "Test" }
      const fetchFunction = jest.fn().mockResolvedValue(testData)

      const result = await cacheManager.getOrFetch("testKey", fetchFunction, 60000)

      expect(result).toEqual(testData)
      expect(fetchFunction).toHaveBeenCalled()
      expect(cacheManager.get("testKey")).toEqual(testData)
    })

    test("should throw error when fetch fails", async () => {
      const fetchError = new Error("Fetch failed")
      const fetchFunction = jest.fn().mockRejectedValue(fetchError)

      await expect(cacheManager.getOrFetch("testKey", fetchFunction)).rejects.toThrow("Fetch failed")
      expect(console.error).toHaveBeenCalled()
    })
  })
})
