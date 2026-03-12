'use client'

import { use } from 'react'
import { ClientForm } from '@/components/crm/client-form'
import { Client, ClientFormData } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, Mail } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const { data: client, error, isLoading } = useSWR<Client>(
    `/api/clients/${id}`,
    fetcher
  )

  const handleSubmit = async (data: ClientFormData) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      toast({
        title: 'Cliente atualizado',
        description: `${data.company_name} foi atualizado com sucesso.`
      })

      router.push('/clients')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar cliente. Tente novamente.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      toast({
        title: 'Cliente excluido',
        description: 'O cliente foi removido do CRM.'
      })
      router.push('/clients')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir cliente.',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          Carregando cliente...
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Cliente nao encontrado.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{client.company_name}</h1>
          <p className="text-muted-foreground mt-1">
            Editar informacoes do cliente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/emails?client=${id}`}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <ClientForm 
        client={client} 
        onSubmit={handleSubmit} 
        onCancel={() => router.back()} 
      />
    </div>
  )
}
