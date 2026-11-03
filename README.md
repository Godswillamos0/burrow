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
       `I just joined the @Burrow waitlist. 2,500 miners, free mint on Robinhood Chain. Dig with me: https://burrow.xyz/r/[code]`

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
2. Go to the **SQL Editor** tab in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository and run it. This creates:
   - `waitlist` table with Row Level Security (RLS)
   - Indexes for fast rank and referral lookup
   - `credit_referrer(code)` atomic SQL function
4. Go to **Project Settings** → **API** and copy:
   - `Project URL`
   - `Project API Keys (anon / public)`
   - `Project API Keys (service_role / secret)`
5. Paste these into your `.env.local` file (see `.env.example`).

---

## 🚀 Deployment Options

### 1. Deploying on Render (Recommended for Full Next.js Node Features)

Render supports Next.js natively as a Web Service.

#### Option A: Using `render.yaml` Blueprint
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New** → **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml`.
4. Enter your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
5. Click **Apply**.

#### Option B: Manual Web Service on Render
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node
- **Node Version**: `20.17.0`

---

### 2. Deploying on Cloudflare (Cloudflare Pages)

1. Push your repository to GitHub.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com), go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Select the `burrow-waitlist` repository.
4. Set build settings:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages@1` (or `npm run build`)
   - **Build output directory**: `.vercel/output/static` (configured in `wrangler.toml`)
5. In **Environment variables**, add:
   - `NODE_VERSION`: `20.17.0`
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `ADMIN_SECRET_KEY`: Your Admin Secret Key
6. Click **Save and Deploy**.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# (Edit .env.local with your Supabase credentials or test with the built-in development fallback store)

# 3. Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 🛡️ Admin Allowlist Export

To export the verified allowlist for Merkle tree generation:

1. **Via Browser UI**: Click the Shield icon in the top right header, enter your `ADMIN_SECRET_KEY` (default in dev: `burrow-secret-key-2026`), and click **Download Allowlist CSV**.
2. **Via API / Script**:
   ```bash
   curl "https://burrow.xyz/api/admin/export?key=YOUR_SECRET_KEY&format=csv" -o allowlist.csv
   ```

Output CSV format:
```csv
Rank,X_Handle,Wallet_Address,Points,Referrals,Ref_Code,Referred_By,Created_At
"1","@MineMaster99","0x1234567890123456789012345678901234567890","250","48","goldrush1","","2026-10-29T00:41:48.227Z"
```

---

## 📜 License & Disclaimer

Burrow is an independent Web3 driving game and NFT collection deployed on Robinhood Chain. Not affiliated with, sponsored by, or endorsed by Robinhood Markets, Inc.
