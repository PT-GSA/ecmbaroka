BEGIN;

-- Tambahkan kolom JSONB untuk menyimpan spesifikasi produk
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;

-- Index GIN untuk pencarian di kolom JSONB specs
CREATE INDEX IF NOT EXISTS idx_products_specs_gin
  ON public.products USING gin (specs);

-- Opsional: Tambahkan kolom SKU
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- Opsional: Tambahkan kolom updated_at
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fungsi trigger untuk mengisi updated_at saat update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hapus trigger jika sudah ada untuk mencegah duplikasi
DROP TRIGGER IF EXISTS products_updated_at ON public.products;

-- Buat trigger BEFORE UPDATE agar kolom updated_at selalu terbarui
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;