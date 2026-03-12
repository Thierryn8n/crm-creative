'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Handshake, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  FileText,
  Send,
  Save,
  Clock
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NegotiationFormProps {
  analysisId: string
  currentAnalysis: any
  onNegotiationComplete: (negotiationData: any) => void
}

interface NegotiationData {
  negotiation_summary: string
  outcome: 'success' | 'partial_success' | 'failure' | 'pending'
  agreed_value: string
  timeline: string
  key_points: string[]
  contact_person: string
  follow_up_actions: string
  lessons_learned: string
  next_steps: string
  user_notes: string
}

export function NegotiationForm({ analysisId, currentAnalysis, onNegotiationComplete }: NegotiationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [negotiationData, setNegotiationData] = useState<NegotiationData>({
    negotiation_summary: '',
    outcome: 'pending',
    agreed_value: '',
    timeline: '',
    key_points: [''],
    contact_person: '',
    follow_up_actions: '',
    lessons_learned: '',
    next_steps: '',
    user_notes: ''
  })

  const handleInputChange = (field: keyof NegotiationData, value: any) => {
    setNegotiationData(prev => ({ ...prev, [field]: value }))
  }

  const handleKeyPointChange = (index: number, value: string) => {
    const newKeyPoints = [...negotiationData.key_points]
    newKeyPoints[index] = value
    handleInputChange('key_points', newKeyPoints)
  }

  const addKeyPoint = () => {
    handleInputChange('key_points', [...negotiationData.key_points, ''])
  }

  const removeKeyPoint = (index: number) => {
    const newKeyPoints = negotiationData.key_points.filter((_, i) => i !== index)
    handleInputChange('key_points', newKeyPoints)
  }

  const saveNegotiation = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Validar campos obrigatórios
      if (!negotiationData.negotiation_summary.trim()) {
        throw new Error('Resumo da negociação é obrigatório')
      }

      const response = await fetch('/api/ai-analysis/negotiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          negotiation_data: negotiationData
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar negociação')
      }

      setSuccess('Negociação salva com sucesso! A IA irá aprender com estas informações.')
      onNegotiationComplete(result)
      
      // Limpar formulário após 3 segundos
      setTimeout(() => {
        setNegotiationData({
          negotiation_summary: '',
          outcome: 'pending',
          agreed_value: '',
          timeline: '',
          key_points: [''],
          contact_person: '',
          follow_up_actions: '',
          lessons_learned: '',
          next_steps: '',
          user_notes: ''
        })
      }, 3000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const getOutcomeBadge = (outcome: string) => {
    const badges = {
      success: { label: 'Sucesso', variant: 'default' as const },
      partial_success: { label: 'Sucesso Parcial', variant: 'secondary' as const },
      failure: { label: 'Falha', variant: 'destructive' as const },
      pending: { label: 'Pendente', variant: 'outline' as const }
    }
    return badges[outcome as keyof typeof badges] || badges.pending
  }

  return (
    <div className="space-y-6">
      {/* Mensagens de Status */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Informações da Análise Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações da Análise Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Empresa:</Label>
              <p className="text-sm text-muted-foreground">{currentAnalysis?.company_name || 'N/A'}</p>
            </div>
            <div>
              <Label>Status Atual:</Label>
              <Badge variant="outline">{currentAnalysis?.status || 'N/A'}</Badge>
            </div>
            <div>
              <Label>Tipo de Análise:</Label>
              <p className="text-sm text-muted-foreground">{currentAnalysis?.analysis_type || 'N/A'}</p>
            </div>
            <div>
              <Label>Data de Criação:</Label>
              <p className="text-sm text-muted-foreground">
                {currentAnalysis?.created_at ? new Date(currentAnalysis.created_at).toLocaleDateString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            Detalhes da Negociação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumo da Negociação */}
          <div>
            <Label htmlFor="negotiation_summary" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Resumo da Negociação *
            </Label>
            <Textarea
              id="negotiation_summary"
              placeholder="Descreva como foi o processo de negociação, principais pontos discutidos, abordagem utilizada..."
              value={negotiationData.negotiation_summary}
              onChange={(e) => handleInputChange('negotiation_summary', e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Resultado */}
          <div>
            <Label htmlFor="outcome" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resultado da Negociação
            </Label>
            <Select
              value={negotiationData.outcome}
              onValueChange={(value) => handleInputChange('outcome', value)}
            >
              <SelectTrigger id="outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Sucesso Total</SelectItem>
                <SelectItem value="partial_success">Sucesso Parcial</SelectItem>
                <SelectItem value="failure">Falha</SelectItem>
                <SelectItem value="pending">Ainda em Andamento</SelectItem>
              </SelectContent>
            </Select>
            <Badge className="mt-2" variant={getOutcomeBadge(negotiationData.outcome).variant}>
              {getOutcomeBadge(negotiationData.outcome).label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor Acordado */}
            <div>
              <Label htmlFor="agreed_value" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Acordado
              </Label>
              <Input
                id="agreed_value"
                placeholder="Ex: R$ 5.000,00 ou 20% de desconto"
                value={negotiationData.agreed_value}
                onChange={(e) => handleInputChange('agreed_value', e.target.value)}
              />
            </div>

            {/* Timeline */}
            <div>
              <Label htmlFor="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prazo/Timeline
              </Label>
              <Input
                id="timeline"
                placeholder="Ex: 30 dias, 2 semanas"
                value={negotiationData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
              />
            </div>
          </div>

          {/* Pontos Chave */}
          <div>
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pontos Chave da Negociação
            </Label>
            <div className="space-y-2">
              {negotiationData.key_points.map((point, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Ponto chave ${index + 1}`}
                    value={point}
                    onChange={(e) => handleKeyPointChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {negotiationData.key_points.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeKeyPoint(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addKeyPoint}
                className="w-full"
              >
                Adicionar Ponto Chave
              </Button>
            </div>
          </div>

          {/* Pessoa de Contato */}
          <div>
            <Label htmlFor="contact_person" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pessoa de Contato
            </Label>
            <Input
              id="contact_person"
              placeholder="Nome e cargo da pessoa com quem negociou"
              value={negotiationData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
            />
          </div>

          {/* Ações de Follow-up */}
          <div>
            <Label htmlFor="follow_up_actions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ações de Follow-up
            </Label>
            <Textarea
              id="follow_up_actions"
              placeholder="Quais ações precisam ser tomadas após esta negociação?"
              value={negotiationData.follow_up_actions}
              onChange={(e) => handleInputChange('follow_up_actions', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Separator />

          {/* Aprendizados */}
          <div>
            <Label htmlFor="lessons_learned" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aprendizados e Lições
            </Label>
            <Textarea
              id="lessons_learned"
              placeholder="O que aprendeu com esta negociação? O que funcionou bem? O que poderia ser diferente?"
              value={negotiationData.lessons_learned}
              onChange={(e) => handleInputChange('lessons_learned', e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Próximos Passos */}
          <div>
            <Label htmlFor="next_steps" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos Passos
            </Label>
            <Textarea
              id="next_steps"
              placeholder="Quais são os próximos passos após esta negociação?"
              value={negotiationData.next_steps}
              onChange={(e) => handleInputChange('next_steps', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Notas Adicionais */}
          <div>
            <Label htmlFor="user_notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas Adicionais
            </Label>
            <Textarea
              id="user_notes"
              placeholder="Qualquer outra informação relevante..."
              value={negotiationData.user_notes}
              onChange={(e) => handleInputChange('user_notes', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Botão de Salvar */}
          <Button 
            onClick={saveNegotiation}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Salvar Negociação e Enviar para IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}