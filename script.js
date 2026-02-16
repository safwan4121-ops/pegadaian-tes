/* Kasir Gadai Pro
   File: script.js
   Implementasi core: level, target, transaksi, event acak, leaderboard.
   Author: generated for user tugas sekolah (cek & modifikasi sesuai kebutuhan)
*/

/* ---------- UTIL / FORMAT ---------- */
const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function el(id){ return document.getElementById(id); }
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function todayPlus(days){
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
function formatDate(d){
  const dd = new Date(d);
  return dd.toLocaleDateString('id-ID');
}

/* ---------- GAME DEFAULTS ---------- */
const DEFAULTS = {
  level: 1,
  cash: 10000000, // modal awal
  profit: 0,
  reputation: 80, // 0-100
  weeklyRatePercent: 1.0, // 1% per minggu
  transactionsBeforeEvent: 5,
  levelTargets: {
    1: 1000000,
    2: 2500000,
    3: 6000000,
    4: 15000000
  }
};

let state = {
  level: DEFAULTS.level,
  cash: DEFAULTS.cash,
  profit: DEFAULTS.profit,
  reputation: DEFAULTS.reputation,
  txCounter: 0,
  transactions: []
};

/* ---------- STORAGE KEYS ---------- */
const STORAGE_KEY = 'kasir_gadai_state_v1';
const LB_KEY = 'kasir_gadai_leaderboard_v1';

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  hookUI();
  loadState();
  renderAll();
});

/* ---------- UI HOOKS ---------- */
function hookUI(){
  el('taksirBtn').addEventListener('click', onTaksir);
  el('pawnForm').addEventListener('submit', onProcessPawn);
  el('resetBtn').addEventListener('click', resetGame);
  el('viewLeaderboardBtn').addEventListener('click', showLeaderboard);
  el('saveScoreBtn').addEventListener('click', openSaveModal);
  el('closeLeaderboard').addEventListener('click', () => toggleModal('leaderboardModal', false));
  el('closeSaveModal').addEventListener('click', () => toggleModal('saveModal', false));
  el('cancelSave').addEventListener('click', () => toggleModal('saveModal', false));
  el('confirmSave').addEventListener('click', saveScore);
}

/* ---------- STATE PERSISTENCE ---------- */
function saveState(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch(e){
    console.warn('Gagal menyimpan state:', e);
  }
}
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      // merge with defaults to be safe
      state = Object.assign({}, state, parsed);
    } else {
      state = Object.assign({}, state, { level:DEFAULTS.level, cash:DEFAULTS.cash, profit:DEFAULTS.profit, reputation:DEFAULTS.reputation, txCounter:0, transactions:[]});
      saveState();
    }
  } catch(e){
    console.warn('Gagal load state:', e);
  }
}

/* ---------- RENDER ---------- */
function renderAll(){
  renderDashboard();
  renderTxTable();
  renderEventBox('');
  saveState();
}

function renderDashboard(){
  el('levelDisplay').textContent = state.level;
  el('cashDisplay').textContent = fmt.format(state.cash);
  el('profitDisplay').textContent = fmt.format(state.profit);
  const rep = Math.max(0, Math.min(100, Math.round(state.reputation)));
  el('repText').textContent = rep;
  el('repFill').style.width = rep + '%';
  const target = DEFAULTS.levelTargets[state.level] ?? (state.level * 5000000);
  el('targetDisplay').textContent = fmt.format(target);
  el('rateDisplay').textContent = `${DEFAULTS.weeklyRatePercent}% per minggu`;
}

/* ---------- TAKSIR (rule-based) ---------- */
function onTaksir(){
  const cond = el('condition').value;
  const est = Number(el('estPrice').value) || 0;
  if(!est || est <= 0){
    showTaksir('Masukkan estimasi harga pemilik yang valid (lebih dari 0).', true);
    return;
  }
  const factor = (cond === 'new') ? 1.0 : (cond === 'used' ? 0.7 : 0.4);
  const low = Math.round(est * factor * 0.8);
  const mid = Math.round(est * factor);
  const high = Math.round(est * factor * 1.15);
  const text = `<strong>Rentang nilai wajar:</strong> ${fmt.format(low)} — ${fmt.format(high)} (nilai tengah ${fmt.format(mid)})`;
  showTaksir(text, false);
}
function showTaksir(text, isError){
  const box = el('taksirResult');
  box.style.display = 'block';
  box.style.background = isError ? '#fff1f2' : '#f0fdf4';
  box.innerHTML = text;
  setTimeout(()=>{ box.style.opacity = '1' }, 20);
}

/* ---------- PROSES GADAI ---------- */
function onProcessPawn(e){
  e.preventDefault();
  const name = el('custName').value.trim();
  const item = el('itemName').value.trim();
  const cond = el('condition').value;
  const est = Number(el('estPrice').value) || 0;
  const loan = Number(el('loanAmount').value) || 0;
  const tenorDays = Number(el('tenor').value);

  // VALIDASI
  if(!name || !item || est <= 0 || loan <= 0){
    showTaksir('Harap isi semua field dengan benar sebelum memproses.', true);
    return;
  }
  // simple sanity: loan should not exceed ~85% dari nilai tengah taksir
  const factor = cond === 'new' ? 1.0 : cond === 'used' ? 0.7 : 0.4;
  const mid = Math.round(est * factor);
  if(loan > Math.round(mid * 0.9)){
    showTaksir(`Pinjaman terlalu tinggi dibanding estimasi wajar (${fmt.format(mid)}). Kurangi jumlah pinjaman.`, true);
    return;
  }

  // Hitung bunga (sederhana) : weekly percent prorated by days
  const weeks = tenorDays / 7;
  const interest = (DEFAULTS.weeklyRatePercent / 100) * weeks * loan;
  const totalPay = Math.round(loan + interest);

  const tx = {
    id: 'TX' + Date.now(),
    customer: name,
    item,
    condition: cond,
    estPrice: est,
    loanAmount: loan,
    interest: Math.round(interest),
    totalPay,
    startDate: (new Date()).toISOString(),
    dueDate: todayPlus(tenorDays).toISOString(),
    status: 'Aktif' // Aktif | Lunas | Lelang
  };

  // update cash & store tx
  state.cash += loan;
  state.transactions.unshift(tx);
  state.txCounter++;
  saveState();

  renderAll();
  showTaksir(`Transaksi berhasil dibuat. Total bayar: <strong>${fmt.format(totalPay)}</strong>. Jatuh tempo: ${formatDate(tx.dueDate)}`, false);

  // setelah setiap transaksi, cek event
  if(state.txCounter % DEFAULTS.transactionsBeforeEvent === 0) {
    triggerRandomEvent();
  }
  checkLevelUp();
}

/* ---------- TRANSAKSI TABLE ---------- */
function renderTxTable(){
  const tbody = el('txTable').querySelector('tbody');
  tbody.innerHTML = '';
  state.transactions.forEach(tx => {
    const tr = document.createElement('tr');

    const dueSoon = new Date(tx.dueDate) < new Date() && tx.status === 'Aktif';

    tr.innerHTML = `
      <td>${tx.id}</td>
      <td>${escapeHtml(tx.customer)}</td>
      <td>${escapeHtml(tx.item)} <small class="muted">(${tx.condition})</small></td>
      <td>${fmt.format(tx.loanAmount)}</td>
      <td>${fmt.format(tx.totalPay)}</td>
      <td>${formatDate(tx.dueDate)}</td>
      <td>${renderStatus(tx.status, dueSoon)}</td>
      <td>${renderActions(tx, dueSoon)}</td>
    `;
    tbody.appendChild(tr);

    // attach event listeners for buttons inside row
    const btnTebus = tr.querySelector('.btn-tebus');
    if(btnTebus) btnTebus.addEventListener('click', ()=> tebusTx(tx.id));
    const btnLelang = tr.querySelector('.btn-lelang');
    if(btnLelang) btnLelang.addEventListener('click', ()=> lelangTx(tx.id));
  });
}

function renderStatus(status, dueSoon){
  if(status === 'Aktif') return `<span class="status-pill status-active">${dueSoon ? 'Lewat Tempo' : 'Aktif'}</span>`;
  if(status === 'Lunas') return `<span class="status-pill status-lunas">Lunas</span>`;
  return `<span class="status-pill status-lelang">Lelang</span>`;
}

function renderActions(tx, dueSoon){
  if(tx.status === 'Aktif'){
    const tebusBtn = `<button class="btn small btn-tebus">Tebus</button>`;
    const lelangBtn = dueSoon ? `<button class="btn small btn-lelang danger">Lelang</button>` : '';
    return tebusBtn + ' ' + lelangBtn;
  } else {
    return `<span style="color:var(--muted)">-</span>`;
  }
}

/* ---------- Aksi: Tebus & Lelang ---------- */
function tebusTx(id){
  const idx = state.transactions.findIndex(t => t.id === id);
  if(idx === -1) return;
  const tx = state.transactions[idx];
  if(tx.status !== 'Aktif') return;

  // pelanggan bayar totalPay -> kas bertambah, profit = totalPay - loanAmount (bunga masuk sebagai profit)
  state.cash += tx.totalPay;
  const earned = tx.totalPay - tx.loanAmount;
  state.profit += earned;
  tx.status = 'Lunas';
  state.reputation = Math.min(100, state.reputation + 2); // penebusan menaikkan reputasi
  saveState();
  renderAll();
  showTaksir(`Transaksi ${tx.id} berhasil ditebus. Keuntungan diperoleh ${fmt.format(earned)}.`, false);
  checkLevelUp();
}

function lelangTx(id){
  const idx = state.transactions.findIndex(t => t.id === id);
  if(idx === -1) return;
  const tx = state.transactions[idx];
  if(tx.status !== 'Aktif') return;

  // Hasil lelang = random antara 60% - 120% dari estimasi nilai taksir
  const condFactor = tx.condition === 'new' ? 1 : tx.condition === 'used' ? 0.7 : 0.4;
  const estMid = Math.round(tx.estPrice * condFactor);
  const multiplier = (Math.random() * 0.6) + 0.6; // 0.6..1.2
  const sale = Math.round(estMid * multiplier);

  // update
  tx.status = 'Lelang';
  state.cash += sale;
  const earned = sale - tx.loanAmount;
  state.profit += Math.max(0, earned);
  // reputasi turun sedikit karena nasabah kehilangan barang
  state.reputation = Math.max(0, state.reputation - 6);

  saveState();
  renderAll();
  showTaksir(`Barang ${tx.item} telah dilelang. Hasil: ${fmt.format(sale)}. Pengaruh ke reputasi: -6.`, false);
  checkLevelUp();
}

/* ---------- RANDOM EVENT ---------- */
const EVENTS = [
  { text: 'Harga emas naik 10% bulan ini — transaksi emas untung lebih besar.', fn(state){
      // kecilkan reputasi hazard, tambahkan profit peluang: apply when lelang occurs later
      renderEventBox('Event: Harga emas naik. Barang bertipe "emas" (jika ada) cenderung lebih menguntungkan.');
    }},
  { text: 'Bulan menunggak: 20% nasabah menunggak, lebih banyak lelang.', fn(state){
      // menurunkan reputasi sedikit, set flag that increases chance nasabah tidak menebus
      state.reputation = Math.max(0, state.reputation - 3);
      renderEventBox('Event: Banyak nasabah menunggak. Reputasi sedikit turun.');
    }},
  { text: 'Promo bunga: diskon 0.5% minggu ini — menarik lebih banyak pelanggan.', fn(state){
      DEFAULTS.weeklyRatePercent = Math.max(0.2, DEFAULTS.weeklyRatePercent - 0.5);
      renderEventBox('Event: Promo bunga aktif. Bunga mingguan dikurangi 0.5%.');
    }},
  { text: 'Insiden cabang: satu barang rusak saat disimpan.', fn(state){
      state.reputation = Math.max(0, state.reputation - 8);
      renderEventBox('Event: Insiden cabang. Reputasi turun drastis.');
    }}
];

function triggerRandomEvent(){
  const idx = Math.floor(Math.random() * EVENTS.length);
  const ev = EVENTS[idx];
  try {
    ev.fn(state);
    saveState();
  } catch(e){
    console.warn('Error saat menjalankan event:', e);
  }
}

/* ---------- LEVEL UP ---------- */
function checkLevelUp(){
  const target = DEFAULTS.levelTargets[state.level] ?? (state.level * 5000000);
  if(state.profit >= target){
    state.level++;
    // naik level: beri modal tambahan, reset/reward
    const bonus = Math.round(target * 0.2);
    state.cash += bonus;
    state.reputation = Math.min(100, state.reputation + 10);
    renderEventBox(`Selamat! Level naik ke ${state.level}. Modal bonus ${fmt.format(bonus)} diberikan.`);
    saveState();
    renderAll();
  }
  // gameover condition
  if(state.reputation <= 10){
    renderEventBox('Reputasi terlalu rendah — GAME OVER. Silakan reset dan coba strategi baru.');
  }
}

/* ---------- EVENTS & UI ---------- */
function renderEventBox(msg){
  const box = el('eventBox');
  box.innerHTML = msg || '';
}

/* ---------- ESCAPE HTML helper ---------- */
function escapeHtml(str){
  return (''+str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
}

/* ---------- SAVE / LEADERBOARD ---------- */
function openSaveModal(){
  el('playerName').value = '';
  toggleModal('saveModal', true);
}
function saveScore(){
  const name = el('playerName').value.trim();
  if(!name){ alert('Isi nama terlebih dahulu'); return; }
  const board = JSON.parse(localStorage.getItem(LB_KEY) || '[]');
  board.push({ name, profit: state.profit, level: state.level, date: (new Date()).toISOString() });
  // sort descending profit and keep top 20
  board.sort((a,b)=> b.profit - a.profit);
  localStorage.setItem(LB_KEY, JSON.stringify(board.slice(0,20)));
  toggleModal('saveModal', false);
  showLeaderboard();
}
function showLeaderboard(){
  const board = JSON.parse(localStorage.getItem(LB_KEY) || '[]');
  const ol = el('leaderboardList');
  ol.innerHTML = '';
  if(board.length === 0){
    ol.innerHTML = '<li>Belum ada skor tersimpan.</li>';
  } else {
    board.forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `${escapeHtml(entry.name)} — ${fmt.format(entry.profit)} (Level ${entry.level}) — ${formatDate(entry.date)}`;
      ol.appendChild(li);
    });
  }
  toggleModal('leaderboardModal', true);
}
function toggleModal(id, show){
  const m = el(id);
  if(!m) return;
  m.setAttribute('aria-hidden', show ? 'false' : 'true');
}

/* ---------- RESET GAME ---------- */
function resetGame(){
  if(!confirm('Reset game akan menghapus progress saat ini. Lanjutkan?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = { level: DEFAULTS.level, cash: DEFAULTS.cash, profit: DEFAULTS.profit, reputation: DEFAULTS.reputation, txCounter:0, transactions:[] };
  saveState();
  renderAll();
}

/* ---------- UTIL: POLLING for DUE DATES ---------- */
setInterval(()=> {
  // cek transaksi lewat tempo terus-menerus (setiap 10s)
  let changed = false;
  const now = new Date();
  state.transactions.forEach(tx => {
    if(tx.status === 'Aktif'){
      if(new Date(tx.dueDate) < now){
        // flag: nothing auto-happens until manager pilih lelang; we display "Lewat Tempo" in UI
        changed = true;
      }
    }
  });
  if(changed) renderTxTable();
}, 10000);

/* ---------- HELPER: Escape confirm ---------- */
window.addEventListener('beforeunload', () => { saveState(); });

/* initial render after load */
renderAll();      });
        showNotification('⚠️ Gagal Bayar', `${loan.nama} gagal bayar. Barang masuk lelang.`, 'warning');
    });
    // hapus dari active loans yang sudah default
    gameState.activeLoans = gameState.activeLoans.filter(l => l.status === 'active');
    renderCurrentView();
}
setInterval(checkDefaultRisk, 15000);

// ==================== LELANG ====================
function prosesLelang(item) {
    loadingOverlay.classList.add('show');
    setTimeout(() => {
        // harga jual = harga pasar saat ini * jumlah * faktor lelang (90%)
        let hargaJual = gameState.marketPrices[item.jenis] * item.jumlahUnit * 0.9;
        let keuntungan = hargaJual - item.sisaPinjaman;
        gameState.cash += hargaJual;
        if (keuntungan >= 0) {
            gameState.reputasi = Math.min(100, gameState.reputasi + 2);
            showNotification('💰 Lelang Sukses', `Terjual Rp ${hargaJual.toLocaleString()}. Untung Rp ${keuntungan.toLocaleString()}`, 'success');
        } else {
            gameState.reputasi = Math.max(0, gameState.reputasi - 3);
            showNotification('😓 Lelang Rugi', `Hasil lelang tidak menutupi pinjaman. Rugi Rp ${(-keuntungan).toLocaleString()}`, 'error');
        }
        gameState.transactions.push({ type: 'lelang', nama: item.nama, jumlah: hargaJual, waktu: new Date() });
        gameState.cashFlowHistory.push(-item.sisaPinjaman);
        if (gameState.cashFlowHistory.length > 5) gameState.cashFlowHistory.shift();
        // hapus item dari auction
        gameState.auctionItems = gameState.auctionItems.filter(i => i.loanId !== item.loanId);
        updateHeaderUI();
        renderCurrentView();
        loadingOverlay.classList.remove('show');
        auctionModal.classList.remove('show');
    }, 1500);
}

// ==================== RENDER VIEW (DOM MANIPULATION) ====================
function renderDashboard() {
    let html = `
        <div class="dashboard-grid">
            <div class="card">
                <div class="card-title">Total Aset</div>
                <div class="card-value">${formatRupiah(gameState.cash + gameState.activeLoans.reduce((a,l)=>a+l.sisa,0))}</div>
                <div class="card-footer">+12% dari bulan lalu</div>
            </div>
            <div class="card">
                <div class="card-title">Pinjaman Aktif</div>
                <div class="card-value">${gameState.activeLoans.length}</div>
                <div class="card-footer">Nilai: ${formatRupiah(gameState.activeLoans.reduce((a,l)=>a+l.sisa,0))}</div>
            </div>
            <div class="card">
                <div class="card-title">Barang Lelang</div>
                <div class="card-value">${gameState.auctionItems.length}</div>
                <div class="card-footer">Estimasi nilai: ${formatRupiah(gameState.auctionItems.reduce((a,i)=>a+gameState.marketPrices[i.jenis]*i.jumlahUnit*0.9,0))}</div>
            </div>
            <div class="card">
                <div class="card-title">Reputasi</div>
                <div class="card-value">${gameState.reputasi}%</div>
                <div class="progress-bar" style="width:100%"><div class="progress-fill" style="width:${gameState.reputasi}%"></div></div>
            </div>
        </div>
        <div class="card">
            <div class="card-title">Grafik Cash Flow (5 periode terakhir)</div>
            <div class="chart-container" id="cashFlowChart"></div>
        </div>
        <div class="card">
            <div class="card-title">Harga Pasar Terkini</div>
            <div class="market-grid">
                <div class="market-item">
                    <div class="market-name">Emas (per gram)</div>
                    <div class="market-price">${formatRupiah(gameState.marketPrices.emas)}</div>
                    <div class="market-change positive">▲ 1.2%</div>
                </div>
                <div class="market-item">
                    <div class="market-name">Elektronik (unit)</div>
                    <div class="market-price">${formatRupiah(gameState.marketPrices.elektronik)}</div>
                    <div class="market-change negative">▼ 0.8%</div>
                </div>
                <div class="market-item">
                    <div class="market-name">Kendaraan (unit)</div>
                    <div class="market-price">${formatRupiah(gameState.marketPrices.kendaraan)}</div>
                    <div class="market-change positive">▲ 0.5%</div>
                </div>
            </div>
        </div>
    `;
    contentArea.innerHTML = html;

    // render chart
    const chartContainer = document.getElementById('cashFlowChart');
    if (chartContainer) {
        let max = Math.max(...gameState.cashFlowHistory, 1);
        gameState.cashFlowHistory.forEach(val => {
            let height = (val / max) * 100;
            if (height < 0) height = 5; // minimal
            chartContainer.innerHTML += `<div class="chart-bar" style="height:${Math.abs(height)}px; background:${val>=0?'#4caf50':'#f44336'};" title="${formatRupiah(val)}"></div>`;
        });
    }
}

function renderActiveLoans() {
    if (gameState.activeLoans.length === 0) {
        contentArea.innerHTML = '<div class="card"><p>Tidak ada pinjaman aktif.</p></div>';
        return;
    }
    let html = `<div class="card"><table><tr><th>ID</th><th>Nasabah</th><th>Jenis</th><th>Pokok</th><th>Sisa + Bunga</th><th>Bulan</th><th>Status</th></tr>`;
    gameState.activeLoans.forEach(l => {
        html += `<tr><td>${l.id}</td><td>${l.nama}</td><td>${l.jenis}</td><td>${formatRupiah(l.pokok)}</td><td>${formatRupiah(l.sisa)}</td><td>${l.bulanTersisa}</td><td><span class="status-badge status-active">Aktif</span></td></tr>`;
    });
    html += '</table></div>';
    contentArea.innerHTML = html;
}

function renderAuction() {
    if (gameState.auctionItems.length === 0) {
        contentArea.innerHTML = '<div class="card"><p>Tidak ada barang lelang.</p></div>';
        return;
    }
    let html = `<div class="card"><table><tr><th>Nasabah</th><th>Jenis</th><th>Jumlah</th><th>Sisa Pinjaman</th><th>Harga Pasar</th><th>Aksi</th></tr>`;
    gameState.auctionItems.forEach(item => {
        let hargaPasar = gameState.marketPrices[item.jenis] * item.jumlahUnit;
        html += `<tr><td>${item.nama}</td><td>${item.jenis}</td><td>${item.jumlahUnit}</td><td>${formatRupiah(item.sisaPinjaman)}</td><td>${formatRupiah(hargaPasar)}</td><td><button class="btn btn-primary auction-btn" data-id="${item.loanId}">Lelang</button></td></tr>`;
    });
    html += '</table></div>';
    contentArea.innerHTML = html;

    document.querySelectorAll('.auction-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let id = e.target.dataset.id;
            let item = gameState.auctionItems.find(i => i.loanId == id);
            if (item) {
                auctionModalBody.innerHTML = `
                    <p>Nasabah: ${item.nama}</p>
                    <p>Jenis: ${item.jenis}, Jumlah: ${item.jumlahUnit}</p>
                    <p>Sisa pinjaman: ${formatRupiah(item.sisaPinjaman)}</p>
                    <p>Harga pasar saat ini: ${formatRupiah(gameState.marketPrices[item.jenis] * item.jumlahUnit)}</p>
                    <p>Estimasi hasil lelang (90%): ${formatRupiah(gameState.marketPrices[item.jenis] * item.jumlahUnit * 0.9)}</p>
                    <button class="btn btn-primary" id="confirmAuction" data-id="${item.loanId}">Lelang Sekarang</button>
                `;
                auctionModal.classList.add('show');
                document.getElementById('confirmAuction').addEventListener('click', () => {
                    prosesLelang(item);
                });
            }
        });
    });
}

function renderReports() {
    let totalProfit = gameState.transactions.filter(t => t.type === 'lelang' && t.jumlah > 0).reduce((a,b)=>a+b.jumlah,0);
    let totalLoss = gameState.transactions.filter(t => t.type === 'pinjaman').reduce((a,b)=>a+b.jumlah,0) - totalProfit;
    if (totalLoss < 0) totalLoss = 0;
    let totalTrans = gameState.transactions.length;

    html = `
        <div class="dashboard-grid">
            <div class="card"><div class="card-title">Total Profit</div><div class="card-value">${formatRupiah(totalProfit)}</div></div>
            <div class="card"><div class="card-title">Total Loss</div><div class="card-value">${formatRupiah(totalLoss)}</div></div>
            <div class="card"><div class="card-title">Total Transaksi</div><div class="card-value">${totalTrans}</div></div>
        </div>
        <div class="card">
            <div class="card-title">Riwayat Transaksi</div>
            <table><tr><th>Jenis</th><th>Nama</th><th>Jumlah</th><th>Waktu</th></tr>
            ${gameState.transactions.slice(-5).reverse().map(t => `<tr><td>${t.type}</td><td>${t.nama || ''}</td><td>${formatRupiah(t.jumlah)}</td><td>${new Date(t.waktu).toLocaleTimeString()}</td></tr>`).join('')}
            </table>
        </div>
    `;
    contentArea.innerHTML = html;
}

function renderMarketStats() {
    let html = `<div class="card"><h3>Grafik Pergerakan Harga (10 periode terakhir)</h3>`;
    for (let key in gameState.priceHistory) {
        html += `<h4>${key}</h4><div class="mini-chart">`;
        gameState.priceHistory[key].forEach(p => {
            let max = Math.max(...gameState.priceHistory[key]);
            let height = (p / max) * 40;
            html += `<div class="mini-bar" style="height:${height}px;" title="${formatRupiah(p)}"></div>`;
        });
        html += '</div>';
    }
    html += '</div>';
    contentArea.innerHTML = html;
}

function renderCurrentView() {
    const activeView = document.querySelector('.sidebar-nav li.active')?.dataset.view || 'dashboard';
    switch(activeView) {
        case 'dashboard': renderDashboard(); break;
        case 'activeLoans': renderActiveLoans(); break;
        case 'auction': renderAuction(); break;
        case 'reports': renderReports(); break;
        case 'marketStats': renderMarketStats(); break;
        case 'newTransaction': showTransactionModal(); break;
        default: renderDashboard();
    }
}

// ==================== MODAL TRANSAKSI ====================
function showTransactionModal() {
    updateTaksiran();
    transactionModal.classList.add('show');
}

function hideTransactionModal() {
    transactionModal.classList.remove('show');
    transactionForm.reset();
}

modalClose.addEventListener('click', hideTransactionModal);
tolakPinjaman.addEventListener('click', hideTransactionModal);

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = namaNasabah.value;
    const jenis = jenisBarang.value;
    const jumlah = parseInt(jumlahBarang.value);
    const pinjaman = parseInt(jumlahPinjaman.value);
    const bunga = parseFloat(bungaPinjaman.value);
    const taksiran = hitungTaksiran(jenis, jumlah);

    if (pinjaman > taksiran) {
        alert('Jumlah pinjaman melebihi taksiran!');
        return;
    }
    if (pinjaman > gameState.cash) {
        alert('Kas tidak mencukupi!');
        return;
    }

    addNewLoan(nama, jenis, jumlah, pinjaman, bunga);
    hideTransactionModal();
    // pindah ke dashboard
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    document.querySelector('[data-view="dashboard"]').classList.add('active');
    renderDashboard();
});

window.addEventListener('click', (e) => {
    if (e.target === transactionModal) hideTransactionModal();
    if (e.target === auctionModal) auctionModal.classList.remove('show');
});
auctionModalClose.addEventListener('click', () => auctionModal.classList.remove('show'));

// ==================== SIDEBAR NAVIGASI ====================
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const view = item.dataset.view;
        if (view === 'newTransaction') {
            showTransactionModal();
            // tetap di view sebelumnya (dashboard)
            document.querySelector('[data-view="dashboard"]').classList.add('active');
            item.classList.remove('active');
        } else {
            renderCurrentView();
        }
    });
});

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// ==================== INITIAL RENDER ====================
updateHeaderUI();
renderDashboard();

// Panggil update harga pertama kali
updateMarketPrices();
```
