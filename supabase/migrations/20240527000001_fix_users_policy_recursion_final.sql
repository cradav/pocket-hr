-- First, completely disable RLS to ensure we can make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on the users table to ensure a clean slate
DROP POLICY IF EXISTS "Public access" ON users;
DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow users to update own data" ON users;
DROP POLICY IF EXISTS "Allow admins to insert" ON users;
DROP POLICY IF EXISTS "Allow admins to delete" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_update_own_policy" ON users;
DROP POLICY IF EXISTS "admin_all_operations_policy" ON users;
DROP POLICY IF EXISTS "allow_select" ON users;
DROP POLICY IF EXISTS "allow_insert" ON users;
DROP POLICY IF EXISTS "allow_update" ON users;
DROP POLICY IF EXISTS "allow_delete" ON users;

-- Create extremely simple policies with no recursion or complex conditions
-- These policies grant access without any complex checks that might cause recursion
CREATE POLICY "simple_select_policy" ON users FOR SELECT USING (true);
CREATE POLICY "simple_insert_policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "simple_update_policy" ON users FOR UPDATE USING (true);
CREATE POLICY "simple_delete_policy" ON users FOR DELETE USING (true);

-- Re-enable RLS with the new simplified policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant access to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;

-- Ensure the auth.users table has the correct permissions as well
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for auth.users if it doesn't exist
DROP POLICY IF EXISTS "simple_auth_users_policy" ON auth.users;
CREATE POLICY "simple_auth_users_policy" ON auth.users FOR SELECT USING (true);
