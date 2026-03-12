'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  ExternalLink, 
  TrendingUp, 
  Globe, 
  Users,
  Lightbulb,
  MessageSquare
} from 'lucide-react'
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
  ai_data: {
    website_analysis?: any
    social_media?: any
    linkedin_data?: any
    trends_analysis?: any
    ads_analysis?: any
    strategy_generated?: any
    negotiation_summary?: any
  }
  user_notes?: string
  negotiation_details?: string
  created_at: string
  updated_at: string
}

interface AIAnalysisCardProps {
  data: AIData
  onStatusChange: (itemId: string, newStatus: string) => void
  onEdit: () => void
}

export function AIAnalysisCard({ data, onStatusChange, onEdit }: AIAnalysisCardProps) {
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

  const getAnalysisIcon = () => {
    switch (data.analysis_type) {
      case 'pre_approval':
        return <Globe className="h-4 w-4" />
      case 'post_approval':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const hasWebsiteAnalysis = !!data.ai_data?.website_analysis
  const hasSocialMedia = !!data.ai_data?.social_media
  const hasLinkedInData = !!data.ai_data?.linkedin_data
  const hasStrategy = !!data.ai_data?.strategy_generated
  const hasUserNotes = !!data.user_notes
  const hasNegotiation = !!data.negotiation_details

  return (
    <Card className="border-[3px] border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden hover:translate-x-1 hover:-translate-y-1 transition-all">
      <CardHeader className="pb-3 border-b-[3px] border-slate-900/10 dark:border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg border-2 border-slate-900/10 dark:border-white/10">
              {getAnalysisIcon()}
            </div>
            <div>
              <CardTitle className="text-lg font-black dark:text-white">{data.company_name}</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                Atualizado em {new Date(data.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 dark:text-white dark:hover:bg-slate-800">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-white/20">
              <DropdownMenuItem onClick={onEdit} className="dark:text-white dark:hover:bg-slate-800">
                <ExternalLink className="h-3 w-3 mr-2" />
                Ver/Editar Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Status e Tipo */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getStatusBadgeVariant(data.status)} className="font-black uppercase tracking-widest text-[10px] border-2">
            {data.status === 'pending' && 'Pendente'}
            {data.status === 'analyzing' && 'Em Análise'}
            {data.status === 'approved' && 'Aprovado'}
            {data.status === 'rejected' && 'Rejeitado'}
          </Badge>
          <Badge variant="outline" className="font-black uppercase tracking-widest text-[10px] border-2 dark:text-white dark:border-white/20">
            {data.analysis_type === 'pre_approval' ? 'Pré-aprovação' : 'Pós-aprovação'}
          </Badge>
        </div>

        {/* Análises Disponíveis */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${hasWebsiteAnalysis ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-slate-800'}`}>
            <Globe className="h-3 w-3" />
            <span className="text-xs font-bold">Website</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${hasSocialMedia ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-slate-800'}`}>
            <Users className="h-3 w-3" />
            <span className="text-xs font-bold">Social</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${hasLinkedInData ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-slate-800'}`}>
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs font-bold">LinkedIn</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${hasStrategy ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' : 'bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-slate-800'}`}>
            <Lightbulb className="h-3 w-3" />
            <span className="text-xs font-bold">Estratégia</span>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-colors ${hasUserNotes ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' : 'bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-500 border-gray-200 dark:border-slate-800'}`}>
            <MessageSquare className="h-3 w-3" />
            <span className="text-xs font-bold">Notas</span>
          </div>
        </div>

        {/* Negociação */}
        {hasNegotiation && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-2xl p-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-2">Negociação</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 line-clamp-2 font-bold leading-relaxed">
              {data.negotiation_details}
            </p>
          </div>
        )}

        {/* Notas do Usuário */}
        {hasUserNotes && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl p-4">
            <h4 className="font-black text-xs uppercase tracking-widest text-blue-800 dark:text-blue-400 mb-2">Observações</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-2 font-bold leading-relaxed">
              {data.user_notes}
            </p>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="flex items-center gap-3 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onEdit}
            className="rounded-xl border-2 border-slate-900 dark:border-white font-black uppercase tracking-widest text-[10px] h-10 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-none"
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            EDITAR
          </Button>
          <div className="ml-auto">
            <select
              value={data.status}
              onChange={(e) => onStatusChange(data.id, e.target.value)}
              className="text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 dark:border-white rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all cursor-pointer"
            >
              <option value="pending">Pendente</option>
              <option value="analyzing">Analisando</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
  )
}