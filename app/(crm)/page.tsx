'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/crm/stats-cards'
import { ClientsTable } from '@/components/crm/clients-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CRMStats, Client, ClientStatus } from '@/lib/types'
import { Plus, RefreshCw, ExternalLink, Search, Image, Mail } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardPage() {
  const { data: stats, mutate: mutateStats } = useSWR<CRMStats>('/api/stats', fetcher, {
    fallbackData: {
      totalClients: 0,
      leads: 0,
      contacted: 0,
      negotiating: 0,
      clients: 0,
      lost: 0,
      emailsSent: 0,
      aiSearches: 0
    }
  })

  const { data: recentClients, mutate: mutateClients } = useSWR<Client[]>(
    '/api/clients?limit=5',
    fetcher,
    { fallbackData: [] }
  )

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      mutateClients()
      mutateStats()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleStatusChange = async (id: string, status: ClientStatus) => {
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      mutateClients()
      mutateStats()
    } catch (error) {
      console.error('Error updating client status:', error)
    }
  }

  const refreshData = () => {
    mutateStats()
    mutateClients()
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-4">
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Dashboard</h1>
          <p className="text-xl font-bold text-slate-500 tracking-tight">
            Bem-vindo ao seu ecossistema de <span className="text-slate-900 dark:text-white underline decoration-[3px] decoration-primary underline-offset-4">gestão e inteligência</span>.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={refreshData} 
            className="h-16 px-8 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0"
          >
            <RefreshCw className="h-5 w-5 mr-3" />
            Atualizar
          </Button>
          <Button 
            asChild 
            size="lg" 
            className="h-16 px-8 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0"
          >
            <Link href="/clients/new">
              <Plus className="h-6 w-6 mr-3" />
              NOVO CLIENTE
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats!} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 group">
          <CardContent className="p-10">
            <Link href="/search" className="block space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-6 transition-transform">
                <Search className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Buscar Leads com IA</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                  Use o Gemini para encontrar agências
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 group">
          <CardContent className="p-10">
            <Link href="/emails" className="block space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-6 transition-transform">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Enviar Emails</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                  Comunicação estratégica ativa
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 group">
          <CardContent className="p-10">
            <Link href="/portfolio" className="block space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-6 transition-transform">
                <Image className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Ver Portfolio</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">
                  Seus melhores trabalhos aqui
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="p-10 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Clientes Recentes</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mt-2">
              Últimos registros adicionados ao CRM
            </CardDescription>
          </div>
          <Button variant="outline" size="lg" asChild className="h-14 px-8 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 active:shadow-none">
            <Link href="/clients">
              Ver Todos
              <ExternalLink className="h-5 w-5 ml-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ClientsTable 
            clients={recentClients?.slice(0, 5) || []} 
            onDelete={handleDeleteClient}
            onStatusChange={handleStatusChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
