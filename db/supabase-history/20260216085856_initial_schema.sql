-- EDMECA Database Schema for Supabase
-- This script sets up the complete database schema with Row Level Security

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUMS
CREATE TYPE public.role AS ENUM ('entrepreneur', 'participant', 'programme_manager', 'admin');
CREATE TYPE public.tool_type AS ENUM ('bmc', 'swot_pestle', 'value_proposition', 'pitch_builder');
CREATE TYPE public.artifact_status AS ENUM ('draft', 'in_progress', 'complete');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts table
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  invite_code UUID DEFAULT uuid_generate_v4() UNIQUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.role DEFAULT 'entrepreneur',
  organization_id UUID REFERENCES public.organizations(id),
  cohort_id UUID REFERENCES public.cohorts(id),
  business_name TEXT,
  business_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Artifacts table (saved tool outputs)
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type public.tool_type NOT NULL,
  title TEXT NOT NULL,
  content JSONB,
  status public.artifact_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress entries table
CREATE TABLE public.progress_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact submissions table (public form submissions)
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  audience_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables except contact_submissions (public)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Artifacts: Users can only see and modify their own artifacts
CREATE POLICY "Users can view their own artifacts"
  ON public.artifacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts"
  ON public.artifacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts"
  ON public.artifacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts"
  ON public.artifacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Progress entries: Users can only see and modify their own progress
CREATE POLICY "Users can view their own progress"
  ON public.progress_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.progress_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.progress_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.progress_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Organizations and Cohorts: Basic read access for authenticated users
-- (You can make these more restrictive based on your business logic)
CREATE POLICY "Authenticated users can view organizations"
  ON public.organizations
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view cohorts"
  ON public.cohorts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_artifacts_user_id ON public.artifacts(user_id);
CREATE INDEX idx_artifacts_tool_type ON public.artifacts(tool_type);
CREATE INDEX idx_artifacts_user_tool ON public.artifacts(user_id, tool_type);
CREATE INDEX idx_progress_entries_user_id ON public.progress_entries(user_id);
CREATE INDEX idx_cohorts_invite_code ON public.cohorts(invite_code);
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at);

-- ==========================================
-- FUNCTIONS (Optional - for complex operations)
-- ==========================================

-- Function to get user's latest artifact by tool type
CREATE OR REPLACE FUNCTION public.get_latest_artifact_by_type(p_tool_type public.tool_type)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content JSONB,
  status public.artifact_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.status, a.created_at, a.updated_at
  FROM public.artifacts a
  WHERE a.user_id = auth.uid()
    AND a.tool_type = p_tool_type
  ORDER BY a.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;