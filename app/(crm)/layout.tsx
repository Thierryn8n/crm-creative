import { CRMSidebar } from '@/components/crm/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ScrollToTop } from '@/components/crm/scroll-to-top'

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="relative flex min-h-screen bg-background w-full overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
          <CRMSidebar />
          <main className="flex-1 relative z-10 pl-20 lg:pl-64">
            <div className="p-4 lg:p-8 pt-16 lg:pt-8 h-full">
              {children}
            </div>
          </main>
          <ScrollToTop />
          <Toaster />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
