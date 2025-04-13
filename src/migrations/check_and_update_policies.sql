-- First, let's drop existing policies if they're not working correctly
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;

-- Then recreate them
CREATE POLICY "Users can create their own conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can update messages in their conversations"
ON messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
); 