'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, Database, Key, Globe, Sparkles, Link as LinkIcon, FileText, Upload, Eye, Download, Link as Link2, Palette, Moon, Sun, RotateCcw } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Theme customization states
  const [lightPrimary, setLightPrimary] = useState('#000000')
  const [darkPrimary, setDarkPrimary] = useState('#ffffff')
  const [lightBorder, setLightBorder] = useState('#000000')
  const [darkBorder, setDarkBorder] = useState('#ffffff')

  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    setMounted(true)
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/user-profile')
        const data = await res.json()
        if (data?.profile) {
          setLinkedinUrl(data.profile.linkedin_url || '')
          setResumeText(data.profile.resume_text || '')
        }
        const items = Array.isArray(data?.portfolio) ? data.portfolio : []
        setPortfolio(items)
        const firstWithPdf = items.find((i: any) => Array.isArray(i.media_urls) && i.media_urls.length > 0)
        const url = firstWithPdf ? firstWithPdf.media_urls[0] : null
        setLastPdfUrl(url)
        setSelectedPdf(url)
      } catch (e) {}
    }
    loadProfile()

    // Load theme colors from localStorage
    const savedLightPrimary = localStorage.getItem('theme-light-primary')
    const savedDarkPrimary = localStorage.getItem('theme-dark-primary')
    const savedLightBorder = localStorage.getItem('theme-light-border')
    const savedDarkBorder = localStorage.getItem('theme-dark-border')

    if (savedLightPrimary) setLightPrimary(savedLightPrimary)
    if (savedDarkPrimary) setDarkPrimary(savedDarkPrimary)
    if (savedLightBorder) setLightBorder(savedLightBorder)
    if (savedDarkBorder) setDarkBorder(savedDarkBorder)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Persist to localStorage
    localStorage.setItem('theme-light-primary', lightPrimary)
    localStorage.setItem('theme-dark-primary', darkPrimary)
    localStorage.setItem('theme-light-border', lightBorder)
    localStorage.setItem('theme-dark-border', darkBorder)
    
    // Dispatch event to notify ThemeColorApplier
    window.dispatchEvent(new Event('theme-color-change'))
  }, [lightPrimary, darkPrimary, lightBorder, darkBorder, theme, mounted])

  // Helper to convert hex to OKLCH roughly (simplified for demo)
  // In a real app, you'd use a library like 'color' or 'culori'
  const hexToOklch = (hex: string) => {
    // This is a placeholder. OKLCH is complex.
    // For now, we'll just return the hex if the browser supports it or use a simplified conversion.
    // CSS variables in the project use oklch(), but most browsers also support hex/rgb in vars.
    return hex
  }

  const resetThemeColors = () => {
    setLightPrimary('#000000')
    setDarkPrimary('#ffffff')
    setLightBorder('#000000')
    setDarkBorder('#ffffff')
    localStorage.removeItem('theme-light-primary')
    localStorage.removeItem('theme-dark-primary')
    localStorage.removeItem('theme-light-border')
    localStorage.removeItem('theme-dark-border')
    window.dispatchEvent(new Event('theme-color-change'))
  }

  const handleSaveTextAndLink = async () => {
    await fetch('/api/user-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedin_url: linkedinUrl, resume_text: resumeText })
    })
  }

  const uploadPdfFile = async (file: File | undefined | null) => {
    if (!file) return
    const form = new FormData()
    form.append('pdf', file)
    form.append('linkedin_url', linkedinUrl)
    form.append('resume_text', resumeText)
    setUploading(true)
    try {
      const res = await fetch('/api/user-profile', { method: 'POST', body: form })
      const data = await res.json()
      if (data?.error) {
        alert(data.error)
        return
      }
      if (data?.pdfUrl) {
        setLastPdfUrl(data.pdfUrl)
        setSelectedPdf(data.pdfUrl)
      }
      if (Array.isArray(data?.portfolio)) {
        setPortfolio(data.portfolio)
      }
    } catch (err) {
      alert('Erro ao enviar arquivo: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    } finally {
      setUploading(false)
    }
  }

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    await uploadPdfFile(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    await uploadPdfFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  const handleCopyLink = async () => {
    if (!selectedPdf) return
    try {
      await navigator.clipboard.writeText(selectedPdf)
    } catch {}
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Configurações</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">
          Gerencie as preferências do seu CRM e personalize a interface
        </p>
      </div>

      {/* Theme Personalization Section */}
      <Card className="border-[3px] border-slate-900 dark:border-blue-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.4)]">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 dark:bg-slate-800 rounded-2xl border-2 border-black dark:border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Personalização <span className="text-blue-600 dark:text-blue-400">do Tema</span></CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">Escolha as cores principais para os modos claro e escuro</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetThemeColors}
              className="rounded-xl border-2 border-slate-900 dark:border-blue-500/50 font-black uppercase tracking-widest text-[10px] h-10 px-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(59,130,246,0.2)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Resetar Cores
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Light Theme Colors */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center border-2 border-slate-900 dark:border-slate-900">
                  <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Tema Claro</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cor Primária</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl border-2 border-slate-900 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <input 
                        type="color" 
                        value={lightPrimary} 
                        onChange={(e) => setLightPrimary(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer border-none p-0 scale-[2]"
                      />
                    </div>
                    <Input 
                      value={lightPrimary} 
                      onChange={(e) => setLightPrimary(e.target.value)}
                      className="font-mono text-xs border-2 border-slate-900 rounded-xl h-12 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)] uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cor das Bordas</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl border-2 border-slate-900 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <input 
                        type="color" 
                        value={lightBorder} 
                        onChange={(e) => setLightBorder(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer border-none p-0 scale-[2]"
                      />
                    </div>
                    <Input 
                      value={lightBorder} 
                      onChange={(e) => setLightBorder(e.target.value)}
                      className="font-mono text-xs border-2 border-slate-900 rounded-xl h-12 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.05)] uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Theme Colors */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border-2 border-slate-900 dark:border-slate-900">
                  <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Tema Escuro</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cor Primária</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl border-2 border-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]">
                      <input 
                        type="color" 
                        value={darkPrimary} 
                        onChange={(e) => setDarkPrimary(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer border-none p-0 scale-[2]"
                      />
                    </div>
                    <Input 
                      value={darkPrimary} 
                      onChange={(e) => setDarkPrimary(e.target.value)}
                      className="font-mono text-xs border-2 border-slate-900 dark:border-slate-900 rounded-xl h-12 bg-slate-900 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cor das Bordas</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl border-2 border-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]">
                      <input 
                        type="color" 
                        value={darkBorder} 
                        onChange={(e) => setDarkBorder(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer border-none p-0 scale-[2]"
                      />
                    </div>
                    <Input 
                      value={darkBorder} 
                      onChange={(e) => setDarkBorder(e.target.value)}
                      className="font-mono text-xs border-2 border-slate-900 dark:border-slate-900 rounded-xl h-12 bg-slate-900 text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-4">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
              As alterações são aplicadas instantaneamente e salvas no seu navegador. Experimente diferentes combinações para combinar com sua marca!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-[3px] border-slate-900 dark:border-purple-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(147,51,234,0.4)]">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b-[3px] border-slate-900 dark:border-slate-900 p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 dark:bg-slate-800 rounded-2xl border-2 border-black dark:border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Perfil <span className="text-purple-600 dark:text-purple-400">Profissional</span></CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 font-bold">Configure seu currículo e portfólio para análise da IA</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl border-2 border-slate-900 dark:border-slate-900 font-black uppercase tracking-widest text-[10px] h-10 px-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]"
                  onClick={async () => {
                  try {
                    const res = await fetch('/api/setup', { method: 'POST' })
                    const data = await res.json()
                    
                    if (res.ok && data.success) {
                      const msg = 'Storage configurado com sucesso! Recarregando dados...'
                      console.log(msg)
                      alert(msg)
                      
                      const r = await fetch('/api/user-profile')
                      const d = await r.json()
                      const items = Array.isArray(d?.portfolio) ? d.portfolio : []
                      setPortfolio(items)
                      const firstWithPdf = items.find((i: any) => Array.isArray(i.media_urls) && i.media_urls.length > 0)
                      const url = firstWithPdf ? firstWithPdf.media_urls[0] : null
                      setLastPdfUrl(url)
                      setSelectedPdf(url)
                    } else {
                      const errorMsg = data.error || 'Erro desconhecido ao configurar storage.'
                      console.error('Erro no Setup:', errorMsg)
                      alert('Erro: ' + errorMsg)
                    }
                  } catch (err) {
                    console.error('Erro na requisição de setup:', err)
                    alert('Erro de conexão ao configurar storage.')
                  }
                }}
              >
                Configurar Storage
              </Button>
            </div>
          </div>
          <CardDescription>
            Adicione seu currículo em texto e PDF, e vincule o LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="https://www.linkedin.com/in/usuario" 
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
              <Button variant="outline" asChild>
                <a href={linkedinUrl || '#'} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Currículo em Texto</Label>
            <Textarea 
              placeholder="Cole seu currículo aqui..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="min-h-40"
            />
          </div>
          <div className="space-y-2">
            <Label>Currículo PDF</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex md:col-span-1 items-center gap-2">
                <Input type="file" accept="application/pdf" onChange={handleUploadPdf} />
                <Button variant="outline" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
              <div 
                className={[
                  'md:col-span-2 border-2 rounded-md p-4 text-sm transition',
                  dragging ? 'border-primary bg-accent/40' : 'border-dashed border-border'
                ].join(' ')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                Arraste e solte um PDF aqui para enviar
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveTextAndLink}>
              Salvar Texto e LinkedIn
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-1 space-y-2">
              <Label>Arquivos Enviados</Label>
              <div className="border p-2 rounded-md max-h-60 overflow-auto">
                {portfolio.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum PDF encontrado</div>
                )}
                {portfolio.map((item: any) => {
                  const url = Array.isArray(item.media_urls) && item.media_urls[0] ? item.media_urls[0] : null
                  return (
                    <button
                      key={item.id}
                      className={[
                        'flex items-center justify-between w-full text-left py-2 px-2 rounded-md border',
                        selectedPdf === url ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                      ].join(' ')}
                      onClick={() => setSelectedPdf(url)}
                      disabled={!url}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{item.title || 'Currículo PDF'}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : 'Sem data'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir em nova aba">
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Visualização</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={!selectedPdf} asChild>
                  <a href={selectedPdf || '#'} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    Abrir
                  </a>
                </Button>
                <Button variant="outline" disabled={!selectedPdf} asChild>
                  <a href={selectedPdf || '#'} download>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </a>
                </Button>
                <Button variant="outline" disabled={!selectedPdf} onClick={handleCopyLink}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copiar link
                </Button>
              </div>
              <div className="border rounded-md p-2 h-[600px]">
                {selectedPdf ? (
                  <iframe src={selectedPdf} className="w-full h-full" />
                ) : (
                  <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
                    Selecione um PDF para visualizar
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Integration */}
      <Card className="border-[3px] border-slate-900 dark:border-emerald-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(16,185,129,0.4)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Integracao com Portfolio</CardTitle>
          </div>
          <CardDescription>
            Conexao com o Supabase do portfolio externo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="font-medium text-foreground">Status da Conexao</p>
              <p className="text-sm text-muted-foreground">thierrycreative.vercel.app</p>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Conectado
            </Badge>
          </div>
          <div className="space-y-2">
            <Label>URL do Projeto</Label>
            <Input 
              value="https://ojltyvxgkgnqzrwziduu.supabase.co" 
              readOnly 
              className="font-mono text-sm"
            />
          </div>
          <Button variant="outline" asChild>
            <a href="https://thierrycreative.vercel.app/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visitar Portfolio
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Gemini API */}
      <Card className="border-[3px] border-slate-900 dark:border-yellow-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(234,179,8,0.4)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>API do Gemini</CardTitle>
          </div>
          <CardDescription>
            Configure a chave de API para busca inteligente de leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Chave de API</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="AIza..."
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Configure a variavel de ambiente GEMINI_API_KEY no painel do Vercel
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              <Key className="h-4 w-4 mr-2" />
              Obter Chave de API
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Database */}
      <Card className="border-[3px] border-slate-900 dark:border-sky-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(14,165,233,0.4)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Banco de Dados</CardTitle>
          </div>
          <CardDescription>
            Informacoes sobre o banco de dados do CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="font-medium text-foreground">Supabase</p>
              <p className="text-sm text-muted-foreground">Banco de dados PostgreSQL</p>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Conectado
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Tabelas disponiveis:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>clients - Cadastro de clientes</li>
              <li>interactions - Historico de interacoes</li>
              <li>email_templates - Templates de email</li>
              <li>sent_emails - Emails enviados</li>
              <li>ai_searches - Historico de buscas IA</li>
              <li>portfolio_cache - Cache do portfolio</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-[3px] border-slate-900 dark:border-pink-500/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(236,72,153,0.4)]">
        <CardHeader>
          <CardTitle>Sobre o CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Thierry CRM</strong> - Sistema de gerenciamento de clientes para Designers
            </p>
            <p>
              Desenvolvido para gerenciar leads de agencias de publicidade e 
              facilitar a comunicacao com potenciais clientes.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <a 
                href="https://github.com/Thierryn8n/thierrycreative" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              <a 
                href="https://thierrycreative.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Portfolio
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
