import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Truck, Shield, Heart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Susu Baroka
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Nikmati susu segar berkualitas tinggi langsung dari peternakan terpercaya. 
              Preorder sekarang dan dapatkan pengalaman minum susu terbaik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/customer-products">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Lihat Produk
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/customer-orders">Cek Pesanan</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mengapa Memilih Susu Baroka?
            </h2>
            <p className="text-lg text-gray-600">
              Kami berkomitmen memberikan susu terbaik untuk keluarga Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Segar & Berkualitas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Susu langsung dari peternakan dengan standar kualitas tertinggi
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Truck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Pengiriman Aman</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sistem pengiriman yang aman dan terpercaya ke seluruh Indonesia
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Terjamin Halal</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Semua produk kami telah bersertifikat halal dan aman dikonsumsi
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                <CardTitle className="text-lg">Preorder Mudah</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sistem preorder yang mudah dan praktis untuk kebutuhan harian
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cara Kerja Preorder
            </h2>
            <p className="text-lg text-gray-600">
              Proses sederhana untuk mendapatkan susu segar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Pilih Produk</h3>
              <p className="text-gray-600">
                Pilih jenis susu dan jumlah yang diinginkan dari katalog produk kami
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Bayar & Upload Bukti</h3>
              <p className="text-gray-600">
                Lakukan transfer ke rekening yang tersedia dan upload bukti pembayaran
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Tunggu Pengiriman</h3>
              <p className="text-gray-600">
                Tim kami akan memproses pesanan dan mengirimkan susu segar ke alamat Anda
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Memulai Preorder?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Bergabunglah dengan ribuan pelanggan yang telah merasakan kualitas susu Baroka
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/customer-products">
              Mulai Preorder Sekarang
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
