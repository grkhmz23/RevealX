import { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import bs58 from 'bs58';

interface PayoutParams {
  winnerPublicKey: string;
  winAmount: number; // SOL amount
  gameId: string;
}

interface PayoutResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export class SolanaPayoutService {
  private connection: Connection;
  private poolWallet: Keypair;

  constructor() {
    // Initialize connection (use custom RPC or default mainnet)
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Load pool wallet from private key
    if (!process.env.POOL_WALLET_PRIVATE_KEY) {
      throw new Error('POOL_WALLET_PRIVATE_KEY environment variable is required');
    }

    try {
      // Decode base58 private key
      const privateKeyBytes = bs58.decode(process.env.POOL_WALLET_PRIVATE_KEY);
      this.poolWallet = Keypair.fromSecretKey(privateKeyBytes);
      
      console.log('Solana payout service initialized with pool wallet:', this.poolWallet.publicKey.toString());
    } catch (error) {
      throw new Error('Invalid POOL_WALLET_PRIVATE_KEY format. Must be base58 encoded.');
    }
  }

  async sendPayout({ winnerPublicKey, winAmount, gameId }: PayoutParams): Promise<PayoutResult> {
    try {
      console.log(`Processing payout for game ${gameId}: ${winAmount} SOL to ${winnerPublicKey}`);

      // Validate winner public key
      let winnerPubkey: PublicKey;
      try {
        winnerPubkey = new PublicKey(winnerPublicKey);
      } catch (error) {
        return { success: false, error: 'Invalid winner public key' };
      }

      // Convert SOL to lamports
      const lamports = Math.floor(winAmount * LAMPORTS_PER_SOL);
      
      if (lamports <= 0) {
        return { success: false, error: 'Invalid win amount' };
      }

      // Check pool wallet balance
      const poolBalance = await this.connection.getBalance(this.poolWallet.publicKey);
      if (poolBalance < lamports) {
        console.error(`Insufficient pool balance: ${poolBalance} lamports, need ${lamports}`);
        return { success: false, error: 'Insufficient pool balance' };
      }

      // Create payout transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.poolWallet.publicKey,
          toPubkey: winnerPubkey,
          lamports: lamports,
        })
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.poolWallet],
        { commitment: 'confirmed' }
      );

      console.log(`Payout successful! Signature: ${signature}`);
      return { success: true, signature };

    } catch (error) {
      console.error('Payout failed:', error);
      
      let errorMessage = 'Payout transaction failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async getPoolBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.poolWallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to fetch pool balance:', error);
      return 0;
    }
  }

  getPoolPublicKey(): string {
    return this.poolWallet.publicKey.toString();
  }
}

// Singleton instance
let payoutService: SolanaPayoutService | null = null;

export function getPayoutService(): SolanaPayoutService {
  if (!payoutService) {
    payoutService = new SolanaPayoutService();
  }
  return payoutService;
}