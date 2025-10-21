import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, Settings, Users, BarChart3 } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-red-600 mb-4">
            404
          </div>
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Halaman Admin Tidak Ditemukan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sepertinya halaman admin yang Anda cari tidak tersedia.<br />
            Mari kembali ke dashboard admin untuk melanjutkan pekerjaan.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard Admin</h3>
              <p className="text-sm text-gray-600 mb-4">
                Kembali ke dashboard utama untuk melihat statistik
              </p>
              <Button asChild className="w-full">
                <Link href="/admin/dashboard">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Kelola Affiliate</h3>
              <p className="text-sm text-gray-600 mb-4">
                Kelola affiliate dan monitor performa mereka
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/affiliates">
                  <Users className="w-4 h-4 mr-2" />
                  Affiliates
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/admin/products">
              <Settings className="w-4 h-4 mr-2" />
              Kelola Produk
            </Link>
          </Button>
        </div>

        {/* Admin Menu */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Menu Admin</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/products">Produk</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">Pesanan</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/affiliates">Affiliates</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/withdrawals">Withdrawals</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/settings">Settings</Link>
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-3">🆘 Butuh Bantuan Admin?</h3>
          <p className="text-red-800 text-sm mb-3">
            Jika Anda mengalami masalah teknis atau membutuhkan bantuan, 
            silakan hubungi tim technical support.
          </p>
          <div className="text-sm text-red-700">
            <p><strong>Technical Support:</strong> tech@susubaroka.com</p>
            <p><strong>Emergency:</strong> +62-xxx-xxxx-xxxx</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 Susu Baroka Admin Panel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
