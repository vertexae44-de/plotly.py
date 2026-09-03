const { ctx, world, CONFIG: C, durabilityCache, genDone, genQueue, npcRoster } = require("./harness.js");
let fails = 0;
const check = (label, cond, extra) => {
    console.log((cond ? "PASS " : "FAIL ") + label + (cond ? "" : "  <- " + extra));
    if (!cond) fails++;
};
const maceItem = () => ({ name: C.mace.item, amount: null, attributes: ctx.maceAttributes(C.mace.durability) });
const spearItem = () => ({ name: C.spear.item, amount: null, attributes: ctx.spearAttributes(C.spear.durability) });

// ---------------------------------------------------------------- join & setup
ctx.onPlayerJoin("a"); ctx.onPlayerJoin("b");
check("join sets maxHealth option", world.opts.a.maxHealth === 100, JSON.stringify(world.opts.a));
check("mace recipe registered", !!world.recipes.a[C.mace.item], Object.keys(world.recipes.a));
check("spear recipe registered", !!world.recipes.a[C.spear.item], "");
check("two apple recipes registered", world.recipes.a["Apple"].length === 2, "");
check("mace is the real Moonstone Mace item", C.mace.item === "Moonstone Mace", C.mace.item);
check("mace recipe costs 40 moonstone",
    C.mace.recipe.some(r => r.items[0] === "Moonstone" && r.amt === 40), JSON.stringify(C.mace.recipe));
check("mace recipe costs 4 knight hearts",
    C.mace.recipe.some(r => r.items[0] === "Knight Heart" && r.amt === 4), "");
check("mace recipe costs 2 sticks",
    C.mace.recipe.some(r => r.items[0] === "Stick" && r.amt === 2), "");
check("mace durability derives from its name",
    ctx.durabilityForName("Moonstone Mace") === Math.round(2400 * 1.1),
    ctx.durabilityForName("Moonstone Mace"));
check("mace recipe carries mace tag",
    world.recipes.a[C.mace.item][0].attributes.customAttributes.smpMace === true, "");
check("golden apple recipe carries tier",
    world.recipes.a["Apple"][0].attributes.customAttributes.smpApple === "golden", "");
check("enchanted apple recipe carries tier",
    world.recipes.a["Apple"][1].attributes.customAttributes.smpApple === "enchanted", "");

// ------------------------------------------------------------------ orb drops
world.health.a = 100;
ctx.onAttemptKillPlayer("a", "b");
check("victim lost 10 hp", world.db.a.smpMaxHp === 90, world.db.a.smpMaxHp);
check("one orb dropped", world.drops.length === 1, world.drops.length);
check("orb carries hp", world.drops[0].attrs.customAttributes.hp === 10, "");
const beforeWorldDeath = world.db.a.smpMaxHp;
ctx.onAttemptKillPlayer("a", null);
check("world death costs nothing", world.db.a.smpMaxHp === beforeWorldDeath, world.db.a.smpMaxHp);

// ------------------------------------------------------------------ eating orbs
world.sel = { a: 0, b: 0 };
world.inv.a = [{ name: C.orb.item, amount: 2, attributes: world.drops[0].attrs }];
world.health.a = 50;
ctx.onPlayerAltAction("a");
check("orb raised max hp", world.db.a.smpMaxHp === 100, world.db.a.smpMaxHp);
check("orb healed current hp", world.health.a === 60, world.health.a);
check("orb stack decremented", world.inv.a[0].amount === 1, "");

check("orb is the XP orb item", C.orb.item === "Aura XP Orb", C.orb.item);
check("eating recorded one use", world.db.a.smpOrbsEaten === 1, world.db.a.smpOrbsEaten);
check("no uses left after the first", ctx.orbUsesLeft("a") === 0, ctx.orbUsesLeft("a"));

// the lifetime cap: a second orb must not be absorbed or consumed
const hpBeforeSecond = world.db.a.smpMaxHp;
ctx.onPlayerAltAction("a");
check("second orb is refused", world.db.a.smpMaxHp === hpBeforeSecond, world.db.a.smpMaxHp);
check("refused orb stays in the inventory", world.inv.a[0] && world.inv.a[0].amount === 1, JSON.stringify(world.inv.a[0]));
check("refusal explains the limit", world.log.some(l => /only absorb/.test(l)), "");

// a fresh player may still absorb theirs
world.inv.b = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
world.db.b.smpMaxHp = 90;
world.health.b = 50;
ctx.onPlayerAltAction("b");
check("a different player can still absorb", world.db.b.smpMaxHp === 100, world.db.b.smpMaxHp);
check("orb grants exactly one heart", 100 - 90 === C.orb.hp, C.orb.hp);
check("absorbed orb clears the slot", world.inv.b[0] === null, "");

// raising the cap re-opens it
C.orb.usesPerPlayer = 2;
check("raising the cap gives another use", ctx.orbUsesLeft("a") === 1, ctx.orbUsesLeft("a"));
ctx.onPlayerAltAction("a");
check("second orb now absorbed", world.db.a.smpMaxHp === hpBeforeSecond + C.orb.hp, world.db.a.smpMaxHp);
C.orb.usesPerPlayer = 1;

world.db.a.smpMaxHp = C.health.max;
world.db.a.smpOrbsEaten = 0;
world.inv.a = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
ctx.onPlayerAltAction("a");
check("at cap -> orb not consumed", world.inv.a[0] && world.inv.a[0].amount === 1, "");
check("at cap -> no use spent", world.db.a.smpOrbsEaten === 0, world.db.a.smpOrbsEaten);
world.db.a.smpMaxHp = 90;
ctx.onPlayerAltAction("a");
check("last orb clears slot", world.inv.a[0] === null, "");

// -------------------------------------------------------------- golden apples
world.db.a.smpMaxHp = 100;
world.health.a = 20;
world.shield.a = 0;
world.effects.length = 0;
world.inv.a = [{ name: "Apple", amount: 3, attributes: ctx.appleAttributes("golden") }];
ctx.onPlayerAltAction("a");
check("golden apple heals", world.health.a === 60, world.health.a);
check("golden apple gives shield", world.shield.a === C.apples.golden.shield, world.shield.a);
check("golden apple applies regen", world.effects.some(e => e.name === "Health Regen"), "");
check("golden apple applies fire resistance",
    world.effects.some(e => e.name === "Heat Resistance" && e.ms === C.apples.golden.heatResistMs),
    JSON.stringify(world.effects));
check("golden apple consumed one", world.inv.a[0].amount === 2, "");
check("golden apple does not raise max hp", world.db.a.smpMaxHp === 100, world.db.a.smpMaxHp);

world.health.a = 10;
world.inv.a = [{ name: "Apple", amount: 1, attributes: ctx.appleAttributes("enchanted") }];
ctx.onPlayerAltAction("a");
check("enchanted apple raises max hp", world.db.a.smpMaxHp === 110, world.db.a.smpMaxHp);
check("enchanted apple heals to cap", world.health.a === 110, world.health.a);
check("enchanted apple clears slot", world.inv.a[0] === null, "");
check("enchanted apple gives longer fire resistance",
    world.effects.some(e => e.name === "Heat Resistance" && e.ms === C.apples.enchanted.heatResistMs),
    JSON.stringify(world.effects));
check("apple tooltip mentions both effects", (() => {
    const desc = ctx.appleAttributes("enchanted").customDescription;
    return /Health Regen/.test(desc) && /[Ff]ire resistance/.test(desc);
})(), ctx.appleAttributes("enchanted").customDescription);

// a plain apple is not edible as a gapple
world.health.a = 50;
world.inv.a = [{ name: "Apple", amount: 5, attributes: undefined }];
ctx.onPlayerAltAction("a");
check("plain apple untouched", world.inv.a[0].amount === 5 && world.health.a === 50, "");

// ------------------------------------------------------------------ mace smash
world.inv.a = [maceItem()];
let dmg = ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
check("grounded mace hit keeps base damage", dmg === 20, dmg);
check("mace lost 1 durability",
    world.inv.a[0].attributes.customAttributes.smpDur === C.mace.durability - 1, "");

world.pos.a = [0, 70, 0]; ctx.tick();
world.pos.a = [0, 64, 0]; ctx.tick();          // fell 6 blocks
world.impulses.length = 0;
dmg = ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
const expected = Math.round(20 + Math.min(C.mace.maxSmashDamage, 6 * C.mace.damagePerBlockFallen)
    + C.mace.densityLevel * C.mace.densityPerLevel * 6);
check("smash adds fall + density damage", dmg === expected, dmg + " vs " + expected);
const lift = world.impulses.find(i => i[0] === "a");
check("wind burst launches attacker",
    lift && lift[2] === C.mace.windBurstLevel * C.mace.windBurstPerLevel, JSON.stringify(world.impulses));

// same smash against a mob
world.mobs = ["m1"];
world.pos.m1 = [0, 64, 0];
world.pos.a = [0, 71, 0]; ctx.tick();
world.pos.a = [0, 65, 0]; ctx.tick();          // fell 6 blocks again
world.impulses.length = 0;
dmg = ctx.onPlayerDamagingMob("a", "m1", 20);
check("mace smashes mobs too", dmg === expected, dmg + " vs " + expected);
check("wind burst fires on a mob hit",
    world.impulses.some(i => i[0] === "a" && i[2] === C.mace.windBurstLevel * C.mace.windBurstPerLevel),
    JSON.stringify(world.impulses));

// splash knockback reaches nearby mobs
world.mobs = ["m2"];
world.pos.m2 = [1, 64, 0];
world.pos.b = [0, 64, 0];
world.pos.a = [0, 72, 0]; ctx.tick();
world.pos.a = [0, 66, 0]; ctx.tick();
world.impulses.length = 0;
ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
check("nearby mob is knocked back", world.impulses.some(i => i[0] === "m2"), JSON.stringify(world.impulses));
world.mobs = [];

// wind charge on right click, then cooldown
world.impulses.length = 0;
ctx.onPlayerAltAction("a");
check("wind charge impulse", world.impulses.length === 1 && world.impulses[0][2] === C.mace.chargeUpwardImpulse, "");
ctx.onPlayerAltAction("a");
check("wind charge on cooldown", world.impulses.length === 1, "");

// ----------------------------------------------------------------- spear lunge
world.inv.a = [spearItem()];
world.facing = [1, 0, 0];
world.impulses.length = 0;
ctx.onPlayerAltAction("a");
check("lunge pushes along facing",
    world.impulses.length === 1 && world.impulses[0][1] === C.spear.lungeForce, JSON.stringify(world.impulses));
dmg = ctx.onPlayerDamagingOtherPlayer("a", "b", 15);
check("lunging spear hit adds bonus", dmg === 15 + C.spear.lungeBonusDamage, dmg);
dmg = ctx.onPlayerDamagingOtherPlayer("a", "b", 15);
check("bonus only lands once per lunge", dmg === undefined, dmg);

// ------------------------------------------------------------------ durability
world.inv.a = [{ name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 1, smpDurMax: 250 } } }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Stone", "Air");
check("tool breaks at 0 durability", world.inv.a[0] === null, "");
check("break message sent", world.log.some(l => l.startsWith("fly[a]")), "");

world.inv.a = [{ name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 50, smpDurMax: 250 } } }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Air", "Stone");
check("placing costs no durability", world.inv.a[0].attributes.customAttributes.smpDur === 50, "");

world.inv.a = [{ name: "Dirt", amount: 10, attributes: undefined }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Stone", "Air");
check("untracked item unaffected", world.inv.a[0].name === "Dirt" && world.inv.a[0].amount === 10, "");

// ------------------------------------------------- durability derived from name
const durOf = n => ctx.durabilityForName(n);
check("diamond pickaxe uses material table", durOf("Diamond Pickaxe") === 1560, durOf("Diamond Pickaxe"));
check("moonstone is not read as stone", durOf("Moonstone Axe") === 2400, durOf("Moonstone Axe"));
check("stone tools still work", durOf("Stone Sword") === 130, durOf("Stone Sword"));
check("kind multiplier applies to armour",
    durOf("Iron Chestplate") === Math.round(250 * 1.3), durOf("Iron Chestplate"));
check("coloured wood gear gets wood tier",
    durOf("Black Wood Bow") === Math.round(60 * 1.2), durOf("Black Wood Bow"));
check("unknown material falls back to default",
    durOf("Draugr Sword") === C.durability.defaultMaterialUses, durOf("Draugr Sword"));
check("non-gear has no durability", durOf("Dirt") === 0 && durOf("Apple") === 0, "");
check("gold hang glider is not gear", durOf("Gold Hang Glider") === 0, durOf("Gold Hang Glider"));

// an item that was never in the old hardcoded list now wears out
world.inv.a = [{ name: "Diamond Dagger", amount: null, attributes: undefined }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Stone", "Air");
check("previously untracked weapon now wears",
    world.inv.a[0].attributes.customAttributes.smpDur === Math.round(1560 * 0.9) - 1,
    JSON.stringify(world.inv.a[0].attributes.customAttributes));

// overrides win, and 0 means unbreakable
C.durability.overrides["Iron Sword"] = 0;
delete durabilityCache["Iron Sword"];
world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
ctx.onPlayerDamagingOtherPlayer("a", "b", 10);
check("override of 0 makes an item unbreakable", world.inv.a[0].attributes === undefined, "");
delete C.durability.overrides["Iron Sword"];
delete durabilityCache["Iron Sword"];

// ------------------------------------------------------- exile to the Void at 0
const VOID = C.dimensions.list["void"];
world.drops.length = 0;
world.kicks.length = 0;
world.log.length = 0;
world.pos.b = [40, 64, 40];
world.db.b.smpMaxHp = C.death.hpLostToPlayer;      // exactly one death left
ctx.onAttemptKillPlayer("b", "a");
check("0 hearts exiles rather than kicks", world.kicks.length === 0, JSON.stringify(world.kicks));
check("exile moves you to the Void", ctx.dimensionAt(world.pos.b) === "void", world.pos.b);
check("exile is announced", world.log.some(l => /Void/.test(l)), "");
check("exile still drops orbs", world.drops.length > 0, world.drops.length);
check("you can still move while exiled", world.db.b.smpMaxHp === C.ban.voidHearts, world.db.b.smpMaxHp);

// dying in the Void must not strand you deeper
const voidHp = world.db.b.smpMaxHp;
ctx.onAttemptKillPlayer("b", "a");
check("dying in the Void costs nothing", world.db.b.smpMaxHp === voidHp, world.db.b.smpMaxHp);

// resurrection needs the full price
world.inv.b = [{ name: C.resurrection.item, amount: C.resurrection.required - 1, attributes: undefined }];
check("too few orbs will not free you", ctx.checkResurrection("b") === false, "");
check("partial orbs are not consumed",
    world.inv.b[0].amount === C.resurrection.required - 1, JSON.stringify(world.inv.b));
check("still in the Void", ctx.dimensionAt(world.pos.b) === "void", "");

world.inv.b = [{ name: C.resurrection.item, amount: C.resurrection.required + 1, attributes: undefined }];
world.log.length = 0;
check("enough orbs frees you", ctx.checkResurrection("b") === true, "");
check("resurrection returns you to the overworld", ctx.dimensionAt(world.pos.b) === "overworld", world.pos.b);
check("orbs are spent, change given back",
    world.inv.b[0] && world.inv.b[0].amount === 1, JSON.stringify(world.inv.b));
check("you come back with hearts", world.db.b.smpMaxHp === C.resurrection.heartsOnReturn, world.db.b.smpMaxHp);
check("resurrection is announced", world.log.some(l => /Void/.test(l)), "");

// the Void generates platforms and orbs to mine
world.blocks = {};
let orbCount = 0, solidCount = 0;
for (let i = 0; i < 4000; i++) {
    world.blocks = {};
    ctx.buildVoidColumn(0, 0, (i % 80) - 40, ((i / 80) | 0) - 25);
    const vals = Object.keys(world.blocks).map(k => world.blocks[k]);
    if (vals.length) solidCount++;
    if (vals.indexOf(C.dimensions.generation["void"].blocks.orb) !== -1) orbCount++;
}
check("the Void has platforms to stand on", solidCount > 0, solidCount);
check("the Void is mostly empty", solidCount < 4000 * 0.5, solidCount);
check("resurrection orbs spawn in the Void", orbCount > 0, orbCount);
check("orbs are rare", orbCount < solidCount * 0.2, orbCount + " of " + solidCount);
check("the Void has no portal out", VOID.portalBlock === undefined, VOID.portalBlock);

// kick mode still works for anyone who prefers a hard ban
C.ban.mode = "kick";
world.kicks.length = 0;
world.pos.b = [50, 64, 50];
world.db.b.smpMaxHp = C.death.hpLostToPlayer;
ctx.onAttemptKillPlayer("b", "a");
check("kick mode still bans", world.kicks.some(k => k.id === "b"), JSON.stringify(world.kicks));
check("ban recorded by account id", JSON.parse(world.lobbyDb.smpBans)["db-b"] === "Bob", world.lobbyDb.smpBans);
world.kicks.length = 0;
ctx.onPlayerJoin("b");
check("banned player kicked on join", world.kicks.length === 1, JSON.stringify(world.kicks));

C.commands.adminNames.push("Alice");
check("/bans lists the ban", ctx.playerCommand("a", "/bans") === true, "");
check("/unban handled", ctx.playerCommand("a", "/unban Bob") === true, "");
check("ban removed", JSON.parse(world.lobbyDb.smpBans)["db-b"] === undefined, world.lobbyDb.smpBans);
world.kicks.length = 0;
world.db.b.smpMaxHp = 100;
ctx.onPlayerJoin("b");
check("unbanned player may rejoin", world.kicks.length === 0, JSON.stringify(world.kicks));

world.lobbyDb.smpBans = "{not json";
world.kicks.length = 0;
ctx.onPlayerJoin("b");
check("corrupt ban list is ignored", world.kicks.length === 0, JSON.stringify(world.kicks));
world.lobbyDb.smpBans = "{}";
C.ban.mode = "void";
C.commands.adminNames.length = 0;

// ------------------------------------------------------------ durability bar
const bar = ctx.durabilityBar(280, 400);
check("durability bar shows numbers", /280 \/ 400/.test(bar), bar);
check("durability bar shows a percentage", /\(70%\)/.test(bar), bar);
check("durability bar is 12 segments",
    (bar.match(/[\u25B0\u25B1]/g) || []).length === 12, bar);
check("a full bar is all filled", (ctx.durabilityBar(400, 400).match(/\u25B0/g) || []).length === 12, "");
check("a near-empty bar is nearly empty", (ctx.durabilityBar(1, 400).match(/\u25B0/g) || []).length === 0, "");
check("the mace tooltip uses the bar", /\u25B0/.test(ctx.maceAttributes(200).customDescription), "");

// ------------------------------------------------------------- terrain generation
const NDIM = C.dimensions.list.nether, EDIM = C.dimensions.list.end, GEN = C.dimensions.generation;
check("noise is deterministic",
    ctx.noise2(12, 34, 26, 7) === ctx.noise2(12, 34, 26, 7), "");
check("noise stays in 0..1", (() => {
    for (let i = 0; i < 500; i++) {
        const n = ctx.noise2(i * 7, i * 13, 26, 3);
        if (n < 0 || n > 1) return false;
    }
    return true;
})(), "");
check("different seeds give different terrain",
    ctx.noise2(12, 34, 26, 1) !== ctx.noise2(12, 34, 26, 2), "");

// run a player around the nether until the first chunk finishes
world.blocks = {}; world.rects.length = 0;
world.pos.a = [NDIM.origin[0], 60, NDIM.origin[1]];
ctx.stateOf("a").dimension = null;
ctx.stateOf("a").lastGenChunk = null;
let genTicks = 0;
while (genTicks < 3000 && world.blocks[NDIM.origin[0] + ",0," + NDIM.origin[1]] !== GEN.markerBlock) {
    ctx.tick();
    genTicks++;
}
const nAt = y => world.blocks[NDIM.origin[0] + "," + y + "," + NDIM.origin[1]];
check("nether chunk generates", genTicks < 3000, genTicks + " ticks");
check("nether has a bedrock floor", nAt(GEN.nether.floorY) === GEN.nether.blocks.floor, nAt(GEN.nether.floorY));
check("nether has a ceiling", nAt(GEN.nether.ceilingY) === GEN.nether.blocks.ceiling, nAt(GEN.nether.ceilingY));
check("nether has a lava sea", nAt(GEN.nether.lavaLevel) === GEN.nether.blocks.liquid, nAt(GEN.nether.lavaLevel));
check("chunk is marked generated", ctx.chunkGenerated("nether", Math.floor(NDIM.origin[0] / GEN.chunkSize), Math.floor(NDIM.origin[1] / GEN.chunkSize)), "");
const netherSets = world.sets;
ctx.tick();
check("a generated chunk is never rebuilt", world.sets === netherSets, world.sets + " vs " + netherSets);

// the end builds islands over void
world.blocks = {};
world.pos.a = [EDIM.origin[0], 60, EDIM.origin[1]];
ctx.stateOf("a").dimension = null;
ctx.stateOf("a").lastGenChunk = null;
let endTicks = 0;
while (endTicks < 3000 && world.blocks[EDIM.origin[0] + ",0," + EDIM.origin[1]] !== GEN.markerBlock) {
    ctx.tick();
    endTicks++;
}
check("end chunk generates", endTicks < 3000, endTicks + " ticks");
const endSolid = Object.keys(world.blocks).filter(k => world.blocks[k] === GEN.end.blocks.base).length;
check("end has island blocks", endSolid > 0, endSolid);
// Voidness is asserted per column below; a whole 5x5 of chunks is generated here.
check("end arrival point is solid ground",
    ctx.buildEndColumn === undefined || (() => {
        world.blocks = {};
        ctx.buildEndColumn(EDIM.origin[0], EDIM.origin[1], 0, 0);
        return Object.keys(world.blocks).length > 0;
    })(), "centre island missing");
check("far end columns can still be void", (() => {
    world.blocks = {};
    let anyVoid = false;
    for (let i = 1; i < 60 && !anyVoid; i++) {
        world.blocks = {};
        ctx.buildEndColumn(0, 0, i * 37, i * 53);
        if (Object.keys(world.blocks).length === 0) anyVoid = true;
    }
    return anyVoid;
})(), "every column was solid");
check("overworld chunks are never queued", (() => {
    world.pos.a = [0, 64, 0];
    ctx.stateOf("a").lastGenChunk = null;
    ctx.queueChunksAround("overworld", [0, 64, 0]);
    for (let i = 0; i < 200; i++) ctx.tick();
    return !Object.keys(genDone).some(k => k.indexOf("overworld:") === 0);
})(), Object.keys(genDone).join(" "));

// ------------------------------------------------------------------ dimension look
check("nether fog is red", /^#[6-9a-f]/.test(NDIM.clientOptions.fogColourOverride), NDIM.clientOptions.fogColourOverride);
check("end fog is purple", EDIM.clientOptions.fogColourOverride === "#2e0f52", EDIM.clientOptions.fogColourOverride);

// ------------------------------------------------------------------- crystal pvp
world.damages.length = 0;
world.impulses.length = 0;
world.pos.a = [0, 64, 0];
world.pos.b = [2, 64, 0];
ctx.onPlayerChangeBlock("a", 0, 64, 0, C.crystal.block, "Air");
check("crystal explodes on break", world.damages.length > 0, world.damages.length);
check("nearby player takes damage", world.damages.some(d => d.hitEId === "b"), JSON.stringify(world.damages));
check("crystal knocks players back", world.impulses.some(i => i[0] === "b"), "");
const selfHit = world.damages.find(d => d.hitEId === "a");
const otherHit = world.damages.find(d => d.hitEId === "b");
check("your own crystal hurts you less",
    selfHit && otherHit && selfHit.attemptedDmgAmt < C.crystal.damage * C.crystal.selfDamageFraction + 1,
    JSON.stringify(selfHit));
check("damage is credited to the breaker", world.damages.every(d => d.eId === "a"), "");

world.damages.length = 0;
world.pos.b = [C.crystal.radius + 5, 64, 0];
ctx.onPlayerChangeBlock("a", 0, 64, 0, C.crystal.block, "Air");
check("players outside the radius are safe", !world.damages.some(d => d.hitEId === "b"), JSON.stringify(world.damages));
world.rects.length = 0;
ctx.onPlayerChangeBlock("a", 0, 64, 0, C.crystal.block, "Air");
check("crystals do not crater by default", !world.rects.some(r => r.name === "Air"), JSON.stringify(world.rects));
world.damages.length = 0;
ctx.onPlayerChangeBlock("a", 0, 64, 0, "Stone", "Air");
check("an ordinary block does not explode", world.damages.length === 0, "");
check("crystal is craftable", !!world.recipes.a[C.crystal.block], Object.keys(world.recipes.a));

// ---------------------------------------------------------------------- cart pvp
world.pos.a = [0, 64, 0]; world.pos.b = [1, 64, 0];
world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
ctx.onPlayerExitedVehicle("b");
let plain = ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
check("no cart bonus on foot", plain === undefined, plain);
ctx.onPlayerEnteredVehicle("b", "Boat", "v1");
world.impulses.length = 0;
const inCart = ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
check("hitting someone in a boat adds damage", inCart === 20 + C.cart.bonusDamage, inCart);
check("hitting them in a boat ejects them", world.impulses.some(i => i[0] === "b"), "");
ctx.onPlayerExitedVehicle("b");
check("leaving the boat drops the bonus", ctx.onPlayerDamagingOtherPlayer("a", "b", 20) === undefined, "");

// ------------------------------------------------------------------- anonymous
world.log.length = 0;
check("!anon is swallowed", ctx.onPlayerChat("a", "!anon", "global") === false, "");
check("anon flag persisted", world.db.a.smpAnon === 1, world.db.a.smpAnon);
check("nametag replaced",
    world.entitySettings.a.nameTagInfo
        && world.entitySettings.a.nameTagInfo.content[0].str === C.anonymous.displayName,
    JSON.stringify(world.entitySettings.a));
world.log.length = 0;
check("anon chat is suppressed", ctx.onPlayerChat("a", "hello there", "global") === false, "");
check("anon chat is rebroadcast without the name",
    world.log.some(l => l.indexOf("bcast " + C.anonymous.displayName + ": hello there") === 0), JSON.stringify(world.log));
check("anon chat never leaks the real name", !world.log.some(l => /Alice/.test(l)), JSON.stringify(world.log));
check("a normal player's chat is untouched", ctx.onPlayerChat("b", "hi", "global") === undefined, "");
check("!anon toggles back off", ctx.onPlayerChat("a", "!anon", "global") === false, "");
check("anon flag cleared", world.db.a.smpAnon === 0, world.db.a.smpAnon);
check("nametag restored", world.entitySettings.a.nameTagInfo === null, JSON.stringify(world.entitySettings.a));
check("chat is normal again", ctx.onPlayerChat("a", "hello", "global") === undefined, "");
// the killfeed leak: the engine prints real names, so it is switched off instead
ctx.onPlayerChat("a", "!anon", "global");
check("killfeed hidden while someone is anonymous",
    world.opts.a.showKillfeed === false && world.opts.b.showKillfeed === false,
    JSON.stringify([world.opts.a.showKillfeed, world.opts.b.showKillfeed]));
world.log.length = 0;
ctx.onPlayerKilledOtherPlayer("a", "b", 20, "Iron Sword");
check("anon kills are announced in chat", world.log.some(l => /killed/.test(l)), JSON.stringify(world.log));
check("the killer's real name never appears", !world.log.some(l => /Alice/.test(l)), JSON.stringify(world.log));
check("the victim's real name still shows",
    world.log.some(l => /Bob/.test(l)), JSON.stringify(world.log));
ctx.onPlayerChat("a", "!anon", "global");
check("killfeed restored once nobody is anonymous",
    world.opts.a.showKillfeed === "DEFAULT", world.opts.a.showKillfeed);
world.log.length = 0;
ctx.onPlayerKilledOtherPlayer("a", "b", 20, "Iron Sword");
check("no double announcement with the killfeed back on", world.log.length === 0, JSON.stringify(world.log));

// anonymity must survive a relog
world.db.a.smpAnon = 1;
world.entitySettings.a.nameTagInfo = null;
ctx.onPlayerJoin("a");
check("anon survives a rejoin",
    world.entitySettings.a.nameTagInfo
        && world.entitySettings.a.nameTagInfo.content[0].str === C.anonymous.displayName, "");
world.db.a.smpAnon = 0;
ctx.onPlayerJoin("a");

// -------------------------------------------------------------------------- NPCs
const N = C.npcs;
world.pos.a = [900, 64, 900];   // players far away so nobody is "noticed" yet
world.pos.b = [900, 64, 900];
for (let i = 0; i < N.thinkEveryTicks * 2; i++) ctx.tick();
check("a roster is built once", npcRoster.length === N.count, npcRoster.length);

// Send them all back to the respawn queue so the spawn path is observed fresh.
world.spawnedMobs.length = 0;
npcRoster.forEach(x => { x.mobId = null; x.deadUntil = 0; });
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("every NPC gets a body", world.spawnedMobs.length === N.count, world.spawnedMobs.length);
check("every NPC holds its body", npcRoster.every(x => x.mobId !== null), "");
check("NPCs have unique names",
    new Set(npcRoster.map(n => n.name)).size === N.count, npcRoster.map(n => n.name).join(","));
check("NPCs get nametags", world.spawnedMobs.every(m => !!m.opts.name), JSON.stringify(world.spawnedMobs[0]));
check("NPCs use clothed humanoid bodies",
    world.spawnedMobs.every(m => /Draugr/.test(m.type)), world.spawnedMobs.map(m => m.type).join(","));
check("NPCs are not hostile on sight",
    world.mobSettings[npcRoster[0].mobId].hostilityRadius === 0, "");
check("NPC homes are spread out",
    new Set(npcRoster.map(n => n.home[0].toFixed(2))).size > 1, "");

const npc = npcRoster[0];
const body = npc.mobId;
world.pos[body] = [0, 64, 0];

// they notice someone walking up, and greet them once
world.log.length = 0;
world.pos.a = [2, 64, 0];
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("an NPC watches a nearby player",
    world.mobAi[body] && world.mobAi[body].state === "watching", JSON.stringify(world.mobAi[body]));
check("an NPC greets you", world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));
world.log.length = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("greetings are not spammed", !world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));

// hit one and it fights back
world.log.length = 0;
world.inv.a = [];
npc.lastChat = 0;          // the anti-spam gate is tested separately below
ctx.onPlayerDamagingMob("a", body, 10);
check("hitting an NPC provokes it", npc.provokedBy === "a", npc.provokedBy);
check("a hurt NPC says something", world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a provoked NPC chases you",
    world.mobAi[body].state === "chasing" && world.mobAi[body].params.targetId === "a",
    JSON.stringify(world.mobAi[body]));

// the same NPC hit twice in a row does not narrate every blow
world.log.length = 0;
ctx.onPlayerDamagingMob("a", body, 10);
check("hurt lines are rate limited", !world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));

// hurt it badly and it runs
world.health[body] = C.npcs.settings.maxHealth * 0.1;
npc.lastChat = 0;
world.log.length = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a losing NPC runs away",
    world.mobAi[body].state === "runningAway", JSON.stringify(world.mobAi[body]));
check("a fleeing NPC says so", world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), "");

// kill it: it announces, frees the body and books a respawn
world.log.length = 0;
world.drops.length = 0;
ctx.onPlayerKilledMob("a", body);
check("a killed NPC is announced", world.log.some(l => /was killed by/.test(l)), JSON.stringify(world.log));
check("a killed NPC leaves its body behind", npc.mobId === null, npc.mobId);
check("a killed NPC books a respawn", npc.deadUntil > 0, npc.deadUntil);
check("NPCs drop no Life Orb by default", world.drops.length === 0, world.drops.length);

// it comes back once the timer is up
npc.deadUntil = 0;
world.pos.a = [900, 64, 900];
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a dead NPC respawns", npc.mobId !== null, npc.mobId);

// a full world just delays them rather than breaking anything
const npc2 = npcRoster[1];
ctx.onPlayerKilledMob("a", npc2.mobId);
npc2.deadUntil = 0;
world.mobSpawnFails = true;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a full world only delays a respawn", npc2.mobId === null && npc2.deadUntil > 0, npc2.deadUntil);
world.mobSpawnFails = false;

check("/npcs lists them", ctx.playerCommand("a", "/npcs") === true, "");
check("a normal mob is not an NPC", (() => {
    const before = world.log.length;
    ctx.onPlayerDamagingMob("a", "not-an-npc", 5);
    ctx.onPlayerKilledMob("a", "not-an-npc");
    return world.log.length === before;
})(), "");

// -------------------------------------------------------------------- commands
world.inv.a = [];
check("/hp handled", ctx.playerCommand("a", "/hp") === true, "");
world.db.a.smpMaxHp = 100;
check("/withdraw handled", ctx.playerCommand("a", "withdraw 2") === true, "");
check("withdraw removed 20 hp", world.db.a.smpMaxHp === 80, world.db.a.smpMaxHp);
check("withdraw gave 2 orbs", world.inv.a.length === 2, JSON.stringify(world.inv.a));
world.db.a.smpMaxHp = C.orb.hp;
ctx.playerCommand("a", "withdraw 1");
check("withdraw cannot self-eliminate", world.db.a.smpMaxHp === C.orb.hp, world.db.a.smpMaxHp);

world.inv.a = [];
C.commands.adminNames.push("Alice");
ctx.playerCommand("a", "/give mace");
check("/give mace gives a tagged mace",
    world.inv.a[0].attributes.customAttributes.smpMace === true, JSON.stringify(world.inv.a[0]));
ctx.playerCommand("a", "/give egapple");
check("/give egapple gives an enchanted apple",
    world.inv.a[1].attributes.customAttributes.smpApple === "enchanted", "");
C.commands.adminNames.length = 0;
check("/give blocked for non-admin", ctx.playerCommand("a", "/give mace") === false, "");
check("unknown command ignored", ctx.playerCommand("a", "/potato") === false, "");

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
