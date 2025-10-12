#!/bin/bash
# Vercel Deployment Script
# This script helps with Vercel deployment setup

echo "🚀 Setting up Vercel deployment for Susu Baroka..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if project is linked to Vercel
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking project to Vercel..."
    vercel link
fi

# Set environment variables
echo "🔧 Setting up environment variables..."
echo "Please set the following environment variables in Vercel dashboard:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo "SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://your-app-name.vercel.app"
