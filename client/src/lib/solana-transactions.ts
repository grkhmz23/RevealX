import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL,
  SendTransactionError 
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface PurchaseTicketParams {
  wallet: WalletContextState;
  connection: Connection;
  ticketCost: number; // SOL amount
  poolWallet: string;
  teamWallet: string;
}

interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export async function purchaseTicket({
  wallet,
  connection,
  ticketCost,
  poolWallet,
  teamWallet
}: PurchaseTicketParams): Promise<TransactionResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Convert SOL to lamports
    const totalLamports = Math.floor(ticketCost * LAMPORTS_PER_SOL);
    const poolAmount = Math.floor(totalLamports * 0.9); // 90% to pool
    const teamAmount = totalLamports - poolAmount; // 10% to team

    // Create transaction
    const transaction = new Transaction();

    // Add transfer to pool wallet (90%)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(poolWallet),
        lamports: poolAmount,
      })
    );

    // Add transfer to team wallet (10%)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(teamWallet),
        lamports: teamAmount,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    return { success: true, signature };

  } catch (error) {
    console.error('Purchase transaction failed:', error);
    
    let errorMessage = 'Transaction failed';
    if (error instanceof SendTransactionError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

export async function checkTransactionStatus(
  connection: Connection,
  signature: string
): Promise<{ confirmed: boolean; error?: string }> {
  try {
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value?.err) {
      return { confirmed: false, error: 'Transaction failed' };
    }
    
    return { confirmed: status.value?.confirmationStatus === 'confirmed' };
  } catch (error) {
    return { confirmed: false, error: 'Failed to check transaction status' };
  }
}

export function formatTransactionUrl(signature: string, cluster: string = 'mainnet'): string {
  const clusterParam = cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
  return `https://solscan.io/tx/${signature}${clusterParam}`;
}