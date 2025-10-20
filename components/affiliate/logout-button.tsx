'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function AffiliateLogoutButton() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/affiliate/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <LogOut className="h-5 w-5" />
      <span>Logout</span>
    </button>
  )
}