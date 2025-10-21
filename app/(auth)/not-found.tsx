import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, LogIn, UserPlus, Lock } from 'lucide-react'

export default function AuthNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-indigo-600 mb-4">
            404
          </div>
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Halaman Auth Tidak Ditemukan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sepertinya halaman autentikasi yang Anda cari tidak tersedia.<br />
            Mari kembali ke halaman login atau daftar untuk melanjutkan.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <LogIn className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Login</h3>
              <p className="text-sm text-gray-600 mb-4">
                Masuk ke akun Anda untuk mengakses fitur lengkap
              </p>
              <Button asChild className="w-full">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <UserPlus className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Daftar</h3>
              <p className="text-sm text-gray-600 mb-4">
                Buat akun baru untuk mulai berbelanja
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Daftar
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
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Beranda
            </Link>
          </Button>
        </div>

        {/* Auth Options */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Pilihan Autentikasi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Customer Login</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/register">Customer Register</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin-auth/login">Admin Login</Link>
            </Button>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
          <h3 className="font-semibold text-indigo-900 mb-3">🔒 Keamanan Data</h3>
          <div className="text-indigo-800 text-sm space-y-2">
            <p>• <strong>Data Protection:</strong> Semua data Anda dilindungi dengan enkripsi SSL</p>
            <p>• <strong>Privacy Policy:</strong> Kami menghormati privasi dan tidak membagikan data Anda</p>
            <p>• <strong>Secure Login:</strong> Sistem login yang aman dengan verifikasi email</p>
            <p>• <strong>Password Security:</strong> Gunakan password yang kuat dan unik</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Butuh Bantuan?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Technical Support:</strong><br />
                Email: support@susubaroka.com<br />
                WhatsApp: +62-xxx-xxxx-xxxx
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Jam Operasional:</strong><br />
                Senin - Jumat: 08:00 - 20:00 WIB<br />
                Sabtu: 08:00 - 16:00 WIB
              </p>
            </div>
          </div>
        </div>

        {/* Account Types */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-3">👥 Jenis Akun</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-purple-800">
            <div>
              <p className="font-semibold mb-2">Customer</p>
              <p>• Berbelanja produk susu</p>
              <p>• Tracking pesanan</p>
              <p>• Riwayat pembelian</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Affiliate</p>
              <p>• Program marketing</p>
              <p>• Komisi dari penjualan</p>
              <p>• Dashboard analytics</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Admin</p>
              <p>• Kelola produk</p>
              <p>• Monitor pesanan</p>
              <p>• Kelola affiliate</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 Susu Baroka. Susu Steril berkualitas tinggi untuk keluarga Indonesia 🇮🇩
          </p>
        </div>
      </div>
    </div>
  )
}
