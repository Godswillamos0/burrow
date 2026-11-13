import { ImageResponse } from 'next/og';

export const alt = 'Burrow — Dig through the mines. 2,500 workers. Free mint on Robinhood Chain.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

// The pixel miner from the brand (same art as components/PixelMinerArt.tsx)
const MINER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
<rect x="10" y="4" width="12" height="3" fill="#fbbf24"/><rect x="8" y="7" width="16" height="3" fill="#f59e0b"/>
<rect x="7" y="10" width="18" height="2" fill="#d97706"/><rect x="14" y="6" width="4" height="4" fill="#fff"/>
<rect x="15" y="7" width="2" height="2" fill="#fef08a"/><rect x="12" y="8" width="8" height="1" fill="#78350f"/>
<rect x="9" y="12" width="14" height="6" fill="#fbcfe8"/><rect x="11" y="14" width="2" height="1" fill="#78350f"/>
<rect x="19" y="15" width="2" height="1" fill="#78350f"/><rect x="11" y="13" width="2" height="2" fill="#18181b"/>
<rect x="19" y="13" width="2" height="2" fill="#18181b"/><rect x="14" y="16" width="4" height="1" fill="#831843"/>
<rect x="17" y="15" width="2" height="1" fill="#831843"/><rect x="10" y="18" width="12" height="2" fill="#ef4444"/>
<rect x="8" y="20" width="16" height="7" fill="#f97316"/><rect x="10" y="21" width="3" height="6" fill="#f1f5f9"/>
<rect x="19" y="21" width="3" height="6" fill="#f1f5f9"/><rect x="13" y="22" width="6" height="5" fill="#c2410c"/>
<rect x="9" y="27" width="5" height="3" fill="#1e3a8a"/><rect x="18" y="27" width="5" height="3" fill="#1e3a8a"/>
<rect x="8" y="30" width="6" height="2" fill="#451a03"/><rect x="18" y="30" width="6" height="2" fill="#451a03"/>
<rect x="4" y="16" width="3" height="2" fill="#94a3b8"/><rect x="3" y="18" width="2" height="2" fill="#64748b"/>
<rect x="5" y="18" width="2" height="11" fill="#78350f"/><rect x="24" y="19" width="4" height="6" fill="#fbbf24"/>
</svg>`;

const minerSrc = `data:image/svg+xml;utf8,${encodeURIComponent(MINER_SVG)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #10081c 0%, #1c122b 55%, #0c0615 100%)',
          border: '16px solid #fbbf24',
          padding: '48px 64px',
          fontFamily: 'monospace',
        }}
      >
        <img src={minerSrc} width={360} height={360} style={{ marginRight: 56 }} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: '#fbbf24', letterSpacing: 4 }}>BURROW</div>
          <div style={{ fontSize: 44, color: '#fef3c7', marginTop: 12 }}>Dig through the mines.</div>
          <div style={{ fontSize: 44, color: '#fef3c7' }}>2,500 workers.</div>
          <div style={{ fontSize: 40, color: '#fb923c', marginTop: 8 }}>Free mint on Robinhood Chain.</div>
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              alignSelf: 'flex-start',
              background: '#fbbf24',
              color: '#000',
              fontSize: 30,
              fontWeight: 800,
              padding: '12px 24px',
            }}
          >
            JOIN THE WAITLIST →
          </div>
        </div>
      </div>
    ),
    size
  );
}
