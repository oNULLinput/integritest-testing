class AnalyticsManager {
  constructor() {
    this.charts = new Map()
    this.data = {
      examPerformance: [],
      studentActivity: [],
      securityEvents: [],
      systemMetrics: [],
    }
    this.init()
  }

  init() {
    this.loadAnalyticsData()
    this.setupRealTimeUpdates()
  }

  loadAnalyticsData() {
    // Load exam submissions for performance analytics
    const submissions = JSON.parse(localStorage.getItem("examSubmissions") || "[]")
    this.data.examPerformance = this.processExamPerformance(submissions)

    // Load security events
    const events = JSON.parse(localStorage.getItem("analytics_events") || "[]")
    this.data.securityEvents = this.processSecurityEvents(events)

    // Load system metrics
    this.data.systemMetrics = this.generateSystemMetrics()

    console.log("[v0] Analytics data loaded:", this.data)
  }

  processExamPerformance(submissions) {
    const performance = {}

    submissions.forEach((submission) => {
      const examCode = submission.examCode
      if (!performance[examCode]) {
        performance[examCode] = {
          examTitle: submission.examTitle,
          totalStudents: 0,
          averageScore: 0,
          scores: [],
          completionRate: 0,
          averageTime: 0,
          times: [],
        }
      }

      performance[examCode].totalStudents++
      performance[examCode].scores.push(submission.score || 0)

      if (submission.timeSpent) {
        performance[examCode].times.push(submission.timeSpent / 60) // Convert to minutes
      }
    })

    // Calculate averages
    Object.keys(performance).forEach((examCode) => {
      const exam = performance[examCode]
      exam.averageScore = exam.scores.reduce((a, b) => a + b, 0) / exam.scores.length
      exam.averageTime = exam.times.reduce((a, b) => a + b, 0) / exam.times.length || 0
      exam.completionRate = (exam.totalStudents / exam.totalStudents) * 100 // Simplified
    })

    return Object.values(performance)
  }

  processSecurityEvents(events) {
    const securityData = {
      violationsByType: {},
      violationsByTime: {},
      totalViolations: events.length,
    }

    events.forEach((event) => {
      const type = event.type || "unknown"
      const hour = new Date(event.timestamp).getHours()

      securityData.violationsByType[type] = (securityData.violationsByType[type] || 0) + 1
      securityData.violationsByTime[hour] = (securityData.violationsByTime[hour] || 0) + 1
    })

    return securityData
  }

  generateSystemMetrics() {
    const now = new Date()
    const metrics = {
      uptime: this.calculateUptime(),
      activeUsers: this.getActiveUsers(),
      systemLoad: Math.random() * 100, // Simulated
      memoryUsage: Math.random() * 100, // Simulated
      responseTime: Math.random() * 500 + 100, // Simulated
      timestamp: now.toISOString(),
    }

    return metrics
  }

  calculateUptime() {
    const sessionStart = localStorage.getItem("sessionStartTime")
    if (!sessionStart) {
      localStorage.setItem("sessionStartTime", Date.now().toString())
      return 0
    }

    return Date.now() - Number.parseInt(sessionStart)
  }

  getActiveUsers() {
    const activeStreams = JSON.parse(localStorage.getItem("activeStreams") || "[]")
    return activeStreams.length
  }

  createPerformanceChart(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return

    const chartData = this.data.examPerformance.slice(0, 5) // Top 5 exams

    container.innerHTML = `
      <div class="chart-header">
        <h3>Exam Performance Overview</h3>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color" style="background: var(--chart-1)"></span>
            Average Score
          </span>
          <span class="legend-item">
            <span class="legend-color" style="background: var(--chart-2)"></span>
            Completion Rate
          </span>
        </div>
      </div>
      <div class="chart-content">
        ${chartData
          .map(
            (exam) => `
          <div class="chart-bar-group">
            <div class="chart-bars">
              <div class="chart-bar" style="height: ${exam.averageScore}%; background: var(--chart-1)"></div>
              <div class="chart-bar" style="height: ${exam.completionRate}%; background: var(--chart-2)"></div>
            </div>
            <div class="chart-label">${exam.examTitle.substring(0, 15)}...</div>
            <div class="chart-values">
              <span>Score: ${Math.round(exam.averageScore)}%</span>
              <span>Students: ${exam.totalStudents}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  createSecurityChart(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return

    const securityData = this.data.securityEvents
    const violationTypes = Object.entries(securityData.violationsByType).slice(0, 5)

    container.innerHTML = `
      <div class="chart-header">
        <h3>Security Violations</h3>
        <div class="chart-summary">
          Total: ${securityData.totalViolations} violations
        </div>
      </div>
      <div class="chart-content security-chart">
        ${violationTypes
          .map(
            ([type, count]) => `
          <div class="security-item">
            <div class="security-type">${type.replace("_", " ").toUpperCase()}</div>
            <div class="security-bar">
              <div class="security-fill" style="width: ${(count / securityData.totalViolations) * 100}%"></div>
            </div>
            <div class="security-count">${count}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  createActivityTimeline(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return

    const recentActivity = this.generateRecentActivity()

    container.innerHTML = `
      <div class="timeline-header">
        <h3>Recent Activity Timeline</h3>
        <button class="btn btn-sm btn-outline" onclick="window.analyticsManager.refreshActivity()">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh
        </button>
      </div>
      <div class="timeline-content">
        ${recentActivity
          .map(
            (activity) => `
          <div class="timeline-item ${activity.type}">
            <div class="timeline-marker"></div>
            <div class="timeline-content-item">
              <div class="timeline-title">${activity.title}</div>
              <div class="timeline-description">${activity.description}</div>
              <div class="timeline-time">${activity.time}</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  generateRecentActivity() {
    const activities = []
    const submissions = JSON.parse(localStorage.getItem("examSubmissions") || "[]")
    const events = JSON.parse(localStorage.getItem("analytics_events") || "[]")

    // Add recent submissions
    submissions
      .slice(-5)
      .reverse()
      .forEach((submission) => {
        activities.push({
          type: "submission",
          title: "Exam Submitted",
          description: `${submission.studentName} completed ${submission.examTitle}`,
          time: this.formatTime(new Date(submission.submissionTime)),
        })
      })

    // Add recent security events
    events
      .slice(-3)
      .reverse()
      .forEach((event) => {
        activities.push({
          type: "security",
          title: "Security Alert",
          description: `${event.type} detected for ${event.student?.studentName || "Unknown Student"}`,
          time: this.formatTime(new Date(event.timestamp)),
        })
      })

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10)
  }

  formatTime(date) {
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  setupRealTimeUpdates() {
    setInterval(() => {
      this.loadAnalyticsData()
      this.updateCharts()
    }, 30000) // Update every 30 seconds
  }

  updateCharts() {
    // Update all active charts
    this.charts.forEach((chart, containerId) => {
      switch (chart.type) {
        case "performance":
          this.createPerformanceChart(containerId)
          break
        case "security":
          this.createSecurityChart(containerId)
          break
        case "timeline":
          this.createActivityTimeline(containerId)
          break
      }
    })
  }

  refreshActivity() {
    this.loadAnalyticsData()
    this.createActivityTimeline("activity-timeline")
    window.notificationManager?.success("Activity Refreshed", "Timeline updated with latest data")
  }

  exportAnalytics() {
    const analyticsData = {
      examPerformance: this.data.examPerformance,
      securityEvents: this.data.securityEvents,
      systemMetrics: this.data.systemMetrics,
      exportTime: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics_export_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    window.notificationManager?.success("Export Complete", "Analytics data downloaded successfully")
  }
}

// Global instance
window.analyticsManager = new AnalyticsManager()
