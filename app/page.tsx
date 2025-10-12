import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Truck, Shield, Heart, Star, Users } from 'lucide-react'
import Image from 'next/image'
import CustomerNavbar from '@/components/customer/navbar'
import ProductCard from '@/components/customer/product-card'
import { createClient } from '@/lib/supabase/server'
import HeroCarousel from '@/components/customer/hero-carousel'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, stock, is_active')
    .eq('is_active', true)
    .limit(8)

  return (
    <div className="min-h-screen bg-neutral-50">
      <CustomerNavbar />

      {/* Banner global preorder dihapus; ditampilkan per produk saja */}

      {/* Hero dengan gambar full-width + auto carousel */}
      <section className="relative">
        <HeroCarousel
          images={[
            {
              src: '/original.jpeg',
              alt: 'Produk Susu Steril Original',
            },
            {
              src: '/rose.jpg',
              alt: 'Produk Susu Steril Rasa Rose',
            },
            {
              src: '/azwa.jpg',
              alt: 'Produk Susu Steril Rasa Azwa',
            },
            {
              src: '/family-azwa.jpeg',
              alt: 'Susu baroka family azwa',
            },
          ]}
          autoPlayInterval={5000}
        >
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
            <div className="h-full grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 pt-16 lg:pt-24">
                <Badge variant="outline" className="mb-4 text-white border-white/60 bg-white/10">
                  <Star className="w-4 h-4 mr-1" /> Terpercaya oleh pelanggan
                </Badge>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6 drop-shadow-sm">
                  Susu Steril Baroka
                </h1>
                <p className="text-lg text-white/90 mb-8 max-w-2xl">
                  Preorder susu steril import berkualitas tinggi langsung dari peternakan. Pengalaman belanja elegan, aman, dan mudah.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-white text-neutral-900 hover:bg-white/90" asChild>
                    <Link href="/products">
                      <ShoppingCart className="mr-2 h-5 w-5" /> Belanja Sekarang
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/70 text-white hover:bg-white/10" asChild>
                    <Link href="/login">Daftar</Link>
                  </Button>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-white/90">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>10K+ Pelanggan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Terjamin Halal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Pengiriman Aman</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HeroCarousel>
      </section>

      {/* Produk Unggulan */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">Produk Unggulan</h2>
              <p className="text-neutral-600">Rekomendasi terbaik untuk Anda</p>
            </div>
            <Button variant="outline" className="border-neutral-300 text-neutral-800 hover:bg-neutral-100" asChild>
              <Link href="/products">Lihat Semua</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-6 text-center text-neutral-600">Tidak ada produk aktif saat ini.</CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kategori ringkas */}
      <section className="py-12 border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-neutral-900">Jelajahi Kategori</h3>
            <p className="text-neutral-600">Temukan susu sesuai kebutuhan Anda</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Badge variant="outline" className="justify-center py-3 text-neutral-800 border-neutral-300">Susu Steril</Badge>
            <Badge variant="outline" className="justify-center py-3 text-neutral-800 border-neutral-300">Pasteurisasi</Badge>
            <Badge variant="outline" className="justify-center py-3 text-neutral-800 border-neutral-300">Organik</Badge>
            <Badge variant="outline" className="justify-center py-3 text-neutral-800 border-neutral-300">Premium</Badge>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="border-neutral-200">
              <CardHeader className="text-center">
                <Heart className="h-10 w-10 text-neutral-800 mx-auto mb-2" />
                <CardTitle className="text-base">Segar & Berkualitas</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>Langsung dari peternakan terpercaya</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardHeader className="text-center">
                <Truck className="h-10 w-10 text-neutral-800 mx-auto mb-2" />
                <CardTitle className="text-base">Pengiriman Aman</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>Jangkauan luas, tepat waktu</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardHeader className="text-center">
                <Shield className="h-10 w-10 text-neutral-800 mx-auto mb-2" />
                <CardTitle className="text-base">Terjamin Halal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>Bersertifikat dan aman dikonsumsi</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardHeader className="text-center">
                <ShoppingCart className="h-10 w-10 text-neutral-800 mx-auto mb-2" />
                <CardTitle className="text-base">Preorder Mudah</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>Proses elegan dan cepat</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA sederhana */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 mb-4">Siap Preorder?</h2>
          <p className="text-neutral-600 mb-8">Dapatkan Susu Steril terbaik untuk keluarga Anda.</p>
          <Button size="lg" className="bg-neutral-900 hover:bg-neutral-800 text-white px-8" asChild>
            <Link href="/products">
              <ShoppingCart className="mr-2 h-5 w-5" /> Mulai Belanja
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="border-t border-neutral-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Susu Baroka" width={140} height={32} />
            </div>
            <div className="text-neutral-600">&copy; 2025 Susu Baroka. Semua hak dilindungi.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
