// script.js
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    const openingScreen = document.getElementById('opening-screen');
    const gameScreen = document.getElementById('game-screen');
    const modeA = document.getElementById('mode-a');
    const modeB = document.getElementById('mode-b');
    const riskEvent = document.getElementById('risk-event');
    const analytics = document.getElementById('analytics');

    // Scores and stats
    let score = 0;
    let profit = 0;
    let correctDecisions = 0;
    let managedRisks = 0;

    // Opening screen buttons
    document.getElementById('start-simulation').addEventListener('click', () => {
        openingScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        startModeA();
    });

    // Learn Mode → GANTI JADI MODAL CUSTOM (hilangkan alert!)
    document.getElementById('learn-mode').addEventListener('click', () => {
        document.getElementById('learn-modal').style.display = 'flex';
    });

    // Tutup modal Learn
    document.getElementById('close-learn').addEventListener('click', () => {
        document.getElementById('learn-modal').style.display = 'none';
    });

    // Leaderboard (bisa diganti modal kalau mau, sekarang alert dulu)
    document.getElementById('leaderboard').addEventListener('click', () => {
        alert('Leaderboard: Belum tersedia. Skor lokal Anda akan disimpan di masa depan!');
    });

    // Mode A: Quick Decision
    function startModeA() {
        modeA.style.display = 'block';
        // Sample item (bisa diganti random nanti)
        document.getElementById('item-name').textContent = 'Nama: Emas Batangan';
        document.getElementById('market-value').textContent = 'Nilai Pasar: Rp 10.000.000';
        document.getElementById('condition').textContent = 'Kondisi: 90%';
        document.getElementById('risk').textContent = 'Risiko: Rendah';

        // Timer circular
        let timeLeft = 30;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = timeLeft;
        const interval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            const progress = (30 - timeLeft) / 30 * 100;
            timerElement.style.background = `conic-gradient(#00ffcc ${progress}%, transparent 0%)`;
            if (timeLeft <= 0) {
                clearInterval(interval);
                alert('Waktu habis! Loss.');
                showAnalytics();
            }
        }, 1000);

        // Approve/Reject (gunakan once supaya gak double listener)
        const approveBtn = document.getElementById('approve');
        const rejectBtn = document.getElementById('reject');
        approveBtn.onclick = () => handleDecision(true, interval);
        rejectBtn.onclick = () => handleDecision(false, interval);
    }

    function handleDecision(approve, interval) {
        clearInterval(interval);
        const loanInput = document.getElementById('loan-amount');
        const loan = parseInt(loanInput.value) || 0;
        const optimal = 10000000 * 0.8; // 8 juta

        let message = '';
        if (!approve) {
            message = 'Rejected. Kehilangan pelanggan.';
        } else if (loan > optimal + 1000000) {
            message = 'Terlalu tinggi. Rugi!';
            shakeScreen();
        } else if (loan < optimal - 1000000) {
            message = 'Terlalu rendah. Kehilangan pelanggan.';
        } else {
            message = 'Optimal! Profit +Rp 500.000';
            profit += 500000;
            correctDecisions++;
            confetti();
        }
        alert(message); // Bisa diganti modal nanti
        loanInput.value = ''; // Reset input
        modeA.style.display = 'none';
        startModeB();
    }

    // Mode B: Smart Case Analysis
    function startModeB() {
        modeB.style.display = 'block';
        document.getElementById('case-description').textContent = 'Seorang siswa menggadaikan emas senilai Rp2.000.000, Bunga 2% per bulan, Tenor 3 bulan.';

        // Hitung bunga sekali saja
        const calculateBtn = document.getElementById('calculate-interest');
        calculateBtn.onclick = () => {
            const principal = 2000000;
            const rate = 0.02;
            const time = 3;
            const interest = principal * rate * time;
            const total = principal + interest;
            document.getElementById('total-interest').textContent = `Total Bunga: Rp ${interest.toLocaleString('id-ID')}`;
            document.getElementById('total-payment').textContent = `Total Pembayaran: Rp ${total.toLocaleString('id-ID')}`;
        };

        // Apply strategi
        document.getElementById('apply-strategy').onclick = () => {
            const strategy = document.getElementById('strategy').value;
            let impact = '';
            if (strategy === 'Tebus sekarang') {
                impact = 'Dampak: Profit cepat, reputasi baik.';
                profit += 100000;
            } else if (strategy === 'Perpanjang') {
                impact = 'Dampak: Profit lebih, risiko meningkat.';
                managedRisks++;
            } else {
                impact = 'Dampak: Risiko gagal bayar tinggi.';
            }
            document.getElementById('impact').textContent = impact;
            modeB.style.display = 'none';
            triggerRiskEvent();
        };
    }

    // Risk Event (random)
    function triggerRiskEvent() {
        riskEvent.style.display = 'block';
        const events = [
            '📈 Harga emas naik 10%! Profit +Rp 200.000.',
            '⚠ Pelanggan gagal bayar. Loss -Rp 500.000.',
            '🎉 Promo bunga 1%. Pelanggan bertambah!',
            '🚨 Barang palsu terdeteksi. Risiko berhasil dikelola.'
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        riskEvent.textContent = randomEvent;

        if (randomEvent.includes('Profit')) profit += 200000;
        if (randomEvent.includes('Loss')) profit -= 500000;
        if (randomEvent.includes('dikelola')) managedRisks++;

        setTimeout(() => {
            riskEvent.style.display = 'none';
            showAnalytics();
        }, 4000); // Lebih lama biar dibaca
    }

    // Analytics
    function showAnalytics() {
        gameScreen.style.display = 'none';
        analytics.style.display = 'block';

        score = Math.round((profit / 100000) + (correctDecisions * 10) + (managedRisks * 5));

        document.getElementById('total-profit').textContent = `Total Profit: Rp ${profit.toLocaleString('id-ID')}`;
        document.getElementById('correct-decisions').textContent = `Keputusan Benar: ${correctDecisions}`;
        document.getElementById('managed-risks').textContent = `Risiko Dikelola: ${managedRisks}`;

        // Chart (pastikan Chart.js loaded)
        const ctx = document.getElementById('performance-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Profit (juta)', 'Keputusan Benar', 'Risiko Dikelola'],
                datasets: [{
                    label: 'Performa',
                    data: [profit / 1000000, correctDecisions, managedRisks],
                    backgroundColor: '#00ffcc',
                    borderColor: '#00ffcc',
                    borderWidth: 1
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { labels: { color: '#fff' } } }
            }
        });

        // Rank dengan alert (bisa diganti modal)
        let rank = score >= 90 ? 'Financial Strategist 💎' :
                   score >= 75 ? 'Smart Investor 📈' :
                   score >= 60 ? 'Risk Manager 💼' : 'Financial Beginner 📘';
        alert(`Skor Anda: ${score}\nRank: ${rank}`);
    }

    // Animations
    function shakeScreen() {
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 600);
    }

    function confetti() {
        // Placeholder sederhana (bisa tambah library confetti.js nanti)
        alert('🎉 Confetti! Keputusan optimal!');
    }

    // Dynamic shake keyframes (sudah bagus)
    const style = document.createElement('style');
    style.innerHTML = `
        .shake {
            animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
    `;
    document.head.appendChild(style);

    // Load Chart.js dynamically
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    chartScript.onload = () => console.log('Chart.js loaded');
    document.head.appendChild(chartScript);
});
