'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Bell,
  History,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pesanan Saya', href: '/customer-orders', icon: ShoppingCart },
  { name: 'Keranjang', href: '/cart', icon: ShoppingCart },
  { name: 'Notifikasi', href: '/notifications', icon: Bell },
  { name: 'Riwayat Transaksi', href: '/transaction-history', icon: History },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function CustomerSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const [unreadCount, setUnreadCount] = useState<number | null>(null)

  const toggle = () => {
    setCollapsed(!collapsed)
  }

  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', false)

    if (!error) {
      setUnreadCount(count ?? 0)
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user?.id) {
        await fetchUnreadCount(user.id)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        const uid = session?.user?.id
        if (uid) {
          fetchUnreadCount(uid)
        } else {
          setUnreadCount(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchUnreadCount])

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount(user.id as string)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUnreadCount,supabase, user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getInitials = (email?: string) => {
    return email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'U'
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        collapsed ? "lg:w-12" : "lg:w-56",
        mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-blue-600 to-green-600">
            {!collapsed && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Susu Baroka</h1>
              </div>
            )}
            {collapsed && (
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                <Heart className="w-5 h-5 text-white" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="hidden lg:flex text-white hover:bg-white/20"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-b">
              <div className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "space-x-3"
              )}>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    collapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.name === 'Notifikasi' && typeof unreadCount === 'number' && unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-red-500 text-white text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* Logout */}
          <div className="p-4">
            <Button
              variant="outline"
              className={cn(
                "w-full transition-all duration-200",
                collapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={handleLogout}
            >
              <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && "Keluar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
