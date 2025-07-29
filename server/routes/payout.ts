import { Router } from 'express';
import { z } from 'zod';
import { getPayoutService } from '../services/solana-payout';
import { db } from '../db';
import { games } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const payoutSchema = z.object({
  gameId: z.string(),
  winnerPublicKey: z.string(),
  winAmount: z.number().positive(),
});

// Process payout for a winning game
router.post('/api/games/payout', async (req, res) => {
  try {
    const { gameId, winnerPublicKey, winAmount } = payoutSchema.parse(req.body);

    // Verify the game exists and is a winning game
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (!game.isWin || game.payoutSignature) {
      return res.status(400).json({ message: 'Game is not eligible for payout or already paid' });
    }

    // Verify the winner public key matches the game player
    if (game.playerWallet !== winnerPublicKey) {
      return res.status(400).json({ message: 'Winner public key does not match game player' });
    }

    // Process the payout
    const payoutService = getPayoutService();
    const result = await payoutService.sendPayout({
      winnerPublicKey,
      winAmount,
      gameId
    });

    if (!result.success) {
      return res.status(500).json({ 
        message: 'Payout failed', 
        error: result.error 
      });
    }

    // Update the game with payout signature
    await db
      .update(games)
      .set({ payoutSignature: result.signature })
      .where(eq(games.id, gameId));

    res.json({
      success: true,
      signature: result.signature,
      message: 'Payout sent successfully'
    });

  } catch (error) {
    console.error('Payout route error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: error.errors 
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pool balance
router.get('/api/pool/balance', async (req, res) => {
  try {
    const payoutService = getPayoutService();
    const balance = await payoutService.getPoolBalance();
    
    res.json({
      balance,
      poolWallet: payoutService.getPoolPublicKey()
    });
  } catch (error) {
    console.error('Pool balance error:', error);
    res.status(500).json({ message: 'Failed to get pool balance' });
  }
});

export default router;