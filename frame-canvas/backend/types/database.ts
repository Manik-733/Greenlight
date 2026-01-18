export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectType = 'SHORT' | 'FEATURE' | 'WEB_SERIES' | 'SCENE' | 'OTHER'
export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type MembershipRole = 'OWNER' | 'ADMIN'
export type CreditType = 'CAST' | 'CREW'
export type CreditStatus = 
  | 'PENDING_ACCEPTANCE' 
  | 'UNCLAIMED' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'DISPUTED' 
  | 'REMOVED'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELED'
export type ReportTargetType = 'USER' | 'PROJECT' | 'CREDIT'
export type ReportStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'
export type NotificationType =
  | 'CREDIT_TAGGED'
  | 'CREDIT_REQUEST_RECEIVED'
  | 'CREDIT_REQUEST_APPROVED'
  | 'CREDIT_REQUEST_DENIED'
  | 'CREDIT_CLAIM_RECEIVED'
  | 'CREDIT_CLAIM_APPROVED'
  | 'CREDIT_CLAIM_DENIED'
  | 'DISPUTE_UPDATE'
  | 'REPORT_UPDATE'
  | 'PROJECT_ADMIN_ADDED'
export type CommentStatus = 'VISIBLE' | 'REMOVED'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          username: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          is_admin: boolean
          is_banned: boolean
          banned_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_banned?: boolean
          banned_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          username?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_banned?: boolean
          banned_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          poster_url: string | null
          project_type: ProjectType
          status: ProjectStatus
          created_by_user_id: string
          published_at: string | null
          is_removed: boolean
          removed_at: string | null
          removed_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          poster_url?: string | null
          project_type: ProjectType
          status?: ProjectStatus
          created_by_user_id: string
          published_at?: string | null
          is_removed?: boolean
          removed_at?: string | null
          removed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          poster_url?: string | null
          project_type?: ProjectType
          status?: ProjectStatus
          created_by_user_id?: string
          published_at?: string | null
          is_removed?: boolean
          removed_at?: string | null
          removed_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_memberships: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: MembershipRole
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: MembershipRole
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: MembershipRole
          created_at?: string
        }
      }
      credits: {
        Row: {
          id: string
          project_id: string
          credit_type: CreditType
          job_title: string
          character_name: string | null
          credited_name: string | null
          credited_user_id: string | null
          status: CreditStatus
          created_by_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          credit_type: CreditType
          job_title: string
          character_name?: string | null
          credited_name?: string | null
          credited_user_id?: string | null
          status?: CreditStatus
          created_by_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          credit_type?: CreditType
          job_title?: string
          character_name?: string | null
          credited_name?: string | null
          credited_user_id?: string | null
          status?: CreditStatus
          created_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_ratings: {
        Row: {
          id: string
          project_id: string
          user_id: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_comments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          body: string
          status: CommentStatus
          removed_reason: string | null
          removed_by_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          body: string
          status?: CommentStatus
          removed_reason?: string | null
          removed_by_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          body?: string
          status?: CommentStatus
          removed_reason?: string | null
          removed_by_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

