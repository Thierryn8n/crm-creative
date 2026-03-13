'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Columns, X } from 'lucide-react'

interface Column {
  id: string
  title: string
  status: string
  color: string
  items: any[]
}

interface AddColumnButtonProps {
  onAddColumn: (columnData: {
    title: string
    status: string
    color: string
  }) => void
}

export function AddColumnButton({ onAddColumn }: AddColumnButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [color, setColor] = useState('bg-gray-50 dark:bg-gray-950/20')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !status.trim()) return
    
    onAddColumn({
      title: title.trim(),
      status: status.trim(),
      color
    })
    
    // Reset form
    setTitle('')
    setStatus('')
    setColor('bg-gray-50 dark:bg-gray-950/20')
    setIsOpen(false)
  }

  const colorOptions = [
    { value: 'bg-gray-50 dark:bg-gray-950/20', label: 'Cinza', color: 'bg-gray-300' },
    { value: 'bg-blue-50 dark:bg-blue-950/20', label: 'Azul', color: 'bg-blue-300' },
    { value: 'bg-green-50 dark:bg-green-950/20', label: 'Verde', color: 'bg-green-300' },
    { value: 'bg-yellow-50 dark:bg-yellow-950/20', label: 'Amarelo', color: 'bg-yellow-300' },
    { value: 'bg-red-50 dark:bg-red-950/20', label: 'Vermelho', color: 'bg-red-300' },
    { value: 'bg-purple-50 dark:bg-purple-950/20', label: 'Roxo', color: 'bg-purple-300' },
    { value: 'bg-pink-50 dark:bg-pink-950/20', label: 'Rosa', color: 'bg-pink-300' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[200px] rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-16 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
        >
          <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          Adicionar Coluna
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] p-0 overflow-hidden">
        <div className="bg-white dark:bg-slate-900">
          <DialogHeader className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Columns className="h-6 w-6" />
              Nova Coluna
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="font-black uppercase tracking-widest text-sm">
                Nome da Coluna
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Em Andamento, Revisão..."
                className="border-[3px] border-slate-900 dark:border-slate-950 rounded-xl h-12 font-bold"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="font-black uppercase tracking-widest text-sm">
                ID do Status
              </label>
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Ex: in_progress, review..."
                className="border-[3px] border-slate-900 dark:border-slate-950 rounded-xl h-12 font-bold"
                required
              />
              <p className="text-xs text-slate-500">
                Use um ID único em inglês (sem espaços)
              </p>
            </div>

            <div className="space-y-3">
              <label className="font-black uppercase tracking-widest text-sm">
                Cor da Coluna
              </label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="border-[3px] border-slate-900 dark:border-slate-950 rounded-xl h-12 font-bold">
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent className="border-[3px] border-slate-900 dark:border-slate-950">
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={!title.trim() || !status.trim()}
                className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white border-[3px] border-slate-900 dark:border-slate-950 h-12 font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Coluna
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}