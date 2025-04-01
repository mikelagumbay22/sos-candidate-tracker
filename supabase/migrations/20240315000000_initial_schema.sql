
-- Create tables for the ATS (Applicant Tracking System)

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'administrator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  company TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Job Orders table
CREATE TABLE IF NOT EXISTS public.joborder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  author_id UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'kickoff sourcing',
  responsibilities_requirements TEXT,
  schedule TEXT,
  client_budget TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  cv_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- JobOrder-Applicant junction table (for tracking applicants assigned to job orders)
CREATE TABLE IF NOT EXISTS public.joborder_applicant (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joborder_id UUID NOT NULL REFERENCES public.joborder(id),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  author_id UUID NOT NULL REFERENCES public.users(id),
  application_stage TEXT NOT NULL DEFAULT 'Initial Interview',
  application_status TEXT NOT NULL DEFAULT 'Pending',
  interview_notes TEXT,
  asking_salary NUMERIC,
  client_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_joborder_client_id ON public.joborder(client_id);
CREATE INDEX IF NOT EXISTS idx_joborder_status ON public.joborder(status);
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_joborder_id ON public.joborder_applicant(joborder_id);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_applicant_id ON public.joborder_applicant(applicant_id);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_application_stage ON public.joborder_applicant(application_stage);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_application_status ON public.joborder_applicant(application_status);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.joborder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.joborder_applicant ENABLE ROW LEVEL SECURITY;

-- FIXED: Modified Users table policies to avoid recursion
CREATE POLICY "Allow users to view their own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Allow admins to view all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

CREATE POLICY "Allow admins to insert users" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

CREATE POLICY "Allow admins to update users" 
ON public.users FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

-- Clients table policies
CREATE POLICY "Allow users to view clients" 
ON public.clients FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to create clients" 
ON public.clients FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow users to update their own clients" 
ON public.clients FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

-- Job Orders table policies
CREATE POLICY "Allow users to view job orders" 
ON public.joborder FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to create job orders" 
ON public.joborder FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow users to update their own job orders" 
ON public.joborder FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

-- Applicants table policies
CREATE POLICY "Allow users to view applicants" 
ON public.applicants FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to create applicants" 
ON public.applicants FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow users to update their own applicants" 
ON public.applicants FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

-- JobOrder-Applicant table policies
CREATE POLICY "Allow users to view job order applicants" 
ON public.joborder_applicant FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow users to create job order applicant relationships" 
ON public.joborder_applicant FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Allow users to update their own job order applicant relationships" 
ON public.joborder_applicant FOR UPDATE 
TO authenticated 
USING (auth.uid() = author_id);

-- Create function for handling user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, email, username, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function for updating user metadata
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'username', NEW.username,
    'role', NEW.role
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user profile updates
CREATE OR REPLACE TRIGGER on_user_updated
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();
