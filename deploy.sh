#!/bin/bash

echo "🚀 Starting deployment process for bpstudio..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed. Please install pnpm first."
    echo "Install with: npm install -g pnpm"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Building the application..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

echo "🌐 Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Vercel deployment failed."
    echo "Please make sure you have Vercel CLI installed and are logged in."
    echo "Install with: npm i -g vercel"
    echo "Login with: vercel login"
    exit 1
fi

echo "🚀 Deployment completed successfully!"
echo "Your application is now live!"
