-- CRM Tables for managing advertising agency clients

-- Clients table (advertising agencies looking for senior designers)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp_link TEXT,
  website VARCHAR(255),
  linkedin_url VARCHAR(255),
  instagram_url VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  status VARCHAR(50) DEFAULT 'lead', -- lead, contacted, negotiating, client, lost
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  notes TEXT,
  source VARCHAR(100), -- where the lead came from (gemini, manual, referral)
  last_contact_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interactions/Activities log
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- email, whatsapp, call, meeting
  subject VARCHAR(255),
  content TEXT,
  direction VARCHAR(20) DEFAULT 'outbound', -- inbound, outbound
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sent emails log
CREATE TABLE IF NOT EXISTS public.sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, opened, failed
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio items cache (synced from external Supabase)
CREATE TABLE IF NOT EXISTS public.portfolio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  thumbnail_url TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  source_table VARCHAR(100), -- social_media_content, drone_content, portfolio_media
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Search history (Gemini searches)
CREATE TABLE IF NOT EXISTS public.ai_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results JSONB,
  clients_added INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_city ON public.clients(city);
CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_client_id ON public.sent_emails(client_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_cache_category ON public.portfolio_cache(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to email_templates table
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body, is_default) VALUES
(
  'Apresentacao Inicial',
  'Designer Senior disponivel para projetos - Portfolio completo',
  E'Ola {{nome_contato}},\n\nMeu nome e Thierry Wellington, sou Designer Senior com experiencia em criacao de conteudo para redes sociais, motion graphics, filmagens com drone e muito mais.\n\nGostaria de apresentar meu portfolio e discutir como posso agregar valor aos projetos da {{nome_empresa}}.\n\nPortfolio: https://thierrycreative.vercel.app/\n\nFico a disposicao para uma conversa.\n\nAtenciosamente,\nThierry Wellington',
  true
),
(
  'Follow Up',
  'Acompanhamento - Proposta de Parceria {{nome_empresa}}',
  E'Ola {{nome_contato}},\n\nEstou entrando em contato novamente para saber se tiveram a oportunidade de avaliar meu portfolio.\n\nContinuo disponivel para discutir como posso contribuir com os projetos da {{nome_empresa}}.\n\nAguardo seu retorno.\n\nAtenciosamente,\nThierry Wellington',
  false
),
(
  'Proposta de Servico',
  'Proposta de Servicos - Design Senior para {{nome_empresa}}',
  E'Prezado(a) {{nome_contato}},\n\nConforme conversamos, segue minha proposta de servicos para a {{nome_empresa}}.\n\nServicos oferecidos:\n- Design para Redes Sociais (Posts, Stories, Reels)\n- Motion Graphics e Animacoes\n- Filmagens e Edicao com Drone\n- Identidade Visual\n- UI/UX Design\n\nEstou aberto a negociar valores e prazos conforme a demanda.\n\nAguardo seu retorno.\n\nAtenciosamente,\nThierry Wellington',
  false
);
