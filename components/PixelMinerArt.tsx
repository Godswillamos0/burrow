import React from 'react';

// Pure CSS / SVG 64x64 Pixel Art Miner & Buggy Graphics
export function PixelMiner({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none image-rendering-pixelated ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full drop-shadow-[0_4px_10px_rgba(251,191,36,0.3)]"
        shapeRendering="crispEdges"
      >
        {/* Helmet / Yellow Hard Hat */}
        <rect x="10" y="4" width="12" height="3" fill="#fbbf24" />
        <rect x="8" y="7" width="16" height="3" fill="#f59e0b" />
        <rect x="7" y="10" width="18" height="2" fill="#d97706" />

        {/* Headlamp */}
        <rect x="14" y="6" width="4" height="4" fill="#ffffff" />
        <rect x="15" y="7" width="2" height="2" fill="#fef08a" />
        <rect x="12" y="8" width="8" height="1" fill="#78350f" />

        {/* Face */}
        <rect x="9" y="12" width="14" height="6" fill="#fbcfe8" />
        {/* Dirt/grime smudge */}
        <rect x="11" y="14" width="2" height="1" fill="#78350f" />
        <rect x="19" y="15" width="2" height="1" fill="#78350f" />
        {/* Eyes (determined miner gaze) */}
        <rect x="11" y="13" width="2" height="2" fill="#18181b" />
        <rect x="19" y="13" width="2" height="2" fill="#18181b" />
        <rect x="12" y="13" width="1" height="1" fill="#ffffff" />
        <rect x="20" y="13" width="1" height="1" fill="#ffffff" />
        {/* Smirk */}
        <rect x="14" y="16" width="4" height="1" fill="#831843" />
        <rect x="17" y="15" width="2" height="1" fill="#831843" />

        {/* Neck / Bandana */}
        <rect x="10" y="18" width="12" height="2" fill="#ef4444" />
        <rect x="13" y="19" width="3" height="2" fill="#dc2626" />

        {/* Hi-Vis Mining Vest */}
        <rect x="8" y="20" width="16" height="7" fill="#f97316" />
        {/* Reflective silver stripes */}
        <rect x="10" y="21" width="3" height="6" fill="#f1f5f9" />
        <rect x="19" y="21" width="3" height="6" fill="#f1f5f9" />
        <rect x="13" y="22" width="6" height="5" fill="#c2410c" />

        {/* Blue Overalls / Legs */}
        <rect x="9" y="27" width="5" height="3" fill="#1e3a8a" />
        <rect x="18" y="27" width="5" height="3" fill="#1e3a8a" />
        {/* Heavy Mining Boots */}
        <rect x="8" y="30" width="6" height="2" fill="#451a03" />
        <rect x="18" y="30" width="6" height="2" fill="#451a03" />

        {/* Pickaxe held by side */}
        <rect x="4" y="16" width="3" height="2" fill="#94a3b8" />
        <rect x="3" y="18" width="2" height="2" fill="#64748b" />
        <rect x="5" y="18" width="2" height="11" fill="#78350f" />
        <rect x="4" y="28" width="3" height="2" fill="#451a03" />

        {/* Lantern in hand */}
        <rect x="24" y="19" width="4" height="6" fill="#fbbf24" />
        <rect x="25" y="20" width="2" height="4" fill="#ffedd5" />
        <rect x="25" y="18" width="2" height="1" fill="#78350f" />
      </svg>
    </div>
  );
}

export function PixelBuggy({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size * 0.6 }}
      className={`relative select-none image-rendering-pixelated ${className}`}
    >
      <svg viewBox="0 0 40 24" className="w-full h-full" shapeRendering="crispEdges">
        {/* Roll cage */}
        <rect x="12" y="4" width="14" height="2" fill="#fbbf24" />
        <rect x="12" y="6" width="2" height="6" fill="#f59e0b" />
        <rect x="24" y="6" width="2" height="6" fill="#f59e0b" />
        <rect x="16" y="6" width="2" height="6" fill="#d97706" />

        {/* Driver helmet inside buggy */}
        <rect x="17" y="7" width="5" height="3" fill="#facc15" />
        <rect x="20" y="8" width="2" height="1" fill="#ffffff" />

        {/* Buggy Body Chassis */}
        <rect x="6" y="11" width="28" height="4" fill="#dc2626" />
        <rect x="8" y="10" width="20" height="2" fill="#ef4444" />
        <rect x="30" y="12" width="4" height="2" fill="#facc15" /> {/* Headlight */}

        {/* Suspension springs */}
        <rect x="8" y="14" width="2" height="3" fill="#94a3b8" />
        <rect x="28" y="14" width="2" height="3" fill="#94a3b8" />

        {/* Rear Wheel (Big off-road tire) */}
        <rect x="4" y="14" width="9" height="9" fill="#18181b" />
        <rect x="6" y="16" width="5" height="5" fill="#f59e0b" />
        <rect x="7" y="17" width="3" height="3" fill="#18181b" />

        {/* Front Wheel */}
        <rect x="25" y="14" width="8" height="8" fill="#18181b" />
        <rect x="27" y="16" width="4" height="4" fill="#f59e0b" />
        <rect x="28" y="17" width="2" height="2" fill="#18181b" />

        {/* Exhaust pipe + spark */}
        <rect x="3" y="12" width="4" height="2" fill="#71717a" />
        <rect x="1" y="11" width="2" height="2" fill="#f97316" />
      </svg>
    </div>
  );
}

export function PixelCoin({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div style={{ width: size, height: size }} className={`inline-block image-rendering-pixelated ${className}`}>
      <svg viewBox="0 0 16 16" className="w-full h-full animate-bounce_pixel" shapeRendering="crispEdges">
        <rect x="5" y="2" width="6" height="1" fill="#78350f" />
        <rect x="3" y="3" width="10" height="2" fill="#f59e0b" />
        <rect x="2" y="5" width="12" height="6" fill="#fbbf24" />
        <rect x="4" y="6" width="8" height="4" fill="#fef08a" />
        <rect x="6" y="7" width="4" height="2" fill="#ffffff" />
        <rect x="3" y="11" width="10" height="2" fill="#d97706" />
        <rect x="5" y="13" width="6" height="1" fill="#78350f" />
      </svg>
    </div>
  );
}

export function PixelPickaxe({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div style={{ width: size, height: size }} className={`inline-block image-rendering-pixelated ${className}`}>
      <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
        <rect x="10" y="2" width="4" height="2" fill="#94a3b8" />
        <rect x="13" y="4" width="2" height="2" fill="#64748b" />
        <rect x="8" y="3" width="3" height="2" fill="#cbd5e1" />
        <rect x="5" y="5" width="3" height="2" fill="#94a3b8" />
        <rect x="3" y="7" width="2" height="3" fill="#64748b" />
        {/* Wooden Handle */}
        <rect x="7" y="7" width="2" height="2" fill="#78350f" />
        <rect x="6" y="9" width="2" height="2" fill="#92400e" />
        <rect x="5" y="11" width="2" height="2" fill="#78350f" />
        <rect x="4" y="13" width="2" height="2" fill="#92400e" />
      </svg>
    </div>
  );
}
