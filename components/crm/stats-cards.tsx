'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus, MessageSquare, Target, CheckCircle, XCircle, Mail, Search } from 'lucide-react'
import { CRMStats } from '@/lib/types'

interface StatsCardsProps {
  stats: CRMStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total de Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Leads',
      value: stats.leads,
      icon: UserPlus,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Contatados',
      value: stats.contacted,
      icon: MessageSquare,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Negociando',
      value: stats.negotiating,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Clientes Ativos',
      value: stats.clients,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Perdidos',
      value: stats.lost,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Emails Enviados',
      value: stats.emailsSent,
      icon: Mail,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      title: 'Buscas IA',
      value: stats.aiSearches,
      icon: Search,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
            <CardTitle className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor} border-2 border-slate-900 dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
