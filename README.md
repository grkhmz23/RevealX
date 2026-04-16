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
| **Deployment** | Render (full-stack single service) |

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

| Tier | Solana (SOL) | Base (USDC) | Max Win |
|------|--------------|-------------|---------|
| Bronze | 0.1 | 1 | 1× / 10× |
| Silver | 0.2 | 2 | 2× / 20× |
| Gold | 0.5 | 5 | 5× / 50× |
| Platinum | 0.75 | 10 | 7.5× / 100× |
| Diamond | 1.0 | 25 | 10× / 250× |

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
