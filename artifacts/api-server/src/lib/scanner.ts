import { fetchParsedAccounts, invalidateCache, MIN_QUALIFIED_RAW, MIN_ACTIVE_RAW } from "../routes/qualified-count";
import { getActiveMint } from "./runtime-config";
import { logger } from "./logger";

const SCAN_INTERVAL_MS = 10_000;

export interface ScannerState {
  running: boolean;
  scanning: boolean;
  qualifiedCount: number;
  activeHolders: number;
  totalRawAccounts: number;
  lastScanAt: string | null;
  lastScanDurationMs: number | null;
  lastError: string | null;
  currentMint: string;
}

const state: ScannerState = {
  running: false,
  scanning: false,
  qualifiedCount: 0,
  activeHolders: 0,
  totalRawAccounts: 0,
  lastScanAt: null,
  lastScanDurationMs: null,
  lastError: null,
  currentMint: "",
};

let scanTimer: ReturnType<typeof setInterval> | null = null;

async function runScan(): Promise<void> {
  if (state.scanning) {
    logger.debug("Scanner: scan already in progress — skipping tick");
    return;
  }

  const mint = getActiveMint();
  if (!mint) {
    logger.debug("Scanner: no mint configured — skipping scan");
    return;
  }

  state.scanning = true;
  state.currentMint = mint;
  const start = Date.now();

  try {
    const { all, active, qualified } = await fetchParsedAccounts(mint);

    state.qualifiedCount = qualified.length;
    state.activeHolders = active.length;
    state.totalRawAccounts = all.length;
    state.lastScanAt = new Date().toISOString();
    state.lastScanDurationMs = Date.now() - start;
    state.lastError = null;

    logger.info(
      { mint, qualifiedCount: state.qualifiedCount, activeHolders: state.activeHolders, durationMs: state.lastScanDurationMs },
      "Scanner: scan complete"
    );
  } catch (err) {
    state.lastError = err instanceof Error ? err.message : String(err);
    state.lastScanDurationMs = Date.now() - start;
    logger.warn({ err, mint }, "Scanner: scan failed");
  } finally {
    state.scanning = false;
  }
}

export function startScanner(): void {
  if (scanTimer) {
    clearInterval(scanTimer);
  }

  state.running = true;

  scanTimer = setInterval(() => {
    runScan().catch((err) => logger.error({ err }, "Scanner: unhandled error"));
  }, SCAN_INTERVAL_MS);

  runScan().catch((err) => logger.error({ err }, "Scanner: initial scan failed"));

  logger.info({ intervalMs: SCAN_INTERVAL_MS }, "Scanner started");
}

export function stopScanner(): void {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  state.running = false;
  logger.info("Scanner stopped");
}

export function getScannerState(): ScannerState {
  return { ...state };
}
