'use client'

import { AISearch } from '@/components/crm/ai-search'
import { PotentialClients } from '@/components/crm/potential-clients'
import { GeminiSearchResult, PotentialClient } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Sparkles, Users } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleAddClients = async (clients: GeminiSearchResult[]) => {
    try {
      const results = await Promise.allSettled(
        clients.map(client =>
          fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_name: client.company_name,
              status: 'lead',
              priority: 'medium',
              source: 'gemini',
              ...client // Tudo o que veio do GeminiSearchResult vai para o full_company_data no server
            })
          })
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        toast({
          title: 'Parcialmente concluido',
          description: `${successful} cliente(s) adicionado(s), ${failed} falha(s).`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Sucesso',
          description: `${successful} cliente(s) adicionado(s) ao CRM.`
        })
      }

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar clientes.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleApproveClients = async (clients: PotentialClient[]) => {
    try {
      const results = await Promise.allSettled(
        clients.map(client => {
          // Consolidar todos os dados em full_company_data para seguir a tabela 006
          const { company_name, ...rest } = client;
          
          return fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_name,
              status: 'lead',
              priority: 'medium',
              source: 'gemini',
              full_company_data: {
                ...rest,
                collected_at: new Date().toISOString()
              }
            })
          })
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        toast({
          title: 'Parcialmente concluido',
          description: `${successful} cliente(s) aprovado(s), ${failed} falha(s).`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Sucesso',
          description: `${successful} cliente(s) aprovado(s) e adicionado(s) ao CRM.`
        })
      }

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao aprovar clientes.',
        variant: 'destructive'
      })
      throw error
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-6 md:p-10 animate-in fade-in duration-700">
      {/* Header - Neo-brutalismo Suave */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-black dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
              <Search className="h-8 w-8" />
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
              Busca de <span className="text-primary">Leads</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xl font-bold leading-relaxed max-w-2xl uppercase tracking-tight">
            Encontre novos clientes potenciais usando o poder da <span className="text-slate-900 dark:text-white underline decoration-primary decoration-8 underline-offset-8">Inteligência Artificial</span>.
          </p>
        </div>
      </div>

      <Tabs defaultValue="search" className="space-y-12">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)] inline-flex w-full sm:w-auto">
          <TabsList className="bg-transparent rounded-none p-0 h-auto flex flex-col sm:flex-row gap-3 border-none w-full sm:w-auto">
            <TabsTrigger 
              value="search" 
              className="rounded-[1.5rem] px-12 py-5 font-black text-sm uppercase tracking-widest data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.5)] transition-all flex items-center gap-3 w-full sm:w-auto text-slate-500 dark:text-slate-400"
            >
              <Sparkles className="h-5 w-5" />
              Busca com IA
            </TabsTrigger>
            <TabsTrigger 
              value="potential" 
              className="rounded-[1.5rem] px-12 py-5 font-black text-sm uppercase tracking-widest data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.5)] transition-all flex items-center gap-3 w-full sm:w-auto text-slate-500 dark:text-slate-400"
            >
              <Users className="h-5 w-5" />
              Clientes Potenciais
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="search" className="space-y-6 mt-0 focus-visible:outline-none">
          <AISearch onAddClients={handleAddClients} />
        </TabsContent>
        
        <TabsContent value="potential" className="space-y-6 mt-0 focus-visible:outline-none">
          <PotentialClients onApproveClients={handleApproveClients} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
