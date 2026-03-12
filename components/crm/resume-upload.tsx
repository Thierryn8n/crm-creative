'use client'

import { useState } from 'react'
import { Award, Image as ImageIcon, Type, Upload, FileText, Linkedin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ResumeUploadProps {
  onUploadComplete: (data: any) => void
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [uploadType, setUploadType] = useState<'file' | 'linkedin' | 'text' | 'portfolio'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [portfolioTitle, setPortfolioTitle] = useState('')
  const [portfolioDescription, setPortfolioDescription] = useState('')
  const [portfolioCategory, setPortfolioCategory] = useState('design')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const validTypes = uploadType === 'portfolio' 
        ? [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
          ]
        : [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ]
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setError(null)
      } else {
        const errorMessage = uploadType === 'portfolio' 
          ? 'Tipo de arquivo não suportado. Use imagens (JPG, PNG, GIF, WebP) ou PDF.'
          : 'Tipo de arquivo não suportado. Use PDF, Word ou texto.'
        setError(errorMessage)
      }
    }
  }

  const handleUpload = async () => {
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      
      if (uploadType === 'file' && file) {
        formData.append('file', file)
        formData.append('type', 'resume')
      } else if (uploadType === 'linkedin' && linkedinUrl) {
        formData.append('type', 'linkedin')
        formData.append('linkedin_url', linkedinUrl)
      } else if (uploadType === 'text' && textContent) {
        formData.append('type', 'text')
        formData.append('text_content', textContent)
      } else if (uploadType === 'portfolio' && file) {
        // Validação específica para portfólio
        if (!portfolioTitle.trim()) {
          setError('Por favor, insira um título para o trabalho')
          setUploading(false)
          return
        }
        if (!portfolioDescription.trim()) {
          setError('Por favor, insira uma descrição para o trabalho')
          setUploading(false)
          return
        }
        
        formData.append('file', file)
        formData.append('type', 'portfolio')
        formData.append('title', portfolioTitle)
        formData.append('description', portfolioDescription)
        formData.append('category', portfolioCategory)
      } else {
        setError('Por favor, forneça o conteúdo para upload')
        setUploading(false)
        return
      }

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/resume-upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload')
      }

      const result = await response.json()
      setUploadResult(result)
      onUploadComplete(result)

      // Resetar formulário após 2 segundos
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 2000)

    } catch (error) {
      console.error('Erro no upload:', error)
      setError(error instanceof Error ? error.message : 'Erro ao processar arquivo')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setFile(null)
    setLinkedinUrl('')
    setTextContent('')
    setPortfolioTitle('')
    setPortfolioDescription('')
    setPortfolioCategory('design')
    setUploadResult(null)
    setError(null)
    setUploadProgress(0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload de Currículo/Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Como você quer enviar seu currículo?</label>
          <Select value={uploadType} onValueChange={(value: any) => setUploadType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="file">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Arquivo (PDF, Word, TXT)
                </div>
              </SelectItem>
              <SelectItem value="linkedin">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  Link do LinkedIn
                </div>
              </SelectItem>
              <SelectItem value="text">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Texto/Cópiar e Colar
                </div>
              </SelectItem>
              <SelectItem value="portfolio">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Portfólio/Trabalho
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Upload por Arquivo */}
        {uploadType === 'file' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o arquivo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Clique para selecionar ou arraste o arquivo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Word ou TXT (máx. 10MB)
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Upload por LinkedIn */}
        {uploadType === 'linkedin' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">URL do LinkedIn</label>
            <Input
              type="url"
              placeholder="https://linkedin.com/in/seu-perfil"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              disabled={uploading}
            />
          </div>
        )}

        {/* Upload por Texto */}
        {uploadType === 'text' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Cole seu currículo aqui</label>
            <Textarea
              placeholder="Cole o texto do seu currículo aqui..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              disabled={uploading}
              className="resize-none"
            />
          </div>
        )}

        {/* Upload de Portfólio */}
        {uploadType === 'portfolio' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagem/PDF do trabalho</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="portfolio-upload"
                  disabled={uploading}
                />
                <label htmlFor="portfolio-upload" className="cursor-pointer">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Clique para selecionar ou arraste a imagem/PDF'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF, WebP ou PDF (máx. 10MB)
                  </p>
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Título do trabalho</label>
              <Input
                type="text"
                placeholder="Ex: Website Corporativo XYZ, Logo Design ABC..."
                value={portfolioTitle}
                onChange={(e) => setPortfolioTitle(e.target.value)}
                disabled={uploading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descreva o trabalho, tecnologias usadas, desafios superados..."
                value={portfolioDescription}
                onChange={(e) => setPortfolioDescription(e.target.value)}
                rows={4}
                disabled={uploading}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={portfolioCategory} onValueChange={setPortfolioCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-design">Web Design</SelectItem>
                  <SelectItem value="mobile-app">Aplicativo Mobile</SelectItem>
                  <SelectItem value="branding">Branding/Identidade</SelectItem>
                  <SelectItem value="marketing">Marketing Digital</SelectItem>
                  <SelectItem value="development">Desenvolvimento</SelectItem>
                  <SelectItem value="design-grafico">Design Gráfico</SelectItem>
                  <SelectItem value="video">Vídeo/Animação</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Barra de Progresso */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processando...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado do Upload */}
        {uploadResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p>Currículo processado com sucesso!</p>
                {uploadResult.analysis && (
                  <div className="text-sm space-y-1">
                    <p>✅ {uploadResult.analysis.skills?.length || 0} competências identificadas</p>
                    <p>✅ {uploadResult.analysis.experience_years || 0} anos de experiência</p>
                    <p>✅ {uploadResult.analysis.languages?.length || 0} idiomas</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={uploading || (!file && !linkedinUrl && !textContent)}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Processar Currículo
              </>
            )}
          </Button>
          
          {(file || linkedinUrl || textContent || uploadResult) && !uploading && (
            <Button variant="outline" onClick={resetForm}>
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}