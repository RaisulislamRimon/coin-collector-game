const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const startBtn = document.getElementById("start");

const W = canvas.width;
const H = canvas.height;

let player, coins, blocks;
let score = 0;
let lives = 3;
let running = false;
let lastTime = 0;
let coinTimer = 0;
let blockTimer = 0;
let left = false;
let right = false;
let best = Number(localStorage.getItem("coinBest") || 0);

bestEl.textContent = best;

function resetGame() {
  player = {
    x: W / 2 - 16,
    y: H - 60,
    w: 32,
    h: 32,
    speed: 240,
  };

  coins = [];
  blocks = [];
  score = 0;
  lives = 3;
  coinTimer = 0;
  blockTimer = 0;
  updateStats();
}

function updateStats() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  bestEl.textContent = best;
}

function startGame() {
  resetGame();
  running = true;
  overlay.classList.add("hidden");
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  left = false;
  right = false;

  if (score > best) {
    best = score;
    localStorage.setItem("coinBest", String(best));
  }

  updateStats();
  message.textContent = `Game Over! Score: ${score}`;
  startBtn.textContent = "Play Again";
  overlay.classList.remove("hidden");
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function update(dt) {
  if (left) player.x -= player.speed * dt;
  if (right) player.x += player.speed * dt;

  player.x = Math.max(0, Math.min(W - player.w, player.x));

  const level = Math.floor(score / 100);
  const extraSpeed = Math.min(level * 12, 100);

  coinTimer += dt;
  blockTimer += dt;

  if (coinTimer > 0.75) {
    coins.push({
      x: 12 + Math.random() * (W - 24),
      y: -20,
      r: 10,
      speed: 130 + extraSpeed,
    });
    coinTimer = 0;
  }

  if (blockTimer > Math.max(0.45, 1.1 - level * 0.04)) {
    const size = 24 + Math.random() * 12;

    blocks.push({
      x: Math.random() * (W - size),
      y: -size,
      w: size,
      h: size,
      speed: 150 + extraSpeed,
    });

    blockTimer = 0;
  }

  for (const coin of coins) {
    coin.y += coin.speed * dt;
  }

  for (const block of blocks) {
    block.y += block.speed * dt;
  }

  coins = coins.filter((coin) => {
    const hit = overlaps(player, {
      x: coin.x - coin.r,
      y: coin.y - coin.r,
      w: coin.r * 2,
      h: coin.r * 2,
    });

    if (hit) score += 10;

    return !hit && coin.y < H + 20;
  });

  blocks = blocks.filter((block) => {
    if (overlaps(player, block)) {
      lives--;

      if (lives <= 0) {
        endGame();
      }

      return false;
    }

    return block.y < H + 30;
  });

  updateStats();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0b1320";
  ctx.fillRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = "#263750";
  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y < H; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Coins
  for (const coin of coins || []) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.fill();

    ctx.strokeStyle = "#fff1b3";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Obstacles
  for (const block of blocks || []) {
    ctx.fillStyle = "#ff5268";
    ctx.fillRect(block.x, block.y, block.w, block.h);
  }

  // Player
  if (player) {
    ctx.fillStyle = "#64e6b1";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#103c39";
    ctx.fillRect(player.x + 7, player.y + 8, 5, 5);
    ctx.fillRect(player.x + 20, player.y + 8, 5, 5);
  }
}

function loop(now) {
  if (!running) return;

  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  update(dt);
  draw();

  if (running) {
    requestAnimationFrame(loop);
  } else {
    draw();
  }
}

function holdButton(id, direction) {
  const button = document.getElementById(id);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);

    if (direction === "left") left = true;
    else right = true;
  });

  function release() {
    if (direction === "left") left = false;
    else right = false;
  }

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

holdButton("left", "left");
holdButton("right", "right");

document.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") left = true;

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d")
    right = true;
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")
    left = false;

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d")
    right = false;
});

window.addEventListener("blur", () => {
  left = false;
  right = false;
});

startBtn.addEventListener("click", startGame);

resetGame();
draw();
