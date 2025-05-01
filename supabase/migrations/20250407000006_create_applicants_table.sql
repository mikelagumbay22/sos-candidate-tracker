-- Create applicants table
CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  cv_link TEXT,
  linkedin_profile VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for email
CREATE INDEX IF NOT EXISTS idx_applicants_email ON public.applicants(email);

-- Enable RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

-- Create policies for applicants
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

-- Grant permissions
GRANT ALL ON public.applicants TO authenticated;
GRANT ALL ON public.applicants TO service_role; 