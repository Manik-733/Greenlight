# BMDB - The Database for Student & Independent Filmmakers

BMDB is the definitive database for student and independent cinema. Showcase your work, build your filmography, and get discovered by the industry.

## Project Overview

BMDB consists of:
- **Frontend**: React + Vite + TypeScript + shadcn/ui (this directory)
- **Backend**: Next.js + Supabase (see `/backend` directory)

## Features

- Project management and publishing
- Credit system with verification workflows
- Community ratings (0-10 scale) and comments
- Discovery features (Trending, Top Rated, New & Notable)
- User profiles and filmography
- Project membership and admin controls
- Reporting and moderation tools

## Tech Stack

### Frontend
- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router

### Backend
- Next.js (App Router)
- Supabase (PostgreSQL, Auth, Storage)
- Row Level Security (RLS)
- Edge Functions / RPC

## Getting Started

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Setup

See the [backend README](./backend/README.md) for detailed setup instructions.

## Project Structure

```
BMDB/
├── backend/          # Next.js backend with Supabase integration
├── public/           # Static assets
├── src/              # Frontend React source code
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── lib/          # Utilities and helpers
│   └── types/        # TypeScript type definitions
└── package.json
```

## Environment Variables

### Frontend
Create a `.env` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend
See backend documentation for required environment variables.

## Contributing

1. Follow TypeScript best practices
2. Use ESLint for code quality
3. Write clear commit messages
4. Test thoroughly before submitting PRs

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
