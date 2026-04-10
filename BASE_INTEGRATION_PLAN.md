# Base Chain Integration Plan

## Executive Summary

This document outlines the integration of **Base Chain** (Coinbase's Ethereum L2) into the Scratch 'n SOL casino platform, enabling multi-chain support for both Solana and Base.

**Base Chain Details:**
- **Type**: Ethereum Layer 2 (Optimistic Rollup on OP Stack)
- **Chain ID**: 8453 (Mainnet), 84532 (Sepolia Testnet)
- **RPC**: https://mainnet.base.org
- **Currency**: ETH (gas token)
- **Block Explorer**: https://basescan.org

---

## Goals

1. **Multi-Chain Support**: Allow users to play using either Solana (SOL) or Base (ETH)
2. **Seamless UX**: Unified interface for both chains
3. **Shared Game Logic**: Same scratch card game, different payment rails
4. **Security**: Maintain all existing security controls

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │           Chain Selection (Solana / Base)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                             │                                       │
│         ┌──────────────────┴──────────────────┐                    │
│         ▼                                      ▼                    │
│  ┌──────────────┐                    ┌──────────────┐              │
│  │    Solana    │                    │     Base     │              │
│  │  WalletCtx   │                    │   Wagmi/Viem │              │
│  │  @solana/    │                    │  @wagmi/core │              │
│  │ wallet-      │                    │   viem       │              │
│  │ adapter      │                    │              │              │
│  └──────────────┘                    └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Solana    │  │     Base     │  │   Unified    │              │
│  │   Service    │  │   Service    │  │    Game      │              │
│  │  (existing)  │  │    (new)     │  │    Engine    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Frontend Wallet Integration

### 1.1 Dependencies

```bash
# EVM/Web3 libraries
npm install wagmi viem @tanstack/react-query@latest

# Coinbase Wallet connector
npm install @coinbase/wallet-sdk

# MetaMask/other wallet support
npm install @wagmi/connectors
```

### 1.2 Wallet Configuration

Create `client/src/lib/base-wallet.ts`:

```typescript
import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export const baseConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({ 
      appName: 'Scratch n SOL',
      preference: 'smartWalletOnly' // Enable smart wallets
    }),
    injected(), // MetaMask & other injected wallets
    walletConnect({ 
      projectId: process.env.VITE_WC_PROJECT_ID || '' 
    }),
  ],
  transports: {
    [base.id]: http(process.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
})
```

### 1.3 Chain Context Provider

Create `client/src/contexts/chain-context.tsx`:

```typescript
// Unified chain context to manage Solana vs Base selection
type ChainType = 'solana' | 'base'

interface ChainContextType {
  selectedChain: ChainType
  setSelectedChain: (chain: ChainType) => void
  isSolana: boolean
  isBase: boolean
}
```

### 1.4 Wallet Provider Wrapper

Create `client/src/components/providers.tsx`:

```typescript
// Wrap both Solana and Base providers
export function AppProviders({ children }) {
  return (
    <SolanaWalletProvider>
      <WagmiProvider config={baseConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </SolanaWalletProvider>
  )
}
```

---

## Phase 2: Backend Services

### 2.1 Base Service

Create `server/services/base.ts`:

```typescript
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export class BaseService {
  private publicClient
  private walletClient
  private poolAccount
  
  constructor() {
    const chain = process.env.BASE_NETWORK === 'mainnet' ? base : baseSepolia
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    })
    
    // Pool wallet from private key
    const privateKey = process.env.BASE_POOL_PRIVATE_KEY as `0x${string}`
    this.poolAccount = privateKeyToAccount(privateKey)
    
    this.walletClient = createWalletClient({
      account: this.poolAccount,
      chain,
      transport: http(rpcUrl),
    })
  }
  
  async sendPayout(toAddress: `0x${string}`, amountEth: number): Promise<`0x${string}`> {
    const hash = await this.walletClient.sendTransaction({
      to: toAddress,
      value: parseEther(amountEth.toString()),
    })
    return hash
  }
  
  async verifyTransaction(hash: `0x${string}`): Promise<boolean> {
    const receipt = await this.publicClient.getTransactionReceipt({ hash })
    return receipt?.status === 'success'
  }
  
  async getPoolBalance(): Promise<number> {
    const balance = await this.publicClient.getBalance({
      address: this.poolAccount.address,
    })
    return Number(formatEther(balance))
  }
}
```

### 2.2 Chain-Agnostic Game Service

Modify `server/services/game.ts`:

```typescript
// Unified game service that works with both chains
export class GameService {
  constructor(
    private solanaService: SolanaService,
    private baseService: BaseService,
  ) {}
  
  async createGame(params: CreateGameParams) {
    // Same game logic regardless of chain
    const gameResult = casinoEngine.calculateWin(params.ticketCost, poolBalance)
    
    // Store with chain identifier
    const game = await storage.createGame({
      ...gameResult,
      chain: params.chain, // 'solana' | 'base'
      playerWallet: params.walletAddress,
    })
    
    return game
  }
  
  async processPayout(game: Game, chain: ChainType) {
    if (chain === 'solana') {
      return this.solanaService.sendPayout(game.playerWallet, game.winAmount)
    } else {
      return this.baseService.sendPayout(
        game.playerWallet as `0x${string}`, 
        game.winAmount
      )
    }
  }
}
```

---

## Phase 3: Database Schema Updates

### 3.1 Updated Schema

Modify `shared/schema.ts`:

```typescript
// Add chain field to games
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chain: varchar("chain", { length: 10 }).notNull().default('solana'), // 'solana' | 'base'
  playerWallet: text("player_wallet").notNull(),
  ticketType: decimal("ticket_type", { precision: 10, scale: 2 }).notNull(),
  // ... rest of fields
  purchaseTxHash: text("purchase_tx_hash").notNull(), // Renamed from purchaseSignature for Base
  payoutTxHash: text("payout_tx_hash"),
})

// Separate pool balances per chain
export const chainStats = pgTable("chain_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chain: varchar("chain", { length: 10 }).notNull(),
  totalPool: decimal("total_pool", { precision: 10, scale: 2 }).notNull().default("0"),
  totalWins: integer("total_wins").notNull().default(0),
  lastWinAmount: decimal("last_win_amount", { precision: 10, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
```

---

## Phase 4: UI/UX Changes

### 4.1 Chain Selector Component

Create `client/src/components/chain-selector.tsx`:

```typescript
export function ChainSelector() {
  const { selectedChain, setSelectedChain } = useChain()
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setSelectedChain('solana')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          selectedChain === 'solana' ? "bg-purple-600" : "bg-gray-700"
        )}
      >
        <SolanaIcon />
        <span>Solana</span>
      </button>
      <button
        onClick={() => setSelectedChain('base')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          selectedChain === 'base' ? "bg-blue-600" : "bg-gray-700"
        )}
      >
        <BaseIcon />
        <span>Base</span>
      </button>
    </div>
  )
}
```

### 4.2 Dynamic Wallet Button

Create `client/src/components/dynamic-wallet-button.tsx`:

```typescript
export function DynamicWalletButton() {
  const { selectedChain } = useChain()
  
  if (selectedChain === 'solana') {
    return <SolanaWalletButton />
  }
  
  return <BaseWalletButton /> // Uses Wagmi's ConnectButton
}
```

### 4.3 Ticket Pricing per Chain

```typescript
// Different pricing but same value
const TICKET_TIERS = {
  solana: [
    { cost: 0.1, currency: 'SOL', maxWin: 1 },
    { cost: 0.2, currency: 'SOL', maxWin: 2 },
    { cost: 0.5, currency: 'SOL', maxWin: 5 },
    { cost: 0.75, currency: 'SOL', maxWin: 7.5 },
    { cost: 1.0, currency: 'SOL', maxWin: 10 },
  ],
  base: [
    { cost: 0.001, currency: 'ETH', maxWin: 0.01 }, // ~$2.50 at current prices
    { cost: 0.002, currency: 'ETH', maxWin: 0.02 },
    { cost: 0.005, currency: 'ETH', maxWin: 0.05 },
    { cost: 0.0075, currency: 'ETH', maxWin: 0.075 },
    { cost: 0.01, currency: 'ETH', maxWin: 0.1 },
  ],
}
```

---

## Phase 5: API Endpoints

### 5.1 New/Modified Endpoints

```typescript
// Chain-agnostic endpoints
app.post('/api/games/create-and-play', handler)
app.post('/api/games/payout', handler)

// Chain-specific stats
app.get('/api/stats/:chain', async (req, res) => {
  const { chain } = req.params // 'solana' | 'base'
  const stats = await storage.getChainStats(chain)
  const poolBalance = chain === 'solana' 
    ? await solanaService.getPoolBalance()
    : await baseService.getPoolBalance()
  
  res.json({ chain, totalPool: poolBalance, ...stats })
})

// Get pool balance for specific chain
app.get('/api/pool/balance/:chain', async (req, res) => {
  const { chain } = req.params
  const balance = chain === 'solana'
    ? await solanaService.getPoolBalance()
    : await baseService.getPoolBalance()
  
  res.json({ chain, balance })
})
```

---

## Phase 6: Environment Variables

Add to `.env.example`:

```bash
# ============================================
# Base Chain Configuration
# ============================================

# Base Network: 'mainnet' or 'sepolia'
BASE_NETWORK=mainnet

# Base RPC URL (optional - defaults to public endpoint)
# Recommended: Use Alchemy, Infura, or QuickNode for production
BASE_RPC_URL=https://mainnet.base.org

# Pool wallet private key (EVM format: 0x...)
BASE_POOL_PRIVATE_KEY=0x...

# Frontend Base Configuration
VITE_BASE_NETWORK=mainnet
VITE_BASE_RPC_URL=https://mainnet.base.org

# WalletConnect Project ID (for MetaMask, Rainbow, etc.)
VITE_WC_PROJECT_ID=your_walletconnect_project_id
```

---

## Phase 7: Deployment Considerations

### 7.1 Pool Wallet Setup

1. **Create Base wallet** (use same mnemonic as Solana for easier management, or separate)
2. **Fund with ETH** for gas and prizes
3. **Test on Sepolia first**
4. **Set up monitoring** for pool balance

### 7.2 Smart Contract Option (Future)

For advanced features, deploy a simple vault contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ScratchVault {
    address public owner;
    mapping(bytes32 => bool) public processedGames;
    
    event GamePlayed(bytes32 indexed gameId, address player, uint256 amount, bool won, uint256 payout);
    
    constructor() {
        owner = msg.sender;
    }
    
    function playGame(bytes32 gameId, bool won, uint256 payout) external {
        require(!processedGames[gameId], "Game already processed");
        processedGames[gameId] = true;
        
        if (won && payout > 0) {
            require(address(this).balance >= payout, "Insufficient vault balance");
            payable(msg.sender).transfer(payout);
        }
        
        emit GamePlayed(gameId, msg.sender, msg.value, won, payout);
    }
    
    function deposit() external payable {}
    
    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(amount);
    }
}
```

---

## Phase 8: Testing Plan

### 8.1 Test Cases

| Test | Solana | Base | Expected |
|------|--------|------|----------|
| Wallet Connection | Phantom | MetaMask | ✅ Connected |
| Buy Ticket | 0.1 SOL | 0.001 ETH | ✅ TX Success |
| Win Payout | Automatic | Automatic | ✅ Payout Received |
| Game History | Shows | Shows | ✅ Both Chains |
| Chain Switch | N/A | N/A | ✅ UI Updates |
| Rate Limiting | Applied | Applied | ✅ 429 Response |
| Idempotency | Works | Works | ✅ No Duplicates |

### 8.2 Testnet Testing

1. **Base Sepolia**:
   - Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
   - Test all flows
   - Verify transaction receipts

---

## Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | 2-3 days | Frontend wallet integration |
| **Phase 2** | 2-3 days | Backend Base service |
| **Phase 3** | 1 day | Database migrations |
| **Phase 4** | 2 days | UI components |
| **Phase 5** | 1 day | API endpoints |
| **Phase 6** | 1 day | Testing & bug fixes |
| **Total** | **9-11 days** | |

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Different gas mechanics | High | Thorough testing on Sepolia |
| Wallet compatibility | Medium | Support major wallets only |
| User confusion | Medium | Clear UI, tooltips, onboarding |
| Pool balance sync | Medium | Separate tracking per chain |
| Transaction failures | Medium | Retry logic, idempotency keys |

---

## Success Metrics

- [ ] Users can connect Base wallets (MetaMask, Coinbase Wallet)
- [ ] Users can buy scratch cards with ETH on Base
- [ ] Automatic payouts work on Base
- [ ] Game history shows both chains
- [ ] No regression in Solana functionality
- [ ] All security controls work on both chains

---

## Next Steps

1. **Review this plan** and approve approach
2. **Set up Base Sepolia test wallet**
3. **Get test ETH** for development
4. **Begin Phase 1** implementation

---

*Document Version: 1.0*  
*Last Updated: 2025-04-10*
