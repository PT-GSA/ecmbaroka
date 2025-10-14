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
  Package, 
  ShoppingCart, 
  CreditCard, 
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  X,
  Link2
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Produk', href: '/admin/products', icon: Package },
  { name: 'Pesanan', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Pembayaran', href: '/admin/payments', icon: CreditCard },
  { name: 'Pelanggan', href: '/admin/customers', icon: Users },
  { name: 'Afiliasi', href: '/admin/affiliates', icon: Link2 },
  { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
  { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const [ordersPendingCount, setOrdersPendingCount] = useState<number | null>(null)
  const [paymentsPendingCount, setPaymentsPendingCount] = useState<number | null>(null)

  const fetchOrdersPendingCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')
      .range(0, 0)
    if (!error) {
      setOrdersPendingCount(count ?? 0)
    }
  }, [supabase])

  const fetchPaymentsPendingCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('payments')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')
      .range(0, 0)
    if (!error) {
      setPaymentsPendingCount(count ?? 0)
    }
  }, [supabase])

  const toggle = () => {
    setCollapsed(!collapsed)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      // Fetch initial counts for admin badges
      fetchOrdersPendingCount()
      fetchPaymentsPendingCount()
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        // Refresh counts on auth change
        fetchOrdersPendingCount()
        fetchPaymentsPendingCount()
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchOrdersPendingCount, fetchPaymentsPendingCount])

  

  

  useEffect(() => {
    // Realtime updates: refetch counts when orders or payments change
    const ordersChannel = supabase
      .channel('admin-orders-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrdersPendingCount()
        }
      )
      .subscribe()

    const paymentsChannel = supabase
      .channel('admin-payments-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchPaymentsPendingCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(paymentsChannel)
    }
  }, [supabase, fetchOrdersPendingCount, fetchPaymentsPendingCount])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getInitials = (email?: string) => {
    return email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'A'
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
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
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
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
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
                      {(() => {
                        const badgeValue = item.href === '/admin/orders'
                          ? ordersPendingCount
                          : item.href === '/admin/payments'
                          ? paymentsPendingCount
                          : null
                        if (typeof badgeValue === 'number' && badgeValue > 0) {
                          return (
                            <Badge variant="secondary" className="ml-2 bg-red-500 text-white text-xs">
                              {badgeValue}
                            </Badge>
                          )
                        }
                        return null
                      })()}
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
