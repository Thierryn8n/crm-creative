'use client'

import { Client, ClientStatus } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Mail, Phone, Globe, Edit, Trash2, Eye, CheckSquare, Square, Building2, MapPin, Calendar, ExternalLink, MessageSquare, Users, Plus, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSWRConfig } from 'swr'

interface ClientsTableProps {
  clients: Client[]
  onDelete?: (id: string) => void
  onStatusChange?: (id: string, status: ClientStatus) => void
  onBulkDelete?: (ids: string[]) => void
  onUpdate?: () => void
}

const statusConfig: Record<ClientStatus, { label: string; color: string; bg: string; border: string }> = {
  lead: { label: 'Lead', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/30' },
  contacted: { label: 'Contatado', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/30' },
  negotiating: { label: 'Negociando', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-100 dark:border-indigo-900/30' },
  client: { label: 'Cliente', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/30' },
  lost: { label: 'Perdido', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-100 dark:border-rose-900/30' },
  no_contacts: { label: 'Sem Contatos', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-600 dark:border-rose-400' },
  site_broken: { label: 'Site não funciona', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-600 dark:border-orange-400' },
  find_yourself: { label: 'Procure você mesmo', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-600 dark:border-purple-400' }
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/50', border: 'border-slate-100 dark:border-slate-800' },
  medium: { label: 'Média', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/30' },
  high: { label: 'Alta', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-100 dark:border-rose-900/30' }
}

export function ClientsTable({ clients, onDelete, onStatusChange, onBulkDelete, onUpdate }: ClientsTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const { mutate } = useSWRConfig()
  
  // Modals state
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const [isUpdateWebsiteModalOpen, setIsUpdateWebsiteModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [newContact, setNewContact] = useState({ label: '', number: '', email: '' })
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSaveContact = async () => {
    if (!editingClient || (!newContact.number && !newContact.email)) return
    
    setIsUpdating(true)
    try {
      // 1. Get current full_company_data to add new contacts to it
      const data = editingClient.full_company_data || {}
      if (!data.website) data.website = {}
      if (!data.website.contacts) data.website.contacts = { phones: [], emails: [] }
      
      if (newContact.number) {
        data.website.contacts.phones.push({
          label: newContact.label || 'WhatsApp Comercial',
          number: newContact.number
        })
      }
      
      if (newContact.email) {
        data.website.contacts.emails.push(newContact.email)
      }

      // 2. Update status if it was 'no_contacts'
      const newStatus = editingClient.status === 'no_contacts' ? 'contacted' : editingClient.status

      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          full_company_data: data,
          phone: newContact.number || editingClient.phone,
          email: newContact.email || editingClient.email
        })
      })

      if (response.ok) {
        onUpdate?.()
        setIsAddContactModalOpen(false)
        setNewContact({ label: '', number: '', email: '' })
        setEditingClient(null)
      }
    } catch (error) {
      console.error('Error saving contact:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateWebsite = async () => {
    if (!editingClient || !newWebsiteUrl) return
    
    setIsUpdating(true)
    try {
      // 1. Update status and website URL
      const newStatus = editingClient.status === 'site_broken' ? 'lead' : editingClient.status

      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          website: newWebsiteUrl,
          full_company_data: {
            found_url: newWebsiteUrl
          }
        })
      })

      if (response.ok) {
        onUpdate?.()
        setIsUpdateWebsiteModalOpen(false)
        const websiteUrl = newWebsiteUrl
        const clientName = editingClient.company_name
        const clientId = editingClient.id
        
        setNewWebsiteUrl('')
        setEditingClient(null)

        // Redirect to analysis page
        router.push(`/company-detail?id=${clientId}&name=${encodeURIComponent(clientName)}&website=${encodeURIComponent(websiteUrl)}&action=reanalyze`)
      }
    } catch (error) {
      console.error('Error updating website:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [clients])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
      setSelectAll(false)
    } else {
      setSelectedIds(clients.map(client => client.id))
      setSelectAll(true)
    }
  }

  const handleSelectClient = (clientId: string) => {
    if (selectedIds.includes(clientId)) {
      setSelectedIds(selectedIds.filter(id => id !== clientId))
      setSelectAll(false)
    } else {
      setSelectedIds([...selectedIds, clientId])
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length > 0 && onBulkDelete) {
      onBulkDelete(selectedIds)
      setSelectedIds([])
      setSelectAll(false)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-8 rounded-[2rem] bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
          <Users className="h-16 w-16 text-slate-300 dark:text-slate-700" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Nenhum contato encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto uppercase text-[10px] tracking-widest">Tente ajustar seus filtros ou adicione um novo contato manualmente.</p>
        </div>
        <Button asChild className="h-14 px-8 rounded-2xl border-[3px] border-slate-900 dark:border-white bg-primary text-white font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:-translate-y-1 transition-all active:shadow-none">
          <Link href="/clients/new">Adicionar Primeiro Contato</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-6 px-6 py-3 bg-slate-900 text-white rounded-[2rem] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary text-white font-black text-[10px] border-2 border-white shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)]">
                {selectedIds.length}
              </div>
              <span className="font-black text-[8px] uppercase tracking-[0.2em]">contatos selecionados</span>
            </div>
            
            <div className="w-px h-4 bg-slate-700" />
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 rounded-lg font-black uppercase text-[8px] tracking-widest px-3 h-8"
                onClick={() => setSelectedIds([])}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-3 rounded-lg font-black uppercase text-[8px] tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:-translate-y-0.5 transition-all active:shadow-none active:translate-x-0 active:translate-y-0"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Excluir Permanentemente
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto custom-scrollbar">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[50px] pl-6">
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-lg border-[3px] transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]",
                    selectAll 
                      ? "bg-primary border-slate-900 dark:border-white text-white" 
                      : "bg-white dark:bg-slate-900 border-slate-900 dark:border-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {selectAll && <CheckSquare className="h-3 w-3" />}
                </button>
              </TableHead>
              <TableHead className="w-[35%] font-black text-slate-900 dark:text-white text-[8px] uppercase tracking-[0.2em] py-4">Empresa & Site</TableHead>
              <TableHead className="w-[15%] font-black text-slate-900 dark:text-white text-[8px] uppercase tracking-[0.2em] py-4">Status</TableHead>
              <TableHead className="w-[12%] font-black text-slate-900 dark:text-white text-[8px] uppercase tracking-[0.2em] py-4">Prioridade</TableHead>
              <TableHead className="w-[15%] font-black text-slate-900 dark:text-white text-[8px] uppercase tracking-[0.2em] py-4">Localização</TableHead>
              <TableHead className="w-[15%] font-black text-slate-900 dark:text-white text-[8px] uppercase tracking-[0.2em] py-4">Atividade</TableHead>
              <TableHead className="w-[70px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client, idx) => {
              const data = client.full_company_data || {};
              const email = client.email || data.email;
              const phone = client.phone || data.phone;
              const website = client.website || data.website || data.found_url;
              const contactName = client.contact_name || data.contact_name;
              const city = client.city || data.city;
              const state = client.state || data.state;
              const lastContact = client.last_contact_date || data.collected_at || data.extracted_at;
              const isSelected = selectedIds.includes(client.id);

              return (
                <TableRow 
                  key={client.id} 
                  className={cn(
                    "group transition-all duration-200 border-b-[3px] border-slate-100 dark:border-slate-800 last:border-none",
                    isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                  )}
                >
                  <TableCell className="pl-6">
                    <button
                      onClick={() => handleSelectClient(client.id)}
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-lg border-[3px] transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]",
                        isSelected 
                          ? "bg-primary border-slate-900 dark:border-white text-white scale-110" 
                          : "bg-white dark:bg-slate-900 border-slate-900 dark:border-white group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                      )}
                    >
                      {isSelected && <CheckSquare className="h-3 w-3" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 py-2">
                      <div className="relative h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:rotate-3 transition-transform duration-300">
                        {website ? (
                          <img 
                            src={`https://www.google.com/s2/favicons?sz=64&domain=${website}`} 
                            alt="" 
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<Building2 class="h-5 w-5 text-slate-400 dark:text-slate-500" />');
                            }}
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/clients/${client.id}`}
                            className="font-black text-sm text-slate-900 dark:text-white hover:text-primary transition-colors block truncate tracking-tighter uppercase italic"
                          >
                            {client.company_name}
                          </Link>
                          {client.has_analysis && (
                            <div className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" title="Análise da IA disponível"></span>
                            </div>
                          )}
                        </div>
                        {website && (
                          <a
                            href={website.startsWith('http') ? website : `https://${website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[8px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white mt-0.5 transition-colors uppercase tracking-widest"
                          >
                            <Globe className="h-2.5 w-2.5" />
                            {website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                        
                        <div className="mt-2 flex items-center gap-1.5">
                          <Link
                            href={`/company-detail?name=${encodeURIComponent(client.company_name)}${website ? `&website=${encodeURIComponent(website)}` : ''}`}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md border-[2px] border-slate-900 dark:border-white bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all group/btn"
                          >
                            <Eye className="h-3 w-3 group-hover/btn:text-primary transition-colors" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Análise</span>
                          </Link>
                          
                          {(email || phone) && (
                            <div className="flex items-center gap-1.5">
                              {email && (
                                <a
                                  href={`mailto:${email}`}
                                  className="p-1 rounded-md border-2 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary transition-all"
                                  title={email}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="h-3 w-3" />
                                </a>
                              )}
                              {phone && (
                                <a
                                  href={`tel:${phone.replace(/\D/g, '')}`}
                                  className="p-1 rounded-md border-2 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:border-primary transition-all"
                                  title={phone}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.status === 'no_contacts' ? (
                      <button
                        onClick={() => {
                          setEditingClient(client)
                          setIsAddContactModalOpen(true)
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2 font-black text-[8px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.05)] hover:translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all",
                          statusConfig[client.status as ClientStatus]?.bg,
                          statusConfig[client.status as ClientStatus]?.color,
                          "border-rose-600 dark:border-rose-400"
                        )}
                        title="Clique para adicionar contatos"
                      >
                        <Plus className="h-2 w-2" />
                        {statusConfig[client.status as ClientStatus]?.label}
                      </button>
                    ) : client.status === 'site_broken' ? (
                      <button
                        onClick={() => {
                          setEditingClient(client)
                          setNewWebsiteUrl(website || '')
                          setIsUpdateWebsiteModalOpen(true)
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2 font-black text-[8px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.05)] hover:translate-x-0.5 hover:-translate-y-0.5 active:shadow-none transition-all",
                          statusConfig[client.status as ClientStatus]?.bg,
                          statusConfig[client.status as ClientStatus]?.color,
                          "border-orange-600 dark:border-orange-400"
                        )}
                        title="Clique para corrigir site e re-analisar"
                      >
                        <RefreshCw className="h-2 w-2" />
                        {statusConfig[client.status as ClientStatus]?.label}
                      </button>
                    ) : (
                      <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md border-2 font-black text-[8px] uppercase tracking-widest",
                        statusConfig[client.status as ClientStatus]?.bg,
                        statusConfig[client.status as ClientStatus]?.color,
                        statusConfig[client.status as ClientStatus]?.border
                      )}>
                        {statusConfig[client.status as ClientStatus]?.label}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md border-2 font-black text-[8px] uppercase tracking-widest",
                      priorityConfig[client.priority as keyof typeof priorityConfig]?.bg,
                      priorityConfig[client.priority as keyof typeof priorityConfig]?.color,
                      priorityConfig[client.priority as keyof typeof priorityConfig]?.border
                    )}>
                      {priorityConfig[client.priority as keyof typeof priorityConfig]?.label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-tight italic">
                        <MapPin className="h-2 w-2 text-primary" />
                        {city || '---'}
                      </div>
                      <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-3">
                        {state || '---'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-tight italic">
                        <Calendar className="h-2 w-2 text-primary" />
                        {lastContact ? new Date(lastContact).toLocaleDateString('pt-BR') : '---'}
                      </div>
                      <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-3">
                        Último Contato
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg border-[3px] border-slate-900 dark:border-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:translate-x-0.5 hover:-translate-y-0.5 active:shadow-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] bg-white dark:bg-slate-900">
                        <DropdownMenuItem asChild className="rounded-lg p-2 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer border-2 border-transparent focus:border-slate-900 dark:focus:border-white transition-all">
                          <Link href={`/clients/${client.id}`} className="flex items-center font-black text-slate-900 dark:text-white uppercase tracking-tighter text-[9px]">
                            <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-2 border-slate-900 dark:border-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.1)] mr-2">
                              <Edit className="h-3 w-3" />
                            </div>
                            Editar Contato
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg p-2 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer border-2 border-transparent focus:border-slate-900 dark:focus:border-white transition-all">
                          <Link href={`/emails?client=${client.id}`} className="flex items-center font-black text-slate-900 dark:text-white uppercase tracking-tighter text-[9px]">
                            <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-2 border-slate-900 dark:border-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.1)] mr-2">
                              <Mail className="h-3 w-3" />
                            </div>
                            Enviar Proposta
                          </Link>
                        </DropdownMenuItem>
                        
                        <div className="h-[2px] bg-slate-100 dark:bg-slate-800 my-1.5 mx-1" />
                        
                        <div className="px-2 py-1 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Mudar Status</div>
                      
                      {(['contacted', 'negotiating', 'client', 'no_contacts', 'site_broken', 'find_yourself'] as ClientStatus[]).map((status) => (
                        <DropdownMenuItem 
                          key={status}
                          onClick={() => onStatusChange?.(client.id, status)}
                          className="rounded-lg p-2 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer font-black text-slate-900 dark:text-white uppercase tracking-tighter text-[9px] border-2 border-transparent focus:border-slate-900 dark:focus:border-white transition-all"
                        >
                          <div className={cn("w-2 h-2 rounded-full border-2 border-black dark:border-white mr-2", statusConfig[status].color.replace('text-', 'bg-'))} />
                          {statusConfig[status].label}
                        </DropdownMenuItem>
                      ))}
                        
                        <div className="h-[2px] bg-slate-100 dark:bg-slate-800 my-1.5 mx-1" />
                        
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(client.id)}
                          className="rounded-lg p-2 focus:bg-rose-50 dark:focus:bg-rose-900/20 text-rose-600 dark:text-rose-400 cursor-pointer font-black uppercase tracking-tighter text-[9px] border-2 border-transparent focus:border-rose-600 transition-all"
                        >
                          <div className="p-1 rounded-md bg-rose-100 dark:bg-rose-900/40 border-2 border-rose-600 shadow-[1.5px_1.5px_0px_0px_rgba(225,29,72,0.3)] mr-2">
                            <Trash2 className="h-3 w-3" />
                          </div>
                          Excluir Registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Contact Modal */}
      <Dialog open={isAddContactModalOpen} onOpenChange={setIsAddContactModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Adicionar Contato</DialogTitle>
            <DialogDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">
              Insira as informações de contato para {editingClient?.company_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="label" className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-1">Etiqueta</Label>
              <Input
                id="label"
                placeholder="WhatsApp Comercial"
                className="rounded-xl border-[3px] border-slate-900 dark:border-white font-bold h-12 focus-visible:ring-0 focus-visible:translate-x-0.5 focus-visible:-translate-y-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                value={newContact.label}
                onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="number" className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-1">Telefone</Label>
              <Input
                id="number"
                placeholder="(11) 99999-9999"
                className="rounded-xl border-[3px] border-slate-900 dark:border-white font-bold h-12 focus-visible:ring-0 focus-visible:translate-x-0.5 focus-visible:-translate-y-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                value={newContact.number}
                onChange={(e) => setNewContact({ ...newContact, number: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-1">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                className="rounded-xl border-[3px] border-slate-900 dark:border-white font-bold h-12 focus-visible:ring-0 focus-visible:translate-x-0.5 focus-visible:-translate-y-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all"
              onClick={handleSaveContact}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Contato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Website Modal */}
      <Dialog open={isUpdateWebsiteModalOpen} onOpenChange={setIsUpdateWebsiteModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Corrigir Website</DialogTitle>
            <DialogDescription className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">
              Insira a URL correta para {editingClient?.company_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="website" className="font-black uppercase text-[10px] tracking-widest text-slate-500 ml-1">URL do Website</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="website"
                  placeholder="https://www.empresa.com.br"
                  className="pl-11 rounded-xl border-[3px] border-slate-900 dark:border-white font-bold h-12 focus-visible:ring-0 focus-visible:translate-x-0.5 focus-visible:-translate-y-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-14 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all"
              onClick={handleUpdateWebsite}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar e Validar Site'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
