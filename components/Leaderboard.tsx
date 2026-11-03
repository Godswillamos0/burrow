'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '@/lib/audio';
import { PixelCoin } from './PixelMinerArt';
import { Trophy, Medal, Award, Flame, RefreshCw, Crown, Users } from 'lucide-react';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  x_handle: string;
  x_avatar?: string;
  wallet: string;
  points: number;
  referrals: number;
  created_at: string;
}

interface LeaderboardProps {
  initialLeaderboard?: LeaderboardEntry[];
  totalSignups: number;
}

export function Leaderboard({ initialLeaderboard = [], totalSignups }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async (playSound = false) => {
    setIsRefreshing(true);
    if (playSound) sounds.playCoin();
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Error fetching leaderboard stats:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialLeaderboard.length === 0) {
      fetchStats(false);
    }
    // Poll every 30 seconds as specified in the guide
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-400 text-black font-pixel text-xs px-2 py-0.5 border border-yellow-200 shadow-pixel-sm font-bold">
          <Crown size={12} className="fill-black" /> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-300 text-black font-pixel text-xs px-2 py-0.5 border border-slate-100 shadow-pixel-sm font-bold">
          <Medal size={12} /> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-700 text-white font-pixel text-xs px-2 py-0.5 border border-amber-600 shadow-pixel-sm font-bold">
          <Award size={12} /> #3
        </span>
      );
    }
    return (
      <span className="font-pixel text-xs text-burrow-muted">
        #{rank}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-burrow-card border-4 border-burrow-border shadow-pixel-lg p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-burrow-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={20} className="text-burrow-gold" />
              <h3 className="font-pixel text-lg sm:text-xl text-burrow-cream">
                TOP MINERS LEADERBOARD
              </h3>
            </div>
            <p className="font-silkscreen text-xs text-burrow-muted">
              Top referrers earn Guaranteed Mint Passes for the 2,500 worker collection.
            </p>
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-burrow-surface hover:bg-burrow-card border-2 border-burrow-border hover:border-burrow-gold text-burrow-cream text-xs font-pixel shadow-pixel-sm transition-transform active:translate-y-0.5"
            title="Refresh leaderboard"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'REFRESHING' : 'REFRESH'}</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-burrow-border text-[10px] sm:text-xs font-pixel text-burrow-muted">
                <th className="py-2.5 px-3">RANK</th>
                <th className="py-2.5 px-3">MINER</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">WALLET</th>
                <th className="py-2.5 px-3 text-center">RECRUITS</th>
                <th className="py-2.5 px-3 text-right">POINTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burrow-border/60">
              {leaderboard.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-burrow-surface/50 transition-colors text-xs font-silkscreen"
                >
                  {/* Rank */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getRankBadge(item.rank)}
                  </td>

                  {/* Handle & Avatar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.x_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.x_handle}`}
                        alt={item.x_handle}
                        className="w-7 h-7 border border-burrow-gold/40 bg-burrow-darkest shrink-0"
                      />
                      <div>
                        <div className="font-pixel text-xs text-burrow-cream hover:text-burrow-gold">
                          @{item.x_handle}
                        </div>
                        {item.rank <= 3 && (
                          <span className="text-[9px] font-pixel text-emerald-400">
                            ★ GUARANTEED MINT
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Wallet */}
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="font-mono text-[11px] text-burrow-muted">
                      {item.wallet.slice(0, 6)}...{item.wallet.slice(-4)}
                    </span>
                  </td>

                  {/* Referrals */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-pixel text-xs">
                      <Users size={12} />
                      {item.referrals}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-pixel text-xs sm:text-sm text-burrow-gold font-bold">
                      {item.points} <span className="text-[10px] text-burrow-muted">PTS</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t-2 border-burrow-border flex flex-col sm:flex-row items-center justify-between text-[11px] font-silkscreen text-burrow-muted gap-2">
          <div>
            ⚡ Live cached feed (updates every 30s) • Total registered: <span className="text-burrow-gold font-pixel">{totalSignups.toLocaleString()}</span>
          </div>
          <div className="text-emerald-400 font-pixel text-[10px]">
            100% BOT-FILTERED ON-CHAIN
          </div>
        </div>
      </div>
    </div>
  );
}
