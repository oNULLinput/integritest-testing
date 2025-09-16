// Database Connection Test Script
// Tests the Supabase connection and verifies instructor data

const { createClient } = require("@supabase/supabase-js")

async function testDatabaseConnection() {
  console.log("[v0] Testing database connection...")

  // Get environment variables
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[v0] ❌ Missing environment variables:")
    console.error("[v0] SUPABASE_URL:", !!SUPABASE_URL)
    console.error("[v0] SUPABASE_ANON_KEY:", !!SUPABASE_ANON_KEY)
    process.exit(1)
  }

  console.log("[v0] Environment variables found:")
  console.log("[v0] SUPABASE_URL:", SUPABASE_URL.substring(0, 30) + "...")
  console.log("[v0] SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY.substring(0, 30) + "...")

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log("[v0] ✅ Supabase client created successfully")

    // Test basic connection
    console.log("[v0] Testing basic connection...")
    const { data: connectionTest, error: connectionError } = await supabase
      .from("instructors")
      .select("count", { count: "exact", head: true })

    if (connectionError) {
      console.error("[v0] ❌ Connection test failed:", connectionError.message)
      process.exit(1)
    }

    console.log("[v0] ✅ Database connection successful!")

    // Test instructor data
    console.log("[v0] Fetching instructor data...")
    const { data: instructors, error: instructorError } = await supabase
      .from("instructors")
      .select("id, username, full_name, email")

    if (instructorError) {
      console.error("[v0] ❌ Error fetching instructors:", instructorError.message)
      process.exit(1)
    }

    console.log("[v0] ✅ Found", instructors.length, "instructors in database:")
    instructors.forEach((instructor) => {
      console.log(`[v0]   - ID: ${instructor.id}, Username: ${instructor.username}, Name: ${instructor.full_name}`)
    })

    // Test specific login credentials
    console.log("[v0] Testing login credentials...")
    const testCredentials = [
      { username: "test", password: "test" },
      { username: "test1", password: "test" },
      { username: "admin", password: "password" },
    ]

    for (const cred of testCredentials) {
      const { data: loginTest, error: loginError } = await supabase
        .from("instructors")
        .select("id, username, full_name")
        .eq("username", cred.username)
        .eq("password", cred.password)
        .maybeSingle()

      if (loginError) {
        console.error(`[v0] ❌ Login test error for ${cred.username}:`, loginError.message)
      } else if (loginTest) {
        console.log(`[v0] ✅ Login test successful for ${cred.username} (${loginTest.full_name})`)
      } else {
        console.log(`[v0] ⚠️  Login test failed for ${cred.username} - credentials not found`)
      }
    }

    console.log("[v0] ✅ Database connection test completed successfully!")
  } catch (error) {
    console.error("[v0] ❌ Database connection test failed:", error.message)
    process.exit(1)
  }
}

testDatabaseConnection()
