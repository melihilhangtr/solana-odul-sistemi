import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

let _vault: Keypair | null = null;

export function getVaultKeypair(): Keypair {
  if (_vault) return _vault;

  const raw = process.env["VAULT_PRIVATE_KEY"];
  if (!raw) {
    throw new Error(
      "VAULT_PRIVATE_KEY is not set. Add it to your environment secrets."
    );
  }

  try {
    const trimmed = raw.trim();

    if (trimmed.startsWith("[")) {
      const arr = JSON.parse(trimmed) as number[];
      _vault = Keypair.fromSecretKey(Uint8Array.from(arr));
    } else {
      const bytes = bs58.decode(trimmed);
      _vault = Keypair.fromSecretKey(bytes);
    }

    return _vault;
  } catch (err) {
    throw new Error(
      `Failed to parse VAULT_PRIVATE_KEY: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export function isVaultConfigured(): boolean {
  try {
    getVaultKeypair();
    return true;
  } catch {
    return false;
  }
}
