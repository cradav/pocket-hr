-- Delete user cra.dav@gmail.com from auth.users table
DELETE FROM auth.users WHERE email = 'cra.dav@gmail.com';

-- Delete user from public.users table
DELETE FROM public.users WHERE email = 'cra.dav@gmail.com';

-- Update admin policy to remove the deleted user
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND email = 'admin@example.com'
  ));