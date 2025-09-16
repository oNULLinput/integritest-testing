class AutoSaveManager {
  constructor() {
    this.saveInterval = null
    this.saveFrequency = 30000 // 30 seconds
    this.lastSaveTime = null
    this.isDirty = false
    this.saveQueue = []
    this.isOnline = navigator.onLine
    this.init()
  }

  init() {
    // Monitor online/offline status
    window.addEventListener("online", () => {
      this.isOnline = true
      this.processSaveQueue()
      window.notificationManager?.success("Connection Restored", "Auto-save resumed")
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
      window.notificationManager?.warning("Connection Lost", "Changes will be saved locally")
    })

    // Save before page unload
    window.addEventListener("beforeunload", (e) => {
      if (this.isDirty) {
        this.saveNow()
        e.preventDefault()
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
      }
    })

    // Start auto-save interval
    this.startAutoSave()
  }

  startAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }

    this.saveInterval = setInterval(() => {
      if (this.isDirty) {
        this.saveNow()
      }
    }, this.saveFrequency)
  }

  markDirty() {
    this.isDirty = true
    this.updateSaveStatus("unsaved")
  }

  async saveNow() {
    if (!this.isDirty) return

    try {
      const saveData = this.collectSaveData()

      if (this.isOnline) {
        await this.saveToServer(saveData)
      } else {
        this.saveToLocal(saveData)
      }

      this.isDirty = false
      this.lastSaveTime = new Date()
      this.updateSaveStatus("saved")

      console.log("[v0] Auto-save completed:", this.lastSaveTime)
    } catch (error) {
      console.error("[v0] Auto-save failed:", error)
      this.updateSaveStatus("error")

      // Queue for retry if online
      if (this.isOnline) {
        window.notificationManager?.error("Save Failed", "Your changes couldn't be saved. Retrying...", {
          duration: 3000,
        })
      }
    }
  }

  collectSaveData() {
    const data = {
      timestamp: new Date().toISOString(),
      type: "auto_save",
    }

    // Collect exam answers if in exam
    if (window.answers && window.currentQuestionIndex !== undefined) {
      data.examData = {
        answers: window.answers,
        currentQuestion: window.currentQuestionIndex,
        timeRemaining: window.timeRemaining,
        violations: window.violations || [],
      }
    }

    // Collect form data if in forms
    const forms = document.querySelectorAll("form[data-auto-save]")
    forms.forEach((form, index) => {
      const formData = new FormData(form)
      data[`form_${index}`] = Object.fromEntries(formData.entries())
    })

    // Collect any other saveable data
    const saveableElements = document.querySelectorAll("[data-auto-save]")
    saveableElements.forEach((element) => {
      const key = element.dataset.autoSave || element.id || `element_${Date.now()}`

      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        data[key] = element.value
      } else if (element.tagName === "SELECT") {
        data[key] = element.selectedOptions[0]?.value
      } else {
        data[key] = element.textContent || element.innerHTML
      }
    })

    return data
  }

  async saveToServer(data) {
    // In a real implementation, this would save to your backend
    // For now, we'll simulate with localStorage and add to queue
    this.saveToLocal(data)

    // Simulate server save
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          // 90% success rate
          resolve(data)
        } else {
          reject(new Error("Server save failed"))
        }
      }, 100)
    })
  }

  saveToLocal(data) {
    try {
      const key = `autosave_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(data))

      // Keep only last 10 auto-saves
      const autoSaveKeys = Object.keys(localStorage)
        .filter((key) => key.startsWith("autosave_"))
        .sort()

      if (autoSaveKeys.length > 10) {
        autoSaveKeys.slice(0, -10).forEach((key) => {
          localStorage.removeItem(key)
        })
      }
    } catch (error) {
      console.error("[v0] Local save failed:", error)
      throw error
    }
  }

  processSaveQueue() {
    if (this.saveQueue.length === 0) return

    const queue = [...this.saveQueue]
    this.saveQueue = []

    queue.forEach(async (data) => {
      try {
        await this.saveToServer(data)
      } catch (error) {
        console.error("[v0] Queued save failed:", error)
        this.saveQueue.push(data) // Re-queue on failure
      }
    })
  }

  updateSaveStatus(status) {
    const statusElement = document.getElementById("save-status")
    if (!statusElement) return

    const statusConfig = {
      unsaved: {
        text: "Unsaved changes",
        class: "status-warning",
        icon: "●",
      },
      saving: {
        text: "Saving...",
        class: "status-info",
        icon: "↻",
      },
      saved: {
        text: `Saved ${this.formatTime(this.lastSaveTime)}`,
        class: "status-success",
        icon: "✓",
      },
      error: {
        text: "Save failed",
        class: "status-error",
        icon: "✕",
      },
    }

    const config = statusConfig[status] || statusConfig.unsaved
    statusElement.className = `save-status ${config.class}`
    statusElement.innerHTML = `<span class="save-icon">${config.icon}</span> ${config.text}`
  }

  formatTime(date) {
    if (!date) return ""

    const now = new Date()
    const diff = now - date

    if (diff < 60000) return "just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Recovery methods
  getAutoSaveHistory() {
    const autoSaveKeys = Object.keys(localStorage)
      .filter((key) => key.startsWith("autosave_"))
      .sort()
      .reverse()

    return autoSaveKeys
      .map((key) => {
        try {
          return JSON.parse(localStorage.getItem(key))
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }

  restoreFromAutoSave(timestamp) {
    const history = this.getAutoSaveHistory()
    const saveData = history.find((data) => data.timestamp === timestamp)

    if (saveData) {
      this.restoreData(saveData)
      window.notificationManager?.success("Data Restored", "Your previous session has been restored")
    }
  }

  restoreData(data) {
    // Restore exam data
    if (data.examData) {
      window.answers = data.examData.answers
      window.currentQuestionIndex = data.examData.currentQuestion
      window.timeRemaining = data.examData.timeRemaining
      window.violations = data.examData.violations
    }

    // Restore form data
    Object.keys(data).forEach((key) => {
      if (key.startsWith("form_")) {
        const formIndex = Number.parseInt(key.split("_")[1])
        const form = document.querySelectorAll("form[data-auto-save]")[formIndex]
        if (form) {
          Object.entries(data[key]).forEach(([name, value]) => {
            const input = form.querySelector(`[name="${name}"]`)
            if (input) input.value = value
          })
        }
      } else if (key !== "timestamp" && key !== "type" && key !== "examData") {
        const element = document.getElementById(key) || document.querySelector(`[data-auto-save="${key}"]`)
        if (element) {
          if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.value = data[key]
          } else {
            element.textContent = data[key]
          }
        }
      }
    })
  }

  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }
  }
}

// Global instance
window.autoSaveManager = new AutoSaveManager()
