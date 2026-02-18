// ==========================
// Engine Final — Full Dialogs + Audio Triggers + Safety
// ==========================

// ---------- 1) GAME STATE ----------
const defaultState = {
  profesionalisme: 0,
  empati: 0,
  stabilitas: 0,
  risiko_audit: false,
  peluang_sukses_usaha: false
};

let gameState = { ...defaultState };
let currentScene = "S1";

// ---------- 2) CHARACTERS & ASSETS ----------
const characters = {
  ibu: { name: "Ibu Rina", image: "assets/ibu.png" },
  pemuda: { name: "Ardi", image: "assets/pemuda.png" },
  atasan: { name: "Pak Surya", image: "assets/atasan.png" }
};

// helper to safely get DOM elements
const $ = id => document.getElementById(id);

// audio (optional)
const sfxClick = $("sfxClick");
const sfxStat = $("sfxStat");
const sfxPhone = $("sfxPhone");
const sfxPaper = $("sfxPaper");
const sfxDramatic = $("sfxDramatic");
const sfxApplause = $("sfxApplause");
function tryPlay(audioEl) {
  if (!audioEl) return;
  try { audioEl.currentTime = 0; audioEl.play().catch(()=>{}); } catch(e) {}
}

// ---------- 3) STORY DATA (FULL DIALOGS) ----------
const story = {
  // S1 Intro
  S1: {
    text:
`Pagi itu udara terasa sedikit dingin. Senin, hari pertama masa percobaanmu sebagai petugas layanan.
Meja masih rapih, komputer menyala, dan papan pengumuman penuh dengan target cabang.

Kamu menarik napas dalam-dalam dan membuka laci: alat tulis, catatan prosedur, dan sebuah stiker kecil bertuliskan "Layanan Dengan Hati".`,
    character: null,
    choices: [
      { text: "Siap. Mulai hari kerja.", next: "S2" }
    ]
  },

  // S2 Ibu datang
  S2: {
    text:
`Seorang ibu paruh baya melangkah masuk. Wajahnya cemas. Ia membawa tas kecil yang digamkan erat.
Saat ia duduk, dari tas itu terlihat sebuah cincin emas, kusam oleh waktu.

Ibu (suara bergetar): "Maaf, Nak. Ini satu-satunya yang bisa saya gadaikan. Anak saya harus bayar daftar ulang minggu ini."`,
    character: "ibu",
    choices: [
      {
        text: "Jujur: jelaskan nilai taksir dan alasan teknis",
        effect: { profesionalisme: 2, empati: 1, stabilitas: 1 },
        next: "S3_AFTER_IBU_HONEST"
      },
      {
        text: "Naikkan sedikit nilai agar cukup untuk biaya (diam-diam)",
        effect: { empati: 2, stabilitas: -1, risiko_audit: true },
        next: "S3_AFTER_IBU_KIND"
      },
      {
        text: "Tolak: jelaskan standar dengan tegas",
        effect: { profesionalisme: 1, empati: -2 },
        next: "S3_AFTER_IBU_REJECT"
      }
    ]
  },

  // S3 variants after ibu
  S3_AFTER_IBU_HONEST: {
    text:
`Kamu menjelaskan dengan lembut: kadar emas cincin ini tidak setinggi yang beliau kira. Kamu tunjukkan dokumen penaksiran dan rumus sederhana.

Ibu: "Oh... saya kira nilainya lebih tinggi. Terima kasih sudah jujur, Nak."
Ia menerima dengan mata berkaca — nampak kecewa namun lega.`,
    character: "ibu",
    choices: [
      { text: "Selesai. Lanjutkan.", next: "S4" }
    ]
  },

  S3_AFTER_IBU_KIND: {
    text:
`Kamu memilih untuk menaikkan sedikit nilai taksir. Kamu tahu ini melanggar batas kecil prosedur, tapi melihat tekanan di wajahnya, kamu tak tega.

Ibu (menangis pelan): "Terima kasih, Nak. Semoga Allah membalas kebaikanmu."
Setelah ia pergi, telepon di meja bergetar—rasa lega bercampur was-was dalam kepalamu.`,
    character: "ibu",
    choices: [
      { text: "Tarik napas, lanjutkan kerja.", next: "S4" }
    ]
  },

  S3_AFTER_IBU_REJECT: {
    text:
`Kamu mengatakan dengan tegas bahwa kondisinya tidak memenuhi standar. Ibu menunduk, menahan kecewa.

Ibu: "Terima kasih, Nak... saya akan cari jalan lain."
Ketika ia pergi, kamu merasakan ruang kerja sedikit lebih hening dan berat.`,
    character: "ibu",
    choices: [
      { text: "Lanjutkan shift.", next: "S4" }
    ]
  },

  // S4 Pemuda datang
  S4: {
    text:
`Beberapa hari berlalu. Seorang pemuda memasuki ruangmu dengan gagah, membawa sebuah laptop. Ia memperkenalkan diri: Ardi, 22 tahun.

Ardi: "Saya mau gadai laptop ini, Mas. Rencananya buat modal usaha desain. Saya yakin bisa balik modal dalam sebulan."`,
    character: "pemuda",
    choices: [
      {
        text: "Nilai sesuai standar (jujur)",
        effect: { profesionalisme: 2, stabilitas: 1 },
        next: "S5_AFTER_PEMUDA_STANDARD"
      },
      {
        text: "Sarankan tenor pendek (bantuan praktis)",
        effect: { empati: 1, profesionalisme: 1, peluang_sukses_usaha: true },
        next: "S5_AFTER_PEMUDA_TENOR"
      },
      {
        text: "Tawarkan alternatif pembiayaan bukan gadai",
        effect: { empati: 1 },
        next: "S5_AFTER_PEMUDA_ALT"
      }
    ]
  },

  S5_AFTER_PEMUDA_STANDARD: {
    text:
`Kamu menaksir laptop sesuai standar: spesifikasi bagus, tetapi kondisi baterai dan goresan mempengaruhi harga. Ardi terlihat sedikit kecewa, tetapi menerima karena memahami aturan.

Ardi: "Baik, Mas. Terima kasih. Saya akan berusaha."`,
    character: "pemuda",
    choices: [
      { text: "Semoga berhasil. Selesai.", next: "S6_TIME_PASS" }
    ]
  },

  S5_AFTER_PEMUDA_TENOR: {
    text:
`Kamu menyarankan tenor pendek sehingga bunganya tidak menumpuk. Ardi tersenyum lega.

Ardi: "Kalau begitu saya ambil tenor singkat. Terima kasih nasihatnya, Mas."
Kamu merasa pilihannya memberi dorongan kecil tapi nyata pada kesempatan Ardi.`,
    character: "pemuda",
    choices: [
      { text: "Semoga sukses.", next: "S6_TIME_PASS" }
    ]
  },

  S5_AFTER_PEMUDA_ALT: {
    text:
`Kamu jelaskan opsi selain gadai: program mitra, atau rekomendasi lembaga lain. Ardi tampak berpikir.

Ardi: "Mungkin itu lebih aman. Terima kasih sarannya."
Ia pergi dengan rencana yang sedikit berbeda.`,
    character: "pemuda",
    choices: [
      { text: "Catat dan lanjut.", next: "S6_TIME_PASS" }
    ]
  },

  // S6 Time Pass (dynamic)
  S6_TIME_PASS: {
    text:
`Waktu berjalan. Beberapa transaksi mendekati jatuh tempo. Kamu meninjau sistem untuk melihat siapa yang belum menebus barang.

Catatan: beberapa nama muncul — termasuk Ibu Rina dan Ardi.`,
    character: null,
    choices: [
      {
        text: "Terus cek (lanjut)",
        next: (state) => {
          // if audit risk and low stability -> audit
          if (state.risiko_audit && state.stabilitas <= 0) return "S7_AUDIT";
          // if peluang sukses usaha -> pemuda return
          if (state.peluang_sukses_usaha) return "S8_PEMUDA_RETURN";
          return "S9_ATASAN";
        }
      }
    ]
  },

  // S7_AUDIT (optional)
  S7_AUDIT: {
    text:
`Sinyal hati kecilmu ternyata benar: sistem internal mendeteksi anomali. Ada pemeriksaan audit mendadak untuk beberapa transaksi termasuk kasus yang melibatkan taksiran.

Atasan (tegas): "Jelaskan kenapa ada penyimpangan di laporan ini."`,
    character: "atasan",
    choices: [
      {
        text: "Jelaskan kronologis dan bertanggung jawab",
        effect: { profesionalisme: 2, empati: -1, stabilitas: -1 },
        next: "S9_ATASAN"
      },
      {
        text: "Akui kesalahan kecil dan ajukan solusi perbaikan",
        effect: { profesionalisme: 1, empati: 1, stabilitas: -1 },
        next: "S9_ATASAN"
      }
    ]
  },

  // S8_PEMUDA_RETURN (optional)
  S8_PEMUDA_RETURN: {
    text:
`Ardi kembali. Wajahnya berubah — lebih tegas, sedikit lelah.

Ardi: "Mas, alhamdulillah usaha kecilku mulai ada klien. Saya ingin menebus laptop dan bilang terima kasih atas saran tempo dulu."
Atau ia bisa datang dengan berita sebaliknya.`,
    character: "pemuda",
    choices: [
      {
        text: "Ia sukses: terima kasih dan menebus",
        effect: { empati: 1, stabilitas: 1 },
        next: "S9_ATASAN"
      },
      {
        text: "Ia belum pulih: belum mampu menebus",
        effect: { empati: -1, stabilitas: 0 },
        next: "S9_ATASAN"
      }
    ]
  },

  // S9_ATASAN: atasan memanggil
  S9_ATASAN: {
    text:
`Atasan memanggilmu ke ruangannya. Ia menatap laporan dan berkata:

Atasan: "Kita harus jaga stabilitas cabang. Ada target yang harus dipenuhi. Jelaskan tindakanmu terhadap kasus nasabah."`,
    character: "atasan",
    choices: [
      { text: "Saya siap menjelaskan.", next: "S10_DECIDE" }
    ]
  },

  // S10_DECIDE: final decision
  S10_DECIDE: {
    text:
`Di meja kerja, daftar transaksi menunggu keputusan — termasuk cincin Ibu Rina dan laptop Ardi.
Sekarang pilih tindakan akhir yang akan berdampak pada nasabah dan kinerja cabang.`,
    character: null,
    choices: [
      {
        text: "Hubungi nasabah & beri perpanjangan (empati)",
        effect: { empati: 2, stabilitas: -1 },
        next: "S11_CONSEQUENCE"
      },
      {
        text: "Proses lelang sesuai prosedur (ketat)",
        effect: { profesionalisme: 1, stabilitas: 2, empati: -1 },
        next: "S11_CONSEQUENCE"
      },
      {
        text: "Ajukan restrukturisasi beberapa kasus",
        effect: { empati: 1, profesionalisme: 1, stabilitas: -1 },
        next: "S11_CONSEQUENCE"
      }
    ]
  },

  // S11_CONSEQUENCE
  S11_CONSEQUENCE: {
    text:
`Konsekuensi dari keputusanmu mulai tampak. Seorang nasabah menebus dengan air mata lega. Ada juga barang yang dilelang dan masuk laporan keuntungan.
Atasan mencatat hasil awal dan memberi catatan untuk evaluasi.`,
    character: null,
    choices: [
      { text: "Terima hasil & lanjut evaluasi", next: "S12_EPILOG" }
    ]
  },

  // S12_EPILOG: final before ending
  S12_EPILOG: {
    text:
`Beberapa minggu kemudian laporan evaluasi keluar. Ini adalah momen untuk melihat apa yang telah kamu pilih dan pelajari dari konsekuensi keputusanmu.

Kamu duduk tenang. Layar menampilkan ringkasan kinerja cabang.`,
    character: null,
    choices: [
      { text: "Tunjukkan hasil evaluasi", next: "ENDING" }
    ]
  },

  // safety fallback scenes
  S13_UNUSED: {
    text: "Placeholder.",
    character: null,
    choices: [{ text: "Kembali", next: "S1" }]
  }
};

// ---------- 4) UTIL: applyEffect (with clamping & sound) ----------
function applyEffect(effect) {
  if (!effect) return;
  for (let key in effect) {
    if (typeof effect[key] === "number") {
      if (typeof gameState[key] !== "number") gameState[key] = 0;
      gameState[key] += effect[key];
    } else {
      gameState[key] = effect[key];
    }
  }
  // clamp numeric values to avoid runaway
  gameState.profesionalisme = Math.max(-5, Math.min(10, gameState.profesionalisme));
  gameState.empati = Math.max(-5, Math.min(10, gameState.empati));
  gameState.stabilitas = Math.max(-5, Math.min(10, gameState.stabilitas));
  tryPlay(sfxStat);
}

// ---------- 5) UPDATE STATS UI ----------
function updateStatsUI() {
  const statsEl = $("stats");
  statsEl.innerText = `Profesionalisme: ${gameState.profesionalisme} | Empati: ${gameState.empati} | Stabilitas: ${gameState.stabilitas}`;
}

// ---------- 6) RENDER LOGIC ----------
function renderScene() {
  if (currentScene === "ENDING") return showEnding();

  const scene = story[currentScene];
  if (!scene) {
    console.error("Scene not found:", currentScene);
    currentScene = "S1";
    return renderScene();
  }

  const textBox = $("text");
  const choiceBox = $("choices");
  const nameBox = $("character-name");
  const img = $("character-image");

  // clear UI
  choiceBox.innerHTML = "";
  textBox.classList.remove("show");
  img.classList.remove("show");

  // small dramatic audio on some scenes
  if (currentScene === "S7_AUDIT") tryPlay(sfxDramatic);
  if (currentScene === "S9_ATASAN") tryPlay(sfxPhone);

  // set text after tiny delay for fade effect
  setTimeout(() => {
    textBox.innerHTML = scene.text.split("\n").map(line => `<p>${escapeHtml(line)}</p>`).join("");
    textBox.classList.add("show");
  }, 80);

  // character portrait
  if (scene.character && characters[scene.character]) {
    nameBox.innerText = characters[scene.character].name;
    img.style.display = "";
    img.onload = () => img.classList.add("show");
    img.onerror = () => { img.style.display = "none"; };
    img.src = characters[scene.character].image || "";
  } else {
    nameBox.innerText = "";
    img.style.display = "none";
  }

  // build choices (support next being function)
  scene.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.innerText = choice.text;
    btn.type = "button";
    btn.addEventListener("click", () => {
      tryPlay(sfxClick);
      // small special sounds for certain choices
      if (currentScene.startsWith("S3") && choice.text.toLowerCase().includes("naikkan")) tryPlay(sfxDramatic);
      if (currentScene === "S8_PEMUDA_RETURN" && choice.text.toLowerCase().includes("sukses")) tryPlay(sfxApplause);

      applyEffect(choice.effect);
      // determine next scene
      let next = choice.next;
      if (typeof next === "function") {
        next = next(gameState);
      }
      if (!next) {
        console.error("Choice missing next for", currentScene, choice);
        next = "S1";
      }
      setTimeout(() => {
        currentScene = next;
        updateStatsUI();
        renderScene();
      }, 240);
    });

    btn.style.transitionDelay = (idx * 80) + "ms";
    choiceBox.appendChild(btn);
  });

  updateStatsUI();
}

// ---------- 7) ENDING EVALUATION (with dramatic sound) ----------
function showEnding() {
  const textBox = $("text");
  const choiceBox = $("choices");
  const nameBox = $("character-name");
  const img = $("character-image");

  nameBox.innerText = "";
  img.style.display = "none";
  choiceBox.innerHTML = "";
  textBox.classList.remove("show");

  let endingText = "";

  // evaluate endings with order: fail -> teladan -> idealistis -> target -> neutral
  if (gameState.profesionalisme <= 1 || gameState.stabilitas < 0) {
    endingText = "ENDING: Tidak Lolos Masa Percobaan.\nEvaluasi menunjukkan butuh peningkatan pada keseimbangan tugas dan prosedur.";
    tryPlay(sfxDramatic);
  } else if (gameState.profesionalisme >= 4 &&
             gameState.empati >= 3 &&
             gameState.stabilitas >= 2) {
    endingText = "ENDING: Pegawai Teladan.\nKamu berhasil menyeimbangkan aturan dan empati — nasabah terbantu dan cabang tetap stabil.";
    tryPlay(sfxApplause);
  } else if (gameState.empati >= 4 && gameState.stabilitas <= 1) {
    endingText = "ENDING: Idealistis.\nKamu sangat peduli pada nasabah, namun cabang mengalami tekanan keuangan.";
    tryPlay(sfxDramatic);
  } else if (gameState.stabilitas >= 4 && gameState.empati <= 1) {
    endingText = "ENDING: Target-Oriented.\nCabang kuat secara angka, tetapi reputasi layanan menurun.";
    tryPlay(sfxPaper);
  } else {
    endingText = "ENDING: Evaluasi Netral.\nTindakanmu menunjukkan potensi namun masih ada area untuk perbaikan.";
    tryPlay(sfxStat);
  }

  setTimeout(() => {
    textBox.innerHTML = endingText.split("\n").map(line => `<p>${escapeHtml(line)}</p>`).join("");
    textBox.classList.add("show");
  }, 80);

  // restart button
  const restartBtn = document.createElement("button");
  restartBtn.innerText = "Main Lagi (Reset)";
  restartBtn.onclick = () => {
    resetGame();
    renderScene();
  };
  $("choices").appendChild(restartBtn);
}

// ---------- 8) SAVE / LOAD / RESET ----------
function saveGame() {
  const payload = {
    state: gameState,
    scene: currentScene
  };
  try {
    localStorage.setItem("pegadaian_game_v2", JSON.stringify(payload));
    alert("Permainan disimpan.");
  } catch (e) {
    alert("Gagal menyimpan: " + e.message);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("pegadaian_game_v2");
    if (!raw) { alert("Tidak ada save ditemukan."); return; }
    const payload = JSON.parse(raw);
    gameState = { ...defaultState, ...payload.state };
    currentScene = payload.scene || "S1";
    updateStatsUI();
    renderScene();
    alert("Permainan dimuat.");
  } catch (e) {
    alert("Gagal muat save: " + e.message);
  }
}

function resetGame() {
  gameState = { ...defaultState };
  currentScene = "S1";
  try { localStorage.removeItem("pegadaian_game_v2"); } catch(e){}
  updateStatsUI();
  renderScene();
}

// ---------- 9) UTILS ----------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- 10) INIT & EVENTS ----------
window.addEventListener("load", () => {
  // bindings
  $("saveBtn").addEventListener("click", () => { tryPlay(sfxClick); saveGame(); });
  $("loadBtn").addEventListener("click", () => { tryPlay(sfxClick); loadGame(); });
  $("resetBtn").addEventListener("click", () => { if (confirm("Reset permainan?")) { tryPlay(sfxClick); resetGame(); } });

  // graceful image fallback
  const img = $("character-image");
  img.onerror = () => { img.style.display = "none"; };

  renderScene();
});
