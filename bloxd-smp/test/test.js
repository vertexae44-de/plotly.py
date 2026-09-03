const { ctx, world, CONFIG: C } = require("./harness.js");
let fails = 0;
const check = (label, cond, extra) => { console.log((cond ? "PASS " : "FAIL ") + label + (cond ? "" : "  <- " + extra)); if (!cond) fails++; };

// --- join
ctx.onPlayerJoin("a"); ctx.onPlayerJoin("b");
check("join sets maxHealth option", world.opts.a.maxHealth === 100, JSON.stringify(world.opts.a));

// --- pvp death drops orbs and costs the victim hp
world.health.a = 100;
ctx.onAttemptKillPlayer("a", "b");
check("victim lost 10 hp", world.db.a.smpMaxHp === 90, world.db.a.smpMaxHp);
check("one orb dropped", world.drops.length === 1, world.drops.length);
check("orb carries hp", world.drops[0].attrs.customAttributes.hp === 10, JSON.stringify(world.drops[0].attrs));
check("orb tagged", world.drops[0].attrs.customAttributes.smpOrb === true, "");

// --- natural death is free by default
const before = world.db.a.smpMaxHp;
ctx.onAttemptKillPlayer("a", null);
check("world death costs nothing", world.db.a.smpMaxHp === before, world.db.a.smpMaxHp);

// --- eating an orb
world.sel = { a: 0, b: 0 };
world.inv.a = [{ name: "Knight Heart", amount: 2, attributes: world.drops[0].attrs }];
world.health.a = 50;
ctx.onPlayerAltAction("a");
check("orb restored max hp to 100", world.db.a.smpMaxHp === 100, world.db.a.smpMaxHp);
check("orb healed current hp", world.health.a === 60, world.health.a);
check("orb stack decremented", world.inv.a[0].amount === 1, JSON.stringify(world.inv.a[0]));

// at the cap the orb must NOT be eaten
world.db.a.smpMaxHp = C.health.max;
ctx.onPlayerAltAction("a");
check("at cap -> orb not consumed", world.inv.a[0] && world.inv.a[0].amount === 1, JSON.stringify(world.inv.a[0]));
check("at cap -> max hp unchanged", world.db.a.smpMaxHp === C.health.max, world.db.a.smpMaxHp);
// eating the last orb clears the slot
world.db.a.smpMaxHp = 90;
ctx.onPlayerAltAction("a");
check("last orb clears slot", world.inv.a[0] === null, JSON.stringify(world.inv.a[0]));
check("last orb still granted hp", world.db.a.smpMaxHp === 100, world.db.a.smpMaxHp);

// --- max hp floor
world.db.b.smpMaxHp = C.health.min;
world.drops.length = 0;
ctx.onAttemptKillPlayer("b", "a");
check("cannot go below floor", world.db.b.smpMaxHp === C.health.min, world.db.b.smpMaxHp);
check("no orbs when nothing lost", world.drops.length === 0, world.drops.length);

// --- mace: normal hit (not falling) is unchanged, spends 1 durability
const mace = () => ctx.maceAttributes(C.mace.durability);
world.inv.a = [{ name: "Moonstone Club", amount: null, attributes: mace() }];
let dmg = ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
check("grounded mace hit keeps base damage", dmg === 20, dmg);
check("mace lost 1 durability", world.inv.a[0].attributes.customAttributes.smpDur === C.mace.durability - 1,
      world.inv.a[0].attributes.customAttributes.smpDur);

// --- mace: falling hit smashes
world.pos.a = [0, 70, 0];
ctx.tick();
world.pos.a = [0, 64, 0];
ctx.tick();                                  // fell 6 blocks
world.impulses.length = 0;
dmg = ctx.onPlayerDamagingOtherPlayer("a", "b", 20);
check("smash adds fall damage", dmg === Math.round(20 + 6 * C.mace.damagePerBlockFallen), dmg);
const lift = world.impulses.find(i => i[0] === "a");
check("wind burst launches attacker", lift && lift[2] === C.mace.windBurstLevel * C.mace.windBurstPerLevel, JSON.stringify(world.impulses));

// --- mace: right click = wind charge, then cooldown
world.impulses.length = 0;
ctx.onPlayerAltAction("a");
check("wind charge impulse", world.impulses.length === 1 && world.impulses[0][2] === C.mace.chargeUpwardImpulse, JSON.stringify(world.impulses));
ctx.onPlayerAltAction("a");
check("wind charge on cooldown", world.impulses.length === 1, JSON.stringify(world.impulses));

// --- durability breaks the item
world.inv.a = [{ name: "Iron Pickaxe", amount: null,
                 attributes: { customAttributes: { smpDur: 1, smpDurMax: 250 } } }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Stone", "Air");
check("tool breaks at 0 durability", world.inv.a[0] === null, JSON.stringify(world.inv.a[0]));
check("break message sent", world.log.some(l => l.startsWith("fly[a]")), "");

// placing a block must not cost durability
world.inv.a = [{ name: "Iron Pickaxe", amount: null, attributes: { customAttributes: { smpDur: 50, smpDurMax: 250 } } }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Air", "Stone");
check("placing costs no durability", world.inv.a[0].attributes.customAttributes.smpDur === 50,
      world.inv.a[0].attributes.customAttributes.smpDur);

// untracked item never wears out
world.inv.a = [{ name: "Dirt", amount: 10, attributes: undefined }];
ctx.onPlayerChangeBlock("a", 0, 0, 0, "Stone", "Air");
check("untracked item unaffected", world.inv.a[0].name === "Dirt" && world.inv.a[0].amount === 10, JSON.stringify(world.inv.a[0]));

// --- forging the mace from a plain club
world.inv.a = [{ name: "Moonstone Club", amount: null, attributes: undefined },
               { name: "Moonstone", amount: 5, attributes: undefined }];
ctx.onPlayerAltAction("a");
check("forge refused without full cost", world.inv.a[0].attributes === undefined, JSON.stringify(world.inv.a[0]));
check("partial cost not consumed", world.inv.a[1].amount === 5, world.inv.a[1].amount);

world.inv.a = [{ name: "Moonstone Club", amount: null, attributes: undefined },
               { name: "Moonstone", amount: 5, attributes: undefined },
               { name: "Moonstone", amount: 4, attributes: undefined }];
ctx.onPlayerAltAction("a");
check("forge upgrades the club", world.inv.a[0].attributes.customAttributes.smpMace === true, JSON.stringify(world.inv.a[0]));
check("forge sets full durability", world.inv.a[0].attributes.customAttributes.smpDur === C.mace.durability, "");
const moonstoneLeft = world.inv.a.reduce((n, s) => n + (s && s.name === "Moonstone" ? s.amount : 0), 0);
check("forge consumed cost across stacks", moonstoneLeft === 1, moonstoneLeft);

// a plain club with no moonstone at all does nothing and says nothing
world.inv.a = [{ name: "Moonstone Club", amount: null, attributes: undefined }];
const logsBefore = world.log.length;
ctx.onPlayerAltAction("a");
check("plain club stays silent with no cost", world.log.length === logsBefore && world.inv.a[0].attributes === undefined, "");

// --- commands
world.inv.a = [];
check("/hp handled", ctx.playerCommand("a", "/hp") === true, "");
world.db.a.smpMaxHp = 100;
check("/withdraw handled", ctx.playerCommand("a", "withdraw 2") === true, "");
check("withdraw removed 20 hp", world.db.a.smpMaxHp === 80, world.db.a.smpMaxHp);
check("withdraw gave 2 orbs", world.inv.a.length === 2, JSON.stringify(world.inv.a));
check("withdrawn orbs are edible", world.inv.a[0].attributes.customAttributes.smpOrb === true, "");
check("/mace allowed by default", ctx.playerCommand("a", "/mace") === true, "");
check("unknown command ignored", ctx.playerCommand("a", "/potato") === false, "");
world.db.a.smpMaxHp = C.health.min;
ctx.playerCommand("a", "withdraw 5");
check("withdraw refused below floor", world.db.a.smpMaxHp === C.health.min, world.db.a.smpMaxHp);

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
