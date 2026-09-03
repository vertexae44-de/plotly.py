// =============================================================================
//  Unstable-style SMP  -  Bloxd.io World Code
//
//  Paste this whole file into World Settings -> Code -> World Code.
//
//  Life Orbs        dying to a player costs you hearts and drops them as orbs
//  Permanent ban    hit 0 hearts and you are banned from the world for good
//  Windburst Mace   Moonstone Axe. Smash players AND mobs from the air
//  Moonstone Spear  right click to lunge, hit hard while lunging
//  Golden Apples    two tiers, heal + shield + regen
//  Durability       Bloxd has none, so this adds it to every tool and weapon
//  Crafting         mace, spear and both apples all have real recipes
//
//  Everything is tunable in CONFIG. Bloxd health runs 0-100, not 0-20,
//  so one "heart" here is hpPerHeart points.
// =============================================================================

const CONFIG = {
    hpPerHeart: 10,

    health: {
        starting: 100,   // 10 hearts
        max: 200,        // 20 hearts
        min: 10,         // only used when ban.enabled is false
    },

    ban: {
        enabled: true,
        // Reaching 0 hearts is permanent. Bans are stored on the world, so an
        // admin can lift one with /unban <name> even while the player is offline.
        reason: "You hit 0 hearts. You are eliminated from this SMP.",
        announce: true,
    },

    death: {
        hpLostToPlayer: 10,   // hearts the victim loses to a player kill
        hpLostToWorld: 0,     // fall damage / mobs / lava. 0 = free
        dropOrbs: true,
        dropOrbsOnWorldDeath: false,
        killerAlsoGains: 0,   // instant HP for the killer, on top of the orbs
    },

    orb: {
        item: "Aura XP Orb",
        name: "Life Orb",
        hp: 10,                     // one heart per orb
        despawnMs: 5 * 60 * 1000,   // 5 min is the engine maximum
        healOnEat: true,
        // How many orbs a player may ever absorb. 1 stops people farming their
        // way to the health cap; set to 0 for no limit.
        usesPerPlayer: 1,
    },

    // ---- Windburst Mace -----------------------------------------------------
    mace: {
        item: "Moonstone Mace",   // a real Bloxd item, so it looks like a mace
        name: "Moonstone Mace",
        durability: 400,

        minSmashFall: 1.5,           // blocks you must be falling for a smash
        damagePerBlockFallen: 2.5,
        maxSmashDamage: 60,

        // Wind Burst: the smash throws you back into the air.
        windBurstLevel: 3,           // 0 disables it
        windBurstPerLevel: 4.5,

        // Density: more smash damage the further you fell, on top of the base.
        densityLevel: 3,             // 0 disables it
        densityPerLevel: 0.75,       // extra damage per level per block fallen

        // Right click in mid-air to launch yourself.
        chargeUpwardImpulse: 11,
        chargeCooldownMs: 4000,
        chargeDurabilityCost: 3,

        knockbackRadius: 4.5,        // splash around whatever you smashed
        knockbackForce: 9,
        knockbackUp: 5,
        knockbackHitsMobs: true,

        // Deliberately expensive - this is the endgame weapon.
        recipe: [
            { items: ["Moonstone"], amt: 40 },
            { items: ["Knight Heart"], amt: 4 },
            { items: ["Stick"], amt: 2 },
        ],
    },

    // ---- Moonstone Spear ----------------------------------------------------
    spear: {
        item: "Moonstone Spear",
        name: "Moonstone Spear",
        durability: 300,

        lungeForce: 16,              // forward impulse on right click
        lungeUp: 3,
        lungeCooldownMs: 3500,
        lungeWindowMs: 1200,         // how long a lunge counts as "charging"
        lungeBonusDamage: 14,
        lungeDurabilityCost: 2,

        recipe: [
            { items: ["Moonstone"], amt: 4 },
            { items: ["Stick"], amt: 2 },
        ],
    },

    // ---- Golden Apples ------------------------------------------------------
    // Bloxd has no Golden Apple item, so these are Apples with custom tags.
    apples: {
        golden: {
            name: "Golden Apple",          // rename shown in-game
            heal: 40,
            shield: 20,
            regenMs: 10000,
            // Bloxd's fire resistance is called "Heat Resistance" - there is no
            // effect named "Fire Resistance".
            heatResistMs: 15000,
            bonusMaxHp: 0,
            recipe: [
                { items: ["Apple"], amt: 1 },
                { items: ["Gold Bar"], amt: 8 },
            ],
        },
        enchanted: {
            name: "Enchanted Golden Apple",
            heal: 100,
            shield: 60,
            regenMs: 30000,
            heatResistMs: 60000,
            bonusMaxHp: 10,          // permanently worth one heart
            recipe: [
                { items: ["Apple"], amt: 1 },
                { items: ["Moonstone"], amt: 8 },
            ],
        },
    },

    durability: {
        enabled: true,

        // Durability is worked out from the item's name rather than a hand-written
        // list, so every tool, weapon and bow in the game gets it automatically:
        //     uses = materials[<material word>] * kinds[<last word>]
        // "Moonstone Axe" -> 2400 * 1 -> 2400.  "Black Wood Bow" -> 60 * 1.2 -> 72.
        materials: {
            Wood: 60, Fur: 80, Gold: 90, Paint: 120, Stone: 130, Iron: 250,
            Spiked: 400, Mining: 500, Artisan: 1200, Diamond: 1560,
            Knight: 2000, Golem: 2200, Moonstone: 2400,
        },
        kinds: {
            Sword: 1, Dagger: 0.9, Club: 1, Mace: 1.1, Spear: 1, Whip: 0.9,
            Boomerang: 0.9, Axe: 1, Pickaxe: 1,
            Spade: 0.9, Shovel: 0.9, Hoe: 0.8, Bow: 1.2, Crossbow: 1.2, Shield: 1.5,
            Helmet: 0.8, Chestplate: 1.3, Leggings: 1.2, Boots: 0.9, Gauntlets: 0.8,
        },
        // Gear whose name has a kind but no known material word.
        defaultMaterialUses: 200,
        // Exact names win over the rule above. Set one to 0 to make it unbreakable.
        overrides: {},

        warnAtFraction: 0.1,
        costPerHit: 1,
        costPerBlockBroken: 1,
    },

    // ---- Dimensions ---------------------------------------------------------
    // Bloxd has ONE world, so these are far-apart regions of it dressed up with
    // their own fog, light and gravity. Check your world is big enough for the
    // offsets below and lower them if it is not.
    dimensions: {
        enabled: true,
        regionHalfSize: 10000,     // how wide each region's "claim" is
        buildArrivalPlatform: true,
        platformRadius: 3,
        travelCooldownMs: 1500,    // stops portals ping-ponging you

        list: {
            overworld: {
                name: "Overworld",
                origin: [0, 0],        // x, z centre of the region
                scale: 1,
                platformBlock: "Stone",
                clientOptions: {},     // empty = the normal look
            },
            nether: {
                name: "The Nether",
                origin: [30000, 0],
                scale: 8,              // 1 block here covers 8 in the overworld
                portalBlock: "Purple Portal",
                platformBlock: "Magma",
                clientOptions: {
                    fogColourOverride: "#3a0b06",
                    fogChunkDistanceOverride: 6,
                    ambientLightColourOverride: "#40140c",
                    skyLightColourOverride: "#792a16",
                    gravityMultiplier: 1,
                },
            },
            end: {
                name: "The End",
                origin: [0, 30000],
                scale: 1,
                portalBlock: "Black Portal",
                platformBlock: "Obsidian",
                clientOptions: {
                    fogColourOverride: "#0d0a1a",
                    fogChunkDistanceOverride: 10,
                    ambientLightColourOverride: "#1b1630",
                    skyLightColourOverride: "#3a2f57",
                    gravityMultiplier: 0.7,
                },
            },
        },

        // Craftable portal blocks, so players can open their own gateways.
        portalRecipes: {
            "Purple Portal": [
                { items: ["Obsidian"], amt: 8 },
                { items: ["Magma"], amt: 1 },
            ],
            "Black Portal": [
                { items: ["Obsidian"], amt: 8 },
                { items: ["Moonstone"], amt: 1 },
            ],
        },
    },

    commands: {
        publicCommands: ["hp", "hearts", "withdraw", "smphelp", "where"],
        adminNames: [],        // e.g. ["YourName"] - needed for /unban, /orb, /sethp
    },
};

const DB_MAX_HP = "smpMaxHp";
const DB_BANS = "smpBans";
const DB_ORBS_EATEN = "smpOrbsEaten";
const DB_DIMENSION = "smpDimension";

const ATTR_ORB = "smpOrb";
const ATTR_MACE = "smpMace";
const ATTR_SPEAR = "smpSpear";
const ATTR_APPLE = "smpApple";
const ATTR_DUR = "smpDur";
const ATTR_DUR_MAX = "smpDurMax";

// Per-player runtime state, rebuilt on join. Nothing here needs persisting.
const players = {};

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function stateOf(playerId) {
    let s = players[playerId];
    if (!s) {
        s = players[playerId] = { fallDistance: 0, lastY: null, lastCharge: 0, lastLunge: 0 };
    }
    return s;
}

function minHp() {
    // With banning on, 0 is reachable and triggers elimination instead of clamping.
    return CONFIG.ban.enabled ? 0 : CONFIG.health.min;
}

function clampHp(hp) {
    return Math.max(minHp(), Math.min(CONFIG.health.max, Math.round(hp)));
}

function hearts(hp) {
    return (hp / CONFIG.hpPerHeart).toFixed(1).replace(/\.0$/, "");
}

function isPlayer(entityId) {
    return entityId != null && api.getPlayerIds().indexOf(entityId) !== -1;
}

function isAdmin(playerId) {
    const names = CONFIG.commands.adminNames;
    return names.length > 0 && names.indexOf(api.getEntityName(playerId)) !== -1;
}

function tell(playerId, message, colour) {
    api.sendMessage(playerId, message, { color: colour || "#ffffff" });
}

// -----------------------------------------------------------------------------
// Permanent bans
// -----------------------------------------------------------------------------

function readBans() {
    const raw = api.getLobbyDbValue(DB_BANS);
    if (typeof raw !== "string" || raw === "") {
        return {};
    }
    try {
        return JSON.parse(raw) || {};
    } catch (err) {
        return {};   // corrupt value should not lock everybody out
    }
}

function writeBans(bans) {
    api.setLobbyDbValue(DB_BANS, JSON.stringify(bans));
}

function isBanned(playerId) {
    return readBans()[api.getPlayerDbId(playerId)] != null;
}

/** Bans by permanent account id, so a name change does not undo it. */
function banPlayer(playerId, reason) {
    const name = api.getEntityName(playerId);
    const bans = readBans();
    bans[api.getPlayerDbId(playerId)] = name;
    writeBans(bans);

    if (CONFIG.ban.announce) {
        api.broadcastMessage(name + " hit 0 hearts and is eliminated.", { color: "#ff4757" });
    }
    api.kickPlayer(playerId, reason);
}

function unbanByName(name) {
    const bans = readBans();
    const wanted = String(name).toLowerCase();
    let removed = null;
    for (const dbId in bans) {
        if (String(bans[dbId]).toLowerCase() === wanted) {
            removed = bans[dbId];
            delete bans[dbId];
        }
    }
    if (removed) {
        writeBans(bans);
    }
    return removed;
}

// -----------------------------------------------------------------------------
// Max health
// -----------------------------------------------------------------------------

function getMaxHp(playerId) {
    const stored = api.getPlayerDbValue(playerId, DB_MAX_HP);
    const value = typeof stored === "string" ? parseInt(stored, 10) : stored;
    if (typeof value !== "number" || isNaN(value)) {
        return CONFIG.health.starting;
    }
    return clampHp(value);
}

function applyMaxHp(playerId, hp, healBy) {
    api.setPlayerDbValue(playerId, DB_MAX_HP, hp);
    api.setClientOption(playerId, "maxHealth", hp);
    api.setClientOption(playerId, "initialHealth", hp);

    const current = api.getHealth(playerId);
    if (current > hp) {
        // Shrinking the cap has to pull current health down too, or the bar lies.
        api.setHealth(playerId, hp);
    } else if (healBy > 0) {
        api.setHealth(playerId, Math.min(hp, current + healBy));
    }
}

/**
 * Moves a player's max HP and returns how much actually changed, which is less
 * than asked for once they hit the floor or the cap.
 */
function addMaxHp(playerId, delta, healBy) {
    const before = getMaxHp(playerId);
    const after = clampHp(before + delta);
    if (after === before) {
        return 0;
    }
    applyMaxHp(playerId, after, healBy || 0);
    return after - before;
}

// -----------------------------------------------------------------------------
// Custom items
// -----------------------------------------------------------------------------

function orbAttributes(hp) {
    const lines = ["Right click to absorb " + hearts(hp) + " heart(s)."];
    if (CONFIG.orb.usesPerPlayer > 0) {
        lines.push("You may only ever absorb " + CONFIG.orb.usesPerPlayer + ".");
    }
    return {
        customDisplayName: CONFIG.orb.name,
        customDescription: lines.join("\n"),
        customAttributes: { [ATTR_ORB]: true, hp: hp },
    };
}

function maceAttributes(durabilityLeft) {
    const max = CONFIG.mace.durability;
    const left = durabilityLeft == null ? max : durabilityLeft;
    const lines = [];
    if (CONFIG.mace.windBurstLevel > 0) {
        lines.push("Wind Burst " + CONFIG.mace.windBurstLevel + " - smash launches you skyward.");
    }
    if (CONFIG.mace.densityLevel > 0) {
        lines.push("Density " + CONFIG.mace.densityLevel + " - the further you fall, the harder it hits.");
    }
    lines.push("Works on players and mobs.");
    lines.push("Right click in mid-air to wind charge.");
    lines.push("Durability: " + left + " / " + max);

    return {
        customDisplayName: CONFIG.mace.name,
        customDescription: lines.join("\n"),
        customAttributes: { [ATTR_MACE]: true, [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
    };
}

function spearAttributes(durabilityLeft) {
    const max = CONFIG.spear.durability;
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDisplayName: CONFIG.spear.name,
        customDescription:
            "Right click to lunge forward.\n" +
            "Hits during a lunge deal +" + CONFIG.spear.lungeBonusDamage + " damage.\n" +
            "Durability: " + left + " / " + max,
        customAttributes: { [ATTR_SPEAR]: true, [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
    };
}

function appleAttributes(tier) {
    const apple = CONFIG.apples[tier];
    const lines = [
        "Right click to eat.",
        "Heals " + hearts(apple.heal) + " hearts and gives " + apple.shield + " shield.",
    ];
    if (apple.regenMs > 0) {
        lines.push("Health Regen for " + Math.round(apple.regenMs / 1000) + "s.");
    }
    if (apple.heatResistMs > 0) {
        lines.push("Fire resistance for " + Math.round(apple.heatResistMs / 1000) + "s.");
    }
    if (apple.bonusMaxHp > 0) {
        lines.push("Permanently grants " + hearts(apple.bonusMaxHp) + " max hearts.");
    }
    return {
        customDisplayName: apple.name,
        customDescription: lines.join("\n"),
        customAttributes: { [ATTR_APPLE]: tier },
    };
}

function customAttrs(invenItem) {
    if (!invenItem || !invenItem.attributes) {
        return {};
    }
    return invenItem.attributes.customAttributes || {};
}

function heldSlot(playerId) {
    const index = api.getSelectedInventorySlotI(playerId);
    const item = api.getItemSlot(playerId, index);
    return item ? { index: index, item: item } : null;
}

/** Overwrites a slot, keeping the stack size, or clears it when the count runs out. */
function writeSlot(playerId, index, item, amount, attributes) {
    if (amount != null && amount <= 0) {
        api.setItemSlot(playerId, index, "Air", null, undefined, true);
        return;
    }
    api.setItemSlot(playerId, index, item.name, amount, attributes, true);
}

function displayName(item) {
    if (item.attributes && item.attributes.customDisplayName) {
        return item.attributes.customDisplayName;
    }
    return item.name;
}

// -----------------------------------------------------------------------------
// Crafting
// -----------------------------------------------------------------------------

/**
 * Recipes are per player in Bloxd, so they are registered on every join.
 * The `attributes` field is what turns the crafted item into our custom one.
 */
function registerRecipes(playerId) {
    api.editItemCraftingRecipes(playerId, CONFIG.mace.item, [{
        requires: CONFIG.mace.recipe,
        produces: 1,
        attributes: maceAttributes(CONFIG.mace.durability),
    }]);

    api.editItemCraftingRecipes(playerId, CONFIG.spear.item, [{
        requires: CONFIG.spear.recipe,
        produces: 1,
        attributes: spearAttributes(CONFIG.spear.durability),
    }]);

    // Both apples craft into the same base item, told apart by their tag.
    api.editItemCraftingRecipes(playerId, "Apple", [
        {
            requires: CONFIG.apples.golden.recipe,
            produces: 1,
            attributes: appleAttributes("golden"),
        },
        {
            requires: CONFIG.apples.enchanted.recipe,
            produces: 1,
            attributes: appleAttributes("enchanted"),
        },
    ]);
}

// -----------------------------------------------------------------------------
// Durability
// -----------------------------------------------------------------------------

// Names never change during a session, so the derived numbers are worth caching.
const durabilityCache = {};

/**
 * Works out how many uses an item name is worth from its material and kind,
 * e.g. "Diamond Pickaxe" -> 1560. Returns 0 for anything that is not gear.
 */
function durabilityForName(itemName) {
    if (durabilityCache[itemName] !== undefined) {
        return durabilityCache[itemName];
    }
    const d = CONFIG.durability;
    let uses;

    if (typeof d.overrides[itemName] === "number") {
        uses = d.overrides[itemName];
    } else {
        const words = String(itemName).split(" ");
        const kind = d.kinds[words[words.length - 1]];
        if (kind == null) {
            uses = 0;   // not a tool, weapon or piece of armour
        } else {
            // Match on whole words so "Moonstone" is never read as "Stone".
            let base = 0;
            for (let i = 0; i < words.length - 1; i++) {
                if (typeof d.materials[words[i]] === "number") {
                    base = d.materials[words[i]];
                    break;
                }
            }
            uses = Math.round((base || d.defaultMaterialUses) * kind);
        }
    }

    durabilityCache[itemName] = uses;
    return uses;
}

function maxDurabilityFor(item) {
    const custom = customAttrs(item);
    if (typeof custom[ATTR_DUR_MAX] === "number") {
        return custom[ATTR_DUR_MAX];
    }
    return durabilityForName(item.name);
}

/**
 * Spends durability on whatever is in the given slot.
 * Bloxd has no durability of its own, so it lives in the item's custom
 * attributes and the slot is rewritten every time it changes.
 */
function spendDurability(playerId, slot, cost) {
    if (!CONFIG.durability.enabled || !slot || cost <= 0) {
        return;
    }
    const item = slot.item;
    const max = maxDurabilityFor(item);
    if (max <= 0) {
        return;   // not a durable item
    }

    const custom = customAttrs(item);
    const before = typeof custom[ATTR_DUR] === "number" ? custom[ATTR_DUR] : max;
    const left = before - cost;

    if (left <= 0) {
        api.setItemSlot(playerId, slot.index, "Air", null, undefined, true);
        api.playSound(playerId, "hit3", 0.9, 0.7);
        api.sendFlyingMiddleMessage(playerId, "Your " + displayName(item) + " broke!", 0, 1500);
        return;
    }

    let attributes;
    if (custom[ATTR_MACE]) {
        attributes = maceAttributes(left);
    } else if (custom[ATTR_SPEAR]) {
        attributes = spearAttributes(left);
    } else {
        attributes = {
            customDisplayName: item.attributes && item.attributes.customDisplayName,
            customDescription: "Durability: " + left + " / " + max,
            customAttributes: Object.assign({}, custom, { [ATTR_DUR]: left, [ATTR_DUR_MAX]: max }),
        };
    }

    writeSlot(playerId, slot.index, item, item.amount, attributes);

    const wasAbove = before > max * CONFIG.durability.warnAtFraction;
    if (wasAbove && left <= max * CONFIG.durability.warnAtFraction) {
        api.queueCrosshairText(playerId, displayName(item) + " is almost broken", 2000);
    }
}

// -----------------------------------------------------------------------------
// Life Orbs
// -----------------------------------------------------------------------------

function orbsEaten(playerId) {
    const stored = api.getPlayerDbValue(playerId, DB_ORBS_EATEN);
    const value = typeof stored === "string" ? parseInt(stored, 10) : stored;
    return typeof value === "number" && !isNaN(value) ? value : 0;
}

/** A lifetime cap, so nobody can grind orbs up to the health ceiling. */
function orbUsesLeft(playerId) {
    const limit = CONFIG.orb.usesPerPlayer;
    if (limit <= 0) {
        return Infinity;
    }
    return Math.max(0, limit - orbsEaten(playerId));
}

function dropOrbs(playerId, totalHp) {
    const perOrb = CONFIG.orb.hp;
    const count = Math.max(1, Math.round(totalHp / perOrb));
    const pos = api.getPosition(playerId);
    if (!pos) {
        return;
    }

    for (let i = 0; i < count; i++) {
        api.createItemDrop(
            pos[0], pos[1] + 1, pos[2],
            CONFIG.orb.item,
            1,
            false,                     // never merge: each orb carries its own HP
            orbAttributes(perOrb),
            CONFIG.orb.despawnMs,
            playerId,
            { doPhysics: true }
        );
    }

    api.broadcastSound("magicAccent2", 0.8, 1.0, { playerIdOrPos: pos, maxHearDist: 30 });
    api.playParticleEffect({
        presetId: "mobDeathSoul",
        pos1: [pos[0] - 0.5, pos[1], pos[2] - 0.5],
        pos2: [pos[0] + 0.5, pos[1] + 1.5, pos[2] + 0.5],
    });
}

function eatOrb(playerId, slot) {
    const custom = customAttrs(slot.item);
    const hp = typeof custom.hp === "number" ? custom.hp : CONFIG.orb.hp;

    if (orbUsesLeft(playerId) <= 0) {
        // The orb is left in the inventory so it can still be traded away.
        api.queueCrosshairText(playerId, "You have already absorbed your Life Orb", 2000);
        tell(playerId, "You can only absorb " + CONFIG.orb.usesPerPlayer
            + " Life Orb ever. Trade this one to someone else.", "#ffa502");
        api.playSound(playerId, "hit1", 0.5, 0.7);
        return;
    }

    if (getMaxHp(playerId) >= CONFIG.health.max) {
        api.queueCrosshairText(playerId, "Already at " + hearts(CONFIG.health.max) + " hearts", 1500);
        api.playSound(playerId, "hit1", 0.5, 0.7);
        return;
    }

    const gained = addMaxHp(playerId, hp, CONFIG.orb.healOnEat ? hp : 0);
    if (gained <= 0) {
        return;
    }

    api.setPlayerDbValue(playerId, DB_ORBS_EATEN, orbsEaten(playerId) + 1);

    const amount = slot.item.amount == null ? 1 : slot.item.amount;
    writeSlot(playerId, slot.index, slot.item, amount - 1, slot.item.attributes);

    tell(playerId, "You absorbed " + hearts(gained) + " hearts. You now have "
        + hearts(getMaxHp(playerId)) + ".", "#ff6b81");
    api.playSound(playerId, "exp_collect", 0.9, 1.0);
    api.playSound(playerId, "levelup", 0.8, 1.2);

    const pos = api.getPosition(playerId);
    api.playParticleEffect({
        presetId: "aura",
        pos1: [pos[0] - 0.6, pos[1], pos[2] - 0.6],
        pos2: [pos[0] + 0.6, pos[1] + 2, pos[2] + 0.6],
    });
}

// -----------------------------------------------------------------------------
// Golden Apples
// -----------------------------------------------------------------------------

function eatApple(playerId, slot, tier) {
    const apple = CONFIG.apples[tier];
    if (!apple) {
        return;
    }

    const amount = slot.item.amount == null ? 1 : slot.item.amount;
    writeSlot(playerId, slot.index, slot.item, amount - 1, slot.item.attributes);

    if (apple.bonusMaxHp > 0) {
        addMaxHp(playerId, apple.bonusMaxHp, 0);
    }

    const maxHp = getMaxHp(playerId);
    api.setHealth(playerId, Math.min(maxHp, api.getHealth(playerId) + apple.heal));

    if (apple.shield > 0) {
        api.setShieldAmount(playerId, api.getShieldAmount(playerId) + apple.shield);
    }
    if (apple.regenMs > 0) {
        api.applyEffect(playerId, "Health Regen", apple.regenMs);
    }
    if (apple.heatResistMs > 0) {
        api.applyEffect(playerId, "Heat Resistance", apple.heatResistMs);
    }

    tell(playerId, "You ate a " + apple.name + ".", "#ffd700");
    api.playSound(playerId, "eat1", 0.9, 1.0);
    api.playSound(playerId, "magicAccent1", 0.7, 1.3);

    const pos = api.getPosition(playerId);
    api.playParticleEffect({
        presetId: "aura",
        pos1: [pos[0] - 0.6, pos[1], pos[2] - 0.6],
        pos2: [pos[0] + 0.6, pos[1] + 2, pos[2] + 0.6],
    });
}

// -----------------------------------------------------------------------------
// Windburst Mace
// -----------------------------------------------------------------------------

function windCharge(playerId, slot) {
    const state = stateOf(playerId);
    const now = api.now();
    const remaining = CONFIG.mace.chargeCooldownMs - (now - state.lastCharge);
    if (remaining > 0) {
        api.queueCrosshairText(playerId, "Wind charge: " + Math.ceil(remaining / 1000) + "s", 800);
        return;
    }

    state.lastCharge = now;
    api.applyImpulse(playerId, 0, CONFIG.mace.chargeUpwardImpulse, 0);
    api.preventFallDamageNextGrounding(playerId);
    spendDurability(playerId, slot, CONFIG.mace.chargeDurabilityCost);

    const pos = api.getPosition(playerId);
    api.broadcastSound("magicAccent4", 0.7, 1.4, { playerIdOrPos: pos, maxHearDist: 25 });
    api.playParticleEffect({
        presetId: "stomp",
        pos1: [pos[0] - 1, pos[1], pos[2] - 1],
        pos2: [pos[0] + 1, pos[1] + 0.5, pos[2] + 1],
    });
}

/**
 * Turns a mace hit into a smash when the attacker is falling. The target may be
 * a player or a mob - both take the fall bonus and both get knocked around.
 * Returns the damage the hit should deal.
 */
function maceSmash(attacker, targetId, baseDamage, slot) {
    const state = stateOf(attacker);
    const fell = state.fallDistance;

    spendDurability(attacker, slot, CONFIG.durability.costPerHit);

    if (fell < CONFIG.mace.minSmashFall) {
        return baseDamage;
    }

    // Base smash scales with the fall; Density adds more on top of it.
    let bonus = Math.min(CONFIG.mace.maxSmashDamage, fell * CONFIG.mace.damagePerBlockFallen);
    if (CONFIG.mace.densityLevel > 0) {
        bonus += CONFIG.mace.densityLevel * CONFIG.mace.densityPerLevel * fell;
    }

    const centre = api.getPosition(targetId);

    if (CONFIG.mace.windBurstLevel > 0) {
        const lift = CONFIG.mace.windBurstLevel * CONFIG.mace.windBurstPerLevel;
        api.applyImpulse(attacker, 0, lift, 0);
        api.preventFallDamageNextGrounding(attacker);
    }
    state.fallDistance = 0;

    if (centre) {
        knockbackAround(centre, attacker, targetId);
        api.broadcastSound("ominousBellHit", 0.9, 1.0, { playerIdOrPos: centre, maxHearDist: 40 });
        api.playParticleEffect({
            presetId: "stomp",
            pos1: [centre[0] - 2, centre[1], centre[2] - 2],
            pos2: [centre[0] + 2, centre[1] + 1, centre[2] + 2],
        });
    }
    if (isPlayer(targetId)) {
        api.shakePlayerCamera(targetId, 0.6, 400);
    }

    return Math.round(baseDamage + bonus);
}

/** Splash knockback on every player and, if enabled, every mob near the impact. */
function knockbackAround(centre, attacker, alreadyHit) {
    const radius = CONFIG.mace.knockbackRadius;
    let targets = api.getPlayerIds();
    if (CONFIG.mace.knockbackHitsMobs) {
        targets = targets.concat(api.getMobIds());
    }

    for (let i = 0; i < targets.length; i++) {
        const other = targets[i];
        if (other === attacker || other === alreadyHit) {
            continue;
        }
        const pos = api.getPosition(other);
        if (!pos) {
            continue;
        }
        const dx = pos[0] - centre[0];
        const dy = pos[1] - centre[1];
        const dz = pos[2] - centre[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance > radius) {
            continue;
        }

        // Falls off linearly. A direct overlap still gets pushed somewhere.
        const strength = (1 - distance / radius) * CONFIG.mace.knockbackForce;
        const length = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
        api.applyImpulse(other, (dx / length) * strength, CONFIG.mace.knockbackUp, (dz / length) * strength);
    }
}

// -----------------------------------------------------------------------------
// Moonstone Spear
// -----------------------------------------------------------------------------

function spearLunge(playerId, slot) {
    const state = stateOf(playerId);
    const now = api.now();
    const remaining = CONFIG.spear.lungeCooldownMs - (now - state.lastLunge);
    if (remaining > 0) {
        api.queueCrosshairText(playerId, "Lunge: " + Math.ceil(remaining / 1000) + "s", 800);
        return;
    }

    const facing = api.getPlayerFacingInfo(playerId);
    const dir = facing && facing.dir ? facing.dir : [0, 0, 1];
    // Horizontal only, so a lunge is a dash rather than a launch.
    const length = Math.max(0.001, Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2]));

    state.lastLunge = now;
    api.applyImpulse(
        playerId,
        (dir[0] / length) * CONFIG.spear.lungeForce,
        CONFIG.spear.lungeUp,
        (dir[2] / length) * CONFIG.spear.lungeForce
    );
    api.preventFallDamageNextGrounding(playerId);
    spendDurability(playerId, slot, CONFIG.spear.lungeDurabilityCost);

    const pos = api.getPosition(playerId);
    api.broadcastSound("magicAccent3", 0.6, 1.2, { playerIdOrPos: pos, maxHearDist: 20 });
}

function isLunging(playerId) {
    return api.now() - stateOf(playerId).lastLunge <= CONFIG.spear.lungeWindowMs;
}

// -----------------------------------------------------------------------------
// Shared weapon hit handling
// -----------------------------------------------------------------------------

function handleWeaponHit(attacker, targetId, damageDealt) {
    const slot = heldSlot(attacker);
    if (!slot) {
        return;
    }
    const custom = customAttrs(slot.item);

    if (custom[ATTR_MACE]) {
        return maceSmash(attacker, targetId, damageDealt, slot);
    }

    if (custom[ATTR_SPEAR]) {
        spendDurability(attacker, slot, CONFIG.durability.costPerHit);
        if (isLunging(attacker)) {
            stateOf(attacker).lastLunge = 0;   // the bonus lands once per lunge
            return Math.round(damageDealt + CONFIG.spear.lungeBonusDamage);
        }
        return;
    }

    spendDurability(attacker, slot, CONFIG.durability.costPerHit);
}

// -----------------------------------------------------------------------------
// Dimensions
// -----------------------------------------------------------------------------

// Every option a dimension may override. Anything a dimension does not set is
// put back to its default, so leaving one never bleeds into the next.
const LOOK_OPTIONS = [
    "fogColourOverride",
    "fogChunkDistanceOverride",
    "ambientLightColourOverride",
    "skyLightColourOverride",
    "lightingOverride",
    "gravityMultiplier",
];

function dimension(key) {
    return CONFIG.dimensions.list[key];
}

/** Which region a world position falls in. Anything unclaimed is the overworld. */
function dimensionAt(pos) {
    const half = CONFIG.dimensions.regionHalfSize;
    for (const key in CONFIG.dimensions.list) {
        const d = dimension(key);
        if (Math.abs(pos[0] - d.origin[0]) <= half && Math.abs(pos[2] - d.origin[1]) <= half) {
            return key;
        }
    }
    return "overworld";
}

function applyDimensionLook(playerId, key) {
    const opts = (dimension(key) || {}).clientOptions || {};
    for (let i = 0; i < LOOK_OPTIONS.length; i++) {
        const option = LOOK_OPTIONS[i];
        if (opts[option] !== undefined) {
            api.setClientOption(playerId, option, opts[option]);
        } else {
            api.setClientOptionToDefault(playerId, option);
        }
    }
}

/** Called whenever a player's region changes, however they got there. */
function enterDimension(playerId, key, announce) {
    const state = stateOf(playerId);
    if (state.dimension === key) {
        return;
    }
    state.dimension = key;
    applyDimensionLook(playerId, key);
    api.setPlayerDbValue(playerId, DB_DIMENSION, key);
    if (announce) {
        api.sendFlyingMiddleMessage(playerId, dimension(key).name, 0, 2000);
    }
}

/**
 * Makes sure there is something to land on. An arriving player would otherwise
 * drop through empty air in a region nobody has built in yet.
 */
function ensureArrivalGround(x, y, z, blockName) {
    if (!CONFIG.dimensions.buildArrivalPlatform) {
        return;
    }
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const fz = Math.floor(z);

    if (api.isBlockInLoadedChunk(fx, fy, fz)) {
        for (let dy = 1; dy <= 8; dy++) {
            const below = api.getBlock(fx, fy - dy, fz);
            if (below && below !== "Air") {
                return;   // there is already ground here
            }
        }
    }

    const r = CONFIG.dimensions.platformRadius;
    api.setBlockRect([fx - r, fy - 1, fz - r], [fx + r, fy - 1, fz + r], blockName);
}

/** Moves a player between regions, scaling coordinates the way Nether travel does. */
function travelTo(playerId, toKey) {
    const to = dimension(toKey);
    if (!to) {
        return false;
    }
    const pos = api.getPosition(playerId);
    const fromKey = dimensionAt(pos);
    if (fromKey === toKey) {
        return false;
    }
    const from = dimension(fromKey);

    // Go via overworld-equivalent coordinates so any pair of regions lines up.
    const overworldX = (pos[0] - from.origin[0]) * from.scale;
    const overworldZ = (pos[2] - from.origin[1]) * from.scale;
    const x = to.origin[0] + overworldX / to.scale;
    const z = to.origin[1] + overworldZ / to.scale;

    ensureArrivalGround(x, pos[1], z, to.platformBlock);
    api.setPosition(playerId, x, pos[1], z);
    enterDimension(playerId, toKey, true);

    api.playSound(playerId, "magicAccent2", 0.9, 0.8);
    return true;
}

/** A portal block sends you to its dimension, or home again if you are in it. */
function usePortal(playerId, blockName) {
    const state = stateOf(playerId);
    const now = api.now();
    if (now - (state.lastTravel || 0) < CONFIG.dimensions.travelCooldownMs) {
        return;
    }

    for (const key in CONFIG.dimensions.list) {
        const d = dimension(key);
        if (d.portalBlock !== blockName) {
            continue;
        }
        const here = dimensionAt(api.getPosition(playerId));
        state.lastTravel = now;
        travelTo(playerId, here === key ? "overworld" : key);
        return;
    }
}

function registerPortalRecipes(playerId) {
    const recipes = CONFIG.dimensions.portalRecipes;
    for (const blockName in recipes) {
        api.editItemCraftingRecipes(playerId, blockName, [{
            requires: recipes[blockName],
            produces: 2,
        }]);
    }
}

// -----------------------------------------------------------------------------
// Callbacks
// -----------------------------------------------------------------------------

function onPlayerJoin(playerId) {
    if (CONFIG.ban.enabled && isBanned(playerId)) {
        api.kickPlayer(playerId, CONFIG.ban.reason);
        return;
    }

    stateOf(playerId);
    registerRecipes(playerId);

    if (CONFIG.dimensions.enabled) {
        registerPortalRecipes(playerId);
        // Re-dress the world for wherever they actually are, not where they logged out.
        const key = dimensionAt(api.getPosition(playerId));
        stateOf(playerId).dimension = null;
        enterDimension(playerId, key, false);
    }

    const hp = getMaxHp(playerId);
    applyMaxHp(playerId, hp, 0);
    tell(playerId, "You have " + hearts(hp) + " hearts. Type /smphelp for commands.", "#7bed9f");
}

function onPlayerLeave(playerId) {
    delete players[playerId];
}

function tick() {
    const ids = api.getPlayerIds();
    for (let i = 0; i < ids.length; i++) {
        const playerId = ids[i];
        const pos = api.getPosition(playerId);
        if (!pos) {
            continue;
        }
        const state = stateOf(playerId);
        if (state.lastY != null) {
            const dropped = state.lastY - pos[1];
            // Accumulate while descending; anything else resets it, which is
            // exactly what "did they fall onto this hit" needs.
            state.fallDistance = dropped > 0.05 ? state.fallDistance + dropped : 0;
        }
        state.lastY = pos[1];

        // Catches respawns, admin teleports and simply walking over a border.
        if (CONFIG.dimensions.enabled) {
            const key = dimensionAt(pos);
            if (key !== state.dimension) {
                enterDimension(playerId, key, true);
            }
        }
    }
}

function onBlockStandStart(playerId, x, y, z, blockName) {
    if (CONFIG.dimensions.enabled) {
        usePortal(playerId, blockName);
    }
}

function onAttemptKillPlayer(killedPlayer, attackingLifeform) {
    const byPlayer = isPlayer(attackingLifeform) && attackingLifeform !== killedPlayer;
    const loss = byPlayer ? CONFIG.death.hpLostToPlayer : CONFIG.death.hpLostToWorld;
    if (loss <= 0) {
        return;
    }

    const before = getMaxHp(killedPlayer);
    const shouldDrop = CONFIG.death.dropOrbs && (byPlayer || CONFIG.death.dropOrbsOnWorldDeath);

    // Elimination: dropping to 0 hearts is permanent.
    if (CONFIG.ban.enabled && before - loss <= 0) {
        if (shouldDrop) {
            dropOrbs(killedPlayer, before);
        }
        applyMaxHp(killedPlayer, 0, 0);
        banPlayer(killedPlayer, CONFIG.ban.reason);
        return;
    }

    const lost = -addMaxHp(killedPlayer, -loss, 0);
    if (lost <= 0) {
        tell(killedPlayer, "You are at the minimum of " + hearts(minHp()) + " hearts.", "#ffa502");
        return;
    }

    tell(killedPlayer, "You lost " + hearts(lost) + " hearts. You now have "
        + hearts(getMaxHp(killedPlayer)) + ".", "#ff4757");

    if (byPlayer && CONFIG.death.killerAlsoGains > 0) {
        const gained = addMaxHp(attackingLifeform, CONFIG.death.killerAlsoGains, 0);
        if (gained > 0) {
            tell(attackingLifeform, "You stole " + hearts(gained) + " hearts.", "#7bed9f");
        }
    }

    if (shouldDrop) {
        dropOrbs(killedPlayer, lost);
    }
}

function onPlayerAltAction(playerId) {
    const slot = heldSlot(playerId);
    if (!slot) {
        return;
    }
    const custom = customAttrs(slot.item);

    if (custom[ATTR_ORB]) {
        eatOrb(playerId, slot);
    } else if (custom[ATTR_APPLE]) {
        eatApple(playerId, slot, custom[ATTR_APPLE]);
    } else if (custom[ATTR_MACE]) {
        windCharge(playerId, slot);
    } else if (custom[ATTR_SPEAR]) {
        spearLunge(playerId, slot);
    }
}

function onPlayerDamagingOtherPlayer(attackingPlayer, damagedPlayer, damageDealt) {
    return handleWeaponHit(attackingPlayer, damagedPlayer, damageDealt);
}

function onPlayerDamagingMob(playerId, mobId, damageDealt) {
    return handleWeaponHit(playerId, mobId, damageDealt);
}

function onPlayerChangeBlock(playerId, x, y, z, fromBlock, toBlock) {
    // Only breaking wears a tool down; placing a block does not.
    if (toBlock !== "Air" || fromBlock === "Air") {
        return;
    }
    const slot = heldSlot(playerId);
    if (slot) {
        spendDurability(playerId, slot, CONFIG.durability.costPerBlockBroken);
    }
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

function playerCommand(playerId, command) {
    const parts = String(command).replace(/^\//, "").trim().split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);

    const isPublic = CONFIG.commands.publicCommands.indexOf(name) !== -1;
    if (!isPublic && !isAdmin(playerId)) {
        return false;
    }

    switch (name) {
        case "hp":
        case "hearts": {
            let line = "You have " + hearts(getMaxHp(playerId)) + " / "
                + hearts(CONFIG.health.max) + " hearts.";
            if (CONFIG.orb.usesPerPlayer > 0) {
                line += " Life Orbs left to absorb: " + orbUsesLeft(playerId) + ".";
            }
            tell(playerId, line, "#ff6b81");
            return true;
        }

        case "withdraw":
            return withdraw(playerId, args[0]);

        case "smphelp":
            tell(playerId,
                "/hp - your hearts | /withdraw <hearts> - turn hearts into Life Orbs | "
                + "right click a Life Orb or Golden Apple to eat it | "
                + "craft the " + CONFIG.mace.name + " (" + CONFIG.mace.item + ") and "
                + CONFIG.spear.name + " | craft and place a Purple Portal for the Nether or a "
                + "Black Portal for the End, then stand on it | /where shows your dimension | "
                + "hit 0 hearts and you are banned for good.",
                "#70a1ff");
            return true;

        case "unban": {
            const removed = unbanByName(args[0]);
            tell(playerId, removed ? "Unbanned " + removed + "." : "No ban found for " + args[0] + ".",
                removed ? "#7bed9f" : "#ff4757");
            return true;
        }

        case "bans": {
            const bans = readBans();
            const names = [];
            for (const dbId in bans) {
                names.push(bans[dbId]);
            }
            tell(playerId, names.length ? "Banned: " + names.join(", ") : "Nobody is banned.", "#70a1ff");
            return true;
        }

        case "give": {
            const what = (args[0] || "").toLowerCase();
            if (what === "mace") {
                api.giveItem(playerId, CONFIG.mace.item, 1, maceAttributes(CONFIG.mace.durability));
            } else if (what === "spear") {
                api.giveItem(playerId, CONFIG.spear.item, 1, spearAttributes(CONFIG.spear.durability));
            } else if (what === "gapple") {
                api.giveItem(playerId, "Apple", 1, appleAttributes("golden"));
            } else if (what === "egapple") {
                api.giveItem(playerId, "Apple", 1, appleAttributes("enchanted"));
            } else if (what === "orb") {
                api.giveItem(playerId, CONFIG.orb.item, 1, orbAttributes(CONFIG.orb.hp));
            } else if (what === "netherportal") {
                api.giveItem(playerId, CONFIG.dimensions.list.nether.portalBlock, 8);
            } else if (what === "endportal") {
                api.giveItem(playerId, CONFIG.dimensions.list.end.portalBlock, 8);
            } else {
                tell(playerId, "Usage: /give mace|spear|gapple|egapple|orb|netherportal|endportal",
                    "#ff4757");
            }
            return true;
        }

        case "dim": {
            const wanted = (args[0] || "").toLowerCase();
            if (!dimension(wanted)) {
                tell(playerId, "Usage: /dim " + Object.keys(CONFIG.dimensions.list).join("|"), "#ff4757");
                return true;
            }
            if (!travelTo(playerId, wanted)) {
                tell(playerId, "You are already in " + dimension(wanted).name + ".", "#ffa502");
            }
            return true;
        }

        case "where":
            tell(playerId, "You are in " + dimension(dimensionAt(api.getPosition(playerId))).name + ".",
                "#70a1ff");
            return true;

        case "sethp": {
            const target = findPlayerByName(args[0]);
            const value = parseInt(args[1], 10);
            if (!target || isNaN(value)) {
                tell(playerId, "Usage: /sethp <player> <hp>", "#ff4757");
                return true;
            }
            applyMaxHp(target, clampHp(value), 0);
            tell(playerId, api.getEntityName(target) + " now has "
                + hearts(getMaxHp(target)) + " hearts.", "#7bed9f");
            return true;
        }

        default:
            return false;
    }
}

function withdraw(playerId, rawHearts) {
    const wanted = parseFloat(rawHearts);
    const heartsWanted = isNaN(wanted) ? 1 : wanted;
    if (heartsWanted <= 0) {
        tell(playerId, "Withdraw at least one heart.", "#ff4757");
        return true;
    }

    const hp = Math.round(heartsWanted * CONFIG.hpPerHeart);
    // Never let a withdrawal be the thing that eliminates you.
    const floor = Math.max(minHp(), CONFIG.ban.enabled ? CONFIG.orb.hp : minHp());
    if (getMaxHp(playerId) - hp < floor) {
        tell(playerId, "You cannot drop below " + hearts(floor) + " hearts.", "#ff4757");
        return true;
    }

    const removed = -addMaxHp(playerId, -hp, 0);
    if (removed <= 0) {
        tell(playerId, "You have no hearts to spare.", "#ff4757");
        return true;
    }

    const orbs = Math.max(1, Math.round(removed / CONFIG.orb.hp));
    for (let i = 0; i < orbs; i++) {
        api.giveItem(playerId, CONFIG.orb.item, 1, orbAttributes(CONFIG.orb.hp));
    }
    tell(playerId, "Withdrew " + hearts(removed) + " hearts as " + orbs + " Life Orb(s)."
        + (orbUsesLeft(playerId) <= 0 ? " You cannot absorb these yourself." : ""), "#7bed9f");
    return true;
}

function findPlayerByName(name) {
    if (!name) {
        return null;
    }
    const ids = api.getPlayerIds();
    for (let i = 0; i < ids.length; i++) {
        if (api.getEntityName(ids[i]).toLowerCase() === name.toLowerCase()) {
            return ids[i];
        }
    }
    return null;
}
