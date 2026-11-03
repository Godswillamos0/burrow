'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/audio';
import { BURROW_CONFIG } from '@/lib/config';
import { PixelMiner, PixelCoin } from './PixelMinerArt';
import {
  Twitter,
  Wallet,
  CheckCircle,
  Copy,
  Share2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface WaitlistEntryState {
  id: string;
  x_id: string;
  x_handle: string;
  x_avatar?: string;
  wallet: string;
  ref_code: string;
  points: number;
  referrals: number;
  rank?: number;
}

interface JoinSectionProps {
  onJoinSuccess: (entry: WaitlistEntryState, position: number) => void;
  referralCodeFromCookie?: string | null;
}

export function JoinSection({ onJoinSuccess, referralCodeFromCookie }: JoinSectionProps) {
  // Joined state
  const [joinedUser, setJoinedUser] = useState<WaitlistEntryState | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);

  // Form Step States
  const [xUser, setXUser] = useState<{ id: string; handle: string; avatar: string } | null>(null);
  const [customHandleInput, setCustomHandleInput] = useState('');
  const [hasFollowedX, setHasFollowedX] = useState(false);

  // Wallet
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  // Submission
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load stored user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('burrow_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setJoinedUser(parsed.entry);
        setUserRank(parsed.position || parsed.entry.rank || 1284);
      }
    } catch (e) {}
  }, []);

  // X Connection Handlers
  const handleConnectXMock = (handleToUse?: string) => {
    sounds.playClick();
    const handle = (handleToUse || customHandleInput || 'MinerKing').replace(/^@/, '');
    if (!handle.trim()) return;

    const mockXUser = {
      id: `x_${handle.toLowerCase()}`,
      handle: handle,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`,
    };
    setXUser(mockXUser);
    setErrorMessage(null);
  };

  const handleFollowX = () => {
    sounds.playClick();
    window.open(BURROW_CONFIG.xProfileUrl, '_blank');
    setHasFollowedX(true);
  };

  // Wallet Connection Handlers
  const handleConnectBrowserWallet = async () => {
    sounds.playClick();
    setIsWalletConnecting(true);
    setErrorMessage(null);

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          sounds.playCoin();
        }
      } else {
        // Fallback for browsers without Web3 wallet: suggest pasting
        setErrorMessage('No Web3 wallet extension detected. You can paste any 0x EVM address directly below.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect wallet');
    } finally {
      setIsWalletConnecting(false);
    }
  };

  // Submit Join Request
  const handleCompleteJoin = async () => {
    if (!xUser) {
      setErrorMessage('Please connect your X (Twitter) account first.');
      sounds.playError();
      return;
    }

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setErrorMessage('Please enter or connect a valid EVM wallet address (0x...).');
      sounds.playError();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sounds.playClick();

    try {
      // 1. Request nonce
      const nonceRes = await fetch('/api/nonce');
      const { nonce } = await nonceRes.json();

      let signature: string | undefined = undefined;

      // 2. Request signature if injected wallet is active
      if (typeof window !== 'undefined' && (window as any).ethereum && walletAddress) {
        try {
          const message = `Join the Burrow waitlist\nX: @${xUser.handle}\nWallet: ${walletAddress.toLowerCase()}\nNonce: ${nonce}`;
          const currentAccount = (window as any).ethereum.selectedAddress;

          if (currentAccount && currentAccount.toLowerCase() === walletAddress.toLowerCase()) {
            signature = await (window as any).ethereum.request({
              method: 'personal_sign',
              params: [message, walletAddress],
            });
          }
        } catch (signErr) {
          console.warn('Wallet signing skipped or rejected, proceeding with address verification:', signErr);
        }
      }

      // 3. Post to /api/join
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xId: xUser.id,
          xHandle: xUser.handle,
          xAvatar: xUser.avatar,
          wallet: walletAddress,
          signature,
          nonce,
          referredBy: referralCodeFromCookie,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join waitlist');
      }

      // Success! Play fanfare & confetti
      sounds.playVictory();
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#f97316', '#ffffff'],
        });
      } catch (e) {}

      setJoinedUser(result.entry);
      setUserRank(result.position);

      localStorage.setItem(
        'burrow_user_session',
        JSON.stringify({ entry: result.entry, position: result.position })
      );

      onJoinSuccess(result.entry, result.position);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while joining.');
      sounds.playError();
    } finally {
      setIsLoading(false);
    }
  };

  const getReferralUrl = () => {
    if (!joinedUser) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/r/${joinedUser.ref_code}`;
    }
    return `https://burrow.xyz/r/${joinedUser.ref_code}`;
  };

  const handleCopyLink = () => {
    sounds.playCopy();
    navigator.clipboard.writeText(getReferralUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareOnX = () => {
    sounds.playClick();
    const refUrl = getReferralUrl();
    const tweetText = `I just joined the @Burrow waitlist. 2,500 miners, free mint on Robinhood Chain. Dig with me: ${refUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleLogout = () => {
    sounds.playClick();
    localStorage.removeItem('burrow_user_session');
    setJoinedUser(null);
    setXUser(null);
    setWalletAddress('');
    setUserRank(null);
  };

  // -------------------------------------------------------------
  // JOINED STATE / MINER PASS
  // -------------------------------------------------------------
  if (joinedUser) {
    return (
      <div id="join-section" className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-burrow-card border-4 border-burrow-gold shadow-pixel-lg p-6 sm:p-8 relative overflow-hidden">
          {/* Gold banner tag */}
          <div className="absolute top-0 right-0 bg-burrow-gold text-black font-pixel text-[10px] sm:text-xs px-3 py-1 font-bold shadow-pixel-sm">
            VERIFIED MINER PASS
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="relative">
              <PixelMiner size={110} className="filter drop-shadow-[0_4px_12px_rgba(251,191,36,0.4)]" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-pixel text-[9px] px-2 py-0.5 border border-amber-900 shadow-pixel-sm whitespace-nowrap">
                #{userRank || 1} IN LINE
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="font-pixel text-xl sm:text-2xl text-burrow-cream">
                  @{joinedUser.x_handle}
                </h2>
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <p className="font-silkscreen text-xs text-burrow-muted mb-3">
                Wallet: <span className="text-amber-200 font-mono text-[11px]">{joinedUser.wallet.slice(0, 6)}...{joinedUser.wallet.slice(-4)}</span>
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 bg-burrow-surface border-2 border-burrow-border px-3 py-1 text-xs font-pixel text-burrow-cream">
                <Sparkles size={14} className="text-burrow-gold animate-spin" />
                <span>ALLOWLIST STATUS: <span className="text-emerald-400">ACTIVE</span></span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 my-6 p-4 bg-burrow-surface border-2 border-burrow-border text-center">
            <div>
              <p className="text-[10px] font-pixel text-burrow-muted">YOUR RANK</p>
              <p className="font-pixel text-lg sm:text-xl text-burrow-gold mt-1">
                #{userRank || 1}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-pixel text-burrow-muted">REFERRALS</p>
              <p className="font-pixel text-lg sm:text-xl text-emerald-400 mt-1">
                {joinedUser.referrals}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-pixel text-burrow-muted">TOTAL POINTS</p>
              <p className="font-pixel text-lg sm:text-xl text-burrow-cream mt-1">
                {joinedUser.points} <span className="text-xs text-burrow-gold">PTS</span>
              </p>
            </div>
          </div>

          {/* Points Formula Note */}
          <p className="text-[11px] font-silkscreen text-burrow-muted text-center mb-6">
            10 Base Points + 5 Points per successful recruit. Top ranked miners claim Guaranteed Allowlist spots!
          </p>

          {/* Referral Link Box */}
          <div className="mb-6">
            <label className="block text-[11px] font-pixel text-burrow-cream mb-2">
              YOUR EXCLUSIVE REFERRAL LINK:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={getReferralUrl()}
                className="flex-1 bg-burrow-darkest border-2 border-burrow-border px-3 py-2 text-xs font-mono text-amber-300 selection:bg-amber-600 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-burrow-gold hover:bg-yellow-400 text-black font-pixel text-xs border-2 border-amber-200 shadow-pixel transition-transform active:translate-y-0.5 flex items-center justify-center gap-1.5 font-bold"
              >
                <Copy size={14} />
                <span>{copiedLink ? 'COPIED!' : 'COPY'}</span>
              </button>
            </div>
          </div>

          {/* Viral Post on X Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleShareOnX}
              className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-black font-pixel text-xs border-2 border-sky-300 shadow-pixel flex items-center justify-center gap-2 font-bold transition-transform active:translate-y-0.5"
            >
              <Twitter size={16} />
              <span>POST ON X TO RECRUIT (+5 PTS)</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-3 px-4 bg-burrow-surface hover:bg-burrow-card border-2 border-burrow-border text-burrow-muted hover:text-white font-pixel text-[10px] transition-colors"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION STEPS (STEP 1: X -> STEP 2: WALLET -> STEP 3: JOIN)
  // -------------------------------------------------------------
  return (
    <div id="join-section" className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-burrow-surface border-4 border-burrow-border shadow-pixel-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-burrow-gold text-black font-pixel text-[10px] px-3 py-1 mb-2 font-bold shadow-pixel-sm">
            STEP-BY-STEP ALLOWLIST CLAIM
          </div>
          <h2 className="font-pixel text-xl sm:text-2xl text-burrow-cream mb-2">
            JOIN THE BURROW WAITLIST
          </h2>
          <p className="font-silkscreen text-xs text-burrow-muted">
            Complete the 2 quick verification steps below to reserve your miner allowlist spot.
          </p>
          {referralCodeFromCookie && (
            <div className="mt-3 inline-block bg-amber-950/60 border border-burrow-gold/50 px-3 py-1 text-[11px] font-pixel text-burrow-gold">
              🎁 Referred by miner: #{referralCodeFromCookie} (+10 Welcome Points)
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-950/80 border-2 border-red-500 flex items-start gap-2.5 text-red-300 text-xs font-silkscreen">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: X ACCOUNT */}
        <div className="mb-6 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 flex items-center justify-center font-pixel text-xs border ${
                xUser ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-burrow-card text-burrow-gold border-burrow-gold'
              }`}>
                {xUser ? '✓' : '1'}
              </span>
              <span className="font-pixel text-xs sm:text-sm text-burrow-cream">
                CONNECT X (TWITTER) ACCOUNT
              </span>
            </div>
            {xUser && (
              <span className="text-[10px] font-pixel text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} /> VERIFIED
              </span>
            )}
          </div>

          {!xUser ? (
            <div className="space-y-3">
              <p className="text-[11px] font-silkscreen text-burrow-muted">
                Connect your X profile to prevent bot entries and link your social identity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2.5 text-burrow-muted font-mono text-sm">@</span>
                  <input
                    type="text"
                    placeholder="your_x_handle"
                    value={customHandleInput}
                    onChange={(e) => setCustomHandleInput(e.target.value)}
                    className="w-full bg-burrow-card border-2 border-burrow-border pl-8 pr-3 py-2 text-xs font-mono text-burrow-cream focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleConnectXMock()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-pixel text-xs border-2 border-sky-300 shadow-pixel flex items-center justify-center gap-2 font-bold"
                >
                  <Twitter size={15} />
                  <span>SIGN IN WITH X</span>
                </button>
              </div>

              {/* Sample quick picks for fast testing */}
              <div className="flex items-center gap-2 text-[10px] font-silkscreen text-burrow-muted">
                <span>Quick demo handles:</span>
                {['miner_satoshi', 'cave_runner', 'gold_digger'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setCustomHandleInput(h);
                      handleConnectXMock(h);
                    }}
                    className="underline hover:text-burrow-gold"
                  >
                    @{h}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-burrow-card border border-burrow-border">
              <div className="flex items-center gap-3">
                <img
                  src={xUser.avatar}
                  alt={xUser.handle}
                  className="w-9 h-9 border border-burrow-gold bg-burrow-darkest"
                />
                <div>
                  <div className="font-pixel text-xs text-burrow-cream">@{xUser.handle}</div>
                  <div className="text-[10px] font-silkscreen text-burrow-muted">X Account Linked</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFollowX}
                  className={`px-3 py-1.5 text-[10px] font-pixel border shadow-pixel-sm flex items-center gap-1.5 ${
                    hasFollowedX
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                      : 'bg-black/60 border-sky-400 text-sky-400 hover:bg-sky-900/30'
                  }`}
                >
                  <Twitter size={12} />
                  <span>{hasFollowedX ? 'FOLLOWED @BURROW' : 'FOLLOW @BURROW'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setXUser(null);
                  }}
                  className="text-[10px] font-silkscreen text-burrow-muted hover:text-red-400 underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: WALLET ADDRESS */}
        <div className="mb-6 p-4 bg-burrow-darkest/70 border-2 border-burrow-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 flex items-center justify-center font-pixel text-xs border ${
                walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress)
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-burrow-card text-burrow-gold border-burrow-gold'
              }`}>
                {walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress) ? '✓' : '2'}
              </span>
              <span className="font-pixel text-xs sm:text-sm text-burrow-cream">
                EVM WALLET (ROBINHOOD CHAIN)
              </span>
            </div>
            <span className="text-[10px] font-mono text-burrow-muted">
              Chain ID: 4663
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-silkscreen text-burrow-muted">
              Connect your Web3 wallet or paste any standard EVM address. Signing is 100% free with no gas.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value.trim())}
                className="flex-1 bg-burrow-card border-2 border-burrow-border px-3 py-2 text-xs font-mono text-amber-200 focus:border-burrow-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleConnectBrowserWallet}
                disabled={isWalletConnecting}
                className="px-4 py-2 bg-burrow-surface hover:bg-burrow-card border-2 border-burrow-border hover:border-burrow-gold text-burrow-cream font-pixel text-xs shadow-pixel flex items-center justify-center gap-2 transition-colors"
              >
                <Wallet size={15} />
                <span>{isWalletConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}</span>
              </button>
            </div>

            {/* Quick autofill sample wallet for testing */}
            <div className="flex items-center justify-between text-[10px] font-silkscreen text-burrow-muted">
              <span>Standard 0x EVM address</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setWalletAddress('0x71c800a855f46b7059a4b0a6a54b4b91b489a242');
                }}
                className="underline hover:text-burrow-gold"
              >
                Paste Demo 0x Address
              </button>
            </div>
          </div>
        </div>

        {/* STEP 3: SUBMIT JOIN BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isLoading || !xUser || !walletAddress}
            onClick={handleCompleteJoin}
            className={`w-full py-4 px-6 font-pixel text-sm sm:text-base border-4 shadow-pixel-lg flex items-center justify-center gap-3 transition-all ${
              !xUser || !walletAddress
                ? 'bg-burrow-card text-burrow-muted border-burrow-border cursor-not-allowed opacity-60'
                : 'bg-burrow-gold hover:bg-yellow-400 text-black border-amber-200 active:translate-y-1 active:shadow-pixel font-bold'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>VERIFYING & JOINING...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>CLAIM ALLOWLIST SPOT & GET LINK</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
          
          <p className="text-[10px] font-silkscreen text-burrow-muted text-center mt-3">
            By joining, you agree to Robinhood Chain EVM verification rules. 1 spot per wallet & X account.
          </p>
        </div>
      </div>
    </div>
  );
}
