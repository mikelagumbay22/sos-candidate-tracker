-- Add password verification function
CREATE OR REPLACE FUNCTION public.verify_password(input_password TEXT, hashed_password TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- pgcrypto is built-in to Supabase, so we can use it to verify the password
  RETURN crypt(input_password, hashed_password) = hashed_password;
END;
$$;