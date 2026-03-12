-- SQL para criar a função exec_sql no Supabase
-- Execute isso no painel SQL Editor do seu projeto Supabase (https://supabase.com/dashboard/project/_/sql)

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Agora você pode executar o setup no CRM.
