-- Create log access control table
CREATE TABLE IF NOT EXISTS public.log_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial password (default: 'Mikee422!')
-- The password is hashed using pgcrypto's crypt function with a blowfish hash
INSERT INTO public.log_access_control (password_hash)
VALUES (crypt('Mikee422!', gen_salt('bf')));

-- Apply RLS to log_access_control
ALTER TABLE public.log_access_control ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to select from log_access_control
CREATE POLICY "Allow admins to view log_access_control"
ON public.log_access_control FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

-- Apply RLS to system_logs if it doesn't already have it
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to select from system_logs
CREATE POLICY "Allow admins to view system logs"
ON public.system_logs FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);