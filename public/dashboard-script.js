// Dashboard state management
let instructorSession = null
const dashboardData = {
  activeExams: 0,
  studentsOnline: 0,
  totalSubmissions: 0,
  securityAlerts: 0,
  recentActivity: [],
}

// DOM elements
const instructorNameEl = document.getElementById("instructor-name")
const logoutBtn = document.getElementById("logout-btn")
const activeExamsCount = document.getElementById("active-exams-count")
const studentsOnlineCount = document.getElementById("students-online-count")
const totalSubmissionsCount = document.getElementById("total-submissions-count")
const securityAlertsCount = document.getElementById("security-alerts-count")
const activityFeed = document.getElementById("activity-feed")
const systemInitTime = document.getElementById("system-init-time")

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Dashboard initializing...")

  if (!checkInstructorAuth()) {
    return
  }

  initializeSupabase()
  checkForNewExam() // Check for newly created exam
  await loadExams()
  loadDashboardStats()

  console.log("[v0] Dashboard initialization complete")
})

function initializeDashboard() {
  // Check instructor authentication
  const storedSession = localStorage.getItem("instructorSession")

  if (!storedSession) {
    console.log("[v0] No instructor session found, redirecting to login")
    window.location.href = "index.html"
    return
  }

  try {
    instructorSession = JSON.parse(storedSession)
  } catch (error) {
    console.error("[v0] Error parsing instructor session:", error)
    window.location.href = "index.html"
    return
  }

  // Update UI with instructor info
  updateInstructorInfo()

  // Load dashboard data
  loadDashboardData()
  loadExams()

  // Setup event listeners
  setupEventListeners()

  // Start real-time updates
  startRealTimeUpdates()

  console.log("[v0] Dashboard initialized successfully")
  console.log("[v0] Instructor:", instructorSession.username)

  // Add system initialization activity
  addActivity("system", "Dashboard initialized successfully", "just now")
}

function updateInstructorInfo() {
  if (instructorNameEl && instructorSession) {
    instructorNameEl.textContent = instructorSession.fullName || instructorSession.username
  }
}

async function loadDashboardData() {
  // Update statistics
  const submissions = getStoredSubmissions()
  if (submissions.length !== dashboardData.totalSubmissions) {
    const newSubmissions = submissions.length - dashboardData.totalSubmissions
    dashboardData.totalSubmissions = submissions.length
    if (totalSubmissionsCount) {
      totalSubmissionsCount.textContent = dashboardData.totalSubmissions
    }

    if (newSubmissions > 0) {
      addActivity("exam", `${newSubmissions} new exam submission(s) received`, "just now")
    }
  }

  // Update system init time
  if (systemInitTime && instructorSession) {
    const loginTime = new Date(instructorSession.loginTime)
    const timeAgo = getTimeAgo(loginTime)
    systemInitTime.textContent = timeAgo
  }
}

function getStoredSubmissions() {
  const submissions = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("examResult_")) {
      submissions.push(key)
    }
  }
  return submissions
}

async function loadExams() {
  console.log("[v0] Loading exams from Supabase...")

  const examsList = document.getElementById("exams-list")
  if (!examsList) {
    console.log("[v0] examsList element not found!")
    return
  }

  examsList.innerHTML = `
    <div class="loading-message">
      <div class="loading-spinner"></div>
      <p>Loading your exams...</p>
    </div>
  `

  try {
    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available")
      examsList.innerHTML = `
        <div class="no-exams-message">
          <div class="no-exams-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3>Connection Error</h3>
          <p>Unable to connect to database. Please refresh the page.</p>
        </div>
      `
      return
    }

    console.log(
      "[v0] Loading exams for instructor:",
      instructorSession.username,
      "ID:",
      instructorSession.id,
      "Type:",
      typeof instructorSession.id,
    )

    const instructorId = Number.parseInt(instructorSession.id)
    console.log("[v0] Using instructor ID for query:", instructorId)

    const { data: exams, error } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("is_active", true)
      .eq("instructor_id", instructorId) // Use parsed integer ID for strict data isolation
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading exams:", error)
      examsList.innerHTML = `
        <div class="no-exams-message">
          <div class="no-exams-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3>Error Loading Exams</h3>
          <p>Database error: ${error.message}</p>
          <button onclick="loadExams()" class="btn-primary">Try Again</button>
        </div>
      `
      return
    }

    console.log("[v0] Active exams found for instructor ID", instructorId, ":", exams?.length || 0)
    console.log("[v0] Exam data:", exams)

    if (!exams || exams.length === 0) {
      examsList.innerHTML = `
        <div class="no-exams-message">
          <div class="no-exams-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3>No Active Exams</h3>
          <p>No active exams found for your account. Create and activate an exam to see it here.</p>
          <button onclick="window.location.href='create-exam.html'" class="btn-primary">Create Your First Exam</button>
        </div>
      `
      return
    }

    const examTiles = await Promise.all(
      exams.map(async (exam) => {
        const examStats = await getExamStatistics(exam.exam_code)

        return `
      <div class="exam-card" data-exam-code="${exam.exam_code}">
        <div class="exam-header">
          <div class="exam-info">
            <h3 class="exam-title font-heading">${exam.title}</h3>
            <div class="exam-meta">
              <span class="exam-code">Code: ${exam.exam_code}</span>
              <span class="exam-duration">Duration: ${exam.duration} minutes</span>
            </div>
          </div>
          <div class="exam-status active">
            <span class="status-dot"></span>
            Active
          </div>
        </div>
        
        <!-- Replaced icons with text labels for cleaner, more readable stats -->
        <div class="exam-stats-grid">
          <div class="stat-card questions">
            <div class="stat-content">
              <div class="stat-number">${exam.questions ? exam.questions.length : 0}</div>
              <div class="stat-label">Questions</div>
            </div>
          </div>
          
          <div class="stat-card online">
            <div class="stat-content">
              <div class="stat-number">${examStats.studentsOnline}</div>
              <div class="stat-label">Students Online</div>
            </div>
          </div>
          
          <div class="stat-card submissions">
            <div class="stat-content">
              <div class="stat-number">${examStats.totalSubmissions}</div>
              <div class="stat-label">Submissions</div>
            </div>
          </div>
          
          <div class="stat-card violations">
            <div class="stat-content">
              <div class="stat-number">${examStats.violationsDetected}</div>
              <div class="stat-label">Violations</div>
            </div>
          </div>
        </div>

        <div class="exam-actions">
          <button class="btn btn-primary btn-sm" onclick="monitorExam('${exam.exam_code}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v3M4 7h16"></path>
            </svg>
            Monitor
          </button>
          <button class="btn btn-secondary btn-sm" onclick="downloadResults('${exam.exam_code}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            View Results
          </button>
          <button class="btn btn-edit btn-sm" onclick="editExam('${exam.exam_code}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit
          </button>
          <button class="btn btn-delete btn-sm" onclick="deleteExam('${exam.exam_code}', '${exam.title}')">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>
      `
      }),
    )

    examsList.innerHTML = examTiles.join("")

    dashboardData.activeExams = exams.length
    if (activeExamsCount) activeExamsCount.textContent = dashboardData.activeExams
  } catch (error) {
    console.error("[v0] Error loading exams:", error)
    examsList.innerHTML = `
      <div class="no-exams-message">
        <div class="no-exams-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h3>Error Loading Exams</h3>
        <p>Unable to load exam data. Please refresh the page.</p>
      </div>
    `
  }
}

async function getExamStatistics(examCode) {
  try {
    // Get exam submissions for this exam
    const { data: submissions, error: submissionsError } = await window.supabaseClient
      .from("exam_submissions")
      .select("*")
      .eq("exam_code", examCode)

    if (submissionsError) {
      console.error("[v0] Error fetching submissions:", submissionsError)
    }

    // Get student sessions for this exam (students currently online)
    const { data: sessions, error: sessionsError } = await window.supabaseClient
      .from("student_sessions")
      .select("*")
      .eq("exam_code", examCode)
      .eq("is_active", true)

    if (sessionsError) {
      console.error("[v0] Error fetching sessions:", sessionsError)
    }

    // Get violations for this exam
    const { data: violations, error: violationsError } = await window.supabaseClient
      .from("exam_violations")
      .select("*")
      .eq("exam_code", examCode)

    if (violationsError) {
      console.error("[v0] Error fetching violations:", violationsError)
    }

    return {
      studentsOnline: sessions?.length || 0,
      totalSubmissions: submissions?.length || 0,
      violationsDetected: violations?.length || 0,
    }
  } catch (error) {
    console.error("[v0] Error getting exam statistics:", error)
    return {
      studentsOnline: 0,
      totalSubmissions: 0,
      violationsDetected: 0,
    }
  }
}

function setupEventListeners() {
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }
}

function startRealTimeUpdates() {
  // Simulate real-time updates every 30 seconds
  setInterval(() => {
    updateDashboardStats()
    updateActivityTimes()
  }, 30000)

  console.log("[v0] Real-time updates started")
}

function updateDashboardStats() {
  // Simulate checking for new data
  const submissions = getStoredSubmissions()
  if (submissions.length !== dashboardData.totalSubmissions) {
    const newSubmissions = submissions.length - dashboardData.totalSubmissions
    dashboardData.totalSubmissions = submissions.length
    if (totalSubmissionsCount) {
      totalSubmissionsCount.textContent = dashboardData.totalSubmissions
    }

    if (newSubmissions > 0) {
      addActivity("exam", `${newSubmissions} new exam submission(s) received`, "just now")
    }
  }
}

function updateActivityTimes() {
  const timeElements = document.querySelectorAll(".activity-time")
  timeElements.forEach((element) => {
    if (element.dataset.timestamp) {
      const timestamp = new Date(element.dataset.timestamp)
      element.textContent = getTimeAgo(timestamp)
    }
  })
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("instructorSession")
    console.log("[v0] Instructor logged out")
    window.location.href = "index.html"
  }
}

function logout() {
  handleLogout()
}

function monitorExam(examCode) {
  console.log("[v0] Opening monitor for exam:", examCode)

  // Store the exam code in sessionStorage so monitor page can access it
  sessionStorage.setItem("monitorExamCode", examCode)

  // Navigate to monitor page in same tab for better preview compatibility
  window.location.href = `monitor.html?examId=${examCode}`

  // Add activity log entry
  addActivity("exam", `Started monitoring exam "${examCode}"`, "just now")
}

async function downloadResults(examCode) {
  console.log("[v0] Downloading results for exam:", examCode)

  try {
    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available")
      alert("Database connection error. Please try again.")
      return
    }

    // Get exam data from Supabase
    const { data: examData, error: examError } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("exam_code", examCode)
      .single()

    if (examError || !examData) {
      console.error("[v0] Error fetching exam data:", examError)
      alert("Failed to fetch exam data. Please try again.")
      return
    }

    // Get exam sessions for this exam
    const sessions = JSON.parse(localStorage.getItem("examSessions") || "[]")
    const examSessions = sessions.filter((s) => s.exam_id === examCode || s.examCode === examCode)

    // Get student violations
    const violations = JSON.parse(localStorage.getItem("analytics_events") || "[]")
    const examViolations = violations.filter((v) => v.examCode === examCode || v.exam_id === examCode)

    if (examSessions.length === 0) {
      alert("No submissions found for this exam.")
      return
    }

    // Load SheetJS library for Excel generation
    if (!window.XLSX) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
      document.head.appendChild(script)

      await new Promise((resolve) => {
        script.onload = resolve
      })
    }

    // Prepare Excel data
    const excelData = examSessions.map((session, index) => {
      // Get violations for this student
      const studentViolations = examViolations.filter(
        (v) => v.student?.studentNumber === session.student_number || v.studentNumber === session.student_number,
      )

      const violationSummary =
        studentViolations.length > 0
          ? studentViolations
              .map((v) => `${v.type || "Unknown"} (${new Date(v.timestamp).toLocaleTimeString()})`)
              .join("; ")
          : "None"

      return {
        Surname: session.surname || session.student_name?.split(" ")[0] || "Unknown",
        Name: session.name || session.student_name?.split(" ")[1] || "Unknown",
        "Middle Initial": session.middleInitial || session.student_name?.split(" ")[2]?.charAt(0) || "",
        "Student ID": session.student_number || `22-${String(index + 1).padStart(5, "0")}`,
        Score: session.score || "Not Graded",
        "Total Questions": examData.questions?.length || 0,
        Percentage: session.score ? `${Math.round((session.score / (examData.questions?.length || 1)) * 100)}%` : "N/A",
        "Start Time": session.start_time ? new Date(session.start_time).toLocaleString() : "Unknown",
        "End Time": session.end_time ? new Date(session.end_time).toLocaleString() : "In Progress",
        "Duration (minutes)":
          session.start_time && session.end_time
            ? Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)
            : "N/A",
        Status: session.status || "Completed",
        Violations: violationSummary,
        "Violation Count": studentViolations.length,
      }
    })

    // Create workbook and worksheet
    const wb = window.XLSX.utils.book_new()
    const ws = window.XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Surname
      { wch: 15 }, // Name
      { wch: 8 }, // Middle Initial
      { wch: 12 }, // Student ID
      { wch: 8 }, // Score
      { wch: 12 }, // Total Questions
      { wch: 10 }, // Percentage
      { wch: 18 }, // Start Time
      { wch: 18 }, // End Time
      { wch: 12 }, // Duration
      { wch: 12 }, // Status
      { wch: 40 }, // Violations
      { wch: 12 }, // Violation Count
    ]
    ws["!cols"] = colWidths

    // Add worksheet to workbook
    window.XLSX.utils.book_append_sheet(wb, ws, "Exam Results")

    // Generate and download Excel file
    const fileName = `${examData.title.replace(/[^a-zA-Z0-9]/g, "_")}_Results_${examCode}.xlsx`
    window.XLSX.writeFile(wb, fileName)

    console.log("[v0] Excel results downloaded successfully")
    addActivity("exam", `Results exported for exam "${examData.title}"`, "just now")
  } catch (error) {
    console.error("[v0] Error downloading results:", error)
    alert("An error occurred while generating the Excel file. Please try again.")
  }
}

function checkForSecurityAlerts() {
  // Only check for violations when called explicitly (e.g., from exam monitoring)
  const violations = getStoredViolations()
  const currentAlerts = violations.length

  if (currentAlerts > dashboardData.securityAlerts) {
    const newAlerts = currentAlerts - dashboardData.securityAlerts
    dashboardData.securityAlerts = currentAlerts
    if (securityAlertsCount) {
      securityAlertsCount.textContent = dashboardData.securityAlerts
    }

    if (newAlerts > 0) {
      addActivity("alert", `${newAlerts} new security violation(s) detected`, "just now")
    }
  }
}

function reportSecurityViolation(violationType, studentInfo) {
  dashboardData.securityAlerts++
  if (securityAlertsCount) {
    securityAlertsCount.textContent = dashboardData.securityAlerts
  }

  // Store the violation
  const violations = getStoredViolations()
  violations.push({
    name: "security_violation",
    type: violationType,
    student: studentInfo,
    timestamp: new Date().toISOString(),
  })

  try {
    localStorage.setItem("analytics_events", JSON.stringify(violations))
  } catch (error) {
    console.error("[v0] Error storing violation:", error)
  }

  addActivity("alert", `Security violation detected: ${violationType}`, "just now")
}

function getStoredViolations() {
  const violations = []
  try {
    const analytics = JSON.parse(localStorage.getItem("analytics_events") || "[]")
    violations.push(...analytics.filter((event) => event.name === "security_violation"))
  } catch (error) {
    console.error("[v0] Error reading violations:", error)
  }
  return violations
}

function addActivity(type, message, time) {
  if (!activityFeed) return

  const activityItem = document.createElement("div")
  activityItem.className = "activity-item"
  activityItem.innerHTML = `
    <div class="activity-icon ${type}">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${getActivityIcon(type)}
      </svg>
    </div>
    <div class="activity-content">
      <div class="activity-message">${message}</div>
      <div class="activity-time" data-timestamp="${new Date().toISOString()}">${time}</div>
    </div>
  `

  // Insert at the beginning
  activityFeed.insertBefore(activityItem, activityFeed.firstChild)

  // Limit to 10 activities
  const activities = activityFeed.querySelectorAll(".activity-item")
  if (activities.length > 10) {
    activities[activities.length - 1].remove()
  }
}

function getActivityIcon(type) {
  switch (type) {
    case "system":
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
    case "exam":
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>'
    case "alert":
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>'
    default:
      return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
  }
}

function getTimeAgo(date) {
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
}

async function deleteExam(examCode, examTitle) {
  if (!confirm(`Are you sure you want to delete the exam "${examTitle}"? This action cannot be undone.`)) {
    return
  }

  console.log("[v0] Deleting exam:", examCode)

  try {
    if (!window.supabaseClient) {
      console.error("[v0] Supabase client not available")
      alert("Database connection error. Please try again.")
      return
    }

    const instructorId = Number.parseInt(instructorSession.id)

    const { error } = await window.supabaseClient
      .from("exams")
      .delete()
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorId) // Use parsed integer ID for strict data isolation

    if (error) {
      console.error("[v0] Error deleting exam:", error)
      alert("Failed to delete exam. Please try again.")
      return
    }

    // Remove from local storage if exists
    localStorage.removeItem(`exam_${examCode}`)

    console.log("[v0] Exam deleted successfully")
    addActivity("exam", `Exam "${examTitle}" was deleted`, "just now")

    // Reload exams list
    await loadExams()

    alert("Exam deleted successfully!")
  } catch (error) {
    console.error("[v0] Error deleting exam:", error)
    alert("An error occurred while deleting the exam. Please try again.")
  }
}

function editExam(examCode) {
  console.log("[v0] Opening edit interface for exam:", examCode)
  showEditInterfaceFunc(examCode)
}

async function showEditInterfaceFunc(examCode) {
  console.log("[v0] Loading exam data for editing:", examCode)

  try {
    const instructorId = Number.parseInt(instructorSession.id)

    // Fetch exam data from Supabase
    const { data: examData, error } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorId) // Use parsed integer ID for strict data isolation
      .single()

    if (error || !examData) {
      console.error("[v0] Error fetching exam data:", error)
      alert("Failed to load exam data. Please try again.")
      return
    }

    // Hide the main dashboard content
    const mainContent = document.querySelector(".dashboard-content")
    if (mainContent) {
      mainContent.style.display = "none"
    }

    // Create edit interface container
    const editContainer = document.createElement("div")
    editContainer.id = "edit-container"
    editContainer.innerHTML = `
      <div class="edit-interface">
        <div class="edit-header">
          <div class="edit-title">
            <h2>Edit Exam - ${examData.title}</h2>
          </div>
          <div class="edit-controls">
            <button class="btn btn-secondary" onclick="exitEditFunc()">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        <div class="edit-content">
          <div class="edit-form-container">
            <form id="edit-exam-form" class="edit-form" onsubmit="handleEditFormSubmitFunc(event, '${examCode}')">
              <div class="form-section">
                <h3>Exam Details</h3>
                <div class="form-group">
                  <label for="edit-exam-title">Exam Title</label>
                  <input type="text" id="edit-exam-title" name="title" value="${examData.title}" required>
                </div>
                <div class="form-group">
                  <label for="edit-exam-duration">Duration (minutes)</label>
                  <input type="number" id="edit-exam-duration" name="duration" value="${examData.duration}" min="1" required>
                </div>
                <div class="form-group">
                  <h4>Exam Settings</h4>
                  <div class="settings-checkboxes">
                    <label class="checkbox-label">
                      <input type="checkbox" id="edit-show-timer" name="showTimer" ${examData.show_timer ? "checked" : ""}>
                      <span class="checkmark"></span>
                      Show timer to students
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" id="edit-auto-submit" name="autoSubmit" ${examData.auto_submit ? "checked" : ""}>
                      <span class="checkmark"></span>
                      Auto-submit when time expires
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" id="edit-shuffle-questions" name="shuffleQuestions" ${examData.shuffle_questions ? "checked" : ""}>
                      <span class="checkmark"></span>
                      Shuffle questions for each student
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="questions-header">
                  <h3>Questions</h3>
                  <button type="button" class="btn btn-primary btn-sm" onclick="addQuestionFunc()">
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Question
                  </button>
                </div>
                <div id="edit-questions-container" class="questions-container">
                  <!-- Questions will be loaded here -->
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="exitEditFunc()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `

    // Add edit styles
    const editStyles = document.createElement("style")
    editStyles.textContent = `
      #edit-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: #f8fafc;
        z-index: 1000;
        overflow: hidden;
      }

      .edit-interface {
        height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .edit-header {
        background: white;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .edit-title h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
      }

      .edit-content {
        flex: 1;
        overflow: auto;
        padding: 2rem;
      }

      .edit-form-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .edit-form {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .form-section {
        margin-bottom: 2rem;
      }

      .form-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      }

      .questions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
      }

      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
      }

      .form-group input:focus,
      .form-group textarea:focus,
      .form-group select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
        border-color: #d1d5db;
      }

      .btn-secondary:hover {
        background: #e5e7eb;
      }

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }

      .btn-icon {
        width: 1rem;
        height: 1rem;
      }

      .question-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }

      .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .question-number {
        font-weight: 600;
        color: #1f2937;
      }

      .question-types {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .question-type-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .question-type-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .options-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .option-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .option-letter {
        width: 2rem;
        height: 2rem;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        color: #374151;
      }

      .option-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
      }

      .correct-radio {
        margin-left: 0.5rem;
      }
      
      .settings-checkboxes {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #374151;
      }

      .checkbox-label input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      .checkmark {
        width: 1rem;
        height: 1rem;
      }
    `

    document.head.appendChild(editStyles)
    document.body.appendChild(editContainer)

    initializeEditFormFunc(examData)
  } catch (error) {
    console.error("[v0] Error loading exam for editing:", error)
    alert("Failed to load exam data. Please try again.")
  }
}

function initializeEditFormFunc(examData) {
  console.log("[v0] Initializing edit form with exam data:", examData)

  const questionsContainer = document.getElementById("edit-questions-container")
  if (!questionsContainer) return

  // Clear existing questions
  questionsContainer.innerHTML = ""

  // Load existing questions
  if (examData.questions && examData.questions.length > 0) {
    examData.questions.forEach((questionData, index) => {
      addQuestionToFormFunc(questionData, index + 1)
    })
  } else {
    questionsContainer.innerHTML = `
      <div class="no-questions-message">
        <p>No questions found. Click "Add Question" to start adding questions.</p>
      </div>
    `
  }

  console.log("[v0] Edit form initialized with", examData.questions?.length || 0, "questions")
}

function addQuestionToFormFunc(question, index) {
  const questionsContainer = document.getElementById("edit-questions-container")
  if (!questionsContainer) return

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionIndex = index

  let questionTypeHtml = ""
  let optionsHtml = ""

  // Determine question type and create appropriate inputs
  if (
    question.options &&
    question.options.length === 2 &&
    question.options.includes("True") &&
    question.options.includes("False")
  ) {
    questionTypeHtml = `
      <div class="question-type-selector">
        <label for="question-type-${index}">Type:</label>
        <select id="question-type-${index}" class="question-type-select" onchange="changeQuestionTypeFunc(${index}, this.value)">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="identification">Identification</option>
          <option value="fill-blanks">Fill in Blanks</option>
          <option value="true-false" selected>True or False</option>
          <option value="essay">Essay</option>
        </select>
      </div>`

    optionsHtml = `
      <div class="true-false-options">
        <label class="radio-option">
          <input type="radio" name="correct-answer-${index}" value="True" ${question.correct_answer === "True" ? "checked" : ""}>
          <span>True</span>
        </label>
        <label class="radio-option">
          <input type="radio" name="correct-answer-${index}" value="False" ${question.correct_answer === "False" ? "checked" : ""}>
          <span>False</span>
        </label>
      </div>`
  } else if (question.options && question.options.length > 2) {
    questionTypeHtml = `
      <div class="question-type-selector">
        <label for="question-type-${index}">Type:</label>
        <select id="question-type-${index}" class="question-type-select" onchange="changeQuestionTypeFunc(${index}, this.value)">
          <option value="multiple-choice" selected>Multiple Choice</option>
          <option value="identification">Identification</option>
          <option value="fill-blanks">Fill in Blanks</option>
          <option value="true-false">True or False</option>
          <option value="essay">Essay</option>
        </select>
      </div>`

    optionsHtml = `<div class="multiple-choice-options">`
    question.options.forEach((option, optIndex) => {
      const letter = String.fromCharCode(65 + optIndex)
      optionsHtml += `
        <div class="option-group">
          <label class="radio-option">
            <input type="radio" name="correct-answer-${index}" value="${option}" ${question.correct_answer === option ? "checked" : ""}>
            <span>${letter}.</span>
          </label>
          <input type="text" class="option-input" value="${option}" onchange="updateOptionFunc(${index}, ${optIndex}, this.value)">
          <button type="button" class="remove-option-btn" onclick="removeOptionFunc(${index}, ${optIndex})" ${question.options.length <= 2 ? 'style="display:none"' : ""}>×</button>
        </div>`
    })
    optionsHtml += `
      <button type="button" class="add-option-btn" onclick="addOptionFunc(${index})" ${question.options.length >= 6 ? 'style="display:none"' : ""}>+ Add Option</button>
    </div>`
  } else if (!question.options || question.options.length === 0) {
    // Handle identification, fill-blanks, or essay questions
    const questionType =
      question.type ||
      (question.question && question.question.includes("_____")
        ? "fill-blanks"
        : question.question && question.question.length > 200
          ? "essay"
          : "identification")

    questionTypeHtml = `
      <div class="question-type-selector">
        <label for="question-type-${index}">Type:</label>
        <select id="question-type-${index}" class="question-type-select" onchange="changeQuestionTypeFunc(${index}, this.value)">
          <option value="multiple-choice">Multiple Choice</option>
          <option value="identification" ${questionType === "identification" ? "selected" : ""}>Identification</option>
          <option value="fill-blanks" ${questionType === "fill-blanks" ? "selected" : ""}>Fill in Blanks</option>
          <option value="true-false">True or False</option>
          <option value="essay" ${questionType === "essay" ? "selected" : ""}>Essay</option>
        </select>
      </div>`

    if (questionType === "identification" || questionType === "fill-blanks") {
      optionsHtml = `
        <div class="answer-input-group">
          <label for="answer-${index}">Correct Answer:</label>
          <input type="text" id="answer-${index}" class="answer-input" value="${question.correct_answer || ""}" placeholder="Enter the correct answer">
        </div>`
    } else if (questionType === "essay") {
      optionsHtml = `
        <div class="essay-rubric-group">
          <label for="rubric-${index}">Grading Rubric (Optional):</label>
          <textarea id="rubric-${index}" class="rubric-input" placeholder="Enter grading criteria or key points to look for...">${question.rubric || ""}</textarea>
        </div>`
    }
  }

  questionDiv.innerHTML = `
    <div class="question-header">
      <div class="question-number">Question ${index}</div>
      ${questionTypeHtml}
      <button type="button" class="remove-question-btn" onclick="removeQuestionFunc(${index})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div class="question-content">
      <div class="form-group">
        <label for="question-text-${index}">Question:</label>
        <textarea id="question-text-${index}" class="question-input" rows="3" placeholder="Enter your question here...">${question.question || ""}</textarea>
      </div>
      <div class="question-options">
        ${optionsHtml}
      </div>
    </div>`

  questionsContainer.appendChild(questionDiv)
}

function changeQuestionTypeFunc(index, type) {
  const questionDiv = document.querySelector(`[data-question-index="${index}"]`)
  if (!questionDiv) return

  const optionsContainer = questionDiv.querySelector(".question-options")
  if (!optionsContainer) return

  let optionsHtml = ""

  switch (type) {
    case "multiple-choice":
      optionsHtml = `<div class="multiple-choice-options">`
      for (let i = 0; i < 4; i++) {
        const letter = String.fromCharCode(65 + i)
        optionsHtml += `
          <div class="option-group">
            <label class="radio-option">
              <input type="radio" name="correct-answer-${index}" value="${letter}">
              <span>${letter}.</span>
            </label>
            <input type="text" class="option-input" placeholder="Option ${letter}">
            <button type="button" class="remove-option-btn" onclick="removeOptionFunc(${index}, ${i})" style="display:none">×</button>
          </div>`
      }
      optionsHtml += `
        <button type="button" class="add-option-btn" onclick="addOptionFunc(${index})">+ Add Option</button>
      </div>`
      break

    case "identification":
      optionsHtml = `
        <div class="answer-input-group">
          <label for="answer-${index}">Correct Answer:</label>
          <input type="text" id="answer-${index}" class="answer-input" placeholder="Enter the correct answer">
        </div>`
      break

    case "fill-blanks":
      optionsHtml = `
        <div class="answer-input-group">
          <label for="answer-${index}">Correct Answers (separate multiple answers with commas):</label>
          <input type="text" id="answer-${index}" class="answer-input" placeholder="answer1, answer2, answer3">
          <small>For multiple blanks, separate answers with commas</small>
        </div>`
      break

    case "true-false":
      optionsHtml = `
        <div class="true-false-options">
          <label class="radio-option">
            <input type="radio" name="correct-answer-${index}" value="True">
            <span>True</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="correct-answer-${index}" value="False">
            <span>False</span>
          </label>
        </div>`
      break

    case "essay":
      optionsHtml = `
        <div class="essay-rubric-group">
          <label for="rubric-${index}">Grading Rubric (Optional):</label>
          <textarea id="rubric-${index}" class="rubric-input" placeholder="Enter grading criteria or key points to look for..."></textarea>
        </div>`
      break

    default:
      console.warn("[v0] Unknown question type:", type)
      break
  }

  optionsContainer.innerHTML = optionsHtml
}

function addOptionFunc(index) {
  const questionDiv = document.querySelector(`[data-question-index="${index}"]`)
  if (!questionDiv) return

  const optionsContainer = questionDiv.querySelector(".multiple-choice-options")
  if (!optionsContainer) return

  const existingOptions = optionsContainer.querySelectorAll(".option-group")
  const nextOptionIndex = existingOptions.length

  if (nextOptionIndex >= 6) {
    const addOptionBtn = optionsContainer.querySelector(".add-option-btn")
    if (addOptionBtn) {
      addOptionBtn.style.display = "none"
    }
  }

  const letter = String.fromCharCode(65 + nextOptionIndex)
  const newOptionHtml = `
    <div class="option-group">
      <label class="radio-option">
        <input type="radio" name="correct-answer-${index}" value="${letter}">
        <span>${letter}.</span>
      </label>
      <input type="text" class="option-input" placeholder="Option ${letter}">
      <button type="button" class="remove-option-btn" onclick="removeOptionFunc(${index}, ${nextOptionIndex})">×</button>
    </div>`

  optionsContainer.insertAdjacentHTML("beforeend", newOptionHtml)
}

function removeOptionFunc(index, optIndex) {
  const questionDiv = document.querySelector(`[data-question-index="${index}"]`)
  if (!questionDiv) return

  const optionsContainer = questionDiv.querySelector(".multiple-choice-options")
  if (!optionsContainer) return

  const optionGroups = optionsContainer.querySelectorAll(".option-group")
  if (optIndex < optionGroups.length) {
    optionGroups[optIndex].remove()
  }

  const addOptionBtn = optionsContainer.querySelector(".add-option-btn")
  if (addOptionBtn) {
    addOptionBtn.style.display = ""
  }
}

function updateOptionFunc(index, optIndex, newValue) {
  const questionDiv = document.querySelector(`[data-question-index="${index}"]`)
  if (!questionDiv) return

  const optionsContainer = questionDiv.querySelector(".multiple-choice-options")
  if (!optionsContainer) return

  const optionGroups = optionsContainer.querySelectorAll(".option-group")
  if (optIndex < optionGroups.length) {
    const optionInput = optionGroups[optIndex].querySelector(".option-input")
    if (optionInput) {
      optionInput.value = newValue
    }
  }
}

function removeQuestionFunc(index) {
  const questionDiv = document.querySelector(`[data-question-index="${index}"]`)
  if (questionDiv) {
    questionDiv.remove()
  }
}

async function handleEditFormSubmitFunc(event, examCode) {
  event.preventDefault()

  console.log("[v0] Saving exam changes...")

  try {
    const form = event.target
    const formData = new FormData(form)

    const title = formData.get("title")
    const duration = Number.parseInt(formData.get("duration"))

    if (!title || !duration) {
      alert("Please fill in all required fields")
      return
    }

    // Collect questions
    const questions = []
    const questionCards = document.querySelectorAll(".question-item")

    console.log("[v0] Processing", questionCards.length, "questions")

    for (let i = 0; i < questionCards.length; i++) {
      const card = questionCards[i]
      const questionIndex = i + 1

      const questionText = card.querySelector(`textarea[id="question-text-${questionIndex}"]`).value.trim()
      const questionType = card.querySelector(`select[id="question-type-${questionIndex}"]`).value

      if (!questionText || !questionType) {
        alert(`Please complete all fields for Question ${questionIndex}`)
        return
      }

      let options = []
      let correctAnswer = ""

      switch (questionType) {
        case "multiple-choice":
          options = Array.from(card.querySelectorAll(`input[name="correct-answer-${questionIndex}"]`)).map((input) =>
            input.value.trim(),
          )
          correctAnswer = card.querySelector(`input[name="correct-answer-${questionIndex}"]:checked`)?.value

          if (options.some((opt) => !opt) || !correctAnswer) {
            alert(`Please complete all options and select correct answer for Question ${questionIndex}`)
            return
          }
          break

        case "true-false":
          options = ["True", "False"]
          correctAnswer = card.querySelector(`input[name="correct-answer-${questionIndex}"]:checked`)?.value

          if (!correctAnswer) {
            alert(`Please select the correct answer for Question ${questionIndex}`)
            return
          }
          break

        case "identification":
        case "fill-blanks":
        case "essay":
          correctAnswer = card
            .querySelector(`input[id="answer-${questionIndex}"], textarea[id="rubric-${questionIndex}"]`)
            ?.value?.trim()

          if (!correctAnswer && questionType !== "essay") {
            alert(`Please provide the correct answer for Question ${questionIndex}`)
            return
          }
          break

        default:
          alert(`Unknown question type for Question ${questionIndex}`)
          return
      }

      questions.push({
        question: questionText,
        options: options,
        correctAnswer: correctAnswer,
        type: questionType,
      })
    }

    if (questions.length === 0) {
      alert("Please add at least one question")
      return
    }

    console.log("[v0] Updating exam with", questions.length, "questions")

    const showTimer = document.getElementById("edit-show-timer")?.checked || false
    const autoSubmit = document.getElementById("edit-auto-submit")?.checked || false
    const shuffleQuestions = document.getElementById("edit-shuffle-questions")?.checked || false

    const instructorId = Number.parseInt(instructorSession.id)

    // Update exam in database
    const { error } = await window.supabaseClient
      .from("exams")
      .update({
        title: title,
        duration: duration,
        questions: questions,
        show_timer: showTimer,
        auto_submit: autoSubmit,
        shuffle_questions: shuffleQuestions,
        updated_at: new Date().toISOString(),
      })
      .eq("exam_code", examCode)
      .eq("instructor_id", instructorId) // Use parsed integer ID for strict data isolation

    if (error) {
      console.error("[v0] Error updating exam:", error)
      alert("Failed to save changes: " + error.message)
      return
    }

    console.log("[v0] Exam updated successfully")
    alert("Exam updated successfully!")

    // Exit edit mode and refresh dashboard
    exitEditFunc()
    loadExams()
  } catch (error) {
    console.error("[v0] Error saving exam changes:", error)
    alert("An error occurred while saving changes. Please try again.")
  }
}

function exitEditFunc() {
  const editContainer = document.getElementById("edit-container")
  if (editContainer) {
    editContainer.remove()
  }

  const mainContent = document.querySelector(".dashboard-content")
  if (mainContent) {
    mainContent.style.display = "block"
  }

  console.log("[v0] Exited edit mode")
}

function checkForNewExam() {
  if (localStorage.getItem("examCreated") === "true") {
    localStorage.removeItem("examCreated")

    // Show success notification
    const notification = document.createElement("div")
    notification.className = "success-notification"
    notification.innerHTML = `
      <div class="notification-content">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Exam created successfully!</span>
      </div>
    `
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("show")
    }, 100)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Dashboard initializing...")

  if (!checkInstructorAuth()) {
    return
  }

  initializeSupabase()
  checkForNewExam() // Check for newly created exam
  await loadExams()
  loadDashboardStats()

  console.log("[v0] Dashboard initialization complete")
})

function checkInstructorAuth() {
  const storedSession = localStorage.getItem("instructorSession")

  if (!storedSession) {
    console.log("[v0] No instructor session found, redirecting to login")
    window.location.href = "index.html"
    return false
  }

  try {
    instructorSession = JSON.parse(storedSession)
    console.log("[v0] Instructor authenticated:", instructorSession.username)

    // Update UI with instructor info
    updateInstructorInfo()

    return true
  } catch (error) {
    console.error("[v0] Error parsing instructor session:", error)
    window.location.href = "index.html"
    return false
  }
}

function initializeSupabase() {
  if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
    if (!window.supabaseClient) {
      window.supabaseClient = window.createSupabaseClient()
    }
    console.log("[v0] Supabase client ready for dashboard")
  } else {
    console.error("[v0] Supabase CDN not available - dashboard may not function properly")
  }
}

function loadDashboardStats() {
  // Update statistics from stored data
  const submissions = getStoredSubmissions()
  dashboardData.totalSubmissions = submissions.length
  if (totalSubmissionsCount) {
    totalSubmissionsCount.textContent = dashboardData.totalSubmissions
  }

  // Update system init time
  if (systemInitTime && instructorSession) {
    const loginTime = new Date(instructorSession.loginTime || Date.now())
    const timeAgo = getTimeAgo(loginTime)
    systemInitTime.textContent = timeAgo
  }

  // Setup event listeners
  setupEventListeners()

  // Start real-time updates
  startRealTimeUpdates()

  // Add system initialization activity
  addActivity("system", "Dashboard initialized successfully", "just now")

  console.log("[v0] Dashboard stats loaded successfully")
}
