'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  BarChart3, 
  Users, 
  Zap,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: 'Prospecção B2B',
      description: 'Encontre empresas certas e gere abordagens que convertem.'
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      title: 'Pipeline de Vendas',
      description: 'Acompanhe cada proposta do contato ao contrato.'
    },
    {
      icon: <Users className="w-5 h-5 text-rose-500" />,
      title: 'Foco em Agências',
      description: 'Gerencie múltiplos leads corporativos com histórico completo.'
    },
    {
      icon: <Zap className="w-5 h-5 text-emerald-500" />,
      title: 'Fechamento Rápido',
      description: 'Reduza o ciclo de vendas com automação e dados precisos.'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Redirecionar para a página de login após cadastro bem-sucedido
        router.push('/login?message=Cadastro realizado com sucesso! Verifique seu email.')
      }
    } catch (error) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
      }
    } catch (error) {
      setError('Erro ao cadastrar com Google.')
    }
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950 overflow-hidden">
      <div className="hidden md:flex md:w-1/2 h-full bg-slate-50 dark:bg-slate-900 border-r-4 border-slate-900 dark:border-slate-800 p-8 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-12">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-black uppercase tracking-tighter text-sm">CRM Creative AI</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 tracking-tighter">
            Crie sua Conta <br />
            <span className="text-primary underline decoration-8 decoration-primary/30 underline-offset-4">e escale o B2B</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-lg leading-relaxed mb-8">
            Mesma experiência visual do login: estética Neo-brutalista, rápida e clara.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-700 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {feature.icon}
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">© 2026 CRM Creative AI</p>
          <div className="flex gap-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">System Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 h-full flex items-center justify-center p-8 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="w-full max-w-sm relative z-10">
          <div className="md:hidden flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-black uppercase tracking-tighter text-sm">CRM Creative AI</span>
            </div>
          </div>

          <div className="mb-4 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">
              Criar conta
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              Preencha seus dados para começar.
            </p>
          </div>

          <Card className="border-2 border-slate-900 dark:border-slate-800 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold">Cadastro</CardTitle>
              <CardDescription className="text-sm">Crie sua conta para acessar o CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <Alert variant="destructive" className="border-2 border-rose-500">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="João Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white rounded-2xl border-2 border-black font-black uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2 border-slate-100 dark:border-slate-900" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-white dark:bg-slate-950 px-4 text-slate-400">Ou cadastre-se com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Account
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{' '}
                  <Link href="/login" className="text-primary hover:underline font-black uppercase tracking-tighter">
                    Faça login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Ao se cadastrar, você concorda com nossos Termos de Serviço e Política de Privacidade.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
