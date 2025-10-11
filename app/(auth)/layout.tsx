import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autentikasi - Susu Baroka',
  description: 'Login atau daftar untuk mengakses Susu Baroka',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
