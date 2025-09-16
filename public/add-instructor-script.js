// Add Instructor Script for IntegriTest System

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Add instructor page loaded")

  const form = document.getElementById("add-instructor-form")
  const messageContainer = document.getElementById("message-container")

  // Show message function
  function showMessage(message, type = "success") {
    messageContainer.innerHTML = `
            <div class="${type}-message">
                ${message}
            </div>
        `

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        messageContainer.innerHTML = ""
      }, 5000)
    }
  }

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const instructorData = {
      username: formData.get("username").trim(),
      password: formData.get("password").trim(),
      full_name: formData.get("full_name").trim(),
      email: formData.get("email").trim(),
    }

    // Basic validation
    if (!instructorData.username || !instructorData.password || !instructorData.full_name || !instructorData.email) {
      showMessage("Please fill in all required fields.", "error")
      return
    }

    if (instructorData.username.length < 3) {
      showMessage("Username must be at least 3 characters long.", "error")
      return
    }

    if (instructorData.password.length < 4) {
      showMessage("Password must be at least 4 characters long.", "error")
      return
    }

    try {
      console.log("[v0] Creating new instructor:", instructorData.username)

      // Wait for Supabase to be ready
      let attempts = 0
      while (!window.supabaseReady && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      if (!window.supabaseReady) {
        throw new Error("Database connection not available. Please refresh the page and try again.")
      }

      // Create instructor in database
      const newInstructor = await window.instructorOperations.createInstructorInDatabase(instructorData)

      console.log("[v0] Instructor created successfully:", newInstructor)

      showMessage(
        `Instructor "${instructorData.username}" created successfully! You can now use these credentials to login.`,
        "success",
      )

      // Clear form
      form.reset()
    } catch (error) {
      console.error("[v0] Error creating instructor:", error)

      if (error.message.includes("already exists")) {
        showMessage(
          `Username "${instructorData.username}" already exists. Please choose a different username.`,
          "error",
        )
      } else {
        showMessage(`Error creating instructor: ${error.message}`, "error")
      }
    }
  })
})
