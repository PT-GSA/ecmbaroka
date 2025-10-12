-- Script sederhana untuk mengatasi constraint violation
-- Jalankan ini di Supabase SQL Editor

-- Update user profile dengan nama asli
UPDATE user_profiles 
SET full_name = 'Sarah Wijaya'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Update review yang sudah ada dengan komentar dan rating yang lebih baik
UPDATE product_reviews 
SET 
    rating = 5,
    comment = 'Susu yang sangat segar dan berkualitas tinggi! Keluarga saya sangat menyukainya. Pengiriman juga cepat dan kemasan sangat rapi.',
    verified_purchase = true,
    is_approved = true,
    updated_at = NOW()
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Buat user baru dengan UUID yang berbeda
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'budi@susubaroka.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, full_name, role)
VALUES ('22222222-2222-2222-2222-222222222222', 'Budi Santoso', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Insert review untuk user kedua (akan berhasil karena user_id berbeda)
INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '22222222-2222-2222-2222-222222222222',
    4,
    'Susu dengan kualitas konsisten setiap kali pesan. Harga terjangkau dan rasa yang enak.',
    true,
    true
FROM products p 
WHERE p.is_active = true
LIMIT 1;

-- Buat user ketiga
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES ('33333333-3333-3333-3333-333333333333', 'maya@susubaroka.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, full_name, role)
VALUES ('33333333-3333-3333-3333-333333333333', 'Maya Putri', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Insert review untuk user ketiga
INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '33333333-3333-3333-3333-333333333333',
    5,
    'Produk organik terbaik yang pernah saya beli. Rasa alami tanpa bahan kimia.',
    true,
    true
FROM products p 
WHERE p.is_active = true
LIMIT 1;

-- Cek hasil akhir
SELECT 
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN up.full_name IS NOT NULL THEN 1 END) as reviews_with_names
FROM product_reviews pr
LEFT JOIN user_profiles up ON pr.user_id = up.id;

-- Tampilkan semua review dengan nama
SELECT 
    pr.id as review_id,
    pr.rating,
    pr.comment,
    pr.user_id,
    up.full_name as user_name,
    au.email,
    p.name as product_name
FROM product_reviews pr
LEFT JOIN user_profiles up ON pr.user_id = up.id
LEFT JOIN auth.users au ON pr.user_id = au.id
LEFT JOIN products p ON pr.product_id = p.id
ORDER BY pr.created_at DESC;
