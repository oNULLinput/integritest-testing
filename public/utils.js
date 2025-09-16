// Utility functions for IntegriTest system

// Date and time utilities
const DateUtils = {
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

// Local storage utilities
const StorageUtils = {
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

// Validation utilities
const ValidationUtils = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isValidExamCode: (code) => {
    return code && code.trim().length >= 3
  },

  isValidName: (name) => {
    return name && name.trim().length >= 2
  },

  isValidStudentNumber: (number) => {
    return number && number.trim().length >= 3
  },

  sanitizeInput: (input) => {
    return input.trim().replace(/[<>]/g, "")
  },
}

// UI utilities
const UIUtils = {
  showMessage: (message, type = "info", duration = 5000) => {
    // Remove existing messages
    const existingMessages = document.querySelectorAll(".toast-message")
    existingMessages.forEach((msg) => msg.remove())

    // Create message element
    const messageEl = document.createElement("div")
    messageEl.className = `toast-message toast-${type}`
    messageEl.textContent = message

    // Add styles
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    `

    // Set background color based on type
    const colors = {
      info: "#2563eb",
      success: "#16a34a",
      warning: "#d97706",
      error: "#dc2626",
    }
    messageEl.style.backgroundColor = colors[type] || colors.info

    // Add animation styles
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)

    // Add to DOM
    document.body.appendChild(messageEl)

    // Auto remove
    setTimeout(() => {
      messageEl.style.animation = "slideOut 0.3s ease-in"
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl)
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      }, 300)
    }, duration)
  },

  showLoading: (message = "Loading...") => {
    const loadingEl = document.createElement("div")
    loadingEl.id = "global-loading"
    loadingEl.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        z-index: 10000;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        "></div>
        <p style="color: white; font-size: 16px;">${message}</p>
      </div>
    `

    // Add spin animation
    const style = document.createElement("style")
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)

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

// Security utilities
const SecurityUtils = {
  generateSessionId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  },

  hashPassword: (password) => {
    // Simple hash for demo purposes - use proper hashing in production
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

      // Session expires after 8 hours
      return hoursSinceLogin < 8
    } catch (error) {
      console.error("[v0] Session validation error:", error)
      return false
    }
  },
}

// Analytics utilities
const AnalyticsUtils = {
  trackEvent: (eventName, eventData = {}) => {
    const event = {
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
      sessionId: SecurityUtils.generateSessionId(),
    }

    console.log("[v0] Analytics Event:", event)

    // Store in localStorage for demo purposes
    const events = StorageUtils.getItem("analytics_events") || []
    events.push(event)

    // Keep only last 100 events
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

// Export utilities for use in other scripts
if (typeof window !== "undefined") {
  window.IntegriTestUtils = {
    DateUtils,
    StorageUtils,
    ValidationUtils,
    UIUtils,
    SecurityUtils,
    AnalyticsUtils,
  }
}

// Initialize utilities
console.log("[v0] IntegriTest utilities loaded successfully")
