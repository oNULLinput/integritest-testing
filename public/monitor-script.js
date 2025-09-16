let monitoringInterval = null
let activeStreams = []
let violations = []
let examCode = null

document.addEventListener("DOMContentLoaded", () => {
  initializeMonitor()
  startMonitoring()

  // Set up event listeners
  document.getElementById("refresh-btn").onclick = refreshMonitoring
  document.getElementById("clear-violations-btn").onclick = clearViolations
  document.getElementById("back-to-dashboard-btn").onclick = backToDashboard // Added event listener for back to dashboard button
})

function initializeMonitor() {
  // Get exam info from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  examCode = urlParams.get("examId")

  console.log("[v0] Initializing monitor for exam:", examCode)

  // Load exam data from Supabase or localStorage
  loadExamData(examCode)
}

function backToDashboard() {
  console.log("[v0] Navigating back to dashboard")

  // Clean up monitoring interval before leaving
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }

  // Navigate back to dashboard
  window.location.href = "instructor-dashboard.html"
}

async function loadExamData(examCode) {
  try {
    // Try to get exam data from Supabase first
    if (window.supabaseClient) {
      const { data: examData, error } = await window.supabaseClient
        .from("exams")
        .select("*")
        .eq("exam_code", examCode)
        .single()

      if (!error && examData) {
        document.getElementById("exam-title").textContent = examData.title
        document.getElementById("exam-code").textContent = `Code: ${examCode}`
        return
      }
    }

    // Fallback to localStorage
    const examData = JSON.parse(localStorage.getItem(`exam_${examCode}`) || "{}")
    document.getElementById("exam-title").textContent = examData.title || "Unknown Exam"
    document.getElementById("exam-code").textContent = `Code: ${examCode || "----"}`
  } catch (error) {
    console.error("[v0] Error loading exam data:", error)
    document.getElementById("exam-title").textContent = "Error Loading Exam"
    document.getElementById("exam-code").textContent = `Code: ${examCode || "----"}`
  }
}

function startMonitoring() {
  console.log("[v0] Starting real-time monitoring...")
  refreshMonitoring()

  // Refresh every 3 seconds for more responsive monitoring
  monitoringInterval = setInterval(refreshMonitoring, 3000)
}

async function refreshMonitoring() {
  try {
    // Load active student sessions from Supabase
    if (window.supabaseClient && examCode) {
      const { data: sessions, error } = await window.supabaseClient
        .from("student_sessions")
        .select("*")
        .eq("exam_code", examCode)
        .eq("is_active", true)

      if (!error && sessions) {
        activeStreams = sessions.map((session) => ({
          studentId: session.student_number,
          studentName: `${session.surname}, ${session.name}`,
          sessionId: session.id,
          startTime: session.start_time,
          cameraStatus: session.camera_enabled || true,
        }))
      }

      // Load violations for this exam
      const { data: violationsData, error: violationsError } = await window.supabaseClient
        .from("exam_violations")
        .select("*")
        .eq("exam_code", examCode)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!violationsError && violationsData) {
        violations = violationsData.map((v) => ({
          studentId: v.student_number,
          studentName: v.student_name,
          type: v.violation_type,
          timestamp: v.created_at,
          description: v.description,
        }))
      }
    } else {
      // Fallback to localStorage for demo purposes
      activeStreams = JSON.parse(localStorage.getItem("activeStreams") || "[]")
      const allViolations = JSON.parse(localStorage.getItem("analytics_events") || "[]")
        .filter((event) => event.examCode === examCode || event.exam_id === examCode)
        .slice(-50)

      violations = allViolations
    }

    updateStats()
    updateCameraFeeds()
    updateViolationsList()
  } catch (error) {
    console.error("[v0] Error refreshing monitoring data:", error)
  }
}

function updateStats() {
  document.getElementById("active-students").textContent = activeStreams.length
  document.getElementById("total-violations").textContent = violations.length
}

function updateCameraFeeds() {
  const videoGrid = document.getElementById("video-grid")
  const noStudentsDiv = document.getElementById("no-students")

  if (activeStreams.length === 0) {
    videoGrid.style.display = "none"
    noStudentsDiv.style.display = "flex"
    return
  }

  videoGrid.style.display = "grid"
  noStudentsDiv.style.display = "none"

  // Set grid layout based on number of students
  videoGrid.className = `video-grid ${getGridClass(activeStreams.length)}`

  videoGrid.innerHTML = activeStreams
    .map((stream) => {
      const studentViolations = violations.filter(
        (v) => v.studentId === stream.studentId || v.studentName === stream.studentName,
      )

      const hasRecentViolation = studentViolations.some(
        (v) => new Date(v.timestamp) > new Date(Date.now() - 60000), // Last minute
      )

      const violationCount = studentViolations.length

      return `
      <div class="video-feed ${hasRecentViolation ? "violation" : ""}" data-student-id="${stream.studentId}">
        <div class="video-content">
          <div class="camera-placeholder ${stream.cameraStatus ? "camera-on" : "camera-off"}">
            <div class="camera-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="${
                        stream.cameraStatus
                          ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          : "M16 8l2.586-2.586a2 2 0 012.828 2.828L19 10.828V15a2 2 0 01-2 2H5a2 2 0 01-2-2v2a2 2 0 012 2h2l2 2h6z"
                      }"></path>
              </svg>
            </div>
            <div class="camera-status">${stream.cameraStatus ? "Live Camera Feed" : "Camera Disabled"}</div>
          </div>
          ${hasRecentViolation ? '<div class="violation-alert">⚠️ Alert</div>' : ""}
        </div>
        <div class="student-info">
          <div class="student-name">${stream.studentName}</div>
          <div class="student-details">
            <span class="student-id">ID: ${stream.studentId}</span>
            <div class="status-indicator">
              <span class="status-dot ${hasRecentViolation ? "violation" : "normal"}"></span>
              <span class="status-text">${hasRecentViolation ? "Alert" : "Normal"}</span>
              ${violationCount > 0 ? `<span class="violation-count">${violationCount} violations</span>` : ""}
            </div>
          </div>
        </div>
      </div>
    `
    })
    .join("")
}

function getGridClass(count) {
  if (count === 1) return "participants-1"
  if (count === 2) return "participants-2"
  if (count <= 4) return "participants-4"
  if (count <= 6) return "participants-6"
  if (count <= 9) return "participants-9"
  if (count <= 16) return "participants-16"
  return "participants-many"
}

function updateViolationsList() {
  const violationsList = document.getElementById("violations-list")

  if (violations.length === 0) {
    violationsList.innerHTML = `
      <div class="no-violations">
        <div class="no-violations-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <p>No violations detected</p>
        <small>All students are following exam protocols</small>
      </div>
    `
    return
  }

  // Sort violations by timestamp (newest first)
  const sortedViolations = violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20) // Show only last 20 violations

  violationsList.innerHTML = sortedViolations
    .map(
      (violation) => `
    <div class="violation-item ${isRecentViolation(violation.timestamp) ? "recent" : ""}">
      <div class="violation-header">
        <div class="violation-student">
          <strong>${violation.studentName || `Student ${violation.studentId}`}</strong>
          <span class="student-id-small">${violation.studentId}</span>
        </div>
        <div class="violation-time">${formatTime(violation.timestamp)}</div>
      </div>
      <div class="violation-details">
        <span class="violation-type">${formatViolationType(violation.type)}</span>
        ${violation.description ? `<span class="violation-description">${violation.description}</span>` : ""}
      </div>
    </div>
  `,
    )
    .join("")
}

function isRecentViolation(timestamp) {
  return new Date(timestamp) > new Date(Date.now() - 30000) // Last 30 seconds
}

function formatViolationType(type) {
  const types = {
    tab_switch: "Tab/Window Switch",
    dev_tools: "Developer Tools Access",
    suspicious_activity: "Suspicious Activity",
    multiple_people: "Multiple People Detected",
    camera_blocked: "Camera Blocked",
    fullscreen_exit: "Exited Fullscreen",
    copy_paste: "Copy/Paste Attempt",
    right_click: "Right Click Detected",
    keyboard_shortcut: "Suspicious Keyboard Shortcut",
  }

  return types[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    // Less than 1 minute
    return "Just now"
  } else if (diff < 3600000) {
    // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else if (diff < 86400000) {
    // Less than 24 hours
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  } else {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
}

function clearViolations() {
  if (
    confirm(
      "Are you sure you want to clear all violations from the display? This will not delete them from the database.",
    )
  ) {
    // Only clear the display, not the actual database records
    violations = []
    updateViolationsList()
    updateStats()
    console.log("[v0] Violations display cleared")
  }
}

function addTestStudent() {
  const testStudent = {
    studentId: `22-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`,
    studentName: `Test Student ${activeStreams.length + 1}`,
    sessionId: `session_${Date.now()}`,
    startTime: new Date().toISOString(),
    cameraStatus: true,
  }

  activeStreams.push(testStudent)
  localStorage.setItem("activeStreams", JSON.stringify(activeStreams))
  updateCameraFeeds()
  updateStats()
}

function simulateViolation() {
  if (activeStreams.length === 0) {
    alert("No active students to simulate violation for")
    return
  }

  const randomStudent = activeStreams[Math.floor(Math.random() * activeStreams.length)]
  const violationTypes = ["tab_switch", "dev_tools", "suspicious_activity", "fullscreen_exit"]
  const randomType = violationTypes[Math.floor(Math.random() * violationTypes.length)]

  const newViolation = {
    studentId: randomStudent.studentId,
    studentName: randomStudent.studentName,
    type: randomType,
    timestamp: new Date().toISOString(),
    description: `Detected ${formatViolationType(randomType).toLowerCase()}`,
  }

  violations.unshift(newViolation)

  // Store in localStorage for persistence
  const storedViolations = JSON.parse(localStorage.getItem("analytics_events") || "[]")
  storedViolations.push({
    name: "security_violation",
    examCode: examCode,
    ...newViolation,
  })
  localStorage.setItem("analytics_events", JSON.stringify(storedViolations))

  updateViolationsList()
  updateCameraFeeds()
  updateStats()
}

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }
  console.log("[v0] Monitor cleanup completed")
})

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "r":
        e.preventDefault()
        refreshMonitoring()
        break
      case "t":
        e.preventDefault()
        addTestStudent()
        break
      case "v":
        e.preventDefault()
        simulateViolation()
        break
      case "b": // Added shortcut for back to dashboard
        e.preventDefault()
        backToDashboard()
        break
    }
  }
})
