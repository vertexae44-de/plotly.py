// =====================================================================
//  Skeleton Boss  -  right-click the Boss Summoner (costs 10 diamonds)
//  Standalone Bloxd world code. Merge the callbacks into your world code
//  if you already have onPlayerChat / onPlayerClick / tick / onPlayerJoin.
// =====================================================================

// ---- Settings ----------------------------------------------------------------
const BOSS_COST_ITEM = "Diamond";
const BOSS_COST_AMOUNT = 10;

const SUMMONER_ITEM = "Bone";                 // item you right-click with
const SUMMONER_NAME = "Boss Summoner";        // its display name
const BOSS_MOB_TYPES = ["Skeleton", "Draugr Skeleton"];  // first one the game accepts is used
const BOSS_NAME = "Skeleton King";
const BOSS_HEALTH = 600;
const BOSS_SPAWN_DISTANCE = 6;                // blocks in front of you
const SUMMON_COOLDOWN_MS = 3000;

// Fireballs
const FIREBALL_INTERVAL_MS = 4000;            // how often the boss shoots
const FIREBALL_RANGE = 40;                    // targets must be this close
const FIREBALL_SPEED = 0.9;                   // blocks per tick
const FIREBALL_MAX_TICKS = 60;
const FIREBALL_HIT_RADIUS = 1.6;
const FIREBALL_DAMAGE = 14;
const FIREBALL_KNOCKBACK = 9;
const FIREBALL_EXPLOSION_RADIUS = 3;

// ---- State -------------------------------------------------------------------
const bosses = {};        // mobId -> { nextFire: ms }
const fireballs = [];     // { pos: [x,y,z], dir: [x,y,z], ticks: n, owner: mobId }
const lastSummon = {};    // playerId -> ms

// ---- Helpers -----------------------------------------------------------------
function bossNotify(playerId, msg, color) {
  api.sendMessage(playerId, msg, { color: color || "white" });
}

function dist3(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function nearestPlayer(pos, maxDist) {
  let best = null, bestD = maxDist;
  for (const pid of api.getPlayerIds()) {
    const p = api.getPosition(pid);
    if (!p) continue;
    const d = dist3(pos, p);
    if (d < bestD) { bestD = d; best = pid; }
  }
  return best;
}

function fireParticle(pos, big) {
  api.playParticleEffect({
    dir1: [-0.3, -0.3, -0.3],
    dir2: [0.3, 0.3, 0.3],
    pos1: [pos[0] - 0.2, pos[1] - 0.2, pos[2] - 0.2],
    pos2: [pos[0] + 0.2, pos[1] + 0.2, pos[2] + 0.2],
    texture: "glint",
    minLifeTime: 0.2,
    maxLifeTime: big ? 0.8 : 0.4,
    minEmitPower: big ? 3 : 0.5,
    maxEmitPower: big ? 6 : 1.5,
    minSize: big ? 0.4 : 0.3,
    maxSize: big ? 1.2 : 0.7,
    manualEmitCount: big ? 60 : 8,
    gravity: [0, 0, 0],
    colorGradients: [
      { timeFraction: 0, minColor: [255, 140, 0, 1], maxColor: [255, 60, 0, 1] },
    ],
    velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
    blendMode: 1,
  });
}

// ---- Summoning ---------------------------------------------------------------
function countDiamonds(playerId) {
  const n = api.getInventoryItemAmount(playerId, BOSS_COST_ITEM);
  return n < 0 ? Infinity : n;
}

function spawnBoss(playerId) {
  const pos = api.getPosition(playerId);
  const dir = api.getPlayerFacingInfo(playerId).dir;
  const len = Math.max(0.001, Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2]));
  const x = pos[0] + (dir[0] / len) * BOSS_SPAWN_DISTANCE;
  const z = pos[2] + (dir[2] / len) * BOSS_SPAWN_DISTANCE;
  const y = pos[1] + 1;

  for (const type of BOSS_MOB_TYPES) {
    try {
      const id = api.attemptSpawnMob(type, x, y, z, { name: BOSS_NAME });
      if (id) return id;
    } catch (e) {}
  }
  return null;
}

function trySummonBoss(playerId) {
  const now = api.now();
  if (lastSummon[playerId] && now - lastSummon[playerId] < SUMMON_COOLDOWN_MS) return;

  if (countDiamonds(playerId) < BOSS_COST_AMOUNT) {
    bossNotify(playerId, "You need " + BOSS_COST_AMOUNT + " " + BOSS_COST_ITEM + "s to summon the boss.", "red");
    return;
  }

  const mobId = spawnBoss(playerId);
  if (!mobId) {
    bossNotify(playerId, "Could not spawn the boss (mob type not accepted).", "red");
    return;   // diamonds are only taken after a successful spawn
  }

  lastSummon[playerId] = now;
  api.removeItemName(playerId, BOSS_COST_ITEM, BOSS_COST_AMOUNT);

  try { api.setMaxHealth(mobId, BOSS_HEALTH); } catch (e) {}
  try { api.setHealth(mobId, BOSS_HEALTH); } catch (e) {}

  bosses[mobId] = { nextFire: now + 2000 };
  api.broadcastMessage(api.getEntityName(playerId) + " summoned the " + BOSS_NAME + "!", { color: "orange" });
  api.broadcastSound("ominousBellHit", 1, 0.8, { playerIdOrPos: playerId, maxHearDist: 60 });
}

// ---- Fireballs ---------------------------------------------------------------
function shootFireball(mobId, targetId) {
  const from = api.getPosition(mobId);
  const to = api.getPosition(targetId);
  if (!from || !to) return;

  const start = [from[0], from[1] + 1.6, from[2]];
  const aim = [to[0], to[1] + 1, to[2]];
  const d = dist3(start, aim) || 1;
  fireballs.push({
    pos: start,
    dir: [(aim[0] - start[0]) / d, (aim[1] - start[1]) / d, (aim[2] - start[2]) / d],
    ticks: 0,
    owner: mobId,
  });
  api.broadcastSound("cannonFire1", 0.8, 1.3, { playerIdOrPos: start, maxHearDist: 40 });
}

function explodeFireball(fb) {
  fireParticle(fb.pos, true);
  api.broadcastSound("ominousBellHit", 0.8, 1.5, { playerIdOrPos: fb.pos, maxHearDist: 40 });

  for (const pid of api.getPlayerIds()) {
    const p = api.getPosition(pid);
    if (!p) continue;
    const d = dist3(fb.pos, p);
    if (d > FIREBALL_EXPLOSION_RADIUS) continue;

    try {
      api.attemptApplyDamage({
        eId: fb.owner,
        hitEId: pid,
        attemptedDmgAmt: FIREBALL_DAMAGE,
        withItem: "Fire Orb",
        attackDir: fb.dir,
        showCritParticles: false,
        reduceVerticalKbVelocity: false,
      });
    } catch (e) {
      try { api.setHealth(pid, api.getHealth(pid) - FIREBALL_DAMAGE); } catch (e2) {}
    }
    const len = Math.max(0.001, Math.sqrt((p[0] - fb.pos[0]) ** 2 + (p[2] - fb.pos[2]) ** 2));
    api.applyImpulse(pid, ((p[0] - fb.pos[0]) / len) * FIREBALL_KNOCKBACK, 5, ((p[2] - fb.pos[2]) / len) * FIREBALL_KNOCKBACK);
  }
}

function stepFireballs() {
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fb = fireballs[i];
    fb.pos = [
      fb.pos[0] + fb.dir[0] * FIREBALL_SPEED,
      fb.pos[1] + fb.dir[1] * FIREBALL_SPEED,
      fb.pos[2] + fb.dir[2] * FIREBALL_SPEED,
    ];
    fb.ticks++;
    fireParticle(fb.pos, false);

    let hit = false;
    for (const pid of api.getPlayerIds()) {
      const p = api.getPosition(pid);
      if (p && dist3(fb.pos, [p[0], p[1] + 1, p[2]]) < FIREBALL_HIT_RADIUS) { hit = true; break; }
    }

    let blocked = false;
    try {
      const b = api.getBlock(Math.floor(fb.pos[0]), Math.floor(fb.pos[1]), Math.floor(fb.pos[2]));
      blocked = b !== "Air" && b !== undefined && b !== null;
    } catch (e) {}

    if (hit || blocked || fb.ticks >= FIREBALL_MAX_TICKS) {
      explodeFireball(fb);
      fireballs.splice(i, 1);
    }
  }
}

function updateBosses() {
  const now = api.now();
  for (const key of Object.keys(bosses)) {
    const mobId = key;
    let alive = false;
    try { alive = api.isAlive(mobId); } catch (e) {}
    if (!alive) {
      delete bosses[key];
      api.broadcastMessage("The " + BOSS_NAME + " has been defeated!", { color: "gold" });
      continue;
    }
    if (now >= bosses[key].nextFire) {
      const pos = api.getPosition(mobId);
      const target = pos && nearestPlayer(pos, FIREBALL_RANGE);
      if (target) shootFireball(mobId, target);
      bosses[key].nextFire = now + FIREBALL_INTERVAL_MS;
    }
  }
}

// ---- Callbacks (merge into your world code if you already define these) --------
function tick() {
  updateBosses();
  stepFireballs();
}

// Right-click the Boss Summoner to summon.
function onPlayerClick(playerId, wasAltClick) {
  if (!wasAltClick) return;
  const held = api.getHeldItem(playerId);
  if (held && held.name === SUMMONER_ITEM && held.attributes?.customDisplayName === SUMMONER_NAME) {
    trySummonBoss(playerId);
  }
}

// Type !boss to get the summoner item.
function onPlayerChat(playerId, msg) {
  if (msg.toLowerCase().startsWith("!boss")) {
    api.giveItem(playerId, SUMMONER_ITEM, 1, {
      customDisplayName: SUMMONER_NAME,
      customDescription: "Right click to summon the " + BOSS_NAME + ". Costs " + BOSS_COST_AMOUNT + " " + BOSS_COST_ITEM + "s.",
    });
    bossNotify(playerId, "Got the Boss Summoner. Right click it with " + BOSS_COST_AMOUNT + " diamonds in your inventory.", "yellow");
    return false;
  }
}
