'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Target, 
  DollarSign, 
  Calendar,
  Users,
  TrendingUp,
  MessageSquare,
  Eye,
  Edit,
  Plus,
  Filter,
  Search,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  RefreshCw
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

interface ApprovedCompany {
  id: string
  company_name: string
  company_website?: string
  company_description?: string
  company_industry?: string
  company_size?: string
  ai_analysis: any
  strategy_generated: any
  website_analysis: any
  social_media_analysis: any
  market_analysis: any
  match_score: number
  skill_gaps: any
  status: string
  negotiation_status: string
  first_contact_date?: string
  last_contact_date?: string
  next_action_date?: string
  negotiation_value?: number
  priority: string
  negotiation_history?: NegotiationHistory[]
  ai_insights?: AIInsight[]
  created_at: string
  updated_at: string
}

interface NegotiationHistory {
  id: string
  description: string
  outcome?: string
  next_steps?: string
  ai_analysis?: any
  created_at: string
}

interface AIInsight {
  id: string
  insight_type: string
  insight_data: any
  confidence_score: number
  created_at: string
}

export default function ApprovedCompaniesPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<ApprovedCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<ApprovedCompany | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchApprovedCompanies = async () => {
    try {
      const response = await fetch('/api/approved-companies')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar empresas aprovadas')
      }

      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const updateCompanyStatus = async (companyId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/approved-companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      // Atualizar a lista local
      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...company, status: newStatus, updated_at: new Date().toISOString() }
          : company
      ))
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status da empresa')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'novo': 'bg-blue-100 text-blue-800',
      'em_negociacao': 'bg-yellow-100 text-yellow-800',
      'aprovado_cliente': 'bg-green-100 text-green-800',
      'contrato_assinado': 'bg-purple-100 text-purple-800',
      'projeto_em_andamento': 'bg-orange-100 text-orange-800',
      'concluido': 'bg-green-100 text-green-800',
      'perdido': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getNegotiationStatusColor = (status: string) => {
    const colors = {
      'iniciado': 'bg-gray-100 text-gray-800',
      'contato_realizado': 'bg-blue-100 text-blue-800',
      'proposta_enviada': 'bg-yellow-100 text-yellow-800',
      'negociacao': 'bg-orange-100 text-orange-800',
      'fechado_vitoria': 'bg-green-100 text-green-800',
      'fechado_derrota': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredCompanies = companies.filter(company => {
    const matchesFilter = filter === 'all' || company.status === filter
    const matchesSearch = searchTerm === '' || 
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.company_industry?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  useEffect(() => {
    fetchApprovedCompanies()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Empresas Aprovadas</h1>
            <p className="text-muted-foreground">Dashboard de empresas aprovadas com IA</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Empresas Aprovadas</h1>
            <p className="text-muted-foreground">Dashboard de empresas aprovadas com IA</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={fetchApprovedCompanies}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas Aprovadas</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard gerenciado por IA com análises e estratégias salvas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Análise
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar empresas..."
                className="pl-10 pr-4 py-2 border rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded-md px-3 py-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="novo">Novas</option>
                <option value="em_negociacao">Em Negociação</option>
                <option value="aprovado_cliente">Aprovado</option>
                <option value="contrato_assinado">Contrato</option>
                <option value="projeto_em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="perdido">Perdido</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.status === 'em_negociacao').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.length > 0 
                ? Math.round((companies.filter(c => c.status === 'concluido').length / companies.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {companies.reduce((sum, c) => sum + (c.negotiation_value || 0), 0).toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{company.company_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {company.company_industry} • {company.company_size}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {company.match_score}%
                  </Badge>
                  <Badge className={getPriorityColor(company.priority)}>
                    {company.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(company.status)}>
                  {company.status.replace('_', ' ')}
                </Badge>
                <Badge className={getNegotiationStatusColor(company.negotiation_status)}>
                  {company.negotiation_status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Análise Rápida */}
              {company.strategy_generated?.analysis && (
                <div className="text-sm text-muted-foreground">
                  <p className="line-clamp-3">
                    {company.strategy_generated.analysis[0]}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCompany(company)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/negotiation?id=${company.id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Negociar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Tente ajustar seus filtros de busca'
                : 'Aprove empresas na página de análise para começar'
              }
            </p>
            <Button onClick={() => router.push('/')}>
              <Plus className="h-4 w-4 mr-2" />
              Ir para Análise
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedCompany.company_name}</CardTitle>
                  <p className="text-muted-foreground">
                    {selectedCompany.company_industry} • {selectedCompany.company_size}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCompany(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="analysis" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="analysis">Análise</TabsTrigger>
                  <TabsTrigger value="strategy">Estratégia</TabsTrigger>
                  <TabsTrigger value="negotiation">Negociação</TabsTrigger>
                  <TabsTrigger value="ai-insights">IA Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Análise da IA</h4>
                      <div className="space-y-2">
                        {selectedCompany.ai_analysis?.analysis?.map((item: string, index: number) => (
                          <p key={index} className="text-sm text-muted-foreground">• {item}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Oportunidades</h4>
                      <div className="space-y-2">
                        {selectedCompany.ai_analysis?.opportunities?.map((item: string, index: number) => (
                          <p key={index} className="text-sm text-muted-foreground">• {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="strategy" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">Estratégia Recomendada</h4>
                      <div className="space-y-2">
                        {selectedCompany.strategy_generated?.strategy?.map((item: string, index: number) => (
                          <p key={index} className="text-sm text-muted-foreground">• {item}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Próximos Passos</h4>
                      <div className="space-y-2">
                        {selectedCompany.strategy_generated?.next_steps?.map((item: string, index: number) => (
                          <p key={index} className="text-sm text-muted-foreground">• {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="negotiation" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Histórico de Negociação</h4>
                      <Button 
                        size="sm"
                        onClick={() => router.push(`/negotiation/${selectedCompany.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    
                    {selectedCompany.negotiation_history && selectedCompany.negotiation_history.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCompany.negotiation_history.map((item: NegotiationHistory) => (
                          <Card key={item.id} className="bg-muted/50">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium">{item.description}</p>
                              {item.outcome && (
                                <p className="text-xs text-muted-foreground mt-1">Resultado: {item.outcome}</p>
                              )}
                              {item.next_steps && (
                                <p className="text-xs text-muted-foreground mt-1">Próximos passos: {item.next_steps}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(item.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma negociação registrada ainda.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ai-insights" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Insights da IA</h4>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Gerar Novo Insight
                      </Button>
                    </div>
                    
                    {selectedCompany.ai_insights && selectedCompany.ai_insights.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCompany.ai_insights.map((insight: AIInsight) => (
                          <Card key={insight.id} className="bg-muted/50">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium capitalize">{insight.insight_type}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {JSON.stringify(insight.insight_data, null, 2)}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {insight.confidence_score}% confiança
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum insight gerado ainda.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Ações Rápidas */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="default"
                  onClick={() => updateCompanyStatus(selectedCompany.id, 'em_negociacao')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Iniciar Negociação
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/negotiation/${selectedCompany.id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Registrar Interação
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setSelectedCompany(null)}
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}