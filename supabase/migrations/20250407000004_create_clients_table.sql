-- Create clients table
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

-- Create index for email
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
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

-- Grant permissions
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role; 