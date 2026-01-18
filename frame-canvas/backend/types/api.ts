// API Response Types

export interface RatingsSummaryResponse {
  avg: number | null
  count: number
  distribution: Record<number, number>
  userRating: number | null
}

export interface Comment {
  id: string
  body: string
  status: 'VISIBLE' | 'REMOVED'
  created_at: string
  updated_at: string
  user_id: string
  profiles?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CommentsResponse {
  comments: Comment[]
  nextCursor: string | null
}

export interface ProjectCard {
  id: string
  title: string
  slug: string
  description: string | null
  poster_url: string | null
  project_type: 'SHORT' | 'FEATURE' | 'WEB_SERIES' | 'SCENE' | 'OTHER'
  published_at: string | null
  avg_rating: number | null
  rating_count: number
  comment_count: number
}

export interface DiscoverResponse {
  trending: ProjectCard[]
  topRated: ProjectCard[]
  newNotable: ProjectCard[]
  recent: ProjectCard[]
}

export interface RateProjectRequest {
  rating: number // 0-10
}

export interface CreateCommentRequest {
  body: string // 3-1500 characters
}

export interface EditCommentRequest {
  body: string // 3-1500 characters
}

export interface ApiError {
  error: string
  details?: unknown
}

