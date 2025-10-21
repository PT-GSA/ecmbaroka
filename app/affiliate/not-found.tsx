import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft, Link as LinkIcon, BarChart3, DollarSign } from 'lucide-react'

export default function AffiliateNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-purple-600 mb-4">
            404
          </div>
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Link Affiliate Tidak Ditemukan
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sepertinya halaman affiliate yang Anda cari tidak tersedia.<br />
            Mari kembali ke dashboard affiliate untuk melanjutkan aktivitas marketing.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard Affiliate</h3>
              <p className="text-sm text-gray-600 mb-4">
                Lihat statistik komisi dan performa link Anda
              </p>
              <Button asChild className="w-full">
                <Link href="/affiliate/dashboard">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <LinkIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Kelola Link</h3>
              <p className="text-sm text-gray-600 mb-4">
                Buat dan kelola link referral Anda
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/affiliate/links">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Link Management
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
            <Link href="/affiliate/withdrawals">
              <DollarSign className="w-4 h-4 mr-2" />
              Withdrawal
            </Link>
          </Button>
        </div>

        {/* Affiliate Menu */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Menu Affiliate</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate/links">Link Management</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate/analytics">Analytics</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate/withdrawals">Withdrawals</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate/history">History</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/affiliate/settings">Settings</Link>
            </Button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-3">💡 Tips Affiliate Marketing</h3>
          <div className="text-purple-800 text-sm space-y-2">
            <p>• <strong>Konsistensi:</strong> Post konten secara rutin untuk meningkatkan engagement</p>
            <p>• <strong>Target Audience:</strong> Fokus pada audiens yang tepat untuk meningkatkan konversi</p>
            <p>• <strong>Quality Content:</strong> Buat konten yang menarik dan informatif</p>
            <p>• <strong>Track Performance:</strong> Pantau analytics untuk optimasi strategi</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Butuh Bantuan Affiliate?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Affiliate Support:</strong><br />
                WhatsApp: +62-xxx-xxxx-xxxx<br />
                Email: affiliate@susubaroka.com
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">
                <strong>Jam Operasional:</strong><br />
                Senin - Jumat: 09:00 - 17:00 WIB<br />
                Sabtu: 09:00 - 13:00 WIB
              </p>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-3">💰 Info Komisi</h3>
          <div className="text-green-800 text-sm space-y-1">
            <p><strong>Susu Baroka 200ml:</strong> 5% komisi</p>
            <p><strong>Susu Baroka 500ml:</strong> 7% komisi</p>
            <p><strong>Susu Baroka 1L:</strong> 10% komisi</p>
            <p><strong>Minimum Withdrawal:</strong> Rp 50.000</p>
            <p><strong>Pembayaran:</strong> Mingguan (setiap Senin)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 Susu Baroka Affiliate Program. Raih kesuksesan bersama kami!
          </p>
        </div>
      </div>
    </div>
  )
}
