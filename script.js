// ==========================
// Engine Final: Story + Safe UI + Save/Load
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
function tryPlay(audioEl) {
  if (!audioEl) return;
  try { audioEl.currentTime = 0; audioEl.play().catch(()=>{}); } catch(e) {}
}

// ---------- 3) STORY DATA (12 SCENE + OPTIONALS) ----------
const story = {
  // S1: intro
  S1: {
    text: "Hari pertamamu sebagai petugas layanan. Kantor terasa sunyi namun penuh tanggung jawab.",
    character: null,
    choices: [{ text: "Mulai Hari Kerja", next: "S2" }]
  },

  // S2: ibu datang
  S2: {
    text: "Seorang ibu paruh baya datang dengan wajah cemas, membawa sebuah cincin emas yang tampak sudah lama dipakai.",
    character: "ibu",
    choices: [
      {
        text: "Jujur: jelaskan nilai taksir sebenarnya",
        effect: { profesionalisme: 2, empati: 1, stabilitas: 1 },
        next: "S3"
      },
      {
        text: "Naikkan sedikit nilai agar cukup untuk biaya",
        effect: { empati: 2, stabilitas: -1, risiko_audit: true },
        next: "S3"
      },
      {
        text: "Tolak karena tidak memenuhi standar",
        effect: { profesionalisme: 1, empati: -2 },
        next: "S3"
      }
    ]
  },

  // S3: after ibu => pemuda datang
  S3: {
    text: "Beberapa hari kemudian, pemuda muda masuk membawa laptop. Ia berbicara tentang rencananya membuka usaha desain grafis.",
    character: "pemuda",
    choices: [
      {
        text: "Nilai sesuai standar",
        effect: { profesionalisme: 2, stabilitas: 1 },
        next: "S4"
      },
      {
        text: "Sarankan tenor pendek agar bunga kecil",
        effect: { empati: 1, profesionalisme: 1, peluang_sukses_usaha: true },
        next: "S4"
      },
      {
        text: "Tawarkan alternatif pembiayaan (bukan gadai)",
        effect: { empati: 1 },
        next: "S4"
      }
    ]
  },

  // S4: waktu berlalu - dynamic checks will control next
  S4: {
    text: "Waktu berjalan. Beberapa transaksi mendekati masa jatuh tempo. Kamu memeriksa sistem untuk melihat status.",
    character: null,
    choices: [
      {
        text: "Lanjutkan (cek situasi)",
        next: (state) => {
          // if audit risk and low stability -> trigger audit scene
          if (state.risiko_audit && state.stabilitas <= 0) return "S5_AUDIT";
          // if pemuda punya peluang sukses -> pemuda kembali scene
          if (state.peluang_sukses_usaha) return "S6_PEMUDA_RETURN";
          // else proceed ke panggilan atasan
          return "S7_ATASAN";
        }
      }
    ]
  },

  // S5_AUDIT: optional audit
  S5_AUDIT: {
    text: "Sistem internal mendeteksi anomali. Ada pemeriksaan audit mendadak untuk beberapa transaksi.\nAtasan meminta penjelasanmu tentang nilai taksir tertentu.",
    character: "atasan",
    choices: [
      {
        text: "Jelaskan kronologis dan bertanggung jawab",
        effect: { profesionalisme: 2, empati: -1, stabilitas: -1 },
        next: "S7_ATASAN"
      },
      {
        text: "Mengakui kesalahan kecil dan ajukan perbaikan",
        effect: { profesionalisme: 1, empati: 1, stabilitas: -1 },
        next: "S7_ATASAN"
      }
    ]
  },

  // S6_PEMUDA_RETURN: optional pemuda returns (success or fail)
  S6_PEMUDA_RETURN: {
    text: "Pemuda yang dulu menggadaikan laptop kembali. Ia membawa kabar tentang usaha kecilnya.",
    character: "pemuda",
    choices: [
      {
        text: "Sukses: ia berhasil dan menebus barang",
        effect: { empati: 1, stabilitas: 1 },
        next: "S7_ATASAN"
      },
      {
        text: "Gagal: ia belum pulih dan tidak mampu menebus",
        effect: { empati: -1, stabilitas: 0 },
        next: "S7_ATASAN"
      }
    ]
  },

  // S7_ATASAN: atasan memanggil
  S7_ATASAN: {
    text: "Atasan memanggilmu. Ia menanyakan kinerja cabang dan menekankan target keuntungan.",
    character: "atasan",
    choices: [
      { text: "Dengar penjelasan atasan", next: "S8" }
    ]
  },

  // S8: persiapan keputusan akhir
  S8: {
    text: "Beberapa barang hampir jatuh tempo — termasuk cincin dari Ibu Rina. Sekarang kamu harus menentukan tindakan: kontak nasabah, proses lelang, atau ajukan restrukturisasi.",
    character: null,
    choices: [
      {
        text: "Hubungi nasabah dan beri perpanjangan (empati)",
        effect: { empati: 2, stabilitas: -1 },
        next: "S9_CONSEQUENCE"
      },
      {
        text: "Proses lelang sesuai prosedur (ketat)",
        effect: { profesionalisme: 1, stabilitas: 2, empati: -1 },
        next: "S9_CONSEQUENCE"
      },
      {
        text: "Ajukan restrukturisasi untuk beberapa kasus",
        effect: { empati: 1, profesionalisme: 1, stabilitas: -1 },
        next: "S9_CONSEQUENCE"
      }
    ]
  },

  // S9_CONSEQUENCE: reflect consequences of final action
  S9_CONSEQUENCE: {
    text: "Konsekuensi dari keputusanmu segera terlihat — ada pelanggan yang menebus, ada juga yang barangnya dilelang. Atasan menilai tindakanmu.",
    character: null,
    choices: [
      { text: "Terima hasil dan lanjutkan", next: "S10_EPILOG" }
    ]
  },

  // S10_EPILOG: summary epilog before ending decision
  S10_EPILOG: {
    text: "Beberapa minggu kemudian, evaluasi cabang keluar. Skor kinerjamu tercatat di sistem dan reputasi cabang terlihat di laporan internal.",
    character: null,
    choices: [
      { text: "Lihat hasil evaluasi", next: "ENDING" }
    ]
  },

  // fallback scene (shouldn't be used directly)
  S11_UNUSED: {
    text: "Scene placeholder.",
    character: null,
    choices: [
      { text: "Kembali ke awal", next: "S1" }
    ]
  },

  // S12_UNUSED (keamanan)
  S12_UNUSED: {
    text: "Scene keamanan.",
    character: null,
    choices: [
      { text: "Akhiri", next: "ENDING" }
    ]
  }
};

// ---------- 4) UTIL: applyEffect ----------
function applyEffect(effect) {
  if (!effect) return;
  for (let key in effect) {
    // numeric delta
    if (typeof effect[key] === "number") {
      if (typeof gameState[key] !== "number") gameState[key] = 0;
      gameState[key] += effect[key];
    } else {
      // boolean or direct set
      gameState[key] = effect[key];
    }
  }
  // clamp numeric values to sane bounds to avoid runaway
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
    // safe fallback
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

  // set text after tiny delay for fade effect
  setTimeout(() => {
    // text can contain newlines — convert to paragraphs
    textBox.innerHTML = scene.text.split("\n").map(line => `<p>${escapeHtml(line)}</p>`).join("");
    textBox.classList.add("show");
  }, 80);

  // character
  if (scene.character && characters[scene.character]) {
    nameBox.innerText = characters[scene.character].name;
    // set src and handle missing image gracefully
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
      // apply effect
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
      // small delay to allow stat sound/animation
      setTimeout(() => {
        currentScene = next;
        updateStatsUI();
        renderScene();
      }, 240);
    });

    // staggered entry animation for buttons
    btn.style.transitionDelay = (idx * 80) + "ms";
    choiceBox.appendChild(btn);
  });

  updateStatsUI();
}

// ---------- 7) ENDING EVALUATION ----------
function showEnding() {
  const textBox = $("text");
  const choiceBox = $("choices");
  const nameBox = $("character-name");
  const img = $("character-image");

  nameBox.innerText = "";
  img.style.display = "none";
  choiceBox.innerHTML = "";
  textBox.classList.remove("show");

  // compute ending
  let endingText = "";

  if (gameState.profesionalisme >= 4 &&
      gameState.empati >= 3 &&
      gameState.stabilitas >= 2) {
    endingText = "ENDING: Pegawai Teladan.\nKamu berhasil menyeimbangkan aturan dan empati. Cabang stabil dan nasabah merasa diperlakukan adil.";
  } else if (gameState.empati >= 4 && gameState.stabilitas <= 1) {
    endingText = "ENDING: Idealistis.\nKamu sangat peduli pada nasabah, namun cabang menunjukkan tanda-tanda tekanan finansial.";
  } else if (gameState.stabilitas >= 4 && gameState.empati <= 1) {
    endingText = "ENDING: Target-Oriented.\nPencapaian target kuat, tetapi hubungan dengan nasabah dan reputasi sosial menurun.";
  } else if (gameState.profesionalisme <= 1 || gameState.stabilitas < 0) {
    endingText = "ENDING: Tidak Lolos Masa Percobaan.\nPerlu pembelajaran lebih lanjut mengenai keseimbangan tanggung jawab.";
  } else {
    endingText = "ENDING: Evaluasi Netral.\nKamu menunjukkan potensi tetapi masih perlu perbaikan di beberapa area.";
  }

  setTimeout(() => {
    textBox.innerHTML = endingText.split("\n").map(line => `<p>${escapeHtml(line)}</p>`).join("");
    textBox.classList.add("show");
  }, 80);

  // show restart choice
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
    localStorage.setItem("pegadaian_game_v1", JSON.stringify(payload));
    alert("Permainan disimpan.");
  } catch (e) {
    alert("Gagal menyimpan: " + e.message);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem("pegadaian_game_v1");
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
  try { localStorage.removeItem("pegadaian_game_v1"); } catch(e){}
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
  // UI bindings
  $("saveBtn").addEventListener("click", () => { tryPlay(sfxClick); saveGame(); });
  $("loadBtn").addEventListener("click", () => { tryPlay(sfxClick); loadGame(); });
  $("resetBtn").addEventListener("click", () => { if (confirm("Reset permainan?")) { tryPlay(sfxClick); resetGame(); } });

  // graceful image fallback: hide if not found
  const img = $("character-image");
  img.onerror = () => { img.style.display = "none"; };

  renderScene();
});
