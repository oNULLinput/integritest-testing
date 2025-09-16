# Environment Variable Configuration Guide

This guide explains how to properly configure environment variables for the IntegriTest system to connect to your Supabase database.

## Required Environment Variables

The following environment variables must be set in your Vercel project:

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

## Setting Up Environment Variables

### 1. In Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anonymous key

### 2. Finding Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**

## Build Process

The build process automatically injects environment variables into the client-side code:

1. **Development**: Uses fallback values from `env-config.js`
2. **Production**: Runs `build-env-injection.js` to generate production configuration

### Build Commands
\`\`\`bash
# Generate environment configuration only
npm run build:env

# Full build with environment injection
npm run build
\`\`\`

## Troubleshooting

### Common Issues

1. **"Configuration Error: Database environment variables are not properly configured"**
   - Check that environment variables are set in Vercel
   - Verify the variable names match exactly
   - Redeploy after adding environment variables

2. **"Missing required environment variables"**
   - Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Check for typos in variable names

3. **"Supabase connection test failed"**
   - Verify your Supabase project is active
   - Check that the URL and key are correct
   - Ensure your database tables exist

### Debugging

Enable debug logging by opening browser console and looking for `[v0]` prefixed messages:
- ✅ Green messages indicate success
- ❌ Red messages indicate errors
- ⚠️ Yellow messages indicate warnings

## Security Notes

- Never commit actual environment variables to version control
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Keep your Supabase service role key secure (not used in client-side code)

## Development vs Production

### Development
- Uses fallback values from `env-config.js`
- Shows warnings about using fallback configuration
- Allows testing without real environment variables

### Production
- Requires actual environment variables
- Build fails if required variables are missing
- Automatically injects real values at build time
