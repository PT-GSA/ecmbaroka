-- Fix Infinite Recursion pada RLS Policy
-- Jalankan script ini di Supabase SQL Editor

-- 1. Disable RLS sementara untuk user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop semua policy yang ada
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow signup process" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- 3. Enable RLS kembali
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Buat policy yang sederhana dan tidak recursive
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy untuk service role (trigger)
CREATE POLICY "Service role can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy untuk public signup
CREATE POLICY "Allow signup process" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Policy admin yang tidak recursive - menggunakan service role check
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Buat function handle_new_user jika belum ada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
  INSERT INTO public.user_profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Buat trigger untuk function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.handle_new_user TO postgres, anon, authenticated, service_role;

-- 8. Test dengan melihat policy yang ada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';
