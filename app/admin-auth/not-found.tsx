import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, LogIn, Settings } from 'lucide-react'

export default function AdminAuthNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-red-600 mb-4">
            404
          </div>
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Halaman Admin Auth Tidak Ditemukan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sepertinya halaman admin authentication yang Anda cari tidak tersedia.<br />
            Mari kembali ke halaman login admin untuk mengakses dashboard.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <LogIn className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Admin Login</h3>
              <p className="text-sm text-gray-600 mb-4">
                Masuk ke dashboard admin untuk mengelola sistem
              </p>
              <Button asChild className="w-full">
                <Link href="/admin-auth/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Home className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Kembali ke Beranda</h3>
              <p className="text-sm text-gray-600 mb-4">
                Kembali ke halaman utama website
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Beranda
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
            <Link href="/admin/dashboard">
              <Settings className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Admin Access Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Akses Admin</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>Admin Login:</strong> Hanya untuk admin yang sudah terdaftar</p>
            <p>• <strong>Role-based Access:</strong> Akses berdasarkan level admin</p>
            <p>• <strong>Security:</strong> Sistem keamanan berlapis untuk melindungi data</p>
            <p>• <strong>Audit Trail:</strong> Semua aktivitas admin tercatat</p>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-3">🔒 Fitur Keamanan Admin</h3>
          <div className="text-red-800 text-sm space-y-2">
            <p>• <strong>Two-Factor Authentication:</strong> Verifikasi ganda untuk keamanan ekstra</p>
            <p>• <strong>Session Management:</strong> Sesi otomatis logout setelah tidak aktif</p>
            <p>• <strong>IP Whitelisting:</strong> Akses hanya dari IP yang terdaftar</p>
            <p>• <strong>Activity Monitoring:</strong> Monitoring aktivitas admin real-time</p>
          </div>
        </div>

        {/* Admin Features */}
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-3">⚙️ Fitur Admin Dashboard</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-orange-800">
            <div className="space-y-2">
              <p>• <strong>Product Management:</strong> Kelola produk dan inventory</p>
              <p>• <strong>Order Management:</strong> Monitor dan kelola pesanan</p>
              <p>• <strong>Customer Management:</strong> Kelola data customer</p>
            </div>
            <div className="space-y-2">
              <p>• <strong>Affiliate Management:</strong> Kelola program affiliate</p>
              <p>• <strong>Analytics & Reports:</strong> Laporan dan analisis</p>
              <p>• <strong>System Settings:</strong> Konfigurasi sistem</p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Butuh Bantuan Admin?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Technical Support:</strong><br />
                Email: tech@susubaroka.com<br />
                Phone: +62-xxx-xxxx-xxxx
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Emergency Contact:</strong><br />
                WhatsApp: +62-xxx-xxxx-xxxx<br />
                Available 24/7
              </p>
            </div>
          </div>
        </div>

        {/* Access Levels */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">👥 Level Akses Admin</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold mb-2">Super Admin</p>
              <p>• Akses penuh ke semua fitur</p>
              <p>• Kelola user dan permissions</p>
              <p>• System configuration</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Admin</p>
              <p>• Kelola produk dan pesanan</p>
              <p>• Monitor affiliate program</p>
              <p>• Generate reports</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Moderator</p>
              <p>• Kelola pesanan customer</p>
              <p>• Verifikasi pembayaran</p>
              <p>• Customer support</p>
            </div>
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
