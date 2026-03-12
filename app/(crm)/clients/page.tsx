'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClientsTable } from '@/components/crm/clients-table'
import { Client, ClientStatus } from '@/lib/types'
import { Plus, Search, RefreshCw, Users, UserPlus, MessageSquare, CheckCircle2, XCircle, TrendingUp, Phone, Globe } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [session, setSession] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Obter a sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [supabase])

  const queryParams = new URLSearchParams()
  if (statusFilter !== 'all') queryParams.set('status', statusFilter)
  if (searchTerm) queryParams.set('search', searchTerm)

  const { data: clients, mutate, isValidating } = useSWR<Client[]>(
    `/api/clients?${queryParams.toString()}`,
    fetcher,
    { fallbackData: [] }
  )

  // Calcular estatísticas
  const stats = {
    total: clients?.length || 0,
    leads: clients?.filter(c => c.status === 'lead').length || 0,
    negotiating: clients?.filter(c => c.status === 'negotiating').length || 0,
    converted: clients?.filter(c => c.status === 'client').length || 0,
    lost: clients?.filter(c => c.status === 'lost').length || 0,
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Tem certeza que deseja excluir ${ids.length} cliente(s)?`)) return

    try {
      // Obter o token de acesso
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        alert('Você precisa estar logado para realizar esta ação')
        return
      }

      const response = await fetch('/api/clients/bulk-delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids })
      })

      if (response.ok) {
        mutate()
      } else {
        const error = await response.json()
        alert(`Erro ao excluir clientes: ${error.error}`)
      }
    } catch (error) {
      console.error('Error bulk deleting clients:', error)
      alert('Erro ao excluir clientes')
    }
  }

  const handleStatusChange = async (id: string, status: ClientStatus) => {
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      mutate()
    } catch (error) {
      console.error('Error updating client status:', error)
    }
  }

  return (
    <div className="space-y-6 pb-16 px-4 md:px-0">
      {/* Header - Neo-brutalismo Suave */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 p-6 md:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-900 dark:bg-slate-950 border-2 border-black dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <Users className="h-3 w-3 text-blue-400 dark:text-blue-600" />
              <span className="text-[8px] font-black text-white dark:text-slate-400 tracking-[0.2em] uppercase">CRM & Vendas Profissional</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Gestão de <span className="text-primary">Contatos</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg font-bold leading-relaxed">
              Visualize, organize e converta seus <span className="text-slate-900 dark:text-white underline decoration-primary decoration-4 underline-offset-4">leads</span> em clientes reais com o poder da inteligência.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing || isValidating}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 text-slate-900 dark:text-white font-black uppercase tracking-widest text-[9px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 group"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-primary transition-transform duration-700 ${isRefreshing ? 'rotate-180' : 'group-hover:rotate-180'}`} />
              {isRefreshing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            
            <Link 
              href="/clients/new"
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px] border-[3px] border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all group"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Novo Contato
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats - Neo-brutalismo Suave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Contatos', value: stats.total, icon: Users, color: 'bg-blue-600', shadow: 'rgba(59,130,246,1)', trend: '+12%' },
          { label: 'Leads Ativos', value: stats.leads, icon: UserPlus, color: 'bg-amber-500', shadow: 'rgba(245,158,11,1)', trend: '+5%' },
          { label: 'Em Negociação', value: stats.negotiating, icon: MessageSquare, color: 'bg-indigo-600', shadow: 'rgba(79,70,229,1)', trend: '8 total' },
          { label: 'Convertidos', value: stats.converted, icon: CheckCircle2, color: 'bg-emerald-600', shadow: 'rgba(16,185,129,1)', trend: 'Este mês' }
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white dark:bg-slate-900 p-5 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
          >
            <div className="relative flex items-center gap-4">
              <div className={`p-3 rounded-xl ${kpi.color} text-white border-2 border-black dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-3 transition-transform`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-0.5">{kpi.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h3>
                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-100 dark:border-emerald-900/30 px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(16,185,129,0.2)]">
                    <TrendingUp className="h-2 w-2" />
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area - Neo-brutalismo Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start relative min-h-[800px]">
        {/* Sidebar de Filtros - FIXA NO DESKTOP */}
        <aside className="w-full lg:w-64 lg:sticky lg:top-24 space-y-4 z-30 self-start h-fit pb-10">
          {/* Busca - Design Neo-brutalista Suave */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-950 focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 uppercase tracking-tight text-[10px]"
            />
          </div>

          {/* Filtros de Status Verticais - Estilo Neo-brutalista Padrão */}
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border-2 border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden">
            <div className="p-4 border-b-2 border-slate-900 dark:border-slate-950 flex items-center justify-between">
              <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-2.5 w-2.5 text-primary" />
                Filtros de Status
              </h3>
              {(searchTerm || statusFilter !== 'all') && (
                <button 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="text-[8px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="p-1.5 space-y-0.5">
              {[
                { id: 'all', label: 'Todos', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-800' },
                { id: 'lead', label: 'Leads', icon: UserPlus, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-800' },
                { id: 'contacted', label: 'Contatados', icon: MessageSquare, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30', borderColor: 'border-indigo-200 dark:border-indigo-800' },
                { id: 'negotiating', label: 'Em Negociação', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30', borderColor: 'border-purple-200 dark:border-purple-800' },
                { id: 'client', label: 'Convertidos', icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800' },
                { id: 'lost', label: 'Perdidos', icon: XCircle, color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-950/30', borderColor: 'border-rose-200 dark:border-rose-800' },
                { id: 'no_contacts', label: 'Sem Contato', icon: Phone, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950/30', borderColor: 'border-pink-200 dark:border-pink-800' },
                { id: 'site_broken', label: 'Site com Erro', icon: Globe, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30', borderColor: 'border-orange-200 dark:border-orange-800' },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setStatusFilter(status.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                    statusFilter === status.id 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] translate-x-0.5 -translate-y-0.5' 
                    : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded-lg border-2 transition-all ${
                      statusFilter === status.id 
                      ? 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white' 
                      : `${status.bgColor} ${status.borderColor}`
                    }`}>
                      <status.icon className={`h-3 w-3 ${
                        statusFilter === status.id ? status.color : status.color
                      } stroke-[2.5px]`} />
                    </div>
                    <span className={statusFilter === status.id ? 'text-white dark:text-slate-900' : ''}>
                      {status.label}
                    </span>
                  </div>
                  
                  {statusFilter === status.id && (
                    <motion.div 
                      layoutId="activeStatus"
                      className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.5)]" 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Área da Tabela */}
        <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-[2.5rem] border-[4px] border-slate-900 dark:border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden transition-all">
          <div className="p-0">
            <ClientsTable 
              clients={clients || []} 
              onDelete={handleDeleteClient}
              onStatusChange={handleStatusChange}
              onBulkDelete={handleBulkDelete}
              onUpdate={() => mutate()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
