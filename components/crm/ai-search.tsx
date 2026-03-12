'use client'

import { useState } from 'react'
import { GeminiSearchResult } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Search, Sparkles, Building2, Mail, Phone, Globe, Plus, ExternalLink, RefreshCw, Star, MessageSquare, Linkedin, Instagram, Facebook, MapPin, Users, ListPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface AISearchProps {
  onAddClients: (clients: GeminiSearchResult[]) => Promise<void>
}

export function AISearch({ onAddClients }: AISearchProps) {
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [resultCount, setResultCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GeminiSearchResult[]>([])
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
  const [addingClients, setAddingClients] = useState(false)
  const [scrapingIndex, setScrapingIndex] = useState<number | null>(null)
  const [manualUrlInput, setManualUrlInput] = useState<{[key: number]: string}>({})
  const [showManualUrl, setShowManualUrl] = useState<{[key: number]: boolean}>({})
  const [isManualListOpen, setIsManualListOpen] = useState(false)
  const [manualListText, setManualListText] = useState('')

  const handleManualListSubmit = async () => {
    if (!manualListText.trim()) return

    const lines = manualListText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    
    // Check duplicates before adding
    try {
      const response = await fetch('/api/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNames: lines.map(line => {
          const isUrl = line.includes('.') && !line.includes(' ')
          return isUrl ? line.split('.')[0] : line
        }) })
      })

      const { exists = [] } = await response.json()
      const existingSet = new Set(exists)

      const existingInList = new Set(results.map(r => r.company_name))
      
      const filteredLines = lines.filter(line => {
        const isUrl = line.includes('.') && !line.includes(' ')
        const name = isUrl ? line.split('.')[0] : line
        return !existingSet.has(name) && !existingInList.has(name)
      })

      if (filteredLines.length === 0 && lines.length > 0) {
        toast({
          title: 'Todas as empresas já existem',
          description: 'Todas as empresas desta lista já estão cadastradas no CRM.',
          variant: 'destructive'
        })
        return
      }

      const newResults: GeminiSearchResult[] = filteredLines.map(line => {
        // Tenta separar por tabulação ou múltiplos espaços (comum em copiar/colar de tabelas)
        const parts = line.split(/\t| {2,}/).map(p => p.trim()).filter(p => p.length > 0)
        
        let company_name = line
        let website: string | null = null
        let phone: string | null = null
        let email: string | null = null
        let city: string | null = null
        let description = `Empresa adicionada manualmente: ${line}`

        if (parts.length >= 2) {
          company_name = parts[0]
          
          // Tentar identificar o que é cada parte
          parts.slice(1).forEach(part => {
            // É um link de WhatsApp?
            if (part.includes('wa.me/')) {
              const waPhone = part.split('wa.me/')[1].replace(/[^0-9]/g, '')
              if (waPhone) phone = `+${waPhone}`
            } 
            // É um site? (contém ponto e não tem espaços)
            else if (part.includes('.') && !part.includes(' ') && !website && !part.includes('@')) {
              website = part.startsWith('http') ? part : `https://${part}`
            }
            // É um e-mail?
            else if (part.includes('@') && part.includes('.') && !part.includes(' ')) {
              email = part
            }
            // Caso contrário, assumimos que é a cidade se ainda não tivermos uma
            else if (part.length > 2 && !city) {
              city = part
            }
          })
        } else {
          // Lógica legada para linha única
          const isUrl = line.includes('.') && !line.includes(' ')
          company_name = isUrl ? line.split('.')[0] : line
          website = isUrl ? (line.startsWith('http') ? line : `https://${line}`) : null
        }
        
        return {
          company_name,
          website,
          phone,
          email,
          city,
          description,
          location: city || '',
          state: ''
        }
      })

      setResults(prev => [...newResults, ...prev])
      setIsManualListOpen(false)
      setManualListText('')
      
      const duplicatesCount = lines.length - filteredLines.length
      toast({
        title: 'Lista adicionada',
        description: `${newResults.length} empresa(s) adicionada(s). ${duplicatesCount > 0 ? `${duplicatesCount} duplicadas foram filtradas.` : ''}`,
      })
    } catch (error) {
      console.error('Error checking duplicates:', error)
      toast({
        title: 'Erro ao processar lista',
        description: 'Não foi possível verificar duplicatas. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  const handleScrape = async (index: number, result: GeminiSearchResult) => {
    setScrapingIndex(index)
    try {
      // Tratar o caso onde website é "null" (string) ou null/undefined
      const websiteUrl = result.website && result.website !== 'null' ? result.website : null
      
      toast({
        title: websiteUrl ? 'Analisando site...' : 'Buscando site e analisando...',
        description: 'Isso pode levar alguns segundos.',
      })

      const response = await fetch('/api/scrape-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            url: websiteUrl,
            company_name: result.company_name,
            location: `${result.city || ''} ${result.state || ''}`.trim(),
            phone: result.phone,
            email: result.email,
            address: result.address,
            description: result.description
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Tratamento de erros específicos do backend
        if (response.status === 403) {
          throw new Error(errorData.error || 'Este site protegido contra acesso automatizado. Tente outra empresa ou forneça a URL diretamente.')
        } else if (response.status === 504) {
          throw new Error(errorData.error || 'Tempo limite excedido. O site está demorando muito para responder.')
        } else if (response.status === 502) {
          throw new Error(errorData.error || 'Erro ao acessar o site. Tente novamente ou forneça a URL diretamente.')
        } else {
          throw new Error(errorData.error || 'Falha ao analisar site')
        }
      }

      const data = await response.json()
      
      // Atualizar o resultado com os dados novos
      const newResults = [...results]
      const current = newResults[index]
      
      newResults[index] = {
        ...current,
        description: data.description || current.description,
        email: data.email || current.email,
        phone: data.phone || current.phone,
        address: data.address || current.address,
        website: data.found_url || current.website, // Atualiza URL se encontrada
        full_company_data: {
            ...current.full_company_data,
            ...data
        }
      }
      
      setResults(newResults)
      
      toast({
        title: 'Site analisado com sucesso!',
        description: 'Dados atualizados com informações do rodapé e contato.',
      })
    } catch (error: any) {
      console.error('Scrape error:', error)
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível extrair dados do site.',
        variant: 'destructive'
      })
    } finally {
      setScrapingIndex(null)
    }
  }

  const handleManualUrlSubmit = async (index: number, result: GeminiSearchResult) => {
    const manualUrl = manualUrlInput[index]
    if (!manualUrl?.trim()) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, forneça uma URL válida.',
        variant: 'destructive'
      })
      return
    }

    // Atualizar o resultado com a URL manual
    const newResults = [...results]
    newResults[index] = {
      ...result,
      website: manualUrl.trim()
    }
    setResults(newResults)
    
    // Esconder o campo de entrada manual
    setShowManualUrl(prev => ({ ...prev, [index]: false }))
    
    // Tentar fazer o scraping com a URL manual
    await handleScrape(index, newResults[index])
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setResults([])
    setSelectedResults(new Set())

    try {
      console.log('Starting search request...')
      console.log('Request body:', { query, location, resultCount })
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch('/api/gemini-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, resultCount }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error text:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.error) {
        toast({
          title: 'Erro na busca',
          description: data.error,
          variant: 'destructive'
        })
        return
      }

      setResults(data.results || [])
      
      if (data.db_warning) {
        toast({
          title: 'Busca concluída com aviso',
          description: data.db_warning
        })
      } else if (data.results?.length === 0) {
        toast({
          title: 'Nenhum novo resultado',
          description: data.duplicates_avoided > 0 
            ? `Encontrados ${data.total_found} resultados, mas ${data.duplicates_avoided} já existem no sistema.`
            : 'Tente ajustar sua busca.'
        })
      } else if (data.save_failures > 0) {
        toast({
          title: 'Busca concluída com aviso',
          description: `Encontrados ${data.total_found} resultados. ${data.save_failures} não foram salvos automaticamente, mas podem ser adicionados manualmente.`
        })
      } else if (data.duplicates_avoided > 0) {
        toast({
          title: 'Busca concluída',
          description: `Encontrados ${data.total_found} resultados, ${data.duplicates_avoided} duplicados evitados.`
        })
      }
    } catch (error) {
      console.error('Search error details:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
      
      let errorMessage = 'Falha ao realizar busca. Tente novamente.'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'A busca demorou muito tempo. Tente novamente com um termo mais específico.'
        } else if (error.message.includes('502')) {
          errorMessage = 'Erro no servidor. Tente novamente em alguns segundos.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedResults)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedResults(newSelection)
  }

  const selectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set())
    } else {
      setSelectedResults(new Set(results.map((_, i) => i)))
    }
  }

  const renderAIDataPoint = (label: string, value: any) => {
    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return null;
    
    // Formatar o label para algo mais amigável
    const friendlyLabel = label
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    let displayValue = '';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else {
        displayValue = Object.entries(value)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
      }
    } else {
      displayValue = value.toString();
    }

    if (!displayValue || displayValue === 'null' || displayValue === 'undefined') return null;

    return (
      <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-800 flex flex-col gap-1 transition-all hover:border-primary/30">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{friendlyLabel}</span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 break-words line-clamp-2 hover:line-clamp-none transition-all cursor-default">{displayValue}</span>
      </div>
    );
  };

  const handleAddClients = async () => {
    if (selectedResults.size === 0) {
      toast({
        title: 'Selecione clientes',
        description: 'Selecione ao menos um resultado para adicionar.'
      })
      return
    }

    setAddingClients(true)
    try {
      const clientsToAdd = Array.from(selectedResults).map(i => results[i])
      await onAddClients(clientsToAdd)
      toast({
        title: 'Clientes adicionados',
        description: `${clientsToAdd.length} cliente(s) adicionado(s) com sucesso.`
      })
      setSelectedResults(new Set())
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar clientes.',
        variant: 'destructive'
      })
    } finally {
      setAddingClients(false)
    }
  }

  return (
    <div className="space-y-12">
      <Card className="border-[3px] border-slate-900 dark:border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-slate-950 p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white italic">
                Busca Inteligente <span className="text-primary">IA</span>
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-tight">
                Use o Gemini AI para encontrar potenciais clientes estratégicos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="query" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                  O que você procura?
                </Label>
                  <Input
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: startups de tecnologia, e-commerces..."
                    required
                    className="h-12 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-bold text-base px-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="location" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                    Localização
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: São Paulo, Remoto..."
                    className="h-12 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-bold text-base px-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="resultCount" className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                    Qtd. Resultados
                  </Label>
                  <div className="relative">
                    <select
                      id="resultCount"
                      value={resultCount}
                      onChange={(e) => setResultCount(Number(e.target.value))}
                      className="flex h-12 w-full rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-2 text-base font-bold ring-offset-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:shadow-none"
                    >
                      <option value={1}>1 resultado</option>
                      <option value={3}>3 resultados</option>
                      <option value={5}>5 resultados</option>
                      <option value={10}>10 resultados</option>
                      <option value={15}>15 resultados</option>
                      <option value={20}>20 resultados</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded border-2 border-slate-900 dark:border-slate-950">
                        <RefreshCw className="h-3 w-3 text-slate-900 dark:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.1em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      BUSCANDO LEADS...
                    </>
                  ) : (
                    <>
                      <Search className="mr-3 h-5 w-5" />
                      INICIAR BUSCA IA
                    </>
                  )}
                </Button>

                <Dialog open={isManualListOpen} onOpenChange={setIsManualListOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-12 px-8 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.1em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <ListPlus className="mr-3 h-5 w-5" />
                      ADICIONAR LISTA MANUAL
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] border-[3px] border-slate-900 dark:border-slate-950 rounded-[2rem] bg-white dark:bg-slate-900 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
                    <DialogHeader>
                      <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Adicionar Lista Manual</DialogTitle>
                      <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold text-base uppercase tracking-tight">
                        Cole uma lista de nomes de empresas ou URLs (um por linha) para análise da IA.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                      <Textarea 
                        placeholder="Ex:
Google
Apple
www.microsoft.com
https://tesla.com"
                        className="min-h-[300px] rounded-2xl border-[3px] border-slate-900 dark:border-slate-950 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold p-6 focus:ring-4 focus:ring-primary/10 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        value={manualListText}
                        onChange={(e) => setManualListText(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleManualListSubmit}
                        className="h-14 px-10 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-[3px] border-slate-900 dark:border-slate-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        IMPORTAR PARA ANÁLISE
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-4">
                <div className="p-2 bg-primary rounded-lg border-[3px] border-black dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                Resultados Encontrados
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-tight ml-2">
                {results.length} empresas localizadas • <span className="text-primary">{selectedResults.size} selecionadas</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                className="rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest h-12 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
              >
                {selectedResults.size === results.length ? 'DESMARCAR TODOS' : 'SELECIONAR TODOS'}
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddClients} 
                disabled={selectedResults.size === 0 || addingClients}
                className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest h-12 px-8 border-[3px] border-black dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {addingClients ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="mr-3 h-5 w-5" />
                )}
                ADICIONAR SELECIONADOS
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result, index) => (
              <Card
                key={index}
                className={`group border-[3px] rounded-[1.5rem] transition-all cursor-pointer relative overflow-hidden ${
                  selectedResults.has(index) 
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] dark:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] translate-x-[-4px] translate-y-[-4px]' 
                    : 'border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 hover:border-primary dark:hover:border-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]'
                }`}
                onClick={() => toggleSelection(index)}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-start gap-4 md:gap-5">
                    <div className="pt-1">
                      <div className={`h-8 w-8 rounded-lg border-[3px] border-slate-900 dark:border-slate-950 flex items-center justify-center transition-all ${
                        selectedResults.has(index) ? 'bg-primary border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                      }`}>
                        <Checkbox
                          checked={selectedResults.has(index)}
                          onCheckedChange={() => toggleSelection(index)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 border-none data-[state=checked]:bg-transparent data-[state=checked]:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-primary group-hover:border-primary group-hover:rotate-6 transition-all duration-500 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)]">
                            <Building2 className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{result.company_name}</h3>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-[3px] border-black dark:border-slate-950 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] dark:shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)]">
                                IA MATCH
                              </Badge>
                              {result.full_company_data?.google_rating && (
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-[3px] border-amber-900/10 dark:border-amber-400/20 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(245,158,11,0.1)]">
                                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  {result.full_company_data.google_rating}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t-[3px] border-slate-50 dark:border-slate-800">
                        {result.contact_name && (
                          <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            <Users className="h-4 w-4 text-primary" />
                            {result.contact_name}
                          </div>
                        )}
                        {result.email && (
                          <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className="truncate">{result.email}</span>
                          </div>
                        )}
                        {result.phone && (
                          <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            <Phone className="h-4 w-4 text-emerald-500" />
                            <span className="truncate">{result.phone}</span>
                          </div>
                        )}
                        {result.website && result.website !== 'null' && (
                          <div className="flex items-center gap-2.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            <Globe className="h-4 w-4 text-indigo-500" />
                            <a 
                              href={result.website.startsWith('http') ? result.website : `https://${result.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="truncate hover:text-primary transition-colors flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {result.website.replace(/^https?:\/\/(www\.)?/, '')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Dados capturados pela IA */}
                      {result.full_company_data && (
                        <div className="pt-6 border-t-[3px] border-slate-50 dark:border-slate-800 space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary" />
                            Dados Enriquecidos pela IA
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {Object.entries(result.full_company_data)
                              .filter(([key]) => !['extracted_at', 'source', 'found_url', 'meta_tags', 'social_media'].includes(key))
                              .map(([key, value]) => renderAIDataPoint(key, value))
                            }
                            {/* Mostrar redes sociais se existirem */}
                            {result.full_company_data.social_media && Object.entries(result.full_company_data.social_media)
                              .map(([key, value]) => renderAIDataPoint(`Rede Social: ${key}`, value))
                            }
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {result.full_company_data?.social_media?.linkedin && (
                            <a href={result.full_company_data.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-400 hover:rotate-6 transition-all" onClick={(e) => e.stopPropagation()}>
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                          {result.full_company_data?.social_media?.instagram && (
                            <a href={result.full_company_data.social_media.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-pink-600 dark:hover:text-pink-400 border-2 border-slate-200 dark:border-slate-700 hover:border-pink-600 dark:hover:border-pink-400 hover:-rotate-6 transition-all" onClick={(e) => e.stopPropagation()}>
                              <Instagram className="h-4 w-4" />
                            </a>
                          )}
                          {result.full_company_data?.social_media?.facebook && (
                            <a href={result.full_company_data.social_media.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-800 dark:hover:text-blue-400 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-800 dark:hover:border-blue-400 hover:rotate-6 transition-all" onClick={(e) => e.stopPropagation()}>
                              <Facebook className="h-4 w-4" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleScrape(index, result)
                            }}
                            disabled={scrapingIndex === index}
                            className="rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest h-10 px-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] hover:bg-slate-50 dark:hover:bg-slate-800 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                          >
                            {scrapingIndex === index ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              result.website && result.website !== 'null' ? (
                                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                              ) : (
                                  <Search className="mr-2 h-3.5 w-3.5" />
                              )
                            )}
                            {result.website && result.website !== 'null' ? 'OBTER DADOS COMPLETOS' : 'ENCONTRAR WEBSITE'}
                          </Button>
                          
                          {(!result.website || result.website === 'null') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowManualUrl(prev => ({ ...prev, [index]: !prev[index] }))
                                }}
                                className="rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-all"
                              >
                                <Globe className="mr-2 h-3.5 w-3.5" />
                                FORNECER URL
                              </Button>
                          )}
                        </div>
                      </div>

                      {showManualUrl[index] && (
                        <div className="mt-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border-[3px] border-slate-900 dark:border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] animate-in fade-in slide-in-from-top-4 duration-500" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                              placeholder="https://exemplo.com.br"
                              value={manualUrlInput[index] || ''}
                              onChange={(e) => setManualUrlInput(prev => ({ ...prev, [index]: e.target.value }))}
                              className="h-11 rounded-xl border-[3px] border-slate-900 dark:border-slate-950 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus-visible:ring-4 focus-visible:ring-primary/10 transition-all font-bold text-base px-4"
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleManualUrlSubmit(index, result)}
                              className="h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest px-6 border-[3px] border-black dark:border-slate-950 shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] dark:shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              ANALISAR SITE
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
