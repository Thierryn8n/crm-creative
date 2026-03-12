'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    <Card className={`${column.color} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {column.title}
            <Badge variant="secondary" className="text-xs">
              {column.items.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {column.items.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onItemClick(item)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {item.company_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onItemClick(item)
                          }}>
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                        {item.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getAnalysisTypeBadge(item.analysis_type)}
                      </Badge>
                    </div>

                    {item.user_notes && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <p className="line-clamp-2">{item.user_notes}</p>
                      </div>
                    )}

                    {item.ai_data?.strategy_generated && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        <p>✓ Estratégia gerada</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {column.items.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Nenhum item nesta coluna</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}