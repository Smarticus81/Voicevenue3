import { NextRequest, NextResponse } from 'next/server';
import { v0Client, AgentUIConfig } from '../../../lib/v0-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agentConfig: AgentUIConfig = body;

    // Validate required fields
    if (!agentConfig.name || !agentConfig.type || !agentConfig.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, description' },
        { status: 400 }
      );
    }

    // Generate UI using v0
    const generatedUI = await v0Client.generateAgentUI(agentConfig);

    return NextResponse.json({
      success: true,
      data: generatedUI,
    });
  } catch (error) {
    console.error('UI generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate UI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
