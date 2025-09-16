describe("ValidationUtils", () => {
  let ValidationUtils

  beforeAll(() => {
    ValidationUtils = {
      isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },

      isValidExamCode: (code) => {
        return code && code.trim().length >= 3
      },

      isValidName: (name) => {
        return name && name.trim().length >= 2
      },

      isValidStudentNumber: (number) => {
        return number && number.trim().length >= 3
      },

      sanitizeInput: (input) => {
        return input.trim().replace(/[<>]/g, "")
      },
    }
  })

  describe("isValidEmail", () => {
    test("should validate correct email addresses", () => {
      expect(ValidationUtils.isValidEmail("test@example.com")).toBe(true)
      expect(ValidationUtils.isValidEmail("user.name@domain.co.uk")).toBe(true)
      expect(ValidationUtils.isValidEmail("test123@test-domain.org")).toBe(true)
    })

    test("should reject invalid email addresses", () => {
      expect(ValidationUtils.isValidEmail("invalid-email")).toBe(false)
      expect(ValidationUtils.isValidEmail("test@")).toBe(false)
      expect(ValidationUtils.isValidEmail("@domain.com")).toBe(false)
      expect(ValidationUtils.isValidEmail("test@domain")).toBe(false)
      expect(ValidationUtils.isValidEmail("test space@domain.com")).toBe(false)
    })

    test("should handle edge cases", () => {
      expect(ValidationUtils.isValidEmail("")).toBe(false)
      expect(ValidationUtils.isValidEmail(null)).toBe(false)
      expect(ValidationUtils.isValidEmail(undefined)).toBe(false)
    })
  })

  describe("isValidExamCode", () => {
    test("should validate exam codes with 3 or more characters", () => {
      expect(ValidationUtils.isValidExamCode("ABC")).toBe(true)
      expect(ValidationUtils.isValidExamCode("EXAM123")).toBe(true)
      expect(ValidationUtils.isValidExamCode("   TEST   ")).toBe(true) // Should trim
    })

    test("should reject short or invalid exam codes", () => {
      expect(ValidationUtils.isValidExamCode("AB")).toBe(false)
      expect(ValidationUtils.isValidExamCode("A")).toBe(false)
      expect(ValidationUtils.isValidExamCode("")).toBe(false)
      expect(ValidationUtils.isValidExamCode("   ")).toBe(false)
      expect(ValidationUtils.isValidExamCode(null)).toBe(false)
      expect(ValidationUtils.isValidExamCode(undefined)).toBe(false)
    })
  })

  describe("isValidName", () => {
    test("should validate names with 2 or more characters", () => {
      expect(ValidationUtils.isValidName("John")).toBe(true)
      expect(ValidationUtils.isValidName("Al")).toBe(true)
      expect(ValidationUtils.isValidName("   Mary   ")).toBe(true) // Should trim
    })

    test("should reject short or invalid names", () => {
      expect(ValidationUtils.isValidName("A")).toBe(false)
      expect(ValidationUtils.isValidName("")).toBe(false)
      expect(ValidationUtils.isValidName("   ")).toBe(false)
      expect(ValidationUtils.isValidName(null)).toBe(false)
      expect(ValidationUtils.isValidName(undefined)).toBe(false)
    })
  })

  describe("isValidStudentNumber", () => {
    test("should validate student numbers with 3 or more characters", () => {
      expect(ValidationUtils.isValidStudentNumber("123")).toBe(true)
      expect(ValidationUtils.isValidStudentNumber("STU001")).toBe(true)
      expect(ValidationUtils.isValidStudentNumber("   2022001   ")).toBe(true)
    })

    test("should reject short or invalid student numbers", () => {
      expect(ValidationUtils.isValidStudentNumber("12")).toBe(false)
      expect(ValidationUtils.isValidStudentNumber("A")).toBe(false)
      expect(ValidationUtils.isValidStudentNumber("")).toBe(false)
      expect(ValidationUtils.isValidStudentNumber("   ")).toBe(false)
      expect(ValidationUtils.isValidStudentNumber(null)).toBe(false)
      expect(ValidationUtils.isValidStudentNumber(undefined)).toBe(false)
    })
  })

  describe("sanitizeInput", () => {
    test("should remove angle brackets and trim whitespace", () => {
      expect(ValidationUtils.sanitizeInput("  hello world  ")).toBe("hello world")
      expect(ValidationUtils.sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
      expect(ValidationUtils.sanitizeInput("  <div>content</div>  ")).toBe("divcontent/div")
    })

    test("should handle empty and special inputs", () => {
      expect(ValidationUtils.sanitizeInput("")).toBe("")
      expect(ValidationUtils.sanitizeInput("   ")).toBe("")
      expect(ValidationUtils.sanitizeInput("normal text")).toBe("normal text")
    })
  })
})
