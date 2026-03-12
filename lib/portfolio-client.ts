// Client for fetching portfolio data from external Supabase (thierrycreative)
import { createClient } from '@supabase/supabase-js'

const PORTFOLIO_SUPABASE_URL = 'https://ojltyvxgkgnqzrwziduu.supabase.co'
const PORTFOLIO_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbHR5dnhna2ducXpyd3ppZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjkwOTUsImV4cCI6MjA2NTAwNTA5NX0.aKWK1pMOf60-tqdhJvRx6UoVS4YIOCsRKFu6zwaHC5M'

export function createPortfolioClient() {
  return createClient(PORTFOLIO_SUPABASE_URL, PORTFOLIO_SUPABASE_ANON_KEY)
}

export interface SocialMediaContent {
  id: string
  title: string
  description: string | null
  category: string | null
  tool: string | null
  thumbnail_url: string | null
  media_url: string[] | null
  client_name: string | null
  platform: string | null
  status: string
  featured: boolean
  created_at: string
}

export interface DroneContent {
  id: string
  title: string
  description: string | null
  category: string | null
  client_name: string | null
  thumbnail_url: string | null
  media_url: string[] | null
  filming_quality: string | null
  drone_model: string | null
  status: string
  featured: boolean
  created_at: string
}

export interface PortfolioMedia {
  id: number
  filename: string
  url: string
  type: string
  category: string | null
  created_at: string
}

export async function fetchSocialMediaContent() {
  const client = createPortfolioClient()
  const { data, error } = await client
    .from('social_media_content')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching social media content:', error)
    return []
  }
  return data as SocialMediaContent[]
}

export async function fetchDroneContent() {
  const client = createPortfolioClient()
  const { data, error } = await client
    .from('drone_content')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching drone content:', error)
    return []
  }
  return data as DroneContent[]
}

export async function fetchPortfolioMedia() {
  const client = createPortfolioClient()
  const { data, error } = await client
    .from('portfolio_media')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching portfolio media:', error)
    return []
  }
  return data as PortfolioMedia[]
}

export async function fetchAllPortfolioItems() {
  const [socialMedia, drone, portfolio] = await Promise.all([
    fetchSocialMediaContent(),
    fetchDroneContent(),
    fetchPortfolioMedia()
  ])

  return {
    socialMedia,
    drone,
    portfolio,
    all: [
      ...socialMedia.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category || 'Social Media',
        thumbnail_url: item.thumbnail_url,
        media_urls: item.media_url || [],
        source_table: 'social_media_content',
        created_at: item.created_at
      })),
      ...drone.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category || 'Drone',
        thumbnail_url: item.thumbnail_url,
        media_urls: item.media_url || [],
        source_table: 'drone_content',
        created_at: item.created_at
      })),
      ...portfolio.map(item => ({
        id: String(item.id),
        title: item.filename,
        description: null,
        category: item.category || item.type || 'Portfolio',
        thumbnail_url: item.url,
        media_urls: [item.url],
        source_table: 'portfolio_media',
        created_at: item.created_at
      }))
    ]
  }
}
