'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { EmailComposer } from '@/components/crm/email-composer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, EmailTemplate } from '@/lib/types'
import { Label } from '@/components/ui/label'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function EmailsContent() {
  const searchParams = useSearchParams()
  const clientIdParam = searchParams.get('client')
  
  const [selectedClientId, setSelectedClientId] = useState<string>(clientIdParam || '')

  const { data: clients } = useSWR<Client[]>('/api/clients', fetcher, { fallbackData: [] })
  const { data: templates } = useSWR<EmailTemplate[]>('/api/email-templates', fetcher, { fallbackData: [] })

  const selectedClient = clients?.find(c => c.id === selectedClientId)

  useEffect(() => {
    if (clientIdParam) {
      setSelectedClientId(clientIdParam)
    }
  }, [clientIdParam])

  const handleSendEmail = async (data: { 
    client_id: string
    to_email: string
    subject: string
    body: string
    template_id?: string 
  }) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return response.json()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Emails</h1>
        <p className="text-muted-foreground mt-1">
          Envie emails personalizados para seus clientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Selecionar Cliente</CardTitle>
            <CardDescription>
              Escolha o cliente para enviar o email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.filter(c => c.email || (c.full_company_data as any)?.email).map((client) => {
                    const data = (client.full_company_data as any) || {};
                    const email = client.email || data.email;
                    return (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col">
                          <span>{client.company_name}</span>
                          <span className="text-xs text-muted-foreground">{email}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedClient && (() => {
              const data = (selectedClient.full_company_data as any) || {};
              const contactName = selectedClient.contact_name || data.contact_name;
              const email = selectedClient.email || data.email;
              const phone = selectedClient.phone || data.phone;

              return (
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <h3 className="font-medium text-foreground">{selectedClient.company_name}</h3>
                  {contactName && (
                    <p className="text-sm text-muted-foreground">{contactName}</p>
                  )}
                  {email && (
                    <p className="text-sm text-muted-foreground">{email}</p>
                  )}
                  {phone && (
                    <p className="text-sm text-muted-foreground">{phone}</p>
                  )}
                </div>
              );
            })()}

            {!selectedClient && clients && clients.filter(c => c.email).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente com email cadastrado. Adicione um cliente primeiro.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Composer */}
        <div className="lg:col-span-2">
          <EmailComposer
            client={selectedClient}
            templates={templates || []}
            onSend={handleSendEmail}
          />
        </div>
      </div>
    </div>
  )
}

export default function EmailsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emails</h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    }>
      <EmailsContent />
    </Suspense>
  )
}
