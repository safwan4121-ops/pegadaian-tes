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

    document.getElementById('learn-mode').addEventListener('click', () => {
        alert('Learn Mode: Pelajari konsep keuangan dasar di sini.');
    });

    document.getElementById('leaderboard').addEventListener('click', () => {
        alert('Leaderboard: Lihat skor tertinggi.');
    });

    // Mode A: Quick Decision
    function startModeA() {
        modeA.style.display = 'block';
        // Sample item
        document.getElementById('item-name').textContent = 'Nama: Emas Batangan';
        document.getElementById('market-value').textContent = 'Nilai Pasar: Rp 10.000.000';
        document.getElementById('condition').textContent = 'Kondisi: 90%';
        document.getElementById('risk').textContent = 'Risiko: Rendah';

        // Timer
        let timeLeft = 30;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = timeLeft;
        const interval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            timerElement.style.background = `conic-gradient(#00ffcc ${ (30 - timeLeft) / 30 * 100 }%, transparent 0%)`;
            if (timeLeft <= 0) {
                clearInterval(interval);
                alert('Waktu habis! Loss.');
                showAnalytics();
            }
        }, 1000);

        // Approve/Reject
        document.getElementById('approve').addEventListener('click', () => handleDecision(true, interval));
        document.getElementById('reject').addEventListener('click', () => handleDecision(false, interval));
    }

    function handleDecision(approve, interval) {
        clearInterval(interval);
        const loan = parseInt(document.getElementById('loan-amount').value);
        // Simple logic: optimal loan is 80% of market value
        const optimal = 10000000 * 0.8;
        if (!approve) {
            alert('Rejected. Kehilangan pelanggan.');
        } else if (loan > optimal + 1000000) {
            alert('Terlalu tinggi. Rugi.');
            shakeScreen();
        } else if (loan < optimal - 1000000) {
            alert('Terlalu rendah. Kehilangan pelanggan.');
        } else {
            alert('Optimal! Profit +Rp 500.000');
            profit += 500000;
            correctDecisions++;
            confetti();
        }
        modeA.style.display = 'none';
        startModeB();
    }

    // Mode B: Smart Case Analysis
    function startModeB() {
        modeB.style.display = 'block';
        document.getElementById('case-description').textContent = 'Seorang siswa menggadaikan emas senilai Rp2.000.000, Bunga 2% per bulan, Tenor 3 bulan.';

        document.getElementById('calculate-interest').addEventListener('click', () => {
            const principal = 2000000;
            const rate = 0.02;
            const time = 3;
            const interest = principal * rate * time;
            const total = principal + interest;
            document.getElementById('total-interest').textContent = `Total Bunga: Rp ${interest}`;
            document.getElementById('total-payment').textContent = `Total Pembayaran: Rp ${total}`;
        });

        document.getElementById('apply-strategy').addEventListener('click', () => {
            const strategy = document.getElementById('strategy').value;
            let impact = '';
            if (strategy === 'Tebus sekarang') {
                impact = 'Dampak: Profit cepat, reputasi baik.';
                profit += 100000;
            } else if (strategy === 'Perpanjang') {
                impact = 'Dampak: Profit lebih, risiko meningkat.';
                managedRisks++;
            } else {
                impact = 'Dampak: Risiko gagal bayar.';
            }
            document.getElementById('impact').textContent = impact;
            modeB.style.display = 'none';
            triggerRiskEvent();
        });
    }

    // Risk Event
    function triggerRiskEvent() {
        riskEvent.style.display = 'block';
        const events = [
            'Harga emas naik 10%! Profit +10%.',
            'Pelanggan gagal bayar. Loss -Rp 500.000.',
            'Promo bunga 1%. Pelanggan bertambah.',
            'Barang palsu terdeteksi. Risiko dikelola.'
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        riskEvent.textContent = randomEvent;
        if (randomEvent.includes('Profit')) profit += 200000;
        if (randomEvent.includes('Loss')) profit -= 500000;
        if (randomEvent.includes('dikelola')) managedRisks++;
        setTimeout(() => {
            riskEvent.style.display = 'none';
            showAnalytics();
        }, 3000);
    }

    // Analytics
    function showAnalytics() {
        gameScreen.style.display = 'none';
        analytics.style.display = 'block';
        score = (profit / 100000) + (correctDecisions * 10) + (managedRisks * 5);
        document.getElementById('total-profit').textContent = `Total Profit: Rp ${profit}`;
        document.getElementById('correct-decisions').textContent = `Keputusan Benar: ${correctDecisions}`;
        document.getElementById('managed-risks').textContent = `Risiko Dikelola: ${managedRisks}`;

        // Simple chart using Canvas
        const ctx = document.getElementById('performance-chart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Profit', 'Decisions', 'Risks'],
                datasets: [{
                    label: 'Performance',
                    data: [profit / 1000000, correctDecisions, managedRisks],
                    backgroundColor: '#00ffcc'
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Rank
        let rank = '';
        if (score >= 90) rank = 'Financial Strategist';
        else if (score >= 75) rank = 'Smart Investor';
        else if (score >= 60) rank = 'Risk Manager';
        else rank = 'Financial Beginner';
        alert(`Skor Anda: ${score} - Rank: ${rank}`);
    }

    // Animations
    function shakeScreen() {
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
    }

    function confetti() {
        // Simple confetti simulation (can use library for better)
        alert('Confetti! 🎉');
    }

    // Add shake class to CSS dynamically or assume it's in style.css
    const style = document.createElement('style');
    style.innerHTML = `
        .shake {
            animation: shake 0.5s;
        }
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
    `;
    document.head.appendChild(style);

    // Include Chart.js for charts
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
});
