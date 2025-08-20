@echo off
echo 🚀 Starting deployment process for bpstudio...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: pnpm is not installed. Please install pnpm first.
    echo Install with: npm install -g pnpm
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
pnpm install

echo 🔧 Building the application...
pnpm build

if %errorlevel% neq 0 (
    echo ❌ Build failed. Please fix the errors and try again.
    pause
    exit /b 1
)

echo ✅ Build completed successfully!

echo 🌐 Deploying to Vercel...
vercel --prod

if %errorlevel% neq 0 (
    echo ❌ Vercel deployment failed.
    echo Please make sure you have Vercel CLI installed and are logged in.
    echo Install with: npm i -g vercel
    echo Login with: vercel login
    pause
    exit /b 1
)

echo 🚀 Deployment completed successfully!
echo Your application is now live!
pause
