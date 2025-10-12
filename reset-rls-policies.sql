-- Reset RLS Policies untuk menghindari infinite recursion
-- Jalankan script ini di Supabase SQL Editor

-- 1. Disable RLS sementara
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

-- Policy admin yang tidak recursive
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR ALL USING (
    auth.role() = 'service_role' OR
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    ))
  );

-- 5. Pastikan function memiliki permission yang benar
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- 6. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.handle_new_user TO postgres, anon, authenticated, service_role;

-- 7. Test dengan melihat policy yang ada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';
