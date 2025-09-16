class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.cacheConfig = {
      examList: { ttl: 300000, key: "exam_list" }, // 5 minutes
      instructorData: { ttl: 600000, key: "instructor_data" }, // 10 minutes
      examDetails: { ttl: 180000, key: "exam_details" }, // 3 minutes
      studentSessions: { ttl: 60000, key: "student_sessions" }, // 1 minute
    }
  }

  // Set cache with TTL
  set(key, data, ttl = 300000) {
    const expiresAt = Date.now() + ttl
    this.memoryCache.set(key, { data, expiresAt })

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({ data, expiresAt }))
    } catch (e) {
      console.warn("[v0] Cache localStorage failed:", e)
    }
  }

  // Get from cache with expiration check
  get(key) {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && memoryItem.expiresAt > Date.now()) {
      return memoryItem.data
    }

    // Check localStorage cache
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const { data, expiresAt } = JSON.parse(stored)
        if (expiresAt > Date.now()) {
          // Restore to memory cache
          this.memoryCache.set(key, { data, expiresAt })
          return data
        }
      }
    } catch (e) {
      console.warn("[v0] Cache localStorage read failed:", e)
    }

    return null
  }

  // Invalidate specific cache
  invalidate(key) {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch (e) {
      console.warn("[v0] Cache invalidation failed:", e)
    }
  }

  // Clear all cache
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

  // Get cached or fetch with automatic caching
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

// Global cache instance
window.cacheManager = new CacheManager()
