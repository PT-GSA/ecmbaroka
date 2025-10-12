# Vercel Deployment Guide

## 🚀 Deploy Susu Baroka ke Vercel

### Prerequisites
- Vercel account
- Supabase project
- Bun installed locally

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Project
```bash
vercel link
```

### 4. Set Environment Variables
Set the following environment variables in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. Deploy
```bash
# Deploy to production
bun run deploy

# Or use Vercel CLI directly
vercel --prod
```

### 6. Preview Deployment
```bash
bun run preview
```

## 📁 Configuration Files

- `vercel.json` - Vercel configuration
- `next.config.ts` - Next.js configuration optimized for Vercel
- `deploy-vercel.sh` - Deployment script
- `vercel-env.example` - Environment variables template

## 🔧 Build Settings

- **Framework**: Next.js
- **Build Command**: `bun run vercel-build`
- **Output Directory**: `.next`
- **Install Command**: `bun install`
- **Node Version**: 18.x
- **Region**: Singapore (sin1)

## 🛡️ Security Headers

The configuration includes security headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## 📊 Performance Optimizations

- Compression enabled
- Package imports optimized
- Static generation enabled
- Powered by header disabled

## 🌐 Custom Domain

To add a custom domain:
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your domain
5. Update DNS records as instructed

## 🔄 Automatic Deployments

Connect your GitHub repository to Vercel for automatic deployments:
1. Go to Vercel dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings
5. Deploy automatically on every push
