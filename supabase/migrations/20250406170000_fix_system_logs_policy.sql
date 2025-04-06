-- Drop existing policy
DROP POLICY IF EXISTS "Only administrators can view system logs" ON public.system_logs;

-- Create new policy that allows joining with users table
CREATE POLICY "Allow admins to view system logs with user data"
ON public.system_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

-- Create policy to allow joining with users table
CREATE POLICY "Allow admins to view users in system logs"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
); 