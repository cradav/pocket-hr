-- Recreate documents table with proper schema

-- Drop existing table if it has incorrect schema
DROP TABLE IF EXISTS public.documents;

-- Create documents table with proper schema
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_status TEXT DEFAULT 'none',
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy for documents
DROP POLICY IF EXISTS "Users can only access their own documents" ON public.documents;
CREATE POLICY "Users can only access their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for documents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Refresh the schema cache to ensure it recognizes the new table
NOTIFY pgrst, 'reload schema'; 