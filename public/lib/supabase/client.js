// Supabase Client Configuration for IntegriTest System
// Browser-compatible version using environment variables

window.createSupabaseClient = () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Creating Supabase client with environment variables")
  console.log("[v0] SUPABASE_URL:", SUPABASE_URL ? "✓ Set" : "✗ Missing")
  console.log("[v0] SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing")

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[v0] Missing required environment variables for Supabase")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL)
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "Present" : "Missing")
    return null
  }

  try {
    if (
      typeof window.supabase === "undefined" ||
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      console.error("[v0] Supabase CDN not loaded properly. Make sure the script tag is included.")
      return null
    }

    // Create real Supabase client using CDN with environment variables
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log("[v0] ✅ Supabase client created successfully with environment variables")
    return supabaseClient
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    return null
  }
}

if (typeof window !== "undefined") {
  let initAttempts = 0
  const maxAttempts = 20 // Try for up to 10 seconds

  const initializeSupabase = () => {
    initAttempts++

    try {
      if (
        typeof window.supabase !== "undefined" &&
        window.supabase &&
        typeof window.supabase.createClient === "function"
      ) {
        const client = window.createSupabaseClient()
        if (client) {
          window.supabaseClient = client
          window.supabaseReady = true
          console.log("[v0] ✅ Supabase client initialized successfully after", initAttempts, "attempts")

          // Test the connection immediately
          testSupabaseConnection()

          // Dispatch custom event to notify other scripts
          window.dispatchEvent(new CustomEvent("supabaseReady"))
          return true
        } else {
          window.supabaseReady = false
          console.error("[v0] Failed to create Supabase client - check environment variables")
        }
      } else {
        if (initAttempts <= maxAttempts) {
          console.log(
            "[v0] Supabase CDN not yet available, retrying... (attempt",
            initAttempts + "/" + maxAttempts + ")",
          )
          window.supabaseReady = false
          // Retry after a short delay
          setTimeout(initializeSupabase, 500)
        } else {
          console.error("[v0] Supabase CDN failed to load after", maxAttempts, "attempts")
          window.supabaseReady = false
        }
      }
    } catch (error) {
      console.error("[v0] Error during Supabase initialization:", error)
      window.supabaseReady = false

      if (initAttempts <= maxAttempts) {
        setTimeout(initializeSupabase, 500)
      }
    }

    return false
  }

  async function testSupabaseConnection() {
    try {
      if (!window.supabaseClient) {
        console.error("[v0] No Supabase client available for testing")
        return false
      }

      console.log("[v0] Testing Supabase connection...")

      // Test basic connection by querying instructors table
      const { data, error } = await window.supabaseClient.from("instructors").select("id, username, full_name").limit(1)

      if (error) {
        console.error("[v0] Supabase connection test failed:", error)
        console.error("[v0] Error details:", error.message)
        return false
      }

      console.log("[v0] ✅ Supabase connection test successful!")
      console.log("[v0] Found instructors in database:", data?.length || 0)

      if (data && data.length > 0) {
        console.log("[v0] Sample instructor:", data[0])
      }

      return true
    } catch (error) {
      console.error("[v0] Connection test error:", error)
      return false
    }
  }

  // Initialize immediately if DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(initializeSupabase, 100)
    })
  } else {
    setTimeout(initializeSupabase, 100)
  }

  // Also try when window loads completely
  window.addEventListener("load", () => {
    if (!window.supabaseReady) {
      setTimeout(initializeSupabase, 200)
    }
  })
}
