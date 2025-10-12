-- Script untuk memperbaiki foreign key relationship
-- Jalankan ini di Supabase SQL Editor

-- Tambahkan foreign key constraint jika belum ada
ALTER TABLE product_reviews 
ADD CONSTRAINT fk_product_reviews_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Pastikan ada index untuk performa
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

-- Test insert sample data
DELETE FROM product_reviews;
UPDATE products SET average_rating = 0.0, total_reviews = 0;

-- Buat dummy user
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'test@susubaroka.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Buat user profile
INSERT INTO user_profiles (id, full_name, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Customer', 'customer')
ON CONFLICT (id) DO NOTHING;

-- Insert sample review
INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved)
SELECT 
    p.id,
    '11111111-1111-1111-1111-111111111111',
    5,
    'Susu yang sangat segar dan berkualitas tinggi! Keluarga saya sangat menyukainya.',
    true,
    true
FROM products p 
WHERE p.is_active = true
LIMIT 1;

-- Verifikasi
SELECT 
    p.name as product_name,
    COUNT(pr.id) as review_count,
    AVG(pr.rating) as avg_rating
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY review_count DESC;
