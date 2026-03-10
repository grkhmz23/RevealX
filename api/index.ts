import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { 
  Connection, Keypair, PublicKey, SystemProgram, Transaction, 
  LAMPORTS_PER_SOL, sendAndConfirmTransaction 
} from '@solana/web3.js';
import bs58 from 'bs58';
import { randomBytes } from 'crypto';

// Setup Neon DB
neonConfig.webSocketConstructor = ws;

// Simple in-memory storage for serverless
const storage = {
  async createGame(gameData: any) {
    const id = randomUUID();
    return { ...gameData, id, createdAt: new Date() };
  },
  async getGame(id: string) {
    return null;
  },
  async getRecentWins(limit: number = 10) {
    return [];
  },
  async getStats() {
    return { totalWins: 0, lastWinAmount: "0" };
  },
  async updateStats(updates: any) {
    return updates;
  }
};

// Solana Service
class SolanaService {
  connection: Connection;
  poolWallet: Keypair;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com');
    
    this.connection = new Connection(rpcUrl, 'confirmed');

    const poolPrivateKey = process.env.POOL_WALLET_PRIVATE_KEY;
    if (!poolPrivateKey) {
      throw new Error('POOL_WALLET_PRIVATE_KEY required');
    }

    try {
      let secretKey: Uint8Array;
      if (poolPrivateKey.startsWith('[')) {
        secretKey = new Uint8Array(JSON.parse(poolPrivateKey));
      } else {
        secretKey = bs58.decode(poolPrivateKey);
      }
      this.poolWallet = Keypair.fromSecretKey(secretKey);
    } catch (error) {
      throw new Error('Invalid POOL_WALLET_PRIVATE_KEY format');
    }
  }

  async getPoolBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.poolWallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      return 0;
    }
  }

  getPoolWalletAddress(): string {
    return this.poolWallet.publicKey.toString();
  }
}

// Casino Engine
function secureRandom() {
  const bytes = randomBytes(8);
  const num = bytes.readBigUInt64BE();
  return Number(num) / Number(2n ** 64n);
}

const gameSymbols = ['🎉', '💎', '❌', '🎯', '⭐'];

function generateSymbols() {
  return Array.from({ length: 3 }, () => 
    gameSymbols[Math.floor(secureRandom() * gameSymbols.length)]
  );
}

function calculateWin(ticketCost: number, poolBalance: number) {
  const symbols = generateSymbols();
  const isWin = secureRandom() < 0.25; // 25% win rate
  
  if (isWin && poolBalance > ticketCost * 2) {
    const multiplier = [1, 2, 5, 10][Math.floor(secureRandom() * 4)];
    const winAmount = Math.min(ticketCost * multiplier, poolBalance * 0.25);
    return { 
      isWin: true, 
      symbols: [symbols[0], symbols[0], symbols[0]], 
      multiplier, 
      winAmount 
    };
  }
  
  return { isWin: false, symbols, multiplier: 0, winAmount: 0 };
}

// Initialize services
let solanaService: SolanaService;
try {
  solanaService = new SolanaService();
} catch (e) {
  console.error('Solana service init failed:', e);
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url?.replace('/api', '') || '';

  try {
    // Health check
    if (path === '/health' || path === '/') {
      return res.json({ 
        status: 'ok', 
        poolWallet: solanaService?.getPoolWalletAddress() || 'not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Get stats
    if (path === '/stats' && req.method === 'GET') {
      if (!solanaService) {
        return res.status(500).json({ error: 'Solana service not initialized' });
      }
      
      const poolBalance = await solanaService.getPoolBalance();
      const stats = await storage.getStats();
      
      return res.json({
        totalPool: poolBalance.toString(),
        totalWins: stats?.totalWins || 0,
        lastWinAmount: stats?.lastWinAmount || "0",
        poolWallet: solanaService.getPoolWalletAddress(),
      });
    }

    // Create game
    if (path === '/games/create-and-play' && req.method === 'POST') {
      if (!solanaService) {
        return res.status(500).json({ error: 'Solana service not initialized' });
      }

      const { ticketCost, playerWallet } = req.body;
      
      if (!ticketCost || !playerWallet) {
        return res.status(400).json({ error: 'Missing ticketCost or playerWallet' });
      }

      const poolBalance = await solanaService.getPoolBalance();
      const result = calculateWin(parseFloat(ticketCost), poolBalance);

      return res.json({
        gameId: randomUUID(),
        symbols: result.symbols,
        isWin: result.isWin,
        multiplier: result.multiplier,
        winAmount: result.winAmount,
      });
    }

    // Pool check
    if (path === '/pool/check' && req.method === 'POST') {
      if (!solanaService) {
        return res.status(500).json({ error: 'Solana service not initialized' });
      }

      const { ticketCost } = req.body;
      const poolBalance = await solanaService.getPoolBalance();

      return res.json({
        canPlay: poolBalance > ticketCost,
        poolBalance,
      });
    }

    // RPC Proxy
    if (path === '/rpc-proxy' && req.method === 'POST') {
      const endpoints = [
        process.env.HELIUS_API_KEY ? `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}` : null,
        'https://api.mainnet-beta.solana.com',
        'https://ssc-dao.genesysgo.net/',
      ].filter(Boolean);

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint as string, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          });

          if (response.ok) {
            const data = await response.json();
            return res.json(data);
          }
        } catch (e) {
          continue;
        }
      }

      return res.status(503).json({ error: 'All RPC endpoints failed' });
    }

    // 404 for unknown routes
    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
