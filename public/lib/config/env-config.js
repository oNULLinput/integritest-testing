// Environment Configuration for IntegriTest System
// Direct configuration with runtime environment detection

;(() => {
  console.log("[v0] Loading environment configuration...")

  window.ENV = {}

  // Try to get from meta tags first (injected by build process)
  const getFromMeta = (name) => {
    const meta = document.querySelector(`meta[name="${name}"]`)
    return meta && meta.content && !meta.content.includes("__") ? meta.content : null
  }

  // Get environment variables
  let supabaseUrl = getFromMeta("supabase-url")
  let supabaseKey = getFromMeta("supabase-anon-key")

  if (!supabaseUrl || !supabaseKey) {
    console.log("[v0] Using direct environment values...")
    // These should be replaced by the build script with actual values
    supabaseUrl = "https://ixqjqvqkqwjxqvqkqwjx.supabase.co"
    supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxdnFrcXdqeHF2cWtxd2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MzI2NzQsImV4cCI6MjA1MDAwODY3NH0.example"
  }

  window.ENV.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
  window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseKey

  // Validate environment variables
  const validateEnvVars = () => {
    const url = window.ENV.NEXT_PUBLIC_SUPABASE_URL
    const key = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.error("[v0] ❌ Environment variables missing")
      return false
    }

    console.log("[v0] ✅ Environment variables loaded")
    console.log("[v0] Supabase URL:", url.substring(0, 30) + "...")
    console.log("[v0] Supabase Key:", key.substring(0, 30) + "...")
    return true
  }

  if (validateEnvVars()) {
    console.log("[v0] Environment configuration ready")
    window.envReady = true

    // Notify other scripts immediately
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("envReady"))
    }, 50)
  } else {
    console.error("[v0] Environment configuration failed")
    window.envReady = false
  }

  window.validateEnvVars = validateEnvVars
})()
