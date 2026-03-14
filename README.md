# Greenlight

> The definitive database for student and independent cinema. Showcase your work, build your filmography, and get discovered by the industry.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)

## Features

- **Project Management** - Create, edit, and publish film projects with rich media support
- **Credit System** - Manage cast and crew credits with verification workflows
- **Community Engagement** - Rate projects (0-10 scale) and post detailed comments
- **Discovery** - Find films through Trending, Top Rated, and New & Notable sections
- **User Profiles** - Build your filmography and showcase your work
- **Project Collaboration** - Manage team members and project access
- **Content Moderation** - Report and moderation tools for community safety

## Tech Stack

### Frontend

- **React 18** - UI library
- **Vite** - Lightning-fast build tool
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Supabase JS Client** - Backend integration

### Backend

- **Next.js 14** - React framework with API routes
- **Supabase** - PostgreSQL database & authentication
- **Row Level Security (RLS)** - Database-level access control
- **TypeScript** - Type-safe backend code
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** or **bun**
- **Supabase** account (free tier available)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/greenlight.git
cd greenlight
```

#### 2. Frontend Setup

```bash
cd frame-canvas
npm install
cp .env.example .env.local  # Create environment file
npm run dev
```

The frontend will be available at `http://localhost:8080`

#### 3. Backend Setup

```bash
cd frame-canvas/backend
npm install
cp .env.example .env.local  # Create environment file
npm run dev
```

The backend will be available at `http://localhost:3000`

### Environment Variables

Create `.env.local` in the `frame-canvas/backend` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

Apply migrations to set up the schema:

**Option A: Via Supabase Dashboard**

1. Open your Supabase project
2. Go to SQL Editor
3. Run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rpc_functions.sql`
   - `supabase/migrations/003_data_integrity_constraints.sql`

**Option B: Via Supabase CLI**

```bash
supabase db push
```

## Project Structure

```
greenlight/
├── frame-canvas/                 # Frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── auth/                 # Authentication context
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utilities and helpers
│   │   └── types/                # TypeScript types
│   ├── public/                   # Static assets
│   ├── vite.config.ts            # Vite configuration
│   └── tailwind.config.ts        # Tailwind CSS config
│
├── frame-canvas/backend/         # Backend API
│   ├── app/
│   │   └── api/
│   │       └── bmdb/             # API route handlers
│   ├── lib/
│   │   ├── supabase/             # Supabase client utilities
│   │   └── api-client.ts         # Type-safe API helpers
│   ├── supabase/
│   │   └── migrations/           # Database migrations
│   ├── types/                    # TypeScript definitions
│   └── next.config.js            # Next.js configuration
│
└── README.md                      # This file
```

## Available Scripts

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Backend

```bash
npm run dev       # Start Next.js dev server
npm run build     # Build for production
npm run start     # Start production server
npm run type-check # TypeScript type checking
```

## Authentication

Greenlight uses **Supabase Authentication** with Row Level Security (RLS):

- Users must authenticate to access protected endpoints
- RLS policies ensure users can only access their own data
- Auth tokens are validated via `auth.uid()` in database context
- Frontend sends auth tokens via `Authorization: Bearer` header

See [SETUP.md](./frame-canvas/backend/SETUP.md) for detailed authentication configuration.

## API Documentation

All API routes require authentication (except public discovery endpoints).

### Example API Requests

```bash
# Get public discover feed
curl http://localhost:3000/api/bmdb/discover

# Rate a project (requires auth)
curl -X POST http://localhost:3000/api/bmdb/projects/{projectId}/rate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 8}'

# Create a comment (requires auth)
curl -X POST http://localhost:3000/api/bmdb/projects/{projectId}/comments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Great film!", "rating": 9}'
```

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the project's code style
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code structure and naming conventions
- Write meaningful commit messages
- Test your changes before submitting a PR
- Update documentation as needed

## Bug Reports & Feature Requests

Found a bug or have a feature idea? Please open a GitHub issue with:

- Clear description of the issue/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Authors

- **Manik Singh** - Initial development

## Acknowledgments

- **shadcn/ui** for beautiful, accessible UI components
- **Supabase** for backend infrastructure
- **Vercel** for deployment and Next.js
- The student filmmaker community for inspiration

## Support

For questions or support:

- Review [SETUP.md](./frame-canvas/backend/SETUP.md) for configuration help

---

**Made for filmmakers, by filmmakers.**
