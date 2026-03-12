'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Mail, 
  Lock, 
  LogIn, 
  Sparkles, 
  BarChart3, 
  Users, 
  Zap,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        try {
          // Garantir criação/atualização do perfil imediatamente após login
          await fetch('/api/user-profile', { method: 'GET' })
        } catch (e) {
          // Não bloquear login caso falhe
          console.warn('Falha ao garantir perfil após login:', e)
        } finally {
          router.push('/')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: "Prospecção B2B",
      description: "Encontre as empresas certas e use IA para criar abordagens de design que convertem."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      title: "Pipeline de Vendas",
      description: "Visualize o progresso de cada proposta, desde o primeiro contato até o contrato assinado."
    },
    {
      icon: <Users className="w-5 h-5 text-rose-500" />,
      title: "Foco em Agências",
      description: "Gerencie múltiplos leads corporativos com histórico completo e inteligência de mercado."
    },
    {
      icon: <Zap className="w-5 h-5 text-emerald-500" />,
      title: "Fechamento Rápido",
      description: "Reduza o ciclo de vendas de serviços criativos com automação e dados precisos."
    }
  ]

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white dark:bg-slate-950 overflow-hidden">
      {/* Coluna da Esquerda - Informações/Marketing */}
      <div className="hidden md:flex md:w-1/2 h-full bg-slate-50 dark:bg-slate-900 border-r-4 border-slate-900 dark:border-slate-800 p-8 flex-col justify-between relative overflow-hidden">
        {/* Decorativo de fundo */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-black uppercase tracking-tighter text-sm">CRM Creative AI</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-4 tracking-tighter">
              Conquiste Grandes <br />
              <span className="text-primary underline decoration-8 decoration-primary/30 underline-offset-4">Clientes B2B</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-lg leading-relaxed mb-8">
              A plataforma definitiva para designers que desejam vender serviços criativos para empresas com inteligência e escala.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
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
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400">© 2026 CRM Creative AI</p>
          <div className="flex gap-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">System Online</span>
          </div>
        </div>
      </div>

      {/* Coluna da Direita - Login */}
      <div className="flex-1 h-full flex items-center justify-center p-8 bg-white dark:bg-slate-950 relative overflow-hidden">
        {/* Background dots for Neo-brutalism */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="w-full max-w-md relative z-10">
          <div className="md:hidden flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-black uppercase tracking-tighter text-sm">CRM Creative AI</span>
            </div>
          </div>

          <div className="mb-4 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter uppercase">
              Bem-vindo
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              Entre com suas credenciais para gerenciar seus negócios.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive" className="border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <AlertDescription className="font-black uppercase tracking-tight text-xs flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Endereço de Email
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-12 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 focus:border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] focus:shadow-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Sua Senha
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline"
                  >
                    Esqueceu?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 h-12 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0 focus:border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] focus:shadow-none transition-all"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary/90 text-white rounded-2xl border-2 border-black font-black uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-slate-100 dark:border-slate-900"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-white dark:bg-slate-950 px-4 text-slate-400">Ou continue com</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Account
            </Button>

            <p className="text-center text-sm font-bold text-slate-500">
              Não tem uma conta?{' '}
              <Link 
                href="/signup" 
                className="text-primary hover:underline font-black uppercase tracking-tighter"
              >
                Cadastre-se agora
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
