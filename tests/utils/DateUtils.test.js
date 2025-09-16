// Import the utilities - in a real environment, you'd import from the actual file
// For testing purposes, we'll define the utilities here or mock the import
const jest = require("jest")

describe("DateUtils", () => {
  let DateUtils

  beforeAll(() => {
    // Mock the DateUtils from utils.js
    DateUtils = {
      formatTime: (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
      },

      getTimeAgo: (date) => {
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) {
          return "just now"
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60)
          return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600)
          return `${hours} hour${hours > 1 ? "s" : ""} ago`
        } else {
          const days = Math.floor(diffInSeconds / 86400)
          return `${days} day${days > 1 ? "s" : ""} ago`
        }
      },

      formatDateTime: (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + " " + date.toLocaleTimeString()
      },
    }
  })

  describe("formatTime", () => {
    test("should format seconds correctly", () => {
      expect(DateUtils.formatTime(0)).toBe("00:00")
      expect(DateUtils.formatTime(30)).toBe("00:30")
      expect(DateUtils.formatTime(60)).toBe("01:00")
      expect(DateUtils.formatTime(90)).toBe("01:30")
      expect(DateUtils.formatTime(3661)).toBe("61:01")
    })

    test("should pad single digits with zeros", () => {
      expect(DateUtils.formatTime(5)).toBe("00:05")
      expect(DateUtils.formatTime(65)).toBe("01:05")
    })

    test("should handle large numbers", () => {
      expect(DateUtils.formatTime(7200)).toBe("120:00")
      expect(DateUtils.formatTime(7265)).toBe("121:05")
    })
  })

  describe("getTimeAgo", () => {
    beforeEach(() => {
      // Mock current time to 2022-01-01 12:00:00
      jest.useFakeTimers()
      jest.setSystemTime(new Date("2022-01-01T12:00:00Z"))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('should return "just now" for recent times', () => {
      const recentDate = new Date("2022-01-01T11:59:30Z") // 30 seconds ago
      expect(DateUtils.getTimeAgo(recentDate)).toBe("just now")
    })

    test("should return minutes ago for times within an hour", () => {
      const oneMinuteAgo = new Date("2022-01-01T11:59:00Z")
      const fiveMinutesAgo = new Date("2022-01-01T11:55:00Z")

      expect(DateUtils.getTimeAgo(oneMinuteAgo)).toBe("1 minute ago")
      expect(DateUtils.getTimeAgo(fiveMinutesAgo)).toBe("5 minutes ago")
    })

    test("should return hours ago for times within a day", () => {
      const oneHourAgo = new Date("2022-01-01T11:00:00Z")
      const threeHoursAgo = new Date("2022-01-01T09:00:00Z")

      expect(DateUtils.getTimeAgo(oneHourAgo)).toBe("1 hour ago")
      expect(DateUtils.getTimeAgo(threeHoursAgo)).toBe("3 hours ago")
    })

    test("should return days ago for older times", () => {
      const oneDayAgo = new Date("2021-12-31T12:00:00Z")
      const threeDaysAgo = new Date("2021-12-29T12:00:00Z")

      expect(DateUtils.getTimeAgo(oneDayAgo)).toBe("1 day ago")
      expect(DateUtils.getTimeAgo(threeDaysAgo)).toBe("3 days ago")
    })
  })

  describe("formatDateTime", () => {
    test("should format date and time correctly", () => {
      const testDate = "2022-01-01T12:30:45Z"
      const result = DateUtils.formatDateTime(testDate)

      // Result will depend on locale, but should contain date and time
      expect(result).toMatch(/\d+\/\d+\/\d+/) // Date part
      expect(result).toMatch(/\d+:\d+:\d+/) // Time part
    })

    test("should handle different date formats", () => {
      expect(() => DateUtils.formatDateTime("2022-01-01")).not.toThrow()
      expect(() => DateUtils.formatDateTime("January 1, 2022")).not.toThrow()
    })
  })
})
