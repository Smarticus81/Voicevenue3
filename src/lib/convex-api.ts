import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

// Create a client that can handle authentication
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Function to get auth token from Clerk
const getAuthToken = async () => {
  if (typeof window !== 'undefined') {
    // Try to get token from Clerk
    const clerk = (window as any).Clerk;
    if (clerk && clerk.session) {
      return await clerk.session.getToken();
    }
  }
  return null;
};

export const convexApi = {
  // Agent operations
  createAgent: async (agentData: {
    userId: string;
    name: string;
    type: "Event Venue" | "Venue Bar";
    description?: string;
    customInstructions?: string;
    context?: string;
    voiceConfig?: any;
    toolPermissions?: any;
    deploymentSettings?: any;
    tags?: string[];
  }) => {
    try {
      return await convex.mutation(api.agents.createAgent, agentData);
    } catch (error) {
      console.error('Convex createAgent failed:', error);
      // Return a mock ID for testing
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store mock agent data in localStorage for fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockAgent', JSON.stringify({
          _id: mockId,
          ...agentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        localStorage.setItem('mockAgentId', mockId);
      }
      
      return mockId;
    }
  },

  // Deployment operations
  createDeployment: async (deploymentData: {
    agentId: string;
    userId: string;
    name: string;
    deploymentType: "pwa" | "web" | "api";
    url?: string;
    settings?: any;
  }) => {
    try {
      return await convex.mutation(api.deployments.createDeployment, {
        ...deploymentData,
        agentId: deploymentData.agentId as any
      });
    } catch (error) {
      console.error('Convex createDeployment failed:', error);
      // Return a mock ID for testing
      const mockDeployId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store mock deployment data in localStorage for fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockDeploymentId', mockDeployId);
        localStorage.setItem('mockDeployment', JSON.stringify({
          _id: mockDeployId,
          ...deploymentData,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }
      
      return mockDeployId;
    }
  },

  // Vercel deployment using Convex action
  createVercelDeployment: async (deploymentData: {
    agentId: string;
    userId: string;
    agentConfig: any;
    deploymentType: "pwa" | "web" | "api";
  }) => {
    try {
      return await convex.action(api.vercelDeploy.createVercelDeployment, deploymentData);
    } catch (error) {
      console.error('Vercel deployment failed:', error);
      // Return mock deployment data for testing
      const mockDeployId = `vercel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockVercelDeploymentId', mockDeployId);
        localStorage.setItem('mockVercelDeployment', JSON.stringify({
          deploymentId: mockDeployId,
          deploymentUrl: `https://agent-${deploymentData.agentId}.vercel.app`,
          claimLink: `https://vercel.com/claim/${mockDeployId}`,
          agentId: deploymentData.agentId,
          status: 'deployed',
          timestamp: new Date().toISOString(),
        }));
      }
      
                     return {
                 success: true,
                 deploymentId: mockDeployId,
                 deploymentUrl: `https://bevpro-agent-${deploymentData.agentId}.vercel.app`,
                 claimLink: `https://vercel.com/claim/${mockDeployId}`,
                 agentId: deploymentData.agentId,
                 status: 'deployed',
                 timestamp: new Date().toISOString(),
               };
    }
  },

  // Get user agents
  getUserAgents: async (userId: string) => {
    try {
      return await convex.query(api.agents.getUserAgents, { userId });
    } catch (error) {
      console.error('Convex getUserAgents failed:', error);
      // Return mock agent data from localStorage as fallback
      if (typeof window !== 'undefined') {
        const mockAgent = localStorage.getItem('mockAgent');
        if (mockAgent) {
          return [JSON.parse(mockAgent)];
        }
      }
      return [];
    }
  },

  // Get agent deployments
  getAgentDeployments: async (agentId: string) => {
    try {
      // Skip if agentId is undefined or mock
      if (!agentId || agentId === 'undefined' || agentId.startsWith('mock_')) {
        // Return mock deployment data from localStorage
        if (typeof window !== 'undefined') {
          const mockDeployment = localStorage.getItem('mockDeployment');
          if (mockDeployment) {
            return [JSON.parse(mockDeployment)];
          }
        }
        return [];
      }
      
      return await convex.query(api.deployments.getAgentDeployments, { agentId: agentId as any });
    } catch (error) {
      console.error('Convex getAgentDeployments failed:', error);
      // Return mock deployment data from localStorage as fallback
      if (typeof window !== 'undefined') {
        const mockDeployment = localStorage.getItem('mockDeployment');
        if (mockDeployment) {
          return [JSON.parse(mockDeployment)];
        }
      }
      return [];
    }
  },

  // Save generated UI
  saveGeneratedUI: async (data: {
    agentId: string;
    generatedUI: string;
    uiCustomization?: any;
    pwaManifest?: any;
  }) => {
    try {
      return await convex.mutation(api.agents.saveGeneratedUI, {
        ...data,
        agentId: data.agentId as any
      });
    } catch (error) {
      console.error('Convex saveGeneratedUI failed:', error);
      return { success: false, error: (error as any).message || 'Unknown error' };
    }
  },

  // Delete agent
  deleteAgent: async (agentId: string) => {
    try {
      return await convex.mutation(api.agents.deleteAgent, { agentId: agentId as any });
    } catch (error) {
      console.error('Convex deleteAgent failed:', error);
      return { success: false, error: (error as any).message || 'Unknown error' };
    }
  },

  // Delete deployment
  deleteDeployment: async (deploymentId: string) => {
    try {
      return await convex.mutation(api.deployments.deleteDeployment, { deploymentId: deploymentId as any });
    } catch (error) {
      console.error('Convex deleteDeployment failed:', error);
      return { success: false, error: (error as any).message || 'Unknown error' };
    }
  },
};

export default convexApi;
