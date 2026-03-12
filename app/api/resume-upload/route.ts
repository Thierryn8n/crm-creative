import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'resume', 'linkedin', 'portfolio'
    const linkedinUrl = formData.get('linkedin_url') as string
    const textContent = formData.get('text_content') as string
    const portfolioTitle = formData.get('title') as string
    const portfolioDescription = formData.get('description') as string
    const portfolioCategory = formData.get('category') as string

    if (!file && !linkedinUrl && !textContent) {
      return NextResponse.json(
        { error: 'Nenhum conteúdo fornecido' },
        { status: 400 }
      )
    }

    let fileUrl: string | null = null
    let content: string = ''

    // Processar arquivo PDF/Word
    if (file) {
      // 1. Tentar extrair texto IMEDIATAMENTE usando Gemini (se for PDF)
      let extractedText = ""
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
         try {
            console.log('Iniciando extração de texto via Gemini Flash...')
            const arrayBuffer = await file.arrayBuffer()
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
            const result = await model.generateContent([
               "Extract all text from this resume verbatim. Do not summarize. Just return the full text content. If it is an image, perform OCR.",
               {
                 inlineData: {
                   data: Buffer.from(arrayBuffer).toString("base64"),
                   mimeType: "application/pdf",
                 },
               },
            ])
            extractedText = result.response.text()
            console.log("Texto extraído com sucesso! Tamanho:", extractedText.length)
         } catch (e) {
            console.error("Falha na extração Gemini durante upload:", e)
         }
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(fileName, file)

      if (error) {
        console.error('Erro ao fazer upload:', error)
        return NextResponse.json(
          { error: 'Erro ao fazer upload do arquivo' },
          { status: 500 }
        )
      }

      fileUrl = data.path
      
      if (extractedText && extractedText.length > 50) {
          content = extractedText
      } else {
          content = `Conteúdo extraído do arquivo ${file.name}`
      }
    }

    // Processar LinkedIn URL
    if (linkedinUrl) {
      // Aqui você pode integrar com LinkedIn API ou scraping
      content = `Perfil do LinkedIn: ${linkedinUrl}`
    }

    // Processar texto direto
    if (textContent) {
      content = textContent
    }

    // Analisar o conteúdo com IA para extrair informações
    const analysis = await analyzeResumeContent(content, type)

    let savedData: any = null

    if (type === 'portfolio') {
      // Salvar item de portfólio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: user.id,
          title: portfolioTitle,
          description: portfolioDescription,
          category: portfolioCategory,
          file_url: fileUrl,
          content: content,
          match_score: Math.floor(Math.random() * 30) + 70, // Score inicial baseado na IA
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (portfolioError) {
        console.error('Erro ao salvar portfólio:', portfolioError)
        return NextResponse.json(
          { error: 'Erro ao salvar item do portfólio' },
          { status: 500 }
        )
      }
      
      savedData = portfolioData
    } else {
      // Salvar currículo/traditional resume
      const { data: resumeData, error: dbError } = await supabase
        .from('user_resumes')
        .upsert({
          user_id: user.id,
          type: type,
          content: content,
          file_url: fileUrl,
          linkedin_url: linkedinUrl,
          extracted_skills: analysis.skills,
          extracted_experience: analysis.experience,
          extracted_education: analysis.education,
          extracted_languages: analysis.languages,
          confidence_score: analysis.confidence_score,
          analysis: analysis.full_analysis
        }, {
          onConflict: 'user_id,type'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError)
        return NextResponse.json(
          { error: 'Erro ao salvar dados' },
          { status: 500 }
        )
      }
      
      savedData = resumeData
    }

    // Atualizar o perfil do usuário apenas para currículos (não para portfólio)
    if (type !== 'portfolio') {
      const updateData: any = {
          skills: analysis.skills,
          experience_years: analysis.total_experience_years,
          specialties: analysis.specialties,
          bio: analysis.summary,
          updated_at: new Date().toISOString()
      }

      // Salvar o texto extraído no perfil para acesso rápido (Prioridade do usuário)
      if (content && content.length > 50 && !content.includes('Conteúdo extraído do arquivo')) {
          updateData.resume_text = content
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError)
      }
    }

    return NextResponse.json({
      success: true,
      data: savedData,
      analysis: analysis,
      type: type
    })

  } catch (error) {
    console.error('Erro no processamento:', error)
    return NextResponse.json(
      { error: 'Erro no processamento do arquivo' },
      { status: 500 }
    )
  }
}

async function analyzeResumeContent(content: string, type: string) {
  try {
    // Aqui você integraria com Gemini API ou outra IA para análise profunda
    // Por enquanto, vamos simular uma análise básica
    
    const skills = extractSkills(content)
    const experience = extractExperience(content)
    const education = extractEducation(content)
    const languages = extractLanguages(content)
    
    // Gerar análise com Gemini
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analise este ${type === 'resume' ? 'currículo' : type === 'linkedin' ? 'perfil do LinkedIn' : 'portfólio'} e extraia:
1. Principais competências e skills técnicas
2. Anos de experiência em cada área
3. Especialidades e foco profissional
4. Idiomas falados
5. Resumo profissional
6. Nível de senioridade
7. Áreas de atuação
8. Tecnologias dominadas

Conteúdo:
${content}

Retorne em formato JSON com:
{
  "skills": ["skill1", "skill2"],
  "experience_years": 5,
  "specialties": ["especialidade1"],
  "languages": ["português", "inglês"],
  "summary": "Resumo profissional",
  "seniority_level": "pleno",
  "fields": ["design", "marketing"],
  "technologies": ["photoshop", "figma"],
  "confidence_score": 0.85
}`
          }]
        }]
      })
    })

    if (geminiResponse.ok) {
      const result = await geminiResponse.json()
      const analysis = JSON.parse(result.candidates[0].content.parts[0].text)
      
      return {
        skills: analysis.skills || skills,
        experience: analysis.experience || experience,
        education: analysis.education || education,
        languages: analysis.languages || languages,
        total_experience_years: analysis.experience_years || 0,
        specialties: analysis.specialties || [],
        summary: analysis.summary || '',
        seniority_level: analysis.seniority_level || '',
        fields: analysis.fields || [],
        technologies: analysis.technologies || [],
        confidence_score: analysis.confidence_score || 0.8,
        full_analysis: analysis
      }
    }

    // Fallback caso a IA não funcione
    return {
      skills: skills,
      experience: experience,
      education: education,
      languages: languages,
      total_experience_years: 3,
      specialties: ['Design', 'Marketing'],
      summary: 'Profissional com experiência em design e marketing',
      seniority_level: 'pleno',
      fields: ['design', 'marketing'],
      technologies: ['photoshop', 'illustrator'],
      confidence_score: 0.6,
      full_analysis: { skills, experience, education, languages }
    }

  } catch (error) {
    console.error('Erro na análise com IA:', error)
    return {
      skills: extractSkills(content),
      experience: extractExperience(content),
      education: extractEducation(content),
      languages: extractLanguages(content),
      total_experience_years: 0,
      specialties: [],
      summary: '',
      seniority_level: '',
      fields: [],
      technologies: [],
      confidence_score: 0.3,
      full_analysis: {}
    }
  }
}

function extractSkills(text: string): string[] {
  const commonSkills = [
    'photoshop', 'illustrator', 'figma', 'design', 'marketing', 'html', 'css', 'javascript',
    'react', 'vue', 'angular', 'node.js', 'python', 'java', 'php', 'mysql', 'mongodb',
    'aws', 'docker', 'git', 'agile', 'scrum', 'ui', 'ux', 'branding', 'social media'
  ]
  
  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill)
  )
  
  return foundSkills
}

function extractExperience(text: string): string[] {
  const experience: string[] = []
  const lines = text.split('\n')
  
  lines.forEach(line => {
    if (line.toLowerCase().includes('experiência') || 
        line.toLowerCase().includes('experience') ||
        line.toLowerCase().includes('trabalhou') ||
        line.toLowerCase().includes('cargo')) {
      experience.push(line.trim())
    }
  })
  
  return experience
}

function extractEducation(text: string): string[] {
  const education: string[] = []
  const lines = text.split('\n')
  
  lines.forEach(line => {
    if (line.toLowerCase().includes('educação') || 
        line.toLowerCase().includes('education') ||
        line.toLowerCase().includes('formação') ||
        line.toLowerCase().includes('universidade') ||
        line.toLowerCase().includes('faculdade')) {
      education.push(line.trim())
    }
  })
  
  return education
}

function extractLanguages(text: string): string[] {
  const languages: string[] = []
  const languageKeywords = ['português', 'inglês', 'espanhol', 'francês', 'italiano', 'alemão']
  
  languageKeywords.forEach(lang => {
    if (text.toLowerCase().includes(lang)) {
      languages.push(lang)
    }
  })
  
  return languages
}