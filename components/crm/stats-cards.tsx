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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title} className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-1 hover:-translate-y-1 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
            <CardTitle className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              {card.title}
            </CardTitle>
            <div className={`p-3 rounded-xl ${card.bgColor} border-2 border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-6 transition-transform`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
