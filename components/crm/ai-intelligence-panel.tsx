'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Globe,
  MessageSquare,
  RefreshCw,
  Send
} from 'lucide-react'

interface AIIntelligencePanelProps {
  analysisId: string
  companyData: any
  onInsightsGenerated: (insights: any) => void
}

export function AIIntelligencePanel({ analysisId, companyData, onInsightsGenerated }: AIIntelligencePanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [userContext, setUserContext] = useState('')
  const [error, setError] = useState<string | null>(null)

  const callAIIntelligence = async (action: string, additionalData?: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          analysis_id: analysisId,
          company_data: companyData,
          user_context: userContext,
          ...additionalData
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao chamar IA')
      }

      setAiResponse(data)
      onInsightsGenerated(data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeCompany = () => {
    callAIIntelligence('analyze_company')
  }

  const handleGenerateStrategy = () => {
    callAIIntelligence('generate_strategy', {
      previous_insights: aiResponse?.ai_insights
    })
  }

  const handleGetInsights = () => {
    callAIIntelligence('get_ai_insights')
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contexto do Usuário */}
        <Card className="border-[3px] border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900 dark:border-white p-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tighter dark:text-white">
              <div className="p-3 bg-primary rounded-xl border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]">
                <Brain className="h-6 w-6 text-white" />
              </div>
              Contexto Adicional
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea
              placeholder="Forneça contexto adicional para a IA analisar melhor... (ex: objetivos, preferências, experiências anteriores com empresas similares)"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              className="min-h-[150px] rounded-2xl border-[3px] border-slate-900 dark:border-white focus-visible:ring-8 focus-visible:ring-primary/10 transition-all font-bold text-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] focus:shadow-none bg-slate-50/50 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500"
            />
          </CardContent>
        </Card>

        {/* Ações da IA */}
        <Card className="border-[3px] border-slate-900 dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-[3px] border-slate-900 dark:border-white p-8">
            <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tighter dark:text-white">
              <div className="p-3 bg-indigo-600 rounded-xl border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              Ações Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <Button 
              onClick={handleAnalyzeCompany}
              disabled={isLoading}
              className="w-full justify-between rounded-2xl border-[3px] border-slate-900 dark:border-white bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-16 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] group disabled:opacity-50"
            >
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-4 text-blue-600 dark:text-blue-400 group-hover:rotate-6 transition-transform" />
                Analisar Empresa
              </div>
              {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
            
            <Button 
              onClick={handleGenerateStrategy}
              disabled={isLoading || !aiResponse}
              className="w-full justify-between rounded-2xl border-[3px] border-slate-900 dark:border-white bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-16 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] group disabled:opacity-50"
            >
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-6 transition-transform" />
                Gerar Estratégia
              </div>
              <Send className="h-5 w-5" />
            </Button>
            
            <Button 
              onClick={handleGetInsights}
              disabled={isLoading}
              className="w-full justify-between rounded-2xl border-[3px] border-slate-900 dark:border-white bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs h-16 px-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] group disabled:opacity-50"
            >
              <div className="flex items-center">
                <Brain className="h-5 w-5 mr-4 text-purple-600 dark:text-purple-400 group-hover:rotate-6 transition-transform" />
                Obter Insights
              </div>
              <Send className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-8 rounded-[2rem] border-[3px] border-red-900 dark:border-red-500 bg-red-50 dark:bg-red-950/20 shadow-[8px_8px_0px_0px_rgba(239,68,68,0.2)] dark:shadow-[8px_8px_0px_0px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-4 text-red-900 dark:text-red-400">
            <div className="p-3 rounded-xl bg-red-900 dark:bg-red-600 text-white border-2 border-black dark:border-white">
              <RefreshCw className="h-6 w-6" />
            </div>
            <p className="font-black uppercase tracking-tighter text-xl">{error}</p>
          </div>
        </div>
      )}

      {/* Resultados da IA */}
      {aiResponse && (
        <Card className="border-[3px] border-slate-900 dark:border-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)] rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
          <CardHeader className="bg-slate-900 dark:bg-slate-950 border-b-[3px] border-black dark:border-white p-10 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-6 text-3xl font-black uppercase tracking-tighter text-white">
              <div className="p-4 bg-primary rounded-2xl border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                <Brain className="h-8 w-8" />
              </div>
              Inteligência Processada
            </CardTitle>
            <Button 
              onClick={() => {
                setAiResponse(null)
                onInsightsGenerated(null)
              }}
              variant="outline"
              className="rounded-xl border-2 border-white/20 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 hover:bg-white hover:text-slate-900 transition-all shadow-none hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              LIMPAR
            </Button>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Análise da Empresa */}
              {aiResponse.ai_analysis && (
                <div className="p-8 bg-blue-50 dark:bg-blue-950/20 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(59,130,246,0.3)] dark:shadow-[6px_6px_0px_0px_rgba(59,130,246,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)] transition-all">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-600 text-white rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                      <Globe className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-blue-900 dark:text-blue-300 uppercase tracking-tight text-xl">Empresa</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-100 dark:border-blue-900/50">
                      <p className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest mb-1">Oportunidade</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.ai_analysis.ai_insights?.market_opportunity?.market_size}</p>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-100 dark:border-blue-900/50">
                      <p className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest mb-1">Estratégia</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.ai_analysis.ai_insights?.negotiation_strategy?.approach_style}</p>
                    </div>
                    <div className="pt-4 border-t-2 border-blue-100 dark:border-blue-900/50">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs uppercase tracking-widest text-blue-800 dark:text-blue-400">Match Score</span>
                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{aiResponse.ai_analysis.confidence_score?.overall_score}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estratégia Gerada */}
              {aiResponse.strategy && (
                <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(16,185,129,0.3)] dark:shadow-[6px_6px_0px_0px_rgba(16,185,129,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)] transition-all">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-600 text-white rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-tight text-xl">Estratégia</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50">
                      <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-widest mb-1">Timeline</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.strategy.approach_timeline?.phase_1}</p>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50">
                      <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-widest mb-1">Comunicação</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.strategy.communication_strategy?.preferred_channel}</p>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50">
                      <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-widest mb-1">Valor</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.strategy.value_proposition?.unique_selling_points}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights */}
              {aiResponse.insights && (
                <div className="p-8 bg-purple-50 dark:bg-purple-950/20 rounded-[2.5rem] border-[3px] border-slate-900 dark:border-white shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)] dark:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.2)] transition-all">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-purple-600 text-white rounded-xl border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                      <Brain className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-purple-900 dark:text-purple-300 uppercase tracking-tight text-xl">Insights</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-100 dark:border-purple-900/50">
                      <p className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase tracking-widest mb-1">Conversão</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.insights.performance_metrics?.conversion_rate}</p>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-100 dark:border-purple-900/50">
                      <p className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase tracking-widest mb-1">Probabilidade</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.insights.predictive_insights?.success_probability}</p>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-100 dark:border-purple-900/50">
                      <p className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase tracking-widest mb-1">Melhoria</p>
                      <p className="font-bold text-slate-900 dark:text-white">{aiResponse.insights.improvement_suggestions?.strategy_optimization}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}