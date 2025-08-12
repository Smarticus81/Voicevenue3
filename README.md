# VenueVoice

Premium voice-enabled POS & inventory management platform for restaurants and bars.

## Features

- **Voice-Enabled POS**: Advanced voice commands for point-of-sale operations
- **Real-time Inventory**: Track inventory levels with automated alerts
- **Multi-tenant Architecture**: Support for multiple venues and locations
- **AI-Powered Analytics**: Intelligent insights and reporting
- **MCP Integration**: Flexible Model Context Protocol support with Supabase
- **Kiosk Mode**: Self-service customer interface
- **Agent Builder**: Custom voice workflow creation
- **Real-time Voice**: Low-latency voice processing with OpenAI

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Voice**: OpenAI Realtime API, Deepgram, ElevenLabs
- **Deployment**: Vercel, Docker

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `apps/frontend/.env.local`
4. Run the development server: `npm run dev`

## Environment Setup

Copy the environment variables from `.env.local` and configure your API keys for:
- OpenAI API
- Deepgram API
- ElevenLabs API
- Supabase credentials

## Architecture

VenueVoice uses a modern microservices architecture with:
- Frontend application in `apps/frontend/`
- Voice processing services in `apps/voice/`
- Backend API services in `apps/backend/`

## License

Proprietary - All rights reserved