-- This migration tests if credentials are properly configured

-- Create a test table if it doesn't exist
CREATE TABLE IF NOT EXISTS credential_test (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT
);

-- Insert a test record
INSERT INTO credential_test (message)
VALUES ('Credentials test successful');

-- Enable realtime for this table
alter publication supabase_realtime add table credential_test;
