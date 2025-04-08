-- Update roles for admin users
UPDATE users 
SET role = 'admin' 
WHERE email IN ('admin@example.com', 'cra.dav@gmail.com', 'cradav@gmail.com');

-- Ensure all other users have the 'user' role
UPDATE users 
SET role = 'user' 
WHERE role IS NULL OR role NOT IN ('admin', 'user'); 