'use client';

import React from 'react';
import { sounds } from '@/lib/audio';
import { BURROW_CONFIG } from '@/lib/config';
import { PixelPickaxe } from './PixelMinerArt';
import { Twitter, ExternalLink, Globe, Shield } from 'lucide-react';

export function PixelFooter() {
  return (
    <footer className="border-t-4 border-burrow-border bg-burrow-darkest pt-12 pb-8 px-4 text-burrow-muted">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
        {/* Brand info */}
        <div className="max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <PixelPickaxe size={24} />
            <span className="font-pixel text-lg text-burrow-gold">BURROW</span>
          </div>
          <p className="font-silkscreen text-xs leading-relaxed mb-4 text-burrow-muted">
            {BURROW_CONFIG.tagline}
          </p>
          <div className="text-[11px] font-silkscreen text-burrow-muted/80">
            Chain ID: <span className="font-mono text-amber-300">4663</span> | Native Gas: <span className="text-emerald-400">ETH</span>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-8 text-xs font-pixel">
          <div>
            <p className="text-burrow-cream mb-3">ROBINHOOD CHAIN</p>
            <ul className="space-y-2 text-[11px] font-silkscreen">
              <li>
                <a
                  href={BURROW_CONFIG.chain.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-burrow-gold flex items-center gap-1"
                >
                  <span>Blockscout Explorer</span>
                  <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <a
                  href={BURROW_CONFIG.socials.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-burrow-gold flex items-center gap-1"
                >
                  <span>Official Chain Docs</span>
                  <ExternalLink size={11} />
                </a>
              </li>
              <li className="font-mono text-[10px] text-burrow-muted truncate max-w-[200px]">
                rpc: mainnet.chain.robinhood.com
              </li>
            </ul>
          </div>

          <div>
            <p className="text-burrow-cream mb-3">COMMUNITY</p>
            <ul className="space-y-2 text-[11px] font-silkscreen">
              <li>
                <a
                  href={BURROW_CONFIG.socials.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-burrow-gold flex items-center gap-1 text-sky-400"
                >
                  <Twitter size={12} />
                  <span>Follow @Burrow</span>
                </a>
              </li>
              <li className="text-burrow-muted">
                2,500 Worker NFTs
              </li>
              <li className="text-emerald-400">
                Free Mint Allowlist
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal & Attribution Disclaimer */}
      <div className="max-w-6xl mx-auto pt-6 border-t border-burrow-border/40 text-[10px] font-silkscreen text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="max-w-2xl text-burrow-muted/70">
          Disclaimer: Burrow is an independent indie driving game and NFT collection deployed on Robinhood Chain. Not affiliated with, sponsored by, or endorsed by Robinhood Markets, Inc.
        </p>
        <p className="font-pixel text-[9px] text-burrow-gold">
          BURROW © 2026 • ALL RIGHTS RESERVED
        </p>
      </div>
    </footer>
  );
}
