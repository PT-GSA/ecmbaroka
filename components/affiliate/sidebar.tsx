'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Menu, 
  X,
  User,
  Link as LinkIcon,
  DollarSign,
  History,
  Settings,
  BarChart3
} from 'lucide-react'
import AffiliateLogoutButton from './logout-button'

interface AffiliateSidebarProps {
  affiliate: {
    id: string
    name: string
    code: string
    email: string
  }
}

export default function AffiliateSidebar({ affiliate }: AffiliateSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/affiliate/dashboard', icon: LayoutDashboard },
    { name: 'Links & Campaigns', href: '/affiliate/links', icon: LinkIcon },
    { name: 'Analytics', href: '/affiliate/analytics', icon: BarChart3 },
    { name: 'Withdrawals', href: '/affiliate/withdrawals', icon: DollarSign },
    { name: 'History', href: '/affiliate/history', icon: History },
    { name: 'Settings', href: '/affiliate/settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white p-2 rounded-md shadow-md border border-gray-200"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Affiliate</h2>
                <p className="text-sm text-gray-500">{affiliate.name}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Affiliate Code</div>
              <div className="text-sm font-mono font-semibold text-gray-900">
                {affiliate.code}
              </div>
            </div>
            
            <AffiliateLogoutButton />
          </div>
        </div>
      </div>
    </>
  )
}
