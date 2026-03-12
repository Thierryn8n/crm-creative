'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSidebar } from '@/components/ui/sidebar'
import { 
  Building2, 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Calendar,
  FileText,
  Award,
  Users,
  Eye,
  Link2,
  ExternalLink,
  RefreshCw,
  Star,
  Briefcase,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  Send,
  BarChart3,
  Search,
  Zap,
  Rocket,
  Heart,
  Share2,
  Download,
  Clock,
  MapPin,
  Phone,
  Mail,
  Info,
  Image as ImageIcon,
  MessageCircle,
  Hash,
  Loader2,
  Plus
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Copy, Video } from "lucide-react"

interface DeepAnalysisProps {
  companyName: string
  websiteUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  twitterUrl?: string
  industry?: string
  onComplete?: (analysis: any) => void
  initialAction?: 'add_contact' | 'reanalyze'
}

interface AnalysisData {
  companyName: string
  webData: any
  website: {
    summary?: string
    structure?: any
    culture?: any
    institutional?: any
    contacts?: any
    local_presence?: {
      google_maps_url?: string
      rating?: number
      reviews_count?: number
      address?: string
      opening_hours?: string
      main_reviews_summary?: string
    }
  }
  social: any
  market_ads: any
  personalizedStrategy: any
  userProfile: any
  analyzedAt: string
  debug?: {
    hasWebsiteData: boolean
    hasLinkedinData: boolean
    hasSocialMediaData: boolean
    hasAdCampaigns: boolean
    hasMarketTrends: boolean
  }
}

export function CompanyDeepAnalysis({ 
  companyName, 
  websiteUrl, 
  linkedinUrl, 
  instagramUrl, 
  facebookUrl, 
  twitterUrl, 
  industry,
  onComplete,
  initialAction
}: DeepAnalysisProps) {
  const { setOpen } = useSidebar()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWebsiteUrl, setCurrentWebsiteUrl] = useState(websiteUrl || '')
  const [partialLoading, setPartialLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

  // Se a ação inicial for 'add_contact', abrir o modal quando o carregamento terminar
  useEffect(() => {
    if (!loading && initialAction === 'add_contact') {
      setIsAddContactModalOpen(true)
    }
  }, [loading, initialAction])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [newContact, setNewContact] = useState({ label: '', number: '', email: '' })
  const [progress, setProgress] = useState(0)

  const handleAddContact = () => {
    if (!analysis) return

    const updatedAnalysis = { ...analysis }
    
    // Garantir que a estrutura de contatos existe
    if (!updatedAnalysis.website) updatedAnalysis.website = {}
    if (!updatedAnalysis.website.contacts) updatedAnalysis.website.contacts = { phones: [], emails: [] }
    if (!updatedAnalysis.website.contacts.phones) updatedAnalysis.website.contacts.phones = []
    if (!updatedAnalysis.website.contacts.emails) updatedAnalysis.website.contacts.emails = []

    // Adicionar telefone se fornecido
    if (newContact.number) {
      updatedAnalysis.website.contacts.phones.push({
        label: newContact.label || 'Telefone Adicionado',
        number: newContact.number
      })
    }

    // Adicionar email se fornecido
    if (newContact.email) {
      updatedAnalysis.website.contacts.emails.push(newContact.email)
    }

    setAnalysis(updatedAnalysis)
    setIsAddContactModalOpen(false)
    setNewContact({ label: '', number: '', email: '' })
  }
  const [currentStep, setCurrentStep] = useState('Iniciando análise...')

  const analysisSteps = [
    'Coletando dados da web...',
    'Analisando website e cultura...',
    'Processando redes sociais...',
    'Avaliando mercado e anúncios...',
    'Gerando estratégia personalizada...',
    'Finalizando relatório completo...'
  ]

  useEffect(() => {
    // Recolher o menu lateral automaticamente ao entrar na página de análise
    setOpen(false)
  }, [setOpen])

  useEffect(() => {
    performDeepAnalysis()
  }, [])

  // Keep parent component in sync with latest analysis data
  useEffect(() => {
    if (analysis && onComplete) {
      onComplete(analysis)
    }
  }, [analysis, onComplete])

  const performDeepAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)
      setProgress(5)
      setCurrentStep(analysisSteps[0])
      
      // Simulação de progresso enquanto a API processa (que pode demorar 20-40s)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          // Incrementos menores conforme chega perto do fim
          const increment = prev < 30 ? 2 : prev < 60 ? 1 : 0.5
          return prev + increment
        })
      }, 500)

      // Atualizar passos periodicamente para feedback visual
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          const currentIndex = analysisSteps.indexOf(prev)
          if (currentIndex < analysisSteps.length - 1) {
            return analysisSteps[currentIndex + 1]
          }
          return prev
        })
      }, 5000)

      const response = await fetch('/api/company-deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          websiteUrl: currentWebsiteUrl,
          linkedinUrl,
          instagramUrl,
          facebookUrl,
          twitterUrl,
          industry
        })
      })

      clearInterval(progressInterval)
      clearInterval(stepInterval)

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Falha na análise profunda';
        
        try {
          const errorJson = JSON.parse(errorText);
          // Garantir que errorMessage seja sempre uma string primitiva
          if (errorJson.error) {
            errorMessage = typeof errorJson.error === 'string' 
              ? errorJson.error 
              : JSON.stringify(errorJson.error);
          }
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        // Importante: Garantir que o que estamos lançando é uma string
        throw new Error(String(errorMessage));
      }
      
      const data = await response.json()
      setAnalysis(data)
      
      setProgress(100)
      setCurrentStep('Análise concluída!')
    } catch (error: any) {
      console.error('Erro na análise:', error)
      setError(error.message || 'Erro ao realizar análise profunda da empresa. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderWhatsappModal = () => {
    if (!selectedContact) return null
    
    const script = analysis?.personalizedStrategy?.outreach?.whatsapp_script || 
      `Olá, sou da equipe de desenvolvimento. Notei que a ${companyName} está expandindo sua presença digital e gostaria de apresentar uma proposta B2B personalizada baseada no meu portfólio de projetos criativos.`

    const hasResume = !!analysis?.userProfile?.resume_text && analysis.userProfile.resume_text.length > 50

    return (
      <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#25D366] dark:text-[#4ade80] font-black uppercase tracking-tighter text-xl">
              <MessageCircle className="h-5 w-5 fill-[#25D366] dark:fill-[#4ade80]" />
              Roteiro de Abordagem WhatsApp
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold">
              Script personalizado baseado no seu currículo e portfólio para a {companyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!hasResume ? (
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs py-2 rounded-xl">
                <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  <strong>Atenção:</strong> Seu currículo não foi detectado. O script gerado será genérico. Para melhores resultados, faça o upload do seu currículo no menu de Perfil.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-[10px] py-1 rounded-xl">
                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Este script foi personalizado com base no seu currículo e experiência.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700 relative group">
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {script}
              </p>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => copyToClipboard(script)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-xs h-12 rounded-xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                onClick={() => {
                  const phone = typeof selectedContact === 'string' ? selectedContact : selectedContact?.formatted || selectedContact?.number
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(script)}`, '_blank')
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar agora
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 font-black uppercase tracking-widest text-xs h-12 rounded-xl border-2 border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                onClick={() => copyToClipboard(script)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const renderEmailModal = () => {
    // Pode ser disparado passando o email como string ou vindo do contato selecionado
    const emailTo = typeof selectedContact === 'string' ? selectedContact : selectedContact?.email
    
    if (!emailTo) return null
    
    const emailPitch = analysis?.personalizedStrategy?.outreach?.email_pitch || 
      `Prezada equipe da ${companyName},\n\nEstou acompanhando o crescimento de vocês no setor e, analisando sua presença digital, identifiquei oportunidades estratégicas onde meu portfólio de serviços B2B pode agregar valor imediato.\n\nEm anexo, envio minha apresentação comercial detalhada.`

    const hasResume = !!analysis?.userProfile?.resume_text && analysis.userProfile.resume_text.length > 50

    return (
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-tighter text-xl">
              <Mail className="h-5 w-5" />
              Pitch de Vendas B2B (E-mail)
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold">
              Apresentação comercial estruturada baseada no seu currículo e portfólio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!hasResume ? (
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs py-2 rounded-xl">
                <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  <strong>Importante:</strong> Seu currículo não foi detectado ou está muito curto. Para um pitch que realmente cite suas experiências reais, preencha seu perfil primeiro.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-[10px] py-1 rounded-xl">
                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                <AlertDescription>
                  Pitch estratégico gerado com sucesso usando dados do seu currículo e portfólio.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Assunto sugerido:</label>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-100 dark:border-blue-800 text-sm font-bold text-blue-900 dark:text-blue-200">
                Proposta de Parceria Estratégica: {companyName} + {analysis?.userProfile?.user_name || 'Soluções Criativas'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700 relative group max-h-[300px] overflow-y-auto">
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {emailPitch}
              </p>
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => copyToClipboard(emailPitch)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border-2 rounded-xl bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-800">
                <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-1">Baseado no Currículo</p>
                <p className="text-[11px] text-gray-600 dark:text-slate-400 font-bold">Suas experiências de {analysis?.userProfile?.experience_years || 'vários'} anos e competências foram integradas.</p>
              </div>
              <div className="p-3 border-2 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800">
                <p className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1">Anexo Sugerido</p>
                <p className="text-[11px] text-gray-600 dark:text-slate-400 font-bold">Seu currículo PDF e link do portfólio digital.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs h-12 rounded-xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                onClick={() => window.open(`mailto:${emailTo}?subject=Proposta de Parceria&body=${encodeURIComponent(emailPitch)}`)}
              >
                <Send className="h-4 w-4 mr-2" />
                Abrir no E-mail
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 font-black uppercase tracking-widest text-xs h-12 rounded-xl border-2 border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                onClick={() => copyToClipboard(emailPitch)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Pitch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const performPartialAnalysis = async (section: string) => {
    try {
      setPartialLoading(prev => ({ ...prev, [section]: true }))
      
      const response = await fetch('/api/company-deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          websiteUrl: currentWebsiteUrl,
          linkedinUrl,
          instagramUrl,
          facebookUrl,
          twitterUrl,
          industry,
          section // Send the specific section to be analyzed
        })
      })

      if (!response.ok) throw new Error(`Falha ao analisar ${section}`)
      
      const newData = await response.json()
      
      setAnalysis(prev => {
        if (!prev) return newData
        // Update only the specific section in the state
        if (section === 'market_ads') {
          return {
            ...prev,
            market_ads: newData.market_ads
          }
        }
        return {
          ...prev,
          [section]: newData[section] || (prev as any)[section]
        }
      })
    } catch (err: any) {
      console.error(`Erro na análise de ${section}:`, err)
    } finally {
      setPartialLoading(prev => ({ ...prev, [section]: false }))
    }
  }

  const renderEmptyState = (title: string, description: string, icon: any, onRetry?: () => void, isRetrying?: boolean) => {
    const Icon = icon
    return (
      <Card className="mb-10 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-dashed transition-all">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <Icon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          </div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{title}</h4>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed mb-6">{description}</p>
          
          <div className="w-full max-w-md space-y-4 mb-8">
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary" />
              <input 
                type="url" 
                placeholder="https://www.empresa.com.br"
                value={currentWebsiteUrl}
                onChange={(e) => setCurrentWebsiteUrl(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary focus:outline-none transition-all font-bold text-sm"
              />
            </div>
            
            <Button 
              onClick={onRetry || performDeepAnalysis} 
              className="w-full rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              disabled={isRetrying || loading}
            >
              {isRetrying || loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {onRetry ? 'Salvar e Re-analisar' : 'Recarregar Análise'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWebData = () => {
    if (!analysis?.webData) {
      return renderEmptyState(
        "Dados Reais não disponíveis",
        "Não foi possível coletar dados brutos do website ou redes sociais no momento.",
        Search,
        () => performPartialAnalysis('webData'),
        partialLoading['webData']
      )
    }
    
    const { webData } = analysis
    
    return (
      <Card className="mb-10 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-purple-50/50 dark:bg-purple-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-2xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dados Reais <span className="text-purple-600 dark:text-purple-400">Coletados</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">Informações brutas extraídas diretamente da web</CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('webData')}
              disabled={partialLoading['webData']}
            >
              {partialLoading['webData'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Recoletar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          
          {/* Website Data */}
          {webData.website && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(147,51,234,0.3)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Website Corporativo</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border-2 border-slate-200 dark:border-slate-700">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Título da Página</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{webData.website.title || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Meta Descrição</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{webData.website.metaDescription || webData.website.description || 'N/A'}"
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {webData.website.phones && webData.website.phones.length > 0 && (
                      <Badge className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        <Phone className="h-3 w-3 mr-1.5" /> {webData.website.phones.length} telefones
                      </Badge>
                    )}
                    {webData.website.emails && webData.website.emails.length > 0 && (
                      <Badge className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        <Mail className="h-3 w-3 mr-1.5" /> {webData.website.emails.length} e-mails
                      </Badge>
                    )}
                    {webData.website.images && webData.website.images.length > 0 && (
                      <Badge className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        <ImageIcon className="h-3 w-3 mr-1.5" /> {webData.website.images.length} imagens
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 bg-slate-900 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Technical Header</p>
                    <p className="text-[11px] text-slate-300 dark:text-slate-400 font-mono line-clamp-4 leading-relaxed">
                      {webData.website.header || 'N/A'}
                    </p>
                  </div>
                  <div className="p-5 bg-slate-900 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Technical Footer</p>
                    <p className="text-[11px] text-slate-300 dark:text-slate-400 font-mono line-clamp-4 leading-relaxed">
                      {webData.website.footer || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn Data */}
          {webData.linkedin && (
            <div className="space-y-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <Linkedin className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Perfil LinkedIn</h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Seguidores', value: webData.linkedin.followers, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Funcionários', value: webData.linkedin.employees, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Posts Recentes', value: webData.linkedin.recentPosts, color: 'text-purple-600 dark:text-purple-400' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] text-center">
                    <p className={`text-3xl font-black ${stat.color} tracking-tighter mb-1`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : (stat.value || 'N/A')}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] flex flex-col items-center justify-center">
                  {webData.linkedin.hiring !== undefined ? (
                    <Badge className={`${webData.linkedin.hiring ? 'bg-emerald-500' : 'bg-slate-400'} text-white border-2 border-slate-900 dark:border-slate-950 font-black uppercase tracking-widest px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]`}>
                      {webData.linkedin.hiring ? 'CONTRATANDO' : 'SEM VAGAS'}
                    </Badge>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs">N/A</p>
                  )}
                </div>
              </div>

              {webData.linkedin.departments && webData.linkedin.departments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-950">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2 self-center">Departamentos:</span>
                  {webData.linkedin.departments.map((dept: string, index: number) => (
                    <Badge key={index} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1">
                      {dept}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social Media Data */}
          {webData.socialMedia && (
            <div className="space-y-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(147,51,234,0.3)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Redes Sociais</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(webData.socialMedia).map(([platform, data]: [string, any]) => {
                  if (!data) return null
                  
                  const platformConfig: Record<string, { icon: any, color: string, shadow: string, darkShadow: string }> = {
                    instagram: { icon: Instagram, color: 'text-pink-600 dark:text-pink-400', shadow: 'rgba(219,39,119,1)', darkShadow: 'rgba(255,255,255,1)' },
                    facebook: { icon: Facebook, color: 'text-blue-700 dark:text-blue-400', shadow: 'rgba(29,78,216,1)', darkShadow: 'rgba(255,255,255,1)' },
                    twitter: { icon: Twitter, color: 'text-sky-500 dark:text-sky-400', shadow: 'rgba(14,165,233,1)', darkShadow: 'rgba(255,255,255,1)' },
                    youtube: { icon: ExternalLink, color: 'text-red-600 dark:text-red-400', shadow: 'rgba(220,38,38,1)', darkShadow: 'rgba(255,255,255,1)' }
                  }
                  
                  const config = platformConfig[platform] || { icon: ExternalLink, color: 'text-slate-600 dark:text-slate-400', shadow: 'rgba(0,0,0,1)', darkShadow: 'rgba(255,255,255,1)' }
                  const Icon = config.icon
                  
                  return (
                    <Card key={platform} className="border-[3px] border-slate-900 dark:border-slate-950 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                      <div className="p-5 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${config.color}`} />
                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">{platform}</span>
                          </div>
                          {data.verified && (
                            <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center border border-slate-900 dark:border-white">
                              <span className="text-[8px] text-white font-black">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seguidores</span>
                          <span className="font-black text-slate-900 dark:text-white">{typeof data.followers === 'number' ? data.followers.toLocaleString() : (data.followers || 'N/A')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Posts</span>
                          <span className="font-black text-slate-900 dark:text-white">{data.posts || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Engajamento</span>
                          <Badge className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 font-black text-[10px] border border-slate-700">{data.engagement || '0'}%</Badge>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Market Trends */}
          {webData.marketTrends && (
            <div className="space-y-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-slate-900 dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(249,115,22,0.3)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Tendências de Mercado</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Crescimento do Setor</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{webData.marketTrends.industryGrowth || 'N/A'}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tamanho: {webData.marketTrends.marketSize || 'N/A'}</p>
                </div>
                
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Posição no Mercado</p>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-slate-900 dark:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-sm border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                      {webData.marketTrends.marketPosition || 'N/A'}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 italic">
                    {typeof webData.marketTrends.competitors === 'number' 
                      ? `${webData.marketTrends.competitors} principais concorrentes detectados`
                      : (webData.marketTrends.competitors || 'Principais concorrentes detectados')}
                  </p>
                </div>
              </div>
              
              {webData.marketTrends.keyTrends && webData.marketTrends.keyTrends.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Movimentações do Setor:</p>
                  <div className="flex flex-wrap gap-3">
                    {webData.marketTrends.keyTrends.map((trend: string, index: number) => (
                      <div key={index} className="px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-950 rounded-xl font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-default text-slate-900 dark:text-white">
                        {trend}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ad Campaigns */}
          {webData.adCampaigns && (
            <div className="space-y-6 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)]">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Estratégia de Tráfego Pago</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {webData.adCampaigns.facebookAds && (
                  <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(29,78,216,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
                    <div className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Facebook className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Meta Ads</span>
                      </div>
                      {webData.adCampaigns.facebookAds.active && (
                        <Badge className="bg-emerald-500 text-white font-black border-2 border-black dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">ATIVO</Badge>
                      )}
                    </div>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Campanhas</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{webData.adCampaigns.facebookAds.campaigns || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Investimento Est.</p>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                            R$ {typeof webData.adCampaigns.facebookAds.monthlySpend === 'number' 
                              ? webData.adCampaigns.facebookAds.monthlySpend.toLocaleString() 
                              : (webData.adCampaigns.facebookAds.monthlySpend || '0')}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">/mês</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Público Principal</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          {webData.adCampaigns.facebookAds.mainAudience || 'N/A'}
                        </p>
                      </div>
                      {webData.adCampaigns.facebookAds.topKeywords && webData.adCampaigns.facebookAds.topKeywords.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Interesses Alvo</p>
                          <div className="flex flex-wrap gap-2">
                            {webData.adCampaigns.facebookAds.topKeywords.map((keyword: string, index: number) => (
                              <Badge key={index} className="bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-900 font-bold text-[10px]">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {webData.adCampaigns.googleAds && (
                  <Card className="border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(16,185,129,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
                    <div className="p-6 border-b-[3px] border-slate-900 dark:border-slate-950 bg-emerald-50/50 dark:bg-emerald-900/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Search className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Google Ads</span>
                      </div>
                      {webData.adCampaigns.googleAds.active && (
                        <Badge className="bg-emerald-500 text-white font-black border-2 border-black dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">ATIVO</Badge>
                      )}
                    </div>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Campanhas</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{webData.adCampaigns.googleAds.campaigns || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Volume Busca</p>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            {typeof webData.adCampaigns.googleAds.searchVolume === 'number'
                              ? webData.adCampaigns.googleAds.searchVolume.toLocaleString()
                              : (webData.adCampaigns.googleAds.searchVolume || '0')}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">queries</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Budget Estimado</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                          R$ {typeof webData.adCampaigns.googleAds.monthlySpend === 'number' 
                            ? webData.adCampaigns.googleAds.monthlySpend.toLocaleString() 
                            : (webData.adCampaigns.googleAds.monthlySpend || '0')}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">/mês</span>
                        </p>
                      </div>
                      {webData.adCampaigns.googleAds.topKeywords && webData.adCampaigns.googleAds.topKeywords.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Top Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {webData.adCampaigns.googleAds.topKeywords.map((keyword: string, index: number) => (
                              <Badge key={index} className="bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-900 font-bold text-[10px]">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderSummary = () => {
    const summary = analysis?.website?.summary
    
    // Verificação robusta
    const hasRealData = summary && summary !== 'N/A' && summary.length > 20

    if (!hasRealData) return null

    return (
      <Card className="mb-8 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Visão Geral <span className="text-blue-600 dark:text-blue-400">Estratégica</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">Resumo executivo gerado por IA</CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('summary')}
              disabled={partialLoading['summary']}
            >
              {partialLoading['summary'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Refinar Análise
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
            {summary}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderLocalPresence = () => {
    const local = analysis?.website?.local_presence
    
    // Verificação robusta
    const hasRealData = local && (
      (local.address && local.address !== 'N/A' && local.address !== 'Não informado') ||
      (local.google_maps_url && local.google_maps_url !== 'N/A') ||
      (local.rating && local.rating > 0)
    )

    if (!hasRealData) return null

    return (
      <Card className="mb-8 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-orange-50/50 dark:bg-orange-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Presença <span className="text-orange-600 dark:text-orange-400">Local</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">Localização e reputação digital</CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('website')}
              disabled={partialLoading['website']}
            >
              {partialLoading['website'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border-2 border-slate-900 dark:border-slate-950 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                    <MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Endereço Principal</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{local.address || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                    <Clock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Horário de Operação</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{local.opening_hours || 'Não informado'}</p>
                  </div>
                </div>

                {local.google_maps_url && (
                  <Button 
                    className="w-full mt-2 rounded-xl font-black text-sm uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                    onClick={() => window.open(local.google_maps_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir no Maps
                  </Button>
                )}
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-5 w-5 ${s <= Math.round(local.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700'}`} />
                    ))}
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white ml-2">{local.rating || '0.0'}</span>
                </div>
                <Badge className="bg-orange-600 text-white font-black uppercase tracking-widest text-[10px] border-2 border-black dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  {local.reviews_count || 0} Reviews
                </Badge>
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Sentimento do Cliente
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic leading-relaxed bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                  {local.main_reviews_summary || 'Nenhuma avaliação relevante encontrada para análise de sentimento.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderInstitutionalReport = () => {
    const data = analysis?.website?.institutional
    const contacts = analysis?.website?.contacts
    
    if (!data && !contacts) return null

    return (
      <Card className="mb-8 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-purple-50/50 dark:bg-purple-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">DNA <span className="text-purple-600 dark:text-purple-400">Institucional</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">Identidade, serviços e canais diretos</CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('institutional')}
              disabled={partialLoading['institutional']}
            >
              {partialLoading['institutional'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
                  Sobre a Operação
                </h4>
                <div className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[1.5rem] border-2 border-slate-900 dark:border-slate-950">
                  {data?.about || 'A IA não identificou um resumo institucional claro no site.'}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
                  Core Business & Serviços
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data?.services && Array.isArray(data.services) ? (
                    data.services.map((service: string, i: number) => (
                      <Badge key={i} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-black uppercase tracking-widest text-[10px] px-3 py-1.5 border-2 border-slate-900 dark:border-slate-950 rounded-xl">
                        {service}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500 font-bold italic">Nenhum serviço mapeado</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
                  Pontos de Contato
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="rounded-xl border-2 border-slate-900 dark:border-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar Contato
                </Button>
              </div>

              <Dialog open={isAddContactModalOpen} onOpenChange={setIsAddContactModalOpen}>
                <DialogContent className="sm:max-w-[425px] border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Adicionar Contato</DialogTitle>
                    <DialogDescription className="font-bold text-slate-500">
                      Insira as informações de contato manualmente para esta empresa.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="label" className="font-black uppercase text-[10px] tracking-widest text-slate-500">Etiqueta (ex: WhatsApp, Comercial)</Label>
                      <Input
                        id="label"
                        placeholder="WhatsApp Comercial"
                        className="rounded-xl border-2 border-slate-900 dark:border-slate-950 font-bold"
                        value={newContact.label}
                        onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="number" className="font-black uppercase text-[10px] tracking-widest text-slate-500">Telefone</Label>
                      <Input
                        id="number"
                        placeholder="(11) 99999-9999"
                        className="rounded-xl border-2 border-slate-900 dark:border-slate-950 font-bold"
                        value={newContact.number}
                        onChange={(e) => setNewContact({ ...newContact, number: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="font-black uppercase text-[10px] tracking-widest text-slate-500">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contato@empresa.com"
                        className="rounded-xl border-2 border-slate-900 dark:border-slate-950 font-bold"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest rounded-xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all py-6"
                      onClick={handleAddContact}
                    >
                      Salvar Contato
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <div className="space-y-4">
                {contacts?.phones && Array.isArray(contacts.phones) && contacts.phones.length > 0 ? (
                  contacts.phones.map((phone: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-[1.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                          {phone.label || 'Telefone Corporativo'}
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {phone.number}
                        </span>
                      </div>
                      <Button 
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white border-2 border-slate-900 dark:border-slate-950 font-black uppercase tracking-widest text-xs px-6 h-12 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                        onClick={() => {
                          setSelectedContact(phone)
                          setIsWhatsappModalOpen(true)
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2 fill-white" />
                        WhatsApp
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-900 dark:border-slate-950 text-center">
                    <p className="text-slate-400 dark:text-slate-500 font-bold">Nenhum canal telefônico detectado.</p>
                  </div>
                )}

                {contacts?.emails && Array.isArray(contacts.emails) && contacts.emails.length > 0 && (
                  <div className="mt-8 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">E-mails de Prospecção</p>
                    <div className="space-y-3">
                      {contacts.emails.map((email: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-900 dark:border-slate-950 group hover:border-purple-300 dark:hover:border-purple-500 transition-all">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{email}</span>
                          <Button 
                            variant="ghost" 
                            className="h-10 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-black uppercase tracking-widest text-[10px] gap-2 rounded-lg"
                            onClick={() => {
                              setSelectedContact(email)
                              setIsEmailModalOpen(true)
                            }}
                          >
                            <Mail className="h-4 w-4" />
                            Gerar Pitch
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {data?.images && Array.isArray(data.images) && data.images.length > 0 && (
            <div className="space-y-4 pt-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
                Ativos Visuais
              </h4>
              <ScrollArea className="w-full whitespace-nowrap rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800/50 p-6 shadow-inner">
                <div className="flex gap-6">
                  {data.images.map((img: string, i: number) => (
                    <div key={i} className="relative h-32 w-56 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group">
                      <img 
                        src={img} 
                        alt={`Asset ${i}`} 
                        className="h-full w-full object-contain p-4 transition-transform group-hover:scale-110"
                        onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 dark:border-slate-700">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                <Hash className="h-3 w-3" /> Technical Header
              </span>
              <p className="text-xs text-slate-300 dark:text-slate-400 font-medium italic leading-relaxed">
                {data?.header_summary || 'Meta-informações de cabeçalho não extraídas.'}
              </p>
            </div>
            <div className="p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 dark:border-slate-700">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                <Hash className="h-3 w-3" /> Technical Footer
              </span>
              <p className="text-xs text-slate-300 dark:text-slate-400 font-medium italic leading-relaxed">
                {data?.footer_summary || 'Links e metadados de rodapé indisponíveis.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderWebsiteAnalysis = () => {
    // Check for both nested structure and flat structure for compatibility
    const websiteData = analysis?.website?.institutional || analysis?.website
    
    // Verificação robusta: se não houver NENHUM dado real, mostra empty state
    const hasRealData = websiteData && (
      (websiteData.structure && Object.values(websiteData.structure).some(v => v !== 'N/A' && v !== null)) || 
      (websiteData.culture && Object.values(websiteData.culture).some(v => v !== 'N/A' && v !== null)) ||
      (websiteData.careers && Object.values(websiteData.careers).some(v => v !== 'N/A' && v !== null))
    )

    if (!hasRealData) {
      return renderEmptyState(
        "Análise do Website indisponível",
        "A IA não conseguiu extrair informações detalhadas ou os dados encontrados são insuficientes.",
        Globe,
        () => performPartialAnalysis('website'),
        partialLoading['website']
      )
    }
    
    const data = websiteData

    return (
      <Card className="mb-10 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Análise do <span className="text-blue-600 dark:text-blue-400">Website</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">
                  Estrutura, experiência e cultura organizacional
                </CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('website')}
              disabled={partialLoading['website']}
            >
              {partialLoading['website'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Escanear Website
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                Estrutura e Design
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Navegação</span>
                  <Badge className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1 rounded-lg">
                    {data.structure?.navigation || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rating UX/UI</span>
                  <Badge className="bg-blue-600 dark:bg-blue-500 text-white dark:text-slate-900 border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1 rounded-lg">
                    {data.structure?.ux_rating || 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Mobile Friendly</span>
                  <Badge className={`font-black px-3 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-950 ${data.structure?.mobile_friendly ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                    {data.structure?.mobile_friendly ? 'SIM' : 'NÃO'}
                  </Badge>
                </div>
              </div>
              {data.structure?.tech_stack && Array.isArray(data.structure.tech_stack) && (
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Stack Tecnológica</p>
                  <div className="flex flex-wrap gap-2">
                    {data.structure.tech_stack.map((tech: string, i: number) => (
                      <Badge key={i} className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 font-bold text-[10px] px-3 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-950">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                Cultura e Valores
              </h4>
              <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-[2rem] border-2 border-slate-900 dark:border-slate-950 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Heart className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100 italic leading-relaxed mb-6">
                  "{data.culture?.vibe || 'A IA não detectou um tom de voz específico no conteúdo do site.'}"
                </p>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">Missão Corporativa</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{data.culture?.mission || 'N/A'}</p>
                  </div>
                  {data.culture?.values && Array.isArray(data.culture.values) && (
                    <div>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Valores Identificados</span>
                      <div className="flex flex-wrap gap-2">
                        {data.culture.values.map((v: string, i: number) => (
                          <Badge key={i} className="bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-black text-[10px] px-3 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-950">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                Oportunidades e Carreira
              </h4>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Vagas em Aberto</span>
                  <Badge className={`font-black px-4 py-1.5 rounded-xl border-2 border-slate-900 dark:border-slate-950 ${data.careers?.has_jobs ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                    {data.careers?.has_jobs ? 'ATIVAS' : 'NENHUMA'}
                  </Badge>
                </div>
                {data.careers?.open_positions && Array.isArray(data.careers.open_positions) && data.careers.open_positions.length > 0 ? (
                  <div className="space-y-3">
                    {data.careers.open_positions.slice(0, 4).map((p: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-900 dark:border-slate-950 group hover:border-blue-200 dark:hover:border-blue-500 transition-all">
                        <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full group-hover:scale-150 transition-transform" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{p}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 italic text-center py-4">Nenhuma vaga mapeada recentemente.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                Branding e Posicionamento
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-slate-900 dark:bg-slate-950 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                  <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest block mb-2">Tom de Voz</span>
                  <p className="text-base font-bold text-white dark:text-slate-200 leading-relaxed">{data.branding?.tone || 'N/A'}</p>
                </div>
                <div className="p-5 bg-slate-900 dark:bg-slate-950 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                  <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest block mb-2">Estilo Visual</span>
                  <p className="text-base font-bold text-white dark:text-slate-200 leading-relaxed">{data.branding?.visual_style || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSocialMediaAnalysis = () => {
    const socialData = analysis?.social?.platforms_data || analysis?.social
    
    // Verificação robusta: se não houver NENHUM dado real, mostra empty state
    const hasRealData = socialData && (
      (socialData.platforms_data && Object.values(socialData.platforms_data).some(v => v !== null)) ||
      (socialData.linkedin && Object.values(socialData.linkedin).some(v => v !== null && v !== 'N/A' && v !== 0)) ||
      (socialData.presence && socialData.presence.length > 0)
    )

    if (!hasRealData) {
      return renderEmptyState(
        "Ecossistema Digital não encontrado",
        "Nenhuma rede social oficial foi detectada ou as informações são insuficientes para análise.",
        Share2,
        () => performPartialAnalysis('social'),
        partialLoading['social']
      )
    }
    
    const data = socialData

    return (
      <Card className="mb-10 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(147,51,234,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(147,51,234,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-purple-50/50 dark:bg-purple-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-2xl border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ecossistema <span className="text-purple-600 dark:text-purple-400">Digital</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">
                  Análise de presença social e autoridade de marca
                </CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('social')}
              disabled={partialLoading['social']}
            >
              {partialLoading['social'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Auditar Redes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* LinkedIn Detail */}
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                Performance no LinkedIn
              </h4>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-slate-900 dark:border-slate-950">
                      <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-white">LinkedIn Corp</span>
                  </div>
                  <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-slate-900 dark:border-slate-950 font-black px-3 py-1 rounded-lg">
                    {data.linkedin?.employees || 0} Colaboradores
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Engajamento Médio</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{data.linkedin?.engagement || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Departamentos Chave</span>
                    <div className="flex flex-wrap gap-2">
                      {data.linkedin?.departments?.map((d: string, i: number) => (
                        <Badge key={i} className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] px-2 py-0.5 rounded-md border-2 border-slate-900 dark:border-slate-950">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Atividade Recente</span>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-900 dark:border-slate-950 pl-4">
                      {data.linkedin?.recent_activity || 'N/A'}
                    </p>
                  </div>
                  {data.linkedin?.top_posts_summary && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-300 leading-relaxed">
                        {data.linkedin.top_posts_summary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Other Platforms */}
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-purple-600 dark:bg-purple-500 rounded-full" />
                Outros Canais Ativos
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {data.platforms?.instagram?.active && (
                  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(219,39,119,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl border-2 border-slate-900 dark:border-slate-950 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50 transition-colors">
                        <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white">Instagram</p>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{data.platforms.instagram.engagement_rate} engajamento</p>
                      </div>
                    </div>
                    <Badge className="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-2 border-slate-900 dark:border-slate-950 font-black text-[10px] px-3 py-1 rounded-lg max-w-[120px] truncate">
                      {data.platforms.instagram.content_strategy}
                    </Badge>
                  </div>
                )}

                {data.platforms?.facebook?.active && (
                  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(29,78,216,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-slate-900 dark:border-slate-950 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Facebook className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white">Facebook</p>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{data.platforms.facebook.engagement}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-slate-900 dark:border-slate-950 font-black text-[10px] px-3 py-1 rounded-lg max-w-[120px] truncate">
                      {data.platforms.facebook.content_focus}
                    </Badge>
                  </div>
                )}

                {data.platforms?.twitter?.active && (
                  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(14,165,233,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-sky-50 dark:bg-sky-900/30 rounded-xl border-2 border-slate-900 dark:border-slate-950 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50 transition-colors">
                        <Twitter className="h-6 w-6 text-sky-500 dark:text-sky-400" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white">Twitter/X</p>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{data.platforms.twitter.frequency}</p>
                      </div>
                    </div>
                    <Badge className="bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-2 border-slate-900 dark:border-slate-950 font-black text-[10px] px-3 py-1 rounded-lg max-w-[120px] truncate">
                      {data.platforms.twitter.tone}
                    </Badge>
                  </div>
                )}

                {data.platforms?.youtube?.active && (
                  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center justify-between group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl border-2 border-slate-900 dark:border-slate-950 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                        <ExternalLink className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-white">YouTube</p>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{data.platforms.youtube.reach}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {data.platforms.youtube.video_types && Array.isArray(data.platforms.youtube.video_types) && (
                        data.platforms.youtube.video_types.slice(0, 2).map((t: string, i: number) => (
                          <Badge key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-slate-900 dark:border-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md">
                            {t}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall Presence */}
          <div className="p-8 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h4 className="font-black text-white uppercase tracking-widest text-sm mb-8 flex items-center gap-3">
              <div className="w-2 h-6 bg-purple-500 rounded-full" />
              Estratégia Geral de Conteúdo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-4 bg-slate-800 dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                <p className="text-purple-400 font-black text-[10px] uppercase tracking-widest mb-2">Consistência</p>
                <p className="text-white font-bold text-sm leading-relaxed">{data.overall_presence?.consistency || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-800 dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                <p className="text-purple-400 font-black text-[10px] uppercase tracking-widest mb-2">Público-Alvo</p>
                <p className="text-white font-bold text-sm leading-relaxed">{data.overall_presence?.target_audience || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-800 dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                <p className="text-purple-400 font-black text-[10px] uppercase tracking-widest mb-2">Tom de Voz</p>
                <p className="text-white font-bold text-sm leading-relaxed">{data.overall_presence?.tone_of_voice || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-800 dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-slate-950">
                <p className="text-purple-400 font-black text-[10px] uppercase tracking-widest mb-2">Estilo Criativo</p>
                <p className="text-white font-bold text-sm leading-relaxed">{data.overall_presence?.creative_style || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderMarketAndAdsAnalysis = () => {
    const marketData = analysis?.market_ads?.market || analysis?.market_ads
    
    // Verificação robusta: se não houver NENHUM dado real, mostra empty state
    const hasRealData = marketData && (
      (marketData.market && Object.values(marketData.market).some(v => v !== null && v !== 'N/A' && v !== '')) ||
      (marketData.ads && (marketData.ads.meta?.active || marketData.ads.google?.active))
    )

    if (!hasRealData) {
      return renderEmptyState(
        "Dados de Mercado indisponíveis",
        "A análise de tendências de setor e anúncios não pôde ser completada com dados reais.",
        TrendingUp,
        () => performPartialAnalysis('market_ads'),
        partialLoading['market_ads']
      )
    }
    
    const data = marketData

    return (
      <Card className="mb-10 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-orange-50/50 dark:bg-orange-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mercado & <span className="text-orange-600 dark:text-orange-400">Growth</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">
                  Tendências setoriais e inteligência competitiva
                </CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('market_ads')}
              disabled={partialLoading['market_ads']}
            >
              {partialLoading['market_ads'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Analisar Setor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Market Analysis */}
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-orange-600 dark:bg-orange-500 rounded-full" />
                Panorama Competitivo
              </h4>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-2">Posicionamento</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">{data.market?.position || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-2">Outlook de Crescimento</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">{data.market?.growth_outlook || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-3">Principais Tendências</span>
                    <div className="flex flex-wrap gap-2">
                      {data.market?.trends && Array.isArray(data.market.trends) && (
                        data.market.trends.map((t: string, i: number) => (
                          <Badge key={i} className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-2 border-slate-900 dark:border-slate-950 font-black text-[10px] px-3 py-1 rounded-lg">
                            {t}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ads Analysis */}
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                <div className="w-2 h-6 bg-slate-900 dark:bg-white rounded-full" />
                Canais de Aquisição
              </h4>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 bg-blue-50/50 dark:bg-blue-900/20 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                        <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest">Meta Ads</span>
                    </div>
                    <Badge className={`font-black px-3 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-950 ${data.ads?.meta?.active ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>
                      {data.ads?.meta?.active ? 'ATIVO' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                    <span className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest block mb-1">Público Primário</span>
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-300">{data.ads?.meta?.target_audience || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 bg-green-50/50 dark:bg-green-900/20 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                        <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-black text-green-900 dark:text-green-200 uppercase tracking-widest">Google Ads</span>
                    </div>
                    <Badge className={`font-black px-3 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-950 ${data.ads?.google?.active ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>
                      {data.ads?.google?.active ? 'ATIVO' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl border-2 border-slate-900 dark:border-slate-950">
                    <span className="text-[10px] font-black text-green-400 dark:text-green-500 uppercase tracking-widest block mb-2">Palavras-chave Identificadas</span>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(data.ads?.google?.keywords) ? data.ads.google.keywords.map((kw: string, i: number) => (
                        <Badge key={i} className="bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 font-bold text-[9px] px-2 py-0.5 rounded-md border-2 border-slate-900 dark:border-slate-950">
                          {kw}
                        </Badge>
                      )) : <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 italic">N/A</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPersonalizedStrategy = () => {
    const strategyData = analysis?.personalizedStrategy || analysis?.strategy
    
    // Verificação robusta: se não houver NENHUM dado real, mostra empty state
    const hasRealData = strategyData && (
      (strategyData.outreach && (strategyData.outreach.whatsapp_script || strategyData.outreach.email_pitch)) ||
      (strategyData.action_plan && (strategyData.action_plan.day_30 || strategyData.action_plan.day_60 || strategyData.action_plan.day_90))
    )

    if (!hasRealData) {
      return renderEmptyState(
        "Estratégia Personalizada pendente",
        "Aguardando dados das outras abas para gerar o plano de ação customizado.",
        Rocket,
        () => performPartialAnalysis('personalizedStrategy'),
        partialLoading['personalizedStrategy']
      )
    }
    
    const data = strategyData

    return (
      <Card className="mb-10 border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/20 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Estratégia <span className="text-emerald-600 dark:text-emerald-400">Personalizada</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">
                  Plano tático baseado no seu perfil e na análise da empresa
                </CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              className="rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              onClick={() => performPartialAnalysis('personalizedStrategy')}
              disabled={partialLoading['personalizedStrategy']}
            >
              {partialLoading['personalizedStrategy'] ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Recriar Estratégia
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Networking & Prep */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
                  Networking e Contato
                </h4>
                
                <div className="space-y-3">
                  {data.networking?.opportunities && Array.isArray(data.networking.opportunities) && (
                    data.networking.opportunities.map((o: string, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border-[2px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <div className="mt-1 p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{o}</span>
                      </div>
                    ))
                  )}
                </div>

                {data.networking?.effective_channels && (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-4">Canais Efetivos</span>
                    <div className="space-y-3">
                      {Array.isArray(data.networking.effective_channels) 
                        ? data.networking.effective_channels.map((channel: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full" />
                              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{channel}</p>
                            </div>
                          ))
                        : <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full" />
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{data.networking.effective_channels}</p>
                          </div>
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-slate-900 dark:bg-white rounded-full" />
                  Preparação para Entrevista
                </h4>
                
                <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] space-y-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Perguntas Prováveis</span>
                    <div className="space-y-3">
                      {data.interview_prep?.likely_questions && Array.isArray(data.interview_prep.likely_questions) && (
                        data.interview_prep.likely_questions.map((q: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 group">
                            <div className="mt-1.5 w-1.5 h-1.5 bg-slate-900 dark:bg-white rounded-full group-hover:scale-125 transition-transform" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic">"{q}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {data.interview_prep?.strategy_tips && (
                    <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800 space-y-4">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Dicas de Estratégia</span>
                      <div className="space-y-3">
                        {Array.isArray(data.interview_prep.strategy_tips) ? (
                          data.interview_prep.strategy_tips.map((tip: string, i: number) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="mt-1 p-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{tip}</p>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                              <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{data.interview_prep.strategy_tips}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Plan */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
                  Plano de Ação (30-60-90 dias)
                </h4>
                
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                  {['30', '60', '90'].map((days) => (
                    <div key={days} className="relative pl-10 group">
                      <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-[3px] border-slate-900 dark:border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] z-10 group-hover:bg-emerald-500 group-hover:border-emerald-600 transition-colors" />
                      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-[2px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">{days} Dias</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{(data.action_plan?.timeline as any)?.[`days_${days}`]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {data.timing_strategy && (
                  <div className="p-6 bg-orange-50/50 dark:bg-orange-900/20 rounded-[2rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(249,115,22,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] flex items-start gap-4 mt-8">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-[2px_2px_0px_0px_rgba(249,115,22,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">Timing Ideal</span>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-200 leading-relaxed">{data.timing_strategy}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3">
                  <div className="w-2 h-6 bg-slate-900 dark:bg-white rounded-full" />
                  Skills a Destacar
                </h4>
                
                <div className="flex flex-wrap gap-3">
                  {data.skills_to_highlight && Array.isArray(data.skills_to_highlight) && (
                    data.skills_to_highlight.map((s: string, i: number) => (
                      <Badge key={i} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-800 font-black text-xs px-4 py-2 rounded-xl shadow-[3px_3px_0px_0px_rgba(16,185,129,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="p-8 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <h4 className="font-black text-white uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500 rounded-lg">
                <Rocket className="h-4 w-4 text-white" />
              </div>
              Métricas de Sucesso (KPIs)
            </h4>
            <div className="flex flex-wrap gap-3">
              {data.action_plan?.success_metrics && Array.isArray(data.action_plan.success_metrics) && (
                data.action_plan.success_metrics.map((m: string, i: number) => (
                  <Badge key={i} className="bg-slate-800 dark:bg-slate-900 text-emerald-400 border-2 border-slate-700 dark:border-slate-800 font-black text-[10px] px-4 py-2 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors">
                    {m}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  if (loading) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
        <Card className="w-full border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] animate-bounce">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                    Análise em <span className="text-blue-600 dark:text-blue-400">Alta Velocidade</span>
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                    Processando dados estratégicos para <span className="text-slate-900 dark:text-white">{companyName}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border-2 border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">{Math.round(progress)}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Status Atual</span>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{currentStep}</h4>
                </div>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-sm">IA Generativa Ativa</span>
              </div>
              <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-black dark:border-slate-950 overflow-hidden shadow-inner">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 ease-out border-r-2 border-black dark:border-slate-950"
                  style={{ width: `${progress}%` }}
                >
                  <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Web Scraper', icon: Globe },
                { label: 'Análise de Mercado', icon: TrendingUp },
                { label: 'Estratégia IA', icon: Zap }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4 opacity-50">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                    <item.icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.label}</span>
                  <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 p-6 rounded-3xl flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-blue-800 dark:text-blue-200 text-sm font-medium leading-relaxed">
                Nossa IA está navegando pelo site oficial, redes sociais e bases de dados de mercado para construir um perfil 360º desta empresa. Isso pode levar alguns segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="mb-6" variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button onClick={performDeepAnalysis} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700">
      <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-slate-950 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-slate-900 dark:bg-slate-950 rounded-2xl flex items-center justify-center border-2 border-black dark:border-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  Relatório <span className="text-blue-600 dark:text-blue-400">Estratégico</span>
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                  Inteligência artificial aplicada para <span className="text-slate-900 dark:text-white">{companyName}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="rounded-xl border-2 border-black dark:border-slate-950 font-black text-[10px] uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl border-2 border-black dark:border-slate-950 font-black text-[10px] uppercase tracking-widest bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full space-y-8">
        <div className="sticky top-4 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-lg">
          <TabsList className="flex flex-wrap h-auto bg-transparent gap-2 p-0 justify-center">
            {[
              { value: 'overview', label: 'Visão Geral', icon: Eye },
              { value: 'institutional', label: 'Institucional', icon: Info },
              { value: 'webdata', label: 'Dados Coletados', icon: Search },
              { value: 'website', label: 'Website', icon: Globe },
              { value: 'social', label: 'Redes Sociais', icon: Hash },
              { value: 'market', label: 'Mercado & Ads', icon: TrendingUp },
              { value: 'strategy', label: 'Estratégia IA', icon: Zap },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="rounded-2xl border-2 border-transparent px-6 py-3 font-black text-[10px] uppercase tracking-widest transition-all text-slate-600 dark:text-slate-400 data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:data-[state=active]:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          {analysis?.debug && !analysis.debug.hasWebsiteData && (
            <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription>
                Não foi possível acessar o website da empresa diretamente. A análise foi baseada em dados públicos e conhecimento da IA.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { label: 'Website', value: analysis?.website ? 'OK' : analysis?.debug?.hasWebsiteData ? 'Pendente' : 'Indisponível', icon: Globe, color: 'blue' },
              { label: 'Institucional', value: analysis?.website?.institutional ? 'OK' : 'N/A', icon: Info, color: 'purple' },
              { label: 'Contatos', value: analysis?.website?.contacts?.phones?.length || 0, icon: MessageCircle, color: 'green' },
              { label: 'Localização', value: analysis?.website?.local_presence?.rating ? `${analysis.website.local_presence.rating}★` : 'N/A', icon: MapPin, color: 'orange' },
              { label: 'Mercado', value: analysis?.market_ads ? 'OK' : analysis?.debug?.hasMarketTrends ? 'Pendente' : 'Indisponível', icon: TrendingUp, color: 'pink' }
            ].map((stat, i) => (
              <Card key={i} className={`border-2 border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-3xl overflow-hidden transition-all bg-white dark:bg-slate-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border-2 border-${stat.color}-200 dark:border-${stat.color}-800`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
                      <p className={`text-2xl font-black text-slate-900 dark:text-white`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {renderSummary()}
              {renderLocalPresence()}
              {renderInstitutionalReport()}
            </div>
            <div className="space-y-6">
              {renderPersonalizedStrategy()}
              {renderMarketAndAdsAnalysis()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="institutional" className="space-y-6">
          {renderLocalPresence()}
          {renderInstitutionalReport()}
        </TabsContent>
        
        <TabsContent value="webdata" className="space-y-6">
          {renderWebData()}
        </TabsContent>
        
        <TabsContent value="website" className="space-y-6">
          {renderWebsiteAnalysis()}
        </TabsContent>
        
        <TabsContent value="social" className="space-y-6">
          {renderSocialMediaAnalysis()}
        </TabsContent>
        
        <TabsContent value="market" className="space-y-6">
          {renderMarketAndAdsAnalysis()}
        </TabsContent>
        
        <TabsContent value="strategy" className="space-y-6">
          {renderPersonalizedStrategy()}
        </TabsContent>
      </Tabs>

      {renderWhatsappModal()}
      {renderEmailModal()}
    </div>
  )
}