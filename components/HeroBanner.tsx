'use client';

import React, { useState } from 'react';
import { PixelMiner, PixelBuggy, PixelCoin, PixelPickaxe } from './PixelMinerArt';
import { sounds } from '@/lib/audio';
import { BURROW_CONFIG } from '@/lib/config';
import { Sparkles, Users, Flame, Pickaxe, ExternalLink } from 'lucide-react';

interface HeroBannerProps {
  totalSignups: number;
  onScrollToJoin: () => void;
}

export function HeroBanner({ totalSignups, onScrollToJoin }: HeroBannerProps) {
  const [clinkCount, setClinkCount] = useState(0);

  const handlePickaxeClick = () => {
    sounds.playPickaxe();
    setClinkCount((prev) => prev + 1);
    if ((clinkCount + 1) % 5 === 0) {
      sounds.playCoin();
    }
  };

  return (
    <div className="relative overflow-hidden pt-8 pb-12 px-4 border-b-4 border-burrow-border bg-gradient-to-b from-burrow-dark via-burrow-darkest to-[#08030e]">
      {/* Underground Cave Rock Background with Ore Veins */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:24px_24px]"></div>
      
      {/* Glowing Warm Lantern Halo in the cave */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
        {/* Urgent Live Waiting Counter */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 mb-6 bg-burrow-card/90 border-2 border-burrow-gold shadow-pixel-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="font-pixel text-xs sm:text-sm text-burrow-cream">
            <span className="text-burrow-gold font-bold">{totalSignups.toLocaleString()}</span> MINERS WAITING IN LINE
          </span>
          <span className="hidden sm:inline-block text-[10px] font-pixel text-amber-300/80 bg-amber-950/60 px-2 py-0.5 border border-amber-600/50">
            LIVE SNAPSHOT
          </span>
        </div>

        {/* Brand Tagline Header */}
        <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl text-burrow-cream tracking-tight leading-tight mb-4 drop-shadow-[3px_3px_0px_#000]">
          DIG THROUGH THE MINES.
        </h1>
        
        <div className="inline-block bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent font-pixel text-lg sm:text-2xl md:text-3xl mb-6 drop-shadow-[2px_2px_0px_#000]">
          2,500 WORKERS. FREE MINT ON ROBINHOOD CHAIN.
        </div>

        <p className="max-w-2xl text-xs sm:text-sm md:text-base font-silkscreen text-burrow-muted mb-8 leading-relaxed">
          {BURROW_CONFIG.description}
          <br className="hidden sm:inline" />
          The waitlist ships first: top referrers & early verified miners claim guaranteed allowlist spots.
        </p>

        {/* Pixel Characters Scene (Miner + Buggy + Gold Veins) */}
        <div className="relative my-2 p-6 bg-burrow-surface/80 border-4 border-burrow-border shadow-pixel-lg max-w-xl w-full flex flex-col items-center justify-center">
          {/* Hanging stalactites decoration */}
          <div className="absolute -top-3 left-6 right-6 flex justify-between text-burrow-border pointer-events-none select-none">
            <span>▼</span><span>▼▼</span><span>▼</span><span>▼▼▼</span><span>▼</span>
          </div>

          <div className="flex items-end justify-center gap-6 sm:gap-10 py-4">
            {/* Interactive Miner with Pickaxe */}
            <div 
              onClick={handlePickaxeClick}
              className="cursor-pointer group flex flex-col items-center transform transition-transform active:scale-95"
              title="Click miner to strike the mine wall! (Custom 8-bit sound)"
            >
              <div className="relative">
                <PixelMiner size={110} className="filter drop-shadow-[0_8px_16px_rgba(251,191,36,0.3)] animate-float" />
                <span className="absolute -top-4 -right-2 bg-amber-400 text-black text-[9px] font-pixel px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  MINE!
                </span>
              </div>
              <span className="text-[10px] font-pixel text-burrow-gold mt-2 flex items-center gap-1">
                <Pickaxe size={12} /> CLICK TO MINE ({clinkCount})
              </span>
            </div>

            {/* Hill Climb Buggy */}
            <div className="flex flex-col items-center">
              <PixelBuggy size={140} className="filter drop-shadow-[0_8px_16px_rgba(239,68,68,0.3)]" />
              <span className="text-[10px] font-pixel text-red-400 mt-2">
                HILL CLIMB BUGGY
              </span>
            </div>
          </div>

          {/* Quick CTA inside hero */}
          <div className="mt-4 pt-4 border-t-2 border-burrow-border w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] font-silkscreen text-burrow-muted text-center sm:text-left">
              ⭐ Starting Bonus: <span className="text-burrow-gold font-pixel">+10 PTS</span> on Join | <span className="text-emerald-400 font-pixel">+5 PTS</span> per Friend
            </div>
            <button
              onClick={() => {
                sounds.playVictory();
                onScrollToJoin();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-burrow-gold hover:bg-yellow-400 text-black font-pixel text-xs border-2 border-amber-200 shadow-pixel transition-transform active:translate-y-1 active:shadow-pixel-sm flex items-center justify-center gap-2 font-bold"
            >
              <Flame size={16} className="text-orange-600 animate-bounce" />
              JOIN WAITLIST NOW
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mt-8">
          <div className="p-3 bg-burrow-surface/60 border-2 border-burrow-border text-left">
            <p className="text-[10px] font-pixel text-burrow-muted">COLLECTION</p>
            <p className="text-xs sm:text-sm font-pixel text-burrow-cream mt-1">2,500 WORKERS</p>
          </div>
          <div className="p-3 bg-burrow-surface/60 border-2 border-burrow-border text-left">
            <p className="text-[10px] font-pixel text-burrow-muted">MINT PRICE</p>
            <p className="text-xs sm:text-sm font-pixel text-emerald-400 mt-1">FREE (0 ETH)</p>
          </div>
          <div className="p-3 bg-burrow-surface/60 border-2 border-burrow-border text-left">
            <p className="text-[10px] font-pixel text-burrow-muted">NETWORK</p>
            <p className="text-xs sm:text-sm font-pixel text-amber-300 mt-1">ROBINHOOD (4663)</p>
          </div>
          <div className="p-3 bg-burrow-surface/60 border-2 border-burrow-border text-left">
            <p className="text-[10px] font-pixel text-burrow-muted">GAS FEE</p>
            <p className="text-xs sm:text-sm font-pixel text-burrow-cream mt-1">~0.02 GWEI (ETH)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
