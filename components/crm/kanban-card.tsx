'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface KanbanCardProps {
  item: AIData
  onItemClick: (item: AIData) => void
}

export function KanbanCard({ item, onItemClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'analyzing':
        return 'secondary'
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getAnalysisTypeBadge = (type: string) => {
    return type === 'pre_approval' ? 'Pré-aprovação' : 'Pós-aprovação'
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
        onClick={() => onItemClick(item)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-black text-sm line-clamp-2 uppercase tracking-tight italic">
                  {item.company_name}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                  {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border-2 border-transparent hover:border-slate-900 dark:hover:border-slate-950 rounded-lg">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onItemClick(item)
                  }} className="font-bold uppercase text-[10px] tracking-widest">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getStatusBadgeVariant(item.status)} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-slate-900 dark:border-slate-950">
                {item.status}
              </Badge>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-2 border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800">
                {getAnalysisTypeBadge(item.analysis_type)}
              </Badge>
            </div>

            {item.user_notes && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <p className="line-clamp-2 italic">{item.user_notes}</p>
              </div>
            )}

            {item.ai_data?.strategy_generated && (
              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ✓ Estratégia gerada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
