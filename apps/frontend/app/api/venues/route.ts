import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { venueSettings } from '@/server/db/schema';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const venues = await db.select({
      id: venueSettings.venueId,
      name: venueSettings.extras
    }).from(venueSettings);
    
    // Extract venue name from extras JSON
    const processedVenues = venues.map(venue => ({
      id: venue.id,
      name: venue.name?.venueName || venue.id
    }));
    
    return NextResponse.json({ venues: processedVenues });
  } catch (error) {
    console.error('Venues API error:', error);
    return NextResponse.json({ error: 'Failed to load venues' }, { status: 500 });
  }
}


