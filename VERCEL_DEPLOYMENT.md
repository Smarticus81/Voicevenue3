# 🚀 Vercel Agent Deployment Guide

This guide explains how to deploy individual agents using Vercel's deployment apparatus in the background.

## 🔧 Prerequisites

1. **Vercel Account**: Using Smarticus81 account for all deployments
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **Vercel Token**: Generate from Smarticus81 Vercel dashboard → Settings → Tokens

## 📋 Environment Variables

Add these to your `.env.local` and production environment:

```bash
# Vercel Deployment (Smarticus81 Account)
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here
VERCEL_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# OpenAI (for voice pipeline)
OPENAI_API_KEY=your_openai_api_key_here

# Convex (for agent storage)
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
CONVEX_DEPLOYMENT=your_convex_deployment_here

# Clerk (for authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

## 🚀 How It Works

### 1. Agent Creation Flow
1. User creates an agent in the dashboard
2. Agent configuration is saved to Convex database
3. User clicks "Deploy to Vercel" button
4. System generates deployment files and deploys to Vercel

### 2. Background Deployment Process
1. **Convex Action**: `vercelDeploy.createVercelDeployment` handles deployment requests
2. **Vercel SDK**: Uses official `@vercel/sdk` for deployment
3. **File Generation**: Creates complete Next.js application bundle
4. **Agent API**: Each deployed agent gets its own `/api/agent-api` endpoint

### 3. Voice Pipeline
1. **Speech Recognition**: Uses Web Speech API
2. **Processing**: Sends to agent-specific API endpoint
3. **OpenAI Integration**: Uses GPT-4o for responses
4. **Speech Synthesis**: Converts responses to speech

## 🔄 Deployment Types

### PWA Deployment (Recommended)
- **URL**: `https://bevpro-agent-{id}.vercel.app`
- **Features**: Progressive Web App, voice interactions, offline support
- **Use Case**: Standalone agent applications

### Web Embed Deployment
- **URL**: Embed code for existing websites
- **Features**: Floating voice button, modal responses
- **Use Case**: Adding voice agents to existing sites

### API Deployment
- **URL**: REST API endpoints
- **Features**: Programmatic access to agent capabilities
- **Use Case**: Integration with other systems

## 📁 Generated Files

Each deployed agent includes:

```
/
├── package.json        # Next.js dependencies
├── next.config.js      # Next.js configuration
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main agent interface
│   └── api/
│       └── agent-api/  # Serverless function for processing
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 🎯 Agent Configuration

Deployed agents include:

- **Name & Description**: Agent identity
- **Custom Instructions**: Behavior guidelines
- **Voice Configuration**: Speech settings
- **UI Customization**: Visual preferences
- **Generated UI**: Custom interface components

## 🔍 Monitoring & Management

### Deployment Status
- Check deployment status via Vercel dashboard
- Monitor deployment logs in Vercel console
- Track usage and performance metrics
- Use claim link to transfer ownership to end-user's Vercel team

### Agent Management
- Update agent configuration
- Redeploy with new settings
- Monitor voice interaction logs
- Track API usage and costs

## 🛠️ Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check Vercel token validity
   - Verify environment variables
   - Check Vercel account limits

2. **Voice Not Working**
   - Ensure HTTPS (required for speech APIs)
   - Check browser permissions
   - Verify OpenAI API key

3. **Agent Not Responding**
   - Check agent configuration
   - Verify API endpoints
   - Monitor error logs

### Debug Commands

```bash
# Check deployment status
curl "https://api.vercel.com/v1/deployments/{deployment_id}" \
  -H "Authorization: Bearer $VERCEL_TOKEN"

# Test agent API
curl -X POST "https://bevpro-agent-{id}.vercel.app/api/agent-api" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"{id}","message":"Hello"}'

# View deployment logs
vercel logs bevpro-agent-{id}.vercel.app
```

## 📊 Cost Optimization

### Vercel Costs
- **Hobby Plan**: Free tier available
- **Pro Plan**: $20/month for advanced features
- **Enterprise**: Custom pricing

### OpenAI Costs
- **GPT-4o**: ~$0.005 per 1K tokens
- **Voice API**: Additional costs for speech-to-text
- **Monitoring**: Track usage in OpenAI dashboard

## 🔐 Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Rate Limiting**: Implement request throttling
3. **Authentication**: Use Clerk for user management
4. **CORS**: Configure for your domains
5. **Input Validation**: Sanitize all user inputs

## 🚀 Next Steps

1. **Set up Vercel token** in environment variables
2. **Test deployment** with a simple agent
3. **Monitor performance** and usage
4. **Scale up** as needed
5. **Implement monitoring** and alerting

## 📞 Support

For issues with:
- **Vercel Deployment**: Check Vercel documentation
- **Voice Pipeline**: Review OpenAI API docs
- **Agent Configuration**: Check Convex documentation
- **Platform Issues**: Review this guide and error logs
