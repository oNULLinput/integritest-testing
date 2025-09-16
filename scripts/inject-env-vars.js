// Environment Variable Injection Script for Production Deployment
// This script reads actual Vercel environment variables and injects them into the client-side code

const fs = require("fs")
const path = require("path")

console.log("[v0] Starting environment variable injection...")

// Read environment variables from Vercel
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[v0] ❌ Missing required environment variables:")
  console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", !!SUPABASE_URL)
  console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!SUPABASE_ANON_KEY)
  process.exit(1)
}

const htmlPath = path.join(__dirname, "..", "public", "index.html")
let htmlContent = fs.readFileSync(htmlPath, "utf8")

// Replace placeholders in HTML
htmlContent = htmlContent.replace("__SUPABASE_URL__", SUPABASE_URL)
htmlContent = htmlContent.replace("__SUPABASE_ANON_KEY__", SUPABASE_ANON_KEY)

fs.writeFileSync(htmlPath, htmlContent)

const envConfigPath = path.join(__dirname, "..", "public", "lib", "config", "env-config.js")
let envConfigContent = fs.readFileSync(envConfigPath, "utf8")

// Replace the fallback values with actual environment variables
envConfigContent = envConfigContent.replace(/supabaseUrl = '[^']*'/, `supabaseUrl = '${SUPABASE_URL}'`)
envConfigContent = envConfigContent.replace(/supabaseKey = '[^']*'/, `supabaseKey = '${SUPABASE_ANON_KEY}'`)

fs.writeFileSync(envConfigPath, envConfigContent)

console.log("[v0] ✅ Environment variables injected successfully")
console.log("[v0] HTML file updated:", htmlPath)
console.log("[v0] Config file updated:", envConfigPath)
console.log("[v0] Supabase URL configured:", SUPABASE_URL.substring(0, 30) + "...")
