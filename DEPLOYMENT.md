# 🚀 Deployment Guide for bpstudio

This guide will walk you through deploying your bpstudio application to production.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Vercel CLI](https://vercel.com/cli) (for Vercel deployment)
- [Convex CLI](https://docs.convex.dev/cli) (for database deployment)

## 🔧 Pre-Deployment Setup

### 1. Install Dependencies

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Environment Variables

Copy your `.env.local` file to `.env.production` and update with production values:

```bash
cp .env.local .env.production
```

**Required Production Environment Variables:**

- `NEXT_PUBLIC_CONVEX_URL` - Your production Convex URL
- `CONVEX_DEPLOYMENT` - Your production Convex deployment
- `V0_API_KEY` - Your production V0 API key
- `OPENAI_API_KEY` - Your production OpenAI API key
- `NEXT_PUBLIC_OPENAI_API_KEY` - Your production OpenAI API key (public)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your production Clerk public key
- `CLERK_SECRET_KEY` - Your production Clerk secret key

### 3. Deploy Convex Database

```bash
# Deploy to production
pnpm convex deploy --prod

# Or if you want to create a new production deployment
pnpm convex deploy --prod --create
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Automatic Deployment (GitHub Integration)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Vercel will automatically deploy on every push

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Railway

1. Install [Railway CLI](https://railway.app/cli)
2. Login: `railway login`
3. Deploy: `railway up`

### Option 3: Netlify

1. Install [Netlify CLI](https://netlify.com/cli)
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`

### Option 4: Self-Hosted

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🔍 Pre-Deployment Checklist

- [ ] All environment variables are set
- [ ] Convex database is deployed to production
- [ ] API keys are valid and have proper permissions
- [ ] Clerk authentication is configured for production
- [ ] Application builds successfully (`pnpm build`)
- [ ] All tests pass (if applicable)
- [ ] Database schema is up to date

## 🧪 Testing Before Deployment

```bash
# Test the build locally
pnpm build

# Test production build locally
pnpm start

# Test environment variables
node -e "console.log('Environment check:', process.env.NODE_ENV)"
```

## 🚨 Common Deployment Issues

### 1. Build Failures

```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

### 2. Environment Variable Issues

- Ensure all required variables are set
- Check for typos in variable names
- Verify API keys are valid

### 3. Database Connection Issues

```bash
# Check Convex deployment status
pnpm convex dev --prod

# Redeploy if needed
pnpm convex deploy --prod
```

### 4. API Rate Limits

- Check OpenAI API usage
- Verify V0 API key limits
- Monitor Clerk authentication limits

## 📊 Post-Deployment

### 1. Verify Deployment

- Check all pages load correctly
- Test authentication flow
- Verify API endpoints work
- Test voice functionality

### 2. Monitor Performance

- Use Vercel Analytics (if using Vercel)
- Monitor Convex database performance
- Check API response times

### 3. Set Up Monitoring

- Error tracking (Sentry, LogRocket)
- Performance monitoring
- Uptime monitoring

## 🔄 Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm build
      - run: pnpm convex deploy --prod
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🆘 Support

If you encounter issues during deployment:

1. Check the console logs for errors
2. Verify all environment variables are set
3. Ensure API keys are valid
4. Check the deployment platform's status page
5. Review the application logs

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Convex Deployment](https://docs.convex.dev/deploy)
- [Clerk Deployment](https://clerk.com/docs/deployments)
