const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(require("path").join(__dirname, "..", "smp.js"), "utf8");

const world = { db: {}, opts: {}, health: {}, inv: {}, pos: {}, drops: [], log: [], impulses: [], names: {a:"Alice",b:"Bob"} };
const ids = ["a", "b"];
const api = {
  getPlayerIds: () => ids,
  getEntityName: id => world.names[id],
  getPosition: id => world.pos[id] || [0, 64, 0],
  getHealth: id => world.health[id] ?? 100,
  setHealth: (id, hp) => { world.health[id] = hp; },
  getPlayerDbValue: (id, k) => (world.db[id] || {})[k] ?? null,
  setPlayerDbValue: (id, k, v) => { (world.db[id] = world.db[id] || {})[k] = v; },
  setClientOption: (id, o, v) => { (world.opts[id] = world.opts[id] || {})[o] = v; },
  getSelectedInventorySlotI: id => world.sel?.[id] ?? 0,
  getItemSlot: (id, i) => (world.inv[id] || [])[i] || null,
  getInventoryItemAmount: (id, name) => (world.inv[id] || []).reduce((n, s) => n + (s && s.name === name ? (s.amount == null ? 1 : s.amount) : 0), 0),
  findItem: (id, name) => { const i = (world.inv[id] || []).findIndex(s => s && s.name === name); return i === -1 ? null : i; },
  setItemSlot: (id, i, name, amt, attrs) => {
    world.inv[id] = world.inv[id] || [];
    world.inv[id][i] = name === "Air" ? null : { name, amount: amt, attributes: attrs };
  },
  giveItem: (id, name, amt, attrs) => { (world.inv[id] = world.inv[id] || []).push({ name, amount: amt, attributes: attrs }); return amt; },
  createItemDrop: (x, y, z, name, amt, merge, attrs) => { world.drops.push({ name, attrs }); return "drop" + world.drops.length; },
  applyImpulse: (id, x, y, z) => world.impulses.push([id, x, y, z]),
  preventFallDamageNextGrounding: () => {},
  sendMessage: (id, m) => world.log.push(`msg[${id}] ${m}`),
  broadcastMessage: m => world.log.push(`bcast ${m}`),
  sendFlyingMiddleMessage: (id, m) => world.log.push(`fly[${id}] ${m}`),
  queueCrosshairText: (id, t) => world.log.push(`cross[${id}] ${t}`),
  playSound: () => {}, broadcastSound: () => {}, playParticleEffect: () => {},
  shakePlayerCamera: () => {}, now: () => Date.now(),
};

const ctx = vm.createContext({ api, console, Math, Object, String, Number, parseInt, parseFloat, isNaN, JSON });
vm.runInContext(src, ctx);
const CONFIG = vm.runInContext("CONFIG", ctx);
module.exports = { ctx, world, api, CONFIG };
