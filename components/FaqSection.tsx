'use client';

import React, { useState } from 'react';
import { sounds } from '@/lib/audio';
import { ChevronDown, ChevronUp, HelpCircle, Pickaxe, Zap, Coins } from 'lucide-react';

const FAQS = [
  {
    q: 'What is Robinhood Chain?',
    a: 'Robinhood Chain is an EVM-compatible network (Chain ID: 4663) launched on mainnet in July 2026. Anyone can deploy and interact with smart contracts. It uses standard 0x Ethereum addresses and gas is paid in ETH at tiny fees (~0.02 gwei / less than $0.01).',
  },
  {
    q: 'Is the 2,500 worker NFT mint really free?',
    a: 'Yes! The mint price is 0 ETH. Minters only pay the tiny network gas fee on Robinhood Chain. The waitlist produces the official allowlist for all 2,500 unique pixel miner workers.',
  },
  {
    q: 'How are allowlist spots allocated?',
    a: 'Allocations are divided into two phases: (1) Guaranteed Phase: Reserved for top referrers on the leaderboard and earliest verified sign-ups; (2) FCFS (First-Come, First-Served) Phase: Open to all other verified waitlist participants until the 2,500 supply is minted out.',
  },
  {
    q: 'How does the referral system work?',
    a: 'Every miner receives a unique referral link upon joining. You earn +10 starting points on sign-up, plus +5 points for each verified friend you recruit. Referrals are credited once the recruited miner verifies their X account and connects their wallet.',
  },
  {
    q: 'What utility do worker NFTs provide in the game?',
    a: 'Your NFT miner becomes the in-game driver inside the mine buggy. Different miner traits (lamp color, helmets, tools) unlock cosmetic effects, custom cave lighting, and starter bonuses in the Hill Climb underground racing game.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    sounds.playClick();
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-block bg-burrow-card border border-burrow-gold/40 px-3 py-1 text-[10px] font-pixel text-burrow-gold mb-2 shadow-pixel-sm">
          MINE INTEL & FAQ
        </div>
        <h3 className="font-pixel text-xl sm:text-2xl text-burrow-cream">
          FREQUENTLY ASKED QUESTIONS
        </h3>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-burrow-card border-2 border-burrow-border shadow-pixel-sm transition-colors overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-burrow-surface transition-colors"
              >
                <span className="font-pixel text-xs sm:text-sm text-burrow-cream">
                  {faq.q}
                </span>
                <span className="text-burrow-gold shrink-0">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 font-silkscreen text-xs text-burrow-muted border-t border-burrow-border/60 leading-relaxed bg-burrow-darkest/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
