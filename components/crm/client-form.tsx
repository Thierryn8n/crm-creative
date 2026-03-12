'use client'

import { useState } from 'react'
import { Client, ClientFormData, ClientStatus, ClientPriority } from '@/lib/types'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ClientFormProps {
  client?: Client
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel?: () => void
}

const defaultFormData: ClientFormData = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  whatsapp_link: '',
  website: '',
  linkedin_url: '',
  instagram_url: '',
  city: '',
  state: '',
  status: 'lead',
  priority: 'medium',
  notes: '',
  source: 'manual'
}

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>(() => {
    if (client) {
      const data = client.full_company_data || {};
      return {
        company_name: client.company_name,
        contact_name: client.contact_name || data.contact_name || '',
        email: client.email || data.email || '',
        phone: client.phone || data.phone || '',
        whatsapp_link: client.whatsapp_link || data.whatsapp_link || '',
        website: client.website || data.website || data.found_url || '',
        linkedin_url: client.linkedin_url || data.linkedin_url || (data.social_media?.linkedin) || '',
        instagram_url: client.instagram_url || data.instagram_url || (data.social_media?.instagram) || '',
        city: client.city || data.city || '',
        state: client.state || data.state || '',
        status: client.status,
        priority: client.priority,
        notes: client.notes || data.notes || data.description || '',
        source: client.source || data.source || 'manual'
      };
    }
    return defaultFormData;
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informacoes da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                required
                placeholder="Ex: Agencia Digital XYZ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nome do Contato</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                placeholder="Ex: Joao Silva"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contato@agencia.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="www.agencia.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_link">Link WhatsApp</Label>
              <Input
                id="whatsapp_link"
                value={formData.whatsapp_link}
                onChange={(e) => updateField('whatsapp_link', e.target.value)}
                placeholder="https://wa.me/5511999999999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input
                id="instagram_url"
                value={formData.instagram_url}
                onChange={(e) => updateField('instagram_url', e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localizacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Sao Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => updateField('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {brazilianStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status e Prioridade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value as ClientStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="negotiating">Negociando</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => updateField('priority', value as ClientPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => updateField('source', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="gemini">Busca Gemini</SelectItem>
                  <SelectItem value="referral">Indicacao</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social">Redes Sociais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Adicione observacoes sobre este cliente..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {client ? 'Atualizar Cliente' : 'Criar Cliente'}
        </Button>
      </div>
    </form>
  )
}
