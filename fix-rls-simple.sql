-- Fix RLS Infinite Recursion - Simple Version
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

-- Policy admin yang tidak recursive - hanya service role
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;

-- 6. Test dengan melihat policy yang ada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 7. Test apakah products bisa diakses
SELECT COUNT(*) as product_count FROM products;
