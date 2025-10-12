import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/sidebar'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Susu Baroka',
  description: 'Panel administrasi untuk mengelola Susu Baroka',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-12 xl:ml-56 transition-all duration-300">
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
