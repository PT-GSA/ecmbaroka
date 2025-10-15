import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileFormWrapper from '@/components/customer/profile-form-wrapper'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching profile:', error)
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl" />
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Profil Saya
                  </h1>
                  <p className="text-gray-600 text-lg">Kelola informasi akun Anda</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                Customer Panel
              </span>
            </div>
          </div>
        </div>

        <ProfileFormWrapper profile={profile} user={{ id: user.id, email: user.email ?? '' }} />
      </div>
    </div>
  )
}