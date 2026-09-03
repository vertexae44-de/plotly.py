// Minimal stand-in for the Bloxd `api` object so smp.js can be exercised in Node.
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "smp.js"), "utf8");

const world = {
    db: {}, lobbyDb: {}, opts: {}, health: {}, shield: {}, inv: {}, sel: {}, pos: {},
    drops: [], log: [], impulses: [], effects: [], kicks: [], recipes: {},
    names: { a: "Alice", b: "Bob" }, dbIds: { a: "db-a", b: "db-b" },
    mobs: [], facing: [0, 0, 1],
};
const ids = ["a", "b"];

const api = {
    getPlayerIds: () => ids,
    getMobIds: () => world.mobs,
    getEntityName: id => world.names[id],
    getPlayerDbId: id => world.dbIds[id],
    getPosition: id => world.pos[id] || [0, 64, 0],
    getHealth: id => world.health[id] ?? 100,
    setHealth: (id, hp) => { world.health[id] = hp; },
    getShieldAmount: id => world.shield[id] ?? 0,
    setShieldAmount: (id, v) => { world.shield[id] = v; },
    applyEffect: (id, name, ms) => world.effects.push({ id, name, ms }),

    getPlayerDbValue: (id, k) => (world.db[id] || {})[k] ?? null,
    setPlayerDbValue: (id, k, v) => { (world.db[id] = world.db[id] || {})[k] = v; },
    getLobbyDbValue: k => world.lobbyDb[k] ?? null,
    setLobbyDbValue: (k, v) => { world.lobbyDb[k] = v; },
    deleteLobbyDbValue: k => { delete world.lobbyDb[k]; },

    setClientOption: (id, o, v) => { (world.opts[id] = world.opts[id] || {})[o] = v; },
    editItemCraftingRecipes: (id, item, recipes) => { (world.recipes[id] = world.recipes[id] || {})[item] = recipes; },

    getSelectedInventorySlotI: id => world.sel[id] ?? 0,
    getItemSlot: (id, i) => (world.inv[id] || [])[i] || null,
    setItemSlot: (id, i, name, amt, attrs) => {
        world.inv[id] = world.inv[id] || [];
        world.inv[id][i] = name === "Air" ? null : { name, amount: amt, attributes: attrs };
    },
    giveItem: (id, name, amt, attrs) => {
        (world.inv[id] = world.inv[id] || []).push({ name, amount: amt, attributes: attrs });
        return amt;
    },
    getInventoryItemAmount: (id, name) =>
        (world.inv[id] || []).reduce((n, s) => n + (s && s.name === name ? (s.amount == null ? 1 : s.amount) : 0), 0),
    findItem: (id, name) => {
        const i = (world.inv[id] || []).findIndex(s => s && s.name === name);
        return i === -1 ? null : i;
    },

    createItemDrop: (x, y, z, name, amt, merge, attrs) => {
        world.drops.push({ name, attrs });
        return "drop" + world.drops.length;
    },
    applyImpulse: (id, x, y, z) => world.impulses.push([id, x, y, z]),
    preventFallDamageNextGrounding: () => {},
    getPlayerFacingInfo: () => ({ dir: world.facing }),

    kickPlayer: (id, reason) => world.kicks.push({ id, reason }),
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
// `const` declarations do not land on the context object, so pull them out by name.
const durabilityCache = vm.runInContext("durabilityCache", ctx);

module.exports = { ctx, world, api, CONFIG, durabilityCache };
