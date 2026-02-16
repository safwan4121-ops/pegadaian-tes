const nameElement = document.getElementById("name");
const textElement = document.getElementById("text");
const choicesElement = document.getElementById("choices");
const characterImage = document.getElementById("character-image");

let moralScore = 50;

const characters = {
  ibu: { name: "Ibu", image: "assets/ibu.png" },
  pemuda: { name: "Pemuda", image: "assets/pemuda.png" },
  atasan: { name: "Atasan", image: "assets/atasan.png" },
  petugas: { name: "Kamu", image: "assets/petugas.png" }
};

const story = {
  S1: {
    character: "petugas",
    text: "Hari pertama kamu bekerja sebagai petugas pembiayaan.",
    choices: [
      { text: "Lanjut", next: "S2" }
    ]
  },
  S2: {
    character: "ibu",
    text: "Ibu ini ingin pinjaman untuk biaya pengobatan anaknya.",
    choices: [
      { text: "Proses sesuai aturan", moral: +10, next: "S3" },
      { text: "Minta imbalan", moral: -20, next: "S3" }
    ]
  },
  S3: {
    character: "pemuda",
    text: "Seorang pemuda ingin pinjaman untuk usaha.",
    choices: [
      { text: "Evaluasi dengan adil", moral: +10, next: "S4" },
      { text: "Tolak tanpa alasan", moral: -10, next: "S4" }
    ]
  },
  S4: {
    character: "atasan",
    text: "Atasan meminta laporan hasil kerja kamu.",
    choices: [
      { text: "Jujur melaporkan", moral: +10, next: "END" },
      { text: "Manipulasi data", moral: -20, next: "END" }
    ]
  },
  END: {
    character: "petugas",
    text: "",
    choices: []
  }
};

function startGame() {
  moralScore = 50;
  showScene("S1");
}

function showScene(sceneKey) {
  const scene = story[sceneKey];

  const character = characters[scene.character];
  nameElement.innerText = character.name;
  textElement.classList.remove("show");
  characterImage.classList.remove("show");

  setTimeout(() => {
    textElement.innerText = scene.text;
    textElement.classList.add("show");
  }, 200);

  characterImage.src = character.image;
  setTimeout(() => {
    characterImage.classList.add("show");
  }, 200);

  choicesElement.innerHTML = "";

  if (sceneKey === "END") {
    let endingText = "";

    if (moralScore >= 70) {
      endingText = "Kamu menjadi pegawai teladan dan dipercaya masyarakat.";
    } else if (moralScore >= 40) {
      endingText = "Kariermu berjalan biasa saja.";
    } else {
      endingText = "Kamu mendapat sanksi karena keputusan yang tidak etis.";
    }

    textElement.innerText = endingText;
    return;
  }

  scene.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.innerText = choice.text;
    button.style.animationDelay = `${index * 0.1}s`;
    button.onclick = () => selectChoice(choice);
    choicesElement.appendChild(button);
  });
}

function selectChoice(choice) {
  if (choice.moral) {
    moralScore += choice.moral;
  }
  showScene(choice.next);
}

startGame();
