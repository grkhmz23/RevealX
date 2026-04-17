/**
 * Base Contract Service (v2)
 *
 * Reads from the deployed Base contracts using viem.
 * Used by the backend API and indexer to interact with the on-chain pool.
 */

import { createPublicClient, http, formatUnits, type Address, type PublicClient } from "viem";
import { base, baseSepolia } from "viem/chains";

const chain = process.env.BASE_NETWORK === "mainnet" ? base : baseSepolia;
const rpcUrl = process.env.BASE_RPC_URL || (process.env.BASE_NETWORK === "mainnet" ? "https://mainnet.base.org" : "https://sepolia.base.org");

const client = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

// Minimal ERC-4626 + RevealXPool read ABI
const poolAbi = [
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxPayout",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxPayoutBps",
    outputs: [{ name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Minimal CampaignRegistry read ABI
const registryAbi = [
  {
    inputs: [{ name: "campaignId", type: "bytes32" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "creatorShareBps", type: "uint16" },
          { name: "tier", type: "uint8" },
          { name: "brandingURI", type: "string" },
          { name: "maxPlays", type: "uint32" },
          { name: "expiry", type: "uint64" },
        ],
        name: "config",
        type: "tuple",
      },
      { name: "plays", type: "uint32" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "campaignId", type: "bytes32" }],
    name: "isCampaignActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function getPoolTvl(poolAddress: Address): Promise<string> {
  const totalAssets = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "totalAssets",
  });
  return formatUnits(totalAssets, 6);
}

export async function getPoolMaxPayout(poolAddress: Address): Promise<string> {
  const maxPayout = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "maxPayout",
  });
  return formatUnits(maxPayout, 6);
}

export async function getPoolMaxPayoutBps(poolAddress: Address): Promise<number> {
  const bps = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "maxPayoutBps",
  });
  return bps;
}

export async function getLpShareBalance(poolAddress: Address, lpAddress: Address): Promise<string> {
  const balance = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "balanceOf",
    args: [lpAddress],
  });
  return formatUnits(balance, 6);
}

export async function getLpAssetValue(poolAddress: Address, shares: bigint): Promise<string> {
  const assets = await client.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: "convertToAssets",
    args: [shares],
  });
  return formatUnits(assets, 6);
}

export async function getOnChainCampaign(registryAddress: Address, campaignId: `0x${string}`) {
  const [config, plays, active] = await client.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "getCampaign",
    args: [campaignId],
  });

  return {
    creator: config.creator,
    creatorShareBps: config.creatorShareBps,
    tier: config.tier,
    brandingURI: config.brandingURI,
    maxPlays: config.maxPlays,
    expiry: new Date(Number(config.expiry) * 1000),
    plays,
    active,
  };
}

export async function isCampaignActive(registryAddress: Address, campaignId: `0x${string}`): Promise<boolean> {
  return await client.readContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "isCampaignActive",
    args: [campaignId],
  });
}
