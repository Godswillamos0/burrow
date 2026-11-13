import { NextResponse } from 'next/server';
import { getLeaderboardAndStats, StorageNotConfiguredError } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Real sign-up count + top 10 referrers. Cached 30s in-process and at the CDN (Cloudflare).
export async function GET() {
  try {
    const { totalSignups, leaderboard } = await getLeaderboardAndStats();
    return NextResponse.json(
      { totalSignups, leaderboard },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' } }
    );
  } catch (err) {
    const status = err instanceof StorageNotConfiguredError ? 503 : 500;
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch waitlist statistics' }, { status });
  }
}
