-- Fix Products RLS Policies
-- Jalankan script ini di Supabase SQL Editor untuk memperbaiki akses ke tabel products

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage all products" ON products;

-- 2. Create new policies that allow proper access
-- Allow anyone to view active products (public access)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to view all products
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role and admins to manage products
CREATE POLICY "Admins can manage all products" ON products
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.products TO postgres, anon, authenticated, service_role;

-- 4. Test the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products';

-- 5. Check if products exist
SELECT COUNT(*) as product_count FROM products;
SELECT * FROM products LIMIT 5;
