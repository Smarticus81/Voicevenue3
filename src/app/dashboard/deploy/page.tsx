"use client";

import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import convexApi from "@/lib/convex-api";
import { useUser } from "@clerk/nextjs";
import { Copy, ExternalLink, Smartphone, Globe, Code, CheckCircle, ArrowRight } from "lucide-react";

export default function DeployPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const agentId = searchParams.get('agentId') || searchParams.get('agent');
  const deploymentId = searchParams.get('deploymentId');
  
  const [agent, setAgent] = useState<any>(null);
  const [deployment, setDeployment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  // Fetch agent and deployment data
  useEffect(() => {
    const fetchData = async () => {
      if (!agentId) {
        setError('Missing agent ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if this is a mock agent
        if (agentId.startsWith('mock_')) {
          const mockAgent = localStorage.getItem('mockAgent');
          const mockDeploymentId = localStorage.getItem('mockDeploymentId');
          
          if (mockAgent) {
            const parsedAgent = JSON.parse(mockAgent);
            setAgent(parsedAgent);
            setDeployment({
              _id: mockDeploymentId || deploymentId,
              status: 'active',
              deploymentType: 'pwa',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setLoading(false);
            return;
          }
        }
        
        // Try to fetch from Convex API
        try {
          // First, get all user agents and find the specific one
          const userId = user?.id || 'temp_user';
          const agentData = await convexApi.getUserAgents(userId);
          if (agentData && agentData.length > 0) {
            // Find the specific agent by ID
            const foundAgent = agentData.find((a: any) => a._id === agentId);
            if (foundAgent) {
              setAgent(foundAgent);
            } else {
              throw new Error('Agent not found in user agents');
            }
          }
          
          // Fetch deployment data
          const deploymentData = await convexApi.getAgentDeployments(agentId);
          if (deploymentData && deploymentData.length > 0) {
            setDeployment(deploymentData[0]);
          } else if (deploymentId) {
            // If no deployment found but deploymentId provided, create a deployment record
            setDeployment({
              _id: deploymentId,
              status: 'active',
              deploymentType: 'pwa',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (convexErr) {
          console.error('Convex API failed:', convexErr);
          // If Convex fails, try to use mock data
          const mockAgent = localStorage.getItem('mockAgent');
          if (mockAgent) {
            const parsedAgent = JSON.parse(mockAgent);
            setAgent(parsedAgent);
            setDeployment({
              _id: deploymentId || 'mock_deployment',
              status: 'active',
              deploymentType: 'pwa',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            throw new Error('Failed to load agent data from both Convex and local storage');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load agent data');
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId, deploymentId, user?.id]);

  const pwaUrl = agent ? `${window.location.origin}/agent/${agent._id}` : '';
  const embedCode = agent ? `<script src="${window.location.origin}/embed.js?agent=${agent._id}"></script>` : '';

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeployToVercel = async () => {
    if (!agent) return;
    
    try {
      setDeploying(true);
      
      // Use the new Convex action for Vercel deployment
      const result = await convexApi.createVercelDeployment({
        agentId: agent._id,
        deploymentType: 'pwa',
        userId: user?.id || 'temp_user',
        agentConfig: {
          name: agent.name,
          description: agent.description,
          customInstructions: agent.customInstructions,
          context: agent.context,
          voiceConfig: agent.voiceConfig,
          uiCustomization: agent.uiCustomization,
          generatedUI: agent.generatedUI,
        }
      });

      console.log('Vercel deployment successful:', result);
      
      // Update deployment state
      setDeployment({
        ...deployment,
        _id: result.deploymentId,
        url: result.deploymentUrl,
        claimLink: result.claimLink,
        status: 'deployed',
        vercelDeployment: result
      });
      
      alert(`Agent deployed successfully to Vercel!\nURL: ${result.deploymentUrl}\nClaim Link: ${result.claimLink}`);
    } catch (error) {
      console.error('Deployment error:', error);
      alert(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Loading agent...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Agent Not Found</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'The requested agent could not be found.'}</p>
            <button 
              onClick={() => window.history.back()} 
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Deploy {agent.name}
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose how you want to deploy your voice agent. Each option provides different ways to integrate your agent into your workflow.
          </p>
        </div>

        {/* Deployment Options Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* PWA Deployment */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">PWA App</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Progressive Web App</p>
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Your agent as a Progressive Web App - add to home screen for native experience on mobile and desktop devices.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl font-mono text-sm text-slate-700 dark:text-slate-300 break-all mb-6 border border-slate-200/50 dark:border-slate-600/50">
              {pwaUrl}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleCopy(pwaUrl, 'pwa')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                <Copy className="w-4 h-4" />
                <span>{copied === 'pwa' ? 'Copied!' : 'Copy PWA URL'}</span>
              </button>
              
              <a
                href={pwaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open PWA</span>
              </a>
            </div>
          </div>

          {/* Website Embed */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Website Embed</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">HTML Integration</p>
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Add this script to your website's HTML to enable voice interactions with a floating assistant button.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 break-all mb-6 border border-slate-200/50 dark:border-slate-600/50">
              {embedCode}
            </div>
            
            <button
              onClick={() => handleCopy(embedCode, 'embed')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Copy className="w-4 h-4" />
              <span>{copied === 'embed' ? 'Copied!' : 'Copy Embed Code'}</span>
            </button>
          </div>

          {/* Vercel Deployment */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Vercel App</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Standalone Deployment</p>
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Deploy as a standalone Vercel application using the Smarticus81 account. Each agent gets its own URL with custom branding, full PWA capabilities, and native app-like experience.
            </p>
            
            <button
              onClick={handleDeployToVercel}
              disabled={deploying}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deploying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Deploy to Vercel</span>
                </>
              )}
            </button>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/60 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Smarticus81 Deployment</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                This agent will be deployed using the Smarticus81 Vercel account for reliable hosting and management.
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/60 rounded-xl">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">PWA Features</h4>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <p>• Install to home screen</p>
                <p>• Offline functionality</p>
                <p>• Native app experience</p>
                <p>• Custom branding & colors</p>
                <p>• Voice interface integration</p>
              </div>
            </div>
            
            {deployment?.claimLink && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Claim Your Deployment</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  Transfer ownership to your own Vercel team
                </p>
                <a
                  href={deployment.claimLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline flex items-center space-x-1"
                >
                  <span>Claim this site</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Integration Instructions</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <span>PWA Instructions</span>
              </h4>
              <ol className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>Open the PWA URL on your device</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>Tap "Add to Home Screen" when prompted</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>Your agent will appear as a native app</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span>Tap the app icon to launch your voice agent</span>
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <Code className="w-5 h-5 text-emerald-500" />
                <span>Website Embed Instructions</span>
              </h4>
              <ol className="space-y-3 text-slate-600 dark:text-slate-400">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>Copy the embed code above</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>Paste it just before the closing &lt;/body&gt; tag</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>The voice agent will appear as a floating button</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span>Users can click or say "Hey Assistant" to activate</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Agent Details */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60">
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Agent Details</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Agent ID</dt>
              <dd className="font-mono text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">{agent._id}</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</dt>
              <dd className="text-slate-900 dark:text-white font-medium">{agent.name}</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Type</dt>
              <dd className="text-slate-900 dark:text-white capitalize">{agent.type}</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Voice</dt>
              <dd className="text-slate-900 dark:text-white capitalize">{agent.voiceConfig?.voice || 'Alloy'}</dd>
            </div>
            <div className="space-y-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {deployment?.status || 'Active'}
                </span>
              </dd>
            </div>
            <div className="space-y-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="text-slate-900 dark:text-white">{new Date(agent.createdAt).toLocaleDateString()}</dd>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}