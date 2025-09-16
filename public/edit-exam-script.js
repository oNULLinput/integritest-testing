// Edit exam state
let currentExam = null
let questionCount = 0

// DOM elements
const loadingMessage = document.getElementById("loading-message")
const editExamForm = document.getElementById("edit-exam-form")
const examTitleInput = document.getElementById("exam-title")
const examDurationInput = document.getElementById("exam-duration")
const questionsContainer = document.getElementById("questions-container")

// Initialize edit exam page
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initializeEditExam()
  }, 1000)
})

async function initializeEditExam() {
  // Get exam code from URL
  const urlParams = new URLSearchParams(window.location.search)
  const examCode = urlParams.get("examCode")

  console.log("[v0] Edit exam initialized with code:", examCode)

  if (!examCode) {
    alert("No exam code provided")
    window.close()
    return
  }

  if (!window.supabaseClient) {
    console.log("[v0] Waiting for Supabase client to load...")
    let retries = 0
    while (!window.supabaseClient && retries < 20) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      retries++
      console.log("[v0] Retry", retries, "- Supabase client available:", !!window.supabaseClient)
    }

    if (!window.supabaseClient) {
      loadingMessage.innerHTML = `
        <div style="text-align: center; color: #dc2626;">
          <p>Database connection failed. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `
      return
    }
  }

  try {
    await loadExamData(examCode)
  } catch (error) {
    console.error("[v0] Error initializing edit exam:", error)
    loadingMessage.innerHTML = `
      <div style="text-align: center; color: #dc2626;">
        <p>Error loading exam: ${error.message}</p>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      </div>
    `
  }
}

async function loadExamData(examCode) {
  try {
    console.log("[v0] Fetching exam data from database for code:", examCode)

    const { data: exam, error } = await window.supabaseClient
      .from("exams")
      .select("*")
      .eq("exam_code", examCode)
      .single()

    if (error) {
      console.error("[v0] Supabase error:", error)
      throw new Error("Failed to load exam data: " + error.message)
    }

    if (!exam) {
      throw new Error("Exam not found")
    }

    currentExam = exam
    console.log("[v0] Exam loaded successfully:", exam.title)
    console.log("[v0] Questions found:", exam.questions?.length || 0)

    if (examTitleInput) {
      examTitleInput.value = exam.title || ""
      console.log("[v0] Title populated:", exam.title)
    }

    if (examDurationInput) {
      examDurationInput.value = exam.duration || 60
      console.log("[v0] Duration populated:", exam.duration)
    }

    // Clear existing questions
    questionsContainer.innerHTML = ""
    questionCount = 0

    // Load questions
    if (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0) {
      console.log("[v0] Loading", exam.questions.length, "questions")
      exam.questions.forEach((question, index) => {
        addQuestion(question, index)
      })
    } else {
      console.log("[v0] No questions found, adding empty question")
      // Add one empty question if no questions exist
      addQuestion()
    }

    loadingMessage.style.display = "none"
    editExamForm.style.display = "block"
    editExamForm.style.opacity = "1"

    // Setup form submission
    editExamForm.removeEventListener("submit", handleFormSubmit)
    editExamForm.addEventListener("submit", handleFormSubmit)

    console.log("[v0] Edit form is now ready for editing")
    console.log("[v0] Form visible:", editExamForm.style.display)
    console.log("[v0] Questions container children:", questionsContainer.children.length)
  } catch (error) {
    console.error("[v0] Error loading exam data:", error)
    throw error
  }
}

function addQuestion(questionData = null, index = null) {
  questionCount++
  const questionIndex = index !== null ? index : questionCount - 1

  console.log("[v0] Adding question", questionIndex + 1, questionData ? "with data" : "empty")

  const questionDiv = document.createElement("div")
  questionDiv.className = "question-card"
  questionDiv.dataset.questionIndex = questionIndex

  questionDiv.innerHTML = `
    <div class="question-header">
      <h3 class="question-title">Question ${questionIndex + 1}</h3>
      <button type="button" class="btn btn-delete btn-sm" onclick="removeQuestion(${questionIndex})">
        <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
        Remove
      </button>
    </div>

    <div class="form-group">
      <label class="form-label">Question Text</label>
      <textarea class="form-input question-text" rows="3" required placeholder="Enter your question here...">${questionData?.question || ""}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Answer Options</label>
      <div class="options-container">
        ${["A", "B", "C", "D"]
          .map(
            (letter, optionIndex) => `
          <div class="option-group">
            <label class="option-label">
              <input type="radio" name="correct-answer-${questionIndex}" value="${letter}" 
                     ${questionData?.correctAnswer === letter ? "checked" : ""} required />
              <span class="option-letter">${letter}</span>
            </label>
            <input type="text" class="form-input option-text" placeholder="Option ${letter}" 
                   value="${questionData?.options?.[optionIndex] || ""}" required />
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `

  questionsContainer.appendChild(questionDiv)

  console.log("[v0] Question", questionIndex + 1, "added to container")
  console.log("[v0] Question data populated:", {
    question: questionData?.question || "empty",
    options: questionData?.options || "empty",
    correctAnswer: questionData?.correctAnswer || "none",
  })
}

function removeQuestion(questionIndex) {
  const questionCard = document.querySelector(`[data-question-index="${questionIndex}"]`)
  if (questionCard) {
    questionCard.remove()
    updateQuestionNumbers()
  }
}

function updateQuestionNumbers() {
  const questionCards = questionsContainer.querySelectorAll(".question-card")
  questionCards.forEach((card, index) => {
    card.dataset.questionIndex = index
    const title = card.querySelector(".question-title")
    if (title) {
      title.textContent = `Question ${index + 1}`
    }

    // Update radio button names
    const radioButtons = card.querySelectorAll('input[type="radio"]')
    radioButtons.forEach((radio) => {
      radio.name = `correct-answer-${index}`
    })
  })
}

async function handleFormSubmit(event) {
  event.preventDefault()

  console.log("[v0] Saving exam changes...")

  try {
    // Collect form data
    const title = examTitleInput.value.trim()
    const duration = Number.parseInt(examDurationInput.value)

    if (!title || !duration) {
      alert("Please fill in all required fields")
      return
    }

    // Collect questions
    const questions = []
    const questionCards = questionsContainer.querySelectorAll(".question-card")

    console.log("[v0] Processing", questionCards.length, "questions")

    for (let i = 0; i < questionCards.length; i++) {
      const card = questionCards[i]
      const questionText = card.querySelector(".question-text").value.trim()
      const options = Array.from(card.querySelectorAll(".option-text")).map((input) => input.value.trim())
      const correctAnswer = card.querySelector('input[type="radio"]:checked')?.value

      if (!questionText || options.some((opt) => !opt) || !correctAnswer) {
        alert(`Please complete all fields for Question ${i + 1}`)
        return
      }

      questions.push({
        question: questionText,
        options: options,
        correctAnswer: correctAnswer,
      })
    }

    if (questions.length === 0) {
      alert("Please add at least one question")
      return
    }

    console.log("[v0] Updating exam with", questions.length, "questions")

    // Update exam in database
    const { error } = await window.supabaseClient
      .from("exams")
      .update({
        title: title,
        duration: duration,
        questions: questions,
        updated_at: new Date().toISOString(),
      })
      .eq("exam_code", currentExam.exam_code)

    if (error) {
      console.error("[v0] Error updating exam:", error)
      alert("Failed to save changes: " + error.message)
      return
    }

    console.log("[v0] Exam updated successfully")
    alert("Exam updated successfully!")

    // Close window and refresh parent
    if (window.opener) {
      window.opener.location.reload()
    }
    window.close()
  } catch (error) {
    console.error("[v0] Error saving exam:", error)
    alert("An error occurred while saving: " + error.message)
  }
}

console.log("[v0] Edit exam script loaded successfully")
