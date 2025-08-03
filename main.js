// ========================================================
// 🟢 INIT & GAME SETUP
// ========================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth; canvas.height = innerHeight;
let gameState = "menu";
let player, world = [], enemies = [], items = [], quests = [];
let weather = { type: "sun", intensity: 0, timer: 0 };
let timeOfDay = 0;
const keys = {};
const TILE = 32;

// Load/save from localStorage
function saveGame(){
  localStorage.setItem("biomequest_save", JSON.stringify({
    name: player.name, skin: player.skin,
    x: player.x, y: player.y, hp: player.hp,
    xp: player.xp, level: player.level,
    inventory: player.inventory
  }));
}
function loadGame(){
  const d = JSON.parse(localStorage.getItem("biomequest_save") || '{}');
  if(d.name){
    Object.assign(player, d);
  }
}

// ========================================================
// 📦 PLAYER & XP SYSTEM
// ========================================================
class Player {
  constructor(name, skin){
    this.name = name; this.skin = skin;
    this.x = 0; this.y = 0; this.speed = 3;
    this.hp = 100; this.xp = 0; this.level = 1;
    this.inventory = {};
  }
  move(){
    if(keys["ArrowUp"]) this.y -= this.speed;
    if(keys["ArrowDown"]) this.y += this.speed;
    if(keys["ArrowLeft"]) this.x -= this.speed;
    if(keys["ArrowRight"]) this.x += this.speed;
  }
  draw(){
    ctx.fillStyle = "#4cf";
    ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 20, 0, Math.PI*2);
    ctx.fill();
  }
  gainXP(n){
    this.xp += n;
    const req = this.level*100;
    if(this.xp >= req){
      this.level++; this.xp -= req;
      this.hp = 100;
    }
  }
}

// ========================================================
// 🌎 WORLD & CRAFTING SYSTEM
// ========================================================
function generateWorld(seed=42){
  const size=200;
  world = Array.from({length:size},(_,x)=>Array.from({length:size},(_,y)=>{
    return (x+y+seed) % 4; // 0:grass,1:ice,2:tech,3:swamp
  }));
  items = [];
}

function drawWorld(){
  const view = 15;
  for(let dx=-view;dx<=view;dx++)for(let dy=-view;dy<=view;dy++){
    const wx = Math.floor(player.x/TILE)+dx;
    const wy = Math.floor(player.y/TILE)+dy;
    const b = world[wx]?.[wy] ?? 0;
    const col = ["#6c6","#ccf","#888","#5a5"][b];
    ctx.fillStyle = col;
    ctx.fillRect(canvas.width/2+dx*TILE,canvas.height/2+dy*TILE,TILE,TILE);
  }
}

function gatherResource(){
  const key = Math.floor(player.x/TILE)+','+Math.floor(player.y/TILE);
  player.inventory[key] = (player.inventory[key]||0)+1;
  player.gainXP(10);
}

function craft(item){
  if(player.inventory[item.key]>=item.cost){
    player.inventory[item.key]-=item.cost;
    player.inventory[item.result] = (player.inventory[item.result]||0)+1;
  }
}

// ========================================================
// 👾 ENEMY AI
// ========================================================
class Enemy {
  constructor(x,y){ this.x=x;this.y=y;this.hp=50; this.state="patrol"; }
  update(){
    const dx = player.x - this.x, dy = player.y - this.y;
    const dist = Math.hypot(dx,dy);
    if(dist<100) this.state = "chase";
    else this.state = "patrol";
    if(this.state==="chase"){
      this.x += dx/dist*1.5; this.y += dy/dist*1.5;
    } else {
      this.x += Math.random()-0.5;
      this.y += Math.random()-0.5;
    }
    if(dist<30){ player.hp -= 0.5; if(player.hp<=0) gameOver(); }
    if(this.hp<=0) player.gainXP(20);
  }
  draw(){
    ctx.fillStyle = "red";
    const sx = canvas.width/2 + (this.x - player.x);
    const sy = canvas.height/2 + (this.y - player.y);
    ctx.fillRect(sx, sy, TILE/2, TILE/2);
  }
}

// ========================================================
// ☁️ WEATHER & DAY/NIGHT
// ========================================================
function updateWeather(dt){
  weather.timer += dt;
  if(weather.timer > 5000){
    weather.type = ["sun","rain","fog","storm"][Math.floor(Math.random()*4)];
    weather.intensity = Math.random();
    weather.timer = 0;
  }
}

function renderWeather(){
  ctx.globalAlpha = weather.intensity * 0.5;
  if(weather.type==="rain"){
    for(let i=0;i<200;i++){
      const x = Math.random()*canvas.width;
      const y = Math.random()*canvas.height;
      ctx.strokeStyle = "#88f";
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+10); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function updateTime(dt){
  timeOfDay = (timeOfDay + dt*0.00002) % 1;
  const shade = timeOfDay<0.5 ? (0.5+timeOfDay) : (1.5-timeOfDay);
  ctx.fillStyle = `rgba(0,0,0,${0.5-shade/2})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

// ========================================================
// 🎛️ UI, MINIMAP & SAVE/LOAD
// ========================================================
function updateUI(){
  document.getElementById("stats").textContent =
    `❤️ ${Math.floor(player.hp)} | XP ${player.xp}/${player.level*100}`;
  // minimap draw
  const mm = document.getElementById("minimap").getContext('2d');
  mm.clearRect(0,0,150,150);
  const px = world.length/2, py = world.length/2;
  mm.fillStyle="white";
  mm.fillRect(75,75,5,5);
}

function gameOver(){
  gameState="over";
  document.querySelectorAll(".screen").forEach(el=>el.classList.remove("active"));
  document.getElementById("endScreen").classList.add("active");
}

// ========================================================
// 🧪 MAIN LOOP
// ========================================================
let last = performance.now();
function loop(now){
  const dt = now-last; last=now;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(gameState==="playing"){
    player.move(); drawWorld();
    enemies.forEach(e=>{e.update(); e.draw();});
    updateWeather(dt);
    renderWeather();
    updateTime(dt);
    player.draw();
    updateUI();
    saveGame();
  }
  requestAnimationFrame(loop);
}

// ========================================================
// 🚀 START & INPUT
// ========================================================
document.getElementById("playButton").onclick = ()=>{
  const name = document.getElementById("usernameInput").value||"Guest";
  const skin = document.getElementById("skinSelect").value;
  player = new Player(name, skin);
  loadGame();
  generateWorld();
  enemies = [new Enemy(100,100), new Enemy(150,200)];
  document.querySelectorAll(".screen").forEach(el=>el.classList.remove("active"));
  document.getElementById("hud").classList.add("active");
  gameState="playing";
};
window.addEventListener("keydown",e=>keys[e.key]=true);
window.addEventListener("keyup",e=>keys[e.key]=false);
canvas.addEventListener("click",gatherResource);

requestAnimationFrame(loop);
