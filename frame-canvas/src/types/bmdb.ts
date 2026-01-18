// BMDB Type Definitions

export type CreditStatus = 
  | 'VERIFIED' 
  | 'PENDING_ACCEPTANCE' 
  | 'UNCLAIMED' 
  | 'REJECTED' 
  | 'DISPUTED' 
  | 'REMOVED';

export type ProjectType = 
  | 'SHORT_FILM' 
  | 'FEATURE' 
  | 'DOCUMENTARY' 
  | 'MUSIC_VIDEO' 
  | 'COMMERCIAL' 
  | 'WEB_SERIES' 
  | 'STUDENT_FILM' 
  | 'EXPERIMENTAL';

export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
  imdbUrl?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  synopsis?: string;
  posterUrl?: string;
  backdropUrl?: string;
  videoUrl?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  year?: number;
  runtime?: number; // in minutes
  organization?: string;
  location?: string;
  genres?: string[];
  ownerId: string;
  owner?: User;
  averageRating?: number;
  ratingCount?: number;
  createdAt: string;
  publishedAt?: string;
}

export interface Credit {
  id: string;
  projectId: string;
  userId?: string;
  user?: User;
  role: string; // e.g., "Director", "Lead Actor", "Cinematographer"
  characterName?: string; // For cast roles
  department: 'CAST' | 'CREW';
  status: CreditStatus;
  order?: number;
  createdAt: string;
}

export interface Rating {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  score: number; // 0-10
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  projectId: string;
  averageRating: number;
  ratingCount: number;
  distribution?: Record<number, number>; // e.g., { 10: 5, 9: 12, 8: 20, ... }
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'CREDIT_REQUEST' | 'CREDIT_ACCEPTED' | 'CREDIT_REJECTED' | 'COMMENT' | 'RATING';
  title: string;
  message: string;
  read: boolean;
  projectId?: string;
  createdAt: string;
}

// Discovery section types
export interface DiscoverySection {
  id: string;
  title: string;
  subtitle?: string;
  projects: Project[];
}

export interface DiscoverFilters {
  projectType?: ProjectType;
  year?: number;
  organization?: string;
  location?: string;
  genre?: string;
  sortBy?: 'trending' | 'top_rated' | 'newest' | 'most_reviewed';
}
