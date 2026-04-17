/**
 * Base Sepolia Event Indexer
 *
 * Polls CampaignRegistry and GameManager contracts every 15 seconds,
 * reads CampaignCreated and GameSettled events via viem getLogs,
 * and upserts aggregated data into Postgres.
 */

import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { storage } from "../storage";

// Minimal ABI fragments for the events we index
const campaignCreatedEvent = parseAbiItem(
  "event CampaignCreated(bytes32 indexed campaignId, (address creator,uint16 creatorShareBps,uint8 tier,string brandingURI,uint32 maxPlays,uint64 expiry) config)"
);

const gameSettledEvent = parseAbiItem(
  "event GameSettled(address indexed player, bytes32 indexed campaignId, uint8 tier, uint256 wager, uint256 payout, uint256 requestId)"
);

const CHAIN = "base";
const POLL_INTERVAL_MS = 15_000;
const START_BLOCK_FALLBACK = Number(process.env.BASE_INDEXER_START_BLOCK || "0");

interface IndexerConfig {
  rpcUrl: string;
  campaignRegistryAddress: Address;
  gameManagerAddress: Address;
}

export class BaseIndexer {
  private client: any;
  private config: IndexerConfig;
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(config: IndexerConfig) {
    this.config = config;
    const chain = process.env.BASE_NETWORK === "mainnet" ? base : baseSepolia;
    this.client = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });
  }

  async start() {
    if (this.running) return;
    this.running = true;
    console.log("[BaseIndexer] Starting...");

    // Do an immediate run, then schedule repeats
    await this.run();
    this.timer = setInterval(() => {
      this.run().catch((err) => {
        console.error("[BaseIndexer] Run failed:", err);
      });
    }, POLL_INTERVAL_MS);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log("[BaseIndexer] Stopped.");
  }

  private async run() {
    const state = await storage.getIndexerState(CHAIN);
    const fromBlock = BigInt(state?.lastIndexedBlock || START_BLOCK_FALLBACK);
    const latestBlock = await this.client.getBlockNumber();

    if (fromBlock >= latestBlock) {
      return; // nothing new
    }

    console.log(`[BaseIndexer] Indexing blocks ${fromBlock} -> ${latestBlock}`);

    // Fetch CampaignCreated logs
    const createdLogs = await this.client.getLogs({
      address: this.config.campaignRegistryAddress,
      event: campaignCreatedEvent,
      fromBlock,
      toBlock: latestBlock,
    });

    for (const log of createdLogs) {
      await this.handleCampaignCreated(log);
    }

    // Fetch GameSettled logs
    const settledLogs = await this.client.getLogs({
      address: this.config.gameManagerAddress,
      event: gameSettledEvent,
      fromBlock,
      toBlock: latestBlock,
    });

    for (const log of settledLogs) {
      await this.handleGameSettled(log);
    }

    await storage.updateIndexerState(CHAIN, Number(latestBlock));
    console.log(`[BaseIndexer] Indexed ${createdLogs.length} campaigns, ${settledLogs.length} plays`);
  }

  private async handleCampaignCreated(log: any) {
    const campaignId = log.args.campaignId;
    const config = log.args.config;
    if (!campaignId || !config) return;

    await storage.upsertCampaign({
      id: campaignId,
      creator: config.creator,
      creatorShareBps: config.creatorShareBps,
      tier: config.tier,
      brandingURI: config.brandingURI,
      maxPlays: config.maxPlays,
      expiry: new Date(Number(config.expiry) * 1000),
    });
  }

  private async handleGameSettled(log: any) {
    const args = log.args;
    if (!args.campaignId) return;

    const campaignId = args.campaignId;
    const player = args.player;
    const tier = args.tier;
    const wager = args.wager?.toString() || "0";
    const payout = args.payout?.toString() || "0";
    const requestId = args.requestId?.toString() || "0";

    // Compute creator fee from net edge (same math as RevealXPool.settleWin)
    const netEdge = BigInt(wager) > BigInt(payout) ? BigInt(wager) - BigInt(payout) : 0n;
    const protocolFee = (netEdge * 3000n) / 10000n; // 30% PROTOCOL_FEE_BPS

    const campaign = await storage.getCampaign(campaignId);
    const creatorShareBps = BigInt(campaign?.creatorShareBps || 0);
    const creatorFee = (protocolFee * creatorShareBps) / 10000n;

    await storage.createCampaignPlay({
      campaignId,
      player: player || "0x0",
      tier: tier || 0,
      wager,
      payout,
      requestId,
      blockNumber: Number(log.blockNumber),
      txHash: log.transactionHash,
    });

    await storage.incrementCampaignStats(campaignId, wager, payout, creatorFee.toString());
  }
}

let indexerInstance: BaseIndexer | null = null;

export function getIndexer(): BaseIndexer | null {
  return indexerInstance;
}

export function startBaseIndexer(): BaseIndexer | null {
  const registryAddress = process.env.V2_CAMPAIGN_REGISTRY_ADDRESS as Address | undefined;
  const gameManagerAddress = process.env.V2_GAME_MANAGER_ADDRESS as Address | undefined;
  const rpcUrl = process.env.BASE_RPC_URL || "https://sepolia.base.org";

  if (!registryAddress || !gameManagerAddress) {
    console.warn("[BaseIndexer] V2_CAMPAIGN_REGISTRY_ADDRESS or V2_GAME_MANAGER_ADDRESS not set. Skipping.");
    return null;
  }

  if (indexerInstance) {
    return indexerInstance;
  }

  indexerInstance = new BaseIndexer({
    rpcUrl,
    campaignRegistryAddress: registryAddress,
    gameManagerAddress,
  });

  indexerInstance.start().catch((err) => {
    console.error("[BaseIndexer] Failed to start:", err);
  });

  return indexerInstance;
}

export function stopBaseIndexer() {
  indexerInstance?.stop();
  indexerInstance = null;
}
