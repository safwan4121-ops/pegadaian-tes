let currentItem;
let profit = 0;
let xp = 0;
let level = 1;
let timer;
let timeLeft = 10;
let historyData = [];

const items = [
  {name:"Emas", value:2000000, condition:90, risk:"Low"},
  {name:"Laptop", value:5000000, condition:70, risk:"Medium"},
  {name:"Motor", value:12000000, condition:80, risk:"High"}
];

function switchScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function startGame(){
  profit = 0;
  xp = 0;
  historyData = [];
  nextRound();
  switchScreen("game");
}

function nextRound(){
  currentItem = items[Math.floor(Math.random()*items.length)];
  document.getElementById("itemName").textContent = currentItem.name;
  document.getElementById("marketValue").textContent = currentItem.value;
  document.getElementById("condition").textContent = currentItem.condition;
  document.getElementById("riskLevel").textContent = currentItem.risk;

  timeLeft = 10;
  updateTimer();
  timer = setInterval(()=>{
    timeLeft--;
    updateTimer();
    if(timeLeft<=0){
      clearInterval(timer);
      evaluateDecision(0);
    }
  },1000);
}

function updateTimer(){
  document.getElementById("timerProgress").style.width = (timeLeft*10)+"%";
}

function submitDecision(){
  clearInterval(timer);
  let loan = parseInt(document.getElementById("loanInput").value);
  evaluateDecision(loan);
}

function evaluateDecision(loan){
  let optimal = currentItem.value * (currentItem.condition/100) * 0.7;
  let diff = Math.abs(loan - optimal);

  if(diff < 500000){
    profit += 500000;
    xp += 20;
    document.getElementById("feedback").textContent = "Keputusan Optimal!";
  } else if(loan > optimal){
    profit -= 300000;
    xp += 5;
    document.getElementById("feedback").textContent = "Risiko Tinggi!";
  } else {
    profit += 100000;
    xp += 10;
    document.getElementById("feedback").textContent = "Cukup Baik!";
  }

  historyData.push(profit);

  if(xp >= level*50){
    level++;
    document.getElementById("levelInfo").textContent = "Level "+level;
  }

  if(historyData.length >=5){
    endGame();
  } else {
    setTimeout(nextRound,1500);
  }
}

function endGame(){
  document.getElementById("finalProfit").textContent = profit;
  document.getElementById("finalXP").textContent = xp;
  drawChart();
  saveScore();
  switchScreen("result");
}

function drawChart(){
  let canvas = document.getElementById("chartCanvas");
  let ctx = canvas.getContext("2d");
  canvas.width=300;
  canvas.height=150;
  ctx.clearRect(0,0,300,150);
  ctx.beginPath();
  ctx.moveTo(0,150-historyData[0]/10000);
  for(let i=1;i<historyData.length;i++){
    ctx.lineTo(i*60,150-historyData[i]/10000);
  }
  ctx.strokeStyle="blue";
  ctx.stroke();
}

function saveScore(){
  let scores = JSON.parse(localStorage.getItem("pawnScores"))||[];
  scores.push({profit,xp});
  localStorage.setItem("pawnScores",JSON.stringify(scores));
}

function showLeaderboard(){
  let scores = JSON.parse(localStorage.getItem("pawnScores"))||[];
  let list = document.getElementById("leaderboardList");
  list.innerHTML="";
  scores.sort((a,b)=>b.profit-a.profit);
  scores.forEach(s=>{
    let li=document.createElement("li");
    li.textContent="Profit: "+s.profit+" | XP: "+s.xp;
    list.appendChild(li);
  });
  switchScreen("leaderboard");
}

function goHome(){
  switchScreen("home");
}

document.getElementById("toggleMode").onclick=function(){
  document.body.classList.toggle("light");
};howScreen('start-screen');
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
