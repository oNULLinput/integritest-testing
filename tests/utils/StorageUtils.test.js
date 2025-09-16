describe("StorageUtils", () => {
  let StorageUtils

  beforeAll(() => {
    StorageUtils = {
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch (error) {
          console.error("[v0] Storage error:", error)
          return false
        }
      },

      getItem: (key) => {
        try {
          const item = localStorage.getItem(key)
          return item ? JSON.parse(item) : null
        } catch (error) {
          console.error("[v0] Storage retrieval error:", error)
          return null
        }
      },

      removeItem: (key) => {
        try {
          localStorage.removeItem(key)
          return true
        } catch (error) {
          console.error("[v0] Storage removal error:", error)
          return false
        }
      },

      clear: () => {
        try {
          localStorage.clear()
          return true
        } catch (error) {
          console.error("[v0] Storage clear error:", error)
          return false
        }
      },
    }
  })

  describe("setItem", () => {
    test("should store items successfully", () => {
      const testData = { name: "John", age: 30 }
      const result = StorageUtils.setItem("testKey", testData)

      expect(result).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith("testKey", JSON.stringify(testData))
    })

    test("should handle storage errors gracefully", () => {
      localStorage.setItem.mockImplementationOnce(() => {
        throw new Error("Storage quota exceeded")
      })

      const result = StorageUtils.setItem("testKey", "testValue")
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })

    test("should handle different data types", () => {
      StorageUtils.setItem("string", "test")
      StorageUtils.setItem("number", 42)
      StorageUtils.setItem("boolean", true)
      StorageUtils.setItem("array", [1, 2, 3])
      StorageUtils.setItem("object", { key: "value" })

      expect(localStorage.setItem).toHaveBeenCalledTimes(5)
    })
  })

  describe("getItem", () => {
    test("should retrieve stored items", () => {
      const testData = { name: "Jane", age: 25 }
      localStorage.getItem.mockReturnValue(JSON.stringify(testData))

      const result = StorageUtils.getItem("testKey")
      expect(result).toEqual(testData)
      expect(localStorage.getItem).toHaveBeenCalledWith("testKey")
    })

    test("should return null for non-existent items", () => {
      localStorage.getItem.mockReturnValue(null)

      const result = StorageUtils.getItem("nonExistentKey")
      expect(result).toBeNull()
    })

    test("should handle JSON parsing errors", () => {
      localStorage.getItem.mockReturnValue("invalid json {")

      const result = StorageUtils.getItem("corruptedKey")
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    test("should handle localStorage access errors", () => {
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error("localStorage not available")
      })

      const result = StorageUtils.getItem("testKey")
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe("removeItem", () => {
    test("should remove items successfully", () => {
      const result = StorageUtils.removeItem("testKey")

      expect(result).toBe(true)
      expect(localStorage.removeItem).toHaveBeenCalledWith("testKey")
    })

    test("should handle removal errors", () => {
      localStorage.removeItem.mockImplementationOnce(() => {
        throw new Error("Cannot remove item")
      })

      const result = StorageUtils.removeItem("testKey")
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe("clear", () => {
    test("should clear all storage successfully", () => {
      const result = StorageUtils.clear()

      expect(result).toBe(true)
      expect(localStorage.clear).toHaveBeenCalled()
    })

    test("should handle clear errors", () => {
      localStorage.clear.mockImplementationOnce(() => {
        throw new Error("Cannot clear storage")
      })

      const result = StorageUtils.clear()
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })
  })
})
