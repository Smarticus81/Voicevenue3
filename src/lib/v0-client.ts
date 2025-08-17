import { createClient } from 'v0-sdk';

export interface AgentUIConfig {
  name: string;
  type: 'Bevpro' | 'Venue Voice';
  description: string;
  voice: string;
  enabledTools: string[];
  branding?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    logo?: string;
    typography?: string;
  };
}

export interface GeneratedUI {
  code: string;
  previewUrl: string;
  files: Array<{
    name: string;
    content: string;
  }>;
}

export class V0Client {
  private v0: any;

  constructor() {
    if (typeof window === 'undefined') {
      // Server-side only
      this.v0 = createClient({
        apiKey: process.env.V0_API_KEY,
      });
    }
  }

  async generateAgentUI(agentConfig: AgentUIConfig): Promise<GeneratedUI> {
    try {
      const prompt = this.buildUIPrompt(agentConfig);
      
      const chat = await this.v0.chats.create({
        message: prompt,
        system: 'You are an expert UI designer specializing in agent interfaces and PWA development. Generate production-ready React components with Tailwind CSS and shadcn/ui.',
      });

      // Extract the generated code
      const mainComponent = chat.files.find((file: any) => 
        file.name.includes('Agent') || file.name.includes('Dashboard') || file.name.includes('Interface')
      )?.content || chat.files[0]?.content || '';

      return {
        code: mainComponent,
        previewUrl: chat.demo || '',
        files: chat.files.map((file: any) => ({
          name: file.name,
          content: file.content,
        })),
      };
    } catch (error) {
      console.error('Error generating agent UI:', error);
      throw new Error('Failed to generate agent UI. Please try again.');
    }
  }

  private buildUIPrompt(agentConfig: AgentUIConfig): string {
    const toolDescriptions = {
      'Bevpro': 'bar/restaurant management, drink orders, inventory tracking, customer management, payment processing',
      'Venue Voice': 'event scheduling, venue management, vendor coordination, equipment tracking, financial reporting'
    };

    const colorScheme = agentConfig.branding?.colors?.primary || '#3b82f6';
    const logoUrl = agentConfig.branding?.logo || '';

    return `
Create a professional, mobile-first PWA interface for a ${agentConfig.type} voice agent named "${agentConfig.name}".

AGENT DETAILS:
- Type: ${agentConfig.type}
- Description: ${agentConfig.description}
- Voice: ${agentConfig.voice}
- Primary Functions: ${toolDescriptions[agentConfig.type]}
- Enabled Tools: ${agentConfig.enabledTools.join(', ')}

UI REQUIREMENTS:
- Modern, clean dashboard design optimized for mobile devices
- Voice interaction controls prominently displayed
- Professional color scheme with primary color: ${colorScheme}
- Responsive layout that works on all screen sizes
- PWA-ready with offline indicators and install prompts
- Touch-friendly interface elements
- Clear navigation and information hierarchy

TECHNICAL REQUIREMENTS:
- Use React with TypeScript
- Style with Tailwind CSS
- Include shadcn/ui components
- Make it production-ready and accessible
- Optimize for voice-first interaction
- Include proper error handling and loading states

COMPONENTS TO INCLUDE:
- Header with agent name and voice status
- Main content area for agent interactions
- Voice control panel with microphone button
- Quick action buttons for common tasks
- Navigation sidebar/menu
- Status indicators and notifications
- Responsive grid layout for different screen sizes

The interface should feel professional and trustworthy, suitable for business use in ${agentConfig.type.toLowerCase()} environments.
    `;
  }

  async regenerateUI(agentConfig: AgentUIConfig, feedback?: string): Promise<GeneratedUI> {
    try {
      let prompt = this.buildUIPrompt(agentConfig);
      
      if (feedback) {
        prompt += `\n\nFEEDBACK TO INCORPORATE:\n${feedback}`;
      }

      const chat = await this.v0.chats.create({
        message: prompt,
        system: 'You are an expert UI designer. Incorporate the feedback and regenerate the UI component.',
      });

      const mainComponent = chat.files.find((file: any) => 
        file.name.includes('Agent') || file.name.includes('Dashboard') || file.name.includes('Interface')
      )?.content || chat.files[0]?.content || '';

      return {
        code: mainComponent,
        previewUrl: chat.demo || '',
        files: chat.files.map((file: any) => ({
          name: file.name,
          content: file.content,
        })),
      };
    } catch (error) {
      console.error('Error regenerating agent UI:', error);
      throw new Error('Failed to regenerate agent UI. Please try again.');
    }
  }
}

// Create a singleton instance
export const v0Client = new V0Client();
