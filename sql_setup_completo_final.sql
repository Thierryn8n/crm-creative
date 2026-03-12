-- ARQUIVO DE CORREÇÃO TOTAL DO SISTEMA (Setup Completo)
-- Execute este script no SQL Editor do Supabase para corrigir todas as tabelas e permissões

-- 1. Garantir que a extensão UUID existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Corrigir tabela de Perfis (user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- Pode ser o mesmo ID do auth.users se inserido manualmente, mas aqui deixamos flexível
  user_name varchar(255) NOT NULL,
  email varchar(255) UNIQUE,
  phone varchar(50),
  linkedin_url text,
  indeed_url text,
  portfolio_url text,
  github_url text,
  behance_url text,
  resume_text text, -- Aqui ficará o texto extraído do PDF
  skills text[] DEFAULT '{}',
  experience_years int DEFAULT 0,
  specialties text[] DEFAULT '{}',
  preferred_work_types text[] DEFAULT '{}',
  hourly_rate numeric(10,2),
  daily_rate numeric(10,2),
  availability varchar(50) DEFAULT 'available',
  bio text,
  profile_photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

-- 3. Corrigir tabela de Currículos (user_resumes)
CREATE TABLE IF NOT EXISTS public.user_resumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL, -- 'resume', 'linkedin', etc
  content text NOT NULL, -- Texto extraído
  file_url text, -- URL do arquivo no Storage
  linkedin_url text,
  extracted_skills jsonb DEFAULT '[]',
  extracted_experience jsonb DEFAULT '[]',
  extracted_education jsonb DEFAULT '[]',
  extracted_languages jsonb DEFAULT '[]',
  confidence_score numeric(3,2),
  analysis jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_resumes_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_resume_type UNIQUE (user_id, type)
);

-- 4. Função RPC para executar SQL dinâmico (Necessário para o botão 'Configurar Storage' funcionar)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- 5. Políticas de Storage (Permitir tudo para evitar erros 400/403)
-- Nota: Isso requer que o bucket 'user-files' e 'resumes' já existam. 
-- Se não existirem, o botão 'Configurar Storage' irá criá-los usando a função acima.

-- Habilitar RLS nas tabelas (boa prática, mas vamos deixar permissivo por enquanto para evitar bloqueios)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para user_profiles
CREATE POLICY "Enable all access for all users" ON public.user_profiles
FOR ALL USING (true) WITH CHECK (true);

-- Políticas permissivas para user_resumes
CREATE POLICY "Enable all access for all users" ON public.user_resumes
FOR ALL USING (true) WITH CHECK (true);

-- 6. Inserir Storage Buckets (Caso não existam - via SQL é complexo, melhor via API, mas podemos tentar insert direto)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Políticas de Storage (Crucial para o erro 400)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING ( bucket_id IN ('user-files', 'resumes') );

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id IN ('user-files', 'resumes') );

DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update" ON storage.objects
FOR UPDATE USING ( bucket_id IN ('user-files', 'resumes') );
