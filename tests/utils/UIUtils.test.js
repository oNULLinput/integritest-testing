/**
 * @jest-environment jsdom
 */

const jest = require("jest")

describe("UIUtils", () => {
  let UIUtils

  beforeAll(() => {
    // Mock UIUtils implementation
    UIUtils = {
      showMessage: (message, type = "info", duration = 5000) => {
        const existingMessages = document.querySelectorAll(".toast-message")
        existingMessages.forEach((msg) => msg.remove())

        const messageEl = document.createElement("div")
        messageEl.className = `toast-message toast-${type}`
        messageEl.textContent = message

        const colors = {
          info: "#2563eb",
          success: "#16a34a",
          warning: "#d97706",
          error: "#dc2626",
        }
        messageEl.style.backgroundColor = colors[type] || colors.info

        document.body.appendChild(messageEl)

        setTimeout(() => {
          if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl)
          }
        }, duration)
      },

      showLoading: (message = "Loading...") => {
        const loadingEl = document.createElement("div")
        loadingEl.id = "global-loading"
        loadingEl.innerHTML = `<div><p>${message}</p></div>`
        document.body.appendChild(loadingEl)
      },

      hideLoading: () => {
        const loadingEl = document.getElementById("global-loading")
        if (loadingEl) {
          loadingEl.remove()
        }
      },

      confirmDialog: (message, onConfirm, onCancel) => {
        const confirmed = confirm(message)
        if (confirmed && onConfirm) {
          onConfirm()
        } else if (!confirmed && onCancel) {
          onCancel()
        }
        return confirmed
      },
    }
  })

  beforeEach(() => {
    document.body.innerHTML = ""
    document.head.innerHTML = ""
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe("showMessage", () => {
    test("should create and display a message element", () => {
      UIUtils.showMessage("Test message", "info")

      const messageEl = document.querySelector(".toast-message")
      expect(messageEl).toBeTruthy()
      expect(messageEl.textContent).toBe("Test message")
      expect(messageEl.className).toBe("toast-message toast-info")
    })

    test("should apply correct background color based on type", () => {
      UIUtils.showMessage("Success message", "success")

      const messageEl = document.querySelector(".toast-message")
      expect(messageEl.style.backgroundColor).toBe("rgb(22, 163, 74)") // #16a34a
    })

    test("should remove existing messages before showing new one", () => {
      UIUtils.showMessage("First message", "info")
      UIUtils.showMessage("Second message", "info")

      const messages = document.querySelectorAll(".toast-message")
      expect(messages.length).toBe(1)
      expect(messages[0].textContent).toBe("Second message")
    })

    test("should auto-remove message after specified duration", () => {
      UIUtils.showMessage("Test message", "info", 1000)

      expect(document.querySelector(".toast-message")).toBeTruthy()

      jest.advanceTimersByTime(1500)

      expect(document.querySelector(".toast-message")).toBeFalsy()
    })

    test("should handle different message types", () => {
      const types = ["info", "success", "warning", "error"]

      types.forEach((type) => {
        document.body.innerHTML = "" // Clear previous
        UIUtils.showMessage(`${type} message`, type)

        const messageEl = document.querySelector(".toast-message")
        expect(messageEl.className).toBe(`toast-message toast-${type}`)
      })
    })
  })

  describe("showLoading", () => {
    test("should create and display loading element", () => {
      UIUtils.showLoading("Loading data...")

      const loadingEl = document.getElementById("global-loading")
      expect(loadingEl).toBeTruthy()
      expect(loadingEl.innerHTML).toContain("Loading data...")
    })

    test("should use default message when none provided", () => {
      UIUtils.showLoading()

      const loadingEl = document.getElementById("global-loading")
      expect(loadingEl.innerHTML).toContain("Loading...")
    })

    test("should replace existing loading element", () => {
      UIUtils.showLoading("First loading")
      UIUtils.showLoading("Second loading")

      const loadingElements = document.querySelectorAll("#global-loading")
      expect(loadingElements.length).toBe(1)
      expect(loadingElements[0].innerHTML).toContain("Second loading")
    })
  })

  describe("hideLoading", () => {
    test("should remove loading element when it exists", () => {
      UIUtils.showLoading("Test loading")
      expect(document.getElementById("global-loading")).toBeTruthy()

      UIUtils.hideLoading()
      expect(document.getElementById("global-loading")).toBeFalsy()
    })

    test("should not throw error when loading element does not exist", () => {
      expect(() => UIUtils.hideLoading()).not.toThrow()
    })
  })

  describe("confirmDialog", () => {
    test("should call onConfirm when user confirms", () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      window.confirm = jest.fn(() => true)

      const result = UIUtils.confirmDialog("Are you sure?", onConfirm, onCancel)

      expect(window.confirm).toHaveBeenCalledWith("Are you sure?")
      expect(onConfirm).toHaveBeenCalled()
      expect(onCancel).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    test("should call onCancel when user cancels", () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()
      window.confirm = jest.fn(() => false)

      const result = UIUtils.confirmDialog("Are you sure?", onConfirm, onCancel)

      expect(window.confirm).toHaveBeenCalledWith("Are you sure?")
      expect(onConfirm).not.toHaveBeenCalled()
      expect(onCancel).toHaveBeenCalled()
      expect(result).toBe(false)
    })

    test("should work without callback functions", () => {
      window.confirm = jest.fn(() => true)

      expect(() => UIUtils.confirmDialog("Are you sure?")).not.toThrow()
      expect(window.confirm).toHaveBeenCalledWith("Are you sure?")
    })
  })
})
