'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Users, Eye, EyeOff, ArrowRight, Sparkles, Shield, Heart, Award } from 'lucide-react'

export default function AffiliateLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginUser(email, password)

    if (!result.success || !result.user) {
      setError(result.error || 'Gagal login')
      setLoading(false)
      return
    }

    // After login, verify user is an active affiliate
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', result.user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      setError('Akun Anda belum terdaftar sebagai affiliate atau status tidak aktif.')
      setLoading(false)
      return
    }

    router.push('/affiliate/dashboard')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Program Affiliate</h1>
                  <p className="text-gray-600">Mitra Susu Baroka</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Masuk Portal
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Affiliate</span>
              </h2>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Gunakan email dan password akun Anda untuk mengakses dashboard affiliate.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Aman</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Terpercaya</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-pink-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Profesional</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">Keuntungan Program</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>
                    Komisi per karton yang transparan
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
                    Dashboard order & pelanggan rujukan
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-3"></div>
                    Link kampanye mudah dibagikan
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Login Affiliate</CardTitle>
                  <CardDescription className="text-gray-600">
                    Masukkan email dan password akun Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan password"
                          className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Memproses...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          Masuk
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Bukan affiliate?{' '}
                        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors">
                          Login Customer
                        </Link>
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Aman
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Heart className="w-3 h-3 mr-1" />
                    Terpercaya
                  </Badge>
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-pink-200">
                    <Award className="w-3 h-3 mr-1" />
                    Profesional
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}