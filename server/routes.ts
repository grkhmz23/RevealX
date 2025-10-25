import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";
import { SolanaService } from "./services/solana";
import { casinoEngine } from "./services/casino-engine";

const solanaService = new SolanaService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Get game statistics with real blockchain pool balance
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      
      // Get real pool balance from blockchain wallet
      const poolBalance = await solanaService.getPoolBalance();
      
      res.json({
        totalPool: poolBalance.toString(),
        totalWins: stats?.totalWins || 0,
        lastWinAmount: stats?.lastWinAmount || "0",
        poolWallet: solanaService.getPoolWalletAddress(),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get recent wins
  app.get("/api/games/recent-wins", async (req, res) => {
    try {
      const recentWins = await storage.getRecentWins(10);
      res.json(recentWins);
    } catch (error) {
      console.error("Error fetching recent wins:", error);
      res.status(500).json({ message: "Failed to fetch recent wins" });
    }
  });

  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(400).json({ message: "Invalid game data" });
    }
  });

  // RPC Proxy endpoint to avoid CORS and rate limiting issues
  app.post('/api/rpc-proxy', async (req, res) => {
    try {
      const heliusKey = process.env.HELIUS_API_KEY;
      
      // Priority order for RPC endpoints
      const endpoints = [
        heliusKey ? `https://rpc.helius.xyz/?api-key=${heliusKey}` : null,
        'https://api.mainnet-beta.solana.com',
        'https://ssc-dao.genesysgo.net/',
        'https://rpc.ankr.com/solana',
      ].filter(Boolean);

      let lastError;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        if (!endpoint) continue;
        
        try {
          console.log(`Trying RPC endpoint: ${endpoint.includes('api-key') ? 'https://rpc.helius.xyz/?api-key=***' : endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`RPC request successful via ${endpoint.includes('api-key') ? 'Helius' : endpoint}`);
            return res.json(data);
          } else {
            const errorText = await response.text();
            lastError = `HTTP ${response.status}: ${errorText}`;
            console.log(`RPC endpoint failed: ${lastError}`);
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          console.log(`RPC endpoint ${endpoint} failed: ${lastError}`);
          continue;
        }
      }

      // All endpoints failed
      console.error('All RPC endpoints failed:', lastError);
      res.status(503).json({
        error: 'RPC_UNAVAILABLE',
        message: 'All Solana RPC endpoints are currently unavailable',
        lastError
      });

    } catch (error) {
      console.error('RPC proxy error:', error);
      res.status(500).json({
        error: 'PROXY_ERROR',
        message: 'Internal server error in RPC proxy'
      });
    }
  });

  // Process payout for winning game
  app.post("/api/games/payout", async (req, res) => {
    try {
      const { playerWallet, winAmount, gameId } = req.body;
      
      if (!playerWallet || !winAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify this is not a demo wallet
      if (playerWallet.startsWith('demo') || playerWallet.startsWith('Demo')) {
        // Demo mode - simulate payout
        const demoSignature = `demo_payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return res.json({ success: true, signature: demoSignature, demo: true });
      }

      // Send payout using pool wallet
      const payoutSignature = await solanaService.sendPayout(
        playerWallet,
        parseFloat(winAmount)
      );

      if (payoutSignature) {
        // Update win statistics only (pool balance is on blockchain)
        const currentStats = await storage.getStats();
        const currentWins = currentStats?.totalWins || 0;
        
        await storage.updateStats({
          totalWins: currentWins + 1,
          lastWinAmount: winAmount,
        });

        // Save payout signature to game record if gameId provided
        if (gameId) {
          await storage.updateGamePayout(gameId, payoutSignature);
        }

        res.json({ success: true, signature: payoutSignature });
      } else {
        res.status(500).json({ message: "Payout transaction failed" });
      }
    } catch (error) {
      console.error("Error processing payout:", error);
      res.status(500).json({ message: "Failed to process payout" });
    }
  });

  // Check if pool can support a game - uses real blockchain balance
  app.post("/api/pool/check", async (req, res) => {
    try {
      const { ticketCost } = req.body;
      
      if (!ticketCost || ticketCost <= 0) {
        return res.status(400).json({ 
          error: 'Invalid ticket cost',
          canPlay: false 
        });
      }

      // Get real pool balance from blockchain wallet
      const poolBalance = await solanaService.getPoolBalance();
      
      // Check if game can be played
      const gameResult = casinoEngine.calculateWin(ticketCost, poolBalance);
      const isHealthy = casinoEngine.isPoolHealthy(poolBalance);
      
      res.json({
        canPlay: poolBalance > casinoEngine.getMinPoolReserve() + ticketCost,
        poolBalance: poolBalance,
        maxPayout: gameResult.maxPayout,
        currentWinRate: gameResult.adjustedWinRate,
        isPoolHealthy: isHealthy,
        reason: gameResult.reason || null
      });
      
    } catch (error) {
      console.error('Pool check failed:', error);
      res.status(500).json({ 
        error: 'Failed to check pool status',
        canPlay: false
      });
    }
  });

  // Get player's game history
  app.get("/api/games/:wallet", async (req, res) => {
    try {
      const { wallet } = req.params;
      const games = await storage.getGamesByWallet(wallet);
      res.json(games);
    } catch (error) {
      console.error("Error fetching player games:", error);
      res.status(500).json({ message: "Failed to fetch player games" });
    }
  });

  // Pool balance endpoint
  app.get("/api/pool/balance", async (req, res) => {
    try {
      const payoutService = await import('./services/solana-payout');
      const service = payoutService.getPayoutService();
      const balance = await service.getPoolBalance();
      
      res.json({
        balance,
        poolWallet: service.getPoolPublicKey()
      });
    } catch (error) {
      console.error("Pool balance error:", error);
      res.status(500).json({ message: "Failed to get pool balance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
