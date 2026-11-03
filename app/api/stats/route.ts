import { NextResponse } from 'next/server';
import { getLeaderboardAndStats } from '@/lib/storage';

export async function GET() {
  try {
    const stats = await getLeaderboardAndStats();

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch waitlist statistics', details: err.message },
      { status: 500 }
    );
  }
}
