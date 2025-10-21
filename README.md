# Susu Baroka - Website Preorder Susu

Website order Susu Steril dengan Next.js, Bun, dan Supabase. Fitur lengkap untuk customer, admin, dan affiliate dengan sistem pembayaran manual, pengiriman manual, dan program affiliate marketing.

## 🚀 Fitur Utama

### Customer Side
- ✅ Browse produk susu dengan gambar dan detail
- ✅ Sistem keranjang belanja
- ✅ Checkout dengan data pengiriman
- ✅ Upload bukti transfer bank
- ✅ Tracking status pesanan
- ✅ Manajemen profil user

### Admin Side
- ✅ Dashboard dengan statistik lengkap
- ✅ Kelola produk (CRUD) dengan media manager
- ✅ Kelola pesanan customer
- ✅ Verifikasi pembayaran manual
- ✅ Update status pengiriman
- ✅ Manajemen user dan affiliate
- ✅ Kelola withdrawal affiliate
- ✅ Notifikasi real-time
- ✅ Laporan dan analytics

### Affiliate Side
- ✅ Dashboard affiliate dengan statistik komisi
- ✅ Buat dan kelola link referral (CRUD)
- ✅ Tracking klik dan konversi
- ✅ Riwayat komisi dan withdrawal
- ✅ Request withdrawal dengan validasi bank
- ✅ Analytics dan laporan performa
- ✅ Manajemen campaign dan slug custom

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
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
3. Jalankan script SQL dari file `migrate/supabase-schema.sql`
4. Jalankan script affiliate schema:
   - `migrate/add-affiliate-schema.sql`
   - `migrate/add-affiliate-commission.sql`
   - `migrate/add-affiliate-link-to-orders.sql`
   - `migrate/affiliate-withdrawal-schema-simple.sql`
   - `migrate/affiliate-withdrawal-rls-policies-fixed.sql`
5. Buat storage buckets:
   - `products` (public)
   - `payment-proofs` (private)

### 4. Environment Variables

Copy file `env.example` menjadi `.env.local`:

```bash
cp env.example .env.local
```

Isi dengan data Supabase Anda:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Email Configuration (untuk notifikasi)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 5. Setup Admin User

1. Daftar user baru di Supabase Auth
2. Update role menjadi admin di database:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = 'your-user-id';
```

### 6. Setup Affiliate (Optional)

1. Daftar user baru sebagai affiliate
2. Update role menjadi affiliate di database:

```sql
UPDATE user_profiles 
SET role = 'affiliate' 
WHERE id = 'your-user-id';

-- Insert affiliate data
INSERT INTO affiliates (user_id, name, email, code, status)
VALUES ('your-user-id', 'Nama Affiliate', 'email@example.com', 'AFF001', 'active');
```

### 7. Run Development Server

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
  /affiliate        # Halaman affiliate
  /admin-auth       # Halaman login admin
  /api              # API routes
    /admin          # API admin
    /affiliate      # API affiliate
    /customer       # API customer
/components
  /ui               # Reusable UI components
  /customer         # Customer-specific components
  /admin            # Admin-specific components
  /affiliate        # Affiliate-specific components
/lib
  /supabase         # Supabase client & helpers
  /utils            # Utility functions
/types              # TypeScript types
/migrate            # Database migration scripts
```

## 🔐 Authentication Flow

1. **Customer**: Register → Login → Browse → Cart → Checkout → Upload Payment → Track Order
2. **Admin**: Login → Dashboard → Manage Products → Verify Payments → Update Order Status → Manage Affiliates
3. **Affiliate**: Register → Apply → Admin Approval → Create Links → Track Performance → Request Withdrawal

## 💳 Payment Flow

1. Customer checkout dengan data pengiriman
2. Customer transfer ke rekening bank
3. Customer upload bukti transfer
4. Admin verifikasi pembayaran
5. Admin update status pesanan
6. Admin kirim barang
7. Customer terima barang

## 💰 Affiliate Flow

1. User mendaftar sebagai affiliate
2. Admin approve aplikasi affiliate
3. Affiliate buat link referral dengan campaign
4. Affiliate share link ke audiens
5. Customer klik link dan melakukan pembelian
6. Sistem tracking klik dan konversi
7. Komisi otomatis terhitung
8. Affiliate request withdrawal
9. Admin approve dan transfer komisi

## 🗄 Database Schema

### Tables
- `user_profiles` - Profile user dengan role (customer, admin, affiliate)
- `products` - Produk susu dengan rating dan testimonial
- `orders` - Pesanan customer dengan tracking affiliate
- `order_items` - Item dalam pesanan
- `payments` - Bukti pembayaran
- `affiliates` - Data affiliate dan komisi
- `affiliate_links` - Link referral dengan campaign
- `affiliate_clicks` - Tracking klik dan konversi
- `affiliate_withdrawals` - Request withdrawal affiliate
- `notifications` - Notifikasi sistem

### Storage Buckets
- `products` - Gambar produk (public)
- `payment-proofs` - Bukti transfer (private)

### Key Features
- **Row Level Security (RLS)** - Setiap user hanya bisa akses data mereka
- **Real-time Updates** - Notifikasi dan status update real-time
- **Commission Tracking** - Otomatis hitung komisi affiliate
- **Withdrawal System** - Sistem request dan approve withdrawal
- **Link Management** - CRUD link referral dengan slug custom

## 🔌 API Endpoints

### Customer API
- `GET /api/customer/orders` - Get customer orders
- `POST /api/customer/orders` - Create new order
- `PUT /api/customer/orders/[id]` - Update order
- `POST /api/customer/payments` - Upload payment proof

### Admin API
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/[id]` - Update order status
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `GET /api/admin/withdrawals` - Get affiliate withdrawals
- `PUT /api/admin/withdrawals` - Update withdrawal status
- `GET /api/admin/notifications` - Get admin notifications
- `POST /api/admin/notifications` - Create notification

### Affiliate API
- `GET /api/affiliate/links` - Get affiliate links
- `POST /api/affiliate/links` - Create affiliate link
- `PUT /api/affiliate/links/[id]` - Update affiliate link
- `DELETE /api/affiliate/links/[id]` - Delete affiliate link
- `GET /api/affiliate/withdrawals` - Get withdrawal history
- `POST /api/affiliate/withdrawals` - Request withdrawal
- `GET /api/affiliate/track` - Track affiliate clicks

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
bun type-check   # Run TypeScript type checking
```

### Testing

```bash
# Test API endpoints
curl -X GET http://localhost:3000/api/affiliate/links
curl -X GET http://localhost:3000/api/admin/withdrawals
curl -X GET http://localhost:3000/api/customer/orders

# Test affiliate tracking
curl -X GET "http://localhost:3000/api/affiliate/track?slug=test-campaign"
```

### Development Tips

1. **Database Changes**: Gunakan file di folder `migrate/` untuk schema changes
2. **Type Safety**: Selalu update `types/database.ts` setelah schema changes
3. **RLS Policies**: Test RLS policies dengan user berbeda
4. **Commission Testing**: Test komisi calculation dengan order dummy
5. **Link Tracking**: Test affiliate link tracking dengan berbagai campaign

### Code Style

- TypeScript untuk type safety
- Tailwind CSS untuk styling
- Radix UI untuk accessible components
- ESLint untuk code quality

## 💼 Affiliate Program Features

### Commission System
- **Automatic Calculation** - Komisi otomatis terhitung saat order completed
- **Flexible Rates** - Admin bisa set rate komisi per produk
- **Real-time Tracking** - Update komisi real-time
- **Withdrawal Management** - Sistem request dan approve withdrawal

### Link Management
- **Custom Campaigns** - Buat campaign dengan nama custom
- **Slug Generation** - Auto-generate atau custom slug
- **Link Analytics** - Track klik, konversi, dan performa
- **CRUD Operations** - Create, Read, Update, Delete links

### Dashboard Features
- **Commission Overview** - Total komisi dan pending
- **Performance Metrics** - Klik, konversi, dan revenue
- **Withdrawal History** - Riwayat request dan status
- **Link Performance** - Statistik per campaign

## 📊 Performance & Monitoring

### Performance Features
- **Next.js 14 App Router** - Optimized routing dan rendering
- **Image Optimization** - Automatic image optimization
- **Code Splitting** - Automatic code splitting per route
- **Static Generation** - Pre-generated static pages
- **Edge Functions** - Serverless functions untuk API

### Monitoring & Analytics
- **Real-time Tracking** - Affiliate link clicks dan conversions
- **Commission Analytics** - Real-time commission calculations
- **Order Analytics** - Order status dan performance metrics
- **User Analytics** - User behavior dan engagement
- **Error Tracking** - Comprehensive error logging

### Database Performance
- **Indexed Queries** - Optimized database queries
- **RLS Optimization** - Efficient Row Level Security
- **Connection Pooling** - Supabase connection pooling
- **Query Optimization** - Optimized affiliate tracking queries

## 📱 Responsive Design

Website fully responsive untuk:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

### Mobile-First Features
- **Touch-friendly UI** - Optimized untuk mobile interaction
- **Responsive Tables** - Tables yang mobile-friendly
- **Mobile Navigation** - Hamburger menu untuk mobile
- **Touch Gestures** - Swipe dan touch gestures support

## 🔒 Security Features

- **Row Level Security (RLS)** - Setiap user hanya bisa akses data mereka
- **Protected routes** - Middleware untuk proteksi halaman
- **Role-based access control** - Customer, Admin, Affiliate
- **Secure file upload** - Validasi dan sanitasi file
- **Input validation** - Validasi semua input user
- **Commission security** - Validasi komisi dan withdrawal
- **Link tracking security** - Proteksi dari click fraud

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

5. **Affiliate Issues**
   - Check affiliate status is 'active'
   - Verify RLS policies for affiliate tables
   - Check commission calculation logic

6. **Withdrawal Issues**
   - Verify minimum withdrawal amount
   - Check bank account validation
   - Ensure admin approval workflow

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: support@susubaroka.com
- GitHub Issues: [Repository Issues]

## 📚 Resources & Tutorials

### Tutorial Lengkap:
- **[Tutorial Affiliate](AFFILIATE_TUTORIAL.md)** - Panduan lengkap untuk affiliate marketer
- **[Admin Guide](ADMIN_AFFILIATE_GUIDE.md)** - Panduan admin mengelola program affiliate
- **[Customer Guide](CUSTOMER_AFFILIATE_GUIDE.md)** - Panduan customer menggunakan link referral
- **[CSP Documentation](CSP_DOCUMENTATION.md)** - Dokumentasi Content Security Policy

### E-book Gratis:
- "Panduan Nutrisi untuk Keluarga"
- "Tips Memilih Susu yang Tepat"
- "Resep Olahan Susu Sehat"

### Video Tutorial:
- "Cara Memesan Susu Baroka"
- "Tips Berbelanja Online"
- "Cara Menggunakan Link Referral"

### Blog Artikel:
- "Manfaat Susu Steril untuk Keluarga"
- "Tips Menyimpan Susu dengan Benar"
- "Resep Minuman Sehat dengan Susu"

## 📈 Changelog & Roadmap

### ✅ Completed Features (v1.0.0)
- ✅ Customer order management system
- ✅ Admin dashboard dan product management
- ✅ Payment verification system
- ✅ Affiliate program dengan commission tracking
- ✅ Link management dengan CRUD operations
- ✅ Withdrawal system untuk affiliate
- ✅ Real-time notifications
- ✅ Responsive design untuk semua device
- ✅ Row Level Security (RLS) implementation
- ✅ TypeScript type safety

### 🚧 Planned Features (v1.1.0)
- 🔄 Email notifications system
- 🔄 Advanced analytics dashboard
- 🔄 Bulk operations untuk admin
- 🔄 Affiliate tier system
- 🔄 Automated commission calculations
- 🔄 Mobile app (React Native)
- 🔄 Multi-language support
- 🔄 Advanced reporting system

### 🎯 Future Roadmap (v2.0.0)
- 🎯 AI-powered product recommendations
- 🎯 Advanced affiliate marketing tools
- 🎯 Integration dengan payment gateways
- 🎯 Inventory management system
- 🎯 Customer loyalty program
- 🎯 Advanced analytics dengan machine learning

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