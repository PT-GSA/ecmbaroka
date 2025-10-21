import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, Search, ShoppingCart } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-blue-600 mb-4">
            404
          </div>
          <div className="text-6xl mb-4">🥛</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Oops! Susu Baroka Tidak Ditemukan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sepertinya halaman yang Anda cari sudah habis diminum! 😄<br />
            Mari kita kembali ke halaman utama untuk menemukan susu segar lainnya.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Home className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Kembali ke Beranda</h3>
              <p className="text-sm text-gray-600 mb-4">
                Jelajahi produk susu segar dan berkualitas tinggi
              </p>
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Beranda
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <ShoppingCart className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Lihat Produk</h3>
              <p className="text-sm text-gray-600 mb-4">
                Temukan susu steril terbaik untuk keluarga
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/products">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Produk
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
            <Link href="/products">
              <Search className="w-4 h-4 mr-2" />
              Cari Produk
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Butuh Bantuan?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Customer Service:</strong><br />
                WhatsApp: +62-xxx-xxxx-xxxx<br />
                Email: customer@susubaroka.com
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

        {/* Fun Facts */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Tahukah Anda?</h3>
          <p className="text-blue-800 text-sm">
            Susu Baroka diproduksi dengan teknologi steril yang menjaga nutrisi alami. 
            Setiap tetes susu kami mengandung kalsium tinggi untuk kesehatan tulang keluarga Indonesia! 🇮🇩
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 Susu Baroka. Susu Steril berkualitas tinggi untuk keluarga Indonesia.
          </p>
        </div>
      </div>
    </div>
  )
}
