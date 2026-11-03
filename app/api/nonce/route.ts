import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// In-memory or session nonce store
const nonces = new Map<string, number>();

export async function GET() {
  const nonce = nanoid(8);
  nonces.set(nonce, Date.now());

  // Clean old nonces older than 15 minutes
  const now = Date.now();
  nonces.forEach((timestamp, n) => {
    if (now - timestamp > 15 * 60 * 1000) {
      nonces.delete(n);
    }
  });

  return NextResponse.json({ nonce });
}
