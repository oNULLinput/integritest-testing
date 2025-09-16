class StatusManager {
  constructor() {
    this.statuses = new Map()
    this.indicators = new Map()
    this.init()
  }

  init() {
    this.createStatusBar()
    this.startSystemMonitoring()
  }

  createStatusBar() {
    // Check if status bar already exists
    if (document.getElementById("system-status-bar")) return

    const statusBar = document.createElement("div")
    statusBar.id = "system-status-bar"
    statusBar.className = "system-status-bar"
    statusBar.innerHTML = `
      <div class="status-item" id="connection-status">
        <span class="status-indicator"></span>
        <span class="status-text">Checking connection...</span>
      </div>
      <div class="status-item" id="save-status">
        <span class="status-indicator"></span>
        <span class="status-text">Ready</span>
      </div>
      <div class="status-item" id="camera-status" style="display: none;">
        <span class="status-indicator"></span>
        <span class="status-text">Camera off</span>
      </div>
      <div class="status-item" id="exam-status" style="display: none;">
        <span class="status-indicator"></span>
        <span class="status-text">Not in exam</span>
      </div>
    `

    // Add styles
    this.addStatusBarStyles()

    // Insert at top of body
    document.body.insertBefore(statusBar, document.body.firstChild)

    // Initialize status indicators
    this.updateConnectionStatus()
    this.updateSaveStatus("ready")
  }

  addStatusBarStyles() {
    const style = document.createElement("style")
    style.textContent = `
      .system-status-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--card);
        border-bottom: 1px solid var(--border);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 24px;
        font-size: 12px;
        z-index: 999;
        backdrop-filter: blur(8px);
        background: rgba(var(--card), 0.95);
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-foreground);
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted);
        transition: all 200ms ease;
      }

      .status-indicator.online {
        background: var(--chart-5);
        box-shadow: 0 0 4px var(--chart-5);
      }

      .status-indicator.offline {
        background: var(--destructive);
        box-shadow: 0 0 4px var(--destructive);
      }

      .status-indicator.warning {
        background: var(--secondary);
        box-shadow: 0 0 4px var(--secondary);
      }

      .status-indicator.active {
        background: var(--primary);
        box-shadow: 0 0 4px var(--primary);
      }

      .status-indicator.pulse {
        animation: statusPulse 2s infinite;
      }

      @keyframes statusPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .status-text {
        font-weight: 500;
      }

      /* Adjust body padding to account for status bar */
      body {
        padding-top: 40px;
      }

      @media (max-width: 640px) {
        .system-status-bar {
          padding: 6px 12px;
          gap: 16px;
          font-size: 11px;
        }
        
        body {
          padding-top: 36px;
        }
      }
    `
    document.head.appendChild(style)
  }

  startSystemMonitoring() {
    // Monitor connection status
    window.addEventListener("online", () => this.updateConnectionStatus())
    window.addEventListener("offline", () => this.updateConnectionStatus())

    // Monitor page visibility
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateConnectionStatus()
      }
    })

    // Periodic system checks
    setInterval(() => {
      this.performSystemCheck()
    }, 30000) // Every 30 seconds
  }

  updateConnectionStatus() {
    const indicator = document.querySelector("#connection-status .status-indicator")
    const text = document.querySelector("#connection-status .status-text")

    if (!indicator || !text) return

    if (navigator.onLine) {
      indicator.className = "status-indicator online"
      text.textContent = "Connected"
      this.setStatus("connection", "online")
    } else {
      indicator.className = "status-indicator offline"
      text.textContent = "Offline"
      this.setStatus("connection", "offline")
    }
  }

  updateSaveStatus(status, message = "") {
    const indicator = document.querySelector("#save-status .status-indicator")
    const text = document.querySelector("#save-status .status-text")

    if (!indicator || !text) return

    const statusConfig = {
      ready: { class: "online", text: "Ready" },
      saving: { class: "active pulse", text: "Saving..." },
      saved: { class: "online", text: message || "Saved" },
      error: { class: "offline", text: "Save failed" },
      unsaved: { class: "warning", text: "Unsaved changes" },
    }

    const config = statusConfig[status] || statusConfig.ready
    indicator.className = `status-indicator ${config.class}`
    text.textContent = config.text

    this.setStatus("save", status)
  }

  updateCameraStatus(status, message = "") {
    const statusItem = document.getElementById("camera-status")
    const indicator = statusItem?.querySelector(".status-indicator")
    const text = statusItem?.querySelector(".status-text")

    if (!statusItem || !indicator || !text) return

    statusItem.style.display = "flex"

    const statusConfig = {
      off: { class: "offline", text: "Camera off" },
      starting: { class: "warning pulse", text: "Starting camera..." },
      active: { class: "online", text: "Camera active" },
      error: { class: "offline", text: "Camera error" },
    }

    const config = statusConfig[status] || statusConfig.off
    indicator.className = `status-indicator ${config.class}`
    text.textContent = message || config.text

    this.setStatus("camera", status)
  }

  updateExamStatus(status, message = "") {
    const statusItem = document.getElementById("exam-status")
    const indicator = statusItem?.querySelector(".status-indicator")
    const text = statusItem?.querySelector(".status-text")

    if (!statusItem || !indicator || !text) return

    if (status === "none") {
      statusItem.style.display = "none"
      return
    }

    statusItem.style.display = "flex"

    const statusConfig = {
      loading: { class: "warning pulse", text: "Loading exam..." },
      active: { class: "online", text: "Exam in progress" },
      paused: { class: "warning", text: "Exam paused" },
      submitted: { class: "active", text: "Exam submitted" },
      error: { class: "offline", text: "Exam error" },
    }

    const config = statusConfig[status] || statusConfig.loading
    indicator.className = `status-indicator ${config.class}`
    text.textContent = message || config.text

    this.setStatus("exam", status)
  }

  setStatus(key, status, data = {}) {
    this.statuses.set(key, {
      status,
      timestamp: new Date(),
      ...data,
    })
  }

  getStatus(key) {
    return this.statuses.get(key)
  }

  getAllStatuses() {
    return Object.fromEntries(this.statuses)
  }

  performSystemCheck() {
    // Check connection
    this.updateConnectionStatus()

    // Check if exam is active
    if (window.examData && window.timeRemaining > 0) {
      this.updateExamStatus("active", `${Math.floor(window.timeRemaining / 60)}m remaining`)
    }

    // Check camera status
    if (window.cameraStream && window.monitoringActive) {
      this.updateCameraStatus("active")
    }

    // Check for errors
    const errorStats = window.errorHandler?.getErrorStats()
    if (errorStats && errorStats.recent > 0) {
      window.notificationManager?.warning("System Issues Detected", `${errorStats.recent} errors in the last hour`, {
        duration: 3000,
      })
    }
  }

  showSystemInfo() {
    const statuses = this.getAllStatuses()
    const info = {
      connection: navigator.onLine ? "Online" : "Offline",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      statuses,
    }

    console.log("[v0] System Info:", info)
    return info
  }

  // Integration with other managers
  integrateWithAutoSave() {
    if (window.autoSaveManager) {
      const originalUpdateStatus = window.autoSaveManager.updateSaveStatus
      window.autoSaveManager.updateSaveStatus = (status) => {
        originalUpdateStatus.call(window.autoSaveManager, status)
        this.updateSaveStatus(status)
      }
    }
  }

  integrateWithExam() {
    // Monitor exam events
    document.addEventListener("examStarted", () => {
      this.updateExamStatus("active")
    })

    document.addEventListener("examSubmitted", () => {
      this.updateExamStatus("submitted")
    })

    document.addEventListener("cameraStarted", () => {
      this.updateCameraStatus("active")
    })

    document.addEventListener("cameraError", (e) => {
      this.updateCameraStatus("error", e.detail?.message)
    })
  }
}

// Global instance
window.statusManager = new StatusManager()

// Initialize integrations when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.statusManager.integrateWithAutoSave()
  window.statusManager.integrateWithExam()
})
