-- Create user policies
CREATE POLICY "Allow users to view their own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Allow admins to view all users" 
ON public.users FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

CREATE POLICY "Allow admins to insert users" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

CREATE POLICY "Allow admins to update users" 
ON public.users FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'administrator'
  )
);

-- Temporarily disable RLS for testing
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY; 