-- Drop existing constraint if it exists
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_check;

-- Add new constraint to accept 'assistant' instead of 'ai'
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'assistant')); 