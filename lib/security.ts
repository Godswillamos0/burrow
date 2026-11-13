import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';

/* ─────────────────────────── Client IP ─────────────────────────── */

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/* ─────────────────────────── Signed nonces ───────────────────────────
 * Stateless: nonce = <issuedAtMs>.<random>.<hmac>. Survives restarts and
 * works across instances. Wallet + X uniqueness makes replay harmless.
 */

const NONCE_TTL_MS = 15 * 60 * 1000;

function nonceSecret(): string {
  const s = process.env.NONCE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_SECRET_KEY;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('NONCE_SECRET is not configured.');
    return 'burrow-dev-only-nonce-secret';
  }
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', nonceSecret()).update(payload).digest('base64url').slice(0, 22);
}

export function issueNonce(): string {
  const payload = `${Date.now()}.${randomBytes(9).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyNonce(nonce: unknown): boolean {
  if (typeof nonce !== 'string') return false;
  const parts = nonce.split('.');
  if (parts.length !== 3) return false;
  const [ts, rand, mac] = parts;
  const expected = sign(`${ts}.${rand}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age >= 0 && age <= NONCE_TTL_MS;
}

export { buildSignMessage } from './signMessage';

/* ─────────────────────────── Rate limiting ───────────────────────────
 * Upstash Redis (REST) when configured, otherwise per-instance memory.
 */

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', `rl:${key}`],
          ['EXPIRE', `rl:${key}`, String(windowSec), 'NX'],
        ]),
        cache: 'no-store',
      });
      const data = (await res.json()) as Array<{ result: number }>;
      return (data?.[0]?.result ?? 0) <= limit;
    } catch (err) {
      console.warn('Upstash rate limit failed, using memory limiter:', err);
    }
  }

  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/* ─────────────────────────── Cloudflare Turnstile ─────────────────────────── */

export const isTurnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skipped
  if (typeof token !== 'string' || !token) return false;
  try {
    const form = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      cache: 'no-store',
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/* ─────────────────────────── X (Twitter) identity ─────────────────────────── */

export interface VerifiedXUser {
  xId: string;
  handle: string;
  avatar: string | null;
}

/** Whether real X sign-in is enforced (Supabase configured with service role). */
export const isXAuthEnforced = isSupabaseConfigured && Boolean(supabaseAdmin);

/**
 * Reads the Supabase access token from `Authorization: Bearer <token>` and
 * returns the verified X identity, or null if the token is missing/invalid
 * or the user did not sign in with X.
 */
export async function getVerifiedXUser(req: NextRequest): Promise<VerifiedXUser | null> {
  if (!supabaseAdmin) return null;
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  const user = data.user;
  const identity = user.identities?.find((i) => i.provider === 'x' || i.provider === 'twitter');
  if (!identity) return null;

  const meta = { ...(identity.identity_data || {}), ...(user.user_metadata || {}) } as Record<string, any>;
  const handle = String(meta.user_name || meta.preferred_username || meta.screen_name || '').replace(/^@/, '');
  const xId = String(meta.provider_id || meta.sub || identity.id || '');
  if (!handle || !xId) return null;

  const rawAvatar: string | null = meta.avatar_url || meta.picture || null;
  // X returns 48px "_normal" images; ask for the 400px version
  const avatar = rawAvatar ? rawAvatar.replace('_normal.', '_400x400.') : null;

  return { xId, handle, avatar };
}
