-- Script untuk membuat admin user
-- Jalankan di Supabase SQL Editor

-- 1. Buat user admin di Supabase Auth terlebih dahulu
-- Pergi ke Supabase Dashboard → Authentication → Users → Add user
-- Isi email dan password, lalu klik Create

-- 2. Setelah user dibuat, jalankan script ini dengan mengganti user_id
-- Cara mendapatkan user_id: Supabase Dashboard → Authentication → Users → copy ID

-- Ganti 'your-admin-user-id' dengan ID user yang baru dibuat
INSERT INTO user_profiles (id, full_name, role) VALUES 
  ('5be1ecd6-7bff-43af-b2ee-19a96f3554b6', 'Admin Susu Baroka', 'admin')
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  full_name = 'Admin Susu Baroka';

-- 3. Verifikasi admin berhasil dibuat
SELECT id, full_name, role FROM user_profiles WHERE role = 'admin';
