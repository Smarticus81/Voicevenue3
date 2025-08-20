# 🚀 Quick Deploy Guide

## Immediate Deployment Steps

### 1. Fix the Current Issue
The UI generation is failing because of missing description. I've already fixed this in the API route.

### 2. Test Locally First
```bash
# Test the build
pnpm build

# If successful, test the app
pnpm start
```

### 3. Deploy to Production

#### Option A: One-Command Deploy (Recommended)
```bash
pnpm deploy:build
```

#### Option B: Step-by-Step Deploy
```bash
# 1. Build the app
pnpm build

# 2. Deploy Convex database to production
pnpm convex:deploy:prod

# 3. Deploy to Vercel
pnpm deploy:vercel
```

#### Option C: Use Deployment Scripts
```bash
# On Windows
deploy.bat

# On Mac/Linux
chmod +x deploy.sh
./deploy.sh
```

## 🔑 Required Environment Variables

Make sure these are set in your production environment:

- `V0_API_KEY` - Your V0 API key
- `OPENAI_API_KEY` - Your OpenAI API key  
- `NEXT_PUBLIC_OPENAI_API_KEY` - Your OpenAI API key (public)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk public key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex URL
- `CONVEX_DEPLOYMENT` - Your Convex deployment

## 🚨 If Deployment Fails

1. **Check Build Errors**: `pnpm build`
2. **Check Environment Variables**: Ensure all required vars are set
3. **Check API Keys**: Verify keys are valid and have proper permissions
4. **Check Convex**: `pnpm convex:deploy:prod`
5. **Check Vercel**: `vercel --prod`

## 📱 After Deployment

1. Test the live URL
2. Verify authentication works
3. Test voice functionality
4. Check UI generation
5. Monitor for errors

## 🆘 Need Help?

- Check the full `DEPLOYMENT.md` guide
- Review console logs for errors
- Ensure all prerequisites are met
- Verify API service status
