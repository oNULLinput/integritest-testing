import jest from "jest"

describe("AnalyticsUtils", () => {
  let AnalyticsUtils
  let StorageUtils
  let SecurityUtils

  beforeAll(() => {
    // Mock dependencies
    StorageUtils = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }

    SecurityUtils = {
      generateSessionId: jest.fn(() => "mock-session-id"),
    }

    AnalyticsUtils = {
      trackEvent: (eventName, eventData = {}) => {
        const event = {
          name: eventName,
          data: eventData,
          timestamp: new Date().toISOString(),
          sessionId: SecurityUtils.generateSessionId(),
        }

        console.log("[v0] Analytics Event:", event)

        const events = StorageUtils.getItem("analytics_events") || []
        events.push(event)

        if (events.length > 100) {
          events.splice(0, events.length - 100)
        }

        StorageUtils.setItem("analytics_events", events)
      },

      getEvents: () => {
        return StorageUtils.getItem("analytics_events") || []
      },

      clearEvents: () => {
        StorageUtils.removeItem("analytics_events")
      },
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2022-01-01T12:00:00Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("trackEvent", () => {
    test("should track event with correct structure", () => {
      StorageUtils.getItem.mockReturnValue([])

      AnalyticsUtils.trackEvent("user_login", { userId: "123" })

      expect(StorageUtils.setItem).toHaveBeenCalledWith("analytics_events", [
        {
          name: "user_login",
          data: { userId: "123" },
          timestamp: "2022-01-01T12:00:00.000Z",
          sessionId: "mock-session-id",
        },
      ])
    })

    test("should track event without additional data", () => {
      StorageUtils.getItem.mockReturnValue([])

      AnalyticsUtils.trackEvent("page_view")

      expect(StorageUtils.setItem).toHaveBeenCalledWith("analytics_events", [
        {
          name: "page_view",
          data: {},
          timestamp: "2022-01-01T12:00:00.000Z",
          sessionId: "mock-session-id",
        },
      ])
    })

    test("should append to existing events", () => {
      const existingEvents = [{ name: "existing_event", data: {}, timestamp: "2022-01-01T11:00:00.000Z" }]
      StorageUtils.getItem.mockReturnValue(existingEvents)

      AnalyticsUtils.trackEvent("new_event", { test: "data" })

      expect(StorageUtils.setItem).toHaveBeenCalledWith("analytics_events", [
        { name: "existing_event", data: {}, timestamp: "2022-01-01T11:00:00.000Z" },
        {
          name: "new_event",
          data: { test: "data" },
          timestamp: "2022-01-01T12:00:00.000Z",
          sessionId: "mock-session-id",
        },
      ])
    })

    test("should limit events to 100 entries", () => {
      // Create 100 existing events
      const existingEvents = Array.from({ length: 100 }, (_, i) => ({
        name: `event_${i}`,
        data: {},
        timestamp: new Date(Date.now() - (100 - i) * 1000).toISOString(),
      }))
      StorageUtils.getItem.mockReturnValue(existingEvents)

      AnalyticsUtils.trackEvent("new_event")

      const savedEvents = StorageUtils.setItem.mock.calls[0][1]
      expect(savedEvents.length).toBe(100)
      expect(savedEvents[0].name).toBe("event_1") // First event removed
      expect(savedEvents[99].name).toBe("new_event") // New event added
    })

    test("should log event to console", () => {
      StorageUtils.getItem.mockReturnValue([])
      const consoleSpy = jest.spyOn(console, "log").mockImplementation()

      AnalyticsUtils.trackEvent("test_event", { test: "data" })

      expect(consoleSpy).toHaveBeenCalledWith(
        "[v0] Analytics Event:",
        expect.objectContaining({
          name: "test_event",
          data: { test: "data" },
        }),
      )

      consoleSpy.mockRestore()
    })
  })

  describe("getEvents", () => {
    test("should return stored events", () => {
      const mockEvents = [
        { name: "event1", data: {}, timestamp: "2022-01-01T12:00:00.000Z" },
        { name: "event2", data: {}, timestamp: "2022-01-01T12:01:00.000Z" },
      ]
      StorageUtils.getItem.mockReturnValue(mockEvents)

      const result = AnalyticsUtils.getEvents()

      expect(result).toEqual(mockEvents)
      expect(StorageUtils.getItem).toHaveBeenCalledWith("analytics_events")
    })

    test("should return empty array when no events stored", () => {
      StorageUtils.getItem.mockReturnValue(null)

      const result = AnalyticsUtils.getEvents()

      expect(result).toEqual([])
    })
  })

  describe("clearEvents", () => {
    test("should remove analytics events from storage", () => {
      AnalyticsUtils.clearEvents()

      expect(StorageUtils.removeItem).toHaveBeenCalledWith("analytics_events")
    })
  })
})
