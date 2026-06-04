import { Router, type IRouter } from "express";
import { Connection, PublicKey } from "@solana/web3.js";

const router: IRouter = Router();

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const TOKEN_DECIMALS = 6;
export const MIN_QUALIFIED_AMOUNT = 500_000;
export const MIN_ACTIVE_AMOUNT = 100;
export const DEFAULT_MINT = "";

export const MIN_QUALIFIED_RAW = BigInt(MIN_QUALIFIED_AMOUNT) * BigInt(10 ** TOKEN_DECIMALS);
export const MIN_ACTIVE_RAW = BigInt(MIN_ACTIVE_AMOUNT) * BigInt(10 ** TOKEN_DECIMALS);

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  qualifiedCount: number;
  activeHolders: number;
  totalRawAccounts: number;
  cachedAt: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getFromCache(mint: string): CacheEntry | null {
  const entry = cache.get(mint);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(mint);
    return null;
  }
  return entry;
}

function setCache(
  mint: string,
  qualifiedCount: number,
  activeHolders: number,
  totalRawAccounts: number
): CacheEntry {
  const now = Date.now();
  const entry: CacheEntry = {
    qualifiedCount,
    activeHolders,
    totalRawAccounts,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  };
  cache.set(mint, entry);
  return entry;
}

export interface ParsedAccount {
  walletAddress: string;
  rawAmount: bigint;
}

export async function fetchParsedAccounts(mint: string): Promise<{
  all: ParsedAccount[];
  active: ParsedAccount[];
  qualified: ParsedAccount[];
}> {
  const mintPubkey = new PublicKey(mint);
  const connection = new Connection(RPC_ENDPOINT, "confirmed");

  const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
    filters: [
      { dataSize: 165 },
      { memcmp: { offset: 0, bytes: mintPubkey.toBase58() } },
    ],
  });

  const all: ParsedAccount[] = [];
  const active: ParsedAccount[] = [];
  const qualified: ParsedAccount[] = [];

  for (const acc of accounts) {
    const data = acc.account.data as {
      parsed?: { info?: { owner?: string; tokenAmount?: { amount?: string } } };
    };
    const rawAmountStr = data?.parsed?.info?.tokenAmount?.amount;
    const owner = data?.parsed?.info?.owner;
    if (!rawAmountStr || !owner) continue;

    const rawAmount = BigInt(rawAmountStr);
    const parsed: ParsedAccount = { walletAddress: owner, rawAmount };
    all.push(parsed);

    if (rawAmount >= MIN_ACTIVE_RAW) {
      active.push(parsed);
    }
    if (rawAmount >= MIN_QUALIFIED_RAW) {
      qualified.push(parsed);
    }
  }

  return { all, active, qualified };
}

export function invalidateCache(mint: string): boolean {
  return cache.delete(mint);
}

router.get("/qualified-count", async (req, res) => {
  const mint = (req.query.mint as string | undefined) ?? DEFAULT_MINT;

  try {
    new PublicKey(mint);
  } catch {
    res.status(400).json({ error: "Invalid mint address" });
    return;
  }

  const cached = getFromCache(mint);
  if (cached) {
    res.json({
      mint,
      qualifiedCount: cached.qualifiedCount,
      minTokenAmount: MIN_QUALIFIED_AMOUNT,
      minActiveAmount: MIN_ACTIVE_AMOUNT,
      decimals: TOKEN_DECIMALS,
      activeHolders: cached.activeHolders,
      totalRawAccounts: cached.totalRawAccounts,
      cached: true,
      cachedAt: new Date(cached.cachedAt).toISOString(),
      expiresAt: new Date(cached.expiresAt).toISOString(),
    });
    return;
  }

  try {
    const { all, active, qualified } = await fetchParsedAccounts(mint);

    const entry = setCache(mint, qualified.length, active.length, all.length);

    res.json({
      mint,
      qualifiedCount: qualified.length,
      minTokenAmount: MIN_QUALIFIED_AMOUNT,
      minActiveAmount: MIN_ACTIVE_AMOUNT,
      decimals: TOKEN_DECIMALS,
      activeHolders: active.length,
      totalRawAccounts: all.length,
      cached: false,
      cachedAt: new Date(entry.cachedAt).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch token accounts");
    res.status(502).json({ error: "Failed to fetch token accounts from Solana RPC" });
  }
});

router.delete("/qualified-count/cache", (req, res) => {
  const mint = (req.query.mint as string | undefined) ?? DEFAULT_MINT;
  const cleared = invalidateCache(mint);
  res.json({ mint, cleared });
});

export default router;
