import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Truck, Shield, Heart, Star, Users, Clock, Award } from 'lucide-react'
import CustomerNavbar from '@/components/customer/navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
                <Star className="w-4 h-4 mr-1" />
                Produk Terpercaya
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Susu Segar 
                <span className="text-yellow-300">Baroka</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Nikmati susu segar berkualitas tinggi langsung dari peternakan terpercaya. 
                Preorder sekarang dan dapatkan pengalaman minum susu terbaik untuk keluarga Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold" asChild>
                  <Link href="/customer-products">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Belanja Sekarang
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
                  <Link href="/customer-orders">Cek Pesanan</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>10K+ Pelanggan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Sertifikat Halal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Pengiriman Cepat</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Heart className="w-16 h-16 text-yellow-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Susu Segar Setiap Hari</h3>
                  <p className="text-blue-100 mb-6">
                    Dapatkan susu segar langsung dari peternakan dengan kualitas terjamin
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-300">100%</div>
                      <div className="text-sm text-blue-200">Alami</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-300">24h</div>
                      <div className="text-sm text-blue-200">Segar</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kategori Produk
            </h2>
            <p className="text-lg text-gray-600">
              Pilih jenis susu yang sesuai dengan kebutuhan keluarga Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Susu Segar</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Susu murni langsung dari peternakan dengan kualitas terbaik
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-500">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Susu Pasteurisasi</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Susu yang telah diproses dengan teknologi pasteurisasi modern
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-purple-500">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Susu Organik</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Susu organik dari sapi yang dipelihara secara alami
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-orange-500">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Susu Premium</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Susu premium dengan kualitas dan rasa yang istimewa
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
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
            <Card className="text-center hover:shadow-lg transition-shadow">
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

            <Card className="text-center hover:shadow-lg transition-shadow">
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

            <Card className="text-center hover:shadow-lg transition-shadow">
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

            <Card className="text-center hover:shadow-lg transition-shadow">
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
      <section className="py-16 bg-white">
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
            <div className="text-center group">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Pilih Produk</h3>
              <p className="text-gray-600 leading-relaxed">
                Pilih jenis susu dan jumlah yang diinginkan dari katalog produk kami yang lengkap
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Bayar & Upload Bukti</h3>
              <p className="text-gray-600 leading-relaxed">
                Lakukan transfer ke rekening yang tersedia dan upload bukti pembayaran dengan mudah
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Tunggu Pengiriman</h3>
              <p className="text-gray-600 leading-relaxed">
                Tim kami akan memproses pesanan dan mengirimkan susu segar ke alamat Anda
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Siap Memulai Preorder?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan pelanggan yang telah merasakan kualitas susu Baroka. 
            Dapatkan susu segar terbaik untuk keluarga Anda hari ini juga!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-8 py-3" asChild>
              <Link href="/customer-products">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Mulai Preorder Sekarang
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3" asChild>
              <Link href="/login">Daftar Sekarang</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Susu Baroka</h3>
              <p className="text-gray-300 mb-4">
                Menyediakan susu segar berkualitas tinggi langsung dari peternakan terpercaya untuk keluarga Indonesia.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/customer-products" className="hover:text-yellow-400 transition-colors">Susu Segar</Link></li>
                <li><Link href="/customer-products" className="hover:text-yellow-400 transition-colors">Susu Pasteurisasi</Link></li>
                <li><Link href="/customer-products" className="hover:text-yellow-400 transition-colors">Susu Organik</Link></li>
                <li><Link href="/customer-products" className="hover:text-yellow-400 transition-colors">Susu Premium</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/customer-orders" className="hover:text-yellow-400 transition-colors">Cek Pesanan</Link></li>
                <li><Link href="/cart" className="hover:text-yellow-400 transition-colors">Keranjang</Link></li>
                <li><span className="hover:text-yellow-400 transition-colors cursor-pointer">Bantuan</span></li>
                <li><span className="hover:text-yellow-400 transition-colors cursor-pointer">FAQ</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Pengiriman Seluruh Indonesia</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Senin - Minggu: 08:00 - 20:00</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Sertifikat Halal</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Susu Baroka. Semua hak dilindungi undang-undang.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
