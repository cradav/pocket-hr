-- Add a scheduled cron job to run the company-news-cron function every day at 6AM PST (14:00 UTC)
-- Note: Supabase scheduled functions use UTC time

-- First, check if the extension is available and enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run every day at 6AM PST (14:00 UTC)
SELECT cron.schedule(
  'company-news-daily', -- unique job name
  '0 14 * * *',        -- cron schedule (14:00 UTC = 6:00 PST)
  $$
  SELECT net.http_post(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/company-news-cron',
    '{}',
    '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'
  ) AS request_id;
  $$
);

-- Note: You'll need to replace YOUR_PROJECT_REF with your actual Supabase project reference
-- and YOUR_SERVICE_ROLE_KEY with your actual service role key
-- This will be handled by the platform when the migration is run
