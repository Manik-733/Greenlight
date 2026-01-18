-- Data Integrity Constraints Migration
-- Ensures projects cannot violate data consistency rules

-- Constraint 1: Slug must be unique across all projects
-- Prevents race conditions in slug generation
ALTER TABLE projects
ADD CONSTRAINT unique_slug_per_project UNIQUE (slug);

-- Constraint 2: If status=PUBLISHED, published_at must be set
-- Prevents published projects from having null timestamps
ALTER TABLE projects
ADD CONSTRAINT published_requires_timestamp
CHECK (
  (status != 'PUBLISHED'::project_status) OR (published_at IS NOT NULL)
);
