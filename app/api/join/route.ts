import { NextRequest, NextResponse } from 'next/server';
import { isAddress, verifyMessage } from 'viem';
import { customAlphabet } from 'nanoid';
import {
  findByXId,
  findByWallet,
  findByRefCode,
  joinWaitlist,
  getPosition,
  getLeaderboardAndStats,
  DuplicateEntryError,
  StorageNotConfiguredError,
} from '@/lib/storage';
import { BURROW_CONFIG } from '@/lib/config';
import {
  getClientIp,
  rateLimit,
  verifyTurnstile,
  verifyNonce,
  buildSignMessage,
  getVerifiedXUser,
  isXAuthEnforced,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

// URL-safe, no look-alike characters
const newRefCode = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 8);

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Rate limit: 5 attempts per IP per hour
    if (!(await rateLimit(`join:${ip}`, 5, 60 * 60))) {
      return fail('Too many attempts from your network. Please try again in an hour.', 429);
    }

    const body = await req.json().catch(() => ({}));
    const { wallet, signature, nonce, turnstileToken } = body as Record<string, unknown>;

    // 2. Bot check (Cloudflare Turnstile, when configured)
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return fail('Bot check failed. Please complete the verification and try again.', 403);
    }

    // 3. Verified X identity from the Supabase session
    let xId: string;
    let xHandle: string;
    let xAvatar: string | null;

    if (isXAuthEnforced) {
      const xUser = await getVerifiedXUser(req);
      if (!xUser) return fail('Please sign in with X to join the waitlist.', 401);
      ({ xId, handle: xHandle, avatar: xAvatar } = xUser);
    } else if (process.env.NODE_ENV !== 'production') {
      // Local development without Supabase: accept a typed handle
      const h = String(body.xHandle || '').replace(/^@/, '').trim();
      if (!/^[A-Za-z0-9_]{1,15}$/.test(h)) return fail('Enter a valid X handle.');
      xId = `dev_${h.toLowerCase()}`;
      xHandle = h;
      xAvatar = null;
    } else {
      throw new StorageNotConfiguredError();
    }

    // 4. Wallet ownership: signature over a server-issued nonce is REQUIRED
    if (typeof wallet !== 'string' || !isAddress(wallet, { strict: false })) {
      return fail('Connect a valid EVM wallet (0x...).');
    }
    const normalizedWallet = wallet.toLowerCase() as `0x${string}`;

    if (!verifyNonce(nonce)) {
      return fail('Your sign-in request expired. Please sign the message again.');
    }
    if (typeof signature !== 'string' || !signature.startsWith('0x')) {
      return fail('Please sign the message in your wallet to prove you own it.');
    }

    const validSig = await verifyMessage({
      address: normalizedWallet,
      message: buildSignMessage(xHandle, normalizedWallet, nonce as string),
      signature: signature as `0x${string}`,
    }).catch(() => false);
    if (!validSig) return fail('Wallet signature is invalid. Please try again.');

    // 5. One sign-up per X account and per wallet
    const existingByX = await findByXId(xId);
    if (existingByX) {
      const [position, stats] = await Promise.all([getPosition(existingByX), getLeaderboardAndStats()]);
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        entry: existingByX,
        position,
        totalSignups: stats.totalSignups,
      });
    }
    if (await findByWallet(normalizedWallet)) {
      return fail('This wallet is already on the waitlist with another X account.');
    }

    // 6. Referral from the 30-day cookie (or body fallback), only if it's a real code
    const rawRef = req.cookies.get(BURROW_CONFIG.referral.cookieName)?.value || body.referredBy || null;
    let referredBy: string | null = null;
    if (typeof rawRef === 'string' && /^[A-Za-z0-9_-]{4,32}$/.test(rawRef)) {
      const referrer = await findByRefCode(rawRef);
      if (referrer && referrer.x_id !== xId && referrer.wallet !== normalizedWallet) referredBy = referrer.ref_code;
    }

    const { entry, position } = await joinWaitlist({
      xId,
      xHandle,
      xAvatar,
      wallet: normalizedWallet,
      refCode: newRefCode(),
      referredBy,
    });

    const { totalSignups } = await getLeaderboardAndStats();
    const res = NextResponse.json({ success: true, entry, position, totalSignups });
    res.cookies.delete(BURROW_CONFIG.referral.cookieName);
    return res;
  } catch (err: any) {
    if (err instanceof DuplicateEntryError) return fail(err.message, 409);
    if (err instanceof StorageNotConfiguredError) return fail(err.message, 503);
    console.error('Join error:', err);
    return fail('Something went wrong while joining. Please try again.', 500);
  }
}
