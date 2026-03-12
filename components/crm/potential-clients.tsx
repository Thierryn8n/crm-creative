'use client'

import { useState, useEffect } from 'react'
import { PotentialClient } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Building2, Mail, Phone, Globe, Check, X, Eye, Plus, MapPin, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface PotentialClientsProps {
  onApproveClients: (clients: PotentialClient[]) => Promise<void>
}

export function PotentialClients({ onApproveClients }: PotentialClientsProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<PotentialClient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  const fetchPotentialClients = async () => {
    try {
      const response = await fetch('/api/potential-clients')
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar potenciais clientes.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPotentialClients()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      potential: { label: 'Potencial', color: 'bg-blue-100 text-blue-800' },
      analyzing: { label: 'Analisando', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
      contacted: { label: 'Contactado', color: 'bg-purple-100 text-purple-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.potential
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const toggleSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients)
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId)
    } else {
      newSelection.add(clientId)
    }
    setSelectedClients(newSelection)
  }

  const handleApprove = async (action: 'approve' | 'reject') => {
    if (selectedClients.size === 0) {
      toast({
        title: 'Selecione clientes',
        description: 'Selecione ao menos um cliente para aprovar/rejeitar.'
      })
      return
    }

    setProcessing(true)
    try {
      const selectedClientList = clients.filter(c => selectedClients.has(c.id))
      
      if (action === 'approve') {
        await onApproveClients(selectedClientList)
        toast({
          title: 'Clientes aprovados',
          description: `${selectedClientList.length} cliente(s) movido(s) para clientes.`
        })
      } else {
        // Rejeitar clientes
        for (const client of selectedClientList) {
          await fetch(`/api/potential-clients/${client.id}/reject`, {
            method: 'PATCH'
          })
        }
        toast({
          title: 'Clientes rejeitados',
          description: `${selectedClientList.length} cliente(s) rejeitado(s).`
        })
      }
      
      setSelectedClients(new Set())
      fetchPotentialClients()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao processar clientes.',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-[3px] border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-900/10 dark:border-white/10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Carregando Leads...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card className="border-[3px] border-slate-900 dark:border-white border-dashed bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
        <CardContent className="text-center py-32">
          <div className="max-w-md mx-auto space-y-10">
            <div className="h-32 w-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)]">
              <Users className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nenhum Lead Pendente</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-bold leading-relaxed">
                Sua lista de clientes potenciais está vazia. Use a busca com IA para encontrar novas oportunidades.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-slate-950 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-xl border-[3px] border-black dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white italic">
                  Clientes Potenciais
                </CardTitle>
              </div>
              <CardDescription className="text-slate-500 dark:text-slate-400 font-bold text-base uppercase tracking-tight ml-2">
                {clients.length} leads aguardando sua análise estratégica • <span className="text-primary">{selectedClients.size} selecionadas</span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClients(new Set(clients.map(c => c.id)))}
                className="rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                Selecionar Todos
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove('approve')}
                disabled={selectedClients.size === 0 || processing}
                className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest h-12 px-8 border-[3px] border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <Check className="h-5 w-5 mr-3" />
                )}
                APROVAR SELECIONADOS
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleApprove('reject')}
                disabled={selectedClients.size === 0 || processing}
                className="rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-6 border-[3px] border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.5)] dark:shadow-[4px_4px_0px_0px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                <X className="h-5 w-5 mr-3" />
                REJEITAR
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className={`p-4 rounded-[1.5rem] border-[3px] transition-all cursor-pointer relative group overflow-hidden ${
                  selectedClients.has(client.id) 
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] dark:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.4)] translate-x-[-4px] translate-y-[-4px]' 
                    : 'border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 hover:border-primary dark:hover:border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                }`}
                onClick={() => toggleSelection(client.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <div className={`h-8 w-8 rounded-lg border-[3px] border-slate-900 dark:border-slate-950 flex items-center justify-center transition-all ${
                      selectedClients.has(client.id) ? 'bg-primary border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)]'
                    }`}>
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => toggleSelection(client.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 w-6 border-none data-[state=checked]:bg-transparent data-[state=checked]:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    {(() => {
                      const data = client.full_company_data || {};
                      const contactName = (client as any).contact_name || data.contact_name;
                      const email = (client as any).email || data.email;
                      const phone = (client as any).phone || data.phone;
                      const website = (client as any).website || data.website || data.found_url;
                      const linkedin = (client as any).linkedin_url || data.linkedin_url;
                      const instagram = (client as any).instagram_url || data.instagram_url;
                      const facebook = (client as any).facebook_url || data.facebook_url;
                      const twitter = (client as any).twitter_url || data.twitter_url;
                      const city = (client as any).city || data.city;
                      const state = (client as any).state || data.state;
                      const description = (client as any).description || data.description;

                      // Construir query string para o link de análise
                      const analysisParams = new URLSearchParams();
                      analysisParams.set('id', client.id);
                      analysisParams.set('name', client.company_name);
                      if (website) analysisParams.set('website', website);
                      if (linkedin) analysisParams.set('linkedin', linkedin);
                      if (instagram) analysisParams.set('instagram', instagram);
                      if (facebook) analysisParams.set('facebook', facebook);
                      if (twitter) analysisParams.set('twitter', twitter);

                      const detailUrl = `/company-detail?${analysisParams.toString()}`;

                      return (
                        <>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex flex-wrap items-center gap-6">
                              <div className="h-14 w-14 rounded-xl bg-slate-50 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:border-primary group-hover:rotate-6 transition-all duration-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                                <Building2 className="h-7 w-7" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <Link 
                                    href={detailUrl}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-2xl font-black text-slate-900 dark:text-white hover:text-primary transition-colors uppercase tracking-tighter block italic"
                                  >
                                    {client.company_name}
                                  </Link>
                                  {client.has_analysis && (
                                    <div className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" title="Análise da IA disponível"></span>
                                    </div>
                                  )}
                                </div>
                                <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-black dark:border-slate-950 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] dark:shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)]">
                                  {client.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                            >
                              <Link href={detailUrl}>
                                <Eye className="h-5 w-5 mr-3" />
                                ANÁLISE COMPLETA
                              </Link>
                            </Button>
                          </div>

                          {description && (
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                              <p className="text-slate-600 dark:text-slate-400 font-bold text-base leading-relaxed italic">{description}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs border-t-[3px] border-slate-50 dark:border-slate-800 pt-6 mt-6">
                            {contactName && (
                              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tight">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border-2 border-slate-900/10 dark:border-white/10">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <span>{contactName}</span>
                              </div>
                            )}
                            {email && (
                              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tight">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border-2 border-slate-900/10 dark:border-white/10">
                                  <Mail className="h-4 w-4 text-blue-500" />
                                </div>
                                <span className="truncate">{email}</span>
                              </div>
                            )}
                            {phone && (
                              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tight">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border-2 border-slate-900/10 dark:border-white/10">
                                  <Phone className="h-4 w-4 text-emerald-500" />
                                </div>
                                <span>{phone}</span>
                              </div>
                            )}
                            {website && (
                              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tight">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border-2 border-slate-900/10 dark:border-white/10">
                                  <Globe className="h-4 w-4 text-indigo-500" />
                                </div>
                                <span className="truncate">{website}</span>
                              </div>
                            )}
                            {city && state && (
                              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tight">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border-2 border-slate-900/10 dark:border-white/10">
                                  <MapPin className="h-4 w-4 text-amber-500" />
                                </div>
                                <span>{city}, {state}</span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}

                    {(client as any).rejection_reason && (
                      <div className="mt-6 p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border-[3px] border-red-900/20 dark:border-red-500/20 text-red-900 dark:text-red-400 shadow-[3px_3px_0px_0px_rgba(239,68,68,0.1)]">
                        <strong className="font-black uppercase tracking-[0.2em] text-[10px] block mb-2 text-red-600 dark:text-red-400">Motivo da Rejeição</strong>
                        <p className="font-bold text-base">{(client as any).rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
