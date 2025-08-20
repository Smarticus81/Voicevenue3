# 🚀 Smarticus81 Vercel Deployment Setup

This guide explains how to configure Smarticus81 as the default Vercel deployment account for all agent deployments.

## 🔧 Prerequisites

1. **Smarticus81 Vercel Account**: Access to the Smarticus81 Vercel dashboard
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **Vercel Token**: Generate from Smarticus81 Vercel dashboard

## 📋 Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Vercel Deployment (Smarticus81 Account)
VERCEL_TOKEN=your_smarticus81_vercel_token_here
VERCEL_TEAM_ID=team_smarticus81
VERCEL_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🔑 Getting Vercel Token

1. **Login to Smarticus81 Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Login with Smarticus81 credentials

2. **Generate Token**
   - Go to Settings → Tokens
   - Click "Create Token"
   - Name: `BevPro Agent Deployments`
   - Scope: Full Account
   - Copy the token

3. **Add to Environment**
   ```bash
   VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## 🏢 Team Configuration

The system is configured to use `team_smarticus81` as the default team ID. This ensures all deployments are created under the Smarticus81 account.

## 📦 Deployment Process

### 1. Agent Creation
When a user creates an agent:
- Agent configuration is saved to Convex
- User clicks "Deploy to Vercel"
- System generates deployment files

### 2. Vercel Deployment
The system will:
- Use Smarticus81 Vercel token
- Create deployment under `team_smarticus81`
- Generate unique URL: `https://bevpro-agent-{id}-{timestamp}.vercel.app`
- Apply custom branding and configuration

### 3. Generated Files
Each deployment includes:
- Complete Next.js application
- Agent-specific configuration
- Custom branding and colors
- PWA manifest
- Voice interface components

## 🎨 Customization Features

### Branding
- Custom colors from agent configuration
- Agent name and logo
- Theme colors for PWA

### Voice Interface
- Wake word configuration
- Voice provider settings
- Custom instructions

### PWA Features
- Install prompts
- Offline support
- Mobile-optimized interface

## 🔍 Monitoring

### Deployment Status
- Check deployments in Smarticus81 Vercel dashboard
- Monitor usage and performance
- Track deployment logs

### Agent Management
- All agents deployed under Smarticus81 account
- Centralized management and monitoring
- Easy access to deployment settings

## 🚀 Benefits

### For Users
- **Reliable Hosting**: Professional Vercel infrastructure
- **Fast Deployments**: Optimized build process
- **Custom Domains**: Optional custom domain support
- **PWA Support**: Full progressive web app capabilities

### For Smarticus81
- **Centralized Control**: All deployments in one account
- **Usage Monitoring**: Track all agent deployments
- **Cost Management**: Single billing for all deployments
- **Quality Control**: Consistent deployment standards

## 🔐 Security

### Token Security
- Store VERCEL_TOKEN securely
- Never commit tokens to version control
- Use environment variables only

### Access Control
- All deployments under Smarticus81 control
- Users can claim deployments to their own accounts
- Maintains security while allowing flexibility

## 📊 Cost Management

### Vercel Costs
- **Hobby Plan**: Free tier for development
- **Pro Plan**: $20/month for production deployments
- **Enterprise**: Custom pricing for large scale

### Optimization
- Monitor deployment usage
- Optimize build times
- Track bandwidth usage

## 🛠️ Troubleshooting

### Common Issues

1. **Token Invalid**
   - Regenerate Vercel token
   - Check token permissions
   - Verify account access

2. **Deployment Fails**
   - Check Vercel account limits
   - Verify environment variables
   - Check build logs

3. **Team Access Issues**
   - Verify team_smarticus81 exists
   - Check team permissions
   - Ensure proper access rights

### Debug Commands

```bash
# Test Vercel connection
vercel whoami

# List deployments
vercel ls

# Check team access
vercel teams ls
```

## 📞 Support

For issues with:
- **Vercel Deployment**: Check Vercel documentation
- **Smarticus81 Account**: Contact account administrator
- **Agent Configuration**: Review deployment logs
- **Platform Issues**: Check error logs and documentation

## 🎯 Next Steps

1. **Set up Vercel token** in environment variables
2. **Test deployment** with a simple agent
3. **Monitor performance** and usage
4. **Scale up** as needed
5. **Implement monitoring** and alerting

---

**Note**: All agent deployments will now use the Smarticus81 Vercel account by default, providing reliable hosting and centralized management for all BevPro agent deployments.
