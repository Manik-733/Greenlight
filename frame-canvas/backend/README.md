# BMDB Backend

Next.js backend for BMDB with Supabase integration. Provides API routes, RPC functions, and database schema for the BMDB platform.

## Features

- ✅ Complete database schema with RLS policies
- ✅ RPC functions for all business logic (credit workflows, moderation, etc.)
- ✅ API routes for ratings, comments, and discovery
- ✅ Type-safe TypeScript interfaces
- ✅ Server-side authentication and authorization

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase project (free tier works)
- Supabase CLI (optional, for local development)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the `backend` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these values from your Supabase project dashboard:
- Go to Project Settings → API
- Copy the Project URL and anon/public key
- Copy the service_role key (keep this secret!)

### 3. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rpc_functions.sql`

#### Option B: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 4. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/bmdb`

## API Endpoints

### Ratings

- `POST /api/bmdb/projects/:projectId/rate`
  - Body: `{ rating: number }` (0-10)
  - Returns: `{ id: string, rating: number }`

- `GET /api/bmdb/projects/:projectId/ratings-summary`
  - Returns: `{ avg: number | null, count: number, distribution: Record<number, number>, userRating: number | null }`

### Comments

- `POST /api/bmdb/projects/:projectId/comments`
  - Body: `{ body: string }` (3-1500 characters)
  - Returns: `{ id: string }`

- `GET /api/bmdb/projects/:projectId/comments?cursor=&limit=`
  - Returns: `{ comments: Comment[], nextCursor: string | null }`

- `PATCH /api/bmdb/comments/:commentId`
  - Body: `{ body: string }`
  - Returns: `{ success: boolean }`

- `DELETE /api/bmdb/comments/:commentId?reason=`
  - Returns: `{ success: boolean }`

### Discovery

- `GET /api/bmdb/discover`
  - Returns: `{ trending: ProjectCard[], topRated: ProjectCard[], newNotable: ProjectCard[], recent: ProjectCard[] }`

## Database Schema

### Core Tables

- `profiles` - User profiles (1:1 with auth.users)
- `projects` - Film projects
- `project_memberships` - Project ownership/admin roles
- `credits` - Credits for projects
- `credit_requests` - User requests for credits
- `credit_claim_requests` - Claims for unclaimed credits
- `credit_disputes` - Disputes over credits
- `reports` - User reports
- `notifications` - User notifications
- `audit_logs` - Audit trail
- `project_ratings` - User ratings (0-10)
- `project_comments` - User comments

### Views

- `project_rating_aggregates` - Aggregated rating statistics per project

## RPC Functions

All business logic is handled via Supabase RPC functions. See `supabase/migrations/002_rpc_functions.sql` for the complete list.

Key functions:
- `set_project_rating(project_id, rating)` - Rate a project
- `create_project_comment(project_id, body)` - Create a comment
- `edit_project_comment(comment_id, body)` - Edit own comment
- `remove_project_comment(comment_id, reason)` - Remove comment (self or admin)
- `approve_credit_request(request_id, message)` - Approve credit request
- `accept_credit(credit_id)` - Accept a tagged credit
- `publish_project(project_id)` - Publish a project
- `admin_ban_user(user_id, reason)` - Ban a user (admin only)

## Security

- All tables have Row Level Security (RLS) enabled
- RPC functions use `SECURITY DEFINER` to enforce permissions server-side
- Service role key is never exposed to the client
- All sensitive actions are logged in `audit_logs`

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
npm start
```

## Testing

API routes can be tested using tools like:
- Postman
- curl
- The frontend application

Example:

```bash
# Rate a project
curl -X POST http://localhost:3000/api/bmdb/projects/{projectId}/rate \
  -H "Content-Type: application/json" \
  -d '{"rating": 8}'

# Get discovery data
curl http://localhost:3000/api/bmdb/discover
```

## Project Structure

```
backend/
├── app/
│   └── api/
│       └── bmdb/          # API routes
├── lib/
│   ├── supabase/          # Supabase clients
│   └── api-client.ts      # Type-safe API client helpers
├── types/
│   ├── database.ts        # Database types
│   └── api.ts             # API types
├── supabase/
│   └── migrations/        # SQL migration files
└── README.md
```

## Troubleshooting

### RLS Policy Errors

If you're getting permission errors, check:
1. User is authenticated (has valid session)
2. RLS policies allow the operation
3. User has required permissions (project admin, platform admin, etc.)

### RPC Function Errors

RPC functions are secured with `SECURITY DEFINER` and check permissions internally. Common issues:
- User not authenticated
- Insufficient permissions
- Invalid input parameters

### Environment Variables

Make sure all required environment variables are set. The app will fail to start if Supabase credentials are missing.

## Next Steps

1. Implement additional API endpoints as needed
2. Add rate limiting for production
3. Set up error monitoring (Sentry, etc.)
4. Add comprehensive tests
5. Deploy to Vercel or similar platform

## License

MIT

