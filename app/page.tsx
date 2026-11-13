'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PixelHeader } from '@/components/PixelHeader';
import { HeroBanner } from '@/components/HeroBanner';
import { JoinSection } from '@/components/JoinSection';
import { Leaderboard } from '@/components/Leaderboard';
import { BuggyGame } from '@/components/BuggyGame';
import { FaqSection } from '@/components/FaqSection';
import { PixelFooter } from '@/components/PixelFooter';
import { AdminModal } from '@/components/AdminModal';
import { BURROW_CONFIG } from '@/lib/config';

export default function HomePage() {
  const [totalSignups, setTotalSignups] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [referralCookie, setReferralCookie] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.totalSignups === 'number') setTotalSignups(data.totalSignups);
      if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Live counter + leaderboard: load now, then refresh every 30s while the tab is visible
  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )' + BURROW_CONFIG.referral.cookieName + '=([^;]+)'));
    if (match) setReferralCookie(decodeURIComponent(match[2]));

    loadStats();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadStats();
    }, 30_000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const scrollToJoin = () => {
    const el = document.getElementById('join-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleJoinSuccess = () => {
    setReferralCookie(null);
    loadStats();
  };

  return (
    <div className="min-h-screen flex flex-col scanlines">
      {/* Navigation Header */}
      <PixelHeader onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Hero Banner with Live Urgency Counter & Pixel Miner Art */}
      <HeroBanner
        totalSignups={totalSignups}
        onScrollToJoin={scrollToJoin}
      />

      {/* Step-by-Step Join Section / Miner Allowlist Pass */}
      <JoinSection
        onJoinSuccess={handleJoinSuccess}
        referralCodeFromCookie={referralCookie}
      />

      {/* Playable Buggy Browser Prototype Teaser with 8-bit Sounds */}
      <BuggyGame />

      {/* Live Leaderboard (Top 10 Referrers & Recruits) */}
      <Leaderboard
        initialLeaderboard={leaderboard}
        totalSignups={totalSignups}
      />

      {/* FAQ Intel */}
      <FaqSection />

      {/* Footer & Disclaimer */}
      <PixelFooter />

      {/* Admin Allowlist Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
