'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExternalLink, Play, Image as ImageIcon, Film, Eye, Calendar, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  category: string | null
  thumbnail_url: string | null
  media_urls: string[]
  source_table: string | null
  created_at: string
}

interface PortfolioGalleryProps {
  socialMedia: PortfolioItem[]
  drone: PortfolioItem[]
  portfolio: PortfolioItem[]
  all: PortfolioItem[]
}

export function PortfolioGallery({ socialMedia, drone, portfolio, all }: PortfolioGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const getItemsForTab = (tab: string) => {
    switch (tab) {
      case 'social': return socialMedia
      case 'drone': return drone
      case 'portfolio': return portfolio
      default: return all
    }
  }

  const getCategoryIcon = (category: string | null) => {
    if (category?.toLowerCase().includes('drone') || category?.toLowerCase().includes('video')) {
      return <Film className="h-3 w-3" />
    }
    return <ImageIcon className="h-3 w-3" />
  }

  const isVideo = (url: string | null) => {
    if (!url) return false
    return url.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm')
  }

  return (
    <div className="space-y-12">
      {/* Tabs Customizadas Neo-brutais */}
      <div className="flex flex-wrap gap-4 p-2 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
        {[
          { id: 'all', label: 'Todos', count: all.length },
          { id: 'social', label: 'Social Media', count: socialMedia.length },
          { id: 'drone', label: 'Drone & Video', count: drone.length },
          { id: 'portfolio', label: 'Portfolio Web', count: portfolio.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] translate-x-0.5 -translate-y-0.5"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-2 py-0.5 rounded-lg border-2 text-[9px]",
              activeTab === tab.id 
                ? "bg-primary border-slate-900 dark:border-white text-white" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de Conteúdo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {getItemsForTab(activeTab).length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
                <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nenhum item nesta categoria ainda.</p>
            </div>
          ) : (
            getItemsForTab(activeTab).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="group cursor-pointer"
              >
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]">
                  {/* Thumbnail Container */}
                  <div className="aspect-[4/3] relative bg-slate-100 dark:bg-slate-800 overflow-hidden border-b-[3px] border-slate-900 dark:border-slate-950">
                    {item.thumbnail_url ? (
                      <>
                        {isVideo(item.thumbnail_url) ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-12 w-12 text-primary fill-primary/20" />
                          </div>
                        ) : (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.parentElement?.insertAdjacentHTML('beforeend', '<div class="absolute inset-0 flex items-center justify-center"><ImageIcon class="h-12 w-12 text-slate-300" /></div>')
                            }}
                          />
                        )}
                        {/* Overlay on Hover */}
                        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transform -translate-y-4 group-hover:translate-y-0 transition-transform">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Ver Detalhes
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                      </div>
                    )}
                    
                    {/* Category Badge - Floating */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          {item.category || 'Geral'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-6 space-y-3">
                    <h3 className="font-black text-slate-900 dark:text-white line-clamp-1 uppercase tracking-tighter text-lg italic">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="pt-4 flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-400 group-hover:text-primary group-hover:border-primary transition-all">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal de Detalhes Neo-brutalista */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0 border-[4px] border-slate-900 dark:border-white rounded-[3rem] shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden bg-white dark:bg-slate-900">
          {selectedItem && (
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Media Section */}
              <div className="md:w-3/5 bg-slate-100 dark:bg-slate-950 border-b-[4px] md:border-b-0 md:border-r-[4px] border-slate-900 dark:border-white flex items-center justify-center p-4">
                <div className="w-full aspect-video relative rounded-2xl overflow-hidden border-[3px] border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                  {selectedItem.thumbnail_url && isVideo(selectedItem.thumbnail_url) ? (
                    <video
                      src={selectedItem.thumbnail_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  ) : selectedItem.thumbnail_url ? (
                    <img
                      src={selectedItem.thumbnail_url}
                      alt={selectedItem.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-24 w-24 text-slate-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Details Section */}
              <div className="md:w-2/5 p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 border-2 border-primary text-primary">
                      <Tag className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{selectedItem.category || 'Geral'}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">{selectedItem.title}</h2>
                  </div>

                  {selectedItem.description && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sobre o projeto</h4>
                      <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{selectedItem.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Sincronizado em</h4>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{new Date(selectedItem.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Origem</h4>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{selectedItem.source_table?.replace('_', ' ') || 'Site Principal'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-4">
                  {selectedItem.media_urls && selectedItem.media_urls.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {selectedItem.media_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-1 hover:-translate-y-1 active:shadow-none transition-all group"
                        >
                          Ver Media Original {index + 1}
                          <ExternalLink className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </a>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
