// Supabase Client Configuration for IntegriTest System
// Browser-compatible version using CDN

window.createSupabaseClient = () => {
  const SUPABASE_URL = "https://yuaizdcaseywadutnynd.supabase.co"
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YWl6ZGNhc2V5d2FkdXRueW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mjc3NjQsImV4cCI6MjA3MzAwMzc2NH0._5QqlBNVI5jYlwy7R_PljyXw6nHhjjUKv-7lbEPwIco"

  try {
    if (
      typeof window.supabase === "undefined" ||
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      console.error("[v0] Supabase CDN not loaded properly. Make sure the script tag is included.")
      return null
    }

    // Create real Supabase client using CDN
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log("[v0] Real Supabase client created with URL:", SUPABASE_URL)
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
          console.log("[v0] Supabase client initialized successfully after", initAttempts, "attempts")

          // Dispatch custom event to notify other scripts
          window.dispatchEvent(new CustomEvent("supabaseReady"))
          return true
        } else {
          window.supabaseReady = false
          console.error("[v0] Failed to create Supabase client")
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
