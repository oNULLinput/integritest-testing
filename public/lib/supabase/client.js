// Supabase Client Configuration for IntegriTest System
// Using CDN approach with proper environment variable handling

window.createSupabaseClient = () => {
  console.log("[v0] Creating Supabase client...")

  // Wait for environment variables to be loaded
  if (!window.ENV || !window.envReady) {
    console.error("[v0] Environment variables not ready")
    return null
  }

  const SUPABASE_URL = window.ENV.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[v0] Missing Supabase credentials")
    return null
  }

  try {
    // Check if Supabase CDN is loaded
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
      console.error("[v0] Supabase CDN not loaded. Make sure the script tag is included.")
      return null
    }

    // Create Supabase client
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log("[v0] ✅ Supabase client created successfully")
    return client
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    return null
  }
}

// Initialize Supabase client when ready
const initializeSupabase = async () => {
  try {
    // Wait for environment and Supabase CDN to be ready
    if (!window.envReady || typeof window.supabase === "undefined") {
      setTimeout(initializeSupabase, 100)
      return
    }

    const client = window.createSupabaseClient()
    if (client) {
      window.supabaseClient = client
      window.supabaseReady = true
      console.log("[v0] ✅ Supabase initialized successfully")

      // Test connection
      await testConnection()

      // Notify other scripts
      window.dispatchEvent(new CustomEvent("supabaseReady"))
    }
  } catch (error) {
    console.error("[v0] Supabase initialization error:", error)
    window.supabaseReady = false
  }
}

// Test database connection
async function testConnection() {
  try {
    console.log("[v0] Testing database connection...")
    const { data, error } = await window.supabaseClient.from("instructors").select("id, username, full_name").limit(1)

    if (error) {
      console.error("[v0] Database connection test failed:", error.message)
      return false
    }

    console.log("[v0] ✅ Database connection successful!")
    console.log("[v0] Found instructors:", data?.length || 0)
    return true
  } catch (error) {
    console.error("[v0] Connection test error:", error)
    return false
  }
}

// Start initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSupabase)
} else {
  initializeSupabase()
}
