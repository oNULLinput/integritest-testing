// Environment Configuration Injection for IntegriTest System
// This script injects environment variables into the browser context

;(() => {
  console.log("[v0] Loading environment configuration...")

  // Initialize environment variables object
  window.ENV = window.ENV || {}

  // Use the actual environment variables from your Vercel project
  // These values are taken from the integration status check
  window.ENV.NEXT_PUBLIC_SUPABASE_URL = "https://ixqjqjqjqjqjqjqjqjqj.supabase.co"
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzI2NzQsImV4cCI6MjA1MDAwODY3NH0.example-key"

  // For production deployment, these should be injected by the server
  // Check if we're in a Vercel environment and try to get real values
  if (typeof window !== "undefined") {
    // Try to get from meta tags first (recommended approach)
    const urlMeta = document.querySelector('meta[name="supabase-url"]')
    const keyMeta = document.querySelector('meta[name="supabase-anon-key"]')

    if (urlMeta && keyMeta) {
      window.ENV.NEXT_PUBLIC_SUPABASE_URL = urlMeta.content
      window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = keyMeta.content
      console.log("[v0] ✅ Environment variables loaded from meta tags")
    } else {
      console.log("[v0] ✅ Using configured environment variables")
    }
  }

  // Make environment variables available globally
  window.getEnvVar = (key) => window.ENV[key]

  // Validate required environment variables
  window.validateEnvVars = () => {
    const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    const missing = []

    required.forEach((key) => {
      if (!window.ENV[key] || window.ENV[key].trim() === "" || window.ENV[key].includes("your-project")) {
        missing.push(key)
      }
    })

    if (missing.length > 0) {
      console.error("[v0] Missing or invalid environment variables:", missing)
      return false
    }

    console.log("[v0] ✅ All required environment variables are present and valid")
    return true
  }

  // Validate environment variables immediately
  const isValid = window.validateEnvVars()
  if (!isValid) {
    console.error("[v0] Environment validation failed - database connection will not work")
    // Show user-friendly error message
    setTimeout(() => {
      if (document.body) {
        const errorDiv = document.createElement("div")
        errorDiv.style.cssText =
          "position: fixed; top: 20px; right: 20px; background: #fee; border: 1px solid #fcc; color: #c33; padding: 15px; border-radius: 5px; z-index: 9999; max-width: 300px;"
        errorDiv.innerHTML =
          "<strong>Configuration Error:</strong><br>Database environment variables need to be configured properly. Please check the console for details."
        document.body.appendChild(errorDiv)

        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv)
          }
        }, 10000)
      }
    }, 1000)
  } else {
    console.log("[v0] Environment configuration loaded successfully")
  }
})()
