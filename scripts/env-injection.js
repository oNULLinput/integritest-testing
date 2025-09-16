// Environment Variable Injection Script for Production Deployment
// This script injects actual Vercel environment variables into the client-side code

const fs = require("fs")
const path = require("path")

console.log("🔧 Injecting environment variables...")

// Read environment variables from Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables:")
  console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅" : "❌")
  console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "✅" : "❌")
  process.exit(1)
}

// Update index.html with actual environment variables
const indexPath = path.join(__dirname, "../public/index.html")
let indexContent = fs.readFileSync(indexPath, "utf8")

// Inject actual values into meta tags with placeholder patterns
indexContent = indexContent.replace(
  '<meta name="supabase-url" content="__SUPABASE_URL__" />',
  `<meta name="supabase-url" content="${supabaseUrl}" />`,
)

indexContent = indexContent.replace(
  '<meta name="supabase-anon-key" content="__SUPABASE_ANON_KEY__" />',
  `<meta name="supabase-anon-key" content="${supabaseKey}" />`,
)

// Write updated content back
fs.writeFileSync(indexPath, indexContent)

console.log("✅ Environment variables injected successfully")
console.log("📝 Updated files:")
console.log("  - public/index.html (meta tags updated)")
