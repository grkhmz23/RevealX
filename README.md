# 🎰 RevealX

A multi-chain scratch card casino platform built on **Solana** and **Base**. Users purchase digital scratch cards with SOL or USDC, reveal symbols via an interactive HTML5 canvas, and receive automatic on-chain payouts when they win.

[![React](https://img.shields.io/badge/react-18.3-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.6-3178C6.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/vite-5.4-646CFF.svg)](https://vitejs.dev)
[![Solana](https://img.shields.io/badge/solana-web3-9945FF.svg)](https://solana.com)
[![Base](https://img.shields.io/badge/base-EVM-0052FF.svg)](https://base.org)

---

## ✨ Features

- **Multi-Chain Scratch Cards** — Play with **SOL** on Solana or **USDC** on Base
- **5 Ticket Tiers** — Bronze to Diamond with proportional max wins
- **Real vs Demo Mode** — Practice without a wallet, then switch to real play
- **Interactive Scratch Experience** — HTML5 Canvas scratch mechanics with 60% reveal threshold
- **Automatic Payouts** — Winnings sent directly to the player's wallet on-chain
- **Provably Fair Engine** — Server-side outcome generation with configurable house edge and pool-aware win rates
- **Secure by Design** — Rate limiting, idempotency keys, input sanitization, CORS restrictions, and payout caps
- **Creator Dashboard** — Launch branded scratch card campaigns with custom share splits
- **LP Pool (ERC-4626)** — Deposit USDC into RevealXPool, earn yield from protocol fees
- **Unified Full-Stack Deploy** — Single Render service hosts both the React frontend and Express API

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Vite + React)       │
│  ┌─────────┐        ┌────────────────┐ │
│  │ Solana  │        │ Base (Wagmi)   │ │
│  │ Wallets │        │ Wallets        │ │
│  └────┬────┘        └───────┬────────┘ │
└───────┼─────────────────────┼──────────┘
        │                     │
        └──────────┬──────────┘
                   │
┌──────────────────┴──────────────────┐
│        Backend (Express + Node)     │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ Solana Svc  │  │ Base Svc     │ │
│  │ (Web3.js)   │  │ (Viem)       │ │
│  └──────┬──────┘  └──────┬───────┘ │
│         └────────┬────────┘         │
│                  ▼                  │
│         ┌──────────────┐            │
│         │ Game Service │            │
│         │ Casino Engine│            │
│         └──────┬───────┘            │
│                ▼                    │
│         ┌──────────────┐            │
│         │ PostgreSQL   │            │
│         │ Drizzle ORM  │            │
│         └──────────────┘            │
└─────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Wouter |
| **Backend** | Express.js, TypeScript, Node.js 20+ |
| **Database** | PostgreSQL with Drizzle ORM |
| **Solana** | `@solana/web3.js`, `@solana/wallet-adapter-react` |
| **Base** | `wagmi`, `viem`, WalletConnect |
| **Smart Contracts** | Foundry, OpenZeppelin, Chainlink VRF v2.5 |
| **Deployment** | Render (full-stack single service) |

### Base v2 Contracts

```
┌─────────────────────────────────────────────────────────────┐
│                        Base v2 (EVM)                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ CampaignRegistry │  │   RevealXPool    │                │
│  │   (Creators)     │  │  (ERC-4626 LP)   │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                           │
│           └──────────┬──────────┘                           │
│                      ▼                                      │
│            ┌─────────────────┐                             │
│            │   GameManager   │                             │
│            │ (VRF Consumer)  │                             │
│            └────────┬────────┘                             │
│                     ▼                                       │
│         ┌───────────────────────┐                          │
│         │ Chainlink VRF v2.5    │                          │
│         │ (Provable Randomness) │                          │
│         └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [PostgreSQL](https://postgresql.org) database
- Solana wallet with devnet SOL (for real-mode testing)

### 1. Clone & Install

```bash
git clone https://github.com/grkhmz23/RevealX.git
cd RevealX
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/revealx

# Solana
POOL_WALLET_PRIVATE_KEY=your_base58_private_key
SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet
VITE_POOL_WALLET=your_pool_public_key
VITE_TEAM_WALLET=your_team_public_key

# Base (EVM)
BASE_POOL_PRIVATE_KEY=0x_your_64_char_hex_private_key
BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_POOL_WALLET=0x_your_pool_address

# Base v2 Contracts
DEPLOYER_PRIVATE_KEY=0x...
OWNER_ADDRESS=0x...
FEE_RECIPIENT=0x...
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VRF_COORDINATOR=0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE
VRF_SUBSCRIPTION_ID=1234
VRF_KEY_HASH=0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71
BASESCAN_API_KEY=
ENABLE_INDEXER=false
PINATA_JWT=
VITE_V2_ENABLED_BASE=false
VITE_CAMPAIGN_REGISTRY_ADDRESS=0x...
VITE_GAME_MANAGER_ADDRESS=0x...
VITE_REVEALX_POOL_ADDRESS=0x...

# Security
SESSION_SECRET=$(openssl rand -base64 32)
```

### 3. Database Setup

```bash
npm run db:push
```

### 4. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## 🎮 How It Works

### Ticket Tiers

| Tier | Solana | Base | Max Win |
|------|--------|------|---------|
| Bronze | $1 | $1 | 10× |
| Silver | $2 | $2 | 20× |
| Gold | $5 | $5 | 50× |
| Platinum | $10 | $10 | 100× |
| Diamond | $25 | $25 | 250× |

### Game Flow (Real Mode)

1. **Select Chain** — Switch between Solana and Base in the header
2. **Select Tier** — Choose a scratch card tier
3. **Connect Wallet** — Phantom/Solflare/Backpack (Solana) or MetaMask/Coinbase (Base)
4. **Pay** — Transfer SOL or USDC to the game pool
5. **Scratch** — Reveal symbols on the interactive canvas (60% scratch required)
6. **Win/Lose** — Server-side casino engine determines the outcome
7. **Auto Payout** — Winnings sent directly from the pool wallet to the player

### Demo Mode

- No wallet required
- No real funds at risk
- Outcomes generated with the same casino engine
- Completely isolated from real statistics and pool balances

---

## 🧮 Casino Engine

The game engine enforces sustainable operation via:

- **Dynamic Win Rates** — Base rate of ~25%, adjusted downward for higher tiers and low pool balance
- **House Edge** — ~10% to ensure long-term platform viability
- **Payout Cap** — Max single win limited to 25% of current pool balance
- **Pool Reserve** — Minimum reserve maintained to keep the pool solvent
- **Chain-Agnostic Logic** — Same math, different currencies and wallets

---

## 🛡️ Security

| Control | Implementation |
|---------|----------------|
| **Rate Limiting** | Tiered limits: 5 payouts/min, 10 games/min, 60 general/min |
| **Idempotency** | Duplicate payout requests with the same key return the cached result |
| **Input Validation** | Zod schemas + wallet address regex (Base58 & EVM) |
| **Payout Limits** | Max 10 SOL / 25 USDC single win; hourly/daily caps enforced |
| **CORS** | Whitelist-only origins |
| **Security Headers** | HSTS, CSP, X-Frame-Options, XSS protection |
| **Secrets** | Private keys stored server-side only; never exposed to the client |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/api/stats/:chain` | Pool stats and balance for a chain |
| `GET` | `/api/stats` | Combined stats across all chains |
| `POST` | `/api/games/create-and-play` | Create a new game session |
| `POST` | `/api/games/payout` | Process a winning payout |
| `GET` | `/api/games/:wallet` | Player game history |
| `POST` | `/api/pool/check` | Check if pool can support a ticket cost |
| `POST` | `/api/rpc-proxy` | Proxy RPC requests to Solana |
| `GET` | `/api/campaigns` | List all v2 campaigns |
| `GET` | `/api/campaigns/:id` | Get campaign details |
| `GET` | `/api/campaigns/:id/plays` | Get plays for a campaign |
| `GET` | `/api/pool/v2` | Get v2 pool TVL and max payout |

---

## 🔄 RevealX v2 Architecture

RevealX v2 repositions the platform from a simple multi-chain casino to a **creator-launched on-chain scratch card ecosystem** with a shared liquidity pool and verifiable randomness.

### What's New in v2

- **On-Chain Trust Layer (Base)**: All v2 games run through audited Solidity contracts using Chainlink VRF v2.5 for provably fair randomness.
- **Shared LP Pool (`RevealXPool.sol`)**: ERC-4626 vault accepting USDC. LPs deposit USDC, mint `rvlxUSDC` shares, and earn yield from protocol fees (30% of net house edge).
- **Creator Dashboard**: Anyone can launch a branded scratch card campaign, set revenue share, max plays, and expiry. Creators earn a configurable share of protocol fees.
- **Indexer Worker**: A background worker polls Base for `CampaignCreated` and `GameSettled` events, syncing on-chain data into Postgres for fast dashboard queries.
- **Solana v1 Remains Active**: Existing Solana scratch card games continue operating on the off-chain engine during the v2 rollout.

### v2 Contract Flow

```
Creator ──► CampaignRegistry.createCampaign()
                │
LP ──► RevealXPool.deposit(USDC) ──► mint rvlxUSDC
                │
Player ──► GameManager.playCard() ──► VRF request
                │
Chainlink ──► fulfillRandomWords() ──► settleWin()
                │
        RevealXPool.settleWin() ──► payout winner
                │
        CampaignRegistry.incrementPlayCount()
```

### v2 Deployment Steps

1. **Deploy contracts to Base Sepolia**:
   ```bash
   cd contracts/base
   source ../../.env
   forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --broadcast --verify
   ```
2. **Add `GameManager` as a VRF consumer** at https://vrf.chain.link
3. **Set contract addresses in `.env`**:
   ```env
   V2_REVEALX_POOL_ADDRESS=0x...
   V2_CAMPAIGN_REGISTRY_ADDRESS=0x...
   V2_GAME_MANAGER_ADDRESS=0x...
   VITE_REVEALX_POOL_ADDRESS=0x...
   VITE_CAMPAIGN_REGISTRY_ADDRESS=0x...
   VITE_GAME_MANAGER_ADDRESS=0x...
   ```
4. **Enable the indexer**:
   ```env
   ENABLE_INDEXER=true
   ```
5. **Run database migration**:
   ```bash
   npm run db:push
   ```
6. **Start the app**:
   ```bash
   npm run dev
   ```

---

## 🌐 Deployment

### Render (Recommended)

RevealX is designed to run as a **single full-stack service** on Render.

1. Connect `grkhmz23/RevealX` to a new Render Web Service
2. Set the build command:
   ```
   npm run build && npm run build:server
   ```
3. Set the start command:
   ```
   npm start
   ```
4. Add all environment variables from `.env.example`
5. Add `revealx.fun` as a Custom Domain and point your DNS to Render

The Express server serves the built React app from `dist/public` and handles all API routes on the same origin.

---

## 📁 Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/      # React components (scratch cards, wallet buttons, etc.)
│   │   ├── contexts/        # Wallet, chain, and game mode providers
│   │   ├── lib/             # Utilities, transaction builders, casino logic
│   │   └── pages/           # Route-level pages
│   ├── public/              # Static assets (logos, favicon)
│   └── index.html           # Vite entry point
├── server/
│   ├── index.ts             # Express server entry
│   ├── routes.ts            # API route definitions
│   ├── services/            # Solana, Base, Game, Casino Engine services
│   ├── middleware/          # Security, rate limiting, error handling
│   └── utils/               # Retry helpers, validators
├── shared/
│   └── schema.ts            # Drizzle ORM schemas and Zod types
├── contracts/base/          # Foundry project for Base v2 contracts
│   ├── src/                 # RevealXPool, CampaignRegistry, GameManager
│   └── test/                # Unit & fork tests
├── dist/
│   ├── public/              # Vite build output (served by Express)
│   └── index.js             # Bundled server for production
└── render.yaml              # Render Blueprint configuration
```

---

## ⚠️ Disclaimer

This is gambling software. Before deploying or operating RevealX, ensure you:
- Comply with all applicable laws and regulations in your jurisdiction
- Implement responsible gambling measures
- Provide clear terms of service and age verification
- Only operate where online gambling is legally permitted

---

## 📄 License

MIT License — see the [LICENSE](./LICENSE) file for details.

---

Built with 💜 on **Solana & Base**
