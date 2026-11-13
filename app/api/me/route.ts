import { NextRequest, NextResponse } from 'next/server';
import { findByXId, getPosition, StorageNotConfiguredError } from '@/lib/storage';
import { getVerifiedXUser } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Returns the signed-in X user and, if they already joined, their entry and
 * place in line — so returning miners see the joined state on any device.
 */
export async function GET(req: NextRequest) {
  try {
    const xUser = await getVerifiedXUser(req);
    if (!xUser) return NextResponse.json({ error: 'Not signed in with X' }, { status: 401 });

    const entry = await findByXId(xUser.xId);
    const position = entry ? await getPosition(entry) : null;

    return NextResponse.json(
      { xUser: { handle: xUser.handle, avatar: xUser.avatar }, entry, position },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const status = err instanceof StorageNotConfiguredError ? 503 : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
