-- Baseline: the schema as migrated from Supabase on 2026-10-06 (app tables plus
-- Better Auth's user/session/account/verification), dumped from Neon.
-- Later changes are separate files in this folder (npm run db:migrate).


\restrict 9IaqiGytpNnoi3c7x3eesdbXNJIh8Y7uXHAoNBMawAcweznwhOe6C4Yv23839FF

CREATE TYPE public.artifact_status AS ENUM (
    'draft',
    'in_progress',
    'complete'
);

CREATE TYPE public.role AS ENUM (
    'entrepreneur',
    'participant',
    'programme_manager',
    'admin'
);

CREATE TYPE public.tool_type AS ENUM (
    'bmc',
    'swot_pestle',
    'value_proposition',
    'pitch_builder'
);

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = now();     -- now() is a built-in — always resolves correctly
  RETURN NEW;
END;
$$;

CREATE TABLE public.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE public.artifacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tool_type public.tool_type NOT NULL,
    title text NOT NULL,
    content jsonb,
    status public.artifact_status DEFAULT 'draft'::public.artifact_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1
);

CREATE TABLE public.ballots (
    student_id integer NOT NULL,
    student_name text NOT NULL,
    student_group integer NOT NULL,
    scores jsonb DEFAULT '{}'::jsonb NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.cohorts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    organization_id uuid,
    invite_code uuid DEFAULT gen_random_uuid(),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.config (
    key text NOT NULL,
    value text NOT NULL
);

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    audience_type text NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.financial_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_type text DEFAULT 'paste'::text NOT NULL,
    company_name text,
    analysed_at timestamp with time zone DEFAULT now() NOT NULL,
    report_text text,
    model_categorisation text,
    model_analysis text,
    CONSTRAINT financial_uploads_file_name_length CHECK ((char_length(file_name) <= 255)),
    CONSTRAINT financial_uploads_file_type_enum CHECK ((file_type = ANY (ARRAY['paste'::text, 'csv'::text, 'xlsx'::text, 'pdf'::text])))
);

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.progress_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    milestone text NOT NULL,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL
);

CREATE TABLE public."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.role DEFAULT 'entrepreneur'::public.role,
    organization_id uuid,
    cohort_id uuid,
    business_name text,
    business_description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ballots
    ADD CONSTRAINT ballots_pkey PRIMARY KEY (student_id);

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_invite_code_key UNIQUE (invite_code);

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.financial_uploads
    ADD CONSTRAINT financial_uploads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.progress_entries
    ADD CONSTRAINT progress_entries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);

CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");

CREATE INDEX financial_uploads_analysed_idx ON public.financial_uploads USING btree (analysed_at DESC);

CREATE INDEX financial_uploads_user_id_idx ON public.financial_uploads USING btree (user_id);

CREATE INDEX idx_artifacts_tool_type ON public.artifacts USING btree (tool_type);

CREATE INDEX idx_artifacts_user_id ON public.artifacts USING btree (user_id);

CREATE INDEX idx_artifacts_user_status ON public.artifacts USING btree (user_id, status);

CREATE INDEX idx_artifacts_user_tool ON public.artifacts USING btree (user_id, tool_type);

CREATE INDEX idx_artifacts_user_tool_created ON public.artifacts USING btree (user_id, tool_type, created_at DESC);

CREATE INDEX idx_cohorts_invite_code ON public.cohorts USING btree (invite_code);

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions USING btree (created_at);

CREATE INDEX idx_contact_submissions_email ON public.contact_submissions USING btree (email);

CREATE INDEX idx_progress_entries_completed ON public.progress_entries USING btree (user_id, completed_at) WHERE (completed_at IS NOT NULL);

CREATE INDEX idx_progress_entries_user_created ON public.progress_entries USING btree (user_id, created_at DESC);

CREATE INDEX idx_progress_entries_user_id ON public.progress_entries USING btree (user_id);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);

CREATE INDEX "session_userId_idx" ON public.session USING btree ("userId");

CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);

CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON public.artifacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.financial_uploads
    ADD CONSTRAINT financial_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.progress_entries
    ADD CONSTRAINT progress_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

\unrestrict 9IaqiGytpNnoi3c7x3eesdbXNJIh8Y7uXHAoNBMawAcweznwhOe6C4Yv23839FF

