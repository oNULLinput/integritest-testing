class RealTimeMonitor {
  constructor() {
    this.activeConnections = new Map()
    this.monitoringInterval = null
    this.updateFrequency = 5000 // 5 seconds
    this.init()
  }

  init() {
    this.startMonitoring()
    this.setupEventListeners()
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(() => {
      this.updateActiveStudents()
      this.checkSystemHealth()
      this.updateDashboardMetrics()
    }, this.updateFrequency)

    console.log("[v0] Real-time monitoring started")
  }

  updateActiveStudents() {
    const activeStreams = JSON.parse(localStorage.getItem("activeStreams") || "[]")
    const currentTime = new Date()

    // Filter out stale connections (older than 2 minutes)
    const activeConnections = activeStreams.filter((stream) => {
      const streamTime = new Date(stream.timestamp)
      return currentTime - streamTime < 120000 // 2 minutes
    })

    // Update localStorage with filtered connections
    localStorage.setItem("activeStreams", JSON.stringify(activeConnections))

    // Update UI
    this.updateStudentsList(activeConnections)
    this.updateConnectionCount(activeConnections.length)

    return activeConnections
  }

  updateStudentsList(connections) {
    const container = document.getElementById("active-students-list")
    if (!container) return

    if (connections.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
          <p>No students currently taking exams</p>
        </div>
      `
      return
    }

    container.innerHTML = connections
      .map(
        (connection) => `
      <div class="student-connection-item" data-student-id="${connection.studentId}">
        <div class="student-info">
          <div class="student-avatar">
            <span>${connection.studentName.charAt(0)}</span>
          </div>
          <div class="student-details">
            <div class="student-name">${connection.studentName}</div>
            <div class="student-exam">Exam: ${connection.examCode}</div>
          </div>
        </div>
        <div class="connection-status">
          <div class="status-indicator online"></div>
          <div class="connection-time">${this.formatConnectionTime(connection.timestamp)}</div>
        </div>
        <div class="student-actions">
          <button class="btn btn-sm btn-outline" onclick="window.realTimeMonitor.viewStudentFeed('${connection.studentId}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            View
          </button>
        </div>
      </div>
    `,
      )
      .join("")
  }

  updateConnectionCount(count) {
    const countElement = document.getElementById("students-online-count")
    if (countElement) {
      countElement.textContent = count
    }

    // Update status manager
    if (window.statusManager) {
      window.statusManager.setStatus("activeStudents", count)
    }
  }

  formatConnectionTime(timestamp) {
    const now = new Date()
    const connectionTime = new Date(timestamp)
    const diff = now - connectionTime

    if (diff < 60000) return "Just connected"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return connectionTime.toLocaleTimeString()
  }

  checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      metrics: {
        activeConnections: this.activeConnections.size,
        memoryUsage: this.getMemoryUsage(),
        responseTime: this.measureResponseTime(),
      },
    }

    // Store health data
    const healthHistory = JSON.parse(localStorage.getItem("systemHealth") || "[]")
    healthHistory.push(health)

    // Keep only last 100 entries
    if (healthHistory.length > 100) {
      healthHistory.splice(0, healthHistory.length - 100)
    }

    localStorage.setItem("systemHealth", JSON.stringify(healthHistory))

    // Update system status
    this.updateSystemStatus(health)
  }

  getMemoryUsage() {
    // Estimate memory usage based on localStorage size
    let totalSize = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length
      }
    }
    return Math.min((totalSize / 1024 / 1024) * 10, 100) // Rough estimate as percentage
  }

  measureResponseTime() {
    const start = performance.now()
    // Simulate a quick operation
    JSON.parse(localStorage.getItem("examSubmissions") || "[]")
    return performance.now() - start
  }

  updateSystemStatus(health) {
    const statusElement = document.getElementById("system-health-status")
    if (!statusElement) return

    const statusClass = health.metrics.responseTime > 100 ? "warning" : "healthy"
    statusElement.className = `system-status ${statusClass}`
    statusElement.innerHTML = `
      <div class="status-indicator ${statusClass}"></div>
      <div class="status-text">
        <div class="status-label">System ${health.status}</div>
        <div class="status-details">${Math.round(health.metrics.responseTime)}ms response</div>
      </div>
    `
  }

  updateDashboardMetrics() {
    // Update various dashboard metrics
    const submissions = JSON.parse(localStorage.getItem("examSubmissions") || "[]")
    const events = JSON.parse(localStorage.getItem("analytics_events") || "[]")

    // Update submission count
    const submissionCount = document.getElementById("total-submissions-count")
    if (submissionCount) {
      submissionCount.textContent = submissions.length
    }

    // Update security alerts
    const alertCount = document.getElementById("security-alerts-count")
    if (alertCount) {
      alertCount.textContent = events.length
    }

    // Update active exams count
    const activeExams = this.getActiveExams()
    const activeExamCount = document.getElementById("active-exams-count")
    if (activeExamCount) {
      activeExamCount.textContent = activeExams.length
    }
  }

  getActiveExams() {
    // Get exams that have active students
    const activeStreams = JSON.parse(localStorage.getItem("activeStreams") || "[]")
    const activeExamCodes = [...new Set(activeStreams.map((stream) => stream.examCode))]
    return activeExamCodes
  }

  viewStudentFeed(studentId) {
    // Create modal to view student camera feed
    const modal = document.createElement("div")
    modal.className = "modal-overlay"
    modal.innerHTML = `
      <div class="modal-content student-feed-modal">
        <div class="modal-header">
          <h3>Student Camera Feed</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="student-feed-container">
            <div class="feed-placeholder">
              <svg class="feed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              <p>Camera feed for Student ID: ${studentId}</p>
              <p class="feed-note">In a real implementation, this would show the live camera feed</p>
            </div>
          </div>
          <div class="student-feed-controls">
            <button class="btn btn-outline" onclick="window.realTimeMonitor.flagStudent('${studentId}')">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9"></path>
              </svg>
              Flag Student
            </button>
            <button class="btn btn-secondary" onclick="window.realTimeMonitor.sendMessage('${studentId}')">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              Send Message
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)
  }

  flagStudent(studentId) {
    const reason = prompt("Enter reason for flagging this student:")
    if (!reason) return

    // Record the flag
    const flags = JSON.parse(localStorage.getItem("studentFlags") || "[]")
    flags.push({
      studentId,
      reason,
      timestamp: new Date().toISOString(),
      flaggedBy: JSON.parse(localStorage.getItem("instructorSession") || "{}").username,
    })
    localStorage.setItem("studentFlags", JSON.stringify(flags))

    window.notificationManager?.warning("Student Flagged", `Student ${studentId} has been flagged for: ${reason}`)

    // Close modal
    document.querySelector(".modal-overlay")?.remove()
  }

  sendMessage(studentId) {
    const message = prompt("Enter message to send to student:")
    if (!message) return

    // In a real implementation, this would send a message to the student
    window.notificationManager?.info("Message Sent", `Message sent to student ${studentId}`)

    // Close modal
    document.querySelector(".modal-overlay")?.remove()
  }

  setupEventListeners() {
    // Listen for page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Reduce update frequency when tab is not visible
        this.updateFrequency = 30000 // 30 seconds
      } else {
        // Increase frequency when tab is active
        this.updateFrequency = 5000 // 5 seconds
        this.startMonitoring() // Restart with new frequency
      }
    })
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
  }
}

// Global instance
window.realTimeMonitor = new RealTimeMonitor()
