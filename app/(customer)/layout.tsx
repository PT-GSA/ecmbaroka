import type { Metadata } from 'next'
import CustomerSidebar from '@/components/customer/sidebar'

export const metadata: Metadata = {
  title: 'Susu Baroka - Order Susu Steril',
  description: 'Order Susu Steril berkualitas tinggi dari Susu Baroka',
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
        <main className="flex-1 transition-all duration-300">
          <div className="px-3 sm:px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
