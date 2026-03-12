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

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface AIData {
  id: string
  company_name: string
  analysis_type: 'pre_approval' | 'post_approval'
  status: 'pending' | 'analyzing' | 'approved' | 'rejected'
  ai_data: {
    website_analysis?: any
    social_media?: any
    linkedin_data?: any
    trends_analysis?: any
    ads_analysis?: any
    strategy_generated?: any
    negotiation_summary?: any
  }
  user_notes?: string
  negotiation_details?: string
  created_at: string
  updated_at: string
}

interface KanbanColumn {
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

  const { data: aiData, mutate, error } = useSWR<AIData[]>('/api/ai-analysis', fetcher)
  const aiList = Array.isArray(aiData) ? aiData : []
  const apiError = !Array.isArray(aiData) && aiData && (aiData as any).error

  const columns: KanbanColumn[] = [
    {
      id: 'pending',
      title: 'Pendente',
      status: 'pending',
      color: 'bg-yellow-100 border-yellow-200',
      items: aiList.filter(item => item.status === 'pending')
    },
    {
      id: 'analyzing',
      title: 'Em Análise',
      status: 'analyzing',
      color: 'bg-blue-100 border-blue-200',
      items: aiList.filter(item => item.status === 'analyzing')
    },
    {
      id: 'approved',
      title: 'Aprovado',
      status: 'approved',
      color: 'bg-green-100 border-green-200',
      items: aiList.filter(item => item.status === 'approved')
    },
    {
      id: 'rejected',
      title: 'Rejeitado',
      status: 'rejected',
      color: 'bg-red-100 border-red-200',
      items: aiList.filter(item => item.status === 'rejected')
    }
  ]

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

  if (error || apiError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar dados da IA. Por favor, tente novamente.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard IA - Kanban</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie análises de empresas e negociações com inteligência artificial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Badge variant="outline" className="text-sm">
            <Brain className="h-3 w-3 mr-1" />
            IA Ativa
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Análises</p>
                <p className="text-2xl font-bold">{aiList.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Análise</p>
                <p className="text-2xl font-bold">
                  {aiList.filter(item => item.status === 'analyzing').length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">
                  {aiList.filter(item => item.status === 'approved').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Notas</p>
                <p className="text-2xl font-bold">
                  {aiList.filter(item => item.user_notes).length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="kanban">Visualização Kanban</TabsTrigger>
              <TabsTrigger value="list">Lista Detalhada</TabsTrigger>
              <TabsTrigger value="ai-intelligence">IA Inteligência</TabsTrigger>
              <TabsTrigger value="ai-save">Salvar IA</TabsTrigger>
              <TabsTrigger value="negotiation">Negociação</TabsTrigger>
            </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onStatusChange={handleStatusChange}
                  onItemClick={setSelectedItem}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-4">
            {aiList.map((item) => (
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
        <TabsContent value="ai-intelligence" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Inteligência Artificial Avançada
              </h3>
            </div>
            
            {selectedItem ? (
              <AIIntelligencePanel
                analysisId={selectedItem.id}
                companyData={selectedItem.ai_data}
                onInsightsGenerated={setAiInsights}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Selecione uma análise na aba Kanban ou Lista para ativar a inteligência artificial avançada.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba de Salvamento IA */}
        <TabsContent value="ai-save" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Save className="h-5 w-5" />
                Gerenciar Informações da IA
              </h3>
            </div>
            
            {selectedItem ? (
              <AISaveManager
                analysisId={selectedItem.id}
                currentData={selectedItem}
                onSaveComplete={(savedData) => {
                  console.log('Dados salvos:', savedData)
                  // Atualizar a lista de análises após salvar
                  mutate()
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Save className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Selecione uma análise na aba Kanban ou Lista para gerenciar o salvamento de informações da IA.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba de Negociação */}
        <TabsContent value="negotiation" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Registrar Negociação
              </h3>
            </div>
            
            {selectedItem ? (
              <NegotiationForm
                analysisId={selectedItem.id}
                currentAnalysis={selectedItem}
                onNegotiationComplete={(negotiationData) => {
                  console.log('Negociação registrada:', negotiationData)
                  // Atualizar a lista de análises após registrar negociação
                  mutate()
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Handshake className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Selecione uma análise na aba Kanban ou Lista para registrar os detalhes da negociação.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para edição */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Análise da Empresa: {selectedItem?.company_name}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Dados da IA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Dados da Análise IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedItem?.ai_data?.website_analysis && (
                      <div>
                        <h4 className="font-semibold mb-2">Análise do Website</h4>
                        <pre className="text-sm bg-gray-50 p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(selectedItem.ai_data.website_analysis, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {selectedItem?.ai_data?.strategy_generated && (
                      <div>
                        <h4 className="font-semibold mb-2">Estratégia Gerada</h4>
                        <pre className="text-sm bg-gray-50 p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(selectedItem.ai_data.strategy_generated, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notas do Usuário */}
              <Card>
                <CardHeader>
                  <CardTitle>Notas do Usuário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Detalhes da Negociação
                    </label>
                    <Textarea
                      placeholder="Descreva como foi a negociação, o que foi acertado, principais pontos discutidos..."
                      value={negotiationDetails}
                      onChange={(e) => setNegotiationDetails(e.target.value)}
                      className="min-h-[100px]"
                      defaultValue={selectedItem?.negotiation_details}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Observações Adicionais
                    </label>
                    <Textarea
                      placeholder="Adicione suas observações sobre a análise da IA..."
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="min-h-[100px]"
                      defaultValue={selectedItem?.user_notes}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedItem?.status}
                    onValueChange={(value) => {
                      if (selectedItem) {
                        handleStatusChange(selectedItem.id, value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="analyzing">Em Análise</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Cancelar
            </Button>
            <Button onClick={() => selectedItem && handleSaveNotes(selectedItem.id)}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
