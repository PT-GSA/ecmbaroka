-- Debug Admin Access
-- Jalankan script ini di Supabase SQL Editor untuk debug

-- 1. Cek apakah user admin ada
SELECT id, full_name, role, created_at 
FROM user_profiles 
WHERE role = 'admin';

-- 2. Cek user dengan ID tertentu
SELECT id, full_name, role, created_at 
FROM user_profiles 
WHERE id = '5be1ecd6-7bff-43af-b2ee-19a96f3554b6';

-- 3. Cek semua user yang ada
SELECT id, full_name, role, created_at 
FROM user_profiles 
ORDER BY created_at DESC;

-- 4. Cek apakah ada user di auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 5. Buat admin jika belum ada (ganti dengan email yang benar)
-- INSERT INTO user_profiles (id, full_name, role) VALUES 
--   ('5be1ecd6-7bff-43af-b2ee-19a96f3554b6', 'Admin Susu Baroka', 'admin')
-- ON CONFLICT (id) DO UPDATE SET 
--   role = 'admin',
--   full_name = 'Admin Susu Baroka';
