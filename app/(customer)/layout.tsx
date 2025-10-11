import type { Metadata } from 'next'
import CustomerNavbar from '@/components/customer/navbar'

export const metadata: Metadata = {
  title: 'Susu Baroka - Preorder Susu Segar',
  description: 'Preorder susu segar berkualitas tinggi dari Susu Baroka',
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
