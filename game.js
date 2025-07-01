const playerImages = {
  green: document.getElementById("player-green"),
  pink: document.getElementById("player-pink"),
  orange: document.getElementById("player-orange"),
  blue: document.getElementById("player-blue"),
  purple: document.getElementById("player-purple")
};

const succinctImg = document.getElementById("succinctImage");
const bombImg = document.getElementById("bombImage");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const teamSelect = document.getElementById("teamSelect");
const scoreDisplay = document.getElementById("score");
const proofsDisplay = document.getElementById("proofs");
const livesDisplay = document.getElementById("lives");
const scoreboard = document.getElementById("scoreboard");

let player = {
  x: 200,
  y: 550,
  size: 30,
  color: 'green',
  image: null,
  shieldActive: false,
  shieldTimer: 0
};

let keys = {};
let obstacles = [], multipliers = [], shields = [];
let score = 0, proofs = 0, lives = 5;
let gameRunning = false, animationId = null;

function startGame() {
  player.color = teamSelect.value;
  player.image = playerImages[player.color];

  document.getElementById("start-screen").style.display = "none";
  document.getElementById("end-screen").style.display = "none";
  scoreboard.style.display = "block";

  // Reset game state
  score = 0; proofs = 0; lives = 5;
  obstacles = []; multipliers = []; shields = [];
  player.shieldActive = false; player.shieldTimer = 0;
  updateScore();

  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  startGame();
}

function drawPlayer() {
  if (player.shieldActive) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size + 10, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ffff00";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (player.image && player.image.complete) {
    ctx.drawImage(player.image, player.x - player.size, player.y - player.size, player.size * 2, player.size * 2);
  } else {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, -r);
  for (let i = 0; i < 5; i++) {
    ctx.rotate(Math.PI / 5);
    ctx.lineTo(0, -r * 0.5);
    ctx.rotate(Math.PI / 5);
    ctx.lineTo(0, -r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

function drawShields() {
  shields.forEach(sh => drawStar(ctx, sh.x, sh.y, 14, "#00ffcc"));
}

function drawObstacles() {
  obstacles.forEach(obj => {
    ctx.drawImage(bombImg, obj.x - 15, obj.y - 15, 30, 30);
  });
}

function drawMultipliers() {
  multipliers.forEach(mp => {
    ctx.drawImage(succinctImg, mp.x - 34, mp.y - 34, 64, 64);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.fillText(mp.value + "x", mp.x - 8, mp.y + 5);
  });
}

function update() {
  if (keys["ArrowLeft"] || keys["a"]) player.x -= 6;
  if (keys["ArrowRight"] || keys["d"]) player.x += 6;
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));

  if (Math.random() < 0.02) obstacles.push({ x: Math.random() * (canvas.width - 20), y: -20 });
  if (Math.random() < 0.015) multipliers.push({ x: Math.random() * (canvas.width - 12), y: -12, value: Math.floor(Math.random() * 3) + 1 });
  if (Math.random() < 0.004) shields.push({ x: Math.random() * (canvas.width - 30), y: -30 });

  obstacles.forEach(obj => obj.y += 5);
  multipliers.forEach(mp => mp.y += 4);
  shields.forEach(sh => sh.y += 3);

  obstacles = obstacles.filter(obj => {
    if (Math.hypot(player.x - obj.x, player.y - obj.y) < player.size) {
      if (player.shieldActive) return false;
      lives--;
      livesDisplay.textContent = lives;
      if (lives <= 0) endGame();
      return false;
    }
    return obj.y < canvas.height;
  });

  multipliers = multipliers.filter(mp => {
    if (Math.hypot(player.x - mp.x, player.y - mp.y) < player.size + 10) {
      proofs += mp.value;
      score += mp.value * 10;
      animateProof(mp.x, mp.y);
      updateScore();
      return false;
    }
    return mp.y < canvas.height;
  });

  shields = shields.filter(sh => {
    if (Math.hypot(player.x - sh.x, player.y - sh.y) < player.size + 10) {
      player.shieldActive = true;
      player.shieldTimer = 360;
      animateProof(sh.x, sh.y);
      return false;
    }
    return sh.y < canvas.height;
  });

  if (player.shieldActive) {
    player.shieldTimer--;
    if (player.shieldTimer <= 0) player.shieldActive = false;
  }
}

function animateProof(x, y) {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.left = x + canvas.offsetLeft + "px";
  el.style.top = y + canvas.offsetTop + "px";
  el.style.width = "20px";
  el.style.height = "20px";
  el.style.background = "#ffd700";
  el.style.borderRadius = "50%";
  el.style.animation = "collectAnimation 0.5s ease-out forwards";
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 500);
}

function updateScore() {
  scoreDisplay.textContent = score;
  proofsDisplay.textContent = proofs;
}

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawObstacles();
  drawMultipliers();
  drawShields();
  update();
  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  scoreboard.style.display = "none";
  document.getElementById("end-screen").style.display = "block";
  document.getElementById("finalProofs").textContent = proofs;
}

// Keyboard controls
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Mobile swipe control
let touchStartX = null;

canvas.addEventListener("touchstart", e => {
  if (!gameRunning) return;
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener("touchmove", e => {
  if (!gameRunning || touchStartX === null) return;
  const touchX = e.touches[0].clientX;
  const deltaX = touchX - touchStartX;
  player.x += deltaX;
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  touchStartX = touchX;
});

canvas.addEventListener("touchend", () => {
  touchStartX = null;
});

// Button hooks
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
document.getElementById("shareBtn").addEventListener("click", () => {
  const name = document.getElementById("playerName").value || "Someone";
  const tweetText = `${name} collected ${proofs} proofs in the zk dodge! ⚡🔐\nTry it here: https://yourlink.com made by @wru_kii`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  window.open(tweetUrl, '_blank');
});








