'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KanbanCard } from './kanban-card'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Plus, Edit, Save, X } from 'lucide-react'
import { AddCardModal } from './add-card-modal'

interface AIData {
  id: string
  company_name: string
  analysis_type: 'pre_approval' | 'post_approval'
  status: 'pending' | 'analyzing' | 'approved' | 'rejected'
  ai_data: any
  user_notes?: string
  negotiation_details?: string
  created_at: string
  updated_at: string
}

interface KanbanColumnProps {
  column: {
    id: string
    title: string
    status: string
    items: AIData[]
    color: string
  }
  onStatusChange: (itemId: string, newStatus: string) => void
  onItemClick: (item: AIData) => void
  onNotesUpdate: (itemId: string, notes: any[]) => void
  onAddCard: (columnStatus: string) => void
  onColumnRename?: (columnId: string, newTitle: string) => void
  isFirstColumn?: boolean
  compact?: boolean
}

export function KanbanColumn({ column, onStatusChange, onItemClick, onNotesUpdate, onAddCard, onColumnRename, isFirstColumn = false, compact = false }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.status,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(column.title)

  const handleSaveTitle = () => {
    if (editedTitle.trim() && onColumnRename) {
      onColumnRename(column.id, editedTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(column.title)
    setIsEditing(false)
  }

  return (
    <Card className={`${column.color} border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden group`}>
      <CardHeader className="pb-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white group-hover:scale-125 transition-transform" />
            
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 text-sm font-black uppercase tracking-widest italic border-2 border-slate-900 dark:border-slate-950 h-8 px-2"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <Button
                  onClick={handleSaveTitle}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-emerald-500 hover:text-emerald-600"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <CardTitle className="text-sm font-black flex items-center gap-3 uppercase tracking-widest italic text-slate-900 dark:text-white flex-1">
                <span className="truncate">{column.title}</span>
                <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-slate-900 dark:border-white font-black px-3 py-1 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  {column.items.length}
                </Badge>
                {isFirstColumn && onColumnRename && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
                    title="Editar nome da coluna"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "p-3" : "p-6"}>
        {/* Botão para adicionar novo card - NO TOPO */}
        <div className="mb-4">
          <AddCardModal
            columnStatus={column.status}
            onAddCard={onAddCard}
          >
            <Button
              variant="outline"
              className="w-full rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/add-btn"
            >
              <Plus className="h-3 w-3 mr-2 group-hover/add-btn:scale-110 transition-transform" />
              Adicionar Card
            </Button>
          </AddCardModal>
        </div>

        <ScrollArea className={compact ? "h-[520px] pr-3 -mr-3" : "h-[600px] pr-4 -mr-4"}>
          <div ref={setNodeRef} className={`${compact ? "space-y-3" : "space-y-6"} min-h-[400px]`}>
            <SortableContext 
              items={column.items.map(i => i.id)} 
              strategy={verticalListSortingStrategy}
            >
              {column.items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  onItemClick={onItemClick}
                  onNotesUpdate={onNotesUpdate}
                />
              ))}
            </SortableContext>
            
            {column.items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-[3px] border-slate-900/10 dark:border-slate-100/10 border-dashed rounded-[2rem] bg-slate-50/30 dark:bg-slate-900/30 group-hover:border-slate-900/20 transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <span className="text-2xl opacity-20 group-hover:opacity-40 transition-opacity">🗃️</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 italic">Vazio</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
