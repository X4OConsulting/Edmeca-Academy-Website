-- Performance indexes for the data persistence layer (task 3.9)
-- These complement the existing indexes in 20260216085856_initial_schema.sql.

-- Composite index on artifacts (user_id, tool_type, created_at DESC)
-- Optimises the getLatestArtifactByType query which filters by both user_id
-- AND tool_type then sorts by created_at.
CREATE INDEX IF NOT EXISTS idx_artifacts_user_tool_created
  ON public.artifacts (user_id, tool_type, created_at DESC);

-- Composite index on progress_entries (user_id, created_at DESC)
-- Optimises the getProgressEntries query which filters by user_id and sorts
-- by created_at DESC.
CREATE INDEX IF NOT EXISTS idx_progress_entries_user_created
  ON public.progress_entries (user_id, created_at DESC);

-- Composite index on artifacts (user_id, status)
-- Allows fast counts of completed vs in-progress artifacts per user
-- (used by Dashboard progress card and ProgressTrackerTool).
CREATE INDEX IF NOT EXISTS idx_artifacts_user_status
  ON public.artifacts (user_id, status);

-- Partial index: only index non-null completed_at values in progress_entries.
-- Speeds up counting completed milestones.
CREATE INDEX IF NOT EXISTS idx_progress_entries_completed
  ON public.progress_entries (user_id, completed_at)
  WHERE completed_at IS NOT NULL;
