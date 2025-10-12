# Test Admin Access dengan Bun

## Langkah-langkah untuk mengakses admin:

### 1. Pastikan server Bun berjalan
```bash
bun run dev
```

### 2. Buat user admin di Supabase
- Buka Supabase Dashboard → Authentication → Users
- Klik "Add user"
- Isi email: `admin@susubaroka.com`
- Isi password: `admin123`
- Klik "Create"

### 3. Jalankan script SQL untuk membuat admin
```sql
-- Ganti dengan user ID yang baru dibuat
INSERT INTO user_profiles (id, full_name, role) VALUES 
  ('your-user-id', 'Admin Susu Baroka', 'admin')
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  full_name = 'Admin Susu Baroka';
```

### 4. Login sebagai admin
- Buka `http://localhost:3000/login`
- Masukkan email: `admin@susubaroka.com`
- Masukkan password: `admin123`
- Klik "Login"

### 5. Akses admin dashboard
- Setelah login, akses `http://localhost:3000/admin/dashboard`
- Jika berhasil, akan melihat dashboard admin

## Troubleshooting:

### Jika masih redirect ke login:
1. Cek apakah user sudah login
2. Cek apakah role di database adalah 'admin'
3. Cek console browser untuk error

### Jika error 404:
1. Pastikan server Bun berjalan
2. Cek apakah file `app/(admin)/dashboard/page.tsx` ada
3. Restart server dengan `bun run dev`

### Debug dengan curl:
```bash
# Test home page
curl -I http://localhost:3000

# Test login page
curl -I http://localhost:3000/login

# Test admin dashboard (akan redirect ke login jika belum login)
curl -I http://localhost:3000/admin/dashboard
```

## File yang perlu dicek:
- `app/(admin)/dashboard/page.tsx` - Halaman dashboard admin
- `app/(admin)/layout.tsx` - Layout admin
- `components/admin/sidebar.tsx` - Sidebar admin
- `middleware.ts` - Middleware untuk proteksi route
