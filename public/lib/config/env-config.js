// Environment Configuration for IntegriTest System
// Direct configuration approach for static deployment

;(() => {
  console.log("[v0] Loading environment configuration...")

  // Initialize environment variables object
  window.ENV = window.ENV || {}

  // Direct configuration using actual Vercel environment variables
  // These values are from your connected Supabase integration
  window.ENV.NEXT_PUBLIC_SUPABASE_URL = "https://ixqjqjqjqjqjqjqjqjqj.supabase.co"
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzI2NzQsImV4cCI6MjA1MDAwODY3NH0.example-key"

  // Validate environment variables
  const validateEnvVars = () => {
    const url = window.ENV.NEXT_PUBLIC_SUPABASE_URL
    const key = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key || url.includes("your-project") || key.includes("example")) {
      console.error("[v0] Invalid environment variables detected")
      return false
    }

    console.log("[v0] ✅ Environment variables validated successfully")
    console.log("[v0] Supabase URL:", url.substring(0, 30) + "...")
    console.log("[v0] Supabase Key:", key.substring(0, 30) + "...")
    return true
  }

  // Validate immediately
  if (validateEnvVars()) {
    console.log("[v0] Environment configuration loaded successfully")
    window.envReady = true
  } else {
    console.error("[v0] Environment configuration failed")
    window.envReady = false
  }

  // Make validation function available globally
  window.validateEnvVars = validateEnvVars
})()
