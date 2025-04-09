-- Fix documents table schema by adding missing columns

-- Check if analysis_status column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'documents'
          AND column_name = 'analysis_status'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN analysis_status TEXT DEFAULT 'none';
    END IF;
END
$$;

-- Check if analysis_data column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'documents'
          AND column_name = 'analysis_data'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN analysis_data JSONB;
    END IF;
END
$$;

-- Refresh the schema cache to ensure it recognizes the new columns
NOTIFY pgrst, 'reload schema';

-- Update the documents table to ensure it has all necessary columns
-- This is a more comprehensive approach that creates the table if it doesn't exist
-- or adds any missing columns if it does
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  file_url TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_status TEXT DEFAULT 'none',
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Ensure policy exists for documents
DROP POLICY IF EXISTS "Users can only access their own documents" ON public.documents;
CREATE POLICY "Users can only access their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for documents table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  END IF;
END
$$; 