// Environment Configuration for IntegriTest System
// Proper environment variable configuration without hardcoded values

;(() => {
  console.log("[v0] Loading environment configuration...")

  // Initialize environment variables object
  window.ENV = window.ENV || {}

  // Check if running in Vercel environment with injected variables
  if (typeof process !== "undefined" && process.env) {
    // Server-side or build-time environment
    window.ENV.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } else {
    // Client-side fallback - read from meta tags or injected script
    const urlMeta = document.querySelector('meta[name="supabase-url"]')
    const keyMeta = document.querySelector('meta[name="supabase-anon-key"]')

    window.ENV.NEXT_PUBLIC_SUPABASE_URL = urlMeta?.content || ""
    window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = keyMeta?.content || ""
  }

  // Validate environment variables
  const validateEnvVars = () => {
    const url = window.ENV.NEXT_PUBLIC_SUPABASE_URL
    const key = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key || url.includes("your-project") || key.includes("your-anon-key")) {
      console.error("[v0] ❌ Environment variables not properly configured")
      console.error("[v0] Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set")
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
