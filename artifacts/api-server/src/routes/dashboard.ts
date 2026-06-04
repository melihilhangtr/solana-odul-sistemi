import { Router, type IRouter } from "express";

const router: IRouter = Router();

const HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Token Reward Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f1117;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
  header{background:#1a1d27;border-bottom:1px solid #2d3148;padding:16px 32px;display:flex;align-items:center;gap:12px}
  header .logo{width:34px;height:34px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
  header h1{font-size:17px;font-weight:700;color:#f8fafc}
  header .mint-badge{font-size:12px;color:#64748b;margin-left:6px;font-family:monospace}
  header .spacer{flex:1}
  header .scan-indicator{font-size:12px;color:#64748b;display:flex;align-items:center;gap:6px;margin-right:12px}
  header .dot{width:8px;height:8px;border-radius:50%;background:#374151;flex-shrink:0}
  header .dot.scanning{background:#6366f1;animation:pulse 1s infinite}
  header .dot.ok{background:#34d399}
  header .dot.error{background:#f87171}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .logout-btn{background:none;border:1px solid #374151;color:#94a3b8;border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer;transition:all .2s}
  .logout-btn:hover{border-color:#6366f1;color:#f1f5f9}
  .container{max-width:960px;margin:0 auto;padding:28px 24px}
  .card{background:#1a1d27;border:1px solid #2d3148;border-radius:12px;padding:22px;margin-bottom:18px}
  .card h2{font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px}

  /* Kill switch card */
  .kill-card{border-radius:12px;padding:20px 24px;margin-bottom:18px;display:flex;align-items:center;gap:18px;transition:background .3s,border-color .3s}
  .kill-card.enabled{background:#0a1f12;border:1px solid #16a34a}
  .kill-card.disabled{background:#1c0a0a;border:1px solid #dc2626}
  .kill-status-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;transition:background .3s}
  .kill-card.enabled .kill-status-dot{background:#22c55e;box-shadow:0 0 8px #22c55e66}
  .kill-card.disabled .kill-status-dot{background:#ef4444;box-shadow:0 0 8px #ef444466}
  .kill-text{flex:1}
  .kill-text .kill-title{font-size:15px;font-weight:700;margin-bottom:3px;transition:color .3s}
  .kill-card.enabled .kill-title{color:#86efac}
  .kill-card.disabled .kill-title{color:#fca5a5}
  .kill-text .kill-sub{font-size:12px;color:#6b7280}
  .kill-toggle{border:none;border-radius:8px;padding:10px 28px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap}
  .kill-card.enabled .kill-toggle{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff}
  .kill-card.enabled .kill-toggle:hover{opacity:.85}
  .kill-card.disabled .kill-toggle{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff}
  .kill-card.disabled .kill-toggle:hover{opacity:.85}
  .kill-toggle:disabled{opacity:.4;cursor:not-allowed}

  .input-row{display:flex;gap:10px;align-items:stretch}
  .input-with-unit{position:relative;flex:1}
  .input-with-unit input{width:100%}
  .input-with-unit .unit{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:13px;font-weight:600;color:#6366f1;pointer-events:none}
  input[type=text],input[type=number]{flex:1;background:#0f1117;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#f1f5f9;font-size:14px;font-family:monospace;outline:none;transition:border-color .2s;width:100%}
  input[type=number]{padding-right:48px}
  input[type=text]:focus,input[type=number]:focus{border-color:#6366f1}
  input[type=text]::placeholder,input[type=number]::placeholder{color:#4b5563}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:.4}
  button{background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:opacity .2s}
  button:hover{opacity:.85}
  button:disabled{opacity:.4;cursor:not-allowed}
  .status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px}
  .stat{background:#0f1117;border:1px solid #2d3148;border-radius:8px;padding:13px 14px}
  .stat .label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
  .stat .value{font-size:15px;font-weight:700;color:#f1f5f9;word-break:break-all;font-family:monospace}
  .stat .value.green{color:#34d399}
  .stat .value.yellow{color:#fbbf24}
  .stat .value.red{color:#f87171}
  .stat .value.blue{color:#60a5fa}
  .stat .value.orange{color:#fb923c}
  .stat .sub{font-size:11px;color:#4b5563;margin-top:3px}
  .links-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .link-card{background:#0f1117;border:1px solid #2d3148;border-radius:8px;padding:13px 14px;text-decoration:none;display:block;transition:border-color .2s}
  .link-card:hover{border-color:#6366f1}
  .link-card .lc-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
  .link-card .lc-url{font-size:13px;color:#818cf8;font-family:monospace}
  .link-card .lc-desc{font-size:11px;color:#4b5563;margin-top:3px}
  .alert{padding:10px 14px;border-radius:8px;font-size:13px;margin-top:10px;display:none}
  .alert.success{background:#064e3b;border:1px solid #10b981;color:#6ee7b7}
  .alert.error{background:#450a0a;border:1px solid #ef4444;color:#fca5a5}
  .alert.show{display:block}
  .warn-banner{display:none;border-radius:10px;padding:14px 18px;margin-bottom:18px;align-items:center;gap:12px}
  .warn-banner.show{display:flex}
  .warn-banner .wb-icon{font-size:22px;flex-shrink:0}
  .warn-banner .wb-body .wb-title{font-size:14px;font-weight:700;margin-bottom:3px}
  .warn-banner .wb-body .wb-msg{font-size:12px}
  #feeBanner{background:#1c0505;border:1px solid #991b1b}
  #feeBanner .wb-title{color:#fca5a5}
  #feeBanner .wb-msg{color:#fecaca}
  #insufBanner{background:#431407;border:1px solid #c2410c}
  #insufBanner .wb-title{color:#fb923c}
  #insufBanner .wb-msg{color:#fdba74}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:7px 10px;color:#64748b;font-weight:500;border-bottom:1px solid #2d3148;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:8px 10px;border-bottom:1px solid #1e2133;color:#cbd5e1;font-family:monospace}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600}
  .badge.completed{background:#064e3b;color:#34d399}
  .badge.running{background:#1e3a5f;color:#60a5fa}
  .badge.failed{background:#450a0a;color:#f87171}
  .badge.pending{background:#2d2606;color:#fbbf24}
  .spinner{display:inline-block;width:13px;height:13px;border:2px solid #4b5563;border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:5px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .refresh-bar{height:2px;background:#2d3148;border-radius:1px;margin-top:10px;overflow:hidden}
  .refresh-bar-fill{height:100%;background:#6366f1;border-radius:1px;transition:width .9s linear}
  .reward-hint{font-size:12px;color:#4b5563;margin-top:8px;line-height:1.5}
  .reward-hint b{color:#94a3b8}
</style>
</head>
<body>
<header>
  <div class="logo">⚡</div>
  <h1>Token Reward Admin</h1>
  <span class="mint-badge" id="activeMintBadge">yükleniyor…</span>
  <div class="spacer"></div>
  <div class="scan-indicator">
    <div class="dot" id="scanDot"></div>
    <span id="scanLabel">—</span>
  </div>
  <form method="POST" action="/logout" style="margin:0">
    <button type="submit" class="logout-btn">Çıkış</button>
  </form>
</header>

<div class="container">

  <!-- Fee Reserve Uyarısı -->
  <div class="warn-banner" id="feeBanner">
    <div class="wb-icon">🚨</div>
    <div class="wb-body">
      <div class="wb-title">Yetersiz Fee Bakiyesi — Dağıtım Tamamen Durduruldu</div>
      <div class="wb-msg" id="feeMsg">Kasa bakiyesi 0.05 SOL fee rezervinin altına düştü. İşlem ücretlerini korumak için tüm dağıtımlar durduruldu. Kasaya SOL yükleyin.</div>
    </div>
  </div>

  <!-- Yetersiz Bütçe Uyarısı -->
  <div class="warn-banner" id="insufBanner">
    <div class="wb-icon">⚠️</div>
    <div class="wb-body">
      <div class="wb-title">Yetersiz Bakiye — Bu Tur Pas Geçildi</div>
      <div class="wb-msg" id="insufMsg">Kasa bakiyesi belirlenen tur miktarını karşılamıyor. Kasaya SOL yükleyin veya tur miktarını düşürün.</div>
    </div>
  </div>

  <!-- Kill Switch -->
  <div class="kill-card enabled" id="killCard">
    <div class="kill-status-dot" id="killDot"></div>
    <div class="kill-text">
      <div class="kill-title" id="killTitle">Dağıtım Sistemi Aktif</div>
      <div class="kill-sub" id="killSub">Her 3 dakikada bir ödüller otomatik dağıtılıyor</div>
    </div>
    <button class="kill-toggle" id="killBtn" onclick="toggleDistribution()">⏹ Dağıtımı Kapat</button>
  </div>

  <!-- Mint -->
  <div class="card">
    <h2>🎯 Token Mint Adresi</h2>
    <div class="input-row">
      <input type="text" id="mintInput" placeholder="Solana Token Mint adresi yapıştırın…"/>
      <button id="startBtn" onclick="applyMint()">🚀 Sistemi Başlat</button>
    </div>
    <div class="alert success" id="alertSuccess"></div>
    <div class="alert error" id="alertError"></div>
  </div>

  <!-- Tur Başına Dağıtılacak SOL -->
  <div class="card">
    <h2>💰 Tur Başına Dağıtılacak SOL Miktarı</h2>
    <div class="input-row">
      <div class="input-with-unit">
        <input type="number" id="rewardAmountInput" min="0.000001" step="0.01" placeholder="Örn: 0.5"/>
        <span class="unit">SOL</span>
      </div>
      <button id="saveRewardBtn" onclick="saveRewardAmount()">💾 Kaydet</button>
    </div>
    <p class="reward-hint">
      Her turda kasadan tam olarak bu miktar SOL alınıp qualified holder'lara <b>token bakiyeleri oranında</b> paylaştırılır.
      Miktar <b>0 veya girilmemişse</b> dağıtım o tur için pas geçilir.
      Kasa bakiyesi bu miktarın altına düşerse dağıtım <b>otomatik olarak durur</b> ve yukarıda uyarı gösterilir.
    </p>
    <div class="alert success" id="rewardAlertSuccess"></div>
    <div class="alert error" id="rewardAlertError"></div>
  </div>

  <!-- Durum -->
  <div class="card">
    <h2>📊 Anlık Durum <span style="font-size:11px;color:#4b5563;text-transform:none;font-weight:400">(10 sn'de bir güncellenir)</span></h2>
    <div class="status-grid">
      <div class="stat"><div class="label">Qualified Holders</div><div class="value green" id="sQualified">—</div><div class="sub">≥ 500,000 token</div></div>
      <div class="stat"><div class="label">Aktif Holders</div><div class="value blue" id="sActive">—</div><div class="sub">≥ 100 token</div></div>
      <div class="stat"><div class="label">Toplam Hesap</div><div class="value" id="sTotal">—</div><div class="sub">tüm token hesapları</div></div>
      <div class="stat"><div class="label">Son Tarama</div><div class="value" id="sLastScan">—</div><div class="sub" id="sScanDur">—</div></div>
      <div class="stat"><div class="label">Tur SOL Miktarı</div><div class="value orange" id="sRewardAmt">—</div><div class="sub">her turda dağıtılacak</div></div>
      <div class="stat"><div class="label">Ödül Zamanlayıcı</div><div class="value" id="sScheduler">—</div><div class="sub" id="sLastReward">—</div></div>
      <div class="stat"><div class="label">Toplam Dağıtılan</div><div class="value yellow" id="sTotalSOL">—</div><div class="sub" id="sDistCount">—</div></div>
    </div>
    <div class="refresh-bar"><div class="refresh-bar-fill" id="refreshFill" style="width:100%"></div></div>
  </div>

  <!-- Zamanlayıcı Kontrol -->
  <div class="card">
    <h2>⏱ Ödül Zamanlayıcısı Kontrolü</h2>
    <div class="input-row">
      <input type="text" id="cronInput" placeholder="Cron ifadesi (varsayılan: */3 * * * * → her 3 dakika)" style="font-family:monospace"/>
      <button onclick="controlScheduler('start')">▶ Başlat</button>
      <button onclick="controlScheduler('stop')" style="background:linear-gradient(135deg,#374151,#4b5563)">⏹ Durdur</button>
      <button onclick="controlScheduler('trigger')" style="background:linear-gradient(135deg,#065f46,#047857)">⚡ Şimdi Çalıştır</button>
    </div>
  </div>

  <!-- API Linkleri -->
  <div class="card">
    <h2>🔗 API Endpoint'leri</h2>
    <div class="links-grid">
      <a class="link-card" href="/api/qualified-count" target="_blank">
        <div class="lc-label">Qualified Count</div>
        <div class="lc-url">/api/qualified-count</div>
        <div class="lc-desc">≥500k token tutan cüzdan sayısı</div>
      </a>
      <a class="link-card" href="/api/total-rewards" target="_blank">
        <div class="lc-label">Total Rewards</div>
        <div class="lc-url">/api/total-rewards</div>
        <div class="lc-desc">Toplam dağıtılan SOL miktarı</div>
      </a>
      <a class="link-card" href="/api/snapshot" target="_blank">
        <div class="lc-label">Snapshot Listesi</div>
        <div class="lc-url">/api/snapshot</div>
        <div class="lc-desc">Geçmiş snapshot kayıtları</div>
      </a>
      <a class="link-card" href="/api/reward/distributions" target="_blank">
        <div class="lc-label">Dağıtım Geçmişi</div>
        <div class="lc-url">/api/reward/distributions</div>
        <div class="lc-desc">Tüm ödül dağıtımları</div>
      </a>
    </div>
  </div>

  <!-- Son Snapshot'lar -->
  <div class="card">
    <h2>📸 Son Snapshot'lar</h2>
    <table>
      <thead><tr><th>#</th><th>Tarih</th><th>Qualified</th><th>Aktif</th><th>Ham Hesap</th></tr></thead>
      <tbody id="snapTable"><tr><td colspan="5" style="color:#4b5563;text-align:center;padding:16px">Yükleniyor…</td></tr></tbody>
    </table>
  </div>

  <!-- Son Dağıtımlar -->
  <div class="card">
    <h2>💸 Son Ödül Dağıtımları</h2>
    <table>
      <thead><tr><th>#</th><th>Tarih</th><th>Dağıtılan SOL</th><th>Kasa</th><th>Durum</th></tr></thead>
      <tbody id="distTable"><tr><td colspan="5" style="color:#4b5563;text-align:center;padding:16px">Yükleniyor…</td></tr></tbody>
    </table>
  </div>

</div>

<script>
let currentMint = '';
let currentDistEnabled = true;
const REFRESH_MS = 10000;

function applyKillCardState(enabled) {
  currentDistEnabled = enabled;
  const card = document.getElementById('killCard');
  const title = document.getElementById('killTitle');
  const sub = document.getElementById('killSub');
  const btn = document.getElementById('killBtn');

  card.className = 'kill-card ' + (enabled ? 'enabled' : 'disabled');
  title.textContent = enabled ? 'Dağıtım Sistemi Aktif' : 'Dağıtım Sistemi KAPALI';
  sub.textContent = enabled
    ? 'Her 3 dakikada bir ödüller otomatik dağıtılıyor'
    : 'Tüm ödül dağıtımları durduruldu — zamanlayıcı çalışsa bile dağıtım yapılmaz';
  btn.textContent = enabled ? '⏹ Dağıtımı Kapat' : '▶ Dağıtımı Aç';
}

async function toggleDistribution() {
  const btn = document.getElementById('killBtn');
  btn.disabled = true;
  const newState = !currentDistEnabled;
  try {
    const res = await fetch('/api/config/distribution-enabled', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ enabled: newState })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Hata');
    applyKillCardState(data.distributionEnabled);
  } catch(e) {
    showAlert('error', '❌ ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

async function loadStats() {
  try {
    const d = await fetch('/api/stats').then(r => r.json());
    currentMint = d.activeMint || '';

    document.getElementById('activeMintBadge').textContent = currentMint
      ? currentMint.slice(0,8)+'…'+currentMint.slice(-6) : '—';
    document.getElementById('mintInput').placeholder = currentMint || 'Mint adresi yapıştırın…';

    // Kill switch state
    if (typeof d.distributionEnabled === 'boolean') {
      applyKillCardState(d.distributionEnabled);
    }

    // Reward amount — prefill only if user hasn't touched it
    const rewardInput = document.getElementById('rewardAmountInput');
    if (d.rewardAmountSol != null && !rewardInput.dataset.dirty) {
      rewardInput.value = d.rewardAmountSol > 0 ? d.rewardAmountSol : '';
    }
    document.getElementById('sRewardAmt').textContent = d.rewardAmountSol > 0
      ? d.rewardAmountSol + ' SOL' : '— (pas geç)';

    // Warning banners
    const sch = d.scheduler || {};

    const feeBanner = document.getElementById('feeBanner');
    if (sch.feeReserveWarning) {
      feeBanner.classList.add('show');
      if (sch.lastError) {
        document.getElementById('feeMsg').textContent =
          sch.lastError.replace('FEE_RESERVE_LOW: ', '').replace('FEE_RESERVE_LOW:', '');
      }
    } else {
      feeBanner.classList.remove('show');
    }

    const insufBanner = document.getElementById('insufBanner');
    if (sch.insufficientBalance && !sch.feeReserveWarning) {
      insufBanner.classList.add('show');
      if (sch.lastError) {
        document.getElementById('insufMsg').textContent =
          sch.lastError.replace('INSUFFICIENT_BALANCE: ', '').replace('INSUFFICIENT_BALANCE:', '');
      }
    } else {
      insufBanner.classList.remove('show');
    }

    const sc = d.scanner || {};
    const dot = document.getElementById('scanDot');
    const lbl = document.getElementById('scanLabel');
    if (sc.scanning) {
      dot.className = 'dot scanning';
      lbl.textContent = 'Taranıyor…';
    } else if (sc.lastError) {
      dot.className = 'dot error';
      lbl.textContent = 'Hata';
    } else if (sc.lastScanAt) {
      dot.className = 'dot ok';
      lbl.textContent = 'Güncel';
    } else {
      dot.className = 'dot';
      lbl.textContent = 'Bekleniyor';
    }

    document.getElementById('sQualified').textContent = sc.qualifiedCount != null ? sc.qualifiedCount.toLocaleString('tr-TR') : '—';
    document.getElementById('sActive').textContent = sc.activeHolders != null ? sc.activeHolders.toLocaleString('tr-TR') : '—';
    document.getElementById('sTotal').textContent = sc.totalRawAccounts != null ? sc.totalRawAccounts.toLocaleString('tr-TR') : '—';

    if (sc.lastScanAt) {
      document.getElementById('sLastScan').textContent = new Date(sc.lastScanAt).toLocaleTimeString('tr-TR');
      document.getElementById('sScanDur').textContent = sc.lastScanDurationMs
        ? (sc.lastScanDurationMs/1000).toFixed(1)+'sn sürdü' : '';
    }

    const schEl = document.getElementById('sScheduler');
    schEl.textContent = sch.running ? '● Aktif' : '○ Durduruldu';
    schEl.className = 'value ' + (sch.running ? 'green' : 'red');
    document.getElementById('sLastReward').textContent = sch.cronExpression || '';

    const rw = d.rewards || {};
    document.getElementById('sTotalSOL').textContent = rw.totalDistributedSOL ? rw.totalDistributedSOL+' SOL' : '0 SOL';
    document.getElementById('sDistCount').textContent = rw.distributionCount ? rw.distributionCount+' dağıtım' : '';

  } catch(e) { console.error('loadStats error', e); }
}

async function loadTables() {
  try {
    const [snaps, dists] = await Promise.all([
      fetch('/api/snapshot?mint=' + encodeURIComponent(currentMint) + '&limit=5').then(r => r.json()),
      fetch('/api/reward/distributions?limit=5').then(r => r.json()),
    ]);

    const snapBody = document.getElementById('snapTable');
    snapBody.innerHTML = snaps.snapshots && snaps.snapshots.length
      ? snaps.snapshots.map(s => \`<tr>
          <td>#\${s.id}</td>
          <td>\${new Date(s.createdAt).toLocaleString('tr-TR')}</td>
          <td><b style="color:#34d399">\${(s.qualifiedCount||0).toLocaleString()}</b></td>
          <td>\${(s.activeHolders||0).toLocaleString()}</td>
          <td>\${(s.totalRawAccounts||0).toLocaleString()}</td>
        </tr>\`).join('')
      : '<tr><td colspan="5" style="color:#4b5563;text-align:center;padding:14px">Henüz snapshot alınmadı</td></tr>';

    const distBody = document.getElementById('distTable');
    distBody.innerHTML = dists.distributions && dists.distributions.length
      ? dists.distributions.map(d => \`<tr>
          <td>#\${d.id}</td>
          <td>\${new Date(d.createdAt).toLocaleString('tr-TR')}</td>
          <td><b style="color:#fbbf24">\${(Number(d.distributedLamports)/1e9).toFixed(6)} SOL</b></td>
          <td style="font-size:11px">\${(d.vaultAddress||'').slice(0,10)}…</td>
          <td><span class="badge \${d.status}">\${d.status}</span></td>
        </tr>\`).join('')
      : '<tr><td colspan="5" style="color:#4b5563;text-align:center;padding:14px">Henüz dağıtım yapılmadı</td></tr>';
  } catch(e) { console.error('loadTables error', e); }
}

async function saveRewardAmount() {
  const input = document.getElementById('rewardAmountInput');
  const val = input.value.trim();
  const sol = val === '' ? 0 : parseFloat(val);
  if (isNaN(sol) || sol < 0) {
    showRewardAlert('error', 'Lütfen geçerli bir SOL miktarı girin (0 veya daha büyük).'); return;
  }
  const btn = document.getElementById('saveRewardBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Kaydediliyor…';
  try {
    const res = await fetch('/api/config/reward-amount', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sol})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Hata');
    input.dataset.dirty = '';
    showRewardAlert('success', sol > 0
      ? '✅ Tur başına dağıtılacak miktar: ' + sol + ' SOL'
      : '✅ Miktar sıfırlandı — dağıtım turları pas geçilecek');
    await loadStats();
  } catch(e) {
    showRewardAlert('error', '❌ ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '💾 Kaydet';
  }
}

async function applyMint() {
  const mint = document.getElementById('mintInput').value.trim();
  if (!mint) { showAlert('error', 'Lütfen bir mint adresi girin.'); return; }
  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Uygulanıyor…';
  try {
    const res = await fetch('/api/config/mint', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mint})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Hata');
    showAlert('success', '✅ Sistem güncellendi → '+mint.slice(0,8)+'…'+mint.slice(-6));
    currentMint = mint;
    await Promise.all([loadStats(), loadTables()]);
  } catch(e) {
    showAlert('error', '❌ ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚀 Sistemi Başlat';
  }
}

async function controlScheduler(action) {
  const cronVal = document.getElementById('cronInput').value.trim();
  try {
    const url = action==='start' ? '/api/scheduler/start'
              : action==='stop'  ? '/api/scheduler/stop'
              :                    '/api/scheduler/trigger';
    const body = (action==='start' && cronVal) ? {cron:cronVal} : {};
    const res = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Hata');
    showAlert('success', '✅ ' + (data.message || 'İşlem başarılı'));
    await loadStats();
  } catch(e) { showAlert('error', '❌ ' + e.message); }
}

function showAlert(type, msg) {
  ['alertSuccess','alertError'].forEach(id => document.getElementById(id).classList.remove('show'));
  const el = document.getElementById(type==='success' ? 'alertSuccess' : 'alertError');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 6000);
}

function showRewardAlert(type, msg) {
  ['rewardAlertSuccess','rewardAlertError'].forEach(id => document.getElementById(id).classList.remove('show'));
  const el = document.getElementById(type==='success' ? 'rewardAlertSuccess' : 'rewardAlertError');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 6000);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('rewardAmountInput').addEventListener('input', function() {
    this.dataset.dirty = '1';
  });
});

loadStats();
loadTables();

let elapsed = 0;
const fill = document.getElementById('refreshFill');
setInterval(() => {
  elapsed += 100;
  fill.style.width = (100 - Math.min((elapsed / REFRESH_MS) * 100, 100)) + '%';
  if (elapsed >= REFRESH_MS) {
    elapsed = 0;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    setTimeout(() => { fill.style.transition = 'width .9s linear'; }, 50);
    loadStats();
  }
}, 100);

setInterval(() => { loadTables(); }, REFRESH_MS * 3);
</script>
</body>
</html>`;

router.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(HTML);
});

export default router;
