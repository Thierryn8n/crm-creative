'use client'

import { PortfolioGallery } from '@/components/crm/portfolio-gallery'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw, Image, Film, Folder } from 'lucide-react'
import useSWR from 'swr'
import Link from 'next/link'

import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface PortfolioData {
  socialMedia: Array<{
    id: string
    title: string
    description: string | null
    category: string | null
    thumbnail_url: string | null
    media_urls: string[]
    source_table: string | null
    created_at: string
  }>
  drone: Array<{
    id: string
    title: string
    description: string | null
    category: string | null
    thumbnail_url: string | null
    media_urls: string[]
    source_table: string | null
    created_at: string
  }>
  portfolio: Array<{
    id: string
    title: string
    description: string | null
    category: string | null
    thumbnail_url: string | null
    media_urls: string[]
    source_table: string | null
    created_at: string
  }>
  all: Array<{
    id: string
    title: string
    description: string | null
    category: string | null
    thumbnail_url: string | null
    media_urls: string[]
    source_table: string | null
    created_at: string
  }>
  stats: {
    totalItems: number
    socialMediaCount: number
    droneCount: number
    portfolioCount: number
  }
}

export default function PortfolioPage() {
  const { data, error, isLoading, mutate } = useSWR<PortfolioData>(
    '/api/portfolio',
    fetcher,
    {
      fallbackData: {
        socialMedia: [],
        drone: [],
        portfolio: [],
        all: [],
        stats: {
          totalItems: 0,
          socialMediaCount: 0,
          droneCount: 0,
          portfolioCount: 0
        }
      }
    }
  )

  return (
    <div className="space-y-12 pb-20">
      {/* Header - Neo-brutalismo Suave */}
      <div className="relative overflow-hidden rounded-[3rem] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 p-10 md:p-14 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-slate-900 dark:bg-slate-950 border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <Folder className="h-4 w-4 text-blue-400 dark:text-blue-600" />
              <span className="text-[10px] font-black text-white dark:text-slate-400 tracking-[0.2em] uppercase">Vitrine de Projetos</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Nosso <span className="text-primary italic">Portfolio</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl font-bold leading-relaxed">
              Visualize e compartilhe seus trabalhos sincronizados diretamente do <span className="text-slate-900 dark:text-white underline decoration-primary decoration-4 underline-offset-4 italic">site principal</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-5">
            <button 
              onClick={() => mutate()}
              disabled={isLoading}
              className="flex items-center gap-3 px-8 py-5 rounded-2xl bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 group"
            >
              <RefreshCw className={`h-5 w-5 text-primary transition-transform duration-700 ${isLoading ? 'rotate-180' : 'group-hover:rotate-180'}`} />
              {isLoading ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <a 
              href="https://thierrycreative.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all group"
            >
              <ExternalLink className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Ver Site Ao Vivo
            </a>
          </div>
        </div>
      </div>

      {/* Stats - Cards Neo-brutais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total de Itens', value: data?.stats.totalItems || 0, icon: Folder, color: 'bg-slate-900', shadow: 'rgba(0,0,0,1)' },
          { label: 'Social Media', value: data?.stats.socialMediaCount || 0, icon: Image, color: 'bg-blue-600', shadow: 'rgba(59,130,246,1)' },
          { label: 'Drone & Video', value: data?.stats.droneCount || 0, icon: Film, color: 'bg-amber-500', shadow: 'rgba(245,158,11,1)' },
          { label: 'Portfolio Web', value: data?.stats.portfolioCount || 0, icon: Folder, color: 'bg-emerald-600', shadow: 'rgba(16,185,129,1)' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <div className="flex items-center gap-6">
              <div className={`p-5 rounded-2xl ${stat.color} text-white border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-3 transition-transform`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Galeria - Container Neo-brutalista */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
        <div className="p-8 md:p-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-[4px] border-primary border-t-transparent shadow-lg" />
              <p className="font-black uppercase tracking-widest text-xs text-slate-500 animate-pulse">Sincronizando sua arte...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-8">
              <div className="p-8 rounded-[2.5rem] bg-rose-50 dark:bg-rose-950/20 border-[3px] border-rose-600 text-rose-600 shadow-[8px_8px_0px_0px_rgba(225,29,72,0.1)]">
                <RefreshCw className="h-16 w-16 opacity-50" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Opa! Algo deu errado.</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto uppercase text-[10px] tracking-widest leading-relaxed">Não conseguimos conectar com o servidor do portfolio. Tente novamente em instantes.</p>
              </div>
              <button 
                onClick={() => mutate()}
                className="px-10 py-5 rounded-2xl bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:-translate-y-1 transition-all"
              >
                Tentar Sincronizar Novamente
              </button>
            </div>
          ) : (
            <PortfolioGallery
              socialMedia={data?.socialMedia || []}
              drone={data?.drone || []}
              portfolio={data?.portfolio || []}
              all={data?.all || []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
