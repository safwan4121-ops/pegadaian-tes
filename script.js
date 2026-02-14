========== script.js ==========
// ==================== STATE GLOBAL ====================
let gameState = {
    cash: 100000000,               // saldo kas
    reputasi: 50,                   // 0-100
    level: 1,
    ekonomiIndeks: 100.0,
    ekonomiTrend: 'up',              // 'up' atau 'down'
    activeLoans: [],                 // pinjaman aktif
    auctionItems: [],                // barang siap lelang
    transactions: [],                // history transaksi
    cashFlowHistory: [0,0,0,0,0],    // 5 periode terakhir
    marketPrices: {
        emas: 1000000,               // per gram
        elektronik: 5000000,          // per unit
        kendaraan: 150000000          // per unit
    },
    priceHistory: {
        emas: [1000000],
        elektronik: [5000000],
        kendaraan: [150000000]
    },
    interestRateDefault: 2.5,        // % per bulan
    loanCounter: 100
};

// ==================== ELEMEN DOM ====================
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const navItems = document.querySelectorAll('.sidebar-nav li');
const contentArea = document.getElementById('contentArea');
const cashSpan = document.getElementById('cashValue');
const reputasiProgress = document.getElementById('reputasiProgress');
const reputasiSidebar = document.getElementById('reputasiProgressSidebar');
const levelSpan = document.getElementById('levelValue');
const ekonomiIndeksSpan = document.getElementById('ekonomiIndeks');
const ekonomiTrendSpan = document.getElementById('ekonomiTrend');
const notificationContainer = document.getElementById('notificationContainer');
const loadingOverlay = document.getElementById('loadingOverlay');

// Modal transaksi
const transactionModal = document.getElementById('transactionModal');
const modalClose = document.getElementById('modalClose');
const tolakPinjaman = document.getElementById('tolakPinjaman');
const transactionForm = document.getElementById('transactionForm');
const jenisBarang = document.getElementById('jenisBarang');
const jumlahBarang = document.getElementById('jumlahBarang');
const nilaiTaksiran = document.getElementById('nilaiTaksiran');
const jumlahPinjaman = document.getElementById('jumlahPinjaman');
const namaNasabah = document.getElementById('namaNasabah');
const bungaPinjaman = document.getElementById('bungaPinjaman');

// Modal lelang
const auctionModal = document.getElementById('auctionModal');
const auctionModalClose = document.getElementById('auctionModalClose');
const auctionModalBody = document.getElementById('auctionModalBody');

// ==================== FUNGSI UTILITAS ====================
function formatRupiah(angka) {
    return 'Rp ' + angka.toLocaleString('id-ID');
}

function updateHeaderUI() {
    // animasi saldo
    cashSpan.textContent = formatRupiah(gameState.cash);
    cashSpan.classList.add('up');
    setTimeout(() => cashSpan.classList.remove('up'), 300);

    reputasiProgress.style.width = gameState.reputasi + '%';
    reputasiSidebar.style.width = gameState.reputasi + '%';
    levelSpan.textContent = gameState.level;

    ekonomiIndeksSpan.textContent = gameState.ekonomiIndeks.toFixed(1);
    ekonomiTrendSpan.textContent = gameState.ekonomiTrend === 'up' ? '▲' : '▼';
    ekonomiTrendSpan.className = 'trend ' + (gameState.ekonomiTrend === 'up' ? 'up' : 'down');
}

// Notifikasi
function showNotification(judul, pesan, tipe = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${tipe}`;
    notif.innerHTML = `<strong>${judul}</strong><br>${pesan}`;
    notificationContainer.appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
}

// Hitung nilai taksiran berdasarkan harga pasar
function hitungTaksiran(jenis, jumlah) {
    let harga = gameState.marketPrices[jenis];
    // faktor taksiran: 80% dari harga pasar (standar pegadaian)
    return Math.round(harga * jumlah * 0.8);
}

// Event: update taksiran otomatis di modal
jenisBarang.addEventListener('change', updateTaksiran);
jumlahBarang.addEventListener('input', updateTaksiran);
function updateTaksiran() {
    const jenis = jenisBarang.value;
    const jumlah = parseInt(jumlahBarang.value) || 1;
    const taksiran = hitungTaksiran(jenis, jumlah);
    nilaiTaksiran.value = taksiran;
    jumlahPinjaman.max = taksiran;
    if (parseInt(jumlahPinjaman.value) > taksiran) {
        jumlahPinjaman.value = taksiran;
    }
}

// ==================== SISTEM FLUKTUASI HARGA ====================
function updateMarketPrices() {
    // Emas: fluktuasi ±1-5%
    let emasChange = 1 + Math.random() * 4; // 1-5%
    if (Math.random() > 0.5) emasChange = -emasChange;
    gameState.marketPrices.emas = Math.round(gameState.marketPrices.emas * (1 + emasChange/100));
    if (gameState.marketPrices.emas < 500000) gameState.marketPrices.emas = 500000; // batas bawah

    // Elektronik: depresiasi 0-3% per periode (kecuali event)
    let elektronikChange = - (Math.random() * 3); // -0% s/d -3%
    gameState.marketPrices.elektronik = Math.round(gameState.marketPrices.elektronik * (1 + elektronikChange/100));
    if (gameState.marketPrices.elektronik < 500000) gameState.marketPrices.elektronik = 500000;

    // Kendaraan: bisa naik/turun tergantung usia (kita simulasikan acak)
    let kendaraanChange = (Math.random() * 6) - 3; // -3% s/d +3%
    gameState.marketPrices.kendaraan = Math.round(gameState.marketPrices.kendaraan * (1 + kendaraanChange/100));
    if (gameState.marketPrices.kendaraan < 30000000) gameState.marketPrices.kendaraan = 30000000;

    // Simpan history (batasi 10 data)
    for (let key in gameState.priceHistory) {
        gameState.priceHistory[key].push(gameState.marketPrices[key]);
        if (gameState.priceHistory[key].length > 10) gameState.priceHistory[key].shift();
    }

    // Pengaruh ke indeks ekonomi (sederhana)
    gameState.ekonomiIndeks = 100 + (gameState.marketPrices.emas - 1000000)/20000 + (gameState.marketPrices.kendaraan - 150000000)/500000;
    gameState.ekonomiIndeks = Math.min(150, Math.max(50, gameState.ekonomiIndeks));
    gameState.ekonomiTrend = gameState.ekonomiIndeks > 100 ? 'up' : 'down';

    updateHeaderUI();
    renderCurrentView(); // refresh tampilan jika diperlukan
}

// Jalankan fluktuasi tiap 25 detik
setInterval(updateMarketPrices, 25000);

// ==================== EVENT EKONOMI ACAK ====================
function triggerRandomEvent() {
    const events = [
        { name: 'Lonjakan Harga Emas', effect: () => { gameState.marketPrices.emas *= 1.12; showNotification('⚠️ EVENT', 'Harga emas melonjak 12%!', 'warning'); }},
        { name: 'Resesi Ekonomi', effect: () => { gameState.ekonomiIndeks *= 0.85; showNotification('📉 Resesi', 'Daya beli turun, banyak nasabah berisiko gagal bayar.', 'error'); }},
        { name: 'Regulasi Baru', effect: () => { gameState.interestRateDefault = Math.min(3.5, gameState.interestRateDefault*1.1); showNotification('🏛️ Regulator', 'Bunga maksimum dibatasi 3.5% per bulan', 'info'); }},
        { name: 'Kelangkaan Kendaraan', effect: () => { gameState.marketPrices.kendaraan *= 1.2; showNotification('🚗 Kelangkaan', 'Harga kendaraan bekas naik 20%!', 'success'); }},
        { name: 'Krisis Kepercayaan', effect: () => { gameState.reputasi = Math.max(0, gameState.reputasi-8); showNotification('💔 Krisis', 'Reputasi menurun karena berita negatif.', 'error'); }},
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    updateHeaderUI();
    renderCurrentView();
}
setInterval(triggerRandomEvent, 30000);

// ==================== MANAJEMEN PINJAMAN & RISIKO ====================
// Fungsi menambah pinjaman baru
function addNewLoan(nama, jenis, jumlahUnit, pinjaman, bunga) {
    const taksiran = hitungTaksiran(jenis, jumlahUnit);
    const loan = {
        id: gameState.loanCounter++,
        nama: nama,
        jenis: jenis,
        jumlahUnit: jumlahUnit,
        taksiran: taksiran,
        pokok: pinjaman,
        bunga: bunga,           // % per bulan
        sisa: pinjaman * (1 + bunga/100 * 3), // asumsi tenor 3 bulan, bunga flat
        bulanTersisa: 3,
        status: 'active',       // active, default, auction
        createdAt: Date.now()
    };
    gameState.activeLoans.push(loan);
    gameState.cash -= pinjaman;
    gameState.transactions.push({ type: 'pinjaman', nama, jumlah: pinjaman, waktu: new Date() });
    gameState.cashFlowHistory.push(pinjaman);
    if (gameState.cashFlowHistory.length > 5) gameState.cashFlowHistory.shift();
    showNotification('✅ Pinjaman Disetujui', `Rp ${pinjaman.toLocaleString()} kepada ${nama}`, 'success');
    updateHeaderUI();
}

// Risiko gagal bayar: dipanggil tiap 15 detik
function checkDefaultRisk() {
    if (gameState.activeLoans.length === 0) return;
    // Probabilitas gagal bayar berdasarkan reputasi dan selisih harga pasar
    const reputasiFactor = (100 - gameState.reputasi) / 200; // 0-0.5
    const random = Math.random();
    let defaultIndex = [];
    gameState.activeLoans.forEach((loan, index) => {
        if (loan.status !== 'active') return;
        // hitung tekanan pasar: jika harga pasar turun drastis, risiko naik
        let hargaSekarang = gameState.marketPrices[loan.jenis];
        let hargaAwal = loan.taksiran / (0.8 * loan.jumlahUnit); // perkiraan harga awal
        let rasioHarga = hargaSekarang / hargaAwal;
        let marketRisk = Math.max(0, (1 - rasioHarga) * 0.5);
        let prob = reputasiFactor + marketRisk;
        if (random < prob) {
            defaultIndex.push(index);
        }
    });
    defaultIndex.forEach(idx => {
        let loan = gameState.activeLoans[idx];
        loan.status = 'default';
        // pindahkan ke lelang
        gameState.auctionItems.push({
            loanId: loan.id,
            nama: loan.nama,
            jenis: loan.jenis,
            jumlahUnit: loan.jumlahUnit,
            taksiran: loan.taksiran,
            sisaPinjaman: loan.sisa,
            status: 'ready'
        });
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
