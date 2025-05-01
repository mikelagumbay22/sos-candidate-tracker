-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_user_updated ON public.users;
DROP FUNCTION IF EXISTS public.handle_user_update();

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
CREATE TRIGGER on_user_updated
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_update() TO service_role; 