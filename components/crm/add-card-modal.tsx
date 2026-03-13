'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, Brain, Building } from 'lucide-react'

interface AddCardModalProps {
  columnStatus: string
  onAddCard: (cardData: {
    company_name: string
    status: string
    analysis_type: 'pre_approval' | 'post_approval'
    description?: string
  }) => void
  children: React.ReactNode
}

export function AddCardModal({ columnStatus, onAddCard, children }: AddCardModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [analysisType, setAnalysisType] = useState<'pre_approval' | 'post_approval'>('pre_approval')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Submitting card:', { companyName, columnStatus, analysisType, description })
    
    if (!companyName.trim()) {
      console.log('Company name is empty, not submitting')
      return
    }
    
    const cardData = {
      company_name: companyName.trim(),
      status: columnStatus,
      analysis_type: analysisType,
      description: description.trim() || undefined
    }
    
    console.log('Calling onAddCard with:', cardData)
    onAddCard(cardData)
    
    // Reset form
    setCompanyName('')
    setAnalysisType('pre_approval')
    setDescription('')
    setIsOpen(false)
  }

  const getColumnTitle = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'analyzing': return 'Em Análise'
      case 'approved': return 'Aprovado'
      case 'rejected': return 'Rejeitado'
      default: return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] p-0 overflow-hidden">
        <div className="bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Plus className="h-6 w-6" />
              Novo Card em {getColumnTitle(columnStatus)}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="company-name" className="font-black uppercase tracking-widest text-sm">
                <Building className="h-4 w-4 inline mr-2" />
                Nome da Empresa
              </Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Digite o nome da empresa..."
                className="border-[3px] border-slate-900 dark:border-slate-950 rounded-xl h-12 font-bold"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="analysis-type" className="font-black uppercase tracking-widest text-sm">
                <Brain className="h-4 w-4 inline mr-2" />
                Tipo de Análise
              </Label>
              <Select
                value={analysisType}
                onValueChange={(value: 'pre_approval' | 'post_approval') => setAnalysisType(value)}
              >
                <SelectTrigger className="border-[3px] border-slate-900 dark:border-slate-950 rounded-xl h-12 font-bold">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="border-[3px] border-slate-900 dark:border-slate-950">
                  <SelectItem value="pre_approval">Pré-aprovação</SelectItem>
                  <SelectItem value="post_approval">Pós-aprovação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="font-black uppercase tracking-widest text-sm">
                Descrição (Opcional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite uma descrição para o card..."
                className="border-[3px] border-slate-900 dark:border-slate-950 rounded-xl min-h-[100px] font-bold"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 h-12 font-black uppercase tracking-widest text-xs"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!companyName.trim()}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-[3px] border-slate-900 dark:border-slate-950 h-12 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Card
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}