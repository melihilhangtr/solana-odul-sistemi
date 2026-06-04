---
name: Token Reward System
description: Solana holder tarayıcı + SOL dağıtım sistemi — mimari kararlar, hata prefix'leri, sabitleme notu.
---

## Durum
Sistem sabitlenmiştir. Kullanıcı ek özellik istememektedir.

## Hata Prefix'leri (reward-engine.ts)
- `FEE_RESERVE_LOW:` — vault ≤ 0.05 SOL → tüm dağıtımlar durur → dashboard'da kırmızı "Yetersiz Fee Bakiyesi" banner'ı
- `INSUFFICIENT_BALANCE:` — vault, tur miktarını karşılamıyor → o tur atlanır → turuncu "Yetersiz Bakiye" banner'ı

**Why:** İki farklı hata durumunun UI'da ayrı renk/mesajla gösterilmesi gerekiyordu.

## Scheduler Mantığı (scheduler.ts)
Dağıtım için tüm bu koşullar sağlanmalı:
1. `getDistributionEnabled()` → true
2. `isVaultConfigured()` → true (VAULT_PRIVATE_KEY set)
3. `qualified.length > 0`
4. `getRewardAmountSol() > 0` (sıfırsa pas geç, kasaya dokunma)

## Kalıcı Config (runtime-config.ts → system_config DB tablosu)
| DB Key | Getter | Varsayılan |
|---|---|---|
| `active_mint` | `getActiveMint()` | DEFAULT_MINT |
| `reward_amount_sol` | `getRewardAmountSol()` | 0 |
| `distribution_enabled` | `getDistributionEnabled()` | true |

**Why:** Sunucu yeniden başlatılınca config kaybolmasın.

## Gerekli Secrets
- `ADMIN_PASSWORD` — panel girişi
- `SESSION_SECRET` — express-session cookie imzası
- `VAULT_PRIVATE_KEY` — base58 veya JSON byte array; olmadan dağıtım çalışmaz

## Kullanıcı Tercihi
Sistem bu haliyle sabitlenmiştir. Yeni özellik ekleme.
