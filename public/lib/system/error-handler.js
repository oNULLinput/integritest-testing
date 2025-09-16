class ErrorHandler {
  constructor() {
    this.errors = []
    this.maxErrors = 50
    this.init()
  }

  init() {
    // Global error handlers
    window.addEventListener("error", (event) => {
      this.handleError({
        type: "javascript",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    })

    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        type: "promise",
        message: event.reason?.message || "Unhandled promise rejection",
        error: event.reason,
      })
    })

    // Network error monitoring
    this.monitorNetworkErrors()
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

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    console.error("[v0] Error captured:", error)

    // Show user-friendly error message
    this.showUserError(error)

    // Log to server (in real implementation)
    this.logToServer(error)
  }

  showUserError(error) {
    let title = "Something went wrong"
    let message = "We're working to fix this issue. Please try again."
    let actions = []

    // Customize message based on error type
    switch (error.type) {
      case "network":
        title = "Connection Problem"
        message = "Please check your internet connection and try again."
        actions = [
          {
            id: "retry",
            label: "Retry",
            handler: () => window.location.reload(),
          },
        ]
        break

      case "javascript":
        if (error.message?.includes("fetch")) {
          title = "Loading Error"
          message = "Failed to load data. Please refresh the page."
        }
        break

      case "validation":
        title = "Input Error"
        message = error.message || "Please check your input and try again."
        break

      case "auth":
        title = "Authentication Error"
        message = "Please log in again to continue."
        actions = [
          {
            id: "login",
            label: "Log In",
            handler: () => (window.location.href = "index.html"),
          },
        ]
        break
    }

    // Don't show notification for minor errors
    if (error.severity !== "low") {
      window.notificationManager?.error(title, message, {
        duration: 8000,
        actions,
      })
    }
  }

  monitorNetworkErrors() {
    // Monitor fetch failures
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          this.handleError({
            type: "network",
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
          })
        }
        return response
      } catch (error) {
        this.handleError({
          type: "network",
          message: error.message,
          url: args[0],
          error,
        })
        throw error
      }
    }
  }

  logToServer(error) {
    // In a real implementation, send to your error tracking service
    try {
      const errorLog = {
        ...error,
        sessionId: this.getSessionId(),
        userId: this.getUserId(),
      }

      // Store locally for now
      const errorLogs = JSON.parse(localStorage.getItem("errorLogs") || "[]")
      errorLogs.push(errorLog)

      // Keep only last 100 errors
      if (errorLogs.length > 100) {
        errorLogs.splice(0, errorLogs.length - 100)
      }

      localStorage.setItem("errorLogs", JSON.stringify(errorLogs))
    } catch (e) {
      console.error("[v0] Failed to log error:", e)
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem("sessionId")
    if (!sessionId) {
      sessionId = Date.now() + "_" + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem("sessionId", sessionId)
    }
    return sessionId
  }

  getUserId() {
    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const instructorSession = JSON.parse(localStorage.getItem("instructorSession") || "{}")
    return studentInfo.studentNumber || instructorSession.username || "anonymous"
  }

  // Public methods for manual error reporting
  reportError(message, type = "manual", severity = "medium") {
    this.handleError({
      type,
      message,
      severity,
      manual: true,
    })
  }

  reportValidationError(message) {
    this.handleError({
      type: "validation",
      message,
      severity: "low",
    })
  }

  reportNetworkError(message, url) {
    this.handleError({
      type: "network",
      message,
      url,
      severity: "high",
    })
  }

  reportAuthError(message) {
    this.handleError({
      type: "auth",
      message,
      severity: "high",
    })
  }

  // Error recovery methods
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
      recent: this.errors.filter((error) => Date.now() - new Date(error.timestamp).getTime() < 3600000).length, // Last hour
    }

    this.errors.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
    })

    return stats
  }
}

// Global instance
window.errorHandler = new ErrorHandler()
