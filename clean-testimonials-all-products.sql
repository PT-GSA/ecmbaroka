-- Script bersih untuk menambahkan testimoni ke semua produk
-- Jalankan ini di Supabase SQL Editor

-- Buat user tambahan untuk produk lain dengan UUID yang valid
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'maya@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'nina@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', 'omar@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', 'putri@susubaroka.com', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000006', 'qori@susubaroka.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Maya Sari', 'customer'),
    ('00000000-0000-0000-0000-000000000003', 'Nina Kusuma', 'customer'),
    ('00000000-0000-0000-0000-000000000004', 'Omar Pratama', 'customer'),
    ('00000000-0000-0000-0000-000000000005', 'Putri Lestari', 'customer'),
    ('00000000-0000-0000-0000-000000000006', 'Qori Maharani', 'customer')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name;

-- Insert review untuk semua produk aktif dengan UUID yang valid
INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000002',
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 5
        WHEN p.name ILIKE '%organik%' THEN 5
        ELSE 4
    END,
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 'Susu premium dengan kualitas terbaik! Rasa sangat enak dan kemasan mewah.'
        WHEN p.name ILIKE '%organik%' THEN 'Susu organik sehat untuk keluarga. Rasa alami tanpa bahan kimia.'
        ELSE 'Susu berkualitas baik dengan harga terjangkau. Pengiriman cepat dan kemasan aman.'
    END,
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000003',
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 5
        WHEN p.name ILIKE '%organik%' THEN 4
        ELSE 4
    END,
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 'Kualitas premium yang worth it! Susu segar dan rasa yang konsisten.'
        WHEN p.name ILIKE '%organik%' THEN 'Susu organik bagus untuk kesehatan. Anak-anak suka rasanya.'
        ELSE 'Pelayanan bagus dan susu berkualitas. Akan order lagi.'
    END,
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000004',
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 5
        WHEN p.name ILIKE '%organik%' THEN 5
        ELSE 4
    END,
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 'Susu premium terbaik! Rasa ekspor dengan kemasan yang sangat bagus.'
        WHEN p.name ILIKE '%organik%' THEN 'Susu organik sehat dan enak. Keluarga sangat puas dengan kualitasnya.'
        ELSE 'Susu berkualitas tinggi dengan harga yang reasonable. Recommended!'
    END,
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000005',
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 4
        WHEN p.name ILIKE '%organik%' THEN 5
        ELSE 4
    END,
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 'Susu premium dengan kualitas konsisten. Pengiriman selalu tepat waktu.'
        WHEN p.name ILIKE '%organik%' THEN 'Susu organik terbaik untuk keluarga. Rasa alami dan sehat.'
        ELSE 'Susu berkualitas baik dengan pelayanan yang memuaskan.'
    END,
    true,
    true
FROM products p 
WHERE p.is_active = true;

INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000006',
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 5
        WHEN p.name ILIKE '%organik%' THEN 4
        ELSE 4
    END,
    CASE 
        WHEN p.name ILIKE '%premium%' THEN 'Susu premium dengan standar internasional! Rasa sangat premium.'
        WHEN p.name ILIKE '%organik%' THEN 'Susu organik bagus untuk kesehatan. Kemasan juga aman.'
        ELSE 'Susu berkualitas tinggi dengan harga yang terjangkau. Akan order lagi.'
    END,
    true,
    true
FROM products p 
WHERE p.is_active = true;

-- Verifikasi hasil akhir
SELECT 
    p.name as product_name,
    COUNT(pr.id) as total_reviews,
    ROUND(AVG(pr.rating), 1) as average_rating,
    COUNT(CASE WHEN pr.rating = 5 THEN 1 END) as five_star,
    COUNT(CASE WHEN pr.rating = 4 THEN 1 END) as four_star,
    COUNT(CASE WHEN pr.rating = 3 THEN 1 END) as three_star
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY average_rating DESC;
