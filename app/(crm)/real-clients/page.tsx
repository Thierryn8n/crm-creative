'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, ClientStatus } from '@/lib/types'
import { Plus, Search, RefreshCw, Users, TrendingUp, DollarSign, Filter, ArrowRight, Star, Zap, Activity, Building2, MapPin, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RealClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('client')

  const queryParams = new URLSearchParams()
  if (statusFilter !== 'all') queryParams.set('status', statusFilter)
  if (searchTerm) queryParams.set('search', searchTerm)

  const { data: clients, mutate } = useSWR<Client[]>(
    `/api/clients?${queryParams.toString()}`,
    fetcher,
    { fallbackData: [] }
  )

  // Filtrar apenas clientes reais (excluir leads e contatos)
  const realClients = (clients || []).filter(client => 
    client.status === 'client'
  )

  const handleRefresh = () => {
    mutate()
  }

  // Estatísticas
  const totalClients = realClients.length
  const activeClients = realClients.filter(c => c.status === 'client').length
  
  // Extrair receita (se houver no full_company_data ou se houver campo valor)
  const totalRevenue = realClients.reduce((acc, client) => {
    const data = client.full_company_data || {};
    const value = data.monthly_value || data.revenue || 0;
    return acc + (typeof value === 'number' ? value : parseFloat(value) || 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-6 md:p-10 animate-in fade-in duration-700">
      {/* Header - Neo-brutalismo Suave */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 pb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)]">
              <Users className="h-7 w-7" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Gestão de <span className="text-primary">Clientes</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xl font-bold leading-relaxed max-w-2xl">
            Gerencie seus clientes ativos e histórico estratégico com o suporte da <span className="text-slate-900 dark:text-white underline decoration-primary decoration-4 underline-offset-4">Inteligência Artificial</span>.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleRefresh} 
            className="rounded-2xl border-[3px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-14 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <RefreshCw className="h-4 w-4 mr-3" />
            Sincronizar
          </Button>
          <Button 
            asChild 
            size="lg" 
            className="rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs h-14 px-10 border-[3px] border-slate-900 dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Link href="/real-clients/new">
              <Plus className="h-5 w-5 mr-2" />
              NOVO CLIENTE
            </Link>
          </Button>
        </div>
      </div>

      {/* Estatísticas - Neo-brutalismo Suave */}
      <div className="grid gap-8 md:grid-cols-3">
        {[
          { label: 'Base de Clientes', value: totalClients, icon: Users, color: 'text-primary', bg: 'bg-primary/10 dark:bg-primary/20', shadow: 'rgba(59,130,246,1)', darkShadow: 'rgba(59,130,246,0.4)' },
          { label: 'Faturamento Mensal', value: `R$ ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', shadow: 'rgba(16,185,129,1)', darkShadow: 'rgba(16,185,129,0.4)' },
          { label: 'Taxa de Retenção', value: '98%', icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30', shadow: 'rgba(79,70,229,1)', darkShadow: 'rgba(79,70,229,0.4)' }
        ].map((stat, i) => (
          <Card key={i} className="border-[3px] border-slate-900 dark:border-slate-700 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_var(--shadow-color)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]" style={{ '--shadow-color': stat.shadow, '--dark-shadow-color': stat.darkShadow } as any}>
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                  <div className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{stat.value}</div>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} border-2 border-black dark:border-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="h-full bg-slate-900 dark:bg-primary rounded-full" style={{ width: '75%' }} />
                </div>
                <span className="text-[10px] font-black text-slate-900 dark:text-slate-300">75%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca e Filtros - Neo-brutalismo Suave */}
      <div className="p-2 rounded-[3rem] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-700 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)]">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-6 flex flex-col lg:flex-row gap-6 border-2 border-slate-900/5 dark:border-white/5">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Pesquisar por empresa, decisor ou domínio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-16 h-16 rounded-[1.8rem] border-[3px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 focus-visible:ring-8 focus-visible:ring-primary/10 text-lg font-black placeholder:text-slate-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] focus:shadow-none transition-all dark:text-white"
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[260px] h-16 rounded-[1.8rem] border-[3px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] focus:shadow-none transition-all px-8">
                <div className="flex items-center gap-3">
                  <Filter className="h-4 w-4 text-primary" />
                  <SelectValue placeholder="Filtrar Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[3px] border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] p-2">
                <SelectItem value="all" className="font-black py-4 rounded-xl uppercase tracking-widest text-[10px] focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer dark:text-white">Todos os Clientes</SelectItem>
                <SelectItem value="client" className="font-black py-4 rounded-xl uppercase tracking-widest text-[10px] focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer dark:text-white">Cliente Ativo</SelectItem>
                <SelectItem value="active" className="font-black py-4 rounded-xl uppercase tracking-widest text-[10px] focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer dark:text-white">Status: Ativo</SelectItem>
                <SelectItem value="inactive" className="font-black py-4 rounded-xl uppercase tracking-widest text-[10px] focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer dark:text-white">Status: Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Clientes - Neo-brutalismo Suave */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4 uppercase">
            <div className="p-2 bg-primary rounded-lg border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Portfólio de Clientes
          </h2>
          <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 py-2 rounded-full border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] uppercase tracking-widest text-[10px]">
            {realClients.length} RESULTADOS
          </Badge>
        </div>

        {realClients.length === 0 ? (
          <Card className="border-[3px] border-slate-900 dark:border-slate-700 border-dashed bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
            <CardContent className="flex flex-col items-center py-32 text-center">
              <div className="h-32 w-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-10 border-[3px] border-slate-900 dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)]">
                <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Nenhum Cliente Ativo</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-xl font-bold leading-relaxed mb-10">
                Sua base de clientes reais está vazia. Comece transformando leads em clientes ou crie um novo agora.
              </p>
              <Button asChild size="lg" className="rounded-2xl bg-primary text-primary-foreground font-black px-12 h-16 border-[3px] border-slate-900 dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                <Link href="/real-clients/new">
                  <Plus className="h-6 w-6 mr-4" />
                  ADICIONAR PRIMEIRO CLIENTE
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {realClients.map((client) => {
              const data = client.full_company_data || {};
              const contactName = client.contact_name || data.contact_name;
              const email = client.email || data.email;
              const phone = client.phone || data.phone;
              const city = client.city || data.city;
              const state = client.state || data.state;
              const website = client.website || data.website;

              return (
                <Card key={client.id} className="group border-[3px] border-slate-900 dark:border-blue-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.4)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.6)]">
                  <CardContent className="p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-8 flex-1">
                        <div className="h-24 w-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary dark:group-hover:border-primary group-hover:rotate-3 transition-all duration-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                          {website ? (
                            <img 
                              src={`https://www.google.com/s2/favicons?sz=128&domain=${website}`} 
                              alt="" 
                              className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<Building2 class="h-12 w-12" />');
                              }}
                            />
                          ) : (
                            <Building2 className="h-12 w-12" />
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{client.company_name}</h3>
                            <Badge className={`${
                              client.status === 'client' || client.status === 'active' 
                                ? 'bg-emerald-500 text-white border-black dark:border-slate-700' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-black dark:border-slate-700'
                            } font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-xl border-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]`}>
                              {client.status === 'client' ? 'CLIENTE ATIVO' : 'STATUS: ATIVO'}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                            {contactName && (
                              <div className="flex items-center gap-3 text-base font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                                <Users className="h-5 w-5 text-primary" />
                                {contactName}
                              </div>
                            )}
                            {city && (
                              <div className="flex items-center gap-3 text-base font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                <MapPin className="h-5 w-5 text-blue-500" />
                                {city}{state ? `, ${state}` : ''}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 pt-2">
                            {email && (
                              <Badge variant="outline" className="rounded-2xl font-black border-[3px] border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-5 uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                                <Mail className="h-4 w-4 mr-3 text-primary" />
                                {email}
                              </Badge>
                            )}
                            {phone && (
                              <Badge variant="outline" className="rounded-2xl font-black border-[3px] border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white py-2.5 px-5 uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                                <Phone className="h-4 w-4 mr-3 text-primary" />
                                {phone}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-5 lg:border-l-[3px] lg:pl-10 lg:border-slate-100 dark:lg:border-slate-800">
                        <Button asChild className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-10 h-16 border-[3px] border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(59,130,246,0.5)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                          <Link href={`/real-clients/${client.id}/ai`}>
                            <Zap className="h-5 w-5 mr-3 fill-blue-400 text-blue-400 dark:fill-blue-600 dark:text-blue-600" />
                            PAINEL IA
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-2xl bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-700 text-slate-900 dark:text-white font-black px-8 h-16 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] uppercase tracking-widest text-xs">
                          <Link href={`/clients/${client.id}`}>
                            DETALHES
                            <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-2 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
