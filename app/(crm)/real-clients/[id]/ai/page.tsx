'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Brain, Save, Handshake, ArrowLeft, Eye, TrendingUp, Target, Shield, Zap, Globe, BarChart3, Users, Star, ChevronDown, ChevronUp, Mail, Phone, MessageSquare, ExternalLink, Sparkles } from 'lucide-react'
import { AIIntelligencePanel } from '@/components/crm/ai-intelligence-panel'
import { AISaveManager } from '@/components/crm/ai-save-manager'
import { NegotiationForm } from '@/components/crm/negotiation-form'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type Analysis = {
  id: string
  company_name: string
  analysis_type: 'pre_approval' | 'post_approval'
  status: string
  ai_data: any
  user_notes?: string | null
  negotiation_details?: any
  created_at: string
  updated_at: string
}

const ExpandableText = ({ text, maxLines = 4 }: { text: string; maxLines?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (textRef.current) {
        const isTruncated = textRef.current.scrollHeight > textRef.current.clientHeight
        if (isTruncated && !showButton) {
          setShowButton(true)
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [text, isExpanded, showButton])

  if (!text) return null;

  return (
    <div className="space-y-4">
      <p 
        ref={textRef}
        className="text-slate-700 dark:text-slate-300 leading-relaxed transition-all duration-300"
        style={{
          display: !isExpanded ? '-webkit-box' : 'block',
          WebkitLineClamp: !isExpanded ? maxLines : 'none',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.6'
        }}
      >
        {text}
      </p>
      {showButton && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 mt-4 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          {isExpanded ? (
            <><ChevronUp className="h-4 w-4" /> LER MENOS</>
          ) : (
            <><ChevronDown className="h-4 w-4" /> LER MAIS</>
          )}
        </button>
      )}
    </div>
  )
}

export default function ApprovedClientAIPanel() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. Tentar buscar pelo ID do cliente relacionado
        let res = await fetch(`/api/ai-analysis?related_client_id=${params.id}`)
        let data = await res.json()
        
        // 2. Se não encontrar pelo ID, buscar o nome do cliente primeiro e depois tentar pelo nome da empresa
        if (res.ok && (!Array.isArray(data) || data.length === 0)) {
          const clientRes = await fetch(`/api/clients/${params.id}`)
          if (clientRes.ok) {
            const clientData = await clientRes.json()
            if (clientData?.company_name) {
              res = await fetch(`/api/ai-analysis?company_name=${encodeURIComponent(clientData.company_name)}`)
              data = await res.json()
            }
          }
        }

        if (!res.ok) {
          throw new Error(data.error || 'Falha ao buscar análise')
        }
        if (Array.isArray(data) && data.length > 0) {
          setAnalysis(data[0])
        } else {
          setAnalysis(null)
        }
      } catch (e: any) {
        setError(e.message || 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) loadData()
  }, [params?.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-10">
        <div className="relative">
          <div className="h-32 w-32 rounded-full border-[6px] border-slate-100 dark:border-slate-800 border-t-primary animate-spin shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Iniciando Redes Neurais</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xl">Carregando inteligência estratégica para o cliente...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-10">
        <div className="p-10 rounded-[3rem] border-[3px] border-red-900 dark:border-red-950 bg-red-50 dark:bg-red-950/20 shadow-[10px_10px_0px_0px_rgba(239,68,68,0.2)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
          <div className="flex items-center gap-6 text-red-900 dark:text-red-400">
            <div className="p-4 rounded-2xl bg-red-900 dark:bg-red-950 text-white border-2 border-slate-900 dark:border-slate-950">
              <Zap className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Erro de Conexão Neural</h3>
              <p className="font-bold text-lg opacity-80">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Painel <span className="text-primary">IA</span></h1>
            <p className="text-slate-500 dark:text-slate-400 text-xl font-bold leading-relaxed">Dados estratégicos não localizados para este cliente.</p>
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => router.back()} 
            className="rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-16 px-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Voltar
          </Button>
        </div>
        
        <Card className="border-[3px] border-slate-900 dark:border-slate-950 border-dashed bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
          <CardContent className="flex flex-col items-center py-32 text-center space-y-10">
            <div className="h-32 w-32 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <Brain className="h-14 w-14 text-slate-200 dark:text-slate-800" />
            </div>
            <div className="space-y-4 max-w-md">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sem Análise Ativa</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-bold leading-relaxed">
                Não encontramos uma análise prévia para este cliente. Você pode gerar uma nova análise na seção de prospecção ou buscar novos leads.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Helper para renderizar botões de contato interativos
  const renderContactButtons = (contacts: any) => {
    if (!contacts) return null;
    
    const emails = Array.isArray(contacts.emails) ? contacts.emails : (contacts.email ? [contacts.email] : []);
    const phones = Array.isArray(contacts.phones) ? contacts.phones : (contacts.phone ? [contacts.phone] : []);

    return (
      <div className="flex flex-wrap gap-3 mt-4">
        {emails.map((email: string, idx: number) => (
          <a
            key={`email-${idx}`}
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-[2px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all text-[11px] font-black uppercase tracking-wider group/btn"
          >
            <Mail className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            {email}
          </a>
        ))}
        {phones.map((phone: any, idx: number) => {
          const number = typeof phone === 'object' ? phone.number || phone.formatted || phone.value : phone;
          const label = typeof phone === 'object' ? phone.label || phone.type : null;
          const cleanNumber = String(number).replace(/\D/g, '');
          // Garante que o número do WhatsApp tenha o prefixo do país se necessário (ex: Brasil 55)
          const whatsappNumber = cleanNumber.length === 11 && !cleanNumber.startsWith('55') ? `55${cleanNumber}` : cleanNumber;
          const isWhatsapp = typeof phone === 'object' ? phone.whatsapp || phone.is_whatsapp : false;

          return (
            <div key={`phone-${idx}`} className="flex gap-2">
              <a
                href={`tel:${cleanNumber}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-[2px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all text-[11px] font-black uppercase tracking-wider group/btn"
              >
                <Phone className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                {label ? `${label}: ` : ''}{number}
              </a>
              {isWhatsapp && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-white border-[2px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all group/wa"
                >
                  <MessageSquare className="h-5 w-5 group-hover/wa:scale-110 transition-transform" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper para renderizar dados da IA de forma visual e interativa
  const renderAIDataPoint = (label: string, value: any, icon: React.ReactNode, color: string = 'primary') => {
    if (!value) return null;
    
    const colorClasses: Record<string, string> = {
      primary: 'bg-blue-600 text-white border-black',
      blue: 'bg-blue-600 text-white border-black',
      green: 'bg-emerald-600 text-white border-black',
      purple: 'bg-indigo-600 text-white border-black',
      orange: 'bg-amber-500 text-white border-black',
    }

    const formatValue = (v: any) => {
      if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
      if (typeof v === 'object' && v !== null) {
        if (Array.isArray(v)) return v.join(', ');
        return JSON.stringify(v).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ' | ');
      }
      return String(v);
    }

    return (
      <div className="flex flex-col p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 group">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-2xl ${colorClasses[color] || colorClasses.primary} border-2 border-black dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-3 transition-transform duration-500`}>
              {icon}
            </div>
            <span className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors italic">{label}</span>
          </div>
          <div className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 group-hover:bg-primary group-hover:scale-110 transition-all" />
        </div>
        
        <div className="space-y-8">
          {typeof value === 'object' && !Array.isArray(value) ? (
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(value).map(([k, v]: [string, any]) => {
                const isContactKey = k.toLowerCase().includes('contact') || k.toLowerCase().includes('email') || k.toLowerCase().includes('phone');
                
                return (
                  <div key={k} className="flex flex-col gap-3 group/item p-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-[3px] border-transparent hover:border-slate-900 dark:hover:border-slate-950 shadow-none hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 dark:text-slate-500 capitalize font-black text-xs uppercase tracking-widest group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors italic">{k.replace(/_/g, ' ')}</span>
                      {typeof v === 'boolean' && (
                        <div className={`h-6 w-12 rounded-full p-1 border-[3px] border-slate-900 dark:border-slate-950 transition-colors ${v ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${v ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                      )}
                    </div>
                    {isContactKey && typeof v === 'object' ? (
                      renderContactButtons(v)
                    ) : (
                      typeof v !== 'boolean' && (
                        <div className="text-base text-slate-900 dark:text-slate-100 font-bold leading-relaxed">
                          <ExpandableText text={formatValue(v)} maxLines={10} />
                        </div>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="relative pl-8 border-l-[6px] border-primary/20 group-hover:border-primary transition-colors">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-relaxed italic">
                <ExpandableText text={formatValue(value)} maxLines={20} />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-16 p-6 md:p-10 animate-in fade-in duration-700">
      {/* Hero Section - Neo-brutalismo Suave */}
      <div className="relative overflow-hidden rounded-[4rem] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 p-12 md:p-16 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 transition-transform group-hover:scale-110 duration-1000" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-8">
              <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-950 text-white border-2 border-black dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.5)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] animate-pulse-slow">
                <Brain className="h-16 w-16" />
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className="bg-emerald-500 text-white border-2 border-black dark:border-slate-950 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    Inteligência Ativa
                  </Badge>
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 italic">
                    ID: {analysis.id.slice(0, 8)}
                  </span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-slate-900 dark:text-white italic uppercase">
                  {analysis.company_name}
                </h1>
              </div>
            </div>
            
            <p className="text-2xl md:text-3xl text-slate-500 dark:text-slate-400 font-bold max-w-4xl leading-relaxed">
              Análise detalhada e estratégica gerada pela <span className="text-slate-900 dark:text-white underline decoration-primary decoration-[8px] underline-offset-[12px] italic">IA Digitall Evolution</span>. 
              Insights baseados em dados reais de mercado para sua abordagem comercial.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => router.back()} 
              className="rounded-3xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-20 px-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <ArrowLeft className="h-6 w-6 mr-4" />
              Painel CRM
            </Button>
            <Button 
              size="lg" 
              className="rounded-3xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs h-20 px-14 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Zap className="h-6 w-6 mr-4 fill-current" />
              NOVA ANÁLISE
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards - Neo-brutalismo Suave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {[
          { label: 'Match Score', value: '85', unit: '%', icon: Target, color: 'bg-blue-600', trend: 'Potencial de Conversão Alto', progress: 85 },
          { label: 'Presence', value: '7.2', unit: '/10', icon: Globe, color: 'bg-indigo-600', trend: 'Presença Digital Forte', progress: 72 },
          { label: 'Market Fit', value: analysis.ai_data?.industry || 'Tecnologia', unit: '', icon: BarChart3, color: 'bg-purple-600', trend: 'Segmento Premium', progress: 100 },
          { label: 'Status IA', value: 'Ativo', unit: '', icon: Shield, color: 'bg-slate-900', trend: 'Redes Neurais Online', progress: 100 }
        ].map((kpi, i) => (
          <Card key={i} className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[3rem] bg-white dark:bg-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] overflow-hidden hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all group">
            <CardContent className="p-10">
              <div className="flex justify-between items-start mb-8">
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">{kpi.label}</p>
                <div className={`p-5 rounded-2xl ${kpi.color} text-white border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:rotate-3 transition-transform`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{kpi.value}</span>
                  <span className="text-2xl font-black text-slate-400 dark:text-slate-500 italic">{kpi.unit}</span>
                </div>
                {kpi.label !== 'Market Fit' && kpi.label !== 'Status IA' ? (
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full border-[3px] border-slate-900 dark:border-slate-950 overflow-hidden">
                    <div className={`h-full ${kpi.color} rounded-full`} style={{ width: `${kpi.progress}%` }} />
                  </div>
                ) : null}
                <div className="flex items-center gap-3 text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest italic">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  {kpi.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs & Content - Neo-brutalismo Suave */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-16">
        <div className="sticky top-6 z-30 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[3.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] inline-flex w-full sm:w-auto overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent rounded-none p-0 h-auto flex flex-nowrap gap-3 border-none">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Eye },
              { id: 'intelligence', label: 'Inteligência', icon: Brain },
              { id: 'negotiation', label: 'Negociação', icon: Handshake }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="rounded-[2.5rem] px-12 py-6 font-black text-sm uppercase tracking-widest data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.5)] dark:data-[state=active]:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all flex items-center gap-4 whitespace-nowrap italic"
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-12 mt-0 animate-in slide-in-from-bottom-6 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-12">
              {/* Seção de Destaques Estratégicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderAIDataPoint("Análise de Website", analysis.ai_data?.website_analysis, <Globe className="h-6 w-6" />, "blue")}
                {renderAIDataPoint("Presença Social", analysis.ai_data?.social_media, <Users className="h-6 w-6" />, "purple")}
                {renderAIDataPoint("Performance LinkedIn", analysis.ai_data?.linkedin_data, <TrendingUp className="h-6 w-6" />, "blue")}
                {renderAIDataPoint("Análise de Anúncios", analysis.ai_data?.ads_analysis, <Target className="h-6 w-6" />, "orange")}
                {renderAIDataPoint("Tendências de Mercado", analysis.ai_data?.trends_analysis, <TrendingUp className="h-6 w-6" />, "orange")}
                
                {/* Renderizar dinamicamente qualquer outro dado que não foi listado acima */}
                {Object.entries(analysis.ai_data || {})
                  .filter(([key]) => ![
                    'website_analysis', 
                    'social_media', 
                    'linkedin_data', 
                    'ads_analysis', 
                    'trends_analysis', 
                    'strategy_generated'
                  ].includes(key))
                  .map(([key, value]) => renderAIDataPoint(key.replace(/_/g, ' '), value, <Sparkles className="h-6 w-6" />, "primary"))
                }
              </div>
              
              {/* Card de Estratégia Central */}
              <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] rounded-[4rem] overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900 dark:border-slate-950 p-12">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                    <CardTitle className="text-4xl font-black tracking-tighter flex items-center gap-6 uppercase italic text-slate-900 dark:text-white">
                      <div className="p-4 bg-primary rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                        <Zap className="h-8 w-8 text-white fill-current" />
                      </div>
                      Plano de Ataque
                    </CardTitle>
                    <Badge className="bg-primary text-white border-2 border-black dark:border-slate-950 font-black uppercase tracking-[0.2em] text-[11px] px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                      IA GENERATIVA
                    </Badge>
                  </div>
                  <CardDescription className="text-xl font-bold text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                    Abordagem customizada baseada nos pontos fracos e oportunidades detectadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-12 space-y-12">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] p-12 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <Brain className="h-64 w-64" />
                    </div>
                    {analysis.ai_data?.strategy_generated ? (
                      <div className="space-y-12 relative z-10">
                        <div className="text-3xl text-slate-700 dark:text-slate-300 font-black italic leading-relaxed border-l-[8px] border-primary pl-10">
                          <ExpandableText 
                            text={analysis.ai_data.strategy_generated.executive_summary || analysis.ai_data.strategy_generated || "Baseado no match score, a abordagem recomendada é focada em autoridade técnica e demonstração de ROI imediato."} 
                            maxLines={3} 
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                          <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white border-2 border-black dark:border-slate-950 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                                <Zap className="h-6 w-6" />
                              </div>
                              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">Próximo Passo</span>
                            </div>
                            <div className="font-black text-slate-900 dark:text-white text-xl leading-tight italic">
                              <ExpandableText text={analysis.ai_data.strategy_generated.suggested_approach || "Envio de proposta customizada com foco em gaps detectados."} maxLines={2} />
                            </div>
                          </div>
                          <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="h-12 w-12 rounded-2xl bg-purple-600 text-white border-2 border-black dark:border-slate-950 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                                <Target className="h-6 w-6" />
                              </div>
                              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">Foco da Conversa</span>
                            </div>
                            <div className="font-black text-slate-900 dark:text-white text-xl leading-tight italic">
                              <ExpandableText text={Array.isArray(analysis.ai_data.strategy_generated.key_talking_points) ? analysis.ai_data.strategy_generated.key_talking_points[0] : "Demonstração de autoridade e casos de sucesso."} maxLines={2} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-24 text-center space-y-10">
                        <div className="h-32 w-32 rounded-full bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 flex items-center justify-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
                          <Brain className="h-16 w-16 text-slate-200 dark:text-slate-800" />
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Estratégia não processada</h4>
                          <p className="text-slate-500 dark:text-slate-400 max-w-sm font-bold text-xl leading-relaxed">
                            Para gerar um plano de ataque detalhado, utilize o Centro de Inteligência IA.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setActiveTab('intelligence')} 
                          className="rounded-[2rem] bg-slate-900 dark:bg-slate-950 text-white font-black uppercase tracking-widest text-xs h-20 px-12 border-[3px] border-black dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.5)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          GERAR ESTRATÉGIA AGORA
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              {/* Snapshot / Version Manager */}
              <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] rounded-[3rem] bg-slate-900 dark:bg-slate-950 text-white overflow-hidden relative group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all">
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
                <CardHeader className="relative z-10 p-10">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                      <Save className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">
                      Snapshots IA
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 dark:text-slate-500 font-bold text-base mt-4 italic">
                    Histórico de evolução da inteligência estratégica.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 p-10 pt-0">
                  <AISaveManager
                    analysisId={analysis.id}
                    currentData={analysis}
                    onSaveComplete={() => {}}
                  />
                </CardContent>
              </Card>

              {/* Atalhos Rápidos Premium */}
              <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all">
                <CardHeader className="p-10 border-b-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800">
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-6">
                  <Button variant="outline" className="w-full justify-between rounded-[1.5rem] border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 font-black py-10 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all group">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-slate-900/10 dark:border-slate-950/30 mr-5 group-hover:rotate-6 transition-transform">
                        <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="uppercase tracking-tight text-lg text-slate-900 dark:text-white">Ver Site da Empresa</span>
                    </div>
                    <ExternalLink className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between rounded-[1.5rem] border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 font-black py-10 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all group">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-slate-900/10 dark:border-slate-950/30 mr-5 group-hover:rotate-6 transition-transform">
                        <Users className="h-6 w-6 text-blue-700 dark:text-blue-500" />
                      </div>
                      <span className="uppercase tracking-tight text-lg text-slate-900 dark:text-white">Perfil LinkedIn</span>
                    </div>
                    <ExternalLink className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between rounded-[1.5rem] border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 font-black py-10 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all group">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border-2 border-slate-900/10 dark:border-slate-950/30 mr-5 group-hover:rotate-6 transition-transform">
                        <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="uppercase tracking-tight text-lg text-slate-900 dark:text-white">Relatório de Anúncios</span>
                    </div>
                    <ExternalLink className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                  </Button>
                </CardContent>
              </Card>
              
              {/* Card de Segurança/Compliance */}
              <div className="p-10 rounded-[3rem] bg-emerald-50 dark:bg-emerald-950/20 border-[3px] border-emerald-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex items-start gap-8">
                <div className="p-4 rounded-2xl bg-emerald-600 text-white border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <Shield className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h5 className="font-black text-sm text-emerald-900 dark:text-emerald-400 uppercase tracking-[0.2em] italic">Dados Protegidos</h5>
                  <p className="text-base text-emerald-800 dark:text-emerald-300 font-bold opacity-70 dark:opacity-100 leading-relaxed">Análise processada seguindo protocolos LGPD e criptografia de nível militar.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="mt-0 animate-in slide-in-from-right-8 duration-700">
          <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] rounded-[4rem] overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900 dark:border-slate-950 p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-8">
                    <div className="p-6 bg-primary rounded-[2rem] border-2 border-black dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                      <Brain className="h-12 w-12 text-white" />
                    </div>
                    <CardTitle className="text-5xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
                      Centro de Inteligência IA
                    </CardTitle>
                  </div>
                  <CardDescription className="text-2xl font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl italic">
                    Interaja com a IA para aprofundar a análise estratégica e gerar planos de ação customizados.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-6 p-8 bg-white dark:bg-slate-900 rounded-3xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Modelo Utilizado</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">GPT-4 Omni Vision</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
                    <Zap className="h-8 w-8 fill-current" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-12">
              <AIIntelligencePanel
                analysisId={analysis.id}
                companyData={analysis.ai_data}
                onInsightsGenerated={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiation" className="mt-0 animate-in slide-in-from-left-8 duration-700">
          <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] rounded-[4rem] overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900 dark:border-slate-950 p-12">
              <div className="space-y-6">
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-orange-500 rounded-[2rem] border-2 border-black dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                    <Handshake className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-5xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
                    Pipeline de Negociação
                  </CardTitle>
                </div>
                <CardDescription className="text-2xl font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  Registre avanços, propostas e feedbacks das reuniões estratégicas.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-12">
              <NegotiationForm
                analysisId={analysis.id}
                currentAnalysis={analysis}
                onNegotiationComplete={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
