'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { CompanyDeepAnalysis } from '@/components/crm/company-deep-analysis'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSidebar } from '@/components/ui/sidebar'

function CompanyDetailContent() {
  const searchParams = useSearchParams()
  const { setOpen } = useSidebar()
  const companyId = searchParams.get('id')
  
  // Collapse sidebar on mount
  useEffect(() => {
    setOpen(false)
  }, [setOpen])

  const companyName = searchParams.get('name')
  const websiteUrl = searchParams.get('website')
  const action = searchParams.get('action') as 'add_contact' | 'reanalyze' | null
  const linkedinUrl = searchParams.get('linkedin')
  const instagramUrl = searchParams.get('instagram')
  const facebookUrl = searchParams.get('facebook')
  const twitterUrl = searchParams.get('twitter')

  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleAnalysisComplete = useCallback((data: any) => {
    setAnalysisResult(data)
  }, [])

  const handleApprove = async () => {
    console.log('handleApprove called. companyId:', companyId, 'companyName:', companyName);
    if (!companyName) {
      console.error('Missing companyName');
      return;
    }
    
    if (!analysisResult) {
      console.warn('Missing analysisResult');
      alert('Aguarde a conclusão da análise antes de aprovar.')
      return
    }
    
    setApproving(true)
    try {
      const payload = {
        company_id: companyId,
        company_name: companyName,
        website_url: websiteUrl,
        // CORRIGIDO: Envia todos os dados de análise agrupados, incluindo metadados (marca d'água)
        ai_analysis: {
          website: analysisResult.website || {},
          social: analysisResult.social || {},
          market_ads: analysisResult.market_ads || {},
          metadata: analysisResult.metadata || {}, // Preserva a marca d'água gerada pela API
        },
        strategy_generated: analysisResult.personalizedStrategy || {},
        // Mantém compatibilidade com campos individuais se necessário
        website_analysis: analysisResult.website || {},
        social_media_analysis: analysisResult.social || {},
        market_analysis: analysisResult.market_ads || {},
        match_score: analysisResult.personalizedStrategy?.match_score || 0,
      };
      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('/api/approved-companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || 'Erro ao aprovar empresa')
      }

      setApproved(true)
      alert('Empresa aprovada com sucesso! Você será redirecionado para o dashboard.')
      
      setTimeout(() => {
        window.location.href = '/approved-companies'
      }, 2000)
      
    } catch (error) {
      console.error('Erro ao aprovar empresa:', error)
      alert('Erro ao aprovar empresa. Tente novamente.')
    } finally {
      setApproving(false)
    }
  }

  if (!companyName) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Nome da empresa não fornecido.</AlertDescription>
        </Alert>
        <Link href="/potential-clients">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Modernizado - Estilo Neo-Brutalismo Suave */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
        <div className="space-y-3">
          <Link href="/potential-clients">
            <Button variant="ghost" size="sm" className="group -ml-2 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
              Voltar para Lista
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Análise de <span className="text-blue-600 underline decoration-8 decoration-blue-100 dark:decoration-blue-900 underline-offset-[-4px]">{companyName}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg max-w-2xl">
              Relatório multidimensional e estratégia de carreira personalizada gerada por IA.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleApprove}
            disabled={approving || approved || !analysisResult}
            className={`rounded-2xl px-10 py-8 font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] border-[3px] border-slate-900 dark:border-slate-950 ${
              !analysisResult 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-slate-200 dark:border-slate-700 shadow-none' 
                : approved
                  ? 'bg-green-500 text-white border-slate-900 dark:border-slate-950'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {approving ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : approved ? (
              <CheckCircle className="h-5 w-5 mr-3" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-3" />
            )}
            {!analysisResult 
              ? 'Aguardando Análise...' 
              : approving 
                ? 'Aprovando...' 
                : approved 
                  ? 'Aprovado!' 
                  : 'Aprovar Empresa'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <CompanyDeepAnalysis 
          companyName={companyName}
          websiteUrl={websiteUrl || undefined}
          linkedinUrl={linkedinUrl || undefined}
          instagramUrl={instagramUrl || undefined}
          facebookUrl={facebookUrl || undefined}
          twitterUrl={twitterUrl || undefined}
          onComplete={handleAnalysisComplete}
          initialAction={action || undefined}
        />
      </div>
    </div>
  )
}

export default function CompanyDetailPage() {
  return (
    <Suspense fallback={
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <CompanyDetailContent />
    </Suspense>
  )
}
