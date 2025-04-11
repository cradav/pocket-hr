-- Add category and analysis_results columns to the documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS analysis_results JSONB;
