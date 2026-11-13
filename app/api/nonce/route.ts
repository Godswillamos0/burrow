import { NextResponse } from 'next/server';
import { issueNonce } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Signed, short-lived nonce (15 min). Verified statelessly in /api/join.
export async function GET() {
  return NextResponse.json({ nonce: issueNonce() }, { headers: { 'Cache-Control': 'no-store' } });
}
