import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, ShoppingCart, Search, Heart } from 'lucide-react'

export default function CustomerNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-green-600 mb-4">
            404
          </div>
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Produk Tidak Ditemukan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sepertinya produk yang Anda cari sedang tidak tersedia.<br />
            Mari jelajahi produk susu segar lainnya yang siap memenuhi kebutuhan keluarga!
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <ShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Lihat Semua Produk</h3>
              <p className="text-sm text-gray-600 mb-4">
                Jelajahi koleksi lengkap susu steril berkualitas tinggi
              </p>
              <Button asChild className="w-full">
                <Link href="/products">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Produk
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Home className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Kembali ke Beranda</h3>
              <p className="text-sm text-gray-600 mb-4">
                Temukan promo dan produk terbaru di halaman utama
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
            <Link href="/products">
              <Search className="w-4 h-4 mr-2" />
              Cari Produk
            </Link>
          </Button>
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Produk Populer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/products">Susu Baroka 200ml</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/products">Susu Baroka 500ml</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/products">Susu Baroka 1L</Link>
            </Button>
          </div>
        </div>

        {/* Promo Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">🔥 Promo Spesial</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>• <strong>Flash Sale:</strong> Diskon hingga 50% untuk produk terpilih</p>
            <p>• <strong>Bundle Promo:</strong> Beli paket hemat untuk keluarga</p>
            <p>• <strong>Free Shipping:</strong> Gratis ongkir untuk order minimal Rp 150.000</p>
            <p>• <strong>Cashback:</strong> Dapatkan cashback untuk pembelian berikutnya</p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">✨ Mengapa Memilih Susu Baroka?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-green-800">
            <div className="space-y-2">
              <p>• <strong>100% Natural:</strong> Tanpa pengawet dan bahan kimia</p>
              <p>• <strong>Kaya Nutrisi:</strong> Kalsium tinggi untuk kesehatan tulang</p>
              <p>• <strong>Fresh Daily:</strong> Diproduksi setiap hari dengan standar tinggi</p>
            </div>
            <div className="space-y-2">
              <p>• <strong>Harga Terjangkau:</strong> Kualitas premium dengan harga bersahabat</p>
              <p>• <strong>Pengiriman Cepat:</strong> 1-2 hari kerja untuk seluruh Indonesia</p>
              <p>• <strong>Garansi Kualitas:</strong> 100% uang kembali jika tidak puas</p>
            </div>
          </div>
        </div>

        {/* Customer Service */}
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

        {/* Testimonial */}
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-3">💬 Testimoni Customer</h3>
          <blockquote className="text-yellow-800 text-sm italic">
            "Susu Baroka memang berkualitas tinggi. Anak-anak suka banget dan saya tenang karena tanpa pengawet. 
            Pengiriman juga cepat dan packaging rapi. Recommended untuk keluarga Indonesia!"
          </blockquote>
          <p className="text-yellow-700 text-xs mt-2">- Ibu Sarah, Jakarta</p>
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
