'use client'

import { createClient } from '@/lib/supabase/client'
import ProfileForm from './profile-form'

interface UserProfile {
  id: string
  full_name: string
  phone: string | null
  address: string | null
  role: 'customer' | 'admin'
  created_at: string
}

interface User {
  id: string
  email: string
}

export default function ProfileFormWrapper({ profile, user }: { profile: UserProfile, user: User }) {
  const supabase = createClient()

  const handleUpdate = async (data: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', user.id)

    if (error) {
      throw new Error(error.message)
    }
  }

  return (
    <ProfileForm profile={profile} user={{ email: user.email }} onUpdate={handleUpdate} />
  )
}