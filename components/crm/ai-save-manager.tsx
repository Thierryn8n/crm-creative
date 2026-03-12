'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Share2,
  History
} from 'lucide-react'

interface AISaveManagerProps {
  analysisId: string
  currentData: any
  onSaveComplete: (savedData: any) => void
}

export function AISaveManager({ analysisId, currentData, onSaveComplete }: AISaveManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [savedVersions, setSavedVersions] = useState<any[]>([])
  const [userNotes, setUserNotes] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Buscar versões salvas ao carregar
  useEffect(() => {
    fetchSavedVersions()
  }, [analysisId])

  const fetchSavedVersions = async () => {
    try {
      const response = await fetch(`/api/ai-analysis/versions?analysis_id=${analysisId}`)
      const data = await response.json()
      
      if (response.ok) {
        setSavedVersions(data.versions || [])
      }
    } catch (err) {
      console.error('Erro ao buscar versões salvas:', err)
    }
  }

  const saveVersion = async (type: 'pre_approval' | 'post_approval') => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const versionData = {
        analysis_id: analysisId,
        version_type: type,
        data_snapshot: currentData,
        user_notes: userNotes,
        approval_notes: type === 'post_approval' ? approvalNotes : null,
        saved_at: new Date().toISOString()
      }

      const response = await fetch('/api/ai-analysis/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar versão')
      }

      setSuccess(`Versão ${type === 'pre_approval' ? 'pré-aprovação' : 'pós-aprovação'} salva com sucesso!`)
      setSavedVersions(prev => [result.version, ...prev])
      onSaveComplete(result.version)
      
      // Limpar formulário
      setUserNotes('')
      setApprovalNotes('')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const viewVersion = (version: any) => {
    setSelectedVersion(version)
  }

  const downloadVersion = (version: any) => {
    const dataStr = JSON.stringify(version.data_snapshot, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-analysis-${version.version_type}-${version.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const shareVersion = async (version: any) => {
    try {
      const shareData = {
        title: `Análise IA - ${version.version_type}`,
        text: `Análise de IA salva em ${new Date(version.saved_at).toLocaleDateString('pt-BR')}`,
        url: window.location.href
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback para copiar link
        await navigator.clipboard.writeText(window.location.href)
        setSuccess('Link copiado para a área de transferência!')
      }
    } catch (err) {
      setError('Erro ao compartilhar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Mensagens de Status */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Salvar Versão Pré-Aprovação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Salvar Análise Pré-Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notas sobre a análise (opcional):
            </label>
            <Textarea
              placeholder="Adicione suas observações sobre esta análise antes da aprovação..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            onClick={() => saveVersion('pre_approval')}
            disabled={isLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Versão Pré-Aprovação
          </Button>
          
          <Badge variant="secondary" className="w-fit">
            Status: Análise Inicial
          </Badge>
        </CardContent>
      </Card>

      {/* Salvar Versão Pós-Aprovação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Salvar Análise Pós-Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Detalhes da aprovação e negociação:
            </label>
            <Textarea
              placeholder="Descreva o que foi aprovado, negociado e decidido..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notas adicionais (opcional):
            </label>
            <Textarea
              placeholder="Observações finais sobre o processo..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <Button 
            onClick={() => saveVersion('post_approval')}
            disabled={isLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Versão Pós-Aprovação
          </Button>
          
          <Badge variant="default" className="w-fit">
            Status: Aprovado
          </Badge>
        </CardContent>
      </Card>

      <Separator />

      {/* Histórico de Versões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões Salvas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedVersions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma versão salva ainda. Use os botões acima para salvar versões de análise.
            </p>
          ) : (
            <div className="space-y-3">
              {savedVersions.map((version) => (
                <div key={version.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={version.version_type === 'pre_approval' ? 'secondary' : 'default'}>
                          {version.version_type === 'pre_approval' ? 'Pré-Aprovação' : 'Pós-Aprovação'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(version.saved_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {version.user_notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {version.user_notes.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewVersion(version)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadVersion(version)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => shareVersion(version)}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Detalhes da Versão - {selectedVersion.version_type === 'pre_approval' ? 'Pré-Aprovação' : 'Pós-Aprovação'}
              </h3>
              <Button
                variant="ghost"
                onClick={() => setSelectedVersion(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Data de Salvamento:</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedVersion.saved_at).toLocaleString('pt-BR')}
                </p>
              </div>
              
              {selectedVersion.user_notes && (
                <div>
                  <h4 className="font-medium mb-2">Notas do Usuário:</h4>
                  <p className="text-sm">{selectedVersion.user_notes}</p>
                </div>
              )}
              
              {selectedVersion.approval_notes && (
                <div>
                  <h4 className="font-medium mb-2">Detalhes da Aprovação:</h4>
                  <p className="text-sm">{selectedVersion.approval_notes}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Dados da Análise:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedVersion.data_snapshot, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => downloadVersion(selectedVersion)}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button
                onClick={() => setSelectedVersion(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}