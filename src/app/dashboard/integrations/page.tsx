"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, ExternalLink } from 'lucide-react';

const integrations = {
  communication: [
    {
      name: 'OpenAI',
      description: 'Advanced AI conversation and voice processing with GPT-4o',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142-.0852 4.783-2.7582a.7712.7712 0 0 0 .7806 0l5.8428 3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142.0852-4.7735 2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="currentColor"/>
        </svg>
      ),
      status: 'connected',
      category: 'AI & Voice',
      color: 'from-emerald-500 to-teal-600',
      website: 'https://openai.com'
    },
    {
      name: 'Twilio',
      description: 'Phone calls, SMS, and voice messaging infrastructure',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 7.432a6.75 6.75 0 11-11.136 0 1.44 1.44 0 112.016-2.016 4.32 4.32 0 108 0 1.44 1.44 0 112.016 2.016zm-2.016 2.016a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0zm-2.016 2.016a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0zm-2.016-2.016a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
        </svg>
      ),
      status: 'available',
      category: 'Communication',
      color: 'from-red-500 to-red-600',
      website: 'https://twilio.com'
    },
    {
      name: 'Stripe',
      description: 'Payment processing and subscription management',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
        </svg>
      ),
      status: 'available',
      category: 'Payments',
      color: 'from-purple-500 to-indigo-600',
      website: 'https://stripe.com'
    },
    {
      name: 'Slack',
      description: 'Team notifications and workspace integration',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
        </svg>
      ),
      status: 'available',
      category: 'Communication',
      color: 'from-pink-500 to-purple-600',
      website: 'https://slack.com'
    }
  ],
  booking: [
    {
      name: 'Calendly',
      description: 'Automated scheduling and booking management',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 16.568C16.327 17.81 14.246 18.5 12 18.5s-4.327-.69-5.568-1.932C5.19 15.327 4.5 13.246 4.5 11s.69-4.327 1.932-5.568C7.673 4.19 9.754 3.5 12 3.5s4.327.69 5.568 1.932C18.81 6.673 19.5 8.754 19.5 11s-.69 4.327-1.932 5.568z"/>
          <path d="M12 5.5a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-.146.354l-3 3a.5.5 0 0 1-.708-.708L11.5 11.793V6a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      status: 'available',
      category: 'Booking',
      color: 'from-blue-500 to-cyan-600',
      website: 'https://calendly.com'
    },
    {
      name: 'Square',
      description: 'Point of sale and payment processing',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.01 0A4.01 4.01 0 0 0 0 4.01v15.98A4.01 4.01 0 0 0 4.01 24h15.98A4.01 4.01 0 0 0 24 19.99V4.01A4.01 4.01 0 0 0 19.99 0H4.01zm8.48 5.6c2.49 0 4.51 2.02 4.51 4.51s-2.02 4.51-4.51 4.51-4.51-2.02-4.51-4.51 2.02-4.51 4.51-4.51z"/>
        </svg>
      ),
      status: 'available',
      category: 'Payments',
      color: 'from-gray-700 to-gray-900',
      website: 'https://squareup.com'
    },
    {
      name: 'Google Calendar',
      description: 'Calendar synchronization and event management',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      ),
      status: 'connected',
      category: 'Booking',
      color: 'from-green-500 to-emerald-600',
      website: 'https://calendar.google.com'
    }
  ],
  management: [
    {
      name: 'Notion',
      description: 'Knowledge management and documentation',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z"/>
        </svg>
      ),
      status: 'available',
      category: 'Productivity',
      color: 'from-gray-800 to-black',
      website: 'https://notion.so'
    },
    {
      name: 'Zapier',
      description: 'Workflow automation and app integrations',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.036c0 .654-.54 1.194-1.194 1.194H14.69l6.801 6.801c.462.462.462 1.212 0 1.674-.462.462-1.212.462-1.674 0l-6.801-6.801v8.116c0 .654-.54 1.194-1.194 1.194s-1.194-.54-1.194-1.194v-8.116l-6.801 6.801c-.462.462-1.212.462-1.674 0-.462-.462-.462-1.212 0-1.674l6.801-6.801H1.194C.54 13.23 0 12.69 0 12.036s.54-1.194 1.194-1.194h8.116L2.509 4.041c-.462-.462-.462-1.212 0-1.674.462-.462 1.212-.462 1.674 0l6.801 6.801V1.052C10.984.398 11.524-.142 12.178-.142s1.194.54 1.194 1.194v8.116l6.801-6.801c.462-.462 1.212-.462 1.674 0 .462.462.462 1.212 0 1.674l-6.801 6.801h8.116c.654 0 1.194.54 1.194 1.194z"/>
        </svg>
      ),
      status: 'available',
      category: 'Automation',
      color: 'from-orange-500 to-red-600',
      website: 'https://zapier.com'
    }
  ],
  tools: [
    {
      name: 'GitHub',
      description: 'Version control and code repository management',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      status: 'available',
      category: 'Development',
      color: 'from-gray-700 to-gray-900',
      website: 'https://github.com'
    },
    {
      name: 'Vercel',
      description: 'Deployment and hosting platform',
      logo: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 22.525H0l12-21.05 12 21.05z"/>
        </svg>
      ),
      status: 'connected',
      category: 'Deployment',
      color: 'from-black to-gray-800',
      website: 'https://vercel.com'
    }
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'available':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'coming-soon':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'connected': return 'Connected';
    case 'available': return 'Available';
    case 'coming-soon': return 'Coming Soon';
    default: return 'Unknown';
  }
};

export default function IntegrationsPage() {
  const allIntegrations = [
    ...integrations.communication,
    ...integrations.booking,
    ...integrations.management,
    ...integrations.tools
  ];

  const renderIntegrationCard = (integration: any) => (
    <div key={integration.name} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${integration.color} text-white shadow-lg`}>
            {integration.logo}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {integration.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{integration.category}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(integration.status)} border font-medium px-3 py-1`}>
          {getStatusText(integration.status)}
        </Badge>
      </div>
      
      <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
        {integration.description}
      </p>
      
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm"
          className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
        >
          {integration.status === 'connected' ? 'Configure' : 'Connect'}
        </Button>
        {integration.website && (
          <a 
            href={integration.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center space-x-1"
          >
            <span>Learn more</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Integrations
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Connect your venue with powerful tools and services to streamline your operations
          </p>
        </div>

        {/* Integration Categories */}
        <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium transition-all">
              All Integrations
            </TabsTrigger>
            <TabsTrigger value="communication" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium transition-all">
              Communication
            </TabsTrigger>
            <TabsTrigger value="booking" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium transition-all">
              Booking
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium transition-all">
              Management
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium transition-all">
              Developer Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allIntegrations.map(renderIntegrationCard)}
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.communication.map(renderIntegrationCard)}
            </div>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.booking.map(renderIntegrationCard)}
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.management.map(renderIntegrationCard)}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.tools.map(renderIntegrationCard)}
            </div>
          </TabsContent>
        </Tabs>

        {/* Benefits Section */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Why Integrate?</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="text-blue-600 dark:text-blue-400 font-semibold">🚀 Streamlined Operations</div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Connect your existing tools to create seamless workflows and eliminate manual data entry.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-purple-600 dark:text-purple-400 font-semibold">⚡ Enhanced Automation</div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Automate repetitive tasks and focus on what matters most - serving your customers.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">📊 Better Insights</div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Get comprehensive analytics and reporting across all your integrated platforms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}