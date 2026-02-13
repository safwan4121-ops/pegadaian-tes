// script.js

// Game State
let currentLevel = 1;
let currentQuestion = 0;
let score = 0;
let xp = 0;
let progress = 0;
const maxScore = 100;
const levels = [
    {
        title: 'Level 1: Dasar Pegadaian',
        questions: [
            {
                type: 'multiple',
                question: 'Apa itu gadai?',
                options: ['Pinjaman dengan jaminan', 'Investasi saham', 'Tabungan bank', 'Asuransi'],
                answer: 0,
                explanation: 'Gadai adalah pinjaman uang dengan menjaminkan barang berharga.'
            },
            // Tambahkan 4 soal lagi, total 5
            {
                type: 'multiple',
                question: 'Fungsi barang jaminan?',
                options: ['Dijual langsung', 'Sebagai pengaman pinjaman', 'Diberikan gratis', 'Digunakan pegadaian'],
                answer: 1,
                explanation: 'Barang jaminan untuk mengamankan pinjaman jika gagal bayar.'
            },
            {
                type: 'multiple',
                question: 'Konsep bunga sederhana?',
                options: ['Pokok x Bunga x Waktu', 'Pokok + Bunga', 'Waktu saja', 'Tidak ada bunga'],
                answer: 0,
                explanation: 'Bunga sederhana dihitung dari pokok pinjaman.'
            },
            {
                type: 'multiple',
                question: 'Nilai taksiran adalah?',
                options: ['Harga jual barang', 'Estimasi nilai barang', 'Harga beli', 'Tidak relevan'],
                answer: 1,
                explanation: 'Nilai taksiran menentukan besaran pinjaman.'
            },
            {
                type: 'multiple',
                question: 'Risiko gagal bayar?',
                options: ['Barang hilang', 'Tidak ada risiko', 'Dapat bonus', 'Pinjaman gratis'],
                answer: 0,
                explanation: 'Jika gagal bayar, barang jaminan bisa dilelang.'
            }
        ]
    },
    {
        title: 'Level 2: Perhitungan & Mini Case',
        questions: [
            {
                type: 'input',
                question: 'Hitung bunga sederhana untuk Rp1.000.000, bunga 2%/bulan, 3 bulan.',
                answer: 60000,
                explanation: 'Bunga = 1.000.000 x 0.02 x 3 = 60.000'
            },
            {
                type: 'input',
                question: 'Total pembayaran untuk pinjaman di atas?',
                answer: 1060000,
                explanation: 'Total = Pokok + Bunga = 1.000.000 + 60.000 = 1.060.000'
            },
            // Tambahkan lebih banyak jika diperlukan
            {
                type: 'multiple',
                question: 'Studi kasus: Pinjam Rp500.000, bunga 1.5%/bulan, 4 bulan. Total bunga?',
                options: ['30.000', '45.000', '60.000', '75.000'],
                answer: 0,
                explanation: 'Bunga = 500.000 x 0.015 x 4 = 30.000'
            }
        ]
    },
    {
        title: 'Level 3: Risiko & Keputusan',
        questions: [
            {
                type: 'multiple',
                question: 'Anda punya pinjaman jatuh tempo. Apa keputusan terbaik jika punya uang?',
                options: ['Tebus sekarang', 'Perpanjang', 'Biarkan jatuh tempo', 'Abaikan'],
                answer: 0,
                explanation: 'Tebus sekarang untuk menghindari bunga tambahan.'
            },
            // Tambahkan simulasi dinamis
            {
                type: 'multiple',
                question: 'Harga emas naik, barang jaminan emas. Keputusan?',
                options: ['Tebus cepat', 'Perpanjang', 'Jual', 'Tunggu'],
                answer: 0,
                explanation: 'Tebus cepat untuk manfaatkan kenaikan harga.'
            },
            // Lebih banyak
        ]
    }
];

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Sounds
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');

// Dark Mode
const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') toggleDarkMode();
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Button Listeners
    document.getElementById('start-btn').addEventListener('click', startSimulation);
    document.getElementById('learn-btn').addEventListener('click', showLearn);
    document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('back-to-start-learn').addEventListener('click', backToStart);
    document.getElementById('back-to-start-leader').addEventListener('click', backToStart);
    document.getElementById('restart-btn').addEventListener('click', startSimulation);
    document.getElementById('back-to-start-end').addEventListener('click', backToStart);
    document.getElementById('calc-btn').addEventListener('click', calculateInterest);

    // Keyboard Accessibility
    document.addEventListener('keydown', handleKeyboard);
});

// Functions
function startSimulation() {
    currentLevel = 1;
    currentQuestion = 0;
    score = 0;
    xp = 0;
    progress = 0;
    hideAllScreens();
    showScreen('simulation-screen');
    loadLevel();
}

function loadLevel() {
    const level = levels[currentLevel - 1];
    document.getElementById('level-title').textContent = level.title;
    loadQuestion();
}

function loadQuestion() {
    const level = levels[currentLevel - 1];
    if (currentQuestion >= level.questions.length) {
        currentLevel++;
        currentQuestion = 0;
        if (currentLevel > levels.length) {
            endSimulation();
            return;
        }
        loadLevel();
        return;
    }

    const q = level.questions[currentQuestion];
    const container = document.getElementById('question-container');
    container.innerHTML = '';
    const questionEl = document.createElement('p');
    questionEl.textContent = q.question;
    container.appendChild(questionEl);

    if (q.type === 'multiple') {
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.classList.add('btn', 'option');
            btn.textContent = opt;
            btn.addEventListener('click', () => checkAnswer(idx, q.answer, q.explanation));
            container.appendChild(btn);
        });
    } else if (q.type === 'input') {
        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = 'Masukkan jawaban';
        container.appendChild(input);
        const submitBtn = document.createElement('button');
        submitBtn.classList.add('btn', 'primary');
        submitBtn.textContent = 'Submit';
        submitBtn.addEventListener('click', () => checkAnswer(parseInt(input.value), q.answer, q.explanation));
        container.appendChild(submitBtn);
    }

    updateProgress();
}

function checkAnswer(userAnswer, correctAnswer, explanation) {
    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');
    if (userAnswer === correctAnswer) {
        feedback.classList.add('correct');
        feedback.textContent = 'Benar! ' + explanation;
        score += 20; // Adjust scoring
        xp += 10;
        if (successSound) successSound.play();
    } else {
        feedback.classList.add('wrong');
        feedback.textContent = 'Salah. ' + explanation;
        if (errorSound) errorSound.play();
    }
    document.getElementById('score').textContent = score;
    document.getElementById('xp').textContent = xp;
    document.getElementById('next-btn').classList.remove('hidden');
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('retry-btn').classList.remove('hidden');
    document.getElementById('retry-btn').addEventListener('click', retryQuestion);
}

function nextQuestion() {
    currentQuestion++;
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('retry-btn').classList.add('hidden');
    loadQuestion();
}

function retryQuestion() {
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('retry-btn').classList.add('hidden');
    loadQuestion();
}

function updateProgress() {
    progress = (currentQuestion / levels[currentLevel - 1].questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

function endSimulation() {
    hideAllScreens();
    showScreen('end-screen');
    document.getElementById('final-score').textContent = score;
    let category = '';
    if (score >= 90) category = 'Financial Expert';
    else if (score >= 70) category = 'Smart Planner';
    else if (score >= 50) category = 'Learning Investor';
    else category = 'Beginner';
    document.getElementById('category').textContent = category;

    // Save to leaderboard
    leaderboard.push({ name: 'Player', score }); // Ganti 'Player' dengan input nama jika diperlukan
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function showLearn() {
    hideAllScreens();
    showScreen('learn-screen');
}

function showLeaderboard() {
    hideAllScreens();
    showScreen('leaderboard-screen');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    leaderboard.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${entry.name} - ${entry.score}`;
        list.appendChild(li);
    });
}

function backToStart() {
    hideAllScreens();
    showScreen('start-screen');
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
}

function showScreen(id) {
    document.getElementById(id).classList.remove('hidden');
}

function calculateInterest() {
    const principal = parseFloat(document.getElementById('principal').value);
    const rate = parseFloat(document.getElementById('rate').value) / 100;
    const time = parseFloat(document.getElementById('time').value);
    const interest = principal * rate * time;
    const total = principal + interest;
    document.getElementById('calc-result').textContent = `Bunga: Rp${interest}, Total: Rp${total}`;
}

function handleKeyboard(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement.tagName === 'BUTTON') {
            document.activeElement.click();
        }
    }
}

// Save Progress (Autosave)
setInterval(() => {
    localStorage.setItem('gameState', JSON.stringify({ currentLevel, currentQuestion, score, xp }));
}, 5000);

// Load Progress
const savedState = JSON.parse(localStorage.getItem('gameState'));
if (savedState) {
    currentLevel = savedState.currentLevel;
    currentQuestion = savedState.currentQuestion;
    score = savedState.score;
    xp = savedState.xp;
    // Optional: Prompt to resume
}