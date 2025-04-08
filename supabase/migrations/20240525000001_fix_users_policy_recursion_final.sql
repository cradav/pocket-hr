-- First completely disable RLS on the users table to allow operations without policy checks
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on the users table
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

-- Create a completely new set of policies with no recursion

-- 1. Simple policy for public read access with no conditions that could cause recursion
CREATE POLICY "users_read_policy"
ON users FOR SELECT
USING (true);

-- 2. Simple policy for users to update their own data
CREATE POLICY "users_update_own_policy"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 3. Simple policy for admin operations - using a direct role check instead of a subquery
CREATE POLICY "admin_all_operations_policy"
ON users FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Re-enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
