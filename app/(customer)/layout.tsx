import type { Metadata } from 'next'
import CustomerSidebar from '@/components/customer/sidebar'

export const metadata: Metadata = {
  title: 'Susu Baroka - Preorder Susu Steril',
  description: 'Preorder Susu Steril berkualitas tinggi dari Susu Baroka',
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <CustomerSidebar />
        <main className="flex-1 lg:ml-12 xl:ml-56 transition-all duration-300">
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
