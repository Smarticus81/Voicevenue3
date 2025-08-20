# 🔧 Vercel Setup for Smarticus81 Account

## Quick Setup Guide

### 1. Get Your Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Sign in with your Smarticus81 account
3. Go to **Settings** → **Tokens**
4. Click **Create Token**
5. Name it: `Bevpro Studio Deployment Token`
6. Set expiration to **No Expiration**
7. Copy the token

### 2. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Vercel Deployment (Smarticus81 Account)
VERCEL_TOKEN=your_copied_token_here
VERCEL_TEAM_ID=your_team_id_here
VERCEL_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APP_URL=https://your-main-app.vercel.app
```

### 3. Get Team ID (Optional)

If you want to deploy to a specific team:

1. Go to Vercel Dashboard
2. Select your team
3. Copy the team ID from the URL: `https://vercel.com/teams/[TEAM_ID]/projects`

### 4. Test Deployment

Once configured, all agent deployments will be created under your Smarticus81 account with URLs like:
- `https://bevpro-agent-{agentId}.vercel.app`

### 5. Monitor Deployments

- View all deployments in your [Vercel Dashboard](https://vercel.com/dashboard)
- All agent deployments will be prefixed with `bevpro-agent-`
- You can manage, update, or delete deployments from the dashboard

## Security Notes

- Keep your Vercel token secure
- Never commit it to version control
- Use environment variables for all sensitive data
- Consider using Vercel's team features for better organization

## Support

If you encounter any issues:
1. Check Vercel dashboard for deployment status
2. Verify your token has the correct permissions
3. Ensure your account has sufficient deployment limits
