'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Mail,
  Search,
  Image,
  FileText,
  Settings,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useSidebar } from '@/components/ui/sidebar'
import { useTheme } from 'next-themes'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contatos', href: '/clients', icon: Users },
  { name: 'Clientes', href: '/real-clients', icon: Users },
  { name: 'Buscar Leads', href: '/search', icon: Search },
  { name: 'Emails', href: '/emails', icon: Mail },
  { name: 'Portfolio', href: '/portfolio', icon: Image },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
]

export function CRMSidebar() {
  const pathname = usePathname()
  const { open, setOpen, openMobile, setOpenMobile, toggleSidebar } = useSidebar()
  const collapsed = !open
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing theme UI to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
            variant="outline"
            size="icon"
            onClick={() => setOpenMobile(!openMobile)}
            className="bg-background"
          >
            {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
  
        {/* Mobile overlay */}
        {openMobile && (
          <div
            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setOpenMobile(false)}
          />
        )}
  
        <aside
          className={cn(
            'fixed top-0 left-0 h-screen z-40 bg-white dark:bg-slate-950 border-r-[3px] border-slate-900 transition-all duration-300 ease-in-out',
            collapsed ? 'w-20' : 'w-64',
            openMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="flex items-center justify-between px-5 py-6">
              {!collapsed ? (
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                    <span className="text-white dark:text-slate-900 font-black text-lg tracking-tighter">TC</span>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="font-black text-slate-900 dark:text-white text-base leading-none tracking-tight uppercase italic">Thierry CRM</h1>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Creative Suite</p>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                  <span className="text-white dark:text-slate-900 font-black text-lg tracking-tighter">TC</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpenMobile(false)}
                    className={cn(
                      'group flex items-center h-11 transition-all duration-200 rounded-xl border-[3px]',
                      collapsed ? 'justify-center px-0' : 'px-3 gap-3',
                      isActive 
                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' 
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:translate-x-1'
                    )}
                  >
                    <item.icon className={cn(
                      'h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-white dark:text-slate-900' : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    )} />
                    {!collapsed && (
                      <span className="font-black text-[11px] tracking-tight uppercase italic">{item.name}</span>
                    )}
                    {!collapsed && isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Theme Selector */}
            {mounted && (
              <div className={cn(
                "px-3 py-4 border-t-[3px] border-slate-900 dark:border-white transition-all",
                collapsed ? "flex flex-col items-center gap-4" : "flex items-center justify-between"
              )}>
                {!collapsed && (
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic ml-2">Tema</span>
                )}
                <div className={cn(
                  "flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]",
                  collapsed && "flex-col"
                )}>
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      theme === 'light' 
                        ? "bg-white text-slate-900 shadow-sm border-2 border-slate-900" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                    title="Modo Claro"
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      theme === 'dark' 
                        ? "bg-slate-900 text-white shadow-sm border-2 border-slate-400" 
                        : "text-slate-400 hover:text-slate-300"
                    )}
                    title="Modo Escuro"
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      theme === 'system' 
                        ? "bg-slate-500 text-white shadow-sm border-2 border-slate-900" 
                        : "text-slate-400 hover:text-slate-500"
                    )}
                    title="Sistema"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Profile & Footer */}
            <div className="p-3 mt-auto border-t-[3px] border-slate-900 dark:border-white bg-slate-50/50 dark:bg-slate-900/50">
              <div className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border-[3px] border-slate-900 dark:border-white mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]",
                collapsed && "justify-center p-2"
              )}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] shrink-0 border-2 border-black dark:border-white shadow-sm">
                  TM
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter italic">Thierry Marketing</p>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 truncate uppercase">designer@thierry.com</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!collapsed && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setOpen(!open)}
                    className="h-10 w-10 rounded-xl border-[3px] border-slate-900 dark:border-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={cn(
                    'h-10 flex-1 rounded-xl font-black text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border-[3px] border-transparent hover:border-rose-600 uppercase tracking-widest text-[9px] shadow-none hover:shadow-[4px_4px_0px_0px_rgba(225,29,72,1)]',
                    collapsed && 'w-10 px-0 justify-center'
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Sair</span>}
                </Button>
                {collapsed && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setOpen(!open)}
                    className="h-10 w-10 rounded-xl border-[3px] border-slate-900 dark:border-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] transition-all hover:translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-1 active:translate-y-1"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </aside>
    </>
  )
}
