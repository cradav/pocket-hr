-- Disable RLS temporarily to allow operations without policy checks
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on the users table
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

-- Create simple policies with no recursion
CREATE POLICY "allow_select" ON users FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON users FOR UPDATE USING (true);
CREATE POLICY "allow_delete" ON users FOR DELETE USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;