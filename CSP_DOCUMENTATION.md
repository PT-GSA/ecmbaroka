# 🔒 Content Security Policy (CSP) Configuration

Dokumentasi konfigurasi Content Security Policy untuk website Susu Baroka.

## 📋 Overview

Content Security Policy (CSP) adalah mekanisme keamanan yang membantu mencegah serangan XSS (Cross-Site Scripting) dengan mengontrol sumber daya yang dapat dimuat oleh browser.

## ⚙️ Konfigurasi CSP

### File: `next.config.ts`

```typescript
{
  key: 'Content-Security-Policy', 
  value: "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://baroka.csmigroup.id https://shop.susubaroka.com https://analytics.ahrefs.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://stats.g.doubleclick.net wss://baroka.csmigroup.id; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
}
```

## 🔍 Penjelasan Directive

### 1. `default-src 'self'`
- **Default**: Hanya izinkan sumber daya dari domain yang sama
- **Tujuan**: Baseline keamanan untuk semua sumber daya

### 2. `script-src 'self' 'unsafe-inline' 'unsafe-eval' https:`
- **Scripts**: Izinkan script dari domain sendiri, inline scripts, eval(), dan semua HTTPS
- **Tujuan**: Mendukung Next.js, analytics scripts, dan WebAssembly (WASM)
- **unsafe-eval**: Diperlukan untuk WebAssembly compilation dan beberapa library modern

### 3. `style-src 'self' 'unsafe-inline' https:`
- **Styles**: Izinkan CSS dari domain sendiri, inline styles, dan semua HTTPS
- **Tujuan**: Mendukung Tailwind CSS dan external stylesheets

### 4. `img-src 'self' data: https:`
- **Images**: Izinkan gambar dari domain sendiri, data URLs, dan semua HTTPS
- **Tujuan**: Mendukung Supabase storage dan external images

### 5. `font-src 'self' https:`
- **Fonts**: Izinkan font dari domain sendiri dan semua HTTPS
- **Tujuan**: Mendukung Google Fonts dan external fonts

### 6. `connect-src` (Yang Diperbaiki)
- **Connections**: Izinkan koneksi ke berbagai services
- **Services yang Diizinkan**:
  - `'self'` - Domain sendiri
  - `https://baroka.csmigroup.id` - Supabase backend
  - `https://shop.susubaroka.com` - Shop domain
  - `https://analytics.ahrefs.com` - Ahrefs Analytics
  - `https://www.google-analytics.com` - Google Analytics
  - `https://analytics.google.com` - Google Analytics
  - `https://www.googletagmanager.com` - Google Tag Manager
  - `https://connect.facebook.net` - Facebook Pixel
  - `https://www.facebook.com` - Facebook
  - `https://stats.g.doubleclick.net` - Google Ads
  - `wss://baroka.csmigroup.id` - WebSocket untuk Supabase

### 7. `frame-ancestors 'none'`
- **Frames**: Tidak izinkan website di-embed dalam iframe
- **Tujuan**: Mencegah clickjacking attacks

### 8. `base-uri 'self'`
- **Base URI**: Hanya izinkan base URI dari domain sendiri
- **Tujuan**: Mencegah injection attacks

### 9. `form-action 'self'`
- **Form Actions**: Hanya izinkan form submit ke domain sendiri
- **Tujuan**: Mencegah form hijacking

## 🚨 Masalah yang Diperbaiki

### Error Sebelumnya:
```
Refused to connect to 'https://analytics.ahrefs.com/api/event' because it violates the following Content Security Policy directive: "connect-src 'self' https://baroka.csmigroup.id https://shop.susubaroka.com wss://baroka.csmigroup.id".
```

### Solusi:
Menambahkan domain analytics ke `connect-src` directive:
- `https://analytics.ahrefs.com`
- `https://www.google-analytics.com`
- `https://analytics.google.com`
- `https://www.googletagmanager.com`
- `https://connect.facebook.net`
- `https://www.facebook.com`
- `https://stats.g.doubleclick.net`

## 🔧 Issues yang Diperbaiki

### 1. WebAssembly Error (2024-12-19)
**Error**: 
```
CompileError: WebAssembly.instantiate(): Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script
```

**Solusi**: 
- Menambahkan `'unsafe-eval'` ke `script-src` directive
- Diperlukan untuk WebAssembly compilation dan library modern
- Memungkinkan Next.js Turbopack dan WASM modules berfungsi

**Konfigurasi**:
```typescript
script-src 'self' 'unsafe-inline' 'unsafe-eval' https:
```

### 2. Analytics Connection Error (2024-12-19)
**Error**: 
```
Refused to connect to 'https://analytics.ahrefs.com/api/event' because it violates CSP directive
```

**Solusi**: 
- Menambahkan analytics domains ke `connect-src` directive
- Mendukung Ahrefs, Google Analytics, Facebook Pixel
- Memungkinkan analytics tracking berfungsi

**Domains yang Ditambahkan**:
- `https://analytics.ahrefs.com`
- `https://www.google-analytics.com`
- `https://analytics.google.com`
- `https://www.googletagmanager.com`
- `https://connect.facebook.net`
- `https://www.facebook.com`
- `https://stats.g.doubleclick.net`

## 📊 Analytics Services yang Didukung

### 1. Ahrefs Analytics
- **Domain**: `https://analytics.ahrefs.com`
- **Purpose**: SEO analytics dan tracking
- **Usage**: Website performance monitoring

### 2. Google Analytics
- **Domains**: 
  - `https://www.google-analytics.com`
  - `https://analytics.google.com`
- **Purpose**: Website analytics dan user behavior
- **Usage**: Traffic analysis dan conversion tracking

### 3. Google Tag Manager
- **Domain**: `https://www.googletagmanager.com`
- **Purpose**: Tag management dan analytics
- **Usage**: Centralized tag management

### 4. Facebook Pixel
- **Domains**:
  - `https://connect.facebook.net`
  - `https://www.facebook.com`
- **Purpose**: Facebook advertising dan conversion tracking
- **Usage**: Social media marketing

### 5. Google Ads
- **Domain**: `https://stats.g.doubleclick.net`
- **Purpose**: Google Ads conversion tracking
- **Usage**: Paid advertising analytics

## 🔧 Cara Menambah Analytics Service Baru

### Langkah 1: Identifikasi Domain
Tentukan domain yang digunakan oleh analytics service:
```bash
# Contoh untuk service baru
https://analytics.newservice.com
```

### Langkah 2: Update CSP
Tambahkan domain ke `connect-src` directive di `next.config.ts`:
```typescript
connect-src 'self' https://baroka.csmigroup.id https://shop.susubaroka.com https://analytics.ahrefs.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://stats.g.doubleclick.net https://analytics.newservice.com wss://baroka.csmigroup.id
```

### Langkah 3: Restart Server
```bash
bun run dev
```

### Langkah 4: Test
Cek apakah error CSP sudah hilang di browser console.

## 🛡️ Keamanan CSP

### Keuntungan:
- **XSS Protection**: Mencegah Cross-Site Scripting attacks
- **Data Injection Prevention**: Mencegah injection attacks
- **Resource Control**: Kontrol sumber daya yang dapat dimuat
- **Clickjacking Protection**: Mencegah clickjacking dengan frame-ancestors

### Trade-offs:
- **Development Complexity**: Perlu konfigurasi untuk setiap external service
- **Third-party Integration**: Perlu whitelist untuk setiap analytics service
- **Debugging**: Error CSP bisa sulit di-debug

## 📝 Best Practices

### 1. Minimal Permissions
- Hanya izinkan domain yang benar-benar diperlukan
- Hindari `'unsafe-inline'` jika memungkinkan
- Gunakan nonce atau hash untuk inline scripts

### 2. Regular Review
- Review CSP secara berkala
- Hapus domain yang tidak digunakan
- Update untuk service baru

### 3. Testing
- Test CSP di development environment
- Monitor browser console untuk error CSP
- Test semua analytics services

### 4. Documentation
- Dokumentasikan setiap domain yang diizinkan
- Jelaskan tujuan setiap directive
- Update dokumentasi saat ada perubahan

## 🚀 Deployment

### Development:
```bash
bun run dev
```

### Production:
```bash
bun run build
bun run start
```

### Vercel:
CSP akan otomatis diterapkan saat deploy ke Vercel.

## 🔍 Monitoring

### Browser Console:
Monitor browser console untuk error CSP:
```
Refused to connect to 'https://domain.com' because it violates CSP directive
```

### Analytics Dashboard:
Pastikan semua analytics services berfungsi normal setelah update CSP.

## 📞 Support

Jika mengalami masalah dengan CSP:
1. Cek browser console untuk error CSP
2. Identifikasi domain yang diblokir
3. Tambahkan domain ke `connect-src` directive
4. Restart development server
5. Test kembali

---

**CSP Configuration** - Keamanan website dengan Content Security Policy yang tepat! 🔒🛡️
