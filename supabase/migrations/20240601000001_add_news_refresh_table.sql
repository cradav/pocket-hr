-- Create a table to track when news was last refreshed for each company and user
CREATE TABLE IF NOT EXISTS news_refresh (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  last_refresh TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_name, user_id)
);

-- Enable row level security
ALTER TABLE news_refresh ENABLE ROW LEVEL SECURITY;

-- Create policies for news_refresh table
DROP POLICY IF EXISTS "Users can view their own refresh times" ON news_refresh;
CREATE POLICY "Users can view their own refresh times"
  ON news_refresh FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own refresh times" ON news_refresh;
CREATE POLICY "Users can insert their own refresh times"
  ON news_refresh FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own refresh times" ON news_refresh;
CREATE POLICY "Users can update their own refresh times"
  ON news_refresh FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for this table
alter publication supabase_realtime add table news_refresh;