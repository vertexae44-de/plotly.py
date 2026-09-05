const { ctx, world, CONFIG: C, durabilityCache, genDone, genQueue, voidGuardians, npcTrades, pendingStrikes } = require("./harness.js");
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
check("mace recipe costs 400 moonstone",
    C.mace.recipe.some(r => r.items[0] === "Moonstone" && r.amt === 400), JSON.stringify(C.mace.recipe));
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

// -------------------------------------------------------------------- Hearts
// Craftable on top of kills and /withdraw - deliberately steep so a kill stays
// the cheap way to a heart.
check("Heart recipe registered", !!world.recipes.a[C.orb.item], Object.keys(world.recipes.a));
check("Heart recipe costs 4 blocks of diamond",
    C.orb.recipe.some(r => r.items[0] === "Block of Diamond" && r.amt === 4), JSON.stringify(C.orb.recipe));
check("Heart recipe costs 2 knight hearts",
    C.orb.recipe.some(r => r.items[0] === "Knight Heart" && r.amt === 2), JSON.stringify(C.orb.recipe));
check("Heart recipe costs 4 lunite",
    C.orb.recipe.some(r => r.items[0] === "Lunite" && r.amt === 4), JSON.stringify(C.orb.recipe));
check("a crafted Heart carries the orb tag and is worth one heart",
    world.recipes.a[C.orb.item][0].attributes.customAttributes.smpOrb === true
        && world.recipes.a[C.orb.item][0].attributes.customAttributes.hp === C.orb.hp,
    JSON.stringify(world.recipes.a[C.orb.item][0].attributes));

// ---------------------------------------------------------------- hang gliders
// All four gliders are real items with their own native recipes; this world
// overrides every one of them to the same steep cost.
check("all four gliders got a recipe registered",
    C.gliders.items.every(item => !!world.recipes.a[item]), Object.keys(world.recipes.a));
check("glider recipe costs 100 moonstone",
    C.gliders.recipe.some(r => r.items[0] === "Moonstone" && r.amt === 100), JSON.stringify(C.gliders.recipe));
check("glider recipe costs 30 diamond",
    C.gliders.recipe.some(r => r.items[0] === "Diamond" && r.amt === 30), JSON.stringify(C.gliders.recipe));
check("the same recipe object is reused for every glider tier",
    world.recipes.a["Wood Hang Glider"][0].requires === world.recipes.a["Diamond Hang Glider"][0].requires, "");
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

// -------------------------------------------------------------------- mending
check("mending spends Aura XP Potions, not a level stat", C.mending.item === "Aura XP Potion", C.mending.item);
check("mending has a splash variant", C.mending.splashItem === "Splash Aura XP Potion", C.mending.splashItem);

world.inv.a = [{ name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 100, smpDurMax: 400 } } }];
world.sel.a = 0;
ctx.playerCommand("a", "/mend");
check("with no potions, mend refuses", world.inv.a[0].attributes.customAttributes.smpDur === 100,
    world.inv.a[0].attributes.customAttributes.smpDur);

world.inv.a = [
    { name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 100, smpDurMax: 400 } } },
    { name: C.mending.item, amount: 3, attributes: undefined },
];
world.sel.a = 0;
ctx.playerCommand("a", "/mend");
check("mend restores a fraction of max durability",
    world.inv.a[0].attributes.customAttributes.smpDur === 100 + Math.round(400 * C.mending.restoreFraction),
    world.inv.a[0].attributes.customAttributes.smpDur);
check("mend consumes exactly costPerMend potions",
    world.inv.a[1].amount === 3 - C.mending.costPerMend, world.inv.a[1].amount);

world.inv.a[0].attributes.customAttributes.smpDur = 390;
ctx.playerCommand("a", "/mend");
check("mend never overshoots the max", world.inv.a[0].attributes.customAttributes.smpDur === 400,
    world.inv.a[0].attributes.customAttributes.smpDur);

const potionsBefore = world.inv.a[1].amount;
ctx.playerCommand("a", "/mend");
check("a full item does not spend a potion", world.inv.a[1].amount === potionsBefore, world.inv.a[1].amount);

world.inv.a = [{ name: "Dirt", amount: 5, attributes: undefined }, { name: C.mending.item, amount: 1, attributes: undefined }];
world.sel.a = 0;
ctx.playerCommand("a", "/mend");
check("an item with no durability cannot be mended", world.inv.a[1].amount === 1, world.inv.a[1].amount);

// /mend keeps the mace's bespoke tooltip in sync, via the shared withDurability helper
world.inv.a = [maceItem(), { name: C.mending.item, amount: 1, attributes: undefined }];
world.inv.a[0].attributes = ctx.maceAttributes(50);
world.sel.a = 0;
ctx.playerCommand("a", "/mend");
check("mending the mace keeps its Wind Burst tooltip",
    /Wind Burst/.test(world.inv.a[0].attributes.customDescription), world.inv.a[0].attributes.customDescription);
check("mending the mace still uses maceAttributes' durability",
    world.inv.a[0].attributes.customAttributes.smpDur === 50 + Math.round(C.mace.durability * C.mending.restoreFraction),
    world.inv.a[0].attributes.customAttributes.smpDur);

// Splash Aura XP Potion mends the off-hand slot instead of whatever is held
// (you are necessarily holding the potion itself when you throw it).
world.inv.a = [{ name: C.mending.item, amount: 5, attributes: undefined }];
world.inv.a[C.offhand.slotIndex] = { name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 100, smpDurMax: 400 } } };
world.sel.a = 0;
ctx.onPlayerUsedThrowable("a", C.mending.splashItem, "proj1");
check("a splash potion mends the off-hand item",
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur === 100 + Math.round(400 * C.mending.restoreFraction),
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur);
check("a splash potion is consumed", world.inv.a[0].amount === 5 - C.mending.costPerMend, world.inv.a[0].amount);

world.inv.a = [{ name: C.mending.item, amount: 5, attributes: undefined }];
ctx.onPlayerUsedThrowable("a", "Splash Aura XP Potion II", "proj2");
check("a different throwable does not trigger mending", world.inv.a[0].amount === 5, world.inv.a[0].amount);

// ---------------------------------------------------------------------- shield
check("shield is a real Bloxd item, not a fake one", C.shield.item === "Brown Paintball", C.shield.item);
check("the shield is not built on a native throwable",
    C.shield.item.indexOf("Explosive") === -1, C.shield.item);
check("shield is renamed", C.shield.name === "Shield", C.shield.name);
check("shield is craftable", !!world.recipes.a[C.shield.item], Object.keys(world.recipes.a));
check("crafted shields carry their tag",
    world.recipes.a[C.shield.item][0].attributes.customAttributes.smpShield === true, "");

const shieldItem = (dur) => ({ name: C.shield.item, amount: null, attributes: ctx.shieldAttributes(dur) });

// Holding a shield in your main hand does nothing at all any more - blocking
// belongs entirely to the off-hand + crouching.
world.meshAttachments.a = undefined;
world.opts.a.headerChips = [];
world.shield.a = 0;
world.crouching.a = false;
world.sel.a = 0;
world.inv.a = [shieldItem(C.shield.durability)];
ctx.tick();
check("a held (not off-hand) shield never shows on the arm", world.meshAttachments.a == null, "");
const heldOnlyDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a held (not off-hand) shield blocks nothing", heldOnlyDmg === undefined, heldOnlyDmg);

// ------------------------------------------------------- off-hand + crouch shield
// The only way a shield ever guards: sitting in the off-hand slot AND crouching.
world.meshAttachments.a = undefined;
world.opts.a.headerChips = [];
world.shield.a = 0;
world.crouching.a = false;
world.sel.a = 5;   // main hand is a different, unrelated slot
world.inv.a = [];
world.inv.a[C.offhand.slotIndex] = shieldItem(C.shield.durability);
world.inv.a[5] = { name: "Iron Sword", amount: null, attributes: undefined };
ctx.tick();
check("parking a shield off-hand shows it on the arm even before crouching",
    world.meshAttachments.a && world.meshAttachments.a.node === C.shield.armNode, "");
check("not crouching means the HUD says lowered, not blocking",
    world.opts.a.headerChips[0] === C.shield.hudChipLowered,
    JSON.stringify(world.opts.a.headerChips));
const notCrouchingDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("an off-hand shield without crouching blocks nothing",
    notCrouchingDmg === undefined, notCrouchingDmg);

world.crouching.a = true;
ctx.tick();
check("off-hand + crouching tops up the numeric shield",
    world.shield.a === C.shield.raiseShieldAmount, world.shield.a);
check("off-hand + crouching says BLOCKING in the HUD",
    world.opts.a.headerChips[0] === C.shield.hudChipBlocking,
    JSON.stringify(world.opts.a.headerChips));

const offhandShieldBefore = world.shield.a;
world.sounds.length = 0; world.log.length = 0;
const offhandBlockedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("crouching with an off-hand shield blocks damage while a different weapon is held",
    offhandBlockedDmg === Math.round(20 * (1 - C.shield.blockFraction)), offhandBlockedDmg);
check("blocking drains the numeric shield, not just absorbing for free",
    world.shield.a < offhandShieldBefore, world.shield.a);
check("blocking wears the off-hand shield, not the held weapon",
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur
        === C.shield.durability - C.shield.blockDurabilityCost,
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur);
check("an actual block plays a sound everyone nearby can hear, not just a silent number change",
    world.sounds.some(s => s.soundName === "hit2"), JSON.stringify(world.sounds));
check("an actual block flashes a crosshair message too",
    world.log.some(l => l.indexOf("Blocked!") !== -1), JSON.stringify(world.log));

// standing back up drops the guard immediately, even mid-fight
world.crouching.a = false;
const standUpDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("standing up stops blocking", standUpDmg === undefined, standUpDmg);
world.crouching.a = true;
ctx.tick();

// running out of shield charge stops blocking, but tick() recharges it every
// tick you are still guarding - this is the actual fix for the shield having
// silently stopped working: it used to only top up on the moment it was seated.
world.shield.a = 0;
const emptyChargeDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a momentarily empty shield resource blocks nothing that instant",
    emptyChargeDmg === undefined, emptyChargeDmg);
ctx.tick();
check("guarding recharges the shield resource every tick, not just once",
    world.shield.a === C.shield.raiseShieldAmount, world.shield.a);
const rechargedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("after recharging, the shield blocks again",
    rechargedDmg === Math.round(20 * (1 - C.shield.blockFraction)), rechargedDmg);

// -------------------------------------------------- axe/mace disables the shield
// Same trade Minecraft gives an axe against a shield: a blocked hit from an
// axe or a mace knocks the guard down entirely for a few seconds, rather
// than just being absorbed like any other weapon.
world.crouching.a = true;
ctx.tick();
world.shield.a = C.shield.raiseShieldAmount;
world.inv.b = [{ name: "Iron Sword", amount: null, attributes: undefined }];
world.sel.b = 0;
const swordBlockedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a sword hit still just gets absorbed", swordBlockedDmg === Math.round(20 * (1 - C.shield.blockFraction)), swordBlockedDmg);
check("a sword hit never disables the shield", ctx.shieldGuarding("a") === true, "");

world.shield.a = C.shield.raiseShieldAmount;
world.inv.b = [{ name: "Iron Axe", amount: null, attributes: undefined }];
world.sel.b = 0;
ctx.stateOf("a").shieldDisabledUntil = 0;
const axeBlockedDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("an axe hit still lands reduced, the first time", axeBlockedDmg === Math.round(20 * (1 - C.shield.blockFraction)), axeBlockedDmg);
check("an axe hit disables the shield", ctx.shieldGuarding("a") === false, "");
check("a disabled shield's resource is zeroed", world.shield.a === 0, world.shield.a);

const axeFollowUpDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a disabled shield blocks nothing while still crouched with it out",
    axeFollowUpDmg === undefined, axeFollowUpDmg);

ctx.stateOf("a").shieldDisabledUntil = 0;   // simulate the disable window passing
ctx.tick();
check("the shield guards again once the disable window passes", ctx.shieldGuarding("a") === true, "");

world.shield.a = C.shield.raiseShieldAmount;
world.inv.b = [{ name: "Moonstone Mace", amount: null, attributes: ctx.maceAttributes(C.mace.durability) }];
world.sel.b = 0;
ctx.stateOf("b").fallDistance = 0;
ctx.stateOf("a").shieldDisabledUntil = 0;
ctx.onPlayerDamagingOtherPlayer("b", "a", 20);
check("a mace hit also disables the shield, plain or Moonstone", ctx.shieldGuarding("a") === false, "");

ctx.stateOf("a").shieldDisabledUntil = 0;
world.crouching.a = false;
world.inv.b = [{ name: "Iron Sword", amount: null, attributes: undefined }];
world.sel.b = 0;

// putting the shield away entirely is what actually clears the arm
world.inv.a[C.offhand.slotIndex] = null;
ctx.tick();
check("removing the off-hand shield clears the flag",
    ctx.stateOf("a").offhandShieldOn === false, "");
check("removing the off-hand shield detaches the mesh", world.meshAttachments.a === null, "");
check("removing the off-hand shield clears the shield HUD chip",
    world.opts.a.headerChips.indexOf(C.shield.hudChipBlocking) === -1
        && world.opts.a.headerChips.indexOf(C.shield.hudChipLowered) === -1,
    JSON.stringify(world.opts.a.headerChips));
world.sel.a = 0;
world.crouching.a = false;

// ---------------------------------------------------- shield writes on a dead player
// setShieldAmount rejects a lifeform that isn't alive right now (mid-death, on the
// respawn screen, already kicked). That window is real: a fatal hit or a tick can
// land on it, so every write to the shield resource must check first instead of
// letting the engine throw.
{
    world.alive.a = false;
    check("isAlive reflects a dead player", ctx.isAlive("a") === false, "");

    world.shield.a = 0;
    ctx.topUpShield("a");
    check("topUpShield is a no-op on a dead player", world.shield.a === 0, world.shield.a);

    const blocked = ctx.applyShieldAbsorption("a", null, 20);
    check("applyShieldAbsorption passes damage through unblocked for a dead defender",
        blocked === 20, blocked);
    check("applyShieldAbsorption never touches the shield resource of a dead defender",
        world.shield.a === 0, world.shield.a);

    world.alive.a = true;
    check("isAlive recovers once the player is alive again", ctx.isAlive("a") === true, "");
}

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

// /offhand moves a shield there too, and it only guards once crouching as well
world.inv.a = [];
world.sel.a = 3;
world.inv.a[3] = shieldItem(C.shield.durability);
world.crouching.a = false;
ctx.playerCommand("a", "/offhand");
check("/offhand puts a shield in the off-hand from chat too",
    world.inv.a[OFF] && world.inv.a[OFF].attributes.customAttributes.smpShield === true,
    JSON.stringify(world.inv.a[OFF]));
check("/offhand frees your main hand for a weapon", world.inv.a[3] === null, "");
ctx.tick();
check("a shield off-handed by /offhand is not guarding until crouched",
    ctx.stateOf("a").offhandShieldOn === true && !ctx.shieldGuarding("a"), "");
world.crouching.a = true;
ctx.tick();
check("crouching with it makes shieldGuarding true", ctx.shieldGuarding("a") === true, "");

// right-clicking a held (not off-hand) shield does nothing at all now
world.crouching.a = false;
world.inv.a = [];
world.sel.a = 3;
world.inv.a[3] = shieldItem(C.shield.durability);
world.shield.a = 0;
ctx.onPlayerAltAction("a");
check("right-clicking a held shield never moves it",
    world.inv.a[3] && world.inv.a[3].attributes.customAttributes.smpShield === true,
    JSON.stringify(world.inv.a[3]));
check("right-clicking a held shield puts nothing in the off-hand", !world.inv.a[OFF], "");
check("right-clicking a held shield never tops up the shield resource",
    world.shield.a === 0, world.shield.a);

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
check("gold hang glider has durability, same materials/kinds formula as everything else",
    durOf("Gold Hang Glider") === Math.round(90 * C.durability.kinds.Glider), durOf("Gold Hang Glider"));

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

// the Void generates dark, cracked platforms to stand on - no orbs in the
// terrain any more, those only ever come from slain guardians now
world.blocks = {};
let solidCount = 0;
for (let i = 0; i < 4000; i++) {
    world.blocks = {};
    ctx.buildVoidColumn(0, 0, (i % 80) - 40, ((i / 80) | 0) - 25);
    const vals = Object.keys(world.blocks).map(k => world.blocks[k]);
    if (vals.length) solidCount++;
}
check("the Void has platforms to stand on", solidCount > 0, solidCount);
check("the Void is mostly empty", solidCount < 4000 * 0.5, solidCount);
check("the Void has no portal out", VOID.portalBlock === undefined, VOID.portalBlock);

// killing a void guardian is the only source of an Orb of Resurrection
world.inv.a = [];
voidGuardians["guardTest1"] = true;
world.mobs.push("guardTest1");
ctx.onPlayerKilledMob("a", "guardTest1", 20, "Iron Sword");
check("slaying a tagged guardian gives a resurrection orb",
    world.inv.a.some(s => s && s.name === C.resurrection.item), JSON.stringify(world.inv.a));
check("a slain guardian is untagged so it cannot pay out twice",
    voidGuardians["guardTest1"] === undefined, "");

world.inv.a = [];
ctx.onPlayerKilledMob("a", "someRandomMob", 20, "Iron Sword");
check("killing an ordinary mob gives no orb",
    !world.inv.a.some(s => s && s.name === C.resurrection.item), JSON.stringify(world.inv.a));

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

// ------------------------------------------------------------ durability HUD chip
// A second, always-visible readout in the top-left HUD strip - separate from
// the bar already in the tooltip - for whatever is currently HELD. Bloxd's API
// exposes no way to read the armour slots, so worn gear can never show here.
world.inv.a = [{ name: "Iron Sword", amount: null, attributes: ctx.withDurability(
    { name: "Iron Sword" }, {}, 125, 250) }];
world.sel.a = 0;
world.opts.a.headerChips = [];
ctx.refreshHudChips("a");
check("holding a durable item shows a HUD durability chip",
    world.opts.a.headerChips.some(c => c.indexOf("Iron Sword") !== -1 && c.indexOf(C.durability.hudBar.icon) === 0),
    JSON.stringify(world.opts.a.headerChips));
check("the HUD durability chip reflects the item's actual wear",
    (world.opts.a.headerChips[0].match(/\u25B0/g) || []).length === Math.round(0.5 * C.durability.hudBar.segments),
    world.opts.a.headerChips[0]);

world.inv.a = [{ name: "Aura XP Orb", amount: null, attributes: undefined }];
ctx.refreshHudChips("a");
check("a non-durable held item shows no durability chip",
    world.opts.a.headerChips.length === 0, JSON.stringify(world.opts.a.headerChips));

world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
world.inv.a[C.offhand.slotIndex] = shieldItem(C.shield.durability);
ctx.stateOf("a").offhandShieldOn = true;
world.crouching.a = true;
world.shield.a = C.shield.raiseShieldAmount;
world.opts.a.headerChips = [];
ctx.refreshHudChips("a");
check("the shield chip and the held item's own durability chip can both show at once",
    world.opts.a.headerChips.length === 2
        && world.opts.a.headerChips[0] === C.shield.hudChipBlocking
        && world.opts.a.headerChips[1].indexOf("Sword") !== -1,
    JSON.stringify(world.opts.a.headerChips));
world.crouching.a = false;
world.inv.a = [];
world.opts.a.headerChips = [];

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
world.pos.a = [NDIM.originX, 60, NDIM.originZ];
ctx.stateOf("a").dimension = null;
ctx.stateOf("a").lastGenChunk = null;
const markerKey = NDIM.originX + "," + GEN.markerY + "," + NDIM.originZ;
let genTicks = 0;
while (genTicks < 3000 && world.blocks[markerKey] !== GEN.markerBlock) {
    ctx.tick();
    genTicks++;
}
const nAt = y => world.blocks[NDIM.originX + "," + y + "," + NDIM.originZ];
check("nether chunk generates", genTicks < 3000, genTicks + " ticks");
check("nether has a bedrock floor", nAt(GEN.nether.floorY) === GEN.nether.blocks.floor, nAt(GEN.nether.floorY));
check("nether has a ceiling", nAt(GEN.nether.ceilingY) === GEN.nether.blocks.ceiling, nAt(GEN.nether.ceilingY));
check("nether has a lava sea", nAt(GEN.nether.lavaLevel) === GEN.nether.blocks.liquid, nAt(GEN.nether.lavaLevel));
check("chunk is marked generated",
    ctx.chunkGenerated("nether", NDIM.originX / GEN.chunkSize, NDIM.originZ / GEN.chunkSize), "");
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
world.pos.a = [EDIM.originX, 60, EDIM.originZ];
ctx.stateOf("a").dimension = null;
ctx.stateOf("a").lastGenChunk = null;
const endMarkerKey = EDIM.originX + "," + GEN.markerY + "," + EDIM.originZ;
let endTicks = 0;
while (endTicks < 3000 && world.blocks[endMarkerKey] !== GEN.markerBlock) {
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
        ctx.buildEndColumn(0, 0, 0, 0);
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
        build(i, 0, seedX + i, seedZ + i * 3, 0);
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
// Dimensions claim a square of +/- regionHalfSize around their own X/Z origin
// now - the layout that was tested and confirmed working in-game, restored
// after the Y-banded version silently failed (Void never generated, Nether/
// End arrivals fell through - Bloxd's real buildable range does not reach as
// deep as assumed). If two regions ever overlap, dimensionAt returns
// whichever is listed first and the other dimension silently stops existing -
// so check every pair stays clear.
(() => {
    const half = C.dimensions.regionHalfSize;
    const names = Object.keys(C.dimensions.list).filter(k => C.dimensions.list[k].originX != null);
    let clash = null;
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const a = C.dimensions.list[names[i]];
            const b = C.dimensions.list[names[j]];
            const apartX = Math.abs(a.originX - b.originX);
            const apartZ = Math.abs(a.originZ - b.originZ);
            if (apartX < half * 2 && apartZ < half * 2) {
                clash = names[i] + " and " + names[j] + " overlap";
            }
        }
    }
    check("no two dimension regions overlap", clash === null, clash || "");
})();

// every dimension also has to land back on itself: put a player at its
// origin and dimensionAt must name that same dimension
Object.keys(C.dimensions.list).forEach(key => {
    const d = C.dimensions.list[key];
    if (d.originX == null) {
        return;   // the overworld has no fixed region to test this way
    }
    const pos = [d.originX, 60, d.originZ];
    check("a player at the origin of " + key + " is in " + key,
        ctx.dimensionAt(pos) === key, ctx.dimensionAt(pos));
});

// a round trip has to land you back at the same x/y/z you left, for every
// dimension that has a portal
Object.keys(C.dimensions.list).filter(k => k !== "overworld").forEach(key => {
    const d = C.dimensions.list[key];
    const startPos = [321, 77, 654];   // an arbitrary overworld position, nowhere near any region
    world.pos.b = startPos.slice();
    ctx.stateOf("b").dimension = "overworld";
    ctx.stateOf("b").overworldPos = undefined;
    ctx.travelTo("b", key);
    const arrived = ctx.dimensionAt(world.pos.b);
    check("travelling to " + key + " from the overworld lands inside it",
        arrived === key, arrived + " at " + world.pos.b);
    check("arriving in " + key + " lands at its origin",
        world.pos.b[0] === d.originX && world.pos.b[2] === d.originZ, world.pos.b);
    ctx.travelTo("b", "overworld");
    check("coming back from " + key + " returns you to where you left",
        world.pos.b[0] === startPos[0] && world.pos.b[1] === startPos[1] && world.pos.b[2] === startPos[2],
        world.pos.b);
});

// ------------------------------------------------------------------ dimension look
check("nether fog is red", /^#[6-9a-f]/.test(NDIM.clientOptions.fogColourOverride), NDIM.clientOptions.fogColourOverride);
check("end fog is purple", EDIM.clientOptions.fogColourOverride === "#2e0f52", EDIM.clientOptions.fogColourOverride);

// every dimension that dresses the world has to set BOTH fog options, or the
// colour lands with the default draw distance and the effect is invisible
check("every dimension sets a fog colour and a fog distance", (() => {
    for (const key of Object.keys(C.dimensions.list)) {
        const o = C.dimensions.list[key].clientOptions || {};
        if (Object.keys(o).length === 0) {
            continue;   // the overworld deliberately dresses nothing
        }
        if (!o.fogColourOverride || typeof o.fogChunkDistanceOverride !== "number") {
            return false;
        }
    }
    return true;
})(), "");

// and the fog has to actually reach the player when they arrive
world.pos.b = [NDIM.originX, 64, NDIM.originZ];
ctx.stateOf("b").dimension = null;
ctx.enterDimension("b", "nether", false);
check("arriving in the nether pushes its fog colour to the client",
    world.opts.b.fogColourOverride === NDIM.clientOptions.fogColourOverride,
    world.opts.b.fogColourOverride);
check("arriving in the nether pushes its fog distance too",
    world.opts.b.fogChunkDistanceOverride === NDIM.clientOptions.fogChunkDistanceOverride,
    world.opts.b.fogChunkDistanceOverride);

ctx.enterDimension("b", "end", false);
check("moving to the end swaps the fog rather than stacking it",
    world.opts.b.fogColourOverride === EDIM.clientOptions.fogColourOverride,
    world.opts.b.fogColourOverride);

ctx.enterDimension("b", "overworld", false);
check("going home clears the fog back to the client's own setting",
    world.opts.b.fogColourOverride === "DEFAULT" && world.opts.b.fogChunkDistanceOverride === "DEFAULT",
    world.opts.b.fogColourOverride + "/" + world.opts.b.fogChunkDistanceOverride);

// ---------------------------------------------------------------- block palette
check("the nether is built from dark red stone",
    GEN.nether.blocks.base === "Dark Red Stone" && GEN.nether.blocks.top === "Dark Red Stone",
    GEN.nether.blocks.base + "/" + GEN.nether.blocks.top);
check("the end is built from yellowstone",
    GEN.end.blocks.base === "Yellowstone" && GEN.end.blocks.top === "Yellowstone",
    GEN.end.blocks.base + "/" + GEN.end.blocks.top);

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
const invisEffect = () => world.effects.filter(e => e.id === "a" && e.name === "Invisible");
check("going anonymous makes you invisible", invisEffect().length === 1,
    JSON.stringify(world.effects));
check("the invisibility does not time out", invisEffect()[0].ms === null,
    JSON.stringify(invisEffect()[0]));
world.log.length = 0;
check("anon chat is suppressed", ctx.onPlayerChat("a", "hello there", "global") === false, "");
check("anon chat is rebroadcast without the name",
    world.log.some(l => l.indexOf("bcast " + C.anonymous.displayName + ": hello there") === 0), JSON.stringify(world.log));
check("anon chat never leaks the real name", !world.log.some(l => /Alice/.test(l)), JSON.stringify(world.log));
check("a normal player's chat is untouched", ctx.onPlayerChat("b", "hi", "global") === undefined, "");
check("!anon toggles back off", ctx.onPlayerChat("a", "!anon", "global") === false, "");
check("anon flag cleared", world.db.a.smpAnon === 0, world.db.a.smpAnon);
check("nametag restored", world.entitySettings.a.nameTagInfo === null, JSON.stringify(world.entitySettings.a));
check("revealing yourself makes you visible again", invisEffect().length === 0,
    JSON.stringify(world.effects));
check("chat is normal again", ctx.onPlayerChat("a", "hello", "global") === undefined, "");

// A hidden body must not carry a visible shield: a box hanging in mid-air where
// an invisible player stands defeats the whole point of going anonymous. Their
// own HUD chip is on their screen only, so that stays.
world.inv.a = [];
world.inv.a[C.offhand.slotIndex] = shieldItem(C.shield.durability);
world.sel.a = 5;
world.crouching.a = true;
ctx.onPlayerChat("a", "!anon", "global");
world.meshAttachments.a = undefined;
world.opts.a.headerChips = [];
ctx.tick();
check("an invisible player's shield is not drawn on their arm",
    world.meshAttachments.a === null, JSON.stringify(world.meshAttachments.a));
check("an invisible player still sees their own shield chip",
    world.opts.a.headerChips[0] === C.shield.hudChipBlocking,
    JSON.stringify(world.opts.a.headerChips));
ctx.onPlayerChat("a", "!anon", "global");
ctx.tick();
check("becoming visible again puts the shield back on the arm",
    world.meshAttachments.a && world.meshAttachments.a.node === C.shield.armNode,
    JSON.stringify(world.meshAttachments.a));
world.inv.a = [];
world.sel.a = 0;
world.crouching.a = false;
ctx.tick();
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
world.pos.b = [C.dimensions.list["void"].originX, 64, C.dimensions.list["void"].originZ];
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
check("invisibility survives a rejoin",
    world.effects.some(e => e.id === "a" && e.name === "Invisible"), JSON.stringify(world.effects));
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

// ------------------------------------------------------------------- dagger
check("dagger is a real Bloxd item", C.dagger.item === "Moonstone Dagger", C.dagger.item);
check("dagger recipe costs 5 rotten flesh",
    C.dagger.recipe.some(r => r.items[0] === "Rotten Flesh" && r.amt === 5), JSON.stringify(C.dagger.recipe));
check("dagger recipe costs 90 moonstone",
    C.dagger.recipe.some(r => r.items[0] === "Moonstone" && r.amt === 90), "");
check("dagger recipe costs 4 sticks",
    C.dagger.recipe.some(r => r.items[0] === "Stick" && r.amt === 4), "");
check("dagger is craftable", !!world.recipes.a[C.dagger.item], Object.keys(world.recipes.a));
check("crafted daggers carry their tag",
    world.recipes.a[C.dagger.item][0].attributes.customAttributes.smpDagger === true, "");

world.inv.b = [{ name: C.dagger.item, amount: null, attributes: ctx.daggerAttributes() }];
world.sel.b = 0;
world.alive.a = true;
world.effects.length = 0;
ctx.onPlayerDamagingOtherPlayer("b", "a", 10);
check("a dagger hit poisons the target",
    world.effects.some(e => e.id === "a" && e.name === "Poisoned" && e.ms === C.dagger.poisonMs),
    JSON.stringify(world.effects));
check("a dagger hit wears the dagger",
    world.inv.b[0].attributes.customAttributes.smpDur === durOf(C.dagger.item) - C.durability.costPerHit,
    world.inv.b[0].attributes.customAttributes.smpDur);

// --------------------------------------------------------------- plain maces
check("all five plain mace tiers are configured",
    C.plainMaces.tiers.map(t => t.item).join(",")
        === "Wood Mace,Stone Mace,Iron Mace,Gold Mace,Diamond Mace",
    C.plainMaces.tiers.map(t => t.item).join(","));
C.plainMaces.tiers.forEach(tier => {
    check(tier.item + " is craftable", !!world.recipes.a[tier.item], Object.keys(world.recipes.a));
    check(tier.item + " carries no smash tag (it is plain)",
        !world.recipes.a[tier.item][0].attributes.customAttributes
            || world.recipes.a[tier.item][0].attributes.customAttributes.smpMace === undefined, "");
});

world.inv.b = [{ name: "Iron Mace", amount: null, attributes: ctx.plainDurableAttributes("Iron Mace") }];
world.sel.b = 0;
world.pos.a = [0, 64, 0]; world.pos.b = [1, 64, 0];
ctx.stateOf("b").fallDistance = 0;   // no smash bonus without ATTR_MACE anyway
const plainMaceDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 10);
check("a plain mace does not get the smash bonus", plainMaceDmg === undefined, plainMaceDmg);
check("a plain mace still wears down",
    world.inv.b[0].attributes.customAttributes.smpDur === durOf("Iron Mace") - C.durability.costPerHit,
    world.inv.b[0].attributes.customAttributes.smpDur);

// ------------------------------------------------------------- plain daggers
check("all five plain dagger tiers are configured",
    C.plainDaggers.tiers.map(t => t.item).join(",")
        === "Wood Dagger,Stone Dagger,Iron Dagger,Gold Dagger,Diamond Dagger",
    C.plainDaggers.tiers.map(t => t.item).join(","));
C.plainDaggers.tiers.forEach(tier => {
    check(tier.item + " is craftable", !!world.recipes.a[tier.item], Object.keys(world.recipes.a));
    check(tier.item + " carries no poison tag (it is plain)",
        !world.recipes.a[tier.item][0].attributes.customAttributes
            || world.recipes.a[tier.item][0].attributes.customAttributes.smpDagger === undefined, "");
});
check("plain daggers cost half of the matching plain mace tier", (() => {
    return C.plainDaggers.tiers.every((tier, i) => {
        const mace = C.plainMaces.tiers[i];
        return tier.recipe[0].amt === mace.recipe[0].amt / 2 && tier.recipe[1].amt === mace.recipe[1].amt / 2;
    });
})(), JSON.stringify(C.plainDaggers.tiers));

world.inv.b = [{ name: "Iron Dagger", amount: null, attributes: ctx.plainDurableAttributes("Iron Dagger") }];
world.sel.b = 0;
world.effects.length = 0;
const plainDaggerDmg = ctx.onPlayerDamagingOtherPlayer("b", "a", 10);
check("a plain dagger does not poison", !world.effects.some(e => e.name === "Poisoned"), JSON.stringify(world.effects));
check("a plain dagger still wears down",
    world.inv.b[0].attributes.customAttributes.smpDur === durOf("Iron Dagger") - C.durability.costPerHit,
    world.inv.b[0].attributes.customAttributes.smpDur);

// -------------------------------------------------------------- reforge (attribute swap)
world.inv.a = [{ name: "Iron Sword", amount: null, attributes: { customAttributes: { smpDur: 10, smpDurMax: 250 } } }];
world.inv.a[C.offhand.slotIndex] = { name: "Gold Sword", amount: null, attributes: { customAttributes: { smpDur: 200, smpDurMax: 250 } } };
world.sel.a = 0;
ctx.playerCommand("a", "/reforge");
check("reforge swaps the held item's attributes onto the off-hand item",
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur === 10,
    world.inv.a[C.offhand.slotIndex].attributes.customAttributes.smpDur);
check("reforge swaps the off-hand item's attributes onto the held item",
    world.inv.a[0].attributes.customAttributes.smpDur === 200,
    world.inv.a[0].attributes.customAttributes.smpDur);
check("reforge never changes either item's base name",
    world.inv.a[0].name === "Iron Sword" && world.inv.a[C.offhand.slotIndex].name === "Gold Sword", "");

world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
world.inv.a[C.offhand.slotIndex] = null;
check("reforge with nothing in the off-hand does nothing",
    ctx.playerCommand("a", "/reforge") === true && world.inv.a[0].name === "Iron Sword", "");

// -------------------------------------------------------------- glider durability
check("gliders are given durability attributes when crafted",
    typeof world.recipes.a["Diamond Hang Glider"][0].attributes.customAttributes.smpDurMax === "number",
    JSON.stringify(world.recipes.a["Diamond Hang Glider"][0].attributes));

world.inv.a = [{ name: "Diamond Hang Glider", amount: null, attributes: ctx.gliderAttributes("Diamond Hang Glider") }];
world.sel.a = 0;
const gliderMaxDur = durOf("Diamond Hang Glider");
ctx.onPlayerEnteredVehicle("a");
check("mounting while holding a glider wears it",
    world.inv.a[0].attributes.customAttributes.smpDur === gliderMaxDur - C.durability.gliderWearPerFlight,
    world.inv.a[0].attributes.customAttributes.smpDur);

world.inv.a = [{ name: "Iron Sword", amount: null, attributes: undefined }];
world.sel.a = 0;
ctx.onPlayerEnteredVehicle("a");
check("mounting while holding something else does not touch it",
    world.inv.a[0].attributes === undefined, JSON.stringify(world.inv.a[0]));

// ------------------------------------------------------------------- villagers
check("villagers use the real NPC mob type", C.npc.mobType === "NPC", C.npc.mobType);
check("villager skins are all real NPC variations",
    C.npc.variations.every(v => ["default", "emma", "leo", "isabel", "sanjay", "imara", "enoch", "sara", "carmen"].indexOf(v) !== -1),
    JSON.stringify(C.npc.variations));
check("world init spawned the configured number of villagers",
    world.spawnedMobs.filter(m => m.mobType === "NPC").length === C.npc.countInOverworld,
    world.spawnedMobs.filter(m => m.mobType === "NPC").length);

const someNpcId = Object.keys(npcTrades)[0];
check("every spawned villager was assigned a trade", !!someNpcId, "");
const trade = npcTrades[someNpcId];
world.inv.a = [{ name: trade.want, amount: trade.wantAmt, attributes: undefined }];
ctx.onPlayerClick("a", true, 0, 0, 0, "Air", someNpcId);
check("right-clicking a villager with enough items trades",
    world.inv.a.some(s => s && s.name === trade.give), JSON.stringify(world.inv.a));

world.inv.a = [];
ctx.onPlayerClick("a", true, 0, 0, 0, "Air", someNpcId);
check("trading with too few items gives nothing", world.inv.a.length === 0, JSON.stringify(world.inv.a));

world.inv.a = [{ name: trade.want, amount: trade.wantAmt, attributes: undefined }];
ctx.onPlayerClick("a", false, 0, 0, 0, "Air", someNpcId);
check("a left click on a villager does not trade", world.inv.a.length === 1, JSON.stringify(world.inv.a));

check("ocean sea mobs were spawned since Bloxd has no native sea creature",
    world.spawnedMobs.filter(m => m.mobType === C.ocean.seaMob.mobType).length >= C.ocean.seaMob.countPerRing,
    world.spawnedMobs.filter(m => m.mobType === C.ocean.seaMob.mobType).length);

// ------------------------------------------------------------------- bed spawn
world.db.a.smpSpawnPos = undefined;
ctx.onBlockStandStart("a", 5, 64, 5, "Red Bed");
check("standing on a bed records a spawn point",
    world.db.a.smpSpawnPos === JSON.stringify([5, 64, 5]), world.db.a.smpSpawnPos);
check("standing on unrelated blocks does not", (() => {
    world.db.a.smpSpawnPos = undefined;
    ctx.onBlockStandStart("a", 1, 64, 1, "Stone");
    return world.db.a.smpSpawnPos === undefined;
})(), world.db.a.smpSpawnPos);

check("isBedBlock matches every colour and the head half",
    ctx.isBedBlock("White Bed") && ctx.isBedBlock("_Black Bed Head") && ctx.isBedBlock("Purple Strongbed"), "");
check("isBedBlock does not match unrelated blocks",
    !ctx.isBedBlock("Stone") && !ctx.isBedBlock("Bedrock"), "");

world.db.a.smpSpawnPos = JSON.stringify([7, 70, 7]);
const respawnPos = ctx.onRespawnRequest("a");
check("respawn uses the recorded bed position", JSON.stringify(respawnPos) === JSON.stringify([7, 70, 7]), respawnPos);

world.db.b.smpSpawnPos = undefined;
const fallbackPos = ctx.onRespawnRequest("b");
check("respawn falls back to the Overworld position with no bed set",
    JSON.stringify(fallbackPos) === JSON.stringify(C.dimensions.overworldFallbackPos), fallbackPos);

// ----------------------------------------------------- Orbital Strike Cannon & Stabshot
check("orbital cannon substitutes a real explosive item for the nonexistent TNT",
    C.orbital.recipe.some(r => r.items[0] === "Moonstone Explosive" && r.amt === 500),
    JSON.stringify(C.orbital.recipe));
check("orbital cannon is not built on a fishing rod (native casting swallows the click)",
    C.orbital.item === "Ammo", C.orbital.item);
check("stabshot is not built on a fishing rod either",
    C.stabshot.item === "Bone", C.stabshot.item);
check("orbital cannon is not built on a common crafting material either (a plain stack of it "
    + "could merge with the tagged one and swallow its custom attributes)",
    ["Iron Bar", "Gold Bar", "Moonstone", "Stick", "Stone", "Diamond"].indexOf(C.orbital.item) === -1,
    C.orbital.item);
check("stabshot is not built on a common crafting material either",
    ["Iron Bar", "Gold Bar", "Moonstone", "Stick", "Stone", "Diamond"].indexOf(C.stabshot.item) === -1,
    C.stabshot.item);
check("the orbital and stabshot launchers are not the same item as each other",
    C.orbital.item !== C.stabshot.item, C.orbital.item);
check("orbital charges are the real Moonstone Explosive block",
    C.orbital.explosiveItem === "Moonstone Explosive", C.orbital.explosiveItem);
check("stabshot charges are the real Super RPG item",
    C.stabshot.explosiveItem === "Super RPG", C.stabshot.explosiveItem);
check("stabshot recipe costs 1 gold bow, 250 knight hearts, 230 explosives", (() => {
    const r = C.stabshot.recipe;
    return r.some(x => x.items[0] === "Gold Bow" && x.amt === 1)
        && r.some(x => x.items[0] === "Knight Heart" && x.amt === 250)
        && r.some(x => x.items[0] === "Moonstone Explosive" && x.amt === 230);
})(), JSON.stringify(C.stabshot.recipe));

// The orbital rings the ground with charges 50 blocks out from the aim
// point, each one a real falling Moonstone Explosive item drop.
world.inv.a = [{ name: C.orbital.item, amount: null, attributes: ctx.orbitalAttributes() }];
world.sel.a = 0;
world.pos.a = [0, 64, 0];
world.targetInfo.a = { position: [0, 64, 0] };
// Ring point 0 (angle 0) lands at [centre.x + ringRadius, centre.y, centre.z]
// when the world is empty (findGroundY finds no floor and falls back to the
// aim point's own height) - put "b" exactly there.
world.pos.b = [C.orbital.ringRadius, 64, 0];
pendingStrikes.length = 0;
world.drops.length = 0;
ctx.onPlayerAltAction("a");
check("firing the orbital cannon breaks it immediately", world.inv.a[0] === null, JSON.stringify(world.inv.a[0]));
check("firing the orbital cannon queues one charge per ring point",
    pendingStrikes.length === C.orbital.ringCount, pendingStrikes.length);
check("firing the orbital cannon drops a real Moonstone Explosive per ring charge",
    world.drops.filter(d => d.name === C.orbital.explosiveItem).length === C.orbital.ringCount,
    world.drops.length);

world.damages.length = 0;
ctx.processPendingStrikes();
check("no orbital charge lands before its fall delay", world.damages.length === 0, world.damages.length);
pendingStrikes.forEach(s => { s.fireAt = -1; });   // force them all due, since api.now() is real wall-clock time in tests
ctx.processPendingStrikes();
check("an orbital charge lands on the ring and hits whoever is there",
    world.damages.some(d => d.hitEId === "b"), JSON.stringify(world.damages));
check("every orbital charge is cleared from the queue once due", pendingStrikes.length === 0, pendingStrikes.length);

// The stabshot drills one shaft of charges straight down to bedrock and is
// one-time use too now, same as the orbital.
world.inv.a = [{ name: C.stabshot.item, amount: null, attributes: ctx.stabshotAttributes() }];
world.sel.a = 0;
world.damages.length = 0;
pendingStrikes.length = 0;
world.drops.length = 0;
world.targetInfo.a = { position: [0, 6, 0] };
world.pos.b = [0, 6, 0];
ctx.onPlayerAltAction("a");
check("firing the stabshot breaks it immediately (one-time use)",
    world.inv.a[0] === null, JSON.stringify(world.inv.a[0]));
const stabshotSteps = Math.floor((6 - C.stabshot.bedrockY) / C.stabshot.columnStepY) + 1;
check("stabshot queues one charge per step down to bedrock",
    pendingStrikes.length === stabshotSteps, pendingStrikes.length);
check("stabshot drops a real Super RPG item per step, not a placed block "
    + "(Super RPG has no block form)",
    world.drops.filter(d => d.name === C.stabshot.explosiveItem).length === stabshotSteps,
    world.drops.length);
ctx.processPendingStrikes();
check("the first stabshot charge detonates immediately",
    world.damages.some(d => d.hitEId === "b"), JSON.stringify(world.damages));

// -------------------------------------------------------------------- vanity flex
check("the vanity item is the real Diorite block, not a fake item",
    C.vanityFlex.item === "Diorite", C.vanityFlex.item);
check("the vanity recipe costs 39000 Block of Moonstone",
    C.vanityFlex.recipe.some(r => r.items[0] === "Block of Moonstone" && r.amt === 39000),
    JSON.stringify(C.vanityFlex.recipe));
check("the vanity item is craftable", !!world.recipes.a[C.vanityFlex.item], Object.keys(world.recipes.a));
check("the vanity item carries its joke display name",
    world.recipes.a[C.vanityFlex.item][0].attributes.customDisplayName === C.vanityFlex.name, "");

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
