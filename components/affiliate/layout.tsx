import AffiliateSidebar from '@/components/affiliate/sidebar'

interface AffiliateLayoutProps {
  children: React.ReactNode
  affiliate: {
    id: string
    name: string
    code: string
    email: string
  }
}

export default function AffiliateLayout({ children, affiliate }: AffiliateLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AffiliateSidebar affiliate={affiliate} />
        <main className="flex-1 transition-all duration-300">
          <div className="px-3 sm:px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
