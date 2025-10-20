import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface SignupData {
  email: string
  password: string
  fullName: string
  phone: string
}

export interface SignupResult {
  success: boolean
  error?: string
  user?: User
}

export async function signupUser(data: SignupData): Promise<SignupResult> {
  const supabase = createClient()

  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return {
        success: false,
        error: authError.message || 'Gagal mendaftar akun'
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Gagal membuat akun'
      }
    }

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if profile was created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.log('Trigger failed, creating profile manually')
      
      // Fallback: Create profile manually
      const { error: manualProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: data.fullName,
          phone: data.phone,
          role: 'customer',
        })

      if (manualProfileError) {
        console.error('Manual profile creation error:', manualProfileError)
        
        // If manual creation also fails, check if it's due to RLS recursion
        if (manualProfileError.message.includes('infinite recursion')) {
          return {
            success: false,
            error: 'Terjadi masalah dengan konfigurasi database. Silakan hubungi administrator.'
          }
        }
        
        return {
          success: false,
          error: 'Gagal membuat profil pengguna: ' + manualProfileError.message
        }
      }
    }

    return {
      success: true,
      user: authData.user
    }

  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false,
      error: 'Terjadi kesalahan saat mendaftar'
    }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    if (data.user) {
      // Get user profile to determine redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      return {
        success: true,
        user: data.user,
        profile: profile
      }
    }

    return {
      success: false,
      error: 'Gagal login'
    }

  } catch  {
    return {
      success: false,
      error: 'Terjadi kesalahan saat login'
    }
  }
}
