-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function for handling user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (
      id,
      first_name,
      last_name,
      email,
      username,
      role,
      created_at
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      COALESCE(new.raw_user_meta_data->>'last_name', ''),
      new.email,
      COALESCE(new.raw_user_meta_data->>'username', ''),
      COALESCE(new.raw_user_meta_data->>'role', 'recruiter'),
      CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role; 