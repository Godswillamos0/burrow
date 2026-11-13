# ⛏️ BURROW WAITLIST & ALLOWLIST SYSTEM

> **"Dig through the mines. 2,500 workers. Free mint on Robinhood Chain."**

Burrow is an underground Hill Climb–style driving game paired with a collection of 2,500 pixel miner NFTs ("workers") launching as a free mint on **Robinhood Chain (Chain ID: 4663)**.

This repository contains the complete production waitlist, referral engine, and allowlist allocation platform built with Next.js (App Router), TypeScript, Tailwind CSS, Web Audio API sound synthesis, and Supabase Postgres.

---

## 🌟 Key Features

1. **Pixel Art Aesthetic & Branding**:
   - Palette inspired by the underground mines: deep purple-brown caverns (`#0c0714`, `#140c1f`), gold ore accents (`#fbbf24`), warm parchment text (`#fef3c7`), and flickering lantern lighting.
   - Retro pixel typography with **Press Start 2P** and **Silkscreen** fonts.
   - Hand-crafted SVG/Canvas pixel art for the Miner, the Hill Climb Buggy, Pickaxe, and spinning Gold Coins.

2. **Custom 8-bit Web Audio API Sound System**:
   - Zero external MP3 loading failures: authentic retro sound synthesizers generated in real time using the browser's Web Audio API.
   - **Click Blip**: Mechanical retro UI button click.
   - **Coin Chime**: Classic two-tone arcade coin chime.
   - **Pickaxe Clink**: Metal strike on underground ore vein with stone burst.
   - **Buggy Engine Rev**: Sawtooth pitch-rising throttle rumble.
   - **Victory Fanfare**: Arpeggiated level-up fanfare on registration.
   - **Copy Pop**: Soft bubble pop when copying referral links.
   - **Cave Ambience**: Synthesized underground mineral water drips with on/off toggle in the header.

3. **Live Urgency Counter & Leaderboard**:
   - Real-time animated counter showing active miners waiting in line.
   - Top 10 Referrers Leaderboard with Gold (#1), Silver (#2), and Bronze (#3) crowns.
   - Automatic 30-second cache invalidation via `/api/stats`.

4. **3-Step Sybil-Resistant Allowlist Registration**:
   - **Step 1: X (Twitter) Connect**: Links verified Twitter identity. Supports both Supabase Twitter OAuth and a zero-friction demo mode for quick testing.
   - **Step 2: EVM Wallet & Signature**: Robinhood Chain (EVM 4663) wallet connection with free zero-gas cryptographic signing (`personal_sign`) to prove wallet ownership.
   - **Step 3: Miner Pass & Referral Loop**:
     - Miners receive 10 base points + 5 points for every recruited friend.
     - Unique 8-character referral code (`/r/[code]`) with 30-day cookie tracking.
     - 1-click "Post on X" button with viral prewritten copy:
       `I just joined the @BurrowRH waitlist. 2,500 miners, free mint on Robinhood Chain. Dig with me: <your-domain>/r/[code]`

5. **Playable Buggy Browser Prototype Teaser**:
   - 60fps canvas physics mini-game right on the waitlist page.
   - Drive the mine buggy over subterranean hills, collect spinning coins, and practice throttle balance before the full game launch!

6. **Admin Allowlist Console & CSV Export**:
   - Protected endpoint: `GET /api/admin/export?key=...&format=csv`.
   - Secret Admin modal to inspect entries, filter Guaranteed vs FCFS cutoff thresholds, and download the allowlist CSV formatted directly for Merkle tree generation.

---

## ⛓️ Robinhood Chain Specifications

| Parameter | Mainnet Value | Testnet Value |
| :--- | :--- | :--- |
| **Network Name** | Robinhood Chain | Robinhood Testnet |
| **Chain ID** | `4663` | `46630` |
| **Currency** | Ether (`ETH`) | Ether (`ETH`) |
| **RPC URL** | `https://rpc.mainnet.chain.robinhood.com` | `https://rpc.testnet.chain.robinhood.com` |
| **Block Explorer** | `https://robinhoodchain.blockscout.com` | `https://explorer.testnet.chain.robinhood.com` |
| **Estimated Gas** | `~0.02 gwei (~$0.01)` | Tiny faucet gas |

---

## 🗄️ Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run `supabase/schema.sql`. It creates the `waitlist` table (RLS on, server-only access), rank/referral indexes and the `credit_referrer(code)` function.
3. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key into your env (see `.env.example`).

> In production the app **refuses sign-ups** if Supabase isn't configured, rather than keeping them in memory and losing them on restart. The in-memory sample data only runs in `npm run dev`.

## 🐦 X Sign-in (Supabase Auth)

1. In the [X Developer Portal](https://developer.x.com), create an app with **OAuth 2.0** on, type **Web App**.
2. Callback URL: `https://<your-project>.supabase.co/auth/v1/callback`.
3. Supabase → **Authentication → Sign In / Providers → X / Twitter (OAuth 2.0)**: paste the client ID and secret, enable it.
4. Supabase → **Authentication → URL Configuration**: Site URL = your live URL; add `http://localhost:3000` and your Render / custom-domain URLs to **Redirect URLs**.

The server reads the X id and handle from the verified Supabase session — users can't type someone else's handle. If you use the legacy OAuth 1.0a provider instead, set `NEXT_PUBLIC_SUPABASE_X_PROVIDER=twitter`.

Following @BurrowRH isn't checked automatically (the X API endpoint for that is paid); the follow task is trust-based. Spot-check the top of the list before mint.

## 🔐 Anti-bot measures

| Layer | How |
| --- | --- |
| Real X account | Supabase X sign-in, one entry per X id |
| Wallet ownership | Required free `personal_sign` of a server-signed nonce (15 min expiry), verified with viem |
| Bots | Cloudflare Turnstile (when `TURNSTILE_SECRET_KEY` is set) |
| Rate limit | 5 join attempts per IP per hour — Upstash Redis if configured, otherwise in-memory |
| Duplicates | Unique `x_id` and `wallet` in the database |
| Referrals | Credited only after the new miner finishes X sign-in **and** wallet signing |

---

## 🚀 Deployment: Render + Cloudflare

The app runs as a Node web service on **Render**. **Cloudflare** sits in front of it for the domain, DNS, CDN caching and Turnstile.

> Why not run it directly on Cloudflare Workers? The supported adapter (`@opennextjs/cloudflare` 1.x) requires Next.js 15.5+, and this app is on Next 14. Running on Render behind Cloudflare gives the same edge benefits without a framework upgrade.

### 1. Render (app server)
1. Render Dashboard → **New → Blueprint** → connect this repo (`render.yaml` is detected).
2. Set the env vars marked `sync: false` (Supabase keys, WalletConnect ID, Turnstile keys, optional Upstash). `ADMIN_SECRET_KEY` is generated automatically — find it under **Environment**.
3. Set `NEXT_PUBLIC_SITE_URL` to your final public URL, then redeploy (public vars are baked in at build time).

### 2. Cloudflare (domain, CDN, bot protection)
1. Add your domain to Cloudflare and point its nameservers at Cloudflare.
2. Render → your service → **Settings → Custom Domains** → add `your-domain.com`; Render shows a CNAME target like `burrow-waitlist.onrender.com`.
3. Cloudflare → **DNS** → add a `CNAME` for the domain → that target, **Proxied** (orange cloud). SSL/TLS mode: **Full (strict)**.
4. Cloudflare → **Turnstile** → **Add widget** with your domain (and the onrender.com host for testing). Put the site key / secret key in Render as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
5. Add the custom domain to Supabase redirect URLs and set `NEXT_PUBLIC_SITE_URL` to it.

`/api/stats` sends `s-maxage=30`, so Cloudflare can cache the counter and leaderboard for 30 seconds if you add a Cache Rule for `/api/stats`.

---

## 💻 Local Development

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys, or leave blank to use the dev-only sample store
npm run dev                  # http://localhost:3000
```

---

## 🛡️ Admin Allowlist Export

`ADMIN_SECRET_KEY` must be set (16+ characters) or the export is disabled.

1. **Browser**: click the shield icon in the header, enter the key, then **Download Allowlist CSV**.
2. **Script** (key in a header so it doesn't land in logs):
   ```bash
   curl -H "Authorization: Bearer $ADMIN_SECRET_KEY" "https://your-domain.com/api/admin/export?format=csv" -o allowlist.csv
   ```

Columns, sorted by rank: `rank, x_handle, wallet, points, referrals, created_at, ref_code, referred_by`. Opens cleanly in Google Sheets.

---

## 📜 License & Disclaimer

Burrow is an independent Web3 driving game and NFT collection deployed on Robinhood Chain. Not affiliated with, sponsored by, or endorsed by Robinhood Markets, Inc.
