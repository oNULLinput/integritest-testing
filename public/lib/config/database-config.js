// Database Configuration Module for IntegriTest System
// Centralized configuration management for all database connections

window.DatabaseConfig = {
  // Environment variable validation
  validateEnvironmentVariables() {
    // Get environment variables from window object (injected by build process)
    const requiredVars = {
      SUPABASE_URL: window.ENV?.NEXT_PUBLIC_SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    if (!requiredVars.SUPABASE_URL || !requiredVars.SUPABASE_ANON_KEY) {
      console.warn("[v0] Environment variables not found, checking for fallback configuration...")

      // Try to get from meta tags or script tags
      const urlMeta = document.querySelector('meta[name="supabase-url"]')
      const keyMeta = document.querySelector('meta[name="supabase-anon-key"]')

      if (urlMeta && keyMeta) {
        requiredVars.SUPABASE_URL = urlMeta.content
        requiredVars.SUPABASE_ANON_KEY = keyMeta.content
      }
    }

    const missing = []
    const present = []

    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value || value.trim() === "") {
        missing.push(key)
      } else {
        present.push(key)
      }
    }

    console.log("[v0] Environment Variables Status:")
    present.forEach((key) => console.log(`[v0] ✅ ${key}: Present`))
    missing.forEach((key) => console.log(`[v0] ❌ ${key}: Missing`))

    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables: ${missing.join(", ")}`
      console.error(`[v0] ${errorMsg}`)
      throw new Error(errorMsg)
    }

    return {
      supabaseUrl: requiredVars.SUPABASE_URL,
      supabaseAnonKey: requiredVars.SUPABASE_ANON_KEY,
    }
  },

  // Get database configuration
  getDatabaseConfig() {
    try {
      return this.validateEnvironmentVariables()
    } catch (error) {
      console.error("[v0] Database configuration error:", error)
      throw error
    }
  },

  // Check if all required environment variables are present
  isConfigurationValid() {
    try {
      this.validateEnvironmentVariables()
      return true
    } catch (error) {
      return false
    }
  },

  // Get connection status
  getConnectionStatus() {
    return {
      configValid: this.isConfigurationValid(),
      supabaseReady: window.supabaseReady || false,
      clientAvailable: !!window.supabaseClient,
    }
  },
}(
  // Inject environment variables into window object
  () => {
    // This will be populated by the build process or server
    window.ENV = window.ENV || {}

    // For development, you can set these directly:
    if (!window.ENV.NEXT_PUBLIC_SUPABASE_URL) {
      // These should be replaced with actual environment variables in production
      console.log("[v0] Loading environment variables from available sources...")
    }
  },
)()

// Initialize configuration check on load
document.addEventListener("DOMContentLoaded", () => {
  try {
    const config = window.DatabaseConfig.getDatabaseConfig()
    console.log("[v0] ✅ Database configuration validated successfully")
    console.log("[v0] Using Supabase URL:", config.supabaseUrl.substring(0, 30) + "...")
  } catch (error) {
    console.error("[v0] ❌ Database configuration validation failed:", error.message)

    // Show user-friendly error message
    const errorDiv = document.createElement("div")
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 90%;
      text-align: center;
    `
    errorDiv.innerHTML = `
      <strong>Configuration Error:</strong><br>
      Database environment variables are not properly configured.<br>
      Please contact your system administrator.
    `
    document.body.appendChild(errorDiv)

    // Auto-remove after 10 seconds
    setTimeout(() => errorDiv.remove(), 10000)
  }
})

console.log("[v0] Database configuration module loaded")
