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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Dashboard</h1>
          <p className="text-base font-bold text-slate-500 tracking-tight">
            Bem-vindo ao seu ecossistema de <span className="text-slate-900 dark:text-white underline decoration-[3px] decoration-primary underline-offset-4">gestão e inteligência</span>.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="default" 
            onClick={refreshData} 
            className="h-10 px-5 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            asChild 
            size="default" 
            className="h-10 px-5 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all"
          >
            <Link href="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              NOVO CLIENTE
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats!} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all">
          <CardContent className="p-6">
            <Link href="/search" className="block space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Buscar Leads com IA</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                  Use o Gemini para encontrar agências
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all">
          <CardContent className="p-6">
            <Link href="/emails" className="block space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Enviar Emails</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                  Comunicação estratégica ativa
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all">
          <CardContent className="p-6">
            <Link href="/portfolio" className="block space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                <Image className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Ver Portfolio</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                  Seus melhores trabalhos aqui
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Clientes Recentes</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
              Últimos registros adicionados ao CRM
            </CardDescription>
          </div>
          <Button variant="outline" size="default" asChild className="h-10 px-5 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all">
            <Link href="/clients">
              Ver Todos
              <ExternalLink className="h-4 w-4 ml-2" />
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
