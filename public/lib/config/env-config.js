// Environment Configuration Injection for IntegriTest System
// This script injects environment variables into the browser context

;(() => {
  console.log("[v0] Loading environment configuration...")

  // Initialize environment variables object
  window.ENV = window.ENV || {}

  // These will be replaced by the build process or server-side injection
  window.ENV.NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"

  // For production deployment, these should be injected by the server
  // or build process using the actual environment variables

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
      console.warn("[v0] ⚠️ Using fallback environment variables - update for production")
    }
  }

  // Make environment variables available globally
  window.getEnvVar = (key) => window.ENV[key]

  // Validate required environment variables
  window.validateEnvVars = () => {
    const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    const missing = []

    required.forEach((key) => {
      if (!window.ENV[key] || window.ENV[key].trim() === "") {
        missing.push(key)
      }
    })

    if (missing.length > 0) {
      console.error("[v0] Missing environment variables:", missing)
      return false
    }

    console.log("[v0] ✅ All required environment variables are present")
    return true
  }

  console.log("[v0] Environment configuration loaded")
})()
