'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { KanbanColumn } from '@/components/crm/kanban-column'
import { AIAnalysisCard } from '@/components/crm/ai-analysis-card'
import { AIIntelligencePanel } from '@/components/crm/ai-intelligence-panel'
import { AISaveManager } from '@/components/crm/ai-save-manager'
import { NegotiationForm } from '@/components/crm/negotiation-form'
import { Lightbulb, MessageSquare, TrendingUp, Users, Brain, Save, RefreshCw, Eye, Handshake } from 'lucide-react'
import useSWR from 'swr'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanCard } from '@/components/crm/kanban-card'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface AIData {
  id: string
  company_name: string
  analysis_type: 'pre_approval' | 'post_approval'
  status: 'pending' | 'analyzing' | 'approved' | 'rejected'
  ai_data: any
  user_notes?: string
  negotiation_details?: string
  created_at: string
  updated_at: string
}

interface KanbanColumnData {
  id: string
  title: string
  status: string
  items: AIData[]
  color: string
}

export default function AIKanbanPage() {
  const [selectedItem, setSelectedItem] = useState<AIData | null>(null)
  const [userNotes, setUserNotes] = useState('')
  const [negotiationDetails, setNegotiationDetails] = useState('')
  const [activeTab, setActiveTab] = useState('kanban')
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [items, setItems] = useState<AIData[]>([])

  const { data: aiData, mutate, error } = useSWR<AIData[]>('/api/ai-analysis', fetcher)
  
  useEffect(() => {
    if (aiData && Array.isArray(aiData)) {
      setItems(aiData)
    }
  }, [aiData])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columns: KanbanColumnData[] = [
    {
      id: 'pending',
      title: 'Pendente',
      status: 'pending',
      color: 'bg-yellow-50 dark:bg-yellow-950/20',
      items: items.filter(item => item.status === 'pending')
    },
    {
      id: 'analyzing',
      title: 'Em Análise',
      status: 'analyzing',
      color: 'bg-blue-50 dark:bg-blue-950/20',
      items: items.filter(item => item.status === 'analyzing')
    },
    {
      id: 'approved',
      title: 'Aprovado',
      status: 'approved',
      color: 'bg-emerald-50 dark:bg-emerald-950/20',
      items: items.filter(item => item.status === 'approved')
    },
    {
      id: 'rejected',
      title: 'Rejeitado',
      status: 'rejected',
      color: 'bg-red-50 dark:bg-red-950/20',
      items: items.filter(item => item.status === 'rejected')
    }
  ]

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Encontrar as colunas
    const activeItem = items.find(i => i.id === activeId)
    if (!activeItem) return

    // Se estiver sobre uma coluna (o overId será o status da coluna)
    const isOverColumn = ['pending', 'analyzing', 'approved', 'rejected'].includes(overId)
    
    if (isOverColumn) {
      if (activeItem.status !== overId) {
        setItems(prev => prev.map(item => 
          item.id === activeId ? { ...item, status: overId as any } : item
        ))
      }
      return
    }

    // Se estiver sobre outro item
    const overItem = items.find(i => i.id === overId)
    if (overItem && activeItem.status !== overItem.status) {
      setItems(prev => prev.map(item => 
        item.id === activeId ? { ...item, status: overItem.status } : item
      ))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = items.find(i => i.id === activeId)
    if (!activeItem) return

    // Persistir no banco
    try {
      await fetch(`/api/ai-analysis/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: activeItem.status })
      })
      mutate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      mutate() // Reverter em caso de erro
    }
  }

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`/api/ai-analysis/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      mutate()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleSaveNotes = async (itemId: string) => {
    try {
      await fetch(`/api/ai-analysis/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_notes: userNotes,
          negotiation_details: negotiationDetails 
        })
      })
      mutate()
      setSelectedItem(null)
      setUserNotes('')
      setNegotiationDetails('')
    } catch (error) {
      console.error('Erro ao salvar notas:', error)
    }
  }

  const refreshData = () => {
    mutate()
  }

  if (error || (aiData && !Array.isArray(aiData) && (aiData as any).error)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar dados da IA. Por favor, tente novamente.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-12 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header Neo-brutalista */}
      <div className="relative overflow-hidden rounded-[3rem] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 p-10 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
              Dashboard <span className="text-primary">IA</span> Kanban
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl leading-relaxed">
              Gerencie análises de empresas e negociações com inteligência artificial avançada.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={refreshData}
              className="rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-16 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              <RefreshCw className="h-5 w-5 mr-3" />
              Atualizar
            </Button>
            <Badge className="bg-primary text-white border-2 border-slate-900 dark:border-slate-950 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
              <Brain className="h-4 w-4 mr-2" />
              IA Ativa
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Total Análises', value: items.length, icon: TrendingUp, color: 'blue' },
          { label: 'Em Análise', value: items.filter(item => item.status === 'analyzing').length, icon: Brain, color: 'yellow' },
          { label: 'Aprovados', value: items.filter(item => item.status === 'approved').length, icon: Users, color: 'emerald' },
          { label: 'Com Notas', value: items.filter(item => item.user_notes).length, icon: MessageSquare, color: 'purple' },
        ].map((stat, i) => (
          <Card key={i} className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white italic">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-${stat.color}-500 text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform`}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="grid w-full grid-cols-5 p-2 bg-slate-100 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] h-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {[
            { id: 'kanban', label: 'Kanban' },
            { id: 'list', label: 'Lista' },
            { id: 'ai-intelligence', label: 'Inteligência' },
            { id: 'ai-save', label: 'Salvar' },
            { id: 'negotiation', label: 'Negociação' },
          ].map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="rounded-xl font-black uppercase tracking-widest text-[10px] py-4 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-transparent data-[state=active]:border-slate-900 transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="kanban" className="mt-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onStatusChange={handleStatusChange}
                  onItemClick={setSelectedItem}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId ? (
                <KanbanCard 
                  item={items.find(i => i.id === activeId)!} 
                  onItemClick={setSelectedItem} 
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {items.map((item) => (
              <AIAnalysisCard
                key={item.id}
                data={item}
                onStatusChange={handleStatusChange}
                onEdit={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Aba de Inteligência Artificial */}
        <TabsContent value="ai-intelligence">
          {selectedItem ? (
            <AIIntelligencePanel
              analysisId={selectedItem.id}
              companyData={selectedItem.ai_data}
              onInsightsGenerated={setAiInsights}
            />
          ) : (
            <Card className="border-[3px] border-slate-900 dark:border-slate-950 border-dashed bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] py-32 text-center">
              <CardContent className="space-y-6">
                <Brain className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-800" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Selecione uma análise</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto">
                    Escolha um item no Kanban para ativar o motor de inteligência estratégica.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba de Salvamento IA */}
        <TabsContent value="ai-save">
          {selectedItem ? (
            <AISaveManager
              analysisId={selectedItem.id}
              currentData={selectedItem}
              onSaveComplete={() => mutate()}
            />
          ) : (
            <Card className="border-[3px] border-slate-900 dark:border-slate-950 border-dashed bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] py-32 text-center">
              <CardContent className="space-y-6">
                <Save className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-800" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Selecione uma análise</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto">
                    Escolha um item para gerenciar o salvamento de dados estruturados.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba de Negociação */}
        <TabsContent value="negotiation">
          {selectedItem ? (
            <NegotiationForm
              analysisId={selectedItem.id}
              currentAnalysis={selectedItem}
              onNegotiationComplete={() => mutate()}
            />
          ) : (
            <Card className="border-[3px] border-slate-900 dark:border-slate-950 border-dashed bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] py-32 text-center">
              <CardContent className="space-y-6">
                <Handshake className="h-20 w-20 mx-auto text-slate-200 dark:text-slate-800" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Selecione uma análise</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto">
                    Escolha um item para registrar os detalhes da negociação comercial.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para edição */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="p-10 border-b-[3px] border-slate-900 dark:border-slate-950 bg-primary/5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)]">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                    {selectedItem?.company_name}
                  </h3>
                  <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mt-2">Detalhamento da Análise IA</p>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] p-10">
            <div className="space-y-10">
              {/* Dados da IA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedItem?.ai_data?.website_analysis && (
                  <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Análise do Website
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <pre className="text-[10px] font-bold bg-slate-100 dark:bg-slate-950 p-4 rounded-xl overflow-x-auto border-2 border-slate-200 dark:border-slate-800">
                        {JSON.stringify(selectedItem.ai_data.website_analysis, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
                
                {selectedItem?.ai_data?.strategy_generated && (
                  <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Estratégia Gerada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <pre className="text-[10px] font-bold bg-slate-100 dark:bg-slate-950 p-4 rounded-xl overflow-x-auto border-2 border-slate-200 dark:border-slate-800">
                        {JSON.stringify(selectedItem.ai_data.strategy_generated, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Notas do Usuário */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Observações Comerciais</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-4">Detalhes da Negociação</label>
                    <Textarea
                      placeholder="Descreva os pontos principais..."
                      value={negotiationDetails}
                      onChange={(e) => setNegotiationDetails(e.target.value)}
                      className="min-h-[150px] rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 font-bold text-sm focus:ring-0"
                      defaultValue={selectedItem?.negotiation_details}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-4">Notas Adicionais</label>
                    <Textarea
                      placeholder="Outras observações importantes..."
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="min-h-[150px] rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 font-bold text-sm focus:ring-0"
                      defaultValue={selectedItem?.user_notes}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-slate-900">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-black uppercase italic">Status da Oportunidade</h4>
                </div>
                <Select
                  value={selectedItem?.status}
                  onValueChange={(value) => selectedItem && handleStatusChange(selectedItem.id, value)}
                >
                  <SelectTrigger className="w-[250px] h-14 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[3px] border-slate-900 rounded-xl overflow-hidden">
                    <SelectItem value="pending" className="font-bold uppercase text-[10px]">Pendente</SelectItem>
                    <SelectItem value="analyzing" className="font-bold uppercase text-[10px]">Em Análise</SelectItem>
                    <SelectItem value="approved" className="font-bold uppercase text-[10px]">Aprovado</SelectItem>
                    <SelectItem value="rejected" className="font-bold uppercase text-[10px]">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>

          <div className="p-10 border-t-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800 flex justify-end gap-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedItem(null)}
              className="h-14 px-8 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedItem && handleSaveNotes(selectedItem.id)}
              className="h-14 px-8 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              <Save className="h-5 w-5 mr-3" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
