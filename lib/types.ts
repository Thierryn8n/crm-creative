// CRM Types for managing advertising agency clients

export type ClientStatus = 'lead' | 'contacted' | 'negotiating' | 'client' | 'lost' | 'no_contacts' | 'site_broken' | 'find_yourself'
export type PotentialClientStatus = 'potential' | 'analyzing' | 'approved' | 'rejected' | 'contacted'
export type ClientPriority = 'low' | 'medium' | 'high'
export type InteractionType = 'email' | 'whatsapp' | 'call' | 'meeting'
export type InteractionDirection = 'inbound' | 'outbound'
export type EmailStatus = 'sent' | 'delivered' | 'opened' | 'failed'

export interface Client {
  id: string
  company_name: string
  status: ClientStatus
  priority: ClientPriority
  full_company_data?: any
  has_analysis?: boolean
  created_at: string
  updated_at: string
  // Colunas legadas (serão removidas do banco, mantidas aqui como opcionais para compatibilidade durante a transição)
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  whatsapp_link?: string | null
  website?: string | null
  linkedin_url?: string | null
  instagram_url?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  source?: string | null
  last_contact_date?: string | null
}

export interface Interaction {
  id: string
  client_id: string
  type: InteractionType
  subject: string | null
  content: string | null
  direction: InteractionDirection
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface SentEmail {
  id: string
  client_id: string
  template_id: string | null
  to_email: string
  subject: string
  body: string
  status: EmailStatus
  sent_at: string
}

export interface PortfolioItem {
  id: string
  external_id: string | null
  title: string
  description: string | null
  category: string | null
  thumbnail_url: string | null
  media_urls: string[]
  source_table: string | null
  synced_at: string
}

export interface AISearch {
  id: string
  query: string
  results: Record<string, unknown> | null
  clients_added: number
  created_at: string
}

// Statistics for dashboard
export interface CRMStats {
  totalClients: number
  leads: number
  contacted: number
  negotiating: number
  clients: number
  lost: number
  emailsSent: number
  aiSearches: number
}

// Client form data
export interface ClientFormData {
  company_name: string
  contact_name: string
  email: string
  phone: string
  whatsapp_link: string
  website: string
  linkedin_url: string
  instagram_url: string
  city: string
  state: string
  status: ClientStatus
  priority: ClientPriority
  notes: string
  source: string
}

// Email form data
export interface EmailFormData {
  to_email: string
  subject: string
  body: string
  template_id?: string
}

// Gemini search result
export interface GeminiSearchResult {
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  city?: string
  state?: string
  description?: string
  address?: string
  website_data?: any
  full_company_data?: any
}

// Potential client (lead before approval)
export interface PotentialClient {
  id: string
  company_name: string
  status: PotentialClientStatus
  labels: string[]
  ai_search_id: string | null
  full_company_data: any
  has_analysis?: boolean
  created_at: string
  updated_at: string
}

// Client label for tagging
export interface ClientLabel {
  id: string
  name: string
  color: string
  is_system: boolean
  created_at: string
}
