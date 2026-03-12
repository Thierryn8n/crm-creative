'use client'

import { useState, useEffect } from 'react'
import { Client, EmailTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Send, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailComposerProps {
  client?: Client
  templates: EmailTemplate[]
  onSend: (data: { client_id: string; to_email: string; subject: string; body: string; template_id?: string }) => Promise<void>
}

export function EmailComposer({ client, templates, onSend }: EmailComposerProps) {
  const { toast } = useToast()
  const data = client?.full_company_data || {};
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [toEmail, setToEmail] = useState(client?.email || data.email || '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const data = client?.full_company_data || {};
    const email = client?.email || data.email;
    if (email) {
      setToEmail(email)
    }
  }, [client])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      let newSubject = template.subject
      let newBody = template.body

      // Replace placeholders
      if (client) {
        const data = client.full_company_data || {};
        const contactName = client.contact_name || data.contact_name || 'Prezado(a)';
        
        newSubject = newSubject
          .replace(/\{\{nome_empresa\}\}/g, client.company_name)
          .replace(/\{\{nome_contato\}\}/g, contactName)
        newBody = newBody
          .replace(/\{\{nome_empresa\}\}/g, client.company_name)
          .replace(/\{\{nome_contato\}\}/g, contactName)
      }

      setSubject(newSubject)
      setBody(newBody)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!client) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente para enviar o email.',
        variant: 'destructive'
      })
      return
    }

    if (!toEmail || !subject || !body) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatorios.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      await onSend({
        client_id: client.id,
        to_email: toEmail,
        subject,
        body,
        template_id: selectedTemplate || undefined
      })
      toast({
        title: 'Email Registrado',
        description: 'O email foi registrado com sucesso no sistema.'
      })
      // Reset form
      setSubject('')
      setBody('')
      setSelectedTemplate('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar email. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar Email
        </CardTitle>
        <CardDescription>
          Compose e envie emails para seus clientes. Os emails sao registrados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {client && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">Enviando para:</p>
              <p className="font-medium text-foreground">{client.company_name}</p>
              {client.contact_name && (
                <p className="text-sm text-muted-foreground">{client.contact_name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                      {template.is_default && (
                        <span className="text-xs text-muted-foreground">(Padrao)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to_email">Para *</Label>
            <Input
              id="to_email"
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="email@empresa.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensagem *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={12}
              required
              className="font-mono text-sm"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !client}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Email
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
