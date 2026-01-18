# BMDB Backend Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run database migrations:**
   - Option A: Via Supabase Dashboard SQL Editor
     - Run `supabase/migrations/001_initial_schema.sql`
     - Run `supabase/migrations/002_rpc_functions.sql`
   - Option B: Via Supabase CLI
     ```bash
     supabase db push
     ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Authentication Notes

The backend uses Supabase RLS (Row Level Security) which relies on `auth.uid()` in the database context. For API routes to work correctly:

1. **Frontend should send auth token:**
   - Include `Authorization: Bearer <access_token>` header
   - Or ensure cookies are properly forwarded

2. **Server client setup:**
   - The `createClientServer()` function creates a Supabase client
   - RPC functions automatically use `auth.uid()` from the session
   - Ensure the client has access to the user's session token

3. **For production:**
   - Consider using `@supabase/ssr` for better cookie handling
   - Or implement middleware to refresh tokens
   - The current implementation works but may need token refresh logic

## Testing API Routes

All API routes require authentication (except discovery which is public). Example:

```bash
# Get discovery (public)
curl http://localhost:3000/api/bmdb/discover

# Rate a project (requires auth)
curl -X POST http://localhost:3000/api/bmdb/projects/{projectId}/rate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 8}'
```

## Project Structure

- `app/api/bmdb/` - API route handlers
- `lib/supabase/` - Supabase client utilities
- `lib/api-client.ts` - Type-safe API client helpers
- `supabase/migrations/` - Database schema and RPC functions
- `types/` - TypeScript type definitions

