import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, text, voiceId, apiKey } = await request.json();

    console.log('Testing voice:', { provider, text, voiceId });

    if (provider === 'openai') {
      console.log('OpenAI voice test requested');
      
      // Check if we have an OpenAI API key
      if (!apiKey) {
        return NextResponse.json({ 
          success: true, 
          message: 'OpenAI voice test - API key not provided, using demo mode',
          provider: 'openai',
          voiceId,
          text 
        });
      }

      try {
        // Call OpenAI TTS API
        const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voiceId,
            response_format: 'mp3'
          })
        });

        if (openaiResponse.ok) {
          const audioBuffer = await openaiResponse.arrayBuffer();
          
          // Return the audio as a blob
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString()
            }
          });
        } else {
          const errorData = await openaiResponse.json();
          console.error('OpenAI TTS API error:', errorData);
          return NextResponse.json({ 
            success: false, 
            error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
            provider: 'openai',
            voiceId,
            text 
          }, { status: 400 });
        }
      } catch (openaiError) {
        console.error('OpenAI API call failed:', openaiError);
        return NextResponse.json({ 
          success: false, 
          error: 'OpenAI API call failed',
          provider: 'openai',
          voiceId,
          text 
        }, { status: 500 });
      }
    }
    
    if (provider === 'elevenlabs') {
      // Mock Eleven Labs response
      console.log('Eleven Labs voice test requested');
      return NextResponse.json({ 
        success: true, 
        message: 'Eleven Labs voice test - would use actual API with key',
        provider: 'elevenlabs',
        voiceId,
        text 
      });
    }
    
    if (provider === 'google') {
      // Mock Google Cloud response
      console.log('Google Cloud voice test requested');
      return NextResponse.json({ 
        success: true, 
        message: 'Google Cloud voice test - would use actual API with key',
        provider: 'google',
        voiceId,
        text 
      });
    }
    
    if (provider === 'playht') {
      // Mock Play.ht response
      console.log('Play.ht voice test requested');
      return NextResponse.json({ 
        success: true, 
        message: 'Play.ht voice test - would use actual API with key',
        provider: 'playht',
        voiceId,
        text 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Unknown provider' 
    }, { status: 400 });

  } catch (error) {
    console.error('Voice test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
