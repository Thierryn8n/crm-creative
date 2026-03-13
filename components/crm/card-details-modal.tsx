'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Brain,
  CalendarIcon,
  Tag,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Users,
  Clock,
  Edit,
  Save,
  X,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface CardDetails {
  id: string
  company_name: string
  ai_data: any
  notes?: any[]
  labels?: string[]
  due_date?: string
  checklist?: ChecklistItem[]
  assigned_to?: string[]
}

interface CardDetailsModalProps {
  item: CardDetails | null
  isOpen: boolean
  onClose: () => void
  onSave: (itemId: string, updates: Partial<CardDetails>) => void
}

export function CardDetailsModal({ item, isOpen, onClose, onSave }: CardDetailsModalProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempDescription, setTempDescription] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()

  if (!item) return null

  const handleSaveDescription = () => {
    if (tempDescription.trim()) {
      onSave(item.id, { ai_data: { ...item.ai_data, description: tempDescription } })
    }
    setEditingField(null)
    setTempDescription('')
  }

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      const updatedLabels = [...(item.labels || []), newLabel.trim()]
      onSave(item.id, { labels: updatedLabels })
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (label: string) => {
    const updatedLabels = (item.labels || []).filter(l => l !== label)
    onSave(item.id, { labels: updatedLabels })
  }

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false
      }
      const updatedChecklist = [...(item.checklist || []), newItem]
      onSave(item.id, { checklist: updatedChecklist })
      setNewChecklistItem('')
    }
  }

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklist = (item.checklist || []).map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    onSave(item.id, { checklist: updatedChecklist })
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      onSave(item.id, { due_date: date.toISOString() })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl border-[3px] border-slate-900 dark:border-slate-950 rounded-[2.5rem] p-0 overflow-hidden">
        <div className="bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <Brain className="h-8 w-8" />
                {item.company_name}
              </DialogTitle>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 border-2 border-slate-900 dark:border-slate-950 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-8">
            {/* Informações principais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Descrição */}
                <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="h-5 w-5 text-slate-400" />
                      <h3 className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">
                        Descrição da Análise
                      </h3>
                    </div>
                    
                    {editingField === 'description' ? (
                      <div className="space-y-3">
                        <Textarea
                          value={tempDescription}
                          onChange={(e) => setTempDescription(e.target.value)}
                          placeholder="Digite a descrição detalhada..."
                          className="min-h-[120px] border-2 border-slate-300 dark:border-slate-700 rounded-xl"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveDescription}
                            size="sm"
                            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            onClick={() => setEditingField(null)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-2 border-slate-900 dark:border-slate-950"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingField('description')
                          setTempDescription(item.ai_data?.description || '')
                        }}
                        className="cursor-pointer group p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-950 transition-all"
                      >
                        {item.ai_data?.description ? (
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {item.ai_data.description}
                          </p>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                            <Edit className="h-4 w-4" />
                            <span>Adicionar descrição detalhada...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Checklist */}
                <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckSquare className="h-5 w-5 text-slate-400" />
                      <h3 className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">
                        Checklist
                      </h3>
                      <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1">
                        {item.checklist?.length || 0}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {(item.checklist || []).map((checkItem) => (
                        <div key={checkItem.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-800">
                          <input
                            type="checkbox"
                            checked={checkItem.completed}
                            onChange={() => handleToggleChecklistItem(checkItem.id)}
                            className="h-5 w-5 rounded border-2 border-slate-900 dark:border-slate-950 checked:bg-emerald-500 checked:border-emerald-500"
                          />
                          <span className={`flex-1 ${checkItem.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {checkItem.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Input
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        placeholder="Adicionar item..."
                        className="flex-1 border-2 border-slate-300 dark:border-slate-700"
                      />
                      <Button
                        onClick={handleAddChecklistItem}
                        disabled={!newChecklistItem.trim()}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar de ações */}
              <div className="space-y-6">
                {/* Adicionar à card */}
                <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">
                      Adicionar à card
                    </h3>

                    {/* Labels */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Tag className="h-4 w-4" />
                        <span className="text-xs font-bold">Labels</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(item.labels || []).map((label, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => handleRemoveLabel(label)}
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="Novo label..."
                          className="flex-1 text-xs h-8 border-2 border-slate-300 dark:border-slate-700"
                        />
                        <Button
                          onClick={handleAddLabel}
                          size="sm"
                          disabled={!newLabel.trim()}
                          className="h-8 w-8 p-0 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Data de vencimento */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-xs font-bold">Data de Vencimento</span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal border-2 border-slate-300 dark:border-slate-700 h-9"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {item.due_date ? (
                              format(new Date(item.due_date), "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-2 border-slate-900 dark:border-slate-950">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>

                {/* Detalhes da card */}
                <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">
                      Detalhes da Card
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold">Criado em</span>
                        <span className="text-xs">
                          {format(new Date(item.ai_data?.created_at || new Date()), "PPP", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-bold">Status</span>
                        <Badge variant="outline" className="text-xs">
                          {item.ai_data?.status || 'pending'}
                        </Badge>
                      </div>

                      {item.due_date && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <CalendarIcon className="h-4 w-4" />
                          <span className="text-xs font-bold">Vencimento</span>
                          <span className="text-xs">
                            {format(new Date(item.due_date), "PPP", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}