'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ShoppingCart, 
  Clock, 
  TrendingUp, 
  Star, 
  Package,
  Heart
} from 'lucide-react'
import Link from 'next/link'

export default function CustomerDashboard() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0
  })
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    // Mock data untuk demo
    setStats({
      totalOrders: 12,
      pendingOrders: 2,
      totalSpent: 450000,
      favoriteProducts: 3
    })
  }, [supabase.auth])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Selamat Datang{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-gray-600 mt-1">
            Dashboard pelanggan Susu Baroka
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <Heart className="w-4 h-4 mr-1" />
          Member Aktif
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +2 dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu konfirmasi
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Belanja</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              +12% dari bulan lalu
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Favorit</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.favoriteProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produk yang disukai
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Akses fitur utama dengan mudah
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/customer-products">
                <Package className="mr-2 h-4 w-4" />
                Lihat Produk
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/customer-orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Pesanan Saya
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Keranjang Belanja
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
            <CardDescription>
              Status pesanan Anda yang terbaru
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Susu Segar 1L</p>
                  <p className="text-sm text-gray-600">Order #SB001</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Selesai
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Susu Pasteurisasi 500ml</p>
                  <p className="text-sm text-gray-600">Order #SB002</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Proses
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Spesial */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5 text-yellow-500" />
            Promo Spesial
          </CardTitle>
          <CardDescription>
            Nikmati penawaran menarik untuk member setia
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-green-600">Gratis Ongkir</h4>
              <p className="text-sm text-gray-600">Minimal belanja Rp 100.000</p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-blue-600">Diskon 10%</h4>
              <p className="text-sm text-gray-600">Untuk pembelian susu organik</p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-purple-600">Cashback 5%</h4>
              <p className="text-sm text-gray-600">Setiap transaksi pertama</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}