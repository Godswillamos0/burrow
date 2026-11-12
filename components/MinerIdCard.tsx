'use client';

import React, { useRef, useState } from 'react';
import { sounds } from '@/lib/audio';
import { BURROW_CONFIG } from '@/lib/config';
import { PixelPickaxe } from './PixelMinerArt';
import { Download, Twitter, Camera } from 'lucide-react';

interface MinerIdCardProps {
  handle: string;
  wallet: string;
  rank: number;
  refCode: string;
  tasksCompleted: Record<string, boolean>;
}

// Real Twitter PFP via unavatar.io — free, no API key required
export function getAvatarUrl(handle: string): string {
  const clean = handle.replace(/^@/, '');
  return `https://unavatar.io/x/${clean}`;
}

export function MinerIdCard({
  handle,
  wallet,
  rank,
  refCode,
  tasksCompleted,
}: MinerIdCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const cleanHandle = handle.replace(/^@/, '');
  const avatarUrl = getAvatarUrl(cleanHandle);
  const maskedWallet = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '0x000...000';
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${refCode}`
    : `https://burrow.xyz/r/${refCode}`;

  const completedCount = Object.values(tasksCompleted).filter(Boolean).length;
  const totalTasks = BURROW_CONFIG.tasks.length;
  const isFullyApproved = completedCount >= totalTasks;

  // Generate downloadable 1200x675 PNG card
  const handleDownloadPng = async () => {
    sounds.playCoin();
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 675;

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
      bgGrad.addColorStop(0, '#10081c');
      bgGrad.addColorStop(0.5, '#190e2a');
      bgGrad.addColorStop(1, '#0c0615');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 675);

      // Grid pattern
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 675); ctx.stroke(); }
      for (let y = 0; y < 675; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }

      // Outer gold border
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, 1160, 635);
      ctx.strokeStyle = '#3d275e'; ctx.lineWidth = 3;
      ctx.strokeRect(32, 32, 1136, 611);

      // Header
      ctx.fillStyle = '#26193b';
      ctx.fillRect(36, 36, 1128, 85);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('⛏️ BURROW MINING PERMIT // 2,500 WORKERS', 60, 90);

      // Network pill
      ctx.fillStyle = '#052e16'; ctx.fillRect(860, 52, 280, 48);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.strokeRect(860, 52, 280, 48);
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 18px monospace';
      ctx.fillText('● ROBINHOOD CHAIN (4663)', 875, 83);

      // Avatar frame
      const avatarX = 70, avatarY = 160, avatarSize = 220;
      ctx.fillStyle = '#0c0714'; ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 6;
      ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);

      // Try loading real X avatar
      try {
        // Fetch as blob so a non-CORS response fails here instead of tainting the canvas
        const blob = await fetch(avatarUrl, { mode: 'cors' }).then((r) => (r.ok ? r.blob() : Promise.reject()));
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
        if (img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16);
        } else {
          ctx.fillStyle = '#1c122b'; ctx.fillRect(avatarX + 8, avatarY + 8, avatarSize - 16, avatarSize - 16);
          ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 72px monospace'; ctx.textAlign = 'center';
          ctx.fillText('⛏️', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 24);
          ctx.textAlign = 'left';
        }
      } catch {
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 64px monospace'; ctx.textAlign = 'center';
        ctx.fillText('⛏️', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 20);
        ctx.textAlign = 'left';
      }

      // Rank badge
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(avatarX, avatarY + avatarSize + 15, avatarSize, 50);
      ctx.fillStyle = '#000000'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`MINER #${rank}`, avatarX + avatarSize / 2, avatarY + avatarSize + 48);

      // Status PENDING
      ctx.fillStyle = '#7c2d12'; ctx.fillRect(avatarX, avatarY + avatarSize + 75, avatarSize, 40);
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.strokeRect(avatarX, avatarY + avatarSize + 75, avatarSize, 40);
      ctx.fillStyle = '#fb923c'; ctx.font = 'bold 15px monospace';
      ctx.fillText('⏳ PENDING APPROVAL', avatarX + avatarSize / 2, avatarY + avatarSize + 101);
      ctx.textAlign = 'left';

      // Right: credentials
      const credX = 340; let credY = 185;
      const drawField = (label: string, value: string, color = '#fef3c7', big = false) => {
        ctx.fillStyle = '#94a3b8'; ctx.font = '16px monospace'; ctx.fillText(label, credX, credY);
        ctx.fillStyle = color; ctx.font = `bold ${big ? 32 : 24}px monospace`;
        ctx.fillText(value, credX, credY + (big ? 36 : 28));
        credY += big ? 75 : 62;
      };
      drawField('OPERATOR HANDLE', `@${cleanHandle}`, '#fbbf24', true);
      drawField('ROBINHOOD CHAIN WALLET', maskedWallet, '#38bdf8');
      drawField('TASKS COMPLETED', `${completedCount}/${totalTasks} COMPLETED`, '#4ade80');
      drawField('ALLOWLIST STATUS', isFullyApproved ? 'REVIEW IN PROGRESS' : 'PENDING TASKS', '#fb923c');

      // Bottom strip
      ctx.fillStyle = '#1e1329'; ctx.fillRect(36, 560, 1128, 80);
      ctx.strokeStyle = '#3d275e'; ctx.lineWidth = 2; ctx.strokeRect(36, 560, 1128, 80);

      // Barcode
      ctx.fillStyle = '#ffffff';
      let bx = 60;
      [4,2,8,3,6,2,10,4,3,6,2,8,4,2,10,3,6,4,8,2,6,4,2,8].forEach((w, i) => {
        if (i % 2 === 0) ctx.fillRect(bx, 575, w, 45);
        bx += w + 2;
      });
      ctx.fillStyle = '#94a3b8'; ctx.font = '12px monospace';
      ctx.fillText(`ID-${refCode.toUpperCase()}`, 60, 632);

      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 20px monospace';
      ctx.fillText(`JOIN: ${referralUrl.replace(/^https?:\/\//, '')}`, 360, 608);
      ctx.fillStyle = '#fb923c'; ctx.font = 'bold 15px monospace';
      ctx.fillText('FREE MINT • ROBINHOOD CHAIN', 880, 608);

      const fileName = `burrow-miner-${cleanHandle}.png`;
      const pngBlob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (!pngBlob) throw new Error('Canvas export failed');

      // Mobile: use native share sheet (lets users save to Photos) when available
      const file = new File([pngBlob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && nav.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'My Burrow Miner Card' }); return; } catch { /* fall through to download */ }
      }

      const url = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('PNG generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareTweet = () => {
    sounds.playClick();
    const tweetText = `I just secured my Burrow Miner Permit! 2,500 pixel workers, free mint on Robinhood Chain.\n\nMiner #${rank} — pending approval.\n\nJoin with my link: ${referralUrl}\n\n@BurrowRH`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="w-full">
      {/* Visual Miner ID Card */}
      <div
        ref={cardRef}
        className="relative bg-gradient-to-br from-[#1c122b] via-[#140c1f] to-[#0c0714] border-4 border-burrow-gold shadow-pixel-lg p-4 sm:p-7 overflow-hidden select-none"
      >
        {/* Lanyard hole */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-burrow-darkest border-2 border-burrow-border rounded-full" />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-burrow-border pb-3 pt-2 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <PixelPickaxe size={20} />
            <span className="font-pixel text-[11px] sm:text-sm text-burrow-gold leading-tight">BURROW MINING PERMIT</span>
          </div>
          <span className="bg-emerald-950/80 border border-emerald-500 text-emerald-400 font-pixel text-[9px] px-2 py-0.5 whitespace-nowrap">
            ROBINHOOD CHAIN 4663
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          {/* Avatar — real X/Twitter PFP via unavatar.io */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative p-1 bg-burrow-darkest border-4 border-burrow-gold shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <img
                src={avatarUrl}
                alt={`@${cleanHandle} profile picture`}
                className="w-28 h-28 sm:w-32 sm:h-32 object-cover bg-burrow-surface"
                onError={(e) => {
                  // Fallback to pixel-art avatar if unavatar fails
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cleanHandle}`;
                }}
              />
            </div>

            {/* Rank badge */}
            <div className="mt-2 w-32 sm:w-36 text-center">
              <span className="block bg-burrow-gold text-black font-pixel text-xs px-2 py-1 font-bold shadow-pixel-sm w-full">
                MINER #{rank}
              </span>
              {/* PENDING instead of GUARANTEED */}
              <span className="block mt-1 text-[9px] font-pixel px-1.5 py-0.5 bg-orange-950/80 border border-orange-500 text-orange-400">
                ⏳ PENDING
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 w-full space-y-3">
            <div>
              <p className="text-[9px] font-silkscreen text-burrow-muted">MINER HANDLE</p>
              <h3 className="font-pixel text-sm sm:text-xl text-burrow-cream break-all">@{cleanHandle}</h3>
            </div>

            <div className="bg-burrow-darkest/70 p-2 border border-burrow-border">
              <p className="text-[9px] font-pixel text-burrow-muted">REGISTERED EVM WALLET</p>
              <p className="font-mono text-xs text-sky-300 break-all">{wallet}</p>
            </div>

            {/* Task Progress */}
            <div className="bg-burrow-darkest/70 p-2 border border-burrow-border">
              <p className="text-[9px] font-pixel text-burrow-muted mb-2">TASKS COMPLETED</p>
              <div className="grid grid-cols-2 gap-1">
                {BURROW_CONFIG.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-1.5 text-[10px] font-silkscreen px-2 py-1 border ${
                      tasksCompleted[task.id]
                        ? 'bg-emerald-950/50 border-emerald-600 text-emerald-400'
                        : 'bg-burrow-surface/50 border-burrow-border text-burrow-muted'
                    }`}
                  >
                    <span>{tasksCompleted[task.id] ? '✓' : '○'}</span>
                    <span className="capitalize">{task.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom barcode */}
        <div className="mt-5 pt-3 border-t-2 border-burrow-border flex items-center justify-between text-[10px] font-silkscreen text-burrow-muted">
          <span className="font-mono text-[9px] tracking-widest text-burrow-cream">||| |||| | ||||| | ||</span>
          <span className="text-[9px] font-pixel text-burrow-gold">PASS #{refCode.toUpperCase()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={handleDownloadPng}
          disabled={isGenerating}
          className="flex-1 py-3 px-4 bg-burrow-gold hover:bg-yellow-400 text-black font-pixel text-xs border-2 border-amber-200 shadow-pixel flex items-center justify-center gap-2 font-bold transition-transform active:translate-y-0.5"
        >
          <Camera size={16} />
          <span>{isGenerating ? 'GENERATING...' : 'DOWNLOAD MINER CARD (PNG)'}</span>
        </button>

        <button
          onClick={handleShareTweet}
          className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-black font-pixel text-xs border-2 border-sky-300 shadow-pixel flex items-center justify-center gap-2 font-bold transition-transform active:translate-y-0.5"
        >
          <Twitter size={16} />
          <span>SHARE ON X</span>
        </button>
      </div>
    </div>
  );
}
