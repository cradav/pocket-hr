-- Add token_count column to messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'token_count'
    ) THEN
        ALTER TABLE messages ADD COLUMN token_count INTEGER DEFAULT 0;
    END IF;
END $$;
