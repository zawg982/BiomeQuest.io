// ========================================================
// 🟢 INIT & GAME SETUP
// ========================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
let gameState = "menu";
let player = null;
let world = [];
let enemies = [];
let weather = { type: "sun", intensity: 0 };
let lastTime = performance.now();

const keys = {};

// ========================================================
// 📦 PLAYER MOVEMENT
// ========================================================
class Player {
  constructor(name, skin) {
    this.name = name;
    this.skin = skin;
    this.x = 0;
    this.y = 0;
    this.speed = 3;
    this.hp = 100;
    this.xp = 0;
  }

  move() {
    if (keys["ArrowUp"]) this.y -= this.speed;
    if (keys["ArrowDown"]) this.y += this.speed;
    if (keys["ArrowLeft"]) this.x -= this.speed;
    if (keys["ArrowRight"]) this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = "#4cf";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ========================================================
// 🌎 WORLD GENERATION
// ========================================================
function generateWorld(seed = 42) {
  world = Array.from({ length: 1000 }, (_, x) =>
    Array.from({ length: 1000 }, (_, y) => {
      const biome = (x + y + seed) % 3;
      return biome; // 0 = grass, 1 = ice, 2 = tech
    })
  );
}

// ========================================================
// ☁️ WEATHER SYSTEM
// ========================================================
function updateWeather() {
  const hour = new Date().getHours();
  weather.type = ["sun", "rain", "fog", "storm"][Math.floor(Math.random() * 4)];
  weather.intensity = Math.random();
}

// ========================================================
// 👾 ENEMY AI
// ========================================================
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 50;
  }

  update() {
    // Basic patrol
    this.x += Math.random() - 0.5;
    this.y += Math.random() - 0.5;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(
      this.x - player.x + canvas.width / 2,
      this.y - player.y + canvas.height / 2,
      20,
      20
    );
  }
}

// ========================================================
// 🧠 GAME LOOP
// ========================================================
function gameLoop(now) {
  const delta = now - lastTime;
  lastTime = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "playing") {
    player.move();
    drawWorld();
    player.draw();
    enemies.forEach((e) => {
      e.update();
      e.draw();
    });
    updateUI();
  }

  requestAnimationFrame(gameLoop);
}

// ========================================================
// 🌄 WORLD RENDERING
// ========================================================
function drawWorld() {
  const size = 40;
  for (let dx = -10; dx <= 10; dx++) {
    for (let dy = -10; dy <= 10; dy++) {
      const wx = Math.floor(player.x / size) + dx;
      const wy = Math.floor(player.y / size) + dy;
      const biome = world?.[wx]?.[wy] ?? 0;
      ctx.fillStyle = ["#6c6", "#ccf", "#88f"][biome];
      ctx.fillRect(
        canvas.width / 2 + dx * size,
        canvas.height / 2 + dy * size,
        size,
        size
      );
    }
  }
}

// ========================================================
// 🎛️ UI SYSTEM
// ========================================================
function updateUI() {
  document.getElementById("stats").textContent =
    `❤️ ${player.hp} | 🧪 XP ${player.xp}`;
}

// ========================================================
// 🚀 START GAME
// ========================================================
document.getElementById("playButton").onclick = () => {
  const name = document.getElementById("usernameInput").value || "Guest";
  const skin = document.getElementById("skinSelect").value;
  player = new Player(name, skin);
  generateWorld();
  enemies = [new Enemy(100, 100), new Enemy(200, 150)];
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById("hud").classList.add("active");
  gameState = "playing";
};

window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

requestAnimationFrame(gameLoop);
