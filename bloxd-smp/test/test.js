const { ctx, world, CONFIG: C, durabilityCache, genDone, genQueue } = require("./harness.js");
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

// a plain apple is not edible as a gapple, and right click leaves it alone
world.health.a = 50;
world.db.a.smpMaxHp = 110;
world.inv.a = [{ name: "Apple", amount: 5, attributes: undefined }];
world.sel.a = 0;
ctx.onPlayerAltAction("a");
check("plain apple untouched",
    world.inv.a[0].amount === 5 && world.health.a === 50 && world.db.a.smpMaxHp === 110, "");

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
check("shield is a real Bloxd item, not a fake one", C.shield.item === "Brown Paintball", C.shield.item);
check("the shield is not built on a native throwable",
    C.shield.item.indexOf("Explosive") === -1, C.shield.item);
check("shield is renamed", C.shield.name === "Bulwark", C.shield.name);
check("shield is craftable", !!world.recipes.a[C.shield.item], Object.keys(world.recipes.a));
check("crafted shields carry their tag",
    world.recipes.a[C.shield.item][0].attributes.customAttributes.smpShield === true, "");

const shieldItem = (dur) => ({ name: C.shield.item, amount: null, attributes: ctx.shieldAttributes(dur) });

world.shield.a = 0;
world.inv.a = [shieldItem(C.shield.durability)];
world.sel.a = 0;
world.meshAttachments.a = undefined;
ctx.playerCommand("a", "/shield");
check("/shield raises it by hand and sets the flag", ctx.stateOf("a").shieldRaised === true, "");
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
ctx.playerCommand("a", "/shield");
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

// ------------------------------------------------------- passive off-hand shield
// The first backpack slot acts as a pseudo off-hand: parking a Bulwark there
// protects the player automatically, every tick, with no need to hold it.
world.meshAttachments.a = undefined;
world.opts.a.headerChips = [];
world.shield.a = 0;
world.sel.a = 5;   // main hand is a different, unrelated slot
world.inv.a = [];
world.inv.a[C.offhand.slotIndex] = shieldItem(C.shield.durability);
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
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur
        === C.shield.durability - C.shield.blockDurabilityCost,
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur);

world.inv.a[C.offhand.slotIndex] = null;
ctx.tick();
check("removing the off-hand shield clears the flag",
    ctx.stateOf("a").offhandShieldOn === false, "");
check("removing the off-hand shield detaches the mesh", world.meshAttachments.a === null, "");
check("removing the off-hand shield clears the HUD chip",
    world.opts.a.headerChips.length === 0, JSON.stringify(world.opts.a.headerChips));
world.sel.a = 0;

// ------------------------------------------------------------ off-hand swapping
// Right-click swaps a plain held item into the off-hand slot; the two slots
// trade places, so nothing is ever destroyed or stranded in a variable. The
// off-hand sits outside the hotbar, so it never costs a weapon slot.
const OFF = C.offhand.slotIndex;
// The hotbar is indexes 0-9, so the off-hand must live at 10 or beyond -
// otherwise it would eat one of the player's weapon slots.
check("the off-hand is outside the hotbar", OFF > 9, OFF);
world.effects.length = 0;
world.inv.a = [];
world.sel.a = 3;
world.inv.a[3] = { name: "Torch", amount: 4, attributes: undefined };

// right click must NOT quietly move things: filling the off-hand is deliberate
ctx.onPlayerAltAction("a");
check("right-clicking a plain item leaves it in your hand",
    world.inv.a[3] && world.inv.a[3].name === "Torch", JSON.stringify(world.inv.a[3]));
check("right-clicking a plain item puts nothing in the off-hand",
    !world.inv.a[OFF], JSON.stringify(world.inv.a[OFF]));

ctx.playerCommand("a", "/offhand");
check("/offhand puts the held item in the off-hand",
    world.inv.a[OFF] && world.inv.a[OFF].name === "Torch", JSON.stringify(world.inv.a[OFF]));
check("the swapped item leaves your hand", world.inv.a[3] === null, JSON.stringify(world.inv.a[3]));
check("the whole stack moves, not one item",
    world.inv.a[OFF].amount === 4, world.inv.a[OFF].amount);

ctx.tick();
check("an off-handed item shows as a status effect",
    world.effects.some(e => e.id === "a" && e.name === "Torch"), JSON.stringify(world.effects));
check("the status effect uses the item as its icon",
    world.effects.some(e => e.name === "Torch" && e.info && e.info.icon === "Torch"),
    JSON.stringify(world.effects));
check("the off-hand effect never expires on its own",
    world.effects.some(e => e.name === "Torch" && e.ms === null), JSON.stringify(world.effects));

// swapping a second item returns the first one to your hand
world.inv.a[3] = { name: "Apple", amount: 1, attributes: undefined };
ctx.playerCommand("a", "/offhand");
check("swapping again off-hands the new item",
    world.inv.a[OFF].name === "Apple", JSON.stringify(world.inv.a[OFF]));
check("swapping again hands the old one back",
    world.inv.a[3] && world.inv.a[3].name === "Torch", JSON.stringify(world.inv.a[3]));
ctx.tick();
check("the old item's effect icon is cleared",
    !world.effects.some(e => e.name === "Torch"), JSON.stringify(world.effects));

// an empty hand pulls the off-hand item back out
world.inv.a[3] = null;
ctx.playerCommand("a", "/offhand");
check("an empty hand takes the off-hand item back",
    world.inv.a[3] && world.inv.a[3].name === "Apple", JSON.stringify(world.inv.a[3]));
check("the off-hand is left empty", world.inv.a[OFF] === null, JSON.stringify(world.inv.a[OFF]));

// /offhand also moves a shield, whose right click means "block"
world.inv.a = [];
world.sel.a = 3;
world.inv.a[3] = shieldItem(C.shield.durability);
ctx.playerCommand("a", "/offhand");
check("/offhand puts a shield in the off-hand from chat too",
    world.inv.a[OFF] && world.inv.a[OFF].attributes.customAttributes.smpShield === true,
    JSON.stringify(world.inv.a[OFF]));
check("/offhand frees your main hand for a weapon", world.inv.a[3] === null, "");
ctx.tick();
check("a shield put there by /offhand protects passively",
    ctx.stateOf("a").offhandShieldOn === true, "");

// right-clicking a HELD shield raises the guard, and never moves the item
world.inv.a = [];
world.sel.a = 3;
world.inv.a[3] = shieldItem(C.shield.durability);
world.shield.a = 0;
ctx.stateOf("a").shieldRaised = false;
ctx.stateOf("a").offhandShieldOn = false;
ctx.onPlayerAltAction("a");
check("right-clicking a held shield raises the guard",
    ctx.stateOf("a").shieldRaised === true, "");
check("raising the guard never moves the shield out of your hand",
    world.inv.a[3] && world.inv.a[3].attributes.customAttributes.smpShield === true,
    JSON.stringify(world.inv.a[3]));
check("raising the guard puts nothing in the off-hand", !world.inv.a[OFF], "");

const guardedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a hand-raised guard blocks the hit",
    guardedDmg === Math.round(20 * (1 - C.shield.blockFraction)), guardedDmg);

ctx.onPlayerAltAction("a");
check("right-clicking again drops the guard", ctx.stateOf("a").shieldRaised === false, "");
const unguardedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a dropped guard blocks nothing", unguardedDmg === undefined, unguardedDmg);
ctx.stateOf("a").shieldRaised = false;

// the touchscreen action button does the same swap, for phone players
world.inv.a = [];
world.sel.a = 3;
world.inv.a[3] = { name: "Torch", amount: 1, attributes: undefined };
ctx.onTouchscreenActionButton("a", true);
check("the touchscreen button swaps into the off-hand",
    world.inv.a[OFF] && world.inv.a[OFF].name === "Torch", JSON.stringify(world.inv.a[OFF]));
ctx.onTouchscreenActionButton("a", false);
check("releasing the touchscreen button does not swap back",
    world.inv.a[OFF] && world.inv.a[OFF].name === "Torch", JSON.stringify(world.inv.a[OFF]));
check("joining sets up the touchscreen off-hand button",
    world.opts.a.touchscreenActionButton === C.offhand.touchButton,
    world.opts.a.touchscreenActionButton);
ctx.stateOf("a").shieldRaised = false;
world.inv.a = [];
world.sel.a = 0;
ctx.tick();

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
// Drain the whole queue first - the 5x5 around the player is still building,
// and ore placement writes blocks every tick, so "nothing changed" only means
// anything once there is no work left.
let drainTicks = 0;
while (drainTicks < 3000 && genQueue.length > 0) {
    ctx.tick();
    drainTicks++;
}
check("the generation queue drains", genQueue.length === 0, genQueue.length + " left");
const netherSets = world.sets;
const netherRects = world.rects.length;
ctx.tick();
check("a generated chunk is never rebuilt",
    world.sets === netherSets && world.rects.length === netherRects,
    world.sets + "/" + world.rects.length + " vs " + netherSets + "/" + netherRects);

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
// ------------------------------------------------------------------------- ores
// Ores replace rock below the surface. They must be deterministic (a
// regenerated chunk has to come back identical) and must never eat the
// surface layer, the bedrock floor or the ceiling.
const nOres = GEN.nether.ores.map(o => o.block);
const eOres = GEN.end.ores.map(o => o.block);

check("the nether has ores configured", nOres.length > 0, nOres.join(","));
check("the end has ores configured", eOres.length > 0, eOres.join(","));

const scanColumns = (build, seedX, seedZ, count) => {
    world.blocks = {};
    for (let i = 0; i < count; i++) {
        build(i, 0, seedX + i, seedZ + i * 3);
    }
    return world.blocks;
};

const nBlocks = scanColumns(ctx.buildNetherColumn, 0, 0, 400);
const nFound = nOres.filter(o => Object.keys(nBlocks).some(k => nBlocks[k] === o));
check("nether columns actually contain ores", nFound.length > 0, nFound.join(","));

const eBlocks = scanColumns(ctx.buildEndColumn, 0, 0, 400);
const eFound = eOres.filter(o => Object.keys(eBlocks).some(k => eBlocks[k] === o));
check("end columns actually contain ores", eFound.length > 0, eFound.join(","));

// the same column, built twice, must come back byte-identical
world.blocks = {};
ctx.buildNetherColumn(0, 0, 41, 67);
const firstPass = JSON.stringify(world.blocks);
world.blocks = {};
ctx.buildNetherColumn(0, 0, 41, 67);
check("ore placement is deterministic", JSON.stringify(world.blocks) === firstPass, "");

// nothing structural may be replaced by an ore
check("ores never replace the bedrock floor", (() => {
    for (let i = 0; i < 400; i++) {
        world.blocks = {};
        ctx.buildNetherColumn(0, 0, i * 11, i * 17);
        if (world.blocks["0," + GEN.nether.floorY + ",0"] !== GEN.nether.blocks.floor) {
            return false;
        }
    }
    return true;
})(), "");

check("ores never replace the nether ceiling", (() => {
    for (let i = 0; i < 400; i++) {
        world.blocks = {};
        ctx.buildNetherColumn(0, 0, i * 11, i * 17);
        if (world.blocks["0," + GEN.nether.ceilingY + ",0"] !== GEN.nether.blocks.ceiling) {
            return false;
        }
    }
    return true;
})(), "");

check("ores never replace the end's surface layer", (() => {
    for (let i = 0; i < 400; i++) {
        world.blocks = {};
        ctx.buildEndColumn(0, 0, i * 11, i * 17);
        const keys = Object.keys(world.blocks);
        if (keys.length === 0) {
            continue;   // open void, nothing to check
        }
        // the highest non-pillar block in the column is the surface
        const ys = keys.map(k => parseInt(k.split(",")[1], 10))
            .filter(y => world.blocks["0," + y + ",0"] !== GEN.end.blocks.pillar);
        const topY = Math.max.apply(Math, ys);
        if (world.blocks["0," + topY + ",0"] !== GEN.end.blocks.top) {
            return false;
        }
    }
    return true;
})(), "");

// a deeper band means a rarer ore actually stays in its band
check("ores with a maxY stay below it", (() => {
    const capped = GEN.nether.ores.filter(o => o.maxY !== undefined);
    if (capped.length === 0) {
        return true;
    }
    for (let i = 0; i < 400; i++) {
        world.blocks = {};
        ctx.buildNetherColumn(0, 0, i * 11, i * 17);
        for (const k of Object.keys(world.blocks)) {
            const hit = capped.find(o => o.block === world.blocks[k]);
            if (hit && parseInt(k.split(",")[1], 10) > hit.maxY) {
                return false;
            }
        }
    }
    return true;
})(), "");

check("overworld chunks are never queued", (() => {
    world.pos.a = [0, 64, 0];
    ctx.stateOf("a").lastGenChunk = null;
    ctx.queueChunksAround("overworld", [0, 64, 0]);
    for (let i = 0; i < 200; i++) ctx.tick();
    return !Object.keys(genDone).some(k => k.indexOf("overworld:") === 0);
})(), Object.keys(genDone).join(" "));

// ------------------------------------------------------------ region geometry
// Regions claim a box of +/- regionHalfSize around their centre. If two claims
// ever overlap, dimensionAt returns whichever is listed first and the other
// dimension silently stops existing - so check every pair stays clear.
(() => {
    const half = C.dimensions.regionHalfSize;
    const names = Object.keys(C.dimensions.list);
    let clash = null;
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const a = C.dimensions.list[names[i]].origin;
            const b = C.dimensions.list[names[j]].origin;
            const apart = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
            if (apart < half * 2) {
                clash = names[i] + " and " + names[j] + " are only " + apart + " apart";
            }
        }
    }
    check("no two regions overlap", clash === null, clash || "");
})();

// every dimension also has to land back on itself: put a player at its centre
// and dimensionAt must name that same dimension
Object.keys(C.dimensions.list).forEach(key => {
    const o = C.dimensions.list[key].origin;
    check("a player at the centre of " + key + " is in " + key,
        ctx.dimensionAt([o[0], 64, o[1]]) === key, ctx.dimensionAt([o[0], 64, o[1]]));
});

// a round trip has to land you back where you started, from the far corner of
// the overworld's claim, for every dimension that has a portal
Object.keys(C.dimensions.list).filter(k => k !== "overworld").forEach(key => {
    const edge = C.dimensions.regionHalfSize - 1;
    world.pos.b = [edge, 64, edge];
    ctx.stateOf("b").dimension = "overworld";
    ctx.travelTo("b", key);
    const arrived = ctx.dimensionAt(world.pos.b);
    check("travelling to " + key + " from the overworld edge lands inside it",
        arrived === key, arrived + " at " + world.pos.b);
    ctx.travelTo("b", "overworld");
    check("coming back from " + key + " returns you to where you started",
        Math.abs(world.pos.b[0] - edge) < 1 && Math.abs(world.pos.b[2] - edge) < 1,
        world.pos.b);
});

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
