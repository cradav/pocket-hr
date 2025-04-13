-- Add phone column to users table
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Add comment to the phone column
COMMENT ON COLUMN users.phone IS 'User''s phone number'; 