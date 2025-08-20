# Vercel Deployment Setup for BPStudio PWA Platform

## Overview
This guide explains how to set up Vercel deployment for the BPStudio PWA platform where each user's agent gets deployed as a separate PWA application.

## Architecture
- **Vercel Account**: Smarticus81
- **Team**: BPStudio  
- **Deployment Method**: Dynamic project creation via Vercel API
- **Template**: Single base project that gets cloned for each agent

## Step 1: Create Template Project

### Option A: Create Empty Project (Recommended)
1. Go to Vercel Dashboard → BPStudio team
2. Click "New Project"
3. Choose "Create Git Repository" → "Import Third-Party Git Repository"
4. Use this template: `https://github.com/vercel/nextjs-starter`
5. Name it: `bpstudio-pwa-template`
6. Deploy it

### Option B: Use Existing Repository
1. Create a minimal Next.js repo on GitHub
2. Import it to Vercel under BPStudio team
3. This becomes your template

## Step 2: Get Required Credentials

### Get Vercel Token
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token with name: `BPStudio-PWA-Deployment`
3. Copy the token

### Get Project ID
1. Go to your template project in Vercel
2. Copy the Project ID from the URL or settings

### Get Team ID
1. Go to BPStudio team settings
2. Copy the Team ID (should be `team_BPStudio`)

## Step 3: Update Environment Variables

```bash
# .env.local
VERCEL_TOKEN=your_actual_token_here
VERCEL_TEAM_ID=team_BPStudio
VERCEL_PROJECT_ID=your_template_project_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: How Deployment Works

### Current Implementation
The `convex/vercelDeploy.ts` function:
1. Generates a complete Next.js application bundle
2. Creates a new deployment using Vercel API
3. Each agent gets its own URL: `https://agent-name.vercel.app`

### Deployment Flow
1. User creates agent in BPStudio
2. System generates agent-specific Next.js app
3. Vercel API creates new deployment
4. User gets PWA URL for their agent

## Step 5: API Deployment vs Git Deployment

### Why Not Git?
- Users don't have their own GitHub repos
- You're generating apps dynamically
- Need instant deployment without Git workflow

### Vercel API Approach
- Create deployments programmatically
- Upload files directly via API
- No Git repository required
- Perfect for your use case

## Step 6: Testing Deployment

1. Set up environment variables
2. Create an agent in BPStudio
3. Deploy to Vercel
4. Verify PWA functionality

## Troubleshooting

### Common Issues
- **Invalid Token**: Ensure Vercel token has proper permissions
- **Team Access**: Verify team ID is correct
- **Project ID**: Use template project ID, not individual agent IDs

### Permissions Required
- `projects:read`
- `deployments:write`
- `team:read`

## Next Steps
1. Create template project in Vercel
2. Update environment variables
3. Test deployment flow
4. Monitor usage and costs
