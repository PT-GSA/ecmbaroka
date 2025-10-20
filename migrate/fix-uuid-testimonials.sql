-- Script sederhana dengan UUID yang valid untuk menambahkan testimoni
-- Jalankan ini di Supabase SQL Editor

-- Buat user baru dengan UUID yang valid
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'lina@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'maya@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'nina@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', 'omar@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', 'putri@susubaroka.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO user_profiles (id, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Lina Kusuma', 'customer'),
    ('00000000-0000-0000-0000-000000000002', 'Maya Sari', 'customer'),
    ('00000000-0000-0000-0000-000000000003', 'Nina Kusuma', 'customer'),
    ('00000000-0000-0000-0000-000000000004', 'Omar Pratama', 'customer'),
    ('00000000-0000-0000-0000-000000000005', 'Putri Lestari', 'customer')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name;

-- Insert review untuk semua produk aktif
INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000001',
    4,
    'Pelayanan sangat memuaskan. Susu berkualitas tinggi dengan rasa yang enak. Recommended!',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000002',
    5,
    'Susu premium dengan kualitas terbaik! Rasa sangat enak dan kemasan mewah.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000003',
    4,
    'Susu organik sehat untuk keluarga. Rasa alami tanpa bahan kimia.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000004',
    5,
    'Susu berkualitas baik dengan harga terjangkau. Pengiriman cepat dan kemasan aman.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000005',
    4,
    'Kualitas susu konsisten setiap kali order. Pengiriman selalu tepat waktu.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

-- Verifikasi hasil
SELECT 
    COUNT(*) as total_reviews,
    ROUND(AVG(rating), 1) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_reviews,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_reviews
FROM product_reviews 
WHERE is_approved = true;
