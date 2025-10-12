# Debug Admin Access

## Status Saat Ini ✅

### Server Status
- ✅ Server Bun berjalan di `http://localhost:3000`
- ✅ Route `/admin/dashboard` berfungsi (redirect ke login jika belum login)
- ✅ User admin sudah ada di database dengan role `admin`

### User Admin di Database
```
ID: 5be1ecd6-7bff-43af-b2ee-19a96f3554b6
Name: Admin Susu Baroka
Role: admin
```

## Langkah untuk Mengakses Admin Dashboard

### 1. Login sebagai Admin
1. Buka `http://localhost:3000/login`
2. Masukkan email yang sesuai dengan user ID di atas
3. Masukkan password yang dibuat di Supabase Auth
4. Klik "Login"

### 2. Akses Admin Dashboard
1. Setelah login, buka `http://localhost:3000/admin/dashboard`
2. Dashboard admin akan tampil

## Test Routes

### Tanpa Login (Expected: Redirect ke /login)
```bash
curl -I http://localhost:3000/admin/dashboard
# Expected: 307 Temporary Redirect to /login
```

### Setelah Login (Expected: 200 OK)
- Login terlebih dahulu di browser
- Akses `http://localhost:3000/admin/dashboard`
- Expected: Dashboard admin tampil

## Troubleshooting

### Jika Masih Error 404
1. **Pastikan sudah login**: Route admin memerlukan login dan role admin
2. **Cek console browser**: Buka Developer Tools (F12) untuk melihat error
3. **Restart server**: `bun run dev`
4. **Cek file structure**: Pastikan `app/(admin)/dashboard/page.tsx` ada

### Jika Error 500
1. **Cek database connection**: Pastikan Supabase terhubung
2. **Cek user profile**: Pastikan user memiliki role `admin`
3. **Cek middleware**: Pastikan middleware tidak error

### Jika Redirect Loop
1. **Cek user role**: Pastikan role di database adalah `admin`
2. **Cek middleware logic**: Pastikan middleware tidak memblokir admin
3. **Clear browser cache**: Hapus cookies dan cache browser

## File Structure yang Benar
```
app/
├── (admin)/
│   ├── page.tsx                    # /admin (redirect ke dashboard)
│   ├── layout.tsx                  # Admin layout
│   └── dashboard/
│       └── page.tsx                # /admin/dashboard
├── (auth)/
│   ├── login/page.tsx              # /login
│   └── register/page.tsx           # /register
└── page.tsx                        # / (homepage)
```

## Next Steps
1. Login dengan user admin yang sudah dibuat
2. Akses admin dashboard
3. Test fitur admin lainnya (products, orders, dll)
