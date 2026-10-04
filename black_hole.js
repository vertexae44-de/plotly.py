// =====================================================================
//  BLACK HOLE ORB  -  world code
//  !blackhole gives you the orb. Right-click it: a black hole forms
//  ahead of you, sucks in everything nearby for a few seconds, then
//  collapses in a big explosion that blasts everyone outward.
// =====================================================================

// ---- Settings ----------------------------------------------------------------
const ORB_ITEM = "Black Carpet";             // the item you hold (any item name works)
const ORB_NAME = "Black Hole Orb";
const ORB_COOLDOWN_MS = 12000;

const HOLE_DISTANCE = 9;                     // how far ahead of you it forms
const HOLE_DURATION_MS = 5000;               // how long it pulls
const PULL_RADIUS = 12;                      // how far its gravity reaches
const PULL_STRENGTH = 1.6;                   // pull per tick (stronger when closer)
const TICK_DAMAGE = 1;                       // damage per second to things near the core
const CORE_RADIUS = 2.5;

const BLAST_RADIUS = 10;                     // collapse explosion
const BLAST_FORCE = 22;
const BLAST_DAMAGE = 25;
const IMMUNE_TO_OWN_HOLE = true;             // the summoner isn't pulled or hurt

// A real, visible black sphere made of blocks at the core (removed when it collapses).
const CORE_BLOCKS = ["Obsidian", "Black Concrete", "Coal Block"];   // first one that places is used
const CORE_BLOCK_RADIUS = 2;

// ---- State -------------------------------------------------------------------
const holes = [];            // { pos, owner, endsAt, nextDamage }
const lastUse = {};          // playerId -> ms

// ---- Helpers -----------------------------------------------------------------
function dist3(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function swirl(pos, radius, count, colorA, colorB) {
  api.playParticleEffect({
    dir1: [-1, -0.2, -1],
    dir2: [1, 0.2, 1],
    pos1: [pos[0] - radius, pos[1] - radius * 0.4, pos[2] - radius],
    pos2: [pos[0] + radius, pos[1] + radius * 0.4, pos[2] + radius],
    texture: "glint",
    minLifeTime: 0.4,
    maxLifeTime: 1,
    minEmitPower: 1,
    maxEmitPower: 3,
    minSize: 0.2,
    maxSize: 0.7,
    manualEmitCount: count,
    gravity: [0, 0, 0],
    colorGradients: [{ timeFraction: 0, minColor: colorA, maxColor: colorB }],
    velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
    blendMode: 1,
  });
}

function everyoneNear(pos, radius, ignore) {
  let ids = api.getPlayerIds();
  try { ids = ids.concat(api.getMobIds()); } catch (e) {}
  const out = [];
  for (const id of ids) {
    if (id === ignore) continue;
    const p = api.getPosition(id);
    if (!p) continue;
    const d = dist3(pos, p);
    if (d <= radius) out.push({ id, p, d });
  }
  return out;
}

// ---- Block core ----------------------------------------------------------------
function buildCore(center) {
  const cx = Math.round(center[0]), cy = Math.round(center[1]), cz = Math.round(center[2]);
  const placed = [];
  for (const name of CORE_BLOCKS) {
    for (let dx = -CORE_BLOCK_RADIUS; dx <= CORE_BLOCK_RADIUS; dx++) {
      for (let dy = -CORE_BLOCK_RADIUS; dy <= CORE_BLOCK_RADIUS; dy++) {
        for (let dz = -CORE_BLOCK_RADIUS; dz <= CORE_BLOCK_RADIUS; dz++) {
          if (dx * dx + dy * dy + dz * dz > CORE_BLOCK_RADIUS * CORE_BLOCK_RADIUS + 1) continue;
          const x = cx + dx, y = cy + dy, z = cz + dz;
          try {
            if (api.getBlock(x, y, z) !== "Air") continue;   // never overwrite real blocks
            api.setBlock(x, y, z, name);
            placed.push([x, y, z]);
          } catch (e) {}
        }
      }
    }
    if (placed.length > 0) break;
  }
  return placed;
}

function removeCore(blocks) {
  for (const b of blocks) {
    try { api.setBlock(b[0], b[1], b[2], "Air"); } catch (e) {}
  }
}

// ---- Create a black hole ------------------------------------------------------
function openBlackHole(playerId) {
  const pos = api.getPosition(playerId);
  const dir = api.getPlayerFacingInfo(playerId).dir;
  const center = [
    pos[0] + dir[0] * HOLE_DISTANCE,
    pos[1] + 1.5 + dir[1] * HOLE_DISTANCE,
    pos[2] + dir[2] * HOLE_DISTANCE,
  ];

  holes.push({
    pos: center,
    owner: playerId,
    endsAt: api.now() + HOLE_DURATION_MS,
    nextDamage: api.now() + 1000,
    blocks: buildCore(center),
  });

  api.broadcastSound("ominousBellHit", 1, 0.5, { playerIdOrPos: center, maxHearDist: 50 });
  api.broadcastMessage(api.getEntityName(playerId) + " opened a BLACK HOLE!", { color: "#a020f0" });
}

// ---- Per-tick: pull everything in, then collapse ---------------------------------
function updateHoles() {
  const now = api.now();

  for (let i = holes.length - 1; i >= 0; i--) {
    const h = holes[i];

    // swirling purple/black disc plus a dark core
    swirl(h.pos, 3, 6, [120, 0, 200, 1], [30, 0, 60, 1]);
    swirl(h.pos, 0.6, 3, [0, 0, 0, 1], [20, 0, 40, 1]);

    const targets = everyoneNear(h.pos, PULL_RADIUS, IMMUNE_TO_OWN_HOLE ? h.owner : null);
    const doDamage = now >= h.nextDamage;

    for (const t of targets) {
      const closeness = 1 - t.d / PULL_RADIUS;                 // 0 at the edge, 1 at the core
      const len = Math.max(0.001, t.d);
      const s = PULL_STRENGTH * (0.4 + closeness);
      api.applyImpulse(
        t.id,
        ((h.pos[0] - t.p[0]) / len) * s,
        ((h.pos[1] - t.p[1]) / len) * s * 0.8,
        ((h.pos[2] - t.p[2]) / len) * s
      );

      if (doDamage && t.d <= CORE_RADIUS) {
        try {
          api.attemptApplyDamage({
            eId: h.owner,
            hitEId: t.id,
            attemptedDmgAmt: TICK_DAMAGE,
            withItem: "Black Hole",
            attackDir: [0, 0, 0],
            showCritParticles: false,
            reduceVerticalKbVelocity: false,
          });
        } catch (e) {}
      }
    }
    if (doDamage) h.nextDamage = now + 1000;

    if (now >= h.endsAt) {
      collapse(h);
      holes.splice(i, 1);
    }
  }
}

function collapse(h) {
  removeCore(h.blocks || []);
  swirl(h.pos, 5, 150, [255, 255, 255, 1], [160, 60, 255, 1]);
  api.broadcastSound("cannonFire1", 1, 0.4, { playerIdOrPos: h.pos, maxHearDist: 60 });

  for (const t of everyoneNear(h.pos, BLAST_RADIUS, IMMUNE_TO_OWN_HOLE ? h.owner : null)) {
    const falloff = 1 - t.d / BLAST_RADIUS;
    const len = Math.max(0.001, Math.sqrt((t.p[0] - h.pos[0]) ** 2 + (t.p[2] - h.pos[2]) ** 2));
    api.applyImpulse(
      t.id,
      ((t.p[0] - h.pos[0]) / len) * BLAST_FORCE * falloff,
      8 * falloff + 3,
      ((t.p[2] - h.pos[2]) / len) * BLAST_FORCE * falloff
    );
    try {
      api.attemptApplyDamage({
        eId: h.owner,
        hitEId: t.id,
        attemptedDmgAmt: Math.round(BLAST_DAMAGE * falloff) + 3,
        withItem: "Black Hole",
        attackDir: [0, 1, 0],
        showCritParticles: true,
        reduceVerticalKbVelocity: false,
      });
    } catch (e) {}
  }
}

// ---- Callbacks ---------------------------------------------------------------------
function tick() {
  updateHoles();
}

function onPlayerClick(playerId) {
  const held = api.getHeldItem(playerId);
  if (!held || held.name !== ORB_ITEM || held.attributes?.customDisplayName !== ORB_NAME) return;

  const now = api.now();
  const wait = ORB_COOLDOWN_MS - (now - (lastUse[playerId] || 0));
  if (wait > 0) {
    api.sendMessage(playerId, "Black Hole Orb: " + Math.ceil(wait / 1000) + "s", { color: "orange" });
    return;
  }
  lastUse[playerId] = now;
  openBlackHole(playerId);
}

function onPlayerChat(playerId, msg) {
  if (msg.toLowerCase().startsWith("!blackhole")) {
    api.giveItem(playerId, ORB_ITEM, 1, {
      customDisplayName: ORB_NAME,
      customDescription: "Right click: opens a black hole that sucks everything in, then explodes.",
    });
    api.sendMessage(playerId, "You got the Black Hole Orb. Right click to use it.", { color: "#a020f0" });
    return false;
  }
}
