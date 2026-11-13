import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { BURROW_CONFIG } from './config';

export interface WaitlistEntry {
  id: string;
  x_id: string;
  x_handle: string;
  x_avatar?: string | null;
  wallet: string;
  ref_code: string;
  referred_by?: string | null;
  referrals: number;
  points: number;
  created_at: string;
  rank?: number;
}

// Fallback in-memory store for local testing and initial preview
const fallbackWaitlist: WaitlistEntry[] = [
  {
    id: 'f-1',
    x_id: 'seed_1',
    x_handle: 'MineMaster99',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner1',
    wallet: '0x1234567890123456789012345678901234567890',
    ref_code: 'goldrush1',
    referrals: 48,
    points: 250,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'f-2',
    x_id: 'seed_2',
    x_handle: 'TunnelRat',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner2',
    wallet: '0x2345678901234567890123456789012345678901',
    ref_code: 'pickaxe2',
    referrals: 36,
    points: 190,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'f-3',
    x_id: 'seed_3',
    x_handle: 'DeepDriller',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner3',
    wallet: '0x3456789012345678901234567890123456789012',
    ref_code: 'dynamite',
    referrals: 29,
    points: 155,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'f-4',
    x_id: 'seed_4',
    x_handle: 'RobinhoodApe',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner4',
    wallet: '0x4567890123456789012345678901234567890123',
    ref_code: 'hoodchain',
    referrals: 21,
    points: 115,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'f-5',
    x_id: 'seed_5',
    x_handle: 'PixelMinerX',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner5',
    wallet: '0x5678901234567890123456789012345678901234',
    ref_code: 'burrow88',
    referrals: 19,
    points: 105,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'f-6',
    x_id: 'seed_6',
    x_handle: 'OreCrusher',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner6',
    wallet: '0x6789012345678901234567890123456789012345',
    ref_code: 'crusher7',
    referrals: 15,
    points: 85,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'f-7',
    x_id: 'seed_7',
    x_handle: 'SatoshiSpade',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner7',
    wallet: '0x7890123456789012345678901234567890123456',
    ref_code: 'spade404',
    referrals: 12,
    points: 70,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'f-8',
    x_id: 'seed_8',
    x_handle: 'CaveDweller',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner8',
    wallet: '0x8901234567890123456789012345678901234567',
    ref_code: 'darkcave',
    referrals: 9,
    points: 55,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'f-9',
    x_id: 'seed_9',
    x_handle: 'GoldVein',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner9',
    wallet: '0x9012345678901234567890123456789012345678',
    ref_code: 'veinfinder',
    referrals: 7,
    points: 45,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'f-10',
    x_id: 'seed_10',
    x_handle: 'LanternGlow',
    x_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=miner10',
    wallet: '0xa123456789012345678901234567890123456789',
    ref_code: 'lampflame',
    referrals: 5,
    points: 35,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
];

/**
 * The in-memory store is ONLY for local development. In production a missing
 * Supabase config is an error — otherwise sign-ups silently vanish on restart.
 */
const useDb = isSupabaseConfigured && Boolean(supabaseAdmin);
const isProd = process.env.NODE_ENV === 'production';

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('The waitlist database is not configured yet. Please try again shortly.');
    this.name = 'StorageNotConfiguredError';
  }
}

export class DuplicateEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEntryError';
  }
}

function assertStorageReady() {
  if (!useDb && isProd) throw new StorageNotConfiguredError();
}

export function maskWallet(wallet: string): string {
  return wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '';
}

function sortByRank(a: WaitlistEntry, b: WaitlistEntry) {
  return b.points !== a.points
    ? b.points - a.points
    : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

// Helper to calculate rank given points & created_at
function calculateRank(points: number, createdAt: string, all: WaitlistEntry[]): number {
  const higher = all.filter((item) => {
    if (item.points > points) return true;
    if (item.points === points && new Date(item.created_at) < new Date(createdAt)) return true;
    return false;
  });
  return higher.length + 1;
}

async function findOne(column: 'x_id' | 'wallet' | 'ref_code', value: string): Promise<WaitlistEntry | null> {
  assertStorageReady();
  if (useDb) {
    const { data, error } = await supabaseAdmin!.from('waitlist').select('*').eq(column, value).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
  return fallbackWaitlist.find((e) => String(e[column] ?? '').toLowerCase() === value.toLowerCase()) || null;
}

export const findByXId = (xId: string) => findOne('x_id', xId);
export const findByWallet = (wallet: string) => findOne('wallet', wallet.toLowerCase());
export const findByRefCode = (refCode: string) => findOne('ref_code', refCode);

/** Position in line: rows with more points, or equal points and an earlier sign-up, plus one. */
export async function getPosition(entry: Pick<WaitlistEntry, 'points' | 'created_at'>): Promise<number> {
  assertStorageReady();
  if (useDb) {
    const { count, error } = await supabaseAdmin!
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .or(`points.gt.${entry.points},and(points.eq.${entry.points},created_at.lt.${entry.created_at})`);
    if (error) throw new Error(error.message);
    return (count || 0) + 1;
  }
  return calculateRank(entry.points, entry.created_at, fallbackWaitlist);
}

export async function joinWaitlist({
  xId,
  xHandle,
  xAvatar,
  wallet,
  refCode,
  referredBy,
}: {
  xId: string;
  xHandle: string;
  xAvatar?: string | null;
  wallet: string;
  refCode: string;
  referredBy?: string | null;
}): Promise<{ entry: WaitlistEntry; position: number }> {
  assertStorageReady();
  const normalizedWallet = wallet.toLowerCase();
  const cleanHandle = xHandle.replace(/^@/, '');
  const startingPoints = BURROW_CONFIG.referral.startingPoints;

  if (useDb) {
    const { data: newEntry, error } = await supabaseAdmin!
      .from('waitlist')
      .insert({
        x_id: xId,
        x_handle: cleanHandle,
        x_avatar: xAvatar || null,
        wallet: normalizedWallet,
        ref_code: refCode,
        referred_by: referredBy || null,
        referrals: 0,
        points: startingPoints,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new DuplicateEntryError(
          error.message.includes('wallet')
            ? 'This wallet is already on the waitlist.'
            : 'This X account is already on the waitlist.'
        );
      }
      if (error.code === 'PGRST205' || error.code === '42P01') {
        throw new Error("Supabase table 'waitlist' has not been created yet. Run supabase/schema.sql in the Supabase SQL Editor.");
      }
      throw new Error(error.message);
    }

    // A referral only counts now: the new miner has finished X sign-in AND wallet signing
    if (referredBy) {
      const { error: rpcErr } = await supabaseAdmin!.rpc('credit_referrer', { code: referredBy });
      if (rpcErr) console.warn('credit_referrer failed:', rpcErr.message);
    }

    invalidateStatsCache();
    return { entry: newEntry, position: await getPosition(newEntry) };
  }

  // Dev-only in-memory store
  if (fallbackWaitlist.some((e) => e.x_id === xId)) throw new DuplicateEntryError('This X account is already on the waitlist.');
  if (fallbackWaitlist.some((e) => e.wallet.toLowerCase() === normalizedWallet)) {
    throw new DuplicateEntryError('This wallet is already on the waitlist.');
  }

  const newEntry: WaitlistEntry = {
    id: `entry-${Date.now()}`,
    x_id: xId,
    x_handle: cleanHandle,
    x_avatar: xAvatar || null,
    wallet: normalizedWallet,
    ref_code: refCode,
    referred_by: referredBy || null,
    referrals: 0,
    points: startingPoints,
    created_at: new Date().toISOString(),
  };

  if (referredBy) {
    const referrer = fallbackWaitlist.find((e) => e.ref_code === referredBy);
    if (referrer) {
      referrer.referrals += 1;
      referrer.points += BURROW_CONFIG.referral.pointsPerReferral;
    }
  }

  fallbackWaitlist.unshift(newEntry);
  invalidateStatsCache();
  return { entry: newEntry, position: calculateRank(newEntry.points, newEntry.created_at, fallbackWaitlist) };
}

/* ─────────── Stats: real count + top 10, cached 30s per instance ─────────── */

export interface LeaderboardRow {
  id: string;
  x_handle: string;
  x_avatar?: string | null;
  wallet: string; // masked
  points: number;
  referrals: number;
  created_at: string;
  rank: number;
}

export interface WaitlistStats {
  totalSignups: number;
  leaderboard: LeaderboardRow[];
  isLiveDb: boolean;
}

const STATS_TTL_MS = 30_000;
let statsCache: { at: number; data: WaitlistStats } | null = null;

function invalidateStatsCache() {
  statsCache = null;
}

export async function getLeaderboardAndStats(): Promise<WaitlistStats> {
  if (statsCache && Date.now() - statsCache.at < STATS_TTL_MS) return statsCache.data;
  assertStorageReady();

  let data: WaitlistStats;

  if (useDb) {
    const [countRes, topRes] = await Promise.all([
      supabaseAdmin!.from('waitlist').select('id', { count: 'exact', head: true }),
      supabaseAdmin!
        .from('waitlist')
        .select('id, x_handle, x_avatar, wallet, points, referrals, created_at')
        .order('points', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10),
    ]);
    if (countRes.error) throw new Error(countRes.error.message);
    if (topRes.error) throw new Error(topRes.error.message);

    data = {
      totalSignups: countRes.count || 0,
      leaderboard: (topRes.data || []).map((item, index) => ({
        ...item,
        wallet: maskWallet(item.wallet),
        rank: index + 1,
      })),
      isLiveDb: true,
    };
  } else {
    data = {
      totalSignups: fallbackWaitlist.length,
      leaderboard: [...fallbackWaitlist].sort(sortByRank).slice(0, 10).map((item, index) => ({
        id: item.id,
        x_handle: item.x_handle,
        x_avatar: item.x_avatar,
        wallet: maskWallet(item.wallet),
        points: item.points,
        referrals: item.referrals,
        created_at: item.created_at,
        rank: index + 1,
      })),
      isLiveDb: false,
    };
  }

  statsCache = { at: Date.now(), data };
  return data;
}

export async function getAllWaitlistForExport(): Promise<WaitlistEntry[]> {
  assertStorageReady();
  if (useDb) {
    // Page through results so exports beyond 1,000 rows are complete
    const pageSize = 1000;
    const all: WaitlistEntry[] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabaseAdmin!
        .from('waitlist')
        .select('*')
        .order('points', { ascending: false })
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      all.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return all.map((item, index) => ({ ...item, rank: index + 1 }));
  }

  return [...fallbackWaitlist].sort(sortByRank).map((item, index) => ({ ...item, rank: index + 1 }));
}
