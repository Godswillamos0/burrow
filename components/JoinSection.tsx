'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { sounds } from '@/lib/audio';
import { BURROW_CONFIG } from '@/lib/config';
import { buildSignMessage } from '@/lib/signMessage';
import { getSupabaseBrowser, isXSignInAvailable, X_PROVIDER, xProfileFromUser, type XProfile } from '@/lib/supabaseBrowser';
import { MinerIdCard, getAvatarUrl } from './MinerIdCard';
import { Turnstile, TURNSTILE_SITE_KEY, type TurnstileHandle } from './Turnstile';
import {
  Twitter, Wallet, CheckCircle, Copy, AlertCircle, ArrowRight,
  ShieldCheck, RefreshCw, Heart, Repeat2, MessageCircle, UserPlus, ExternalLink, LogOut,
} from 'lucide-react';

interface WaitlistEntryState {
  id: string;
  x_handle: string;
  x_avatar?: string | null;
  wallet: string;
  ref_code: string;
}

interface JoinSectionProps {
  onJoinSuccess: (entry: WaitlistEntryState, position: number) => void;
  referralCodeFromCookie?: string | null;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  follow: <UserPlus size={16} />,
  like: <Heart size={16} />,
  repost: <Repeat2 size={16} />,
  comment: <MessageCircle size={16} />,
};

const SESSION_KEY = 'burrow_user_session';
const tasksKey = (handle: string) => `burrow_tasks_${handle.toLowerCase()}`;

function loadTasks(handle: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(tasksKey(handle)) || '{}');
  } catch {
    return {};
  }
}

export function JoinSection({ onJoinSuccess, referralCodeFromCookie }: JoinSectionProps) {
  const supabase = getSupabaseBrowser();

  const [joinedUser, setJoinedUser] = useState<WaitlistEntryState | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [tasksCompleted, setTasksCompleted] = useState<Record<string, boolean>>({});

  // X identity
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [xProfile, setXProfile] = useState<XProfile | null>(null);
  const [devHandle, setDevHandle] = useState(''); // local dev only (no Supabase)
  const [isCheckingSession, setIsCheckingSession] = useState(isXSignInAvailable);

  // Wallet
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  // Bot check
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showJoined = useCallback((entry: WaitlistEntryState, position: number) => {
    setJoinedUser(entry);
    setUserRank(position);
    setTasksCompleted(loadTasks(entry.x_handle));
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ entry, position }));
    } catch {}
  }, []);

  /* ───────────── Restore session ───────────── */
  useEffect(() => {
    // Fast path: last known joined state on this device
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.entry?.ref_code) showJoined(parsed.entry, parsed.position || 1);
      }
    } catch {}

    if (!supabase) return;

    const applySession = async (token: string | null, user: any) => {
      setAccessToken(token);
      setXProfile(token ? xProfileFromUser(user) : null);
      if (!token) {
        setIsCheckingSession(false);
        return;
      }
      // Source of truth: is this X account already on the list?
      try {
        const res = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.entry) showJoined(data.entry, data.position);
        }
      } catch {}
      setIsCheckingSession(false);
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session?.access_token ?? null, data.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        applySession(session?.access_token ?? null, session?.user);
      } else if (event === 'TOKEN_REFRESHED') {
        setAccessToken(session?.access_token ?? null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, showJoined]);

  // Persist task progress per handle
  useEffect(() => {
    if (!joinedUser) return;
    try {
      localStorage.setItem(tasksKey(joinedUser.x_handle), JSON.stringify(tasksCompleted));
    } catch {}
  }, [joinedUser, tasksCompleted]);

  const handle = xProfile?.handle || (!isXSignInAvailable ? devHandle.trim().replace(/^@/, '') : '');
  const xReady = isXSignInAvailable ? Boolean(accessToken && xProfile) : /^[A-Za-z0-9_]{1,15}$/.test(handle);
  const walletReady = isConnected && Boolean(address);
  const botReady = !TURNSTILE_SITE_KEY || Boolean(turnstileToken);
  const canSubmit = xReady && walletReady && botReady && !isLoading;

  /* ───────────── STEP 1: Sign in with X ───────────── */
  const handleSignInWithX = async () => {
    sounds.playClick();
    setErrorMessage(null);
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: X_PROVIDER,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setErrorMessage(error.message);
      sounds.playError();
    }
  };

  /* ───────────── STEP 3: Social tasks (trust-based) ───────────── */
  const handleDoTask = (taskId: string, url: string) => {
    sounds.playClick();
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setTasksCompleted((prev) => ({ ...prev, [taskId]: true })), 1500);
  };

  /* ───────────── Submit: nonce → sign → join ───────────── */
  const handleJoin = async () => {
    if (!canSubmit || !address) return;
    setIsLoading(true);
    setErrorMessage(null);
    sounds.playClick();

    try {
      setStatusText('Requesting signature…');
      const nonceRes = await fetch('/api/nonce', { cache: 'no-store' });
      const { nonce } = await nonceRes.json();

      const message = buildSignMessage(handle, address, nonce);
      setStatusText('Check your wallet and sign (free, no gas)…');
      let signature: string;
      try {
        signature = await signMessageAsync({ message, account: address });
      } catch {
        throw new Error('Signature cancelled. You need to sign the message to prove you own this wallet.');
      }

      setStatusText('Joining the waitlist…');
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          wallet: address,
          signature,
          nonce,
          turnstileToken,
          referredBy: referralCodeFromCookie,
          ...(isXSignInAvailable ? {} : { xHandle: handle }),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Join failed');

      sounds.playVictory();
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24', '#f97316', '#ffffff'] });
      } catch {}

      showJoined(result.entry, result.position);
      onJoinSuccess(result.entry, result.position);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Try again.');
      sounds.playError();
      turnstileRef.current?.reset(); // Turnstile tokens are single-use
    } finally {
      setIsLoading(false);
      setStatusText(null);
    }
  };

  const getReferralUrl = () => {
    if (!joinedUser) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || '';
    return `${origin}/r/${joinedUser.ref_code}`;
  };

  const handleCopyLink = async () => {
    sounds.playCopy();
    try {
      await navigator.clipboard.writeText(getReferralUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleLogout = async () => {
    sounds.playClick();
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    await supabase?.auth.signOut();
    disconnect();
    setJoinedUser(null);
    setUserRank(null);
    setTasksCompleted({});
    setAccessToken(null);
    setXProfile(null);
  };

  /* ══════════════════════════════════════════
     JOINED STATE — Miner Permit + Tasks
  ══════════════════════════════════════════ */
  if (joinedUser) {
    const requiredDone = BURROW_CONFIG.tasks.filter((t) => t.required).every((t) => tasksCompleted[t.id]);
    return (
      <div id="join-section" className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="text-center">
          <p className="font-silkscreen text-xs text-burrow-muted">YOU&apos;RE IN THE MINES</p>
          <h2 className="font-pixel text-lg sm:text-2xl text-burrow-cream mt-1">
            You&apos;re miner <span className="text-burrow-gold">#{(userRank || 1).toLocaleString()}</span>
          </h2>
        </div>

        <MinerIdCard
          handle={joinedUser.x_handle}
          avatar={joinedUser.x_avatar}
          wallet={joinedUser.wallet}
          rank={userRank || 1}
          refCode={joinedUser.ref_code}
          tasksCompleted={tasksCompleted}
        />

        {/* Social Tasks */}
        <div className="bg-burrow-card border-4 border-burrow-border p-4 sm:p-5 shadow-pixel-sm">
          <h3 className="font-pixel text-xs sm:text-sm text-burrow-cream mb-1">REQUIRED TASKS</h3>
          <p className="font-silkscreen text-[11px] text-burrow-muted mb-4">
            Complete all tasks to move your status from <span className="text-orange-400">PENDING</span> to approved.
          </p>

          <div className="space-y-3">
            {BURROW_CONFIG.tasks.map((task) => {
              const done = !!tasksCompleted[task.id];
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-3 p-3 border-2 transition-colors ${
                    done ? 'bg-emerald-950/40 border-emerald-600' : 'bg-burrow-surface border-burrow-border'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={done ? 'text-emerald-400' : 'text-burrow-muted'}>
                      {done ? <CheckCircle size={18} /> : TASK_ICONS[task.id]}
                    </span>
                    <div>
                      <p className={`font-pixel text-[11px] sm:text-xs leading-snug ${done ? 'text-emerald-400' : 'text-burrow-cream'}`}>
                        {task.label}
                      </p>
                      {task.required && !done && <p className="text-[9px] font-silkscreen text-orange-400">Required</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDoTask(task.id, task.url)}
                    className={`px-3 py-1.5 font-pixel text-[10px] border shadow-pixel-sm flex items-center gap-1.5 transition-transform active:translate-y-0.5 whitespace-nowrap ${
                      done
                        ? 'bg-emerald-800/50 border-emerald-600 text-emerald-300'
                        : 'bg-sky-500 border-sky-300 text-black hover:bg-sky-400 font-bold'
                    }`}
                  >
                    {done ? '✓ DONE' : (<><ExternalLink size={12} /> DO IT</>)}
                  </button>
                </div>
              );
            })}
          </div>

          {requiredDone && (
            <div className="mt-4 p-3 bg-amber-950/60 border-2 border-amber-500 text-amber-300 font-silkscreen text-xs text-center">
              🎉 All required tasks done! Your spot is <span className="font-pixel text-amber-200">PENDING REVIEW</span> by the Burrow team.
            </div>
          )}
        </div>

        {/* Referral Link */}
        <div className="bg-burrow-card border-4 border-burrow-border p-4 sm:p-5 shadow-pixel-sm">
          <label className="block text-[11px] font-pixel text-burrow-cream mb-2">
            YOUR REFERRAL LINK — share it to move up the line:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={getReferralUrl()}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 bg-burrow-darkest border-2 border-burrow-border px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-5 py-2.5 bg-burrow-gold hover:bg-yellow-400 text-black font-pixel text-xs border-2 border-amber-200 shadow-pixel flex items-center justify-center gap-1.5 font-bold transition-transform active:translate-y-0.5"
            >
              <Copy size={14} />
              {copiedLink ? 'COPIED!' : 'COPY'}
            </button>
          </div>
          <div className="flex items-center justify-end mt-3">
            <button onClick={handleLogout} className="text-[10px] font-pixel text-burrow-muted hover:text-red-400 underline flex items-center gap-1">
              <LogOut size={11} /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     REGISTRATION FORM
  ══════════════════════════════════════════ */
  const stepBadge = (done: boolean, n: number) => (
    <span
      className={`w-6 h-6 shrink-0 flex items-center justify-center font-pixel text-xs border ${
        done ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-burrow-card text-burrow-gold border-burrow-gold'
      }`}
    >
      {done ? '✓' : n}
    </span>
  );

  return (
    <div id="join-section" className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-burrow-surface border-4 border-burrow-border shadow-pixel-lg p-4 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-burrow-gold text-black font-pixel text-[10px] px-3 py-1 mb-2 font-bold shadow-pixel-sm">
            CLAIM YOUR ALLOWLIST SPOT
          </div>
          <h2 className="font-pixel text-lg sm:text-2xl text-burrow-cream mb-2">JOIN THE BURROW WAITLIST</h2>
          <p className="font-silkscreen text-xs text-burrow-muted">Sign in with X → Connect wallet → Share your link.</p>
          {referralCodeFromCookie && (
            <div className="mt-3 inline-block bg-amber-950/60 border border-burrow-gold/50 px-3 py-1 text-[11px] font-pixel text-burrow-gold">
              🎁 Invited by miner #{referralCodeFromCookie}
            </div>
          )}
        </div>

        {errorMessage && (
          <div role="alert" className="mb-5 p-3 bg-red-950/80 border-2 border-red-500 flex items-start gap-2 text-red-300 text-xs font-silkscreen">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errorMessage}
          </div>
        )}

        {/* STEP 1 — X Account */}
        <div className="mb-5 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center gap-2 mb-3">
            {stepBadge(xReady, 1)}
            <span className="font-pixel text-xs sm:text-sm text-burrow-cream">SIGN IN WITH X</span>
          </div>

          {xReady && handle ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-burrow-card border border-burrow-border">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={xProfile?.avatar || getAvatarUrl(handle)}
                  alt=""
                  className="w-10 h-10 border border-burrow-gold bg-burrow-darkest object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${handle}`;
                  }}
                />
                <div className="min-w-0">
                  <div className="font-pixel text-xs text-burrow-cream truncate">@{handle}</div>
                  <div className="text-[9px] font-silkscreen text-emerald-400">
                    {isXSignInAvailable ? '✓ Verified X account' : 'Dev mode (not verified)'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://x.com/intent/follow?screen_name=${BURROW_CONFIG.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-[10px] font-pixel border border-sky-400 text-sky-400 hover:bg-sky-900/30 flex items-center gap-1"
                  onClick={() => sounds.playClick()}
                >
                  <Twitter size={11} /> FOLLOW {BURROW_CONFIG.handle}
                </a>
                {isXSignInAvailable && (
                  <button onClick={handleLogout} className="text-[10px] font-silkscreen text-burrow-muted hover:text-red-400 underline">
                    Switch
                  </button>
                )}
              </div>
            </div>
          ) : isXSignInAvailable ? (
            <div className="space-y-3">
              <p className="text-[11px] font-silkscreen text-burrow-muted">
                We use X sign-in to prove you&apos;re a real account. We never post for you.
              </p>
              <button
                onClick={handleSignInWithX}
                disabled={isCheckingSession}
                className="w-full sm:w-auto px-5 py-3 bg-sky-500 hover:bg-sky-400 text-black font-pixel text-xs border-2 border-sky-300 shadow-pixel flex items-center justify-center gap-2 font-bold disabled:opacity-60"
              >
                <Twitter size={15} /> {isCheckingSession ? 'CHECKING…' : 'SIGN IN WITH X'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-silkscreen text-orange-400">
                Local dev mode: Supabase isn&apos;t configured, so X sign-in is replaced by a typed handle.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-burrow-muted font-mono text-sm">@</span>
                <input
                  type="text"
                  placeholder="your_handle"
                  value={devHandle}
                  onChange={(e) => setDevHandle(e.target.value)}
                  className="w-full bg-burrow-card border-2 border-burrow-border pl-8 pr-3 py-2 text-xs font-mono text-burrow-cream focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 — Wallet */}
        <div className="mb-5 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center gap-2 mb-3">
            {stepBadge(walletReady, 2)}
            <span className="font-pixel text-xs sm:text-sm text-burrow-cream">CONNECT EVM WALLET</span>
          </div>
          <p className="text-[11px] font-silkscreen text-burrow-muted mb-3">
            Any EVM wallet works on Robinhood Chain. You&apos;ll sign a free message to prove you own it — no gas, no transaction.
          </p>

          <ConnectButton.Custom>
            {({ account, openConnectModal, openAccountModal, mounted }) => {
              if (!mounted) return <div className="h-11" />;
              return account ? (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-burrow-card border border-burrow-border">
                  <div className="min-w-0">
                    <div className="text-[9px] font-pixel text-burrow-muted">CONNECTED</div>
                    <div className="font-mono text-xs text-sky-300 break-all">{account.address}</div>
                  </div>
                  <button onClick={openAccountModal} className="text-[10px] font-silkscreen text-burrow-muted hover:text-burrow-gold underline">
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sounds.playClick();
                    openConnectModal();
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-burrow-surface hover:bg-burrow-card border-2 border-burrow-border hover:border-burrow-gold text-burrow-cream font-pixel text-xs shadow-pixel flex items-center justify-center gap-2"
                >
                  <Wallet size={14} /> CONNECT WALLET
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {/* STEP 3 — Social tasks preview */}
        <div className="mb-6 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center gap-2 mb-3">
            {stepBadge(false, 3)}
            <span className="font-pixel text-xs sm:text-sm text-burrow-cream">COMPLETE SOCIAL TASKS</span>
          </div>
          <p className="text-[11px] font-silkscreen text-burrow-muted mb-3">
            After joining, follow, like, repost and comment on <span className="text-sky-400">{BURROW_CONFIG.handle}</span> to activate your spot.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BURROW_CONFIG.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 bg-burrow-surface/50 border border-burrow-border text-[10px] font-silkscreen text-burrow-muted">
                {TASK_ICONS[task.id]}
                <span>{task.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bot check */}
        {TURNSTILE_SITE_KEY && (
          <div className="mb-4">
            <Turnstile ref={turnstileRef} onToken={setTurnstileToken} />
          </div>
        )}

        {/* Submit */}
        <button
          disabled={!canSubmit}
          onClick={handleJoin}
          className={`w-full py-4 px-4 font-pixel text-xs sm:text-sm border-4 shadow-pixel-lg flex items-center justify-center gap-3 transition-all ${
            !canSubmit && !isLoading
              ? 'bg-burrow-card text-burrow-muted border-burrow-border cursor-not-allowed opacity-60'
              : 'bg-burrow-gold hover:bg-yellow-400 text-black border-amber-200 active:translate-y-1 font-bold'
          }`}
        >
          {isLoading ? (
            <><RefreshCw size={18} className="animate-spin" /> {statusText || 'WORKING…'}</>
          ) : (
            <><ShieldCheck size={20} /> SIGN &amp; CLAIM SPOT <ArrowRight size={18} /></>
          )}
        </button>
        <p className="text-[10px] font-silkscreen text-burrow-muted text-center mt-3">
          1 spot per wallet &amp; X account. Spots stay PENDING until tasks are verified.
        </p>
      </div>
    </div>
  );
}
