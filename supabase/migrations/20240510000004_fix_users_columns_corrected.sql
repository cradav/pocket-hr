-- Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set default values for existing rows if needed
UPDATE users SET name = email WHERE name IS NULL;
UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add word credits columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS word_credits_remaining INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS word_credits_total INTEGER DEFAULT 0;

-- Drop and recreate admin policy to fix recursion issue
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
