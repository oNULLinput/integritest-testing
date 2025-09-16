// Instructor Operations for IntegriTest System
// Handles all instructor-related database operations

window.instructorOperations = {
  async testSupabaseConnection() {
    try {
      console.log("[v0] Testing Supabase connection...")

      if (!window.supabaseClient) {
        console.error("[v0] Supabase client not initialized")
        return false
      }

      // Test basic connection by querying all instructors
      const { data, error } = await window.supabaseClient.from("instructors").select("*")

      if (error) {
        console.error("[v0] Supabase connection test failed:", error)
        return false
      }

      console.log("[v0] ✅ Supabase connection successful!")
      console.log("[v0] Found instructors in database:", data)
      return true
    } catch (error) {
      console.error("[v0] Connection test error:", error)
      return false
    }
  },

  async authenticateInstructor(username, password) {
    try {
      console.log("[v0] Authenticating instructor:", username)
      console.log("[v0] - Username:", username, "(length:", username.length, ")")
      console.log("[v0] - Password:", "****", "(length:", password.length, ")")
      console.log("[v0] - Username type:", typeof username)
      console.log("[v0] - Password type:", typeof password)
      console.log("[v0] - Username exact value:", JSON.stringify(username))
      console.log("[v0] - Password exact value:", JSON.stringify(password))

      console.log("[v0] Checking if instructorOperations is available:", typeof window.instructorOperations)
      console.log("[v0] Checking if Supabase client is available:", typeof window.supabaseClient)

      // Wait for Supabase client to be ready with improved logic
      let attempts = 0
      const maxWaitAttempts = 30 // Wait up to 15 seconds

      console.log("[v0] Starting authentication process...")

      while (!window.supabaseReady && attempts < maxWaitAttempts) {
        console.log(
          "[v0] Waiting for Supabase client to initialize... (attempt",
          attempts + 1,
          "/",
          maxWaitAttempts,
          ")",
        )
        await new Promise((resolve) => setTimeout(resolve, 500))
        attempts++
      }

      if (!window.supabaseClient || !window.supabaseReady) {
        console.error("[v0] Supabase client not initialized after waiting")
        throw new Error("Database connection not available. Please refresh the page and try again.")
      }

      console.log("[v0] Supabase client is ready, proceeding with authentication...")

      // Query the database for matching instructor
      const { data: instructor, error } = await window.supabaseClient
        .from("instructors")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .maybeSingle()

      if (error) {
        console.error("[v0] Authentication database error:", error)
        throw new Error("Database error occurred during login")
      }

      console.log("[v0] Authentication result:", instructor ? "SUCCESS" : "FAILED")

      if (instructor) {
        console.log("[v0] ✅ Authentication successful for:", instructor.username)
        // Don't return password in response
        const { password: _, ...instructorData } = instructor
        return instructorData
      }

      console.log("[v0] ❌ Authentication failed - no instructor returned")
      return null
    } catch (error) {
      console.error("[v0] Error authenticating instructor:", error)
      throw error
    }
  },

  // Create new instructor in Supabase database
  async createInstructorInDatabase(instructorData) {
    try {
      console.log("[v0] Creating instructor in Supabase:", instructorData.username)

      if (!window.supabaseClient) {
        throw new Error("Supabase client not available")
      }

      const { data: existingInstructor, error: checkError } = await window.supabaseClient
        .from("instructors")
        .select("username")
        .eq("username", instructorData.username)
        .single()

      if (existingInstructor) {
        throw new Error(`Username "${instructorData.username}" already exists`)
      }

      if (checkError && checkError.code !== "PGRST116") {
        console.error("[v0] Error checking existing instructor:", checkError)
        throw checkError
      }

      const instructor = {
        username: instructorData.username,
        password: instructorData.password, // In real app, this should be hashed
        full_name: instructorData.full_name,
        email: instructorData.email,
      }

      const { data, error } = await window.supabaseClient.from("instructors").insert([instructor]).select().single()

      if (error) {
        console.error("[v0] Error creating instructor in Supabase:", error)
        throw error
      }

      console.log("[v0] Instructor created successfully in Supabase:", data.username, "with ID:", data.id)
      // Return without password
      const { password: _, ...instructorResponse } = data
      return instructorResponse
    } catch (error) {
      console.error("[v0] Error creating instructor in database:", error)
      throw error
    }
  },

  // Create new instructor
  async createInstructor(instructorData) {
    try {
      console.log("[v0] Creating instructor:", instructorData.username)

      const instructor = {
        id: Date.now().toString(),
        username: instructorData.username,
        password: instructorData.password, // In real app, this should be hashed
        full_name: instructorData.full_name,
        email: instructorData.email,
        created_at: new Date().toISOString(),
      }

      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      instructors.push(instructor)
      localStorage.setItem("instructors", JSON.stringify(instructors))

      // Return without password
      const { password: _, ...instructorResponse } = instructor
      return instructorResponse
    } catch (error) {
      console.error("[v0] Error creating instructor:", error)
      throw error
    }
  },

  // Get instructor by ID
  async getInstructor(instructorId) {
    try {
      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      const instructor = instructors.find((i) => i.id === instructorId)

      if (instructor) {
        const { password: _, ...instructorData } = instructor
        return instructorData
      }

      return null
    } catch (error) {
      console.error("[v0] Error getting instructor:", error)
      return null
    }
  },

  // Update instructor
  async updateInstructor(instructorId, updateData) {
    try {
      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      const instructorIndex = instructors.findIndex((i) => i.id === instructorId)

      if (instructorIndex !== -1) {
        instructors[instructorIndex] = { ...instructors[instructorIndex], ...updateData }
        localStorage.setItem("instructors", JSON.stringify(instructors))

        const { password: _, ...instructorData } = instructors[instructorIndex]
        return instructorData
      }

      return null
    } catch (error) {
      console.error("[v0] Error updating instructor:", error)
      throw error
    }
  },

  // Delete instructor
  async deleteInstructor(instructorId) {
    try {
      const instructors = JSON.parse(localStorage.getItem("instructors") || "[]")
      const filteredInstructors = instructors.filter((i) => i.id !== instructorId)

      localStorage.setItem("instructors", JSON.stringify(filteredInstructors))
      return true
    } catch (error) {
      console.error("[v0] Error deleting instructor:", error)
      return false
    }
  },

  // Get instructor statistics
  async getInstructorStats(instructorId) {
    try {
      const exams = JSON.parse(localStorage.getItem("exams") || "[]")
      const sessions = JSON.parse(localStorage.getItem("examSessions") || "[]")

      const instructorExams = exams.filter((e) => e.instructor_id === instructorId)
      const examIds = instructorExams.map((e) => e.id)
      const instructorSessions = sessions.filter((s) => examIds.includes(s.exam_id))

      return {
        total_exams: instructorExams.length,
        active_exams: instructorExams.filter((e) => e.is_active).length,
        total_sessions: instructorSessions.length,
        completed_sessions: instructorSessions.filter((s) => s.status === "completed").length,
        active_sessions: instructorSessions.filter((s) => s.status === "active").length,
      }
    } catch (error) {
      console.error("[v0] Error getting instructor stats:", error)
      return {
        total_exams: 0,
        active_exams: 0,
        total_sessions: 0,
        completed_sessions: 0,
        active_sessions: 0,
      }
    }
  },
}

console.log("[v0] Instructor operations loaded successfully")
