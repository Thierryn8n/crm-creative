'use client'

import { ClientForm } from '@/components/crm/client-form'
import { ClientFormData } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function NewClientPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (data: ClientFormData) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      toast({
        title: 'Cliente criado',
        description: `${data.company_name} foi adicionado com sucesso.`
      })

      router.push('/clients')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar cliente. Tente novamente.',
        variant: 'destructive'
      })
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Novo Cliente</h1>
        <p className="text-muted-foreground mt-1">
          Adicione um novo cliente ou lead ao seu CRM
        </p>
      </div>

      <ClientForm onSubmit={handleSubmit} onCancel={() => router.back()} />
    </div>
  )
}
