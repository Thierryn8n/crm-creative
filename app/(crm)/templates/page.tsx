'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EmailTemplate } from '@/lib/types'
import { Plus, FileText, Edit, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TemplatesPage() {
  const { toast } = useToast()
  const { data: templates, mutate } = useSWR<EmailTemplate[]>(
    '/api/email-templates',
    fetcher,
    { fallbackData: [] }
  )

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    is_default: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create template')

      toast({
        title: 'Template criado',
        description: 'O template foi salvo com sucesso.'
      })

      setFormData({ name: '', subject: '', body: '', is_default: false })
      setIsDialogOpen(false)
      mutate()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar template.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates de Email</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus templates de email para comunicacao com clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Template de Email</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Apresentacao Inicial"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ex: Proposta de Parceria - {{nome_empresa}}"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{nome_empresa}}'} e {'{{nome_contato}}'} como variaveis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Corpo do Email *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Escreva o conteudo do email..."
                  rows={10}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Definir como template padrao</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                {template.is_default && (
                  <Badge variant="secondary">Padrao</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-1">
                Assunto: {template.subject}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6 font-mono">
                  {template.body}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum template criado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie seu primeiro template para agilizar a comunicacao com clientes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
