-- Create job orders table
CREATE TABLE IF NOT EXISTS public.joborder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  author_id UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'kickoff sourcing',
  job_description TEXT,
  schedule TEXT,
  client_budget TEXT,
  sourcing_preference JSONB,
  priority TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_joborder_client_id ON public.joborder(client_id);
CREATE INDEX IF NOT EXISTS idx_joborder_status ON public.joborder(status);

-- Enable RLS
ALTER TABLE public.joborder ENABLE ROW LEVEL SECURITY;

-- Create policies for job orders
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

-- Grant permissions
GRANT ALL ON public.joborder TO authenticated;
GRANT ALL ON public.joborder TO service_role; 