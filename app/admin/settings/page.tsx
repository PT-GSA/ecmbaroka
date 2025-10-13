import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'
import ProfileFormWrapper from '@/components/customer/profile-form-wrapper'
import ChangePasswordForm from '../../../components/admin/change-password-form'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin-auth/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null
  if (!typedProfile || typedProfile.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Admin</h1>
        <p className="text-gray-600">Kelola informasi akun dan keamanan admin</p>
      </div>

      {/* Profile Settings */}
      <ProfileFormWrapper profile={typedProfile} user={{ id: user.id, email: user.email ?? '' }} />

      {/* Security Settings */}
      <ChangePasswordForm />
    </div>
  )
}