-- Verify Admin User
-- Jalankan script ini di Supabase SQL Editor

-- 1. Cek semua user yang ada
SELECT 'All Users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Cek semua user profiles
SELECT 'All User Profiles:' as info;
SELECT id, full_name, role, created_at 
FROM user_profiles 
ORDER BY created_at DESC;

-- 3. Cek user admin
SELECT 'Admin Users:' as info;
SELECT id, full_name, role, created_at 
FROM user_profiles 
WHERE role = 'admin';

-- 4. Cek user dengan ID tertentu (ganti dengan ID user Anda)
SELECT 'Specific User:' as info;
SELECT id, full_name, role, created_at 
FROM user_profiles 
WHERE id = '5be1ecd6-7bff-43af-b2ee-19a96f3554b6';

-- 5. Jika user belum ada sebagai admin, buat admin
-- UNCOMMENT dan ganti dengan user ID yang benar:
-- INSERT INTO user_profiles (id, full_name, role) VALUES 
--   ('your-user-id', 'Admin Susu Baroka', 'admin')
-- ON CONFLICT (id) DO UPDATE SET 
--   role = 'admin',
--   full_name = 'Admin Susu Baroka';

-- 6. Update user yang sudah ada menjadi admin
-- UNCOMMENT dan ganti dengan user ID yang benar:
-- UPDATE user_profiles 
-- SET role = 'admin', full_name = 'Admin Susu Baroka'
-- WHERE id = 'your-user-id';
