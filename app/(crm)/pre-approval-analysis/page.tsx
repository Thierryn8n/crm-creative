'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CompanyDeepAnalysis } from '@/components/crm/company-deep-analysis'
import { 
  Building2, 
  TrendingUp, 
  Target, 
  Zap, 
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Rocket,
  Eye,
  Globe,
  Share2,
  CheckCircle,
  DollarSign,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface CompanyData {
  id?: string
  name: string
  website?: string
  linkedin?: string
  instagram?: string
  facebook?: string
  twitter?: string
  industry?: string
  location?: string
  description?: string
  employee_count?: string
  founded_year?: string
}

function PreApprovalAnalysisContent() {
  const searchParams = useSearchParams()
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  useEffect(() => {
    // Extract company data from URL parameters
    const name = searchParams.get('name') || ''
    const website = searchParams.get('website') || ''
    const linkedin = searchParams.get('linkedin') || ''
    const instagram = searchParams.get('instagram') || ''
    const facebook = searchParams.get('facebook') || ''
    const twitter = searchParams.get('twitter') || ''
    const industry = searchParams.get('industry') || ''
    const location = searchParams.get('location') || ''
    const description = searchParams.get('description') || ''
    const employee_count = searchParams.get('employee_count') || ''
    const founded_year = searchParams.get('founded_year') || ''

    if (!name) {
      setError('Nome da empresa não fornecido')
      setLoading(false)
      return
    }

    setCompanyData({
      name,
      website,
      linkedin,
      instagram,
      facebook,
      twitter,
      industry,
      location,
      description,
      employee_count,
      founded_year
    })
    
    setLoading(false)
  }, [searchParams])

  const handleStartAnalysis = () => {
    setShowAnalysis(true)
  }

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisComplete(true)
    console.log('Análise completa:', analysis)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link href="/companies">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Empresas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (showAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CompanyDeepAnalysis
          companyName={companyData!.name}
          websiteUrl={companyData?.website}
          linkedinUrl={companyData?.linkedin}
          instagramUrl={companyData?.instagram}
          facebookUrl={companyData?.facebook}
          twitterUrl={companyData?.twitter}
          industry={companyData?.industry}
          onComplete={handleAnalysisComplete}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Análise Pré-Aprovação
              </h1>
              <p className="text-gray-600">
                Inteligência Artificial aplicada para maximizar suas chances de sucesso
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/companies">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        {/* Company Overview */}
        <Card className="mb-8 border-gradient bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">{companyData!.name}</CardTitle>
                  {companyData?.industry && (
                    <CardDescription className="text-lg">
                      {companyData.industry}
                    </CardDescription>
                  )}
                  {companyData?.location && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      {companyData.location}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  <Eye className="h-3 w-3 mr-1" />
                  Análise Pré-Aprovação
                </Badge>
                {companyData?.employee_count && (
                  <p className="text-sm text-gray-600">{companyData.employee_count} funcionários</p>
                )}
                {companyData?.founded_year && (
                  <p className="text-sm text-gray-600">Fundada em {companyData.founded_year}</p>
                )}
              </div>
            </div>
          </CardHeader>
          
          {companyData?.description && (
            <CardContent>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Sobre a Empresa</h3>
                <p className="text-gray-700 leading-relaxed">{companyData.description}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* What You'll Get */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Zap className="h-6 w-6 text-yellow-500" />
            O que você vai descobrir:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-blue-200 bg-blue-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg text-blue-900">Website Completo</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 mb-3">
                  Análise detalhada da estrutura, conteúdo, valores, cultura e vagas disponíveis.
                </p>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Estrutura e navegação
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Missão, visão e valores
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Cultura organizacional
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Oportunidades de carreira
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Share2 className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg text-purple-900">Redes Sociais</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-800 mb-3">
                  Presença digital completa: LinkedIn, Instagram, Facebook, Twitter, YouTube.
                </p>
                <div className="space-y-1 text-xs text-purple-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Perfil de funcionários
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Departamentos e estrutura
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Publicações e engajamento
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Estratégia de conteúdo
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-lg text-green-900">Campanhas de Ads</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800 mb-3">
                  Análise de campanhas ativas no Meta Ads e Google Ads.
                </p>
                <div className="space-y-1 text-xs text-green-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Palavras-chave principais
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Criativos e mensagens
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Público-alvo
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Estratégias de remarketing
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  <CardTitle className="text-lg text-orange-900">Tendências</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-800 mb-3">
                  Tendências de mercado e oportunidades do setor.
                </p>
                <div className="space-y-1 text-xs text-orange-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Estado atual do setor
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Principais inovações
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Concorrentes e posicionamento
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Perspectivas futuras
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-red-600" />
                  <CardTitle className="text-lg text-red-900">Estratégia Personalizada</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 mb-3">
                  Plano de ação personalizado baseado no seu perfil.
                </p>
                <div className="space-y-1 text-xs text-red-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Oportunidades de networking
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Preparação para entrevistas
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Skills a desenvolver
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Timing e cronograma
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/50 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-indigo-600" />
                  <CardTitle className="text-lg text-indigo-900">Plano de Ação</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-800 mb-3">
                  Plano passo-a-passo com cronograma e métricas de sucesso.
                </p>
                <div className="space-y-1 text-xs text-indigo-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Fases 30-60-90 dias
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    KPIs e métricas
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Canais de contato
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Plano B e alternativas
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-yellow-300" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold">
                Pronto para descobrir todas as oportunidades?
              </h2>
              
              <p className="text-blue-100 max-w-2xl mx-auto">
                Nossa IA vai analisar {companyData!.name} em profundidade e criar uma estratégia personalizada 
                para maximizar suas chances de conseguir um emprego nesta empresa.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleStartAnalysis}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8"
                >
                  <Rocket className="h-5 w-5 mr-2" />
                  Iniciar Análise Completa
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 px-8"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Ver Demonstração
                </Button>
              </div>
              
              <p className="text-xs text-blue-200">
                Análise completa em menos de 2 minutos • Dados em tempo real • Estratégia personalizada
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Por que fazer análise pré-aprovamento?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Maximize suas chances</h4>
              <p className="text-gray-600">
                Entenda exatamente o que a empresa procura e como se posicionar.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Economize tempo</h4>
              <p className="text-gray-600">
                Evite aplicações sem direção. Foque nas empresas com maiores chances.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Estratégia clara</h4>
              <p className="text-gray-600">
                Saiba exatamente o que fazer, quando fazer e como fazer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PreApprovalAnalysisPage() {
  return <PreApprovalAnalysisContent />
}