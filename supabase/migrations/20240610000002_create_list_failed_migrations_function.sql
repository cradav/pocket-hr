-- Create a function to list failed migrations

CREATE OR REPLACE FUNCTION list_failed_migrations()
RETURNS TABLE (
  id bigint,
  name text,
  hash text,
  executed_at timestamp with time zone,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.hash, m.executed_at, m.status
  FROM supabase_migrations.migrations m
  WHERE m.status != 'applied'
  ORDER BY m.executed_at DESC;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'supabase_migrations.migrations table does not exist';
    RETURN;
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privileges to access supabase_migrations.migrations';
    RETURN;
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RETURN;
END;
$$;