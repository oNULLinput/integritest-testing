// Supabase Client Configuration for IntegriTest System
// Using @supabase/ssr package for proper browser client

// Since this is a static HTML/JS setup, we'll simulate the createBrowserClient approach
// by using the Supabase CDN with proper environment variable handling

window.createSupabaseClient = () => {
  // Get environment variables from the global ENV object
  const SUPABASE_URL = window.ENV?.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Creating Supabase client...")
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

    // Create Supabase client using CDN with environment variables
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log("[v0] ✅ Supabase client created successfully")
    return supabaseClient
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    return null
  }
}

// Initialize Supabase client when DOM is ready
if (typeof window !== "undefined") {
  let initAttempts = 0
  const maxAttempts = 10

  const initializeSupabase = async () => {
    initAttempts++

    try {
      // Wait for environment variables to be loaded
      if (!window.ENV || !window.ENV.NEXT_PUBLIC_SUPABASE_URL) {
        if (initAttempts <= maxAttempts) {
          console.log("[v0] Waiting for environment variables... (attempt", initAttempts + "/" + maxAttempts + ")")
          setTimeout(initializeSupabase, 500)
          return
        } else {
          console.error("[v0] Environment variables not loaded after", maxAttempts, "attempts")
          return
        }
      }

      // Wait for Supabase CDN to be loaded
      if (
        typeof window.supabase === "undefined" ||
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
      ) {
        if (initAttempts <= maxAttempts) {
          console.log("[v0] Waiting for Supabase CDN... (attempt", initAttempts + "/" + maxAttempts + ")")
          setTimeout(initializeSupabase, 500)
          return
        } else {
          console.error("[v0] Supabase CDN failed to load after", maxAttempts, "attempts")
          return
        }
      }

      const client = window.createSupabaseClient()
      if (client) {
        window.supabaseClient = client
        window.supabaseReady = true
        console.log("[v0] ✅ Supabase client initialized successfully")

        // Test the connection
        await testSupabaseConnection()

        // Dispatch event to notify other scripts
        window.dispatchEvent(new CustomEvent("supabaseReady"))
      } else {
        window.supabaseReady = false
        console.error("[v0] Failed to create Supabase client")
      }
    } catch (error) {
      console.error("[v0] Error during Supabase initialization:", error)
      window.supabaseReady = false
    }
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

  // Initialize when DOM is ready
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
