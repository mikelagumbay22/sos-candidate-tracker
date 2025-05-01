-- Create job order applicant junction table
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
  candidate_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_joborder_id ON public.joborder_applicant(joborder_id);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_applicant_id ON public.joborder_applicant(applicant_id);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_application_stage ON public.joborder_applicant(application_stage);
CREATE INDEX IF NOT EXISTS idx_joborder_applicant_application_status ON public.joborder_applicant(application_status);

-- Enable RLS
ALTER TABLE public.joborder_applicant ENABLE ROW LEVEL SECURITY;

-- Create policies for job order applicant relationships
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

-- Grant permissions
GRANT ALL ON public.joborder_applicant TO authenticated;
GRANT ALL ON public.joborder_applicant TO service_role; 