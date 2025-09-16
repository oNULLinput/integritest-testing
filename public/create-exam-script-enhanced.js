let supabase = null

// Wait for Supabase client to be ready
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window.supabaseClient && window.supabaseReady) {
      supabase = window.supabaseClient
      console.log("[v0] Using global Supabase client")
      resolve(true)
    } else {
      console.log("[v0] Waiting for Supabase client to initialize...")
      window.addEventListener("supabaseReady", () => {
        supabase = window.supabaseClient
        console.log("[v0] Supabase client ready for exam creation")
        resolve(true)
      })
    }
  })
}

// Global variables
let questionCounter = 0
const uploadedFiles = []
let currentInstructor = null

// DOM elements
const examForm = document.getElementById("create-exam-form")
const questionsContainer = document.getElementById("questions-container")
const fileUploadArea = document.getElementById("file-upload-area")
const fileInput = document.getElementById("file-input")
const uploadedFilesList = document.getElementById("uploaded-files")

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  await waitForSupabase()

  initializeForm()
  setupFileUpload()
  checkEditMode()
  checkInstructorAuth()
})

async function checkInstructorAuth() {
  const instructorData = localStorage.getItem("instructorSession")
  if (!instructorData) {
    alert("Please log in as an instructor first.")
    window.location.href = "index.html"
    return
  }

  currentInstructor = JSON.parse(instructorData)
  console.log("[v0] Instructor authenticated:", currentInstructor.username)
}

// File Upload Handling
function setupFileUpload() {
  // Drag and drop functionality
  fileUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    fileUploadArea.classList.add("drag-over")
  })

  fileUploadArea.addEventListener("dragleave", () => {
    fileUploadArea.classList.remove("drag-over")
  })

  fileUploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    fileUploadArea.classList.remove("drag-over")
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  })

  // Click to upload
  fileUploadArea.addEventListener("click", () => {
    fileInput.click()
  })

  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files)
    handleFileUpload(files)
  })
}

function handleFileUpload(files) {
  const allowedTypes = [".pdf", ".doc", ".docx", ".txt", ".ppt", ".pptx"]
  const maxSize = 10 * 1024 * 1024 // 10MB

  files.forEach((file) => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      alert(`File type ${fileExtension} is not allowed. Please upload PDF, DOC, DOCX, TXT, PPT, or PPTX files.`)
      return
    }

    // Check file size
    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`)
      return
    }

    // Check if we already have 3 files
    if (uploadedFiles.length >= 3) {
      alert("Maximum 3 files allowed. Please remove a file before adding a new one.")
      return
    }

    // Add file to uploaded files
    uploadedFiles.push({
      name: file.name,
      size: file.size,
      type: fileExtension,
      file: file,
      uploadedAt: new Date().toISOString(),
    })

    updateUploadedFilesList()
  })

  // Clear the file input
  fileInput.value = ""
}

function updateUploadedFilesList() {
  if (uploadedFiles.length === 0) {
    uploadedFilesList.innerHTML = '<p class="no-files">No files uploaded yet</p>'
    return
  }

  uploadedFilesList.innerHTML = uploadedFiles
    .map(
      (file, index) => `
    <div class="uploaded-file-item">
      <div class="file-info">
        <div class="file-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div class="file-details">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">${formatFileSize(file.size)} • ${file.type.toUpperCase()}</div>
        </div>
      </div>
      <button type="button" class="remove-file-btn" onclick="removeFile(${index})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `,
    )
    .join("")
}

function removeFile(index) {
  uploadedFiles.splice(index, 1)
  updateUploadedFilesList()
}

// Question Management
function addQuestion(type) {
  questionCounter++

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionId = questionCounter
  questionDiv.dataset.questionType = type

  let questionHTML = `
    <div class="question-header">
      <div class="question-title">
        <span class="question-number">Question ${questionCounter}</span>
        <span class="question-type-badge">${getQuestionTypeLabel(type)}</span>
      </div>
      <button type="button" class="remove-question-btn" onclick="removeQuestion(${questionCounter})">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div class="question-content">
      <div class="form-group">
        <label>Question Text</label>
        <textarea name="question_${questionCounter}_text" placeholder="Enter your question here..." required></textarea>
      </div>
  `

  // Add type-specific fields
  switch (type) {
    case "multiple-choice":
      questionHTML += `
        <div class="form-group">
          <label>Answer Options</label>
          <div class="options-container">
            ${["A", "B", "C", "D"]
              .map(
                (letter, index) => `
              <div class="option-input-group">
                <span class="option-letter">${letter}</span>
                <input type="text" name="question_${questionCounter}_option_${index}" placeholder="Option ${letter}" required>
                <input type="radio" name="question_${questionCounter}_correct" value="${letter}" ${
                  index === 0 ? "checked" : ""
                } required>
                <label class="radio-label">Correct</label>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `
      break

    case "identification":
      questionHTML += `
        <div class="form-group">
          <label>Correct Answer</label>
          <input type="text" name="question_${questionCounter}_answer" placeholder="Enter the correct answer" required>
        </div>
      `
      break

    case "fill-blanks":
      questionHTML += `
        <div class="form-group">
          <label>Answer Key</label>
          <textarea name="question_${questionCounter}_answer" placeholder="Enter the correct answers (separate multiple answers with commas)" required></textarea>
          <small class="form-help">For multiple blanks, separate answers with commas (e.g., "answer1, answer2, answer3")</small>
        </div>
      `
      break

    case "essay":
      questionHTML += `
        <div class="form-group">
          <label>Grading Rubric (Optional)</label>
          <textarea name="question_${questionCounter}_rubric" placeholder="Enter grading criteria or key points to look for..."></textarea>
        </div>
      `
      break
  }

  questionHTML += `
      <div class="form-group">
        <label>Points</label>
        <input type="number" name="question_${questionCounter}_points" value="1" min="1" required>
      </div>
    </div>
  `

  questionDiv.innerHTML = questionHTML
  questionsContainer.appendChild(questionDiv)

  // Remove the "no questions" message if it exists
  const noQuestionsMessage = questionsContainer.querySelector(".no-questions-message")
  if (noQuestionsMessage) {
    noQuestionsMessage.remove()
  }

  // Scroll to the new question
  questionDiv.scrollIntoView({ behavior: "smooth", block: "center" })
}

function removeQuestion(questionId) {
  const questionDiv = document.querySelector(`[data-question-id="${questionId}"]`)
  if (questionDiv) {
    questionDiv.remove()
    updateQuestionNumbers()
    checkEmptyQuestions()
  }
}

function updateQuestionNumbers() {
  const questionItems = document.querySelectorAll(".question-item")
  questionItems.forEach((item, index) => {
    const questionNumber = item.querySelector(".question-number")
    if (questionNumber) {
      questionNumber.textContent = `Question ${index + 1}`
    }
  })
}

function checkEmptyQuestions() {
  const questionsContainer = document.getElementById("questions-container")
  if (questionsContainer.children.length === 0) {
    questionsContainer.innerHTML = `
      <div class="no-questions-message">
        <div class="no-questions-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h4>No Questions Added Yet</h4>
        <p>Upload materials for AI generation or click the buttons above to add questions manually</p>
      </div>
    `
  }
}

// AI Question Generation (Enhanced for editing)
function generateQuestions() {
  if (uploadedFiles.length !== 3) {
    alert("Please upload exactly 3 study materials first.")
    return
  }

  const aiPrompt = document.getElementById("ai-prompt").value.trim()
  if (!aiPrompt) {
    alert("Please provide AI generation instructions.")
    return
  }

  const questionCount = Number.parseInt(document.getElementById("question-count").value)
  const difficulty = document.getElementById("difficulty-level").value

  const generateBtn = document.querySelector(".btn-generate")
  const originalText = generateBtn.innerHTML
  generateBtn.innerHTML = `
    <svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Generating Questions...
  `
  generateBtn.disabled = true

  setTimeout(() => {
    generateBtn.innerHTML = originalText
    generateBtn.disabled = false

    alert("AI question generation will be implemented with your AI service integration.")
    console.log("[v0] AI generation placeholder - integrate with real AI service")
  }, 2000)
}

// Distribution Sliders
function initializeDistributionSliders() {
  const sliders = ["mc-percentage", "id-percentage", "fb-percentage", "essay-percentage"]

  sliders.forEach((sliderId) => {
    const slider = document.getElementById(sliderId)
    const display = slider.nextElementSibling

    slider.addEventListener("input", () => {
      display.textContent = slider.value + "%"
      normalizeDistribution(sliderId)
    })
  })
}

function normalizeDistribution(changedSliderId) {
  const sliders = {
    "mc-percentage": document.getElementById("mc-percentage"),
    "id-percentage": document.getElementById("id-percentage"),
    "fb-percentage": document.getElementById("fb-percentage"),
    "essay-percentage": document.getElementById("essay-percentage"),
  }

  const total = Object.values(sliders).reduce((sum, slider) => sum + Number.parseInt(slider.value), 0)

  if (total > 100) {
    const excess = total - 100
    const otherSliders = Object.entries(sliders).filter(([id]) => id !== changedSliderId)

    otherSliders.forEach(([id, slider]) => {
      const reduction = Math.min(Number.parseInt(slider.value), Math.ceil(excess / otherSliders.length))
      slider.value = Math.max(0, Number.parseInt(slider.value) - reduction)
      slider.nextElementSibling.textContent = slider.value + "%"
    })
  }
}

function getQuestionTypeLabel(type) {
  const labels = {
    "multiple-choice": "Multiple Choice",
    identification: "Identification",
    "fill-blanks": "Fill in Blanks",
    essay: "Essay",
  }
  return labels[type] || type
}

// Form Handling
function initializeForm() {
  const form = document.getElementById("create-exam-form")
  form.addEventListener("submit", handleFormSubmission)
}

function handleFormSubmission(e) {
  e.preventDefault()
  saveExamToDatabase()
}

async function saveExamToDatabase() {
  try {
    const examTitle = document.getElementById("exam-title").value.trim()
    const examSubject = document.getElementById("exam-subject").value.trim()
    const examInstructions = document.getElementById("exam-instructions").value.trim()
    const examDuration = document.getElementById("exam-duration").value
    const examCode = generateExamCode()

    const showTimer = document.getElementById("show-timer")?.checked || false
    const autoSubmit = document.getElementById("auto-submit")?.checked || false
    const shuffleQuestions = document.getElementById("shuffle-questions")?.checked || false

    console.log("[v0] Creating exam with instructor ID:", currentInstructor.id)
    console.log("[v0] Exam data:", { examTitle, examSubject, examDuration, examCode })

    const examData = {
      title: examTitle,
      description: examSubject,
      duration: examDuration,
      exam_code: examCode,
      instructions: examInstructions,
      show_timer: showTimer,
      auto_submit: autoSubmit,
      shuffle_questions: shuffleQuestions,
      instructor_id: currentInstructor.id, // Explicitly set instructor_id
      is_active: true, // Ensure exam is active by default
    }

    const questions = []
    const questionItems = document.querySelectorAll(".question-item")

    questionItems.forEach((questionDiv) => {
      const questionId = questionDiv.dataset.questionId
      const questionType = questionDiv.dataset.questionType
      const questionText = questionDiv.querySelector(`[name="question_${questionId}_text"]`)?.value

      if (!questionText) return

      const questionData = {
        question_text: questionText,
        question_type: questionType,
        points: Number.parseInt(questionDiv.querySelector(`[name="question_${questionId}_points"]`)?.value) || 1,
      }

      // Handle type-specific data
      if (questionType === "multiple-choice") {
        const options = []
        const correctAnswer = questionDiv.querySelector(`[name="question_${questionId}_correct"]:checked`)?.value

        for (let i = 0; i < 4; i++) {
          const optionText = questionDiv.querySelector(`[name="question_${questionId}_option_${i}"]`)?.value
          if (optionText) {
            options.push({
              option_letter: ["A", "B", "C", "D"][i],
              option_text: optionText,
              is_correct: ["A", "B", "C", "D"][i] === correctAnswer,
            })
          }
        }

        questionData.correct_answer = correctAnswer
        questionData.options = options
      } else if (questionType === "identification" || questionType === "fill-blanks") {
        questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_answer"]`)?.value
      } else if (questionType === "essay") {
        questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_rubric"]`)?.value || ""
      }

      questions.push(questionData)
    })

    const { data: examResult, error: examError } = await supabase
      .from("exams")
      .insert([
        {
          ...examData,
          total_questions: questions.length,
          total_points: questions.reduce((sum, q) => sum + q.points, 0),
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (examError) {
      console.error("[v0] Error creating exam:", examError)
      alert("Failed to create exam. Please try again.")
      return
    }

    console.log("[v0] Exam created successfully:", examResult)

    localStorage.removeItem("dashboardCache")
    localStorage.setItem("examCreated", "true")

    alert("Exam created successfully!")
    window.location.href = "instructor-dashboard.html"
  } catch (error) {
    console.error("Error creating exam:", error)
    alert("Failed to create exam. Please try again.")
  }
}

// Navigation Functions
function goBackToDashboard() {
  window.location.href = "instructor-dashboard.html"
}

// Utility Functions
function generateExamCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function showExamCreatedModal(title, code) {
  const modal = document.createElement("div")
  modal.className = "modal-overlay"
  modal.innerHTML = `
    <div class="modal-content success-modal">
      <div class="success-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2>Exam Created Successfully!</h2>
      <p>Your exam "<strong>${title}</strong>" has been created.</p>
      <div class="exam-code-display">
        <label>Exam Access Code:</label>
        <div class="code-value">${code}</div>
        <button type="button" onclick="copyToClipboard('${code}')" class="copy-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          Copy Code
        </button>
      </div>
      <p class="code-instruction">Share this code with students to access the exam.</p>
      <div class="modal-actions">
        <button type="button" onclick="goBackToDashboard()" class="btn-primary">Back to Dashboard</button>
        <button type="button" onclick="createAnotherExam()" class="btn-secondary">Create Another Exam</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  setTimeout(() => modal.classList.add("show"), 10)
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = document.querySelector(".copy-btn")
    const originalText = copyBtn.innerHTML
    copyBtn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Copied!
    `
    setTimeout(() => {
      copyBtn.innerHTML = originalText
    }, 2000)
  })
}

function createAnotherExam() {
  window.location.reload()
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Function to check for edit mode and load existing exam data
function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search)
  const isEditMode = urlParams.get("edit") === "true"

  if (isEditMode) {
    const editingExam = localStorage.getItem("editingExam")
    if (editingExam) {
      const examData = JSON.parse(editingExam)
      loadExamForEditing(examData)

      const pageTitle = document.querySelector("h1")
      if (pageTitle) {
        pageTitle.textContent = "Edit Exam"
      }

      const submitBtn = document.querySelector('button[onclick="createExam()"]')
      if (submitBtn) {
        submitBtn.textContent = "Complete Editing"
        submitBtn.setAttribute("onclick", "completeEditing()")
      }
    }
  }
}

// Function to load existing exam data into the form
function loadExamForEditing(examData) {
  console.log("[v0] Loading exam for editing:", examData)

  const titleField = document.getElementById("exam-title")
  const subjectField = document.getElementById("exam-subject")
  const durationField = document.getElementById("exam-duration")
  const instructionsField = document.getElementById("exam-instructions")
  const timeWarningField = document.getElementById("time-warning")
  const showTimerField = document.getElementById("show-timer")
  const autoSubmitField = document.getElementById("auto-submit")
  const shuffleQuestionsField = document.getElementById("shuffle-questions")

  if (titleField) titleField.value = examData.title || ""
  if (subjectField) subjectField.value = examData.subject || ""
  if (durationField) durationField.value = examData.duration || ""
  if (instructionsField) instructionsField.value = examData.instructions || ""
  if (timeWarningField) timeWarningField.value = examData.timeWarning || 5
  if (showTimerField) showTimerField.checked = examData.showTimer || false
  if (autoSubmitField) autoSubmitField.checked = examData.autoSubmit || false
  if (shuffleQuestionsField) shuffleQuestionsField.checked = examData.shuffleQuestions || false

  if (examData.questions && examData.questions.length > 0) {
    // Clear existing questions
    const questionsContainer = document.getElementById("questions-container")
    if (questionsContainer) {
      questionsContainer.innerHTML = ""
    }

    // Reset question counter
    questionCounter = 0

    // Add each existing question
    examData.questions.forEach((question) => {
      addExistingQuestion(question)
    })

    console.log("[v0] Loaded", examData.questions.length, "questions for editing")
  }
}

function addExistingQuestion(questionData) {
  questionCounter++
  const questionsContainer = document.getElementById("questions-container")

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-item"
  questionDiv.dataset.questionId = questionCounter
  questionDiv.dataset.questionType = questionData.type

  let typeSpecificHtml = ""

  // Generate type-specific HTML based on question type
  switch (questionData.type) {
    case "multiple-choice":
      typeSpecificHtml = `
        <div class="options-container">
          <h5>Answer Options:</h5>
          <div id="options-list-${questionCounter}">
            ${
              questionData.options
                ? questionData.options
                    .map(
                      (option, index) => `
              <div class="option-item">
                <input type="text" name="question_${questionCounter}_option_${index}" value="${option}" placeholder="Option ${index + 1}" required>
                <label>
                  <input type="radio" name="question_${questionCounter}_correct" value="${index}" ${questionData.correctAnswer === index ? "checked" : ""}>
                  Correct Answer
                </label>
                <button type="button" onclick="removeOption(${questionCounter}, ${index})">Remove</button>
              </div>
            `,
                    )
                    .join("")
                : ""
            }
          </div>
          <button type="button" onclick="addOption(${questionCounter})">Add Option</button>
        </div>
      `
      break

    case "identification":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Correct Answer:</label>
          <input type="text" name="question_${questionCounter}_answer" value="${questionData.correctAnswer || ""}" placeholder="Enter the correct answer" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive" ${questionData.caseSensitive ? "checked" : ""}>
            Case Sensitive
          </label>
        </div>
      `
      break

    case "fill-blanks":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Correct Answers (comma-separated):</label>
          <input type="text" name="question_${questionCounter}_answers" value="${questionData.correctAnswers ? questionData.correctAnswers.join(", ") : ""}" placeholder="answer1, answer2, answer3" required>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="question_${questionCounter}_case_sensitive" ${questionData.caseSensitive ? "checked" : ""}>
            Case Sensitive
          </label>
        </div>
      `
      break

    case "essay":
      typeSpecificHtml = `
        <div class="form-group">
          <label>Minimum Words:</label>
          <input type="number" name="question_${questionCounter}_min_words" value="${questionData.minWords || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Maximum Words:</label>
          <input type="number" name="question_${questionCounter}_max_words" value="${questionData.maxWords || 0}" min="0">
        </div>
        <div class="form-group">
          <label>Rubric/Grading Criteria:</label>
          <textarea name="question_${questionCounter}_rubric" placeholder="Enter grading criteria...">${questionData.rubric || ""}</textarea>
        </div>
      `
      break
  }

  questionDiv.innerHTML = `
    <div class="question-header">
      <h4>Question ${questionCounter}</h4>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeQuestion(${questionCounter})">Remove</button>
    </div>
    <div class="form-group">
      <label>Question Type:</label>
      <select name="question_${questionCounter}_type" onchange="updateQuestionType(${questionCounter})" required>
        <option value="multiple-choice" ${questionData.type === "multiple-choice" ? "selected" : ""}>Multiple Choice</option>
        <option value="identification" ${questionData.type === "identification" ? "selected" : ""}>Identification</option>
        <option value="fill-blanks" ${questionData.type === "fill-blanks" ? "selected" : ""}>Fill in Blanks</option>
        <option value="essay" ${questionData.type === "essay" ? "selected" : ""}>Essay</option>
      </select>
    </div>
    <div class="form-group">
      <label>Question Text:</label>
      <textarea name="question_${questionCounter}_text" placeholder="Enter your question here..." required>${questionData.text || ""}</textarea>
    </div>
    ${typeSpecificHtml}
    <div class="form-group">
      <label>Points:</label>
      <input type="number" name="question_${questionCounter}_points" value="${questionData.points || 1}" min="1" required>
    </div>
  `

  questionsContainer.appendChild(questionDiv)
}

// Function to update existing exam instead of creating new one
async function completeEditing() {
  console.log("[v0] completeEditing function called")

  const editingExam = localStorage.getItem("editingExam")
  if (!editingExam) {
    alert("Error: No exam data found for editing!")
    return
  }

  const originalExam = JSON.parse(editingExam)

  const examTitle = document.getElementById("exam-title").value.trim()
  const examSubject = document.getElementById("exam-subject").value.trim()
  const examInstructions = document.getElementById("exam-instructions").value.trim()
  const examDuration = document.getElementById("exam-duration").value
  const timeWarning = document.getElementById("time-warning").value || 5
  const showTimer = document.getElementById("show-timer").checked
  const autoSubmit = document.getElementById("auto-submit").checked
  const shuffleQuestions = document.getElementById("shuffle-questions").checked

  // Validate required fields
  if (!examTitle) {
    alert("Please enter an exam title.")
    document.getElementById("exam-title").focus()
    return
  }

  if (!examDuration || examDuration < 5) {
    alert("Please enter a valid exam duration (minimum 5 minutes).")
    document.getElementById("exam-duration").focus()
    return
  }

  // Collect questions data using same logic as createExam
  const questions = []
  const questionItems = document.querySelectorAll(".question-item")

  questionItems.forEach((questionDiv) => {
    const questionId = questionDiv.dataset.questionId
    const questionType = questionDiv.dataset.questionType
    const questionText = questionDiv.querySelector(`[name="question_${questionId}_text"]`)?.value

    if (!questionText) return

    const questionData = {
      question_text: questionText,
      question_type: questionType,
      points: Number.parseInt(questionDiv.querySelector(`[name="question_${questionId}_points"]`)?.value) || 1,
    }

    // Handle type-specific data
    if (questionType === "multiple-choice") {
      const options = []
      const correctAnswer = questionDiv.querySelector(`[name="question_${questionId}_correct"]:checked`)?.value

      for (let i = 0; i < 4; i++) {
        const optionText = questionDiv.querySelector(`[name="question_${questionId}_option_${i}"]`)?.value
        if (optionText) {
          options.push({
            option_letter: ["A", "B", "C", "D"][i],
            option_text: optionText,
            is_correct: ["A", "B", "C", "D"][i] === correctAnswer,
          })
        }
      }

      questionData.correct_answer = correctAnswer
      questionData.options = options
    } else if (questionType === "identification" || questionType === "fill-blanks") {
      questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_answer"]`)?.value
    } else if (questionType === "essay") {
      questionData.correct_answer = questionDiv.querySelector(`[name="question_${questionId}_rubric"]`)?.value || ""
    }

    questions.push(questionData)
  })

  // Validate exam has questions
  if (questions.length === 0) {
    alert("Please add at least one question to the exam.")
    return
  }

  try {
    // Update exam in database
    const { error: examError } = await supabase
      .from("exams")
      .update({
        title: examTitle,
        description: examSubject,
        duration: Number.parseInt(examDuration),
        instructions: examInstructions,
        total_questions: questions.length,
        total_points: questions.reduce((sum, q) => sum + q.points, 0),
        updated_at: new Date().toISOString(),
        show_timer: showTimer,
        auto_submit: autoSubmit,
        shuffle_questions: shuffleQuestions,
      })
      .eq("exam_code", originalExam.code)

    if (examError) {
      console.error("Error updating exam:", examError)
      alert("Failed to update exam. Please try again.")
      return
    }

    // Clear editing data
    localStorage.removeItem("editingExam")

    console.log("[v0] Exam updated successfully")
    alert(`Exam "${examTitle}" has been updated successfully!`)
    window.location.href = "instructor-dashboard.html"
  } catch (error) {
    console.error("Error updating exam:", error)
    alert("Failed to update exam. Please try again.")
  }
}

console.log("[v0] Create exam script loaded successfully")
