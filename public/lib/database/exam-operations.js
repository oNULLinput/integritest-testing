window.examOperations = {
  // Create a new exam
  async createExam(examData) {
    try {
      console.log("[v0] Creating exam:", examData.title)

      const supabase = window.createSupabaseClient()

      // Generate unique 6-digit code
      let examCode
      let isUnique = false
      let attempts = 0

      while (!isUnique && attempts < 10) {
        examCode = Math.random().toString(36).substring(2, 8).toUpperCase()

        // Check if code already exists
        const { data: existingExam } = await supabase
          .from("exams")
          .select("exam_code")
          .eq("exam_code", examCode)
          .single()

        if (!existingExam) {
          isUnique = true
        }
        attempts++
      }

      if (!isUnique) {
        throw new Error("Failed to generate unique exam code")
      }

      const exam = {
        title: examData.title,
        description: examData.description,
        duration: examData.duration,
        exam_code: examCode,
        questions: examData.questions || [],
        is_active: true,
        instructor_id: examData.instructor_id,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("exams").insert([exam]).select().single()

      if (error) {
        console.error("[v0] Supabase error creating exam:", error)
        throw error
      }

      console.log("[v0] Exam created successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Error creating exam:", error)
      throw error
    }
  },

  // Get exam by code
  async getExamByCode(examCode) {
    try {
      console.log("[v0] Getting exam by code:", examCode)

      const supabase = window.createSupabaseClient()

      const { data: allExamsCheck, error: allExamsError } = await supabase
        .from("exams")
        .select("exam_code, title, is_active")
        .limit(10)

      if (allExamsError) {
        console.error("[v0] Error checking all exams:", allExamsError)
      } else {
        console.log("[v0] Available exams in database:", allExamsCheck)
      }

      const { data: exactMatch, error: exactError } = await supabase.from("exams").select("*").eq("exam_code", examCode)

      if (exactError) {
        console.error("[v0] Supabase error in exact search:", exactError)
        throw new Error(`Database error: ${exactError.message}`)
      }

      console.log("[v0] Exact match results for code", examCode, ":", exactMatch)

      if (!exactMatch || exactMatch.length === 0) {
        console.log("[v0] No exact match found, trying case-insensitive search")

        const { data: caseInsensitiveMatch, error: caseError } = await supabase
          .from("exams")
          .select("*")
          .ilike("exam_code", examCode)

        if (caseError) {
          console.error("[v0] Supabase error in case-insensitive search:", caseError)
        } else {
          console.log("[v0] Case-insensitive results:", caseInsensitiveMatch)

          if (caseInsensitiveMatch && caseInsensitiveMatch.length > 0) {
            const exam = caseInsensitiveMatch[0]
            console.log("[v0] Found exam with case-insensitive match:", exam.exam_code)

            if (!exam.is_active) {
              throw new Error("This exam is currently inactive. Please contact your instructor.")
            }

            return exam
          }
        }
      } else {
        const exam = exactMatch[0]
        console.log("[v0] Found exam with exact match:", exam.exam_code)

        if (!exam.is_active) {
          throw new Error("This exam is currently inactive. Please contact your instructor.")
        }

        return exam
      }

      console.log("[v0] No exam found with code:", examCode)
      console.log("[v0] Available exam codes:", allExamsCheck?.map((e) => e.exam_code) || [])

      throw new Error(
        `Exam code "${examCode}" not found. Available codes: ${allExamsCheck?.map((e) => e.exam_code).join(", ") || "None"}. Please verify the code with your instructor.`,
      )
    } catch (error) {
      console.error("[v0] Error getting exam by code:", error)
      throw error
    }
  },

  // Create exam session
  async createExamSession(examId, studentInfo) {
    try {
      console.log("[v0] Creating exam session for exam:", examId)

      if (!examId) {
        throw new Error("Exam ID is required to create session")
      }

      if (!studentInfo || !studentInfo.fullName || !studentInfo.studentNumber) {
        throw new Error("Complete student information is required")
      }

      const supabase = window.createSupabaseClient()

      const session = {
        exam_id: examId,
        student_name: studentInfo.fullName,
        student_number: studentInfo.studentNumber,
        start_time: new Date().toISOString(),
        status: "active",
        violations: [],
        answers: {},
      }

      const { data, error } = await supabase.from("exam_sessions").insert([session]).select().single()

      if (error) {
        console.error("[v0] Supabase error creating session:", error)
        throw new Error(`Failed to create exam session: ${error.message}`)
      }

      if (!data || !data.id) {
        throw new Error("Invalid session data returned from database")
      }

      localStorage.setItem("currentSession", JSON.stringify(data))
      console.log("[v0] Exam session created successfully:", data.id)
      return data
    } catch (error) {
      console.error("[v0] Error creating exam session:", error)
      throw error
    }
  },

  // Submit exam answers
  async submitExam(sessionId, answers) {
    try {
      console.log("[v0] Submitting exam for session:", sessionId)

      const supabase = window.createSupabaseClient()

      const { data, error } = await supabase
        .from("exam_sessions")
        .update({
          answers: answers,
          end_time: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", sessionId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Supabase error submitting exam:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Error submitting exam:", error)
      throw error
    }
  },

  // Get all exams for instructor
  async getInstructorExams(instructorId) {
    try {
      const supabase = window.createSupabaseClient()

      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Supabase error getting instructor exams:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Error getting instructor exams:", error)
      return []
    }
  },

  // Record violation
  async recordViolation(sessionId, violationType, details) {
    try {
      console.log("[v0] Recording violation:", violationType)

      const supabase = window.createSupabaseClient()

      // Get current session
      const { data: session, error: getError } = await supabase
        .from("exam_sessions")
        .select("violations")
        .eq("id", sessionId)
        .single()

      if (getError) {
        console.error("[v0] Error getting session for violation:", getError)
        return false
      }

      const violations = session.violations || []
      violations.push({
        type: violationType,
        details: details,
        timestamp: new Date().toISOString(),
      })

      const { error: updateError } = await supabase
        .from("exam_sessions")
        .update({ violations: violations })
        .eq("id", sessionId)

      if (updateError) {
        console.error("[v0] Error updating violations:", updateError)
        return false
      }

      return true
    } catch (error) {
      console.error("[v0] Error recording violation:", error)
      return false
    }
  },
}

console.log("[v0] Exam operations loaded with Supabase integration")
