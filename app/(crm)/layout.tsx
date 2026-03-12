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
        <div className="flex min-h-screen bg-background w-full">
          <CRMSidebar />
          <main className="flex-1">
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
