-- Create a table to track cron job executions
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL UNIQUE,
  last_run TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add company_name column to company_news table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'company_news' 
                AND column_name = 'company_name') THEN
    ALTER TABLE company_news ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- Create index on company_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_news_company_name ON company_news(company_name);

-- Create unique constraint on title and company_name to prevent duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_news_title_company_name_key') THEN
    ALTER TABLE company_news ADD CONSTRAINT company_news_title_company_name_key UNIQUE (title, company_name);
  END IF;
END $$;

-- Enable RLS on cron_logs table
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for cron_logs table (admin only)
DROP POLICY IF EXISTS "Admin users can read cron logs" ON cron_logs;
CREATE POLICY "Admin users can read cron logs"
  ON cron_logs
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Add publication for realtime
alter publication supabase_realtime add table cron_logs;
