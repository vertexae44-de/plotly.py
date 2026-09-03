const { ctx, world, CONFIG: C, durabilityCache } = require("./harness.js");
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

// ---------------------------------------------------------- permanent ban at 0
world.drops.length = 0;
world.kicks.length = 0;
world.db.b.smpMaxHp = C.death.hpLostToPlayer;      // exactly one death left
ctx.onAttemptKillPlayer("b", "a");
check("0 hearts kicks the player", world.kicks.some(k => k.id === "b"), JSON.stringify(world.kicks));
check("0 hearts is announced", world.log.some(l => l.startsWith("bcast") && /Bob/.test(l)), "");
check("elimination still drops orbs", world.drops.length > 0, world.drops.length);
check("ban recorded by account id", JSON.parse(world.lobbyDb.smpBans)["db-b"] === "Bob", world.lobbyDb.smpBans);

world.kicks.length = 0;
ctx.onPlayerJoin("b");
check("banned player kicked on join", world.kicks.length === 1, JSON.stringify(world.kicks));
check("banned player gets no recipes", world.recipes.b === undefined || !world.recipes.b.__rejoined, "");

// admins can lift it
C.commands.adminNames.push("Alice");
check("/bans lists the ban", ctx.playerCommand("a", "/bans") === true, "");
check("/unban handled", ctx.playerCommand("a", "/unban Bob") === true, "");
check("ban removed", JSON.parse(world.lobbyDb.smpBans)["db-b"] === undefined, world.lobbyDb.smpBans);
world.kicks.length = 0;
world.db.b.smpMaxHp = 100;
ctx.onPlayerJoin("b");
check("unbanned player may rejoin", world.kicks.length === 0, JSON.stringify(world.kicks));

// a corrupt ban list must not lock everyone out
world.lobbyDb.smpBans = "{not json";
world.kicks.length = 0;
ctx.onPlayerJoin("b");
check("corrupt ban list is ignored", world.kicks.length === 0, JSON.stringify(world.kicks));
world.lobbyDb.smpBans = "{}";

// ------------------------------------------------------------------ dimensions
const DIM = C.dimensions.list;
world.pos.a = [10, 64, 20];
ctx.onPlayerJoin("a");
check("spawn area is the overworld", ctx.dimensionAt([10, 64, 20]) === "overworld", ctx.dimensionAt([10, 64, 20]));
check("nether region is detected",
    ctx.dimensionAt([DIM.nether.origin[0] + 5, 64, DIM.nether.origin[1]]) === "nether", "");
check("end region is detected",
    ctx.dimensionAt([DIM.end.origin[0], 64, DIM.end.origin[1] - 5]) === "end", "");
check("far unclaimed space defaults to overworld",
    ctx.dimensionAt([500000, 64, 500000]) === "overworld", "");

// travelling to the nether divides coordinates by the scale
world.pos.a = [800, 70, 160];
world.rects.length = 0;
check("travel returns true", ctx.travelTo("a", "nether") === true, "");
check("nether x is scaled down",
    world.pos.a[0] === DIM.nether.origin[0] + 800 / DIM.nether.scale, world.pos.a[0]);
check("nether z is scaled down",
    world.pos.a[2] === DIM.nether.origin[1] + 160 / DIM.nether.scale, world.pos.a[2]);
check("height is preserved", world.pos.a[1] === 70, world.pos.a[1]);
check("nether fog applied", world.opts.a.fogColourOverride === DIM.nether.clientOptions.fogColourOverride,
    world.opts.a.fogColourOverride);
check("arrival platform built in empty space",
    world.rects.some(r => r.name === DIM.nether.platformBlock), JSON.stringify(world.rects));

// coming back multiplies them straight back up
check("return travel works", ctx.travelTo("a", "overworld") === true, "");
check("overworld x restored", world.pos.a[0] === 800, world.pos.a[0]);
check("overworld z restored", world.pos.a[2] === 160, world.pos.a[2]);
check("overworld resets the fog", world.opts.a.fogColourOverride === "DEFAULT", world.opts.a.fogColourOverride);
check("overworld resets gravity", world.opts.a.gravityMultiplier === "DEFAULT", world.opts.a.gravityMultiplier);

// no platform is built where ground already exists
world.pos.a = [800, 70, 160];
world.rects.length = 0;
world.blocks[Math.floor(DIM.end.origin[0] + 800) + ",69," + Math.floor(DIM.end.origin[1] + 160)] = "Stone";
ctx.travelTo("a", "end");
check("existing ground is left alone", world.rects.length === 0, JSON.stringify(world.rects));
check("end gravity applied", world.opts.a.gravityMultiplier === DIM.end.clientOptions.gravityMultiplier,
    world.opts.a.gravityMultiplier);
ctx.travelTo("a", "overworld");

// portals
world.pos.a = [800, 70, 160];
ctx.onBlockStandStart("a", 800, 69, 160, DIM.nether.portalBlock);
check("purple portal sends you to the nether", ctx.dimensionAt(world.pos.a) === "nether", world.pos.a);
ctx.onBlockStandStart("a", 0, 0, 0, DIM.nether.portalBlock);
check("portal cooldown blocks an instant return", ctx.dimensionAt(world.pos.a) === "nether", "");
ctx.stateOf("a").lastTravel = 0;
ctx.onBlockStandStart("a", 0, 0, 0, DIM.nether.portalBlock);
check("standing on it again returns you home", ctx.dimensionAt(world.pos.a) === "overworld", world.pos.a);
ctx.stateOf("a").lastTravel = 0;
ctx.onBlockStandStart("a", 0, 0, 0, DIM.end.portalBlock);
check("black portal sends you to the end", ctx.dimensionAt(world.pos.a) === "end", world.pos.a);
ctx.onBlockStandStart("a", 0, 0, 0, "Stone");
check("an ordinary block is not a portal", ctx.dimensionAt(world.pos.a) === "end", "");
ctx.stateOf("a").lastTravel = 0;
ctx.travelTo("a", "overworld");

// walking across a border re-dresses the world without any portal
world.pos.a = [DIM.nether.origin[0], 64, DIM.nether.origin[1]];
ctx.tick();
check("tick notices a region change", ctx.stateOf("a").dimension === "nether", ctx.stateOf("a").dimension);
check("tick applies the new look",
    world.opts.a.fogColourOverride === DIM.nether.clientOptions.fogColourOverride, "");
world.pos.a = [0, 64, 0];
ctx.tick();
check("tick restores the overworld", ctx.stateOf("a").dimension === "overworld", "");

check("portal blocks are craftable", !!world.recipes.a[DIM.nether.portalBlock]
    && !!world.recipes.a[DIM.end.portalBlock], Object.keys(world.recipes.a));
check("/where is public", ctx.playerCommand("a", "/where") === true, "");

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
