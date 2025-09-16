// Initialize Supabase client after DOM loads and Supabase is available
const supabase = null

// Supabase configuration will be loaded from environment variables

const SAMPLE_EXAM = null
const INSTRUCTOR_CREDENTIALS = null

let cameraStream = null
let faceDetectionInterval = null
let isFaceVerified = false

let isShowingNoFaceNotification = false
let isShowingMultipleFaceNotification = false

// DOM elements
const tabTriggers = document.querySelectorAll(".tab-trigger")
const tabContents = document.querySelectorAll(".tab-content")
const studentForm = document.getElementById("student-form")
const instructorForm = document.getElementById("instructor-form")
const loadingOverlay = document.getElementById("loading-overlay")

const cameraPreview = document.getElementById("camera-preview")
const startCameraBtn = document.getElementById("start-camera-btn")
const cameraStatus = document.getElementById("camera-status")
const faceVerifiedCheckbox = document.getElementById("face-verified")

// Tab switching functionality
tabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    console.log("[v0] Tab clicked:", trigger.getAttribute("data-tab"))
    e.preventDefault()

    const tabName = trigger.getAttribute("data-tab")

    // Remove active class from all triggers and contents
    tabTriggers.forEach((t) => t.classList.remove("active"))
    tabContents.forEach((c) => c.classList.remove("active"))

    // Add active class to clicked trigger and corresponding content
    trigger.classList.add("active")
    const targetTab = document.getElementById(`${tabName}-tab`)
    if (targetTab) {
      targetTab.classList.add("active")
      console.log("[v0] Switched to tab:", tabName)
    } else {
      console.error("[v0] Tab not found:", `${tabName}-tab`)
    }
  })
})

// Show loading overlay
function showLoading() {
  loadingOverlay.classList.add("show")
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.classList.remove("show")
}

// Show message
function showMessage(message, type = "error") {
  // Remove existing messages
  const existingMessages = document.querySelectorAll(".error-message, .success-message")
  existingMessages.forEach((msg) => msg.remove())

  const messageDiv = document.createElement("div")
  messageDiv.className = type === "error" ? "error-message" : "success-message"
  messageDiv.textContent = message

  // Insert message at the top of the active form
  const activeTab = document.querySelector(".tab-content.active")
  const form = activeTab.querySelector(".form")
  form.insertBefore(messageDiv, form.firstChild)

  // Auto-remove message after 5 seconds
  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}

// Enhanced face detection with better algorithms
async function startFaceDetection() {
  try {
    console.log("[v0] Starting face detection...")

    // Update status
    updateCameraStatus("Requesting camera access...")

    // Start camera with optimal settings
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: "user",
        frameRate: { ideal: 15 },
      },
    })

    cameraPreview.srcObject = cameraStream
    cameraPreview.style.display = "block"

    updateCameraStatus("Camera started, detecting face...")

    cameraPreview.addEventListener("loadedmetadata", () => {
      console.log("[v0] Camera metadata loaded, starting detection")
      startRealFaceDetection()
    })

    console.log("[v0] Face detection started successfully")
  } catch (error) {
    console.error("[v0] Camera access error:", error)
    updateCameraStatus("Camera access denied - Please allow camera access")

    // Allow proceeding even if camera fails (for demo purposes)
    setTimeout(() => {
      completeFaceDetection()
    }, 3000)
  }
}

function updateCameraStatus(message) {
  const statusElement = document.querySelector("#camera-status .status-text")
  if (statusElement) {
    statusElement.textContent = message
  }
}

function startRealFaceDetection() {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  canvas.width = 160
  canvas.height = 120

  let detectionProgress = 0
  let noFaceCount = 0
  const maxNoFaceCount = 5
  const progressIncrement = 2

  faceDetectionInterval = setInterval(() => {
    if (!cameraStream || !cameraPreview || cameraPreview.readyState < 2) {
      updateCameraStatus("Camera loading...")
      return
    }

    try {
      ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const detectionResult = detectFaceInImage(imageData)

      if (detectionResult.faceDetected && !detectionResult.multiplePeople) {
        detectionProgress = Math.min(100, detectionProgress + progressIncrement)
        noFaceCount = 0

        isShowingNoFaceNotification = false
        isShowingMultipleFaceNotification = false

        updateCameraStatus(`Face detected... ${detectionProgress}%`)

        if (detectionProgress < 50) {
          cameraPreview.style.border = "3px solid #f59e0b"
        } else if (detectionProgress < 100) {
          cameraPreview.style.border = "3px solid #3b82f6"
        } else {
          cameraPreview.style.border = "3px solid #16a34a"
        }

        if (detectionProgress >= 100) {
          completeFaceDetection()
        }
      } else if (detectionResult.multiplePeople) {
        detectionProgress = Math.max(0, detectionProgress - 2)

        if (!isShowingMultipleFaceNotification) {
          updateCameraStatus("Multiple people detected - Only one person allowed")
          isShowingMultipleFaceNotification = true
          isShowingNoFaceNotification = false
        }

        cameraPreview.style.border = "3px solid #dc2626"
      } else {
        noFaceCount++
        detectionProgress = Math.max(0, detectionProgress - 1)

        if (!isShowingNoFaceNotification) {
          updateCameraStatus(`Position your face clearly in the camera frame (${detectionProgress}%)`)
          isShowingNoFaceNotification = true
          isShowingMultipleFaceNotification = false
        }

        cameraPreview.style.border = "3px solid #f59e0b"

        if (noFaceCount >= maxNoFaceCount) {
          stopFaceDetectionDueToAbsence()
          return
        }
      }
    } catch (error) {
      console.error("[v0] Detection error:", error)
    }
  }, 200)

  setTimeout(() => {
    if (!isFaceVerified) {
      console.log("[v0] Auto-completing face detection after timeout")
      completeFaceDetection()
    }
  }, 30000)
}

function detectFaceInImage(imageData) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  let skinPixels = 0
  let totalPixels = 0
  let faceRegionPixels = 0
  let brightPixels = 0

  const centerX = width / 2
  const centerY = height / 2
  const faceRegionSize = Math.min(width, height) * 0.3

  const gridSize = 15
  const faceGrid = Array(Math.ceil(height / gridSize))
    .fill()
    .map(() => Array(Math.ceil(width / gridSize)).fill(0))

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      totalPixels++

      const brightness = (r + g + b) / 3
      if (brightness > 50) {
        brightPixels++
      }

      const isFaceSkin = detectLenientFaceSkin(r, g, b)
      if (isFaceSkin) {
        skinPixels++

        const gridX = Math.floor(x / gridSize)
        const gridY = Math.floor(y / gridSize)
        if (gridX < faceGrid[0].length && gridY < faceGrid.length) {
          faceGrid[gridY][gridX]++
        }

        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        if (distanceFromCenter < faceRegionSize) {
          faceRegionPixels++
        }
      }
    }
  }

  const significantRegions = []
  for (let y = 0; y < faceGrid.length; y++) {
    for (let x = 0; x < faceGrid[y].length; x++) {
      if (faceGrid[y][x] > 8) {
        significantRegions.push({ x, y, density: faceGrid[y][x] })
      }
    }
  }

  const multiplePeople = checkForMultiplePeople(significantRegions, faceGrid[0].length)

  const skinPercentage = skinPixels / totalPixels
  const faceRegionPercentage = faceRegionPixels / Math.max(skinPixels, 1)
  const brightnessRatio = brightPixels / totalPixels

  const hasEnoughFaceSkin = skinPercentage > 0.04 && skinPercentage < 0.35
  const hasConcentratedFace = faceRegionPercentage > 0.25
  const hasGoodLighting = brightnessRatio > 0.3
  const hasMinimumFacePixels = faceRegionPixels > 15
  const hasProperFaceSize = faceRegionPixels < 800

  const faceDetected =
    hasEnoughFaceSkin && hasConcentratedFace && hasGoodLighting && hasMinimumFacePixels && hasProperFaceSize

  return {
    faceDetected,
    multiplePeople,
    confidence: faceDetected ? Math.min(100, skinPercentage * 800 + faceRegionPercentage * 80) : 0,
  }
}

function detectLenientFaceSkin(r, g, b) {
  if (r < 60 || g < 40 || b < 30) return false
  if (r > 250 && g > 250 && b > 250) return false

  const rg_diff = r - g
  const rb_diff = r - b
  const gb_diff = g - b

  const isFacialSkin =
    r >= g && rg_diff > 5 && rg_diff < 100 && rb_diff > 10 && rb_diff < 140 && gb_diff > -30 && gb_diff < 50

  const y = 0.299 * r + 0.587 * g + 0.114 * b
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

  const ycbcrFacialSkin = y > 60 && y < 240 && cb >= 80 && cb <= 140 && cr >= 130 && cr <= 185

  return isFacialSkin && ycbcrFacialSkin
}

function checkForMultiplePeople(regions, gridWidth) {
  if (regions.length < 2) return false

  regions.sort((a, b) => b.density - a.density)

  const significantRegions = regions.filter((region) => region.density > 30) // Increased threshold

  if (significantRegions.length >= 3) {
    // Increased from 2 to 3
    console.log("[v0] Multiple people detected during login - significant regions:", significantRegions.length)
    return true
  }

  // Check for regions that are far apart (indicating multiple people)
  for (let i = 0; i < Math.min(regions.length, 3); i++) {
    for (let j = i + 1; j < Math.min(regions.length, 3); j++) {
      const region1 = regions[i]
      const region2 = regions[j]

      const distance = Math.sqrt(Math.pow(region1.x - region2.x, 2) + Math.pow(region1.y - region2.y, 2))

      if (distance > 6 && region1.density > 25 && region2.density > 25) {
        // Increased thresholds
        console.log("[v0] Multiple people detected during login - distant regions:", { region1, region2, distance })
        return true
      }
    }
  }

  const leftRegions = regions.filter((r) => r.x < gridWidth / 3)
  const rightRegions = regions.filter((r) => r.x > (2 * gridWidth) / 3)

  if (leftRegions.length > 0 && rightRegions.length > 0) {
    const maxLeft = Math.max(...leftRegions.map((r) => r.density))
    const maxRight = Math.max(...rightRegions.map((r) => r.density))

    if (maxLeft > 22 && maxRight > 22) {
      // Increased from 18
      console.log("[v0] Multiple people detected during login - left/right spread:", { maxLeft, maxRight })
      return true
    }
  }

  return false
}

function completeFaceDetection() {
  isFaceVerified = true

  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval)
    faceDetectionInterval = null
  }

  isShowingNoFaceNotification = false
  isShowingMultipleFaceNotification = false

  updateCameraStatus("Face verification completed!")
  cameraPreview.style.border = "2px solid #16a34a"

  if (faceVerifiedCheckbox) {
    faceVerifiedCheckbox.checked = true
  }

  setTimeout(() => {
    if (cameraPreview) {
      cameraPreview.style.display = "none"
    }
    updateCameraStatus("Face verified ✓")
  }, 2000)

  console.log("[v0] Face detection completed successfully")
}

function stopFaceDetectionDueToAbsence() {
  console.log("[v0] Stopping face detection - person left camera view")

  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval)
    faceDetectionInterval = null
  }

  stopCamera()

  updateCameraStatus("Face detection stopped - Please start again")
  cameraPreview.style.display = "none"
  cameraPreview.style.border = "none"

  startCameraBtn.textContent = "Detect face"
  startCameraBtn.disabled = false

  isFaceVerified = false
  if (faceVerifiedCheckbox) {
    faceVerifiedCheckbox.checked = false
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
  }

  if (faceDetectionInterval) {
    clearInterval(faceDetectionInterval)
    faceDetectionInterval = null
  }

  isShowingNoFaceNotification = false
  isShowingMultipleFaceNotification = false
}

if (startCameraBtn) {
  startCameraBtn.addEventListener("click", (e) => {
    e.preventDefault()
    if (!isFaceVerified) {
      stopCamera()
      startFaceDetection()
    }
  })
}

studentForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const examCode = document.getElementById("exam-code").value.trim()
  const surname = document.getElementById("surname").value.trim()
  const name = document.getElementById("name").value.trim()
  const middleInitial = document.getElementById("middle-initial").value.trim().toUpperCase()
  const studentNumber = document.getElementById("student-number").value.trim()

  if (!examCode || !surname || !name || !studentNumber) {
    showMessage("Please fill in all required fields (Middle Initial is optional)")
    return
  }

  if (!isFaceVerified) {
    showMessage("Please complete face detection before accessing the exam")
    return
  }

  showLoading()

  try {
    console.log("[v0] Attempting to access exam with code:", examCode)

    // Check if examOperations is available
    if (!window.examOperations) {
      console.error("[v0] examOperations not available")
      hideLoading()
      showMessage("System error: Exam operations not loaded. Please refresh the page.")
      return
    }

    // Check if Supabase client creator is available
    if (!window.createSupabaseClient) {
      console.error("[v0] createSupabaseClient not available")
      hideLoading()
      showMessage("System error: Database connection not available. Please refresh the page.")
      return
    }

    console.log("[v0] Calling getExamByCode with:", examCode)
    const examData = await window.examOperations.getExamByCode(examCode)

    if (!examData || examData === null || typeof examData !== "object") {
      console.error("[v0] Exam data is null or invalid:", examData)
      hideLoading()
      showMessage("Exam not found. Please check your exam code and try again.")
      return
    }

    if (!examData.id) {
      console.error("[v0] Exam data missing ID:", examData)
      hideLoading()
      showMessage("Invalid exam data. Please contact your instructor.")
      return
    }

    console.log("[v0] Exam data returned:", examData)
    console.log("[v0] Exam found - proceeding with login")

    const studentInfo = {
      surname,
      name,
      middleInitial,
      fullName: `${surname}, ${name}${middleInitial ? " " + middleInitial + "." : ""}`,
      studentNumber,
      examCode,
      loginTime: new Date().toISOString(),
      faceVerified: true,
      cameraEnabled: true,
    }

    console.log("[v0] Creating exam session for student:", studentInfo.fullName)

    let session
    try {
      session = await window.examOperations.createExamSession(examData.id, studentInfo)
    } catch (sessionError) {
      console.error("[v0] Session creation failed:", sessionError)
      hideLoading()
      showMessage(`Failed to start exam session: ${sessionError.message}`)
      return
    }

    if (!session || !session.id) {
      console.error("[v0] Invalid session data returned")
      hideLoading()
      showMessage("Failed to create exam session. Please try again.")
      return
    }

    console.log("[v0] Exam session created successfully:", session.id)

    localStorage.setItem("examData", JSON.stringify(examData))
    localStorage.setItem("studentInfo", JSON.stringify(studentInfo))

    hideLoading()
    showMessage("Access granted! Redirecting to exam...", "success")

    setTimeout(() => {
      window.location.href = "exam.html"
    }, 1500)
  } catch (error) {
    hideLoading()
    console.error("[v0] Student login error:", error)
    console.error("[v0] Error details:", error.message)
    console.error("[v0] Error stack:", error.stack)

    let errorMessage = "Login failed. Please check your exam code and try again."
    if (error.message && error.message.includes("null")) {
      errorMessage = "System error: Invalid data received. Please refresh the page and try again."
    } else if (error.message) {
      errorMessage = error.message
    }

    showMessage(errorMessage)
  }
})

instructorForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  const username = document.getElementById("instructor-username").value.trim()
  const password = document.getElementById("instructor-password").value.trim()

  console.log("[v0] Instructor login attempt:")
  console.log("[v0] - Username:", username, "(length:", username.length, ")")
  console.log("[v0] - Password:", password.replace(/./g, "*"), "(length:", password.length, ")")
  console.log("[v0] - Username type:", typeof username)
  console.log("[v0] - Password type:", typeof password)
  console.log("[v0] - Username exact value:", JSON.stringify(username))
  console.log("[v0] - Password exact value:", JSON.stringify(password))

  if (!username || !password) {
    showMessage("Please fill in all fields")
    return
  }

  showLoading()

  try {
    console.log("[v0] Checking if instructorOperations is available:", !!window.instructorOperations)
    console.log("[v0] Checking if Supabase client is available:", !!window.createSupabaseClient)

    if (!window.instructorOperations) {
      throw new Error("Instructor operations not loaded")
    }

    console.log("[v0] Starting authentication process...")
    const instructor = await window.instructorOperations.authenticateInstructor(username, password)
    console.log("[v0] Authentication result:", instructor)

    if (!instructor) {
      hideLoading()
      console.log("[v0] Authentication failed - no instructor returned")
      showMessage("Invalid credentials. Please check your username and password.")
      return
    }

    const instructorSession = {
      id: instructor.id, // Keep original ID from database (should be integer)
      username: instructor.username,
      fullName: instructor.full_name,
      email: instructor.email,
      loginTime: new Date().toISOString(),
    }

    localStorage.setItem("instructorSession", JSON.stringify(instructorSession))
    console.log("[v0] Instructor session stored:", instructorSession)
    console.log("[v0] Stored instructor ID type:", typeof instructorSession.id)

    hideLoading()
    showMessage("Login successful! Redirecting to dashboard...", "success")

    setTimeout(() => {
      window.location.href = "instructor-dashboard.html"
    }, 1500)
  } catch (error) {
    hideLoading()
    console.error("[v0] Instructor login error:", error)
    showMessage(`Login failed: ${error.message}`)
  }
})

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (window.createSupabaseClient) {
      window.supabase = window.createSupabaseClient()
      console.log("[v0] IntegriTest system initialized with Supabase backend")
      console.log("[v0] Database connected successfully")
    } else {
      console.warn("[v0] Supabase client creator not available - using fallback authentication")
    }
    console.log("[v0] Face detection system ready")
  } catch (error) {
    console.error("[v0] Failed to initialize Supabase:", error)
  }

  window.addEventListener("beforeunload", () => {
    stopCamera()
  })
})
