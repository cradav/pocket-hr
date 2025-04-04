-- Add plan_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';
