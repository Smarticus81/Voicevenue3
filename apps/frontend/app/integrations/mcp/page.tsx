"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Database, 
  ShoppingCart, 
  Webhook, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Zap,
  Settings
} from 'lucide-react';

const INTEGRATION_CATEGORIES = [
  {
    title: "Point of Sale Systems",
    description: "Connect your existing POS to enable voice commands and real-time inventory",
    icon: <ShoppingCart size={24} />,
    color: "emerald",
    integrations: [
      { id: 'square', name: 'Square', status: 'available', description: 'Complete POS integration with inventory sync' },
      { id: 'toast', name: 'Toast', status: 'available', description: 'Restaurant POS with menu management' },
      { id: 'lavu', name: 'Lavu', status: 'available', description: 'iPad POS for bars and restaurants' },
      { id: 'lightspeed', name: 'Lightspeed', status: 'available', description: 'Retail and restaurant POS solution' },
      { id: 'clover', name: 'Clover', status: 'coming-soon', description: 'All-in-one POS and payment system' },
    ]
  },
  {
    title: "Payment Processing",
    description: "Accept payments seamlessly through your voice agent",
    icon: <CreditCard size={24} />,
    color: "blue",
    integrations: [
      { id: 'stripe', name: 'Stripe', status: 'available', description: 'Online payment processing' },
      { id: 'paypal', name: 'PayPal', status: 'available', description: 'Global payment solutions' },
      { id: 'square-payments', name: 'Square Payments', status: 'available', description: 'Integrated with Square POS' },
      { id: 'authorize', name: 'Authorize.Net', status: 'coming-soon', description: 'Payment gateway solution' },
    ]
  },
  {
    title: "Database & Storage",
    description: "Connect your data sources for enhanced agent capabilities",
    icon: <Database size={24} />,
    color: "violet",
    integrations: [
      { id: 'supabase', name: 'Supabase', status: 'available', description: 'PostgreSQL database with real-time features' },
      { id: 'mysql', name: 'MySQL', status: 'available', description: 'Popular relational database' },
      { id: 'postgres', name: 'PostgreSQL', status: 'available', description: 'Advanced open source database' },
      { id: 'mongodb', name: 'MongoDB', status: 'coming-soon', description: 'NoSQL document database' },
    ]
  },
  {
    title: "Event & Venue Tools",
    description: "Specialized tools for event venue management",
    icon: <Building2 size={24} />,
    color: "orange",
    integrations: [
      { id: 'eventbrite', name: 'Eventbrite', status: 'coming-soon', description: 'Event ticketing and management' },
      { id: 'resy', name: 'Resy', status: 'coming-soon', description: 'Restaurant reservation system' },
      { id: 'opentable', name: 'OpenTable', status: 'coming-soon', description: 'Restaurant booking platform' },
      { id: 'ticketmaster', name: 'Ticketmaster', status: 'planned', description: 'Event ticketing platform' },
    ]
  }
];

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());

  const handleConnect = async (integrationId: string) => {
    setIsConnecting(integrationId);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectedIntegrations(prev => new Set([...prev, integrationId]));
    setIsConnecting(null);
  };

  const getStatusIcon = (status: string, integrationId: string) => {
    if (connectedIntegrations.has(integrationId)) {
      return <CheckCircle size={16} className="text-emerald-400" />;
    }
    switch (status) {
      case 'available':
        return <Zap size={16} className="text-blue-400" />;
      case 'coming-soon':
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return <Settings size={16} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: string, integrationId: string) => {
    if (connectedIntegrations.has(integrationId)) return 'Connected';
    switch (status) {
      case 'available': return 'Available';
      case 'coming-soon': return 'Coming Soon';
      case 'planned': return 'Planned';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs tracking-wide mb-4">
            <Building2 size={12} />
            Event Venue Integrations
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3">
            Connect Your Venue Tools
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Seamlessly integrate your existing POS, payment systems, and venue management tools with your AI agent
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8 justify-center"
        >
          {INTEGRATION_CATEGORIES.map((category, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                selectedCategory === index
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {category.icon}
              <span className="font-medium">{category.title}</span>
            </button>
          ))}
        </motion.div>

        {/* Selected Category Content */}
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-3xl p-6 mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full bg-${INTEGRATION_CATEGORIES[selectedCategory].color}-500/20 flex items-center justify-center`}>
              {INTEGRATION_CATEGORIES[selectedCategory].icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{INTEGRATION_CATEGORIES[selectedCategory].title}</h2>
              <p className="text-white/70">{INTEGRATION_CATEGORIES[selectedCategory].description}</p>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATION_CATEGORIES[selectedCategory].integrations.map((integration) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(integration.status, integration.id)}
                      <span className="text-xs text-white/60">
                        {getStatusText(integration.status, integration.id)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-white/70 mb-4">{integration.description}</p>
                
                <button
                  onClick={() => handleConnect(integration.id)}
                  disabled={integration.status !== 'available' || isConnecting === integration.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    connectedIntegrations.has(integration.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : integration.status === 'available'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                      : 'bg-white/5 text-white/50 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  {isConnecting === integration.id 
                    ? 'Connecting...' 
                    : connectedIntegrations.has(integration.id)
                    ? 'Connected'
                    : integration.status === 'available'
                    ? 'Connect'
                    : integration.status === 'coming-soon'
                    ? 'Coming Soon'
                    : 'Planned'
                  }
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-6 text-center"
        >
          <h3 className="text-lg font-semibold mb-2">Need a Custom Integration?</h3>
          <p className="text-white/70 mb-4">
            Don't see your tool listed? We can build custom integrations for your venue's specific needs.
          </p>
          <button className="px-6 py-2 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors">
            Request Integration
          </button>
        </motion.div>
      </div>
    </div>
  );
}

