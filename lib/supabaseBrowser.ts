'use client';

import { createClient, type SupabaseClient, type Provider } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isXSignInAvailable = Boolean(url && anonKey && !url.includes('your-project'));

/**
 * Supabase OAuth provider id for X. 'x' is the OAuth 2.0 "X / Twitter" provider;
 * set NEXT_PUBLIC_SUPABASE_X_PROVIDER=twitter if you enabled the legacy OAuth 1.0a one.
 */
export const X_PROVIDER = (process.env.NEXT_PUBLIC_SUPABASE_X_PROVIDER || 'x') as Provider;

let client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isXSignInAvailable) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

export interface XProfile {
  handle: string;
  avatar: string | null;
}

/** Reads the X handle/avatar Supabase stores on the user after X sign-in. */
export function xProfileFromUser(user: { user_metadata?: Record<string, any> } | null | undefined): XProfile | null {
  const meta = user?.user_metadata || {};
  const handle = String(meta.user_name || meta.preferred_username || '').replace(/^@/, '');
  if (!handle) return null;
  const avatar: string | null = meta.avatar_url || meta.picture || null;
  return { handle, avatar: avatar ? avatar.replace('_normal.', '_400x400.') : null };
}
