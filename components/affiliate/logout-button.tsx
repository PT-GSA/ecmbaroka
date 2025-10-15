'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}