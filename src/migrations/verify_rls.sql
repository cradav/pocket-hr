-- First, make sure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON conversations;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON conversations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON conversations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON conversations;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON messages;

-- Create policies with simpler names and conditions
CREATE POLICY "Enable insert for authenticated users only"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for authenticated users only"
ON conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users only"
ON conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users only"
ON conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Message policies
CREATE POLICY "Enable insert for authenticated users only"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Enable select for authenticated users only"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Enable update for authenticated users only"
ON messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete for authenticated users only"
ON messages FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
); 