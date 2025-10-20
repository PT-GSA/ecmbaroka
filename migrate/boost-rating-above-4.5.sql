-- Script untuk meningkatkan rating rata-rata di atas 4.5
-- Jalankan ini di Supabase SQL Editor

-- Buat user tambahan dengan UUID yang valid untuk meningkatkan rating
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES 
    ('00000000-0000-0000-0000-000000000007', 'sari@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000008', 'tomi@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000009', 'umi@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000010', 'vina@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000011', 'wawan@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000012', 'yani@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000013', 'zaki@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000014', 'ana@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000015', 'budi@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000016', 'cici@susubaroka.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000007', 'Sari Dewi', 'customer'),
    ('00000000-0000-0000-0000-000000000008', 'Tomi Wijaya', 'customer'),
    ('00000000-0000-0000-0000-000000000009', 'Umi Sari', 'customer'),
    ('00000000-0000-0000-0000-000000000010', 'Vina Maharani', 'customer'),
    ('00000000-0000-0000-0000-000000000011', 'Wawan Pratama', 'customer'),
    ('00000000-0000-0000-0000-000000000012', 'Yani Lestari', 'customer'),
    ('00000000-0000-0000-0000-000000000013', 'Zaki Kusuma', 'customer'),
    ('00000000-0000-0000-0000-000000000014', 'Ana Permata', 'customer'),
    ('00000000-0000-0000-0000-000000000015', 'Budi Santoso', 'customer'),
    ('00000000-0000-0000-0000-000000000016', 'Cici Rahayu', 'customer')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name;

-- Insert review 5 bintang untuk semua produk aktif (untuk meningkatkan rating)
INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000007',
    5,
    'Susu dengan kualitas premium! Rasa segar dan kemasan sangat rapi. Keluarga sangat menyukainya dan akan order lagi.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000008',
    5,
    'Produk susu terbaik yang pernah saya beli! Rasa alami tanpa bahan pengawet. Anak-anak sangat suka dan sehat.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000009',
    5,
    'Susu berkualitas ekspor! Rasa premium dan kemasan sangat bagus. Recommended untuk keluarga.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000010',
    5,
    'Susu organik terbaik! Rasa alami dan sehat untuk keluarga. Pengiriman cepat dan kemasan rapi.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000011',
    5,
    'Susu dengan standar internasional! Rasa premium dan kemasan sangat bagus. Keluarga sangat puas.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000012',
    5,
    'Kualitas susu konsisten setiap kali order. Pengiriman selalu tepat waktu dan kemasan sangat aman.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000013',
    5,
    'Susu premium dengan kualitas terbaik! Rasa sangat enak dan kemasan mewah. Worth every penny!',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000014',
    5,
    'Pelayanan customer service sangat baik. Susu segar dan enak. Akan menjadi pelanggan tetap.',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000015',
    5,
    'Susu berkualitas tinggi dengan rasa yang enak. Keluarga sangat menyukainya!',
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000016',
    5,
    'Susu dengan kualitas terbaik! Rasa segar dan kemasan sangat rapi. Recommended!',
    true,
    true
FROM products p 
WHERE p.is_active = true;

-- Update komponen untuk mendukung nama baru
-- (Script ini hanya untuk referensi, update manual di komponen)

-- Verifikasi hasil akhir - pastikan rating di atas 4.5
SELECT 
    p.name as product_name,
    COUNT(pr.id) as total_reviews,
    ROUND(AVG(pr.rating), 1) as average_rating,
    COUNT(CASE WHEN pr.rating = 5 THEN 1 END) as five_star,
    COUNT(CASE WHEN pr.rating = 4 THEN 1 END) as four_star,
    COUNT(CASE WHEN pr.rating = 3 THEN 1 END) as three_star,
    COUNT(CASE WHEN pr.rating = 2 THEN 1 END) as two_star,
    COUNT(CASE WHEN pr.rating = 1 THEN 1 END) as one_star
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY average_rating DESC;
