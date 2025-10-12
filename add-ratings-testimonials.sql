-- Migration untuk menambahkan fitur rating dan testimoni produk
-- Jalankan file ini di Supabase SQL Editor

-- Tabel product_reviews untuk menyimpan rating dan testimoni
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- Tambahkan kolom average_rating dan total_reviews ke tabel products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Function untuk update rating otomatis
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update rating
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- RLS Policies
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON product_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;

CREATE POLICY "Anyone can view approved reviews" ON product_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert their own reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON product_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample reviews dengan rating 4.9 untuk produk yang ada
-- Ambil user pertama yang ada untuk sample data
DO $$
DECLARE
    sample_user_id UUID;
    product_record RECORD;
BEGIN
    -- Ambil user pertama yang ada
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Jika ada user, insert sample reviews untuk semua produk
    IF sample_user_id IS NOT NULL THEN
        FOR product_record IN SELECT id FROM products WHERE is_active = true LOOP
            -- Insert beberapa review dengan rating tinggi untuk mendapatkan rata-rata 4.9
            INSERT INTO product_reviews (product_id, user_id, rating, comment, verified_purchase, is_approved) VALUES
            (product_record.id, sample_user_id, 5, 'Susu yang sangat segar dan berkualitas tinggi! Keluarga saya sangat menyukainya. Pengiriman juga cepat dan kemasan sangat rapi.', true, true),
            (product_record.id, sample_user_id, 5, 'Produk organik terbaik yang pernah saya beli. Rasa alami tanpa bahan kimia, sangat cocok untuk anak-anak. Highly recommended!', true, true),
            (product_record.id, sample_user_id, 5, 'Susu premium dengan kualitas yang sangat memuaskan. Tekstur creamy dan rasa yang nikmat. Worth the price!', true, true),
            (product_record.id, sample_user_id, 4, 'Susu dengan kualitas konsisten setiap kali pesan. Harga terjangkau dan rasa yang enak. Akan order lagi.', true, true),
            (product_record.id, sample_user_id, 5, 'Sudah langganan bertahun-tahun dan kualitas selalu konsisten. Pelayanan customer service juga sangat baik.', true, true)
            ON CONFLICT (product_id, user_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;
