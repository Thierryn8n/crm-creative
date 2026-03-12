'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MessageSquare, 
  Calendar,
  DollarSign,
  User,
  Clock,
  Send,
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ApprovedCompany {
  id: string
  company_name: string
  company_website?: string
  company_description?: string
  company_industry?: string
  company_size?: string
  negotiation_status: string
  negotiation_value?: number
  priority: string
  next_action_date?: string
  strategy_generated?: any
  created_at: string
  match_score?: number
}

interface NegotiationEntry {
  id: string
  description: string
  outcome?: string
  next_steps?: string
  ai_analysis?: {
    analysis: string
    recommendations: string[]
    confidence: number
  }
  created_at: string
}

function NegotiationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const companyId = searchParams.get('id')
  
  const [company, setCompany] = useState<ApprovedCompany | null>(null)
  const [negotiations, setNegotiations] = useState<NegotiationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [description, setDescription] = useState('')
  const [outcome, setOutcome] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [negotiationValue, setNegotiationValue] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')

  const fetchCompanyData = async () => {
    try {
      // Buscar dados da empresa aprovada
      const companyResponse = await fetch(`/api/approved-companies/${companyId}`)
      
      if (!companyResponse.ok) {
        throw new Error('Erro ao buscar dados da empresa')
      }

      const companyData = await companyResponse.json()
      setCompany(companyData.company)
      
      // Buscar histórico de negociações
      const negotiationsResponse = await fetch(`/api/negotiation-history?company_id=${companyId}`)
      
      if (negotiationsResponse.ok) {
        const negotiationsData = await negotiationsResponse.json()
        setNegotiations(negotiationsData.negotiations || [])
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const submitNegotiation = async () => {
    if (!description.trim()) {
      alert('Por favor, descreva a interação')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/negotiation-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          description: description,
          outcome: outcome,
          next_steps: nextSteps
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao registrar negociação')
      }

      const result = await response.json()
      
      // Adicionar à lista local
      setNegotiations(prev => [result.entry, ...prev])
      
      // Limpar formulário
      setDescription('')
      setOutcome('')
      setNextSteps('')
      
      // Atualizar status da empresa se necessário
      if (company && company.negotiation_status === 'iniciado') {
        updateCompanyStatus('contato_realizado')
      }
      
      alert('Negociação registrada com sucesso!')
      
    } catch (error) {
      console.error('Erro ao registrar negociação:', error)
      alert('Erro ao registrar negociação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateCompanyStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/approved-companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          negotiation_status: newStatus,
          negotiation_value: negotiationValue ? parseFloat(negotiationValue) : undefined,
          next_action_date: nextActionDate || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      // Atualizar estado local
      if (company) {
        setCompany({
          ...company,
          negotiation_status: newStatus,
          negotiation_value: negotiationValue ? parseFloat(negotiationValue) : company.negotiation_value,
          next_action_date: nextActionDate || company.next_action_date
        })
      }
      
      alert('Status atualizado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status da empresa')
    }
  }

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  useEffect(() => {
    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={fetchCompanyData}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Alert>
          <AlertDescription>Empresa não encontrada</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{company.company_name}</h1>
            <p className="text-muted-foreground mt-1">
              {company.company_industry} • {company.company_size}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(company.negotiation_status)}>
            {company.negotiation_status.replace('_', ' ')}
          </Badge>
          <Badge className={getPriorityColor(company.priority)}>
            {company.priority}
          </Badge>
        </div>
      </div>

      {/* Informações Rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.match_score}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Ação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {company.next_action_date 
                ? new Date(company.next_action_date).toLocaleDateString('pt-BR')
                : 'Não definida'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {company.negotiation_value 
                ? `R$ ${company.negotiation_value.toLocaleString('pt-BR')}`
                : 'Não definido'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário de Nova Negociação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Registrar Nova Interação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição da Interação *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que aconteceu nesta interação..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="outcome">Resultado (opcional)</Label>
              <Textarea
                id="outcome"
                placeholder="Qual foi o resultado desta interação?"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="nextSteps">Próximos Passos (opcional)</Label>
              <Textarea
                id="nextSteps"
                placeholder="Quais são os próximos passos?"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="negotiationValue">Valor da Negociação</Label>
                <Input
                  id="negotiationValue"
                  type="number"
                  placeholder="0.00"
                  value={negotiationValue}
                  onChange={(e) => setNegotiationValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="nextActionDate">Próxima Ação</Label>
                <Input
                  id="nextActionDate"
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={submitNegotiation}
                disabled={submitting || !description.trim()}
                className="flex-1"
              >
                <Send className={`h-4 w-4 mr-2 ${submitting ? 'animate-spin' : ''}`} />
                {submitting ? 'Registrando...' : 'Registrar Interação'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => updateCompanyStatus('proposta_enviada')}
                disabled={!description.trim()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Enviar Proposta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Negociações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Interações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {negotiations.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {negotiations.map((negotiation) => (
                  <Card key={negotiation.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">{negotiation.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(negotiation.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        
                        {negotiation.outcome && (
                          <div>
                            <Badge variant="outline" className="text-xs mb-1">Resultado</Badge>
                            <p className="text-sm text-muted-foreground">{negotiation.outcome}</p>
                          </div>
                        )}
                        
                        {negotiation.next_steps && (
                          <div>
                            <Badge variant="outline" className="text-xs mb-1">Próximos Passos</Badge>
                            <p className="text-sm text-muted-foreground">{negotiation.next_steps}</p>
                          </div>
                        )}
                        
                        {negotiation.ai_analysis && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">Análise da IA</span>
                              <Badge variant="outline" className="text-xs">
                                {negotiation.ai_analysis.confidence}% confiança
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {negotiation.ai_analysis.analysis}
                            </p>
                            {negotiation.ai_analysis.recommendations.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Recomendações:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {negotiation.ai_analysis.recommendations.map((rec, index) => (
                                    <li key={index}>• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma interação registrada ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use o formulário ao lado para registrar sua primeira interação.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Wrapper component to handle Suspense
export default function NegotiationWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <NegotiationPage />
    </Suspense>
  )
}