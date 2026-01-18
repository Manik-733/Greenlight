-- BMDB Database Schema
-- Supabase Migration File

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE project_type AS ENUM ('SHORT', 'FEATURE', 'WEB_SERIES', 'SCENE', 'OTHER');
CREATE TYPE project_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE membership_role AS ENUM ('OWNER', 'ADMIN');
CREATE TYPE credit_type AS ENUM ('CAST', 'CREW');
CREATE TYPE credit_status AS ENUM (
  'PENDING_ACCEPTANCE',
  'UNCLAIMED',
  'VERIFIED',
  'REJECTED',
  'DISPUTED',
  'REMOVED'
);
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELED');
CREATE TYPE report_target_type AS ENUM ('USER', 'PROJECT', 'CREDIT');
CREATE TYPE report_status AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
CREATE TYPE notification_type AS ENUM (
  'CREDIT_TAGGED',
  'CREDIT_REQUEST_RECEIVED',
  'CREDIT_REQUEST_APPROVED',
  'CREDIT_REQUEST_DENIED',
  'CREDIT_CLAIM_RECEIVED',
  'CREDIT_CLAIM_APPROVED',
  'CREDIT_CLAIM_DENIED',
  'DISPUTE_UPDATE',
  'REPORT_UPDATE',
  'PROJECT_ADMIN_ADDED'
);
CREATE TYPE comment_status AS ENUM ('VISIBLE', 'REMOVED');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (1:1 with auth.users)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  banned_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  poster_url TEXT,
  project_type project_type NOT NULL,
  status project_status DEFAULT 'DRAFT' NOT NULL,
  created_by_user_id UUID REFERENCES profiles(user_id) ON DELETE RESTRICT NOT NULL,
  published_at TIMESTAMPTZ,
  is_removed BOOLEAN DEFAULT FALSE NOT NULL,
  removed_at TIMESTAMPTZ,
  removed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by_user_id);
CREATE INDEX idx_projects_published_at ON projects(published_at);
CREATE INDEX idx_projects_is_removed ON projects(is_removed);
CREATE INDEX idx_projects_status_published ON projects(status, published_at) WHERE status = 'PUBLISHED' AND is_removed = FALSE;

-- Project memberships table
CREATE TABLE project_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  role membership_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_memberships_project_id ON project_memberships(project_id);
CREATE INDEX idx_project_memberships_user_id ON project_memberships(user_id);
CREATE INDEX idx_project_memberships_role ON project_memberships(role);

-- Credits table
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  credit_type credit_type NOT NULL,
  job_title TEXT NOT NULL,
  character_name TEXT,
  credited_name TEXT,
  credited_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  status credit_status DEFAULT 'PENDING_ACCEPTANCE' NOT NULL,
  created_by_user_id UUID REFERENCES profiles(user_id) ON DELETE RESTRICT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_credits_project_id ON credits(project_id);
CREATE INDEX idx_credits_credited_user_id ON credits(credited_user_id);
CREATE INDEX idx_credits_status ON credits(status);
CREATE INDEX idx_credits_credit_type ON credits(credit_type);

-- Unique constraint: prevent duplicate credits for same user
CREATE UNIQUE INDEX idx_credits_unique_user ON credits(project_id, credited_user_id, job_title, COALESCE(character_name, ''))
  WHERE credited_user_id IS NOT NULL;

-- Unique constraint: prevent duplicate credits for same name
CREATE UNIQUE INDEX idx_credits_unique_name ON credits(project_id, credited_name, job_title, COALESCE(character_name, ''))
  WHERE credited_user_id IS NULL AND credited_name IS NOT NULL;

-- Credit requests table
CREATE TABLE credit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  requested_by_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  credit_type credit_type NOT NULL,
  job_title TEXT NOT NULL,
  character_name TEXT,
  message TEXT,
  status request_status DEFAULT 'PENDING' NOT NULL,
  responded_by_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_credit_requests_project_id ON credit_requests(project_id);
CREATE INDEX idx_credit_requests_requested_by ON credit_requests(requested_by_user_id);
CREATE INDEX idx_credit_requests_status ON credit_requests(status);

-- Credit claim requests table
CREATE TABLE credit_claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_id UUID REFERENCES credits(id) ON DELETE CASCADE NOT NULL,
  claimed_by_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  proof_urls TEXT[],
  status request_status DEFAULT 'PENDING' NOT NULL,
  responded_by_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  response_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_credit_claim_requests_credit_id ON credit_claim_requests(credit_id);
CREATE INDEX idx_credit_claim_requests_claimed_by ON credit_claim_requests(claimed_by_user_id);
CREATE INDEX idx_credit_claim_requests_status ON credit_claim_requests(status);

-- Credit disputes table
CREATE TABLE credit_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_id UUID REFERENCES credits(id) ON DELETE CASCADE NOT NULL,
  disputed_by_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status request_status DEFAULT 'PENDING' NOT NULL,
  resolved_by_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_credit_disputes_credit_id ON credit_disputes(credit_id);
CREATE INDEX idx_credit_disputes_disputed_by ON credit_disputes(disputed_by_user_id);
CREATE INDEX idx_credit_disputes_status ON credit_disputes(status);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  target_type report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'PENDING' NOT NULL,
  resolved_by_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reports_reported_by ON reports(reported_by_user_id);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  related_credit_id UUID REFERENCES credits(id) ON DELETE CASCADE,
  related_request_id UUID,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Project ratings table
CREATE TABLE project_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_ratings_project_id ON project_ratings(project_id);
CREATE INDEX idx_project_ratings_user_id ON project_ratings(user_id);
CREATE INDEX idx_project_ratings_rating ON project_ratings(project_id, rating);

-- Project comments table
CREATE TABLE project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  status comment_status DEFAULT 'VISIBLE' NOT NULL,
  removed_reason TEXT,
  removed_by_user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (LENGTH(body) >= 3 AND LENGTH(body) <= 1500)
);

CREATE INDEX idx_project_comments_project_id ON project_comments(project_id, created_at DESC);
CREATE INDEX idx_project_comments_user_id ON project_comments(user_id);
CREATE INDEX idx_project_comments_status ON project_comments(status);

-- Project rating aggregates view (for performance)
CREATE OR REPLACE VIEW project_rating_aggregates AS
SELECT
  project_id,
  COUNT(*) as rating_count,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  COUNT(*) FILTER (WHERE rating >= 8) as high_ratings_count,
  COUNT(*) FILTER (WHERE rating <= 3) as low_ratings_count
FROM project_ratings
GROUP BY project_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_requests_updated_at BEFORE UPDATE ON credit_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_claim_requests_updated_at BEFORE UPDATE ON credit_claim_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_disputes_updated_at BEFORE UPDATE ON credit_disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_ratings_updated_at BEFORE UPDATE ON project_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_comments_updated_at BEFORE UPDATE ON project_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is project owner/admin
CREATE OR REPLACE FUNCTION is_project_admin(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_memberships
    WHERE project_id = project_uuid
      AND user_id = user_uuid
      AND role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = user_uuid AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS Policies
CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Projects RLS Policies
CREATE POLICY "Anyone can view published projects"
  ON projects FOR SELECT
  USING (status = 'PUBLISHED' AND is_removed = FALSE);

CREATE POLICY "Project owners/admins can view their projects"
  ON projects FOR SELECT
  USING (
    is_project_admin(id, auth.uid()) OR
    created_by_user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Project owners/admins can update their projects"
  ON projects FOR UPDATE
  USING (is_project_admin(id, auth.uid()));

-- Project memberships RLS Policies
CREATE POLICY "Project owners/admins can view memberships"
  ON project_memberships FOR SELECT
  USING (is_project_admin(project_id, auth.uid()) OR is_platform_admin(auth.uid()));

CREATE POLICY "Project owners can manage memberships"
  ON project_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_memberships pm
      WHERE pm.project_id = project_memberships.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'OWNER'
    ) OR is_platform_admin(auth.uid())
  );

-- Credits RLS Policies
CREATE POLICY "Anyone can view credits for published projects"
  ON credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = credits.project_id
        AND projects.status = 'PUBLISHED'
        AND projects.is_removed = FALSE
    ) AND status != 'REMOVED'
  );

CREATE POLICY "Project owners/admins can view all credits"
  ON credits FOR SELECT
  USING (is_project_admin(project_id, auth.uid()));

CREATE POLICY "Project owners/admins can create credits"
  ON credits FOR INSERT
  WITH CHECK (is_project_admin(project_id, auth.uid()));

-- Credit requests RLS Policies
CREATE POLICY "Requesters can view their own requests"
  ON credit_requests FOR SELECT
  USING (requested_by_user_id = auth.uid());

CREATE POLICY "Project owners/admins can view requests for their projects"
  ON credit_requests FOR SELECT
  USING (is_project_admin(project_id, auth.uid()));

CREATE POLICY "Authenticated users can create credit requests"
  ON credit_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by_user_id);

-- Credit claim requests RLS Policies
CREATE POLICY "Claimants can view their own claims"
  ON credit_claim_requests FOR SELECT
  USING (claimed_by_user_id = auth.uid());

CREATE POLICY "Project owners/admins can view claims for their projects"
  ON credit_claim_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM credits
      WHERE credits.id = credit_claim_requests.credit_id
        AND is_project_admin(credits.project_id, auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create claim requests"
  ON credit_claim_requests FOR INSERT
  WITH CHECK (auth.uid() = claimed_by_user_id);

-- Reports RLS Policies
CREATE POLICY "Platform admins can view all reports"
  ON reports FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (reported_by_user_id = auth.uid());

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by_user_id);

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Audit logs RLS Policies
CREATE POLICY "Platform admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_platform_admin(auth.uid()));

-- Project ratings RLS Policies
CREATE POLICY "Anyone can view ratings for published projects"
  ON project_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_ratings.project_id
        AND projects.status = 'PUBLISHED'
        AND projects.is_removed = FALSE
    )
  );

CREATE POLICY "Authenticated users can rate projects"
  ON project_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_ratings.project_id
        AND projects.status = 'PUBLISHED'
        AND projects.is_removed = FALSE
    )
  );

CREATE POLICY "Users can update their own ratings"
  ON project_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON project_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Project comments RLS Policies
CREATE POLICY "Anyone can view visible comments for published projects"
  ON project_comments FOR SELECT
  USING (
    status = 'VISIBLE' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
        AND projects.status = 'PUBLISHED'
        AND projects.is_removed = FALSE
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON project_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
        AND projects.status = 'PUBLISHED'
        AND projects.is_removed = FALSE
    )
  );

CREATE POLICY "Users can update their own visible comments"
  ON project_comments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'VISIBLE')
  WITH CHECK (auth.uid() = user_id);

-- Disputes RLS Policies
CREATE POLICY "Platform admins can view disputes"
  ON credit_disputes FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Disputants can view their own disputes"
  ON credit_disputes FOR SELECT
  USING (disputed_by_user_id = auth.uid());

CREATE POLICY "Authenticated users can create disputes"
  ON credit_disputes FOR INSERT
  WITH CHECK (auth.uid() = disputed_by_user_id);

