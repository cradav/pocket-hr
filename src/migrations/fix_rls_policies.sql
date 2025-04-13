-- First, enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON conversations;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON conversations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON conversations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON conversations;

-- Create new policies for conversations
CREATE POLICY "Enable read access for own conversations"
ON conversations FOR SELECT
TO authenticated
USING (auth.uid()::uuid = user_id);

CREATE POLICY "Enable insert access for own conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Enable update access for own conversations"
ON conversations FOR UPDATE
TO authenticated
USING (auth.uid()::uuid = user_id);

CREATE POLICY "Enable delete access for own conversations"
ON conversations FOR DELETE
TO authenticated
USING (auth.uid()::uuid = user_id);

-- Drop existing policies for messages
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON messages;

-- Create new policies for messages
CREATE POLICY "Enable read access for conversation messages"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND conversations.user_id = auth.uid()::uuid
    )
);

CREATE POLICY "Enable insert access for conversation messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND conversations.user_id = auth.uid()::uuid
    )
);

CREATE POLICY "Enable update access for conversation messages"
ON messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND conversations.user_id = auth.uid()::uuid
    )
);

CREATE POLICY "Enable delete access for conversation messages"
ON messages FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND conversations.user_id = auth.uid()::uuid
    )
); 