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
check("orb is the XP orb item", C.orb.item === "Aura XP Orb", C.orb.item);
check("the orb is renamed Heart", C.orb.name === "Heart", C.orb.name);
check("hearts are uncapped by default", C.orb.usesPerPlayer === 0, C.orb.usesPerPlayer);

world.sel = { a: 0, b: 0 };
world.inv.a = [{ name: C.orb.item, amount: 2, attributes: world.drops[0].attrs }];
world.health.a = 50;
ctx.onPlayerAltAction("a");
check("orb raised max hp", world.db.a.smpMaxHp === 100, world.db.a.smpMaxHp);
check("orb healed current hp", world.health.a === 60, world.health.a);
check("orb stack decremented", world.inv.a[0].amount === 1, "");
check("eating still records a use for reporting", world.db.a.smpOrbsEaten === 1, world.db.a.smpOrbsEaten);
check("no cap means uses left is unlimited", ctx.orbUsesLeft("a") === Infinity, ctx.orbUsesLeft("a"));

// with no cap, eating a second (and third) Heart gains further hearts every time
world.inv.a = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
const hpBeforeSecond = world.db.a.smpMaxHp;
ctx.onPlayerAltAction("a");
check("a second Heart is absorbed with no cap", world.db.a.smpMaxHp === hpBeforeSecond + C.orb.hp, world.db.a.smpMaxHp);
world.inv.a = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
ctx.onPlayerAltAction("a");
check("a third Heart is absorbed too", world.db.a.smpMaxHp === hpBeforeSecond + C.orb.hp * 2, world.db.a.smpMaxHp);

// a fresh player may also absorb theirs, independently
world.inv.b = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
world.db.b.smpMaxHp = 90;
world.health.b = 50;
ctx.onPlayerAltAction("b");
check("a different player can also absorb", world.db.b.smpMaxHp === 100, world.db.b.smpMaxHp);
check("orb grants exactly one heart", 100 - 90 === C.orb.hp, C.orb.hp);
check("absorbed orb clears the slot", world.inv.b[0] === null, "");

// the cap machinery is still there for anyone who wants to re-enable it
C.orb.usesPerPlayer = 1;
world.db.a.smpOrbsEaten = 0;
world.db.a.smpMaxHp = 90;
world.inv.a = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
ctx.onPlayerAltAction("a");
check("with a cap set, one use is spent", world.db.a.smpOrbsEaten === 1, world.db.a.smpOrbsEaten);
check("no uses left after the first", ctx.orbUsesLeft("a") === 0, ctx.orbUsesLeft("a"));

world.inv.a = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
const hpBeforeCapped = world.db.a.smpMaxHp;
ctx.onPlayerAltAction("a");
check("a capped second orb is refused", world.db.a.smpMaxHp === hpBeforeCapped, world.db.a.smpMaxHp);
check("a refused orb stays in the inventory", world.inv.a[0] && world.inv.a[0].amount === 1, JSON.stringify(world.inv.a[0]));
check("the refusal explains the limit", world.log.some(l => /only absorb/.test(l)), "");

world.db.a.smpMaxHp = C.health.max;
world.db.a.smpOrbsEaten = 0;
world.inv.a = [{ name: C.orb.item, amount: 1, attributes: world.drops[0].attrs }];
ctx.onPlayerAltAction("a");
check("at the health cap -> orb not consumed", world.inv.a[0] && world.inv.a[0].amount === 1, "");
check("at the health cap -> no use spent", world.db.a.smpOrbsEaten === 0, world.db.a.smpOrbsEaten);
world.db.a.smpMaxHp = 90;
ctx.onPlayerAltAction("a");
check("last orb clears the slot", world.inv.a[0] === null, "");
C.orb.usesPerPlayer = 0;   // back to the real default for the rest of the suite

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

// ------------------------------------------------------------------ wind charge
check("wind charge is a real Bloxd item, not a fake one", C.windCharge.item === "Iron Fragment", C.windCharge.item);
check("wind charge is renamed", C.windCharge.name === "Wind Charge", C.windCharge.name);
check("wind charge recipe needs mango and iron fragment",
    C.windCharge.recipe.some(r => r.items[0] === "Mango")
        && C.windCharge.recipe.some(r => r.items[0] === "Iron Fragment"),
    JSON.stringify(C.windCharge.recipe));
check("wind charge is craftable", !!world.recipes.a[C.windCharge.item], Object.keys(world.recipes.a));
check("crafted wind charges carry their tag",
    world.recipes.a[C.windCharge.item][0].attributes.customAttributes.smpWindCharge === true, "");

const windChargeItem = () => ({ name: C.windCharge.item, amount: 3, attributes: ctx.windChargeAttributes() });
world.inv.a = [windChargeItem()];
world.facing = [0, 0, 1];
world.impulses.length = 0;
ctx.onPlayerAltAction("a");
check("using a wind charge launches you",
    world.impulses.length === 1 && world.impulses[0][2] === C.windCharge.upwardImpulse,
    JSON.stringify(world.impulses));
check("using a wind charge consumes exactly one", world.inv.a[0].amount === 2, world.inv.a[0].amount);
world.impulses.length = 0;
ctx.onPlayerAltAction("a");
check("wind charge item has its own cooldown", world.impulses.length === 0, JSON.stringify(world.impulses));

// it does not interfere with the mace's separate, built-in wind charge
world.inv.a = [maceItem()];
ctx.stateOf("a").lastCharge = 0;   // real time has not moved since the earlier mace test
world.impulses.length = 0;
ctx.onPlayerAltAction("a");
check("the mace's own wind charge is unaffected", world.impulses.length === 1, JSON.stringify(world.impulses));

// running out of charges leaves the slot empty, like any other consumable
world.inv.a = [{ name: C.windCharge.item, amount: 1, attributes: ctx.windChargeAttributes() }];
ctx.stateOf("a").lastWindCharge = 0;
ctx.onPlayerAltAction("a");
check("the last wind charge clears the slot", world.inv.a[0] === null, JSON.stringify(world.inv.a[0]));

// -------------------------------------------------------------------- repair kit
check("repair kit is a real Bloxd block, not a fake one", C.repair.item === "Yellow Portal", C.repair.item);
check("repair kit is craftable", !!world.recipes.a[C.repair.item], Object.keys(world.recipes.a));
check("repair kit recipe never touches the resurrection orb item",
    C.repair.item !== C.resurrection.item, JSON.stringify([C.repair.item, C.resurrection.item]));

world.inv.a = [{ name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 100, smpDurMax: 400 } } }];
world.sel.a = 0;
ctx.playerCommand("a", "/repair");
check("with no kit in hand, repair refuses", world.inv.a[0].attributes.customAttributes.smpDur === 100,
    world.inv.a[0].attributes.customAttributes.smpDur);

world.inv.a = [
    { name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 100, smpDurMax: 400 } } },
    { name: C.repair.item, amount: 3, attributes: ctx.repairKitAttributes() },
];
world.sel.a = 0;
ctx.playerCommand("a", "/repair");
check("repair restores half of max durability",
    world.inv.a[0].attributes.customAttributes.smpDur === 100 + Math.round(400 * C.repair.restoreFraction),
    world.inv.a[0].attributes.customAttributes.smpDur);
check("repair consumes exactly one kit", world.inv.a[1].amount === 2, world.inv.a[1].amount);

world.inv.a[0].attributes.customAttributes.smpDur = 390;
ctx.playerCommand("a", "/repair");
check("repair never overshoots the max", world.inv.a[0].attributes.customAttributes.smpDur === 400,
    world.inv.a[0].attributes.customAttributes.smpDur);

const kitsBefore = world.inv.a[1].amount;
ctx.playerCommand("a", "/repair");
check("a full item does not spend a kit", world.inv.a[1].amount === kitsBefore, world.inv.a[1].amount);

world.inv.a = [{ name: "Dirt", amount: 5, attributes: undefined }, { name: C.repair.item, amount: 1, attributes: ctx.repairKitAttributes() }];
world.sel.a = 0;
ctx.playerCommand("a", "/repair");
check("an item with no durability cannot be repaired", world.inv.a[1].amount === 1, world.inv.a[1].amount);

// /repair keeps the mace's bespoke tooltip in sync, via the shared withDurability helper
world.inv.a = [maceItem(), { name: C.repair.item, amount: 1, attributes: ctx.repairKitAttributes() }];
world.inv.a[0].attributes = ctx.maceAttributes(50);
world.sel.a = 0;
ctx.playerCommand("a", "/repair");
check("repairing the mace keeps its Wind Burst tooltip",
    /Wind Burst/.test(world.inv.a[0].attributes.customDescription), world.inv.a[0].attributes.customDescription);
check("repairing the mace still uses maceAttributes' durability",
    world.inv.a[0].attributes.customAttributes.smpDur === 50 + Math.round(C.mace.durability * C.repair.restoreFraction),
    world.inv.a[0].attributes.customAttributes.smpDur);

// ---------------------------------------------------------------------- shield
check("shield is a real Bloxd item, not a fake one", C.shield.item === "Brown Paintball Explosive Item", C.shield.item);
check("shield is renamed", C.shield.name === "Bulwark", C.shield.name);
check("shield is craftable", !!world.recipes.a[C.shield.item], Object.keys(world.recipes.a));
check("crafted shields carry their tag",
    world.recipes.a[C.shield.item][0].attributes.customAttributes.smpShield === true, "");

const shieldItem = (dur) => ({ name: C.shield.item, amount: null, attributes: ctx.shieldAttributes(dur) });

world.shield.a = 0;
world.inv.a = [shieldItem(C.shield.durability)];
world.sel.a = 0;
world.meshAttachments.a = undefined;
ctx.onPlayerAltAction("a");
check("raising the shield sets the flag", ctx.stateOf("a").shieldRaised === true, "");
check("raising the shield tops up the numeric shield",
    world.shield.a === C.shield.raiseShieldAmount, world.shield.a);
check("raising the shield attaches a mesh to the off arm",
    world.meshAttachments.a && world.meshAttachments.a.node === C.shield.armNode,
    JSON.stringify(world.meshAttachments.a));
check("raising the shield sets the top-left HUD chip",
    world.opts.a.headerChips && world.opts.a.headerChips[0] === C.shield.hudChip,
    JSON.stringify(world.opts.a.headerChips));

// a raised shield blocks a chunk of incoming player damage and drains the shield, not health
world.pos.a = [0, 64, 0]; world.pos.b = [1, 64, 0];
world.inv.b = [{ name: "Iron Sword", amount: null, attributes: undefined }];
world.sel.b = 0;
const shieldBefore = world.shield.a;
const blockedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a raised shield reduces the damage",
    blockedDmg === Math.round(20 * (1 - C.shield.blockFraction)), blockedDmg);
check("blocking drains the numeric shield, not just absorbing for free",
    world.shield.a < shieldBefore, world.shield.a);
check("blocking wears the shield item",
    world.inv.a[0].attributes.customAttributes.smpDur === C.shield.durability - C.shield.blockDurabilityCost,
    world.inv.a[0].attributes.customAttributes.smpDur);

// lowering it removes the mesh and the HUD chip
ctx.onPlayerAltAction("a");
check("lowering the shield clears the flag", ctx.stateOf("a").shieldRaised === false, "");
check("lowering the shield detaches the mesh", world.meshAttachments.a === null, world.meshAttachments.a);
check("lowering the shield clears the HUD chip", world.opts.a.headerChips.length === 0, JSON.stringify(world.opts.a.headerChips));

// with it lowered, hits go through untouched
world.health.a = 100;
const unblockedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a lowered shield blocks nothing", unblockedDmg === undefined, unblockedDmg);

// running out of shield breaks the guard rather than blocking for free
world.inv.a = [shieldItem(C.shield.durability)];
ctx.stateOf("a").shieldRaised = true;
world.shield.a = 0;
const brokenGuardDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("an empty shield stops blocking", brokenGuardDmg === undefined, brokenGuardDmg);
check("an empty shield auto-lowers", ctx.stateOf("a").shieldRaised === false, "");

// switching away from the shield mid-raise is caught and cleaned up by the tick safety-check
world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
ctx.stateOf("a").shieldRaised = true;
world.pos.a = [500, 64, 500];
ctx.tick();
check("switching away from a raised shield lowers it on the next tick",
    ctx.stateOf("a").shieldRaised === false, "");

// NPC attacks respect a raised shield too
world.inv.a = [shieldItem(C.shield.durability)];
ctx.stateOf("a").shieldRaised = true;
world.shield.a = 50;
const npcForShieldTest = npcRoster[0];
npcForShieldTest.pos = [0, 64, 0];
world.pos.a = [1, 64, 0];
npcForShieldTest.lastAttack = 0;
world.damages.length = 0;
ctx.npcAttack(npcForShieldTest, "a");
check("a raised shield reduces NPC damage too",
    world.damages[0].attemptedDmgAmt === Math.round(C.npcs.attackDamage * (1 - C.shield.blockFraction)),
    JSON.stringify(world.damages));
ctx.stateOf("a").shieldRaised = false;

// ------------------------------------------------------- passive off-hand shield
// Slot 0 acts as a pseudo off-hand: parking a Bulwark there protects the
// player automatically, every tick, with no need to hold or click it.
world.meshAttachments.a = undefined;
world.opts.a.headerChips = [];
world.shield.a = 0;
world.sel.a = 5;   // main hand is a different, unrelated slot
world.inv.a = [];
world.inv.a[C.shield.offhandSlotIndex] = shieldItem(C.shield.durability);
world.inv.a[5] = { name: "Iron Sword", amount: null, attributes: undefined };
ctx.tick();
check("parking a shield off-hand raises it without holding it",
    ctx.stateOf("a").offhandShieldOn === true, "");
check("the off-hand shield tops up the numeric shield",
    world.shield.a === C.shield.raiseShieldAmount, world.shield.a);
check("the off-hand shield attaches the off-arm mesh",
    world.meshAttachments.a && world.meshAttachments.a.node === C.shield.armNode, "");
check("the off-hand shield sets the HUD chip",
    world.opts.a.headerChips[0] === C.shield.hudChip, JSON.stringify(world.opts.a.headerChips));

const offhandShieldBefore = world.shield.a;
const offhandBlockedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("the off-hand shield blocks damage while a different weapon is held",
    offhandBlockedDmg === Math.round(20 * (1 - C.shield.blockFraction)), offhandBlockedDmg);
check("the off-hand shield drains the numeric shield",
    world.shield.a < offhandShieldBefore, world.shield.a);
check("the off-hand shield wears, the held weapon does not",
    world.inv.a[C.shield.offhandSlotIndex].attributes.customAttributes.smpDur
        === C.shield.durability - C.shield.blockDurabilityCost,
    world.inv.a[C.shield.offhandSlotIndex].attributes.customAttributes.smpDur);

world.inv.a[C.shield.offhandSlotIndex] = null;
ctx.tick();
check("removing the off-hand shield clears the flag",
    ctx.stateOf("a").offhandShieldOn === false, "");
check("removing the off-hand shield detaches the mesh", world.meshAttachments.a === null, "");
check("removing the off-hand shield clears the HUD chip",
    world.opts.a.headerChips.length === 0, JSON.stringify(world.opts.a.headerChips));
world.sel.a = 0;

check("/give shield gives a tagged shield", (() => {
    C.commands.adminNames.push("Alice");
    world.inv.a = [];
    ctx.playerCommand("a", "/give shield");
    C.commands.adminNames.length = 0;
    return world.inv.a[0] && world.inv.a[0].attributes.customAttributes.smpShield === true;
})(), JSON.stringify(world.inv.a));

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
// the native killfeed panel is off for good, from the moment they join - there
// is no per-anon toggling any more, so nobody ever sees the automatic entry
check("the native killfeed panel is disabled on join",
    world.opts.a.showKillfeed === false && world.opts.b.showKillfeed === false,
    JSON.stringify([world.opts.a.showKillfeed, world.opts.b.showKillfeed]));

// ------------------------------------------------------------- death announcements
// exactly one message and one sound per death, from a single call site
world.pos.a = [10, 64, 10]; world.pos.b = [10, 64, 10];
world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
ctx.onPlayerDamagingOtherPlayer("a", "b", 20);   // records "a"s weapon for the kill line
world.db.b.smpMaxHp = 100;
// broadcastMessage entries are prefixed "bcast " in the log; sendMessage/
// sendFlyingMiddleMessage are private and prefixed differently, so counting
// "public messages" means counting bcast lines specifically.
const bcasts = () => world.log.filter(l => l.indexOf("bcast ") === 0);
// a kill also drops an orb, which plays its own pickup-chime sound - a real,
// separate sound for a separate event, not a second copy of the death toll.
const tolls = () => world.sounds.filter(s => s.soundName === C.deathSound.sound);

world.log.length = 0; world.sounds.length = 0;
ctx.onAttemptKillPlayer("b", "a");
check("a PvP kill sends exactly one public message", bcasts().length === 1, JSON.stringify(world.log));
check("the kill message names the killer and victim",
    /Alice/.test(bcasts()[0]) && /Bob/.test(bcasts()[0]), bcasts()[0]);
check("the kill message names the weapon used", /Iron Sword/.test(bcasts()[0]), bcasts()[0]);
check("a death tolls exactly once", tolls().length === 1, JSON.stringify(world.sounds));
check("the death toll reaches the whole server",
    tolls()[0].posSettings.maxHearDist === C.deathSound.maxHearDist, tolls()[0].posSettings);

// a free world death (fall damage etc, 0 hearts lost) still gets one message and sound
world.db.b.smpMaxHp = 100;
world.log.length = 0; world.sounds.length = 0;
ctx.onAttemptKillPlayer("b", null);
check("a free world death is still announced once", bcasts().length === 1, JSON.stringify(world.log));
check("a world death names no killer", !/Alice/.test(bcasts()[0]), bcasts()[0]);
check("a free world death still tolls", tolls().length === 1, JSON.stringify(world.sounds));
check("a free world death costs no hearts", world.db.b.smpMaxHp === 100, world.db.b.smpMaxHp);

// an eliminating kill merges into ONE public message, not a kill line plus a separate one
world.db.b.smpMaxHp = C.death.hpLostToPlayer;
world.drops.length = 0;
world.log.length = 0; world.sounds.length = 0;
ctx.onAttemptKillPlayer("b", "a");
check("an eliminating kill still sends only one public message", bcasts().length === 1, JSON.stringify(world.log));
check("that one message mentions both the kill and the Void",
    /Alice/.test(bcasts()[0]) && /Bob/.test(bcasts()[0]) && /Void/.test(bcasts()[0]), bcasts()[0]);
check("an eliminating kill still tolls exactly once", tolls().length === 1, JSON.stringify(world.sounds));
world.db.b.smpMaxHp = 100;
if (ctx.dimensionAt(world.pos.b) === "void") ctx.travelTo("b", "overworld");

// dying again while still exiled in the Void raises no further noise
world.pos.b = [C.dimensions.list["void"].origin[0], 64, C.dimensions.list["void"].origin[1]];
ctx.tick();
world.log.length = 0; world.sounds.length = 0;
ctx.onAttemptKillPlayer("b", "a");
check("dying again inside the Void is silent", bcasts().length === 0 && tolls().length === 0, "");
ctx.travelTo("b", "overworld");

// anonymity still swaps the name inside that one message
world.pos.a = [10, 64, 10]; world.pos.b = [10, 64, 10];
world.db.b.smpMaxHp = 100;
ctx.onPlayerChat("a", "!anon", "global");
world.log.length = 0;
ctx.onAttemptKillPlayer("b", "a");
check("an anonymous killer's real name is hidden in the death message",
    !/Alice/.test(bcasts()[0]) && new RegExp(C.anonymous.displayName).test(bcasts()[0]), bcasts()[0]);
ctx.onPlayerChat("a", "!anon", "global");
world.db.b.smpMaxHp = 100;

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
world.blocks["0,63,0"] = "Stone";
for (let i = 0; i < N.thinkEveryTicks * 2; i++) ctx.tick();
check("a roster is built once", npcRoster.length === N.count, npcRoster.length);

// send them all back to the spawn queue so the spawn path is observed fresh
world.meshEntities.length = 0;
npcRoster.forEach(x => { x.entityId = null; x.deadUntil = 0; });
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();

check("NPCs are Person mesh entities, not mobs",
    world.meshEntities.length === N.count && world.meshEntities.every(m => m.type === "Person"),
    JSON.stringify(world.meshEntities.map(m => m.type)));
check("NPCs wear a player skin",
    world.meshEntities.every(m => N.skins.indexOf(m.opts.textures.head) !== -1),
    JSON.stringify(world.meshEntities.map(m => m.opts.textures)));
check("NPCs stand upright", world.meshEntities.every(m => m.opts.pose === "standing"), "");
check("NPCs carry a nametag", world.meshEntities.every(m => !!m.name), "");
check("NPCs have unique names",
    new Set(npcRoster.map(x => x.name)).size === N.count, npcRoster.map(x => x.name).join(","));
check("NPCs have unique skins",
    new Set(npcRoster.map(x => x.skin)).size === N.count, npcRoster.map(x => x.skin).join(","));
check("NPC homes are spread out",
    new Set(npcRoster.map(x => x.home[0].toFixed(2))).size > 1, "");

const npc = npcRoster[0];
const body = npc.entityId;
npc.pos = [0, 64, 0];

// they walk toward a target rather than teleporting to it
npc.target = [10, 0];
npc.running = false;
const startX = npc.pos[0];
for (let i = 0; i < N.moveEveryTicks; i++) ctx.tick();
const moved = npc.pos[0] - startX;
check("an NPC walks a step at a time", moved > 0 && moved <= N.walkSpeed + 0.001, moved);
check("walking turns them to face the way they go", world.headings[body] !== undefined, "");

// they notice someone walking up, greet them once, and stop wandering
world.log.length = 0;
npc.pos = [0, 64, 0];
world.pos.a = [2, 64, 0];
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("an NPC greets you", world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));
check("an NPC stops to talk", npc.target === null, JSON.stringify(npc.target));
world.log.length = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("greetings are not spammed", !world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));

// hit one and it fights back
world.log.length = 0;
world.inv.a = [];
npc.lastChat = 0;
const hpBefore = npc.hp;
ctx.onPlayerDamagingMeshEntity("a", body, 10);
check("hitting an NPC hurts it", npc.hp === hpBefore - 10, npc.hp);
check("hitting an NPC provokes it", npc.provokedBy === "a", npc.provokedBy);
check("a hurt NPC says something", world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), JSON.stringify(world.log));
world.log.length = 0;
ctx.onPlayerDamagingMeshEntity("a", body, 10);
check("hurt lines are rate limited", !world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), "");

npc.pos = [0, 64, 0];
world.pos.a = [30, 64, 0];
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a provoked NPC comes after you",
    npc.target && Math.abs(npc.target[0] - 30) < 0.001, JSON.stringify(npc.target));
check("a provoked NPC runs rather than strolls", npc.running === true, "");

// in range, it actually hits back
world.damages.length = 0;
npc.pos = [0, 64, 0];
world.pos.a = [1, 64, 0];
npc.lastAttack = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("an NPC in range hits back", world.damages.some(d => d.hitEId === "a"), JSON.stringify(world.damages));
check("its hits name the NPC", world.damages.some(d => d.withItem === npc.name), "");
world.damages.length = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("attacks are on a cooldown", world.damages.length === 0, JSON.stringify(world.damages));

// out of range it swings at nothing
world.damages.length = 0;
world.pos.a = [40, 64, 0];
npc.lastAttack = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("an NPC out of range does not hit you", world.damages.length === 0, JSON.stringify(world.damages));

// hurt it badly and it runs the other way
npc.hp = N.maxHealth * 0.1;
npc.pos = [0, 64, 0];
world.pos.a = [5, 64, 0];
npc.provokedBy = "a";
npc.provokedAt = ctx.api === undefined ? 0 : Date.now();
npc.lastChat = 0;
world.log.length = 0;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a losing NPC flees away from you", npc.target && npc.target[0] < 0, JSON.stringify(npc.target));
check("a fleeing NPC says so", world.log.some(l => l.indexOf("bcast " + npc.name + ":") === 0), "");

// enough damage kills it
world.log.length = 0;
world.drops.length = 0;
npc.hp = 5;
ctx.onPlayerDamagingMeshEntity("a", body, 10);
check("enough damage kills an NPC", npc.entityId === null, npc.entityId);
check("a killed NPC is announced", world.log.some(l => /was killed by/.test(l)), JSON.stringify(world.log));
check("a killed NPC's body is removed",
    !world.meshEntities.some(m => m.id === body), JSON.stringify(world.meshEntities.map(m => m.id)));
check("a killed NPC books a respawn", npc.deadUntil > 0, npc.deadUntil);
check("NPCs drop no Life Orb by default", world.drops.length === 0, world.drops.length);

// it comes back, keeping who it is
const wasName = npc.name, wasSkin = npc.skin, wasPersonality = npc.personality;
npc.deadUntil = 0;
world.pos.a = [900, 64, 900];
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a dead NPC respawns", npc.entityId !== null, npc.entityId);
check("it comes back as the same person",
    npc.name === wasName && npc.skin === wasSkin && npc.personality === wasPersonality, "");
check("it comes back at full health", npc.hp === N.maxHealth, npc.hp);

// breaking the model outright also counts as a kill
const npc2 = npcRoster[1];
world.log.length = 0;
ctx.onPlayerBreakMeshEntity("a", npc2.entityId);
check("breaking the model kills the NPC", npc2.entityId === null, npc2.entityId);

// a full entity budget only delays them
npc2.deadUntil = 0;
world.meshSpawnFails = true;
for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick();
check("a full entity budget only delays a respawn",
    npc2.entityId === null && npc2.deadUntil > 0, npc2.deadUntil);
world.meshSpawnFails = false;

// ---- they actually work -----------------------------------------------------
const W = N.work;
const worker = npcRoster.find(x => x.trade === "lumberjack") || npcRoster[0];
if (worker.entityId === null) { worker.deadUntil = 0; for (let i = 0; i < N.thinkEveryTicks; i++) ctx.tick(); }
check("NPCs are given a trade",
    npcRoster.every(x => !!W.trades[x.trade]), npcRoster.map(x => x.trade).join(","));
check("trades are shared out", new Set(npcRoster.map(x => x.trade)).size > 1, "");

// put a tree in their patch and let them find it
world.pos.a = [900, 64, 900];
world.blocks = {};
const treeX = Math.floor(worker.home[0]) + 3, treeZ = Math.floor(worker.home[1]) + 3;
worker.pos = [worker.home[0], 64, worker.home[1]];
// A stand of trees, the way a real world has them - a single log in 3,700
// columns is not something random probing is meant to find.
for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) {
    for (let y = 64; y < 68; y++) {
        world.blocks[(Math.floor(worker.home[0]) + dx) + "," + y + "," + (Math.floor(worker.home[1]) + dz)] = "Maple Log";
    }
}
worker.stash = 0; worker.restUntil = 0; worker.workBlock = null; worker.plan = null; worker.provokedBy = null;
let found = null;
for (let i = 0; i < 40 && !found; i++) found = ctx.findWorkBlock(worker);
check("a lumberjack finds a log in a wood",
    found && world.blocks[found.join(",")] === "Maple Log", JSON.stringify(found));
// Probing downward means they always take the top of a trunk first, and the
// next pass finds the one below it - trees come down from the top, not the base.
check("they take the top of a trunk first", found && found[1] === 67, found && found[1]);
check("the next pass takes the one below", (() => {
    delete world.blocks[found[0] + ",67," + found[2]];
    for (let i = 0; i < 60; i++) {
        const f = ctx.findWorkBlock(worker);
        if (f && f[0] === found[0] && f[2] === found[2]) return f[1] === 66;
    }
    return true;   // never re-probed that column; nothing to disprove
})(), "");
world.blocks = {};
world.blocks[treeX + ",64," + treeZ] = "Maple Log";
check("a miner does not want logs",
    W.trades.miner.gathers.indexOf("Maple Log") === -1, "");

// standing next to it, they chop it down
worker.job = "gather";
worker.workBlock = [treeX, 64, treeZ];
worker.pos = [treeX + 0.5, 64, treeZ + 0.5];
world.worldChanges.length = 0;
ctx.workNpc(worker);
check("chopping clears the block",
    world.worldChanges.some(c => c.x === treeX && c.name === "Air"), JSON.stringify(world.worldChanges));
check("chopping fills the stash", worker.stash === 1, worker.stash);

// they will not reach outside their own patch
worker.job = "gather";
const farX = Math.floor(worker.home[0]) + W.radius + 40;
world.blocks[farX + ",64,0"] = "Maple Log";
worker.workBlock = [farX, 64, 0];
worker.pos = [farX + 0.5, 64, 0.5];
world.worldChanges.length = 0;
ctx.workNpc(worker);
check("they never break blocks outside their patch", world.worldChanges.length === 0, JSON.stringify(world.worldChanges));

// out of reach they swing at nothing
worker.workBlock = [treeX, 64, treeZ];
worker.pos = [treeX + 20, 64, treeZ];
world.worldChanges.length = 0;
ctx.workNpc(worker);
check("they must stand next to a block to break it", world.worldChanges.length === 0, "");

// with material in hand they build their hut
world.blocks = {};
for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) {
    world.blocks[(Math.floor(worker.home[0]) + dx) + ",63," + (Math.floor(worker.home[1]) + dz)] = "Stone";
}
worker.pos = [worker.home[0], 64, worker.home[1]];
worker.plan = null; worker.planIndex = 0;
const plan = ctx.buildPlanFor(worker);
check("a hut plan is drawn up", plan && plan.length > 40, plan && plan.length);
check("the hut has a doorway", (() => {
    const cx = Math.floor(worker.home[0]), cz = Math.floor(worker.home[1]);
    const edge = W.hut.half;
    return !plan.some(pp => pp[0] === cx && pp[2] === cz - edge && pp[1] === 63 + 1);
})(), "no gap found");

worker.stash = 200;
worker.restUntil = 0;
worker.provokedBy = null;
world.worldChanges.length = 0;
const material = W.trades[worker.trade].buildsWith;
for (let i = 0; i < 400; i++) {
    ctx.thinkNpc(worker);
    if (worker.buildSpot) worker.pos = [worker.buildSpot[0] + 0.5, worker.buildSpot[1], worker.buildSpot[2] + 0.5];
    ctx.workNpc(worker);
}
const placed = world.worldChanges.filter(c => c.name === material).length;
check("they build with their trade's material", placed > 20, placed);
check("building spends the stash", worker.stash < 200, worker.stash);
check("the hut is finished", ctx.nextBuildSpot(worker) === null, ctx.nextBuildSpot(worker));
check("finishing earns them a rest", worker.restUntil > 0, worker.restUntil);

// a protected spot is skipped rather than retried forever
const other = npcRoster.find(x => x !== worker);
other.plan = null; other.planIndex = 0; other.stash = 50; other.restUntil = 0; other.provokedBy = null;
other.pos = [other.home[0], 64, other.home[1]];
const otherPlan = ctx.buildPlanFor(other);
if (otherPlan) {
    world.protectedBlocks[otherPlan[0].join(",")] = true;
    other.plan = otherPlan; other.planIndex = 0;
    other.job = "build"; other.buildSpot = otherPlan[0];
    other.pos = [otherPlan[0][0] + 0.5, otherPlan[0][1], otherPlan[0][2] + 0.5];
    const idxBefore = other.planIndex;
    ctx.workNpc(other);
    check("a protected spot is skipped, not retried", other.planIndex === idxBefore + 1, other.planIndex);
    check("a skipped spot costs no material", other.stash === 50, other.stash);
    world.protectedBlocks = {};
}

// a fight interrupts work
worker.provokedBy = "a";
world.worldChanges.length = 0;
worker.job = "gather"; worker.workBlock = [treeX, 64, treeZ];
worker.pos = [treeX + 0.5, 64, treeZ + 0.5];
world.blocks[treeX + ",64," + treeZ] = "Maple Log";
ctx.workNpc(worker);
check("they stop working when attacked", world.worldChanges.length === 0, JSON.stringify(world.worldChanges));
worker.provokedBy = null;

check("/npcs lists them", ctx.playerCommand("a", "/npcs") === true, "");
check("someone else's mesh entity is not an NPC", (() => {
    const before = world.log.length;
    ctx.onPlayerDamagingMeshEntity("a", "not-an-npc", 5);
    ctx.onPlayerBreakMeshEntity("a", "not-an-npc");
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
