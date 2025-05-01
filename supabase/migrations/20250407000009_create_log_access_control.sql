-- Create log access control table
CREATE TABLE IF NOT EXISTS public.log_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial password (default: 'Mikee422!')
INSERT INTO public.log_access_control (password_hash)
VALUES (crypt('Mikee422!', gen_salt('bf')));

-- Enable RLS
ALTER TABLE public.log_access_control ENABLE ROW LEVEL SECURITY;

-- Create policy for log access control
CREATE POLICY "Allow admins to view log_access_control"
ON public.log_access_control FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

-- Create password verification function
CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, hashed_password TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(input_password, hashed_password) = hashed_password;
END;
$$;

-- Grant permissions
GRANT ALL ON public.log_access_control TO authenticated;
GRANT ALL ON public.log_access_control TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password(TEXT, TEXT) TO service_role; 