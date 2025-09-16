let examData = null
let currentQuestionIndex = 0
const answers = {}
let examTimer = null
let timeRemaining = 0
let cameraStream = null
let monitoringActive = false
let tabSwitchCount = 0
const violations = []

let peerConnection = null
const localStream = null

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load exam data from localStorage
    const storedExamData = localStorage.getItem("examData")
    if (!storedExamData) {
      alert("No exam data found. Redirecting to login...")
      window.location.href = "index.html"
      return
    }

    examData = JSON.parse(storedExamData)
    console.log("[v0] Loaded exam data:", examData)

    // Initialize exam interface
    initializeExam()

    // Start camera monitoring
    await startCameraMonitoring()

    // Start exam timer
    startExamTimer()

    // Set up security monitoring
    setupSecurityMonitoring()

    // Load first question
    loadQuestion(0)
  } catch (error) {
    console.error("[v0] Exam initialization error:", error)
    alert("Failed to initialize exam. Please try again.")
    window.location.href = "index.html"
  }
})

function initializeExam() {
  document.getElementById("exam-title").textContent = examData.title
  document.getElementById("exam-code-display").textContent = `Code: ${examData.code}`

  const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
  document.getElementById("student-info").textContent =
    `Student: ${studentInfo.surname || "Unknown"}, ${studentInfo.name || "Student"}`

  timeRemaining = (examData.duration || 30) * 60 // Convert minutes to seconds

  // Initialize answers object
  if (examData.questions) {
    examData.questions.forEach((_, index) => {
      answers[index] = null
    })
  }
}

async function startCameraMonitoring() {
  try {
    console.log("[v0] Starting camera monitoring for exam...")

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
        frameRate: { ideal: 15 },
      },
      audio: false,
    })

    const monitoringCamera = document.getElementById("monitoring-camera")
    monitoringCamera.srcObject = cameraStream

    await setupLiveStreaming()

    monitoringActive = true
    console.log("[v0] Camera monitoring started successfully")

    // Start periodic monitoring checks
    setInterval(performMonitoringCheck, 5000)
  } catch (error) {
    console.error("[v0] Camera monitoring error:", error)
    document.getElementById("monitoring-status").innerHTML =
      '<span class="status-indicator" style="background: #dc2626;"></span>Camera Error'
  }
}

async function setupLiveStreaming() {
  try {
    // Create peer connection for live streaming
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    // Add camera stream to peer connection
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, cameraStream)
      })
    }

    // Store stream info for instructor access
    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const streamInfo = {
      studentId: studentInfo.studentNumber,
      studentName: `${studentInfo.surname}, ${studentInfo.name}`,
      examCode: examData.code,
      streamActive: true,
      timestamp: new Date().toISOString(),
    }

    // Store in localStorage for instructor monitoring access
    const activeStreams = JSON.parse(localStorage.getItem("activeStreams") || "[]")
    activeStreams.push(streamInfo)
    localStorage.setItem("activeStreams", JSON.stringify(activeStreams))

    console.log("[v0] Live streaming setup completed")
  } catch (error) {
    console.error("[v0] Live streaming setup error:", error)
  }
}

function performMonitoringCheck() {
  if (!monitoringActive || !cameraStream) return

  const canvas = document.getElementById("monitoring-canvas")
  const ctx = canvas.getContext("2d")
  const video = document.getElementById("monitoring-camera")

  if (video.readyState >= 2) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Basic monitoring checks
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const monitoringResult = analyzeForViolations(imageData)

    if (monitoringResult.violation) {
      recordViolation(monitoringResult.type, monitoringResult.description)
    }
  }
}

function analyzeForViolations(imageData) {
  // Basic analysis for multiple people or suspicious activity
  const data = imageData.data
  let brightPixels = 0
  const totalPixels = imageData.width * imageData.height

  for (let i = 0; i < data.length; i += 16) {
    // Sample every 4th pixel
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness > 100) brightPixels++
  }

  const brightnessRatio = brightPixels / (totalPixels / 4)

  // Simple heuristic: sudden brightness changes might indicate someone else
  if (brightnessRatio > 0.8) {
    return {
      violation: true,
      type: "suspicious_activity",
      description: "Unusual lighting or movement detected",
    }
  }

  return { violation: false }
}

function recordViolation(type, description) {
  const violation = {
    type,
    description,
    timestamp: new Date().toISOString(),
    questionIndex: currentQuestionIndex,
  }

  violations.push(violation)
  console.log("[v0] Violation recorded:", violation)

  // Update security alerts count in instructor dashboard
  updateSecurityAlerts()
}

function updateSecurityAlerts() {
  // This would typically send to the server, but for demo we'll use localStorage
  const currentAlerts = Number.parseInt(localStorage.getItem("securityAlerts") || "0")
  localStorage.setItem("securityAlerts", (currentAlerts + 1).toString())
}

function startExamTimer() {
  const timerDisplay = document.getElementById("timer-display")

  examTimer = setInterval(() => {
    timeRemaining--

    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60

    timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

    if (timeRemaining <= 0) {
      clearInterval(examTimer)
      submitExam(true) // Auto-submit when time runs out
    }
  }, 1000)
}

function setupSecurityMonitoring() {
  // Monitor tab/window switching
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      tabSwitchCount++
      recordViolation("tab_switch", `Tab/window switch #${tabSwitchCount}`)

      let message = ""
      if (tabSwitchCount === 1) {
        message = "First warning: Tab switching detected. Next switch will be your final warning."
      } else if (tabSwitchCount === 2) {
        message = "Final warning: Another tab switch will automatically submit your exam."
      } else if (tabSwitchCount >= 3) {
        message = "Exam automatically submitted due to multiple tab switches."
        setTimeout(() => submitExam(true), 2000)
      }

      showSecurityWarning(message)
    }
  })

  // Prevent right-click and common shortcuts
  document.addEventListener("contextmenu", (e) => e.preventDefault())
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && (e.key === "u" || e.key === "i" || e.key === "s")) ||
      (e.ctrlKey && e.shiftKey && e.key === "I")
    ) {
      e.preventDefault()
      recordViolation("dev_tools", "Attempted to access developer tools")
    }
  })
}

function showSecurityWarning(message) {
  const modal = document.getElementById("security-modal")
  const messageEl = document.getElementById("security-message")

  messageEl.textContent = message
  modal.classList.add("show")

  document.getElementById("security-ok-btn").onclick = () => {
    modal.classList.remove("show")
  }
}

function loadQuestion(index) {
  if (!examData.questions || index >= examData.questions.length) return

  currentQuestionIndex = index
  const question = examData.questions[index]

  // Update progress
  const progress = ((index + 1) / examData.questions.length) * 100
  document.getElementById("progress-fill").style.width = `${progress}%`
  document.getElementById("progress-text").textContent = `Question ${index + 1} of ${examData.questions.length}`

  // Load question content
  const container = document.getElementById("question-container")
  container.innerHTML = `
    <div class="question-title">${index + 1}. ${question.question}</div>
    <div class="question-options">
      ${question.options
        .map(
          (option, optIndex) => `
        <div class="option-item ${answers[index] === optIndex ? "selected" : ""}" 
             onclick="selectAnswer(${index}, ${optIndex})">
          <div class="option-radio"></div>
          <div class="option-text">${option}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `

  // Update navigation buttons
  document.getElementById("prev-btn").disabled = index === 0
  document.getElementById("next-btn").style.display = index === examData.questions.length - 1 ? "none" : "block"
  document.getElementById("submit-btn").style.display = index === examData.questions.length - 1 ? "block" : "none"
}

function selectAnswer(questionIndex, optionIndex) {
  answers[questionIndex] = optionIndex

  // Update UI
  const options = document.querySelectorAll(".option-item")
  options.forEach((option, index) => {
    option.classList.toggle("selected", index === optionIndex)
  })
}

// Navigation functions
document.getElementById("prev-btn").onclick = () => {
  if (currentQuestionIndex > 0) {
    loadQuestion(currentQuestionIndex - 1)
  }
}

document.getElementById("next-btn").onclick = () => {
  if (currentQuestionIndex < examData.questions.length - 1) {
    loadQuestion(currentQuestionIndex + 1)
  }
}

document.getElementById("submit-btn").onclick = () => {
  if (confirm("Are you sure you want to submit your exam? This action cannot be undone.")) {
    submitExam(false)
  }
}

async function submitExam(autoSubmit = false) {
  try {
    console.log("[v0] Submitting exam...", { autoSubmit, answers, violations })

    // Calculate score
    let correctAnswers = 0
    examData.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / examData.questions.length) * 100)

    // Prepare submission data
    const studentInfo = JSON.parse(localStorage.getItem("studentInfo") || "{}")
    const submission = {
      studentId: studentInfo.studentNumber,
      studentName: `${studentInfo.surname}, ${studentInfo.name}`,
      middleInitial: studentInfo.middleInitial || "",
      examCode: examData.code,
      examTitle: examData.title,
      answers,
      score,
      violations,
      submissionTime: new Date().toISOString(),
      autoSubmitted: autoSubmit,
      timeSpent: examData.duration * 60 - timeRemaining,
    }

    // Store submission (in real app, this would go to server)
    const submissions = JSON.parse(localStorage.getItem("examSubmissions") || "[]")
    submissions.push(submission)
    localStorage.setItem("examSubmissions", JSON.stringify(submissions))

    // Clean up camera and streams
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
    }

    // Remove from active streams
    const activeStreams = JSON.parse(localStorage.getItem("activeStreams") || "[]")
    const updatedStreams = activeStreams.filter((stream) => stream.studentId !== studentInfo.studentNumber)
    localStorage.setItem("activeStreams", JSON.stringify(updatedStreams))

    // Clear exam timer
    if (examTimer) {
      clearInterval(examTimer)
    }

    alert(`Exam submitted successfully!\nYour score: ${score}%\nViolations: ${violations.length}`)

    // Redirect to completion page or login
    window.location.href = "index.html"
  } catch (error) {
    console.error("[v0] Exam submission error:", error)
    alert("Failed to submit exam. Please try again.")
  }
}

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
  }
  if (examTimer) {
    clearInterval(examTimer)
  }
})
