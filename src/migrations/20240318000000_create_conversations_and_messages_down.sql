-- Drop triggers first
DROP TRIGGER IF EXISTS update_conversations_last_updated ON public.conversations;
DROP FUNCTION IF EXISTS update_last_updated_column();

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;

-- Drop indexes
DROP INDEX IF EXISTS idx_conversations_last_updated;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_conversations_assistant_id;
DROP INDEX IF EXISTS idx_conversations_user_id;

-- Drop tables
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.conversations; 