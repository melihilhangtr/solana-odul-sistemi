# Token Reward Admin

Solana token mint'inin holder'larını tarayan, nitelikli cüzdanlara otomatik SOL ödülü dağıtan şifreli admin panelidir.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API sunucusunu başlat (port 8080)
- `pnpm run typecheck` — tüm paketlerde typecheck
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI spec'ten hook ve Zod şemalarını yeniden üret
- `pnpm --filter @workspace/db run push` — DB şema değişikliklerini uygula (sadece dev)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Solana: `@solana/web3.js`
- Scheduler: `node-cron`
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/` — tüm uygulama kodu
  - `lib/scanner.ts` — 10 sn'de bir holder tarayıcısı
  - `lib/scheduler.ts` — cron tabanlı ödül dağıtım zamanlayıcısı (`*/3 * * * *`)
  - `lib/reward-engine.ts` — batch SOL transferleri (10 per tx)
  - `lib/vault.ts` — VAULT_PRIVATE_KEY'den Keypair üretimi
  - `lib/runtime-config.ts` — kalıcı konfigürasyon (mint, rewardAmountSol, distributionEnabled)
  - `routes/dashboard.ts` — admin panel HTML (şifreli giriş gerektirir)
  - `routes/config-route.ts` — mint, reward amount, distribution toggle endpoint'leri
  - `routes/stats.ts` — tek endpoint'te tüm sistem durumu
- `lib/db/` — Drizzle ORM şemaları ve migration'lar

## Architecture decisions

- **Contract-first API:** OpenAPI spec → Orval codegen ile hook ve Zod şemaları üretilir.
- **Fee reserve:** Kasa bakiyesi ≤ 0.05 SOL'e düşerse tüm dağıtımlar otomatik durur (`FEE_RESERVE_LOW:` prefix ile hata fırlatır).
- **Budget check:** Kasa, belirlenen tur miktarını (rewardAmountSol) karşılamazsa o tur pas geçilir (`INSUFFICIENT_BALANCE:` prefix).
- **Kill switch:** `distributionEnabled` flag'i DB'ye kalıcı olarak yazılır; kapalıyken zamanlayıcı çalışmaya devam eder ama dağıtım yapmaz.
- **Reward amount = 0:** Miktar sıfırsa dağıtım adımı tamamen atlanır, kasaya dokunulmaz.
- **Session auth:** `express-session` + `ADMIN_PASSWORD` env; cookie 24 saat geçerli.

## Product

- `/` — Şifreli admin dashboard (login gerektirir)
- `/login` — Giriş ekranı
- `/api/stats` — Anlık sistem durumu (scanner + scheduler + rewards)
- `/api/config/mint` — Aktif token mint'i değiştir
- `/api/config/reward-amount` — Tur başına dağıtılacak SOL miktarı
- `/api/config/distribution-enabled` — Global dağıtım kill switch
- `/api/scheduler/start|stop|trigger` — Zamanlayıcı kontrolü
- `/api/snapshot` — Snapshot geçmişi
- `/api/reward/distributions` — Dağıtım geçmişi

## User preferences

- Ek özellik ekleme; sistemi mevcut haliyle sabitle.
- Tüm UI metinleri Türkçe.

## Gotchas

- `VAULT_PRIVATE_KEY` olmadan dağıtım çalışmaz; sadece snapshot alınır.
- Base58 veya JSON byte array formatı desteklenir.
- Sunucu yeniden başlatılırsa tüm konfigürasyon DB'den yüklenir (mint, rewardAmountSol, distributionEnabled).
- Default mint: *(panelden girilmeli — kod içinde sabit CA bulunmuyor)*

## Required Secrets

| Secret | Açıklama |
|---|---|
| `ADMIN_PASSWORD` | Panel giriş şifresi |
| `SESSION_SECRET` | Express session imzalama anahtarı |
| `VAULT_PRIVATE_KEY` | SOL gönderen kasa cüzdanının gizli anahtarı (base58 veya JSON array) |

## Pointers

- `pnpm-workspace` skill'i workspace yapısı, TypeScript kurulumu ve paket detayları için.
