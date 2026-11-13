import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { getAllWaitlistForExport } from '@/lib/storage';
import { getClientIp, rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  // Hash first so lengths always match
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function csvCell(value: unknown): string {
  let s = String(value ?? '');
  // Neutralise spreadsheet formula injection (handles starting with = + - @)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const expectedKey = process.env.ADMIN_SECRET_KEY;
  if (!expectedKey || expectedKey.length < 16) {
    return NextResponse.json(
      { error: 'Admin export is disabled: set ADMIN_SECRET_KEY (16+ characters) on the server.' },
      { status: 503 }
    );
  }

  const ip = getClientIp(req);
  if (!(await rateLimit(`admin:${ip}`, 20, 60 * 60))) {
    return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
  }

  const key =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.nextUrl.searchParams.get('key') || '';
  if (!key || !safeEqual(key, expectedKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: Awaited<ReturnType<typeof getAllWaitlistForExport>>;
  try {
    data = await getAllWaitlistForExport();
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: `Export failed: ${(err as Error).message}` }, { status: 500 });
  }
  const format = req.nextUrl.searchParams.get('format') || 'csv';

  if (format === 'json') {
    return NextResponse.json({ count: data.length, entries: data }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // Sorted by rank → this file becomes the allowlist
  const headers = ['rank', 'x_handle', 'wallet', 'points', 'referrals', 'created_at', 'ref_code', 'referred_by'];
  const rows = data.map((item, idx) => [
    idx + 1,
    item.x_handle,
    item.wallet,
    item.points,
    item.referrals,
    item.created_at,
    item.ref_code,
    item.referred_by || '',
  ]);

  // BOM so Excel/Sheets detect UTF-8
  const csv = '﻿' + [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="burrow-allowlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
