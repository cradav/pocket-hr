-- Update the cron job to run the company-news-cron edge function daily at 6AM UTC

-- First, make sure the pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists
SELECT cron.unschedule('fetch_company_news');

-- Create a function to invoke the edge function
CREATE OR REPLACE FUNCTION invoke_company_news_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  SELECT content INTO result FROM http_post(
    'https://dwhnysvvlrffwnhololy.supabase.co/functions/v1/company-news-cron',
    '{}',
    'application/json',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('supabase_functions.service_role_key'))]
  );
  
  -- Log the result
  INSERT INTO cron_logs (job_name, last_run, status, details)
  VALUES ('pg_cron_company_news_fetch', NOW(), 'completed', result);
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO cron_logs (job_name, last_run, status, details)
  VALUES ('pg_cron_company_news_fetch', NOW(), 'error', SQLERRM);
END;
$$;

-- Schedule the job to run daily at 6AM UTC
SELECT cron.schedule(
  'fetch_company_news',
  '0 6 * * *',
  'SELECT invoke_company_news_cron()'
);
