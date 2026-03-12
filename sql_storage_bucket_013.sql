-- SQL ATUALIZAÇÃO 013 - Criação do Bucket de Arquivos (user-files)
-- Data: 2026-03-10
-- Descrição: Cria o bucket de armazenamento no Supabase Storage e configura as políticas de RLS

-- 1. Criar o bucket 'user-files' se não existir
INSERT INTO storage.buckets (id, name, public)
SELECT 'user-files', 'user-files', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'user-files'
);

-- 2. Habilitar políticas de RLS para o bucket 'user-files'

-- Política: Permitir que usuários autenticados façam upload de seus próprios arquivos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own files'
    ) THEN
        CREATE POLICY "Users can upload their own files"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- Política: Permitir que usuários vejam apenas seus próprios arquivos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can view their own files'
    ) THEN
        CREATE POLICY "Users can view their own files"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- Política: Permitir que usuários deletem seus próprios arquivos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own files'
    ) THEN
        CREATE POLICY "Users can delete their own files"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;

-- Política: Permitir que usuários atualizem seus próprios arquivos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own files'
    ) THEN
        CREATE POLICY "Users can update their own files"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)
        WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
    END IF;
END $$;
