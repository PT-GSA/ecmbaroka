# Susu Baroka - Website Preorder Susu

Website preorder Susu Steril dengan Next.js, Bun, dan Supabase. Fitur lengkap untuk customer dan admin dengan sistem pembayaran manual dan pengiriman manual.

## 🚀 Fitur Utama

### Customer Side
- ✅ Browse produk susu dengan gambar dan detail
- ✅ Sistem keranjang belanja
- ✅ Checkout dengan data pengiriman
- ✅ Upload bukti transfer bank
- ✅ Tracking status pesanan
- ✅ Manajemen profil user

### Admin Side
- ✅ Dashboard dengan statistik
- ✅ Kelola produk (CRUD)
- ✅ Kelola pesanan customer
- ✅ Verifikasi pembayaran manual
- ✅ Update status pengiriman
- ✅ Manajemen user

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Runtime**: Bun
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **UI Components**: Radix UI, Lucide React
- **Deployment**: Vercel ready

## 📋 Prerequisites

- Node.js 18+ atau Bun
- Akun Supabase
- Git

## 🚀 Setup & Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd ecmbaroka
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Buka SQL Editor di dashboard Supabase
3. Jalankan script SQL dari file `supabase-schema.sql`
4. Buat storage buckets:
   - `products` (public)
   - `payment-proofs` (private)

### 4. Environment Variables

Copy file `env.example` menjadi `.env.local`:

```bash
cp env.example .env.local
```

Isi dengan data Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Setup Admin User

1. Daftar user baru di Supabase Auth
2. Update role menjadi admin di database:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = 'your-user-id';
```

### 6. Run Development Server

```bash
bun dev
```

Website akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
/app
  /(auth)           # Halaman login/register
  /(customer)       # Halaman customer
  /(admin)          # Halaman admin
  /api              # API routes
/components
  /ui               # Reusable UI components
  /customer         # Customer-specific components
  /admin            # Admin-specific components
/lib
  /supabase         # Supabase client & helpers
  /utils            # Utility functions
/types              # TypeScript types
```

## 🔐 Authentication Flow

1. **Customer**: Register → Login → Browse → Cart → Checkout → Upload Payment → Track Order
2. **Admin**: Login → Dashboard → Manage Products → Verify Payments → Update Order Status

## 💳 Payment Flow

1. Customer checkout dengan data pengiriman
2. Customer transfer ke rekening bank
3. Customer upload bukti transfer
4. Admin verifikasi pembayaran
5. Admin update status pesanan
6. Admin kirim barang
7. Customer terima barang

## 🗄 Database Schema

### Tables
- `user_profiles` - Profile user dengan role
- `products` - Produk susu
- `orders` - Pesanan customer
- `order_items` - Item dalam pesanan
- `payments` - Bukti pembayaran

### Storage Buckets
- `products` - Gambar produk (public)
- `payment-proofs` - Bukti transfer (private)

## 🚀 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

### Manual Deployment

```bash
bun build
bun start
```

## 🔧 Development

### Available Scripts

```bash
bun dev          # Development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

### Code Style

- TypeScript untuk type safety
- Tailwind CSS untuk styling
- Radix UI untuk accessible components
- ESLint untuk code quality

## 📱 Responsive Design

Website fully responsive untuk:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔒 Security Features

- Row Level Security (RLS) di Supabase
- Protected routes dengan middleware
- Role-based access control
- Secure file upload
- Input validation

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check environment variables
   - Verify Supabase project URL

2. **Authentication Issues**
   - Check RLS policies
   - Verify user profile exists

3. **File Upload Issues**
   - Check storage bucket permissions
   - Verify file size limits

4. **Build Errors**
   - Run `bun install` again
   - Check TypeScript errors

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: support@susubaroka.com
- GitHub Issues: [Repository Issues]

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**Susu Baroka** - Susu Steril berkualitas tinggi untuk keluarga Indonesia 🇮🇩