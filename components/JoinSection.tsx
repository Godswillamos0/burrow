'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/audio';
import { BURROW_CONFIG } from '@/lib/config';
import { MinerIdCard, getAvatarUrl } from './MinerIdCard';
import {
  Twitter, Wallet, CheckCircle, Copy, AlertCircle, ArrowRight,
  ShieldCheck, RefreshCw, Heart, Repeat2, MessageCircle, UserPlus, ExternalLink,
} from 'lucide-react';

interface WaitlistEntryState {
  id: string;
  x_id: string;
  x_handle: string;
  x_avatar?: string;
  wallet: string;
  ref_code: string;
  rank?: number;
}

interface JoinSectionProps {
  onJoinSuccess: (entry: WaitlistEntryState, position: number) => void;
  referralCodeFromCookie?: string | null;
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  follow:  <UserPlus size={16} />,
  like:    <Heart size={16} />,
  repost:  <Repeat2 size={16} />,
  comment: <MessageCircle size={16} />,
};

export function JoinSection({ onJoinSuccess, referralCodeFromCookie }: JoinSectionProps) {
  const [joinedUser, setJoinedUser] = useState<WaitlistEntryState | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [tasksCompleted, setTasksCompleted] = useState<Record<string, boolean>>({});

  // Step form states
  const [xHandle, setXHandle] = useState('');
  const [xUser, setXUser] = useState<{ id: string; handle: string } | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reload from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('burrow_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setJoinedUser(parsed.entry);
        setUserRank(parsed.position || 1);
        setTasksCompleted(parsed.tasks || {});
      }
    } catch {}
  }, []);

  // Persist task progress so it survives reloads
  useEffect(() => {
    if (!joinedUser) return;
    try {
      localStorage.setItem('burrow_user_session', JSON.stringify({
        entry: joinedUser, position: userRank, tasks: tasksCompleted,
      }));
    } catch {}
  }, [joinedUser, userRank, tasksCompleted]);

  /* ───────────── STEP 1: X connect ───────────── */
  const handleConnectX = () => {
    sounds.playClick();
    const h = xHandle.trim().replace(/^@/, '');
    if (!h) { setErrorMessage('Enter your X handle first.'); return; }
    setXUser({ id: `x_${h.toLowerCase()}`, handle: h });
    setErrorMessage(null);
  };

  /* ───────────── STEP 2: Wallet ───────────── */
  const handleConnectBrowserWallet = async () => {
    sounds.playClick();
    setIsWalletConnecting(true);
    setErrorMessage(null);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts?.length > 0) { setWalletAddress(accounts[0]); sounds.playCoin(); }
      } else {
        setErrorMessage('No Web3 wallet detected. Paste your 0x EVM address below.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Wallet connection failed');
    } finally { setIsWalletConnecting(false); }
  };

  /* ───────────── STEP 3: Social Tasks ───────────── */
  const handleDoTask = (taskId: string, url: string) => {
    sounds.playClick();
    window.open(url, '_blank');
    // Mark as done after clicking (trust-based like most waitlists)
    setTimeout(() => {
      setTasksCompleted(prev => ({ ...prev, [taskId]: true }));
    }, 1500);
  };

  /* ───────────── STEP 4: Submit ───────────── */
  const handleJoin = async () => {
    if (!xUser) { setErrorMessage('Connect your X account first.'); sounds.playError(); return; }
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setErrorMessage('Enter a valid EVM wallet address (0x...).'); sounds.playError(); return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sounds.playClick();

    try {
      const nonceRes = await fetch('/api/nonce');
      const { nonce } = await nonceRes.json();

      let signature: string | undefined;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const msg = `Join the Burrow waitlist\nX: @${xUser.handle}\nWallet: ${walletAddress.toLowerCase()}\nNonce: ${nonce}`;
          const selected = (window as any).ethereum.selectedAddress;
          if (selected?.toLowerCase() === walletAddress.toLowerCase()) {
            signature = await (window as any).ethereum.request({ method: 'personal_sign', params: [msg, walletAddress] });
          }
        } catch {}
      }

      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xId: xUser.id,
          xHandle: xUser.handle,
          xAvatar: getAvatarUrl(xUser.handle),
          wallet: walletAddress,
          signature,
          nonce,
          referredBy: referralCodeFromCookie,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Join failed');

      sounds.playVictory();
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#fbbf24','#f97316','#ffffff'] });
      } catch {}

      setJoinedUser(result.entry);
      setUserRank(result.position);
      localStorage.setItem('burrow_user_session', JSON.stringify({
        entry: result.entry, position: result.position, tasks: tasksCompleted,
      }));
      onJoinSuccess(result.entry, result.position);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Try again.');
      sounds.playError();
    } finally { setIsLoading(false); }
  };

  const getReferralUrl = () => {
    if (!joinedUser) return '';
    return typeof window !== 'undefined'
      ? `${window.location.origin}/r/${joinedUser.ref_code}`
      : `https://burrow.xyz/r/${joinedUser.ref_code}`;
  };

  const handleCopyLink = () => {
    sounds.playCopy();
    navigator.clipboard.writeText(getReferralUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = () => {
    sounds.playClick();
    localStorage.removeItem('burrow_user_session');
    setJoinedUser(null); setXUser(null); setWalletAddress('');
    setUserRank(null); setTasksCompleted({});
  };

  /* ══════════════════════════════════════════
     JOINED STATE — Miner Permit + Tasks
  ══════════════════════════════════════════ */
  if (joinedUser) {
    return (
      <div id="join-section" className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Miner ID Card with real PFP */}
        <MinerIdCard
          handle={joinedUser.x_handle}
          wallet={joinedUser.wallet}
          rank={userRank || 1}
          refCode={joinedUser.ref_code}
          tasksCompleted={tasksCompleted}
        />

        {/* Social Tasks */}
        <div className="bg-burrow-card border-4 border-burrow-border p-5 shadow-pixel-sm">
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
                    done
                      ? 'bg-emerald-950/40 border-emerald-600'
                      : 'bg-burrow-surface border-burrow-border'
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
                      {task.required && !done && (
                        <p className="text-[9px] font-silkscreen text-orange-400">Required</p>
                      )}
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
                    {done ? '✓ DONE' : (
                      <><ExternalLink size={12} /> DO IT</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Task completion banner */}
          {BURROW_CONFIG.tasks.filter(t => t.required).every(t => tasksCompleted[t.id]) && (
            <div className="mt-4 p-3 bg-amber-950/60 border-2 border-amber-500 text-amber-300 font-silkscreen text-xs text-center">
              🎉 All required tasks done! Your spot is <span className="font-pixel text-amber-200">PENDING REVIEW</span> by the Burrow team.
            </div>
          )}
        </div>

        {/* Referral Link */}
        <div className="bg-burrow-card border-4 border-burrow-border p-5 shadow-pixel-sm">
          <label className="block text-[11px] font-pixel text-burrow-cream mb-2">
            YOUR REFERRAL LINK — Share to recruit more miners:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text" readOnly value={getReferralUrl()}
              className="flex-1 bg-burrow-darkest border-2 border-burrow-border px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
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
            <button onClick={handleLogout} className="text-[10px] font-pixel text-burrow-muted hover:text-red-400 underline">
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     REGISTRATION FORM
  ══════════════════════════════════════════ */
  return (
    <div id="join-section" className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-burrow-surface border-4 border-burrow-border shadow-pixel-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-burrow-gold text-black font-pixel text-[10px] px-3 py-1 mb-2 font-bold shadow-pixel-sm">
            CLAIM YOUR ALLOWLIST SPOT
          </div>
          <h2 className="font-pixel text-xl sm:text-2xl text-burrow-cream mb-2">JOIN THE BURROW WAITLIST</h2>
          <p className="font-silkscreen text-xs text-burrow-muted">
            Complete the steps below to secure your free miner allowlist spot.
          </p>
          {referralCodeFromCookie && (
            <div className="mt-3 inline-block bg-amber-950/60 border border-burrow-gold/50 px-3 py-1 text-[11px] font-pixel text-burrow-gold">
              🎁 Referred by miner: #{referralCodeFromCookie}
            </div>
          )}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-5 p-3 bg-red-950/80 border-2 border-red-500 flex items-start gap-2 text-red-300 text-xs font-silkscreen">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errorMessage}
          </div>
        )}

        {/* STEP 1 — X Account */}
        <div className="mb-5 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-6 h-6 flex items-center justify-center font-pixel text-xs border ${
              xUser ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-burrow-card text-burrow-gold border-burrow-gold'
            }`}>
              {xUser ? '✓' : '1'}
            </span>
            <span className="font-pixel text-xs sm:text-sm text-burrow-cream">CONNECT X (TWITTER) ACCOUNT</span>
          </div>

          {!xUser ? (
            <div className="space-y-3">
              <p className="text-[11px] font-silkscreen text-burrow-muted">Enter your X handle to verify your identity.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-burrow-muted font-mono text-sm">@</span>
                  <input
                    type="text"
                    placeholder="your_handle"
                    value={xHandle}
                    onChange={e => setXHandle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConnectX()}
                    className="w-full bg-burrow-card border-2 border-burrow-border pl-8 pr-3 py-2 text-xs font-mono text-burrow-cream focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleConnectX}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-pixel text-xs border-2 border-sky-300 shadow-pixel flex items-center justify-center gap-2 font-bold"
                >
                  <Twitter size={15} /> CONNECT X
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-burrow-card border border-burrow-border">
              <div className="flex items-center gap-3">
                {/* Real PFP via unavatar.io */}
                <img
                  src={getAvatarUrl(xUser.handle)}
                  alt={xUser.handle}
                  className="w-10 h-10 border border-burrow-gold bg-burrow-darkest object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${xUser.handle}`; }}
                />
                <div>
                  <div className="font-pixel text-xs text-burrow-cream">@{xUser.handle}</div>
                  <div className="text-[9px] font-silkscreen text-burrow-muted">X Account Linked</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://x.com/intent/follow?screen_name=BurrowRH`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-2 py-1 text-[10px] font-pixel border border-sky-400 text-sky-400 hover:bg-sky-900/30 flex items-center gap-1"
                  onClick={() => sounds.playClick()}
                >
                  <Twitter size={11} /> FOLLOW @BurrowRH
                </a>
                <button
                  onClick={() => { sounds.playClick(); setXUser(null); }}
                  className="text-[10px] font-silkscreen text-burrow-muted hover:text-red-400 underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 — Wallet */}
        <div className="mb-5 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-6 h-6 flex items-center justify-center font-pixel text-xs border ${
              walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress)
                ? 'bg-emerald-500 text-black border-emerald-400'
                : 'bg-burrow-card text-burrow-gold border-burrow-gold'
            }`}>
              {walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress) ? '✓' : '2'}
            </span>
            <span className="font-pixel text-xs sm:text-sm text-burrow-cream">EVM WALLET (ROBINHOOD CHAIN)</span>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-silkscreen text-burrow-muted">
              Connect your wallet or paste any standard EVM address. Signing is free — no gas.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="0x..."
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value.trim())}
                className="flex-1 bg-burrow-card border-2 border-burrow-border px-3 py-2 text-xs font-mono text-amber-200 focus:border-burrow-gold focus:outline-none"
              />
              <button
                onClick={handleConnectBrowserWallet}
                disabled={isWalletConnecting}
                className="px-4 py-2 bg-burrow-surface hover:bg-burrow-card border-2 border-burrow-border hover:border-burrow-gold text-burrow-cream font-pixel text-xs shadow-pixel flex items-center justify-center gap-2"
              >
                <Wallet size={14} />
                {isWalletConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
              </button>
            </div>
          </div>
        </div>

        {/* STEP 3 — Social Tasks Preview */}
        <div className="mb-6 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 flex items-center justify-center font-pixel text-xs border bg-burrow-card text-burrow-gold border-burrow-gold">3</span>
            <span className="font-pixel text-xs sm:text-sm text-burrow-cream">COMPLETE SOCIAL TASKS</span>
          </div>
          <p className="text-[11px] font-silkscreen text-burrow-muted mb-3">
            After joining you'll need to follow, like, repost and comment on <span className="text-sky-400">@BurrowRH</span> to activate your spot.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BURROW_CONFIG.tasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 p-2 bg-burrow-surface/50 border border-burrow-border text-[10px] font-silkscreen text-burrow-muted">
                {TASK_ICONS[task.id]}
                <span>{task.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          disabled={isLoading || !xUser || !walletAddress}
          onClick={handleJoin}
          className={`w-full py-4 px-6 font-pixel text-sm border-4 shadow-pixel-lg flex items-center justify-center gap-3 transition-all ${
            !xUser || !walletAddress
              ? 'bg-burrow-card text-burrow-muted border-burrow-border cursor-not-allowed opacity-60'
              : 'bg-burrow-gold hover:bg-yellow-400 text-black border-amber-200 active:translate-y-1 font-bold'
          }`}
        >
          {isLoading ? (
            <><RefreshCw size={18} className="animate-spin" /> VERIFYING & JOINING...</>
          ) : (
            <><ShieldCheck size={20} /> CLAIM ALLOWLIST SPOT <ArrowRight size={18} /></>
          )}
        </button>
        <p className="text-[10px] font-silkscreen text-burrow-muted text-center mt-3">
          1 spot per wallet & X account. Spots are PENDING until tasks are verified.
        </p>
      </div>
    </div>
  );
}
