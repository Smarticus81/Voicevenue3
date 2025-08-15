export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { venueSettings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    
    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId parameter is required' },
        { status: 400 }
      );
    }

    const rows = await db.select().from(venueSettings).where(eq(venueSettings.venueId, venueId));

    if (rows.length === 0) {
      // Return default settings if no venue found - but NO hardcoded venue name
      return NextResponse.json({
        venueId,
        venueName: null, // Let frontend handle missing venue name
        asrProvider: 'deepgram',
        asrModel: 'nova-2',
        ttsProvider: 'elevenlabs',
        ttsVoice: 'Rachel',
        realtimeModel: 'gpt-4o-realtime-preview-2024-12-17',
        realtimeVoice: 'sage',
        region: 'us-east',
        wakeConfidenceMin: '0.65',
        vadMinDb: -42,
        vadHangoverMs: 280,
        customWakeWord: 'hey bev',
        wakeFuzzMaxDistance: 2,
        extras: null
      });
    }

    const settings = rows[0];
    return NextResponse.json({
      venueId: settings.venueId,
      venueName: settings.extras?.venueName || null,
      asrProvider: settings.asrProvider,
      asrModel: settings.asrModel,
      ttsProvider: settings.ttsProvider,
      ttsVoice: settings.ttsVoice,
      realtimeModel: settings.realtimeModel,
      realtimeVoice: settings.realtimeVoice,
      region: settings.region,
      wakeConfidenceMin: settings.wakeConfidenceMin,
      vadMinDb: settings.vadMinDb,
      vadHangoverMs: settings.vadHangoverMs,
      customWakeWord: settings.customWakeWord,
      wakeFuzzMaxDistance: settings.wakeFuzzMaxDistance,
      extras: settings.extras
    });
  } catch (error: any) {
    console.error('Error fetching venue settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venueId, venueName, ...otherSettings } = body;

    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId is required' },
        { status: 400 }
      );
    }

    const existing = await db.select().from(venueSettings).where(eq(venueSettings.venueId, venueId));

    const extras = {
      ...(existing[0]?.extras || {}),
      venueName: venueName
    };

    const settingsData = {
      venueId,
      extras,
      ...otherSettings,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      // Update existing venue settings
      await db.update(venueSettings)
        .set(settingsData)
        .where(eq(venueSettings.venueId, venueId));
    } else {
      // Insert new venue settings
      await db.insert(venueSettings).values(settingsData);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Venue settings saved successfully',
      venueName: venueName
    });
  } catch (error: any) {
    console.error('Error saving venue settings:', error);
    return NextResponse.json(
      { error: 'Failed to save venue settings' },
      { status: 500 }
    );
  }
}
