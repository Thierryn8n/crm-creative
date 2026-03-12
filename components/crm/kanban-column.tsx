'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KanbanCard } from './kanban-card'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'

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
}

export function KanbanColumn({ column, onStatusChange, onItemClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.status,
  })

  return (
    <Card className={`${column.color} border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden group`}>
      <CardHeader className="pb-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black flex items-center gap-4 uppercase tracking-widest italic text-slate-900 dark:text-white">
            <span className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white group-hover:scale-125 transition-transform" />
            {column.title}
            <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-slate-900 dark:border-white font-black px-4 py-1.5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group-hover:translate-x-1 transition-all">
              {column.items.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ScrollArea className="h-[600px] pr-4 -mr-4">
          <div ref={setNodeRef} className="space-y-6 min-h-[400px]">
            <SortableContext 
              items={column.items.map(i => i.id)} 
              strategy={verticalListSortingStrategy}
            >
              {column.items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  onItemClick={onItemClick}
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