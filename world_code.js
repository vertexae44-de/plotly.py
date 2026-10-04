// =====================================================================
//  WORLD CODE  (Weapons/Durability + Wemmbu kit + Sonic Boom + Totem + Ranks)
// =====================================================================

// ================= Weapons + Durability + Mending + Crafting =================

// ---- Custom item tags -------------------------------------------------------
const ATTR_MACE = "smpMace";
const ATTR_SPEAR = "smpSpear";
const ATTR_DAGGER = "smpDagger";
const ATTR_WINDCHARGE = "smpWindCharge";
const ATTR_DUR = "smpDur";
const ATTR_DUR_MAX = "smpDurMax";

// Per-player runtime state (fall distance, cooldown timers).
const players = {};
function stateOf(playerId) {
    let s = players[playerId];
    if (!s) {
        s = players[playerId] = { fallDistance: 0, lastY: null, lastCharge: 0, lastLunge: 0 };
    }
    return s;
}

// Tracks how far each player has fallen; called every tick.
function trackFall(playerId) {
    const s = stateOf(playerId);
    const y = api.getPosition(playerId)[1];
    if (s.lastY === null || y >= s.lastY) {
        s.fallDistance = 0;               // standing or rising
    } else {
        s.fallDistance += s.lastY - y;    // falling
    }
    s.lastY = y;
}

function isPlayer(entityId) {
    return entityId != null && api.getPlayerIds().indexOf(entityId) !== -1;
}

function isAlive(lifeformId) {
    return api.isAlive(lifeformId);
}

function tell(playerId, message, colour) {
    api.sendMessage(playerId, message, { color: colour || "#ffffff" });
}

// ---- CONFIG ------------------------------------------------------------------
const CONFIG = {
    // ---- Windburst Mace (Gambit) --------------------------------------------
    mace: {
        item: "Moonstone Mace",
        name: "Gambit",
        durability: 400,

        minSmashFall: 1.5,           // blocks you must be falling for a smash
        damagePerBlockFallen: 2.5,
        maxSmashDamage: 60,

        windBurstLevel: 3,           // 0 disables it
        windBurstPerLevel: 4.5,

        densityLevel: 3,             // 0 disables it
        densityPerLevel: 0.75,

        chargeUpwardImpulse: 11,
        chargeCooldownMs: 4000,
        chargeDurabilityCost: 3,

        knockbackRadius: 4.5,
        knockbackForce: 9,
        knockbackUp: 5,
        knockbackHitsMobs: true,

        recipe: [
            { items: ["Moonstone"], amt: 400 },
            { items: ["Knight Heart"], amt: 4 },
            { items: ["Stick"], amt: 2 },
        ],
    },

    // ---- Crucible (Breach) --------------------------------------------------
    crucible: {
        name: "Crucible",
        breachPerArmorPiece: 0.2,    // +20% damage per armor piece the victim wears
    },

    // ---- Moonstone Spear ----------------------------------------------------
    spear: {
        item: "Moonstone Spear",
        name: "Moonstone Spear",
        durability: 300,

        lungeForce: 16,
        lungeUp: 3,
        lungeCooldownMs: 3500,
        lungeWindowMs: 1200,
        lungeBonusDamage: 14,
        lungeDurabilityCost: 2,

        recipe: [
            { items: ["Moonstone"], amt: 4 },
            { items: ["Stick"], amt: 2 },
        ],
    },

    // ---- Moonstone Dagger -----------------------------------------------------
    dagger: {
        item: "Moonstone Dagger",
        name: "Moonstone Dagger",
        poisonMs: 4000,
        recipe: [
            { items: ["Rotten Flesh"], amt: 5 },
            { items: ["Moonstone"], amt: 90 },
            { items: ["Stick"], amt: 4 },
        ],
    },

    // ---- Plain maces (no smash ability, just durability) ---------------------
    plainMaces: {
        enabled: true,
        tiers: [
            { item: "Wood Mace", recipe: [{ items: ["Maple Wood Planks"], amt: 80 }, { items: ["Stick"], amt: 20 }] },
            { item: "Stone Mace", recipe: [{ items: ["Stone"], amt: 120 }, { items: ["Stick"], amt: 20 }] },
            { item: "Iron Mace", recipe: [{ items: ["Iron Bar"], amt: 150 }, { items: ["Stick"], amt: 20 }] },
            { item: "Gold Mace", recipe: [{ items: ["Gold Bar"], amt: 180 }, { items: ["Stick"], amt: 20 }] },
            { item: "Diamond Mace", recipe: [{ items: ["Diamond"], amt: 200 }, { items: ["Stick"], amt: 20 }] },
        ],
    },

    // ---- Plain daggers (no poison, just durability) --------------------------
    plainDaggers: {
        enabled: true,
        tiers: [
            { item: "Wood Dagger", recipe: [{ items: ["Maple Wood Planks"], amt: 40 }, { items: ["Stick"], amt: 10 }] },
            { item: "Stone Dagger", recipe: [{ items: ["Stone"], amt: 60 }, { items: ["Stick"], amt: 10 }] },
            { item: "Iron Dagger", recipe: [{ items: ["Iron Bar"], amt: 75 }, { items: ["Stick"], amt: 10 }] },
            { item: "Gold Dagger", recipe: [{ items: ["Gold Bar"], amt: 90 }, { items: ["Stick"], amt: 10 }] },
            { item: "Diamond Dagger", recipe: [{ items: ["Diamond"], amt: 100 }, { items: ["Stick"], amt: 10 }] },
        ],
    },

    // ---- Wind Charge (Iron Fragment): launches you and knocks back nearby players ----
    windCharge: {
        enabled: true,
        item: "Iron Fragment",
        name: "Wind Charge",
        upwardImpulse: 9,
        forwardImpulse: 4,
        cooldownMs: 2000,
        knockbackRadius: 5,
        knockbackForce: 10,
        knockbackUp: 5,
        recipe: [
            { items: ["Mango"], amt: 1 },
            { items: ["Iron Fragment"], amt: 1 },
        ],
        produces: 4,
    },

    // ---- Mending ---------------------------------------------------------------
    mending: {
        enabled: true,
        item: "Aura XP Potion",
        splashItem: "Splash Aura XP Potion",
        costPerMend: 1,
        restoreFraction: 0.35,
    },

    // ---- Durability --------------------------------------------------------
    durability: {
        enabled: true,
        materials: {
            Wood: 60, Fur: 80, Gold: 90, Paint: 120, Stone: 130, Iron: 250,
            Spiked: 400, Mining: 500, Artisan: 1200, Diamond: 1560,
            Knight: 2000, Golem: 2200, Moonstone: 2400, Amethite: 2400,
        },
        kinds: {
            Sword: 1, Dagger: 0.9, Club: 1, Mace: 1.1, Spear: 1, Whip: 0.9,
            Boomerang: 0.9, Axe: 1, Pickaxe: 1,
            Spade: 0.9, Shovel: 0.9, Hoe: 0.8, Bow: 1.2, Crossbow: 1.2, Shield: 1.5,
            Helmet: 0.8, Chestplate: 1.3, Leggings: 1.2, Boots: 0.9, Gauntlets: 0.8,
            Glider: 1.6,
        },
        defaultMaterialUses: 200,
        overrides: {},

        warnAtFraction: 0.1,
        costPerHit: 1,
        costPerBlockBroken: 1,
    },
};

// ---- Inventory helpers ------------------------------------------------------
function heldSlot(playerId) {
    const index = api.getSelectedInventorySlotI(playerId);
    const item = api.getItemSlot(playerId, index);
    return item ? { index: index, item: item } : null;
}

// A fixed backpack slot used as the "off-hand" - only needed if you also use
// mendOffhandItem below.
const OFFHAND_SLOT_INDEX = 44;
function offhandSlot(playerId) {
    const item = api.getItemSlot(playerId, OFFHAND_SLOT_INDEX);
    return item ? { index: OFFHAND_SLOT_INDEX, item: item } : null;
}

function writeSlot(playerId, index, item, amount, attributes) {
    if (amount != null && amount <= 0) {
        api.setItemSlot(playerId, index, "Air", null, undefined, true);
        return;
    }
    api.setItemSlot(playerId, index, item.name, amount, attributes, true);
}

function customAttrs(invenItem) {
    if (!invenItem || !invenItem.attributes) {
        return {};
    }
    return invenItem.attributes.customAttributes || {};
}

function displayName(item) {
    if (item.attributes && item.attributes.customDisplayName) {
        return item.attributes.customDisplayName;
    }
    return item.name;
}

function countItem(playerId, itemName) {
    const amount = api.getInventoryItemAmount(playerId, itemName);
    return amount < 0 ? Infinity : amount;
}

/** Removes `amount` of an item, across however many stacks it is spread over. */
function consumeItems(playerId, itemName, amount) {
    if (countItem(playerId, itemName) < amount) {
        return false;
    }
    let left = amount;
    for (let guard = 0; guard < 64 && left > 0; guard++) {
        const index = api.findItem(playerId, itemName);
        if (index == null) {
            break;
        }
        const slot = api.getItemSlot(playerId, index);
        if (!slot) {
            break;
        }
        const have = slot.amount == null ? 1 : slot.amount;
        const take = Math.min(have, left);
        writeSlot(playerId, index, slot, have - take, slot.attributes);
        left -= take;
    }
    return left <= 0;
}

// ---- Durability bar text -----------------------------------------------------
function blockBar(left, max, segments) {
    const filled = Math.max(0, Math.min(segments, Math.round((left / max) * segments)));
    let bar = "";
    for (let i = 0; i < segments; i++) {
        bar += i < filled ? "▰" : "▱";
    }
    return bar;
}

function durabilityBar(left, max) {
    const percent = Math.round((left / max) * 100);
    return blockBar(left, max, 12) + "  " + left + " / " + max + "  (" + percent + "%)";
}

// ---- Item-attribute builders -------------------------------------------------
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
    lines.push(durabilityBar(left, max));

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
            durabilityBar(left, max),
        customAttributes: { [ATTR_SPEAR]: true, [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
    };
}

function windChargeAttributes() {
    const wc = CONFIG.windCharge;
    return {
        customDisplayName: wc.name,
        customDescription: "Right click to launch yourself and blow nearby players away. Consumed on use.",
        customAttributes: { [ATTR_WINDCHARGE]: true },
    };
}

function daggerAttributes(durabilityLeft) {
    const d = CONFIG.dagger;
    const max = durabilityForName(d.item);
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDisplayName: d.name,
        customDescription: "Poisons whatever it hits for "
            + Math.round(d.poisonMs / 1000) + "s.\n" + durabilityBar(left, max),
        customAttributes: { [ATTR_DAGGER]: true, [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
    };
}

/** A plain weapon with nothing but a name and a durability bar - no special ability. */
function plainDurableAttributes(itemName, durabilityLeft) {
    const max = durabilityForName(itemName);
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDescription: durabilityBar(left, max),
        customAttributes: { [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
    };
}

/** Plain durability plus extra attributes (display name, enchantments...) for kit items. */
function durableOpts(itemName, extra) {
    const base = plainDurableAttributes(itemName);
    const opts = {
        customDescription: base.customDescription,
        customAttributes: Object.assign({}, base.customAttributes, (extra && extra.customAttributes) || {}),
    };
    if (extra && extra.customDisplayName) {
        opts.customDisplayName = extra.customDisplayName;
    }
    return opts;
}

/** Crucible: a Moonstone Mace with a durability bar and Breach. */
function crucibleAttributes() {
    const max = durabilityForName(CONFIG.mace.item);
    return {
        customDisplayName: CONFIG.crucible.name,
        customDescription: "Breach - ignores part of your target's armor.\n" + durabilityBar(max, max),
        customAttributes: { [ATTR_DUR]: max, [ATTR_DUR_MAX]: max },
    };
}

// ---- Durability core ---------------------------------------------------------
const durabilityCache = {};

/** Works out how many uses an item name is worth, e.g. "Diamond Pickaxe" -> 1560. */
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
 * Rebuilds an item's attributes at a new durability, keeping the mace/spear's
 * own special tooltip in sync rather than falling back to a bare wear bar.
 */
function withDurability(item, custom, left, max) {
    if (custom[ATTR_MACE]) {
        return maceAttributes(left);
    }
    if (custom[ATTR_SPEAR]) {
        return spearAttributes(left);
    }
    return {
        customDisplayName: item.attributes && item.attributes.customDisplayName,
        customDescription: durabilityBar(left, max),
        customAttributes: Object.assign({}, custom, { [ATTR_DUR]: left, [ATTR_DUR_MAX]: max }),
    };
}

/** Spends durability on whatever is in the given slot. Breaks the item at 0. */
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

    writeSlot(playerId, slot.index, item, item.amount, withDurability(item, custom, left, max));

    const wasAbove = before > max * CONFIG.durability.warnAtFraction;
    if (wasAbove && left <= max * CONFIG.durability.warnAtFraction) {
        api.queueCrosshairText(playerId, displayName(item) + " is almost broken", 2000);
    }
}

// ---- Mending -------------------------------------------------------------
function mendSlot(playerId, slot, quiet) {
    const m = CONFIG.mending;
    if (!slot) {
        if (!quiet) {
            tell(playerId, "Nothing there to mend.", "#ff4757");
        }
        return false;
    }

    const max = maxDurabilityFor(slot.item);
    if (max <= 0) {
        if (!quiet) {
            tell(playerId, displayName(slot.item) + " has no durability to mend.", "#ff4757");
        }
        return false;
    }

    const custom = customAttrs(slot.item);
    const before = typeof custom[ATTR_DUR] === "number" ? custom[ATTR_DUR] : max;
    if (before >= max) {
        if (!quiet) {
            tell(playerId, displayName(slot.item) + " is already at full durability.", "#ffa502");
        }
        return false;
    }

    if (countItem(playerId, m.item) < m.costPerMend) {
        if (!quiet) {
            tell(playerId, "You need " + m.costPerMend + " " + m.item + "(s) to mend anything.", "#ff4757");
        }
        return false;
    }
    consumeItems(playerId, m.item, m.costPerMend);

    const left = Math.min(max, before + Math.round(max * m.restoreFraction));
    writeSlot(playerId, slot.index, slot.item, slot.item.amount,
        withDurability(slot.item, custom, left, max));

    tell(playerId, "Mended " + displayName(slot.item) + ".", "#7bed9f");
    api.playSound(playerId, "levelup", 0.8, 1.1);
    return true;
}

function mendHeldItem(playerId) {
    return mendSlot(playerId, heldSlot(playerId), false);
}

function mendOffhandItem(playerId) {
    return mendSlot(playerId, offhandSlot(playerId), true);
}

// ---- Crafting: registers every recipe above (called from onPlayerJoin) -------
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

    if (CONFIG.windCharge.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.windCharge.item, [{
            requires: CONFIG.windCharge.recipe,
            produces: CONFIG.windCharge.produces,
            attributes: windChargeAttributes(),
        }]);
    }

    api.editItemCraftingRecipes(playerId, CONFIG.dagger.item, [{
        requires: CONFIG.dagger.recipe,
        produces: 1,
        attributes: daggerAttributes(),
    }]);

    if (CONFIG.plainMaces.enabled) {
        for (let i = 0; i < CONFIG.plainMaces.tiers.length; i++) {
            const tier = CONFIG.plainMaces.tiers[i];
            api.editItemCraftingRecipes(playerId, tier.item, [{
                requires: tier.recipe,
                produces: 1,
                attributes: plainDurableAttributes(tier.item),
            }]);
        }
    }

    if (CONFIG.plainDaggers.enabled) {
        for (let i = 0; i < CONFIG.plainDaggers.tiers.length; i++) {
            const tier = CONFIG.plainDaggers.tiers[i];
            api.editItemCraftingRecipes(playerId, tier.item, [{
                requires: tier.recipe,
                produces: 1,
                attributes: plainDurableAttributes(tier.item),
            }]);
        }
    }
}

// ---- Mace ability: smash, wind charge, knockback -----------------------------
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

/** Turns a mace hit into a smash when the attacker is falling. Returns the damage the hit should deal. */
function maceSmash(attacker, targetId, baseDamage, slot) {
    const state = stateOf(attacker);
    const fell = state.fallDistance;

    spendDurability(attacker, slot, CONFIG.durability.costPerHit);

    if (fell < CONFIG.mace.minSmashFall) {
        return baseDamage;
    }

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
        knockbackAround(centre, attacker, targetId, CONFIG.mace);
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

/** Pushes players (and optionally mobs) near `centre` away from it. `cfg` has knockbackRadius/Force/Up. */
function knockbackAround(centre, attacker, alreadyHit, cfg) {
    const radius = cfg.knockbackRadius;
    let targets = api.getPlayerIds();
    if (cfg.knockbackHitsMobs) {
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

        const strength = (1 - distance / radius) * cfg.knockbackForce;
        const length = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
        api.applyImpulse(other, (dx / length) * strength, cfg.knockbackUp, (dz / length) * strength);
    }
}

// ---- Spear ability: lunge -----------------------------------------------------
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

// ---- Wind Charge item (Iron Fragment): launch + knock back nearby players ----
function useWindChargeItem(playerId, slot) {
    const wc = CONFIG.windCharge;
    const state = stateOf(playerId);
    const now = api.now();
    const remaining = wc.cooldownMs - (now - (state.lastWindCharge || 0));
    if (remaining > 0) {
        api.queueCrosshairText(playerId, "Wind Charge: " + Math.ceil(remaining / 1000) + "s", 800);
        return;
    }
    state.lastWindCharge = now;

    const facing = api.getPlayerFacingInfo(playerId);
    const dir = facing && facing.dir ? facing.dir : [0, 0, 1];
    const length = Math.max(0.001, Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2]));

    api.applyImpulse(
        playerId,
        (dir[0] / length) * wc.forwardImpulse,
        wc.upwardImpulse,
        (dir[2] / length) * wc.forwardImpulse
    );
    api.preventFallDamageNextGrounding(playerId);

    const amount = slot.item.amount == null ? 1 : slot.item.amount;
    writeSlot(playerId, slot.index, slot.item, amount - 1, slot.item.attributes);

    const pos = api.getPosition(playerId);
    knockbackAround(pos, playerId, null, wc);
    api.broadcastSound("magicAccent4", 0.8, 1.3, { playerIdOrPos: pos, maxHearDist: 25 });
    api.playParticleEffect({
        presetId: "stomp",
        pos1: [pos[0] - 1, pos[1], pos[2] - 1],
        pos2: [pos[0] + 1, pos[1] + 0.5, pos[2] + 1],
    });
}

// ---- Right-click dispatch -----------------------------------------------------
function onPlayerAltAction(playerId) {
    const slot = heldSlot(playerId);
    if (!slot) {
        return;
    }
    const custom = customAttrs(slot.item);

    if (custom[ATTR_MACE]) {
        windCharge(playerId, slot);
    } else if (custom[ATTR_SPEAR]) {
        spearLunge(playerId, slot);
    } else if (custom[ATTR_WINDCHARGE]) {
        useWindChargeItem(playerId, slot);
    }
}

// ---- Breach (Crucible): armor is partly ignored --------------------------------
function countArmorPieces(playerId) {
  try {
    return api.getArmorItems(playerId).filter(Boolean).length;
  } catch (e) {
    return 4; // can't read armor: assume a full set
  }
}

// ---- Hit dispatch ---------------------------------------------------------------
function cartBonus(targetId) {
    return 0;   // stub - wire up your own boat-eject bonus here if you use one
}

function computeWeaponDamage(attacker, targetId, damageDealt) {
    const slot = heldSlot(attacker);
    if (!slot) {
        return;
    }
    const custom = customAttrs(slot.item);
    const cart = cartBonus(targetId);

    if (custom[ATTR_MACE]) {
        return maceSmash(attacker, targetId, damageDealt + cart, slot);
    }

    if (custom[ATTR_SPEAR]) {
        spendDurability(attacker, slot, CONFIG.durability.costPerHit);
        if (isLunging(attacker)) {
            stateOf(attacker).lastLunge = 0;   // the bonus lands once per lunge
            return Math.round(damageDealt + cart + CONFIG.spear.lungeBonusDamage);
        }
        return cart > 0 ? Math.round(damageDealt + cart) : undefined;
    }

    if (custom[ATTR_DAGGER]) {
        spendDurability(attacker, slot, CONFIG.durability.costPerHit);
        if (isAlive(targetId)) {
            api.applyEffect(targetId, "Poisoned", CONFIG.dagger.poisonMs);
        }
        return cart > 0 ? Math.round(damageDealt + cart) : undefined;
    }

    const isCrucible = slot.item.attributes && slot.item.attributes.customDisplayName === CONFIG.crucible.name;
    spendDurability(attacker, slot, CONFIG.durability.costPerHit);
    if (isCrucible && isPlayer(targetId)) {
        const breach = damageDealt * CONFIG.crucible.breachPerArmorPiece * countArmorPieces(targetId);
        return Math.round(damageDealt + cart + breach);
    }
    return cart > 0 ? Math.round(damageDealt + cart) : undefined;
}

function onPlayerDamagingMob(playerId, mobId, damageDealt) {
    return computeWeaponDamage(playerId, mobId, damageDealt);
}

// ---- Give helpers (also used by the kit) ---------------------------------------
function giveMace(playerId) {
    api.giveItem(playerId, CONFIG.mace.item, 1, maceAttributes(CONFIG.mace.durability));
}
function giveSpear(playerId) {
    api.giveItem(playerId, CONFIG.spear.item, 1, spearAttributes(CONFIG.spear.durability));
}
function giveDagger(playerId) {
    api.giveItem(playerId, CONFIG.dagger.item, 1, daggerAttributes());
}


// ================= Wemmbu kit =================
// The "golden apple" is a normal Apple renamed and given the Tier 5 enchant tier.
const GOLDEN_APPLE_OPTS = {customDisplayName: "Golden Apple", customAttributes: {enchantmentTier: "Tier 5"}};

// Gives an item. If the game rejects the options (e.g. an unknown attribute),
// retries with just the display name, then with no options, so one bad
// attribute never stops the rest of the kit. Returns true on success.
function give(playerId, name, amount, opts) {
  const attempts = [opts];
  if (opts && opts.customAttributes) {
    attempts.push(opts.customDisplayName ? {customDisplayName: opts.customDisplayName} : undefined);
  }
  if (opts) attempts.push(undefined);
  for (const o of attempts) {
    try {
      if (o) api.giveItem(playerId, name, amount, o);
      else api.giveItem(playerId, name, amount);
      return true;
    } catch (e) {}
  }
  return false;
}

// Built when the kit is requested (CONFIG and the attribute builders must exist by then).
function buildKit() {
  return [
    ["Kingly Amethite Helmet", 1, durableOpts("Kingly Amethite Helmet", {customAttributes: {enchantments: {"Protection": 3, "Health": 2}, enchantmentTier: "Tier 5"}})],
    ["Kingly Amethite Chestplate", 1, durableOpts("Kingly Amethite Chestplate", {customAttributes: {enchantments: {"Protection": 3, "Health Regen": 2}, enchantmentTier: "Tier 5"}})],
    ["Kingly Amethite Leggings", 1, durableOpts("Kingly Amethite Leggings", {customAttributes: {enchantments: {"Protection": 3, "Health": 2}, enchantmentTier: "Tier 5"}})],
    ["Kingly Amethite Boots", 1, durableOpts("Kingly Amethite Boots", {customAttributes: {enchantments: {"Protection": 3, "Health Regen": 2}, enchantmentTier: "Tier 5"}})],
    ["Diamond Sword", 1, durableOpts("Diamond Sword", {customDisplayName: "Sanguine Sword", customAttributes: {enchantments: {"Damage": 3, "Attack Speed": 2}, enchantmentTier: "Tier 5"}})],
    ["Diamond Axe", 1, durableOpts("Diamond Axe")],
    [CONFIG.mace.item, 1, maceAttributes(CONFIG.mace.durability)],        // Gambit (Windburst + Density)
    [CONFIG.mace.item, 1, crucibleAttributes()],                          // Crucible (Breach)
    [CONFIG.windCharge.item, 999, windChargeAttributes()],                // Wind Charge
    ["Strength Potion", 1],
    ["Splash Strength Potion", 5],
    ["Speed Potion", 1],
    ["Splash Speed Potion", 5],
    ["Apple", 64, GOLDEN_APPLE_OPTS],
    ["Cornbread", 64],
    ["Cobweb", 999],
    ["Moonstone Orb", 999],
    ["Moonstone Chest", 999, {customDisplayName: "Ender Chets"}],
  ];
}

function onPlayerChat(playerId, msg) {
  if (msg.startsWith("!Wemmbukit") || msg.startsWith("!wemmbukit")) {
    const failed = [];
    for (const [name, amount, opts] of buildKit()) {
      if (!give(playerId, name, amount, opts)) failed.push(name);
    }
    api.sendMessage(playerId, "Successfully received Wemmbu kit.", {color: "Yellow"});
    if (failed.length > 0) {
      api.sendMessage(playerId, "Could not give: " + failed.join(", "), {color: "Red"});
    }
    return false;
  }

  if (msg.startsWith("!reset")) {
    api.sendMessage(playerId, "Wemmbu kit reset.", {color: "lime"});
    return false;
  }
}

// ================= Golden Apple: effects for a few seconds =================
const APPLE_EFFECT_SECONDS = 8;
const APPLE_EFFECTS = [
  ["Damage Reduction", 2],
  ["Speed", 2],
  ["Health Regen", 2],
  ["Damage", 1],
];

function applyGoldenAppleEffects(playerId) {
  for (const [effect, level] of APPLE_EFFECTS) {
    try {
      api.applyEffect(playerId, effect, APPLE_EFFECT_SECONDS * 1000, {inbuiltLevel: level});
    } catch (e) {}
  }
  api.playSound(playerId, "levelup", 0.8, 1.2);
}

// Every Apple in this world is a golden apple. Eating is detected from the
// inventory: if the apple stack in the selected slot shrinks (or vanishes),
// the player finished eating it. Cancelling the eat leaves the stack alone,
// so no effects. Needs no click event.
const lastApple = {};

function checkApple(id) {
  const slot = api.getSelectedInventorySlotI(id);
  const item = api.getItemSlot(id, slot);
  const now = item && item.name === "Apple" ? (item.amount == null ? 1 : item.amount) : 0;

  const prev = lastApple[id];
  if (prev && prev.slot === slot && now < prev.amount) {
    applyGoldenAppleEffects(id); // fully eaten
  }
  lastApple[id] = now > 0 ? {slot: slot, amount: now} : null;
}

// ================= Tick =================
function tick() {
  for (const id of api.getPlayerIds()) {
    trackFall(id);
    checkApple(id);
  }
}

// ================= Sonic Boom =================
let skTime = {}

function checkCooldown(pId, slot, time) {
    if (!skTime[pId]) skTime[pId] = []
    if (!skTime[pId][slot]) skTime[pId][slot] = 0

    if (api.now() - skTime[pId][slot] > time) {
        skTime[pId][slot] = api.now()
        return true
    }
    return false
}

function useSonicBoom(id) {
    let facing = api.getPlayerFacingInfo(id).dir;
    let pos = api.getPosition(id);
    let amount = 8;

    // check cooldown 3s
    if (!checkCooldown(id, 1, 15000)) {
        api.sendMessage(id, "Sonic Boom is cooldown");
        return;
    }

    // âm thanh
    api.broadcastSound("cannonFire1", 1, 5, {
        playerIdOrPos: id,
        maxHearDist: 15
    });

    // hiệu ứng bắn Sonic Boom
    for (let i = 0; i < amount; i++) {
        api.playParticleEffect({
            dir2: [1, 0, 1],
            dir1: [facing[0], facing[0], facing[2]],
            pos1: [pos[0] + ((i+2)*facing[0]), pos[1] + 1, pos[2] + ((i+2)*facing[2])],
            pos2: [pos[0] + ((i+2)*facing[0]), pos[1] + 1, pos[2] + ((i+2)*facing[2])],
            texture: "bubble",
            minLifeTime: 0.05 + (i/100),
            maxLifeTime: 0.05 + (i/100),
            minEmitPower: 2,
            maxEmitPower: 2,
            minSize: 0.5,
            maxSize: 3 - (i/10),
            manualEmitCount: 10,
            gravity: [0, -2, 0],
            colorGradients: [
                { timeFraction: 0, minColor: [180, 230, 250], maxColor: [200, 255, 255] }
            ],
            velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
            blendMode: 1,
        });

        const magnitude = Math.sqrt(facing[0]*facing[0] + facing[1]*facing[1] + facing[2]*facing[2]);
        const normalized = [facing[0]/magnitude, facing[1]/magnitude, facing[2]/magnitude];
        let x = Math.floor(pos[0] + normalized[0] * i);
        let z = Math.floor(pos[2] + normalized[2] * i);
        let y = Math.floor(pos[1]);

        let hit = api.getEntitiesInRect([x-3,y-3,z-3],[x+3,y+3,z+3]);
        if (hit) {
            for (let h = 0; h < hit.length; h++) {
                let target = hit[h];
                if (target != id) {
                    api.attemptApplyDamage({
                        eId: id,
                        hitEId: target,
                        attemptedDmgAmt: 60,
                        withItem: "Black Sticky Paintball Explosive",
                        attackDir: [facing[0],facing[1],facing[2]],
                        showCritParticles : true,
                        reduceVerticalKbVelocity : false
                    });
                }
            }
        }
    }

    // ====== Buff khi dùng Sonic Boom ======
    api.applyEffect(id,"Speed",15000,{inbuiltLevel:2})
    api.applyEffect(id,"Damage Reduction",15000,{inbuiltLevel:2})
    api.applyEffect(id,"Damage",15000,{inbuiltLevel:10})
    api.setShieldAmount(id,150)

    // hồi máu ngay lập tức
    const oldHealth = api.getHealth(id)
    if(oldHealth < 130){
        api.setHealth(id, oldHealth+30, undefined, true)
    }

    // báo hiệu cooldown bằng icon Black Planks
    api.applyEffect(id, "10", 15000, {
        icon: "Black Planks",
        displayName: `Sonic Boom Cooldown`
    })
}

// ================= Click handler (Sonic Boom) =================
// Wind Charge, Gambit/Crucible and the spear are handled by onPlayerAltAction
// and the damage handlers in the weapons section above.
function onPlayerClick(id) {
    let held = api.getHeldItem(id);
    if (held?.attributes?.customDisplayName == "Sonic Boom") {
        useSonicBoom(id);
    }
}

function onPlayerOpenedChest(playerId, x, y, z, isMoonstoneChest) {
    try {
        if (isMoonstoneChest) {
            api.setPosition(playerId, 43.48, 37.00, 58.49);
        }
    } catch (err) {
        // lỗi sẽ bị bỏ qua
    }
}

// ================= Kills / Deaths / Ranks =================
let playerKills = {}
let playerDeaths = {}
let playerRanks = {}

// ================= Rank colors =================
const rankColors = {
  "Bronze 1": "orange", "Bronze 2": "orange", "Bronze 3": "orange",
  "Silver 1": "lightgray", "Silver 2": "lightgray", "Silver 3": "lightgray",
  "Gold 1": "gold", "Gold 2": "gold", "Gold 3": "gold",
  "Diamond 1": "cyan", "Diamond 2": "cyan", "Diamond 3": "cyan",
  "Sapphire 1": "blue", "Sapphire 2": "blue", "Sapphire 3": "blue",
  "Ruby 1": "red", "Ruby 2": "red", "Ruby 3": "red",
  "Elite 1": "purple", "Elite 2": "purple", "Elite 3": "purple",
  "Champion 1": "pink", "Champion 2": "pink", "Champion 3": "pink",
  "Mythic 1": "lightyellow", "Mythic 2": "lightyellow", "Mythic 3": "lightyellow",
  "Legend": "yellow"
}
function getRankStyle(rank) {
  return { color: rankColors[rank] || "white" }
}

// ================== SAVE / LOAD (slot 20) ==================
function saveStats(id, kills, deaths) {
  api.setMoonstoneChestItemSlot(id, 20, "Black Carpet", 1, {
    customDisplayName: JSON.stringify({ kills, deaths })
  })
}

function loadStats(id) {
  let item = api.getMoonstoneChestItemSlot(id, 20)
  if (!item?.attributes?.customDisplayName) return { kills: 0, deaths: 0 }
  try {
    let data = JSON.parse(item.attributes.customDisplayName)
    return {
      kills: typeof data.kills === "number" ? data.kills : 0,
      deaths: typeof data.deaths === "number" ? data.deaths : 0
    }
  } catch {
    return { kills: 0, deaths: 0 }
  }
}

// ================== UPDATE STATS ==================
function addKills(playerId, amount) {
  const dbid = api.getPlayerDbId(playerId)
  const name = api.getEntityName(playerId)

  if (!playerKills[dbid]) playerKills[dbid] = [name, 0]
  playerKills[dbid][0] = name
  playerKills[dbid][1] += amount

  saveStats(playerId, playerKills[dbid][1], playerDeaths[dbid]?.[1] || 0)
  updateRank(playerId)
  updateKD(playerId)
}

function addDeaths(playerId, amount) {
  const dbid = api.getPlayerDbId(playerId)
  const name = api.getEntityName(playerId)

  if (!playerDeaths[dbid]) playerDeaths[dbid] = [name, 0]
  playerDeaths[dbid][0] = name
  playerDeaths[dbid][1] += amount

  saveStats(playerId, playerKills[dbid]?.[1] || 0, playerDeaths[dbid][1])
  updateKD(playerId)
}

function updateKD(playerId) {
  const dbid = api.getPlayerDbId(playerId)
  const kills = playerKills[dbid]?.[1] || 0
  const deaths = playerDeaths[dbid]?.[1] || 0
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills

  api.setTargetedPlayerSettingForEveryone(playerId, "lobbyLeaderboardValues", {
    a: kills.toString(),
    b: deaths.toString(),
    c: kd.toString()
  })
}

// ================== EVENTS ==================
function onPlayerJoin(playerId) {
  const dbid = api.getPlayerDbId(playerId)
  const name = api.getEntityName(playerId)

  const stats = loadStats(playerId)
  playerKills[dbid] = [name, stats.kills]
  playerDeaths[dbid] = [name, stats.deaths]

  api.setClientOption(playerId, "skyBox", "space_lightblue")
  api.setClientOption(playerId, "lobbyLeaderboardInfo", {
    pfp: {},
    name: { displayName: "Name" },
    a: { displayName: "Kills" },
    b: { displayName: "Deaths" },
    c: { displayName: "K/D" }
  })

  updateRank(playerId)
  updateKD(playerId)

  registerRecipes(playerId)

  api.sendMessage(playerId, "Type !wemmbukit for Wemmbu's kit.", {color: "Yellow"})
}

function onPlayerKilledOtherPlayer(killer, victim) {
  addKills(killer, 1)
  addDeaths(victim, 1)
  api.giveItem(killer, "Draugr Knight Spawner Block", 1, {customDisplayName:"Sculk Coin"});
}

function onPlayerRespawn(playerId) {
  // Nếu muốn respawn tính Death thì mở dòng này
  // addDeaths(playerId, 1)
}

// ================== RANK ==================
function updateRank(playerId) {
  const dbid = api.getPlayerDbId(playerId)
  const kills = playerKills[dbid]?.[1] || 0
  const name = api.getEntityName(playerId)

  let rank = "Bronze 1"
  if (kills >= 5000) rank = "Legend"
  else if (kills >= 4000) rank = "Mythic 3"
  else if (kills >= 3750) rank = "Mythic 2"
  else if (kills >= 3500) rank = "Mythic 1"
  else if (kills >= 3250) rank = "Champion 3"
  else if (kills >= 2950) rank = "Champion 2"
  else if (kills >= 2650) rank = "Champion 1"
  else if (kills >= 2350) rank = "Elite 3"
  else if (kills >= 2100) rank = "Elite 2"
  else if (kills >= 1850) rank = "Elite 1"
  else if (kills >= 1600) rank = "Ruby 3"
  else if (kills >= 1400) rank = "Ruby 2"
  else if (kills >= 1200) rank = "Ruby 1"
  else if (kills >= 1000) rank = "Sapphire 3"
  else if (kills >= 850) rank = "Sapphire 2"
  else if (kills >= 700) rank = "Sapphire 1"
  else if (kills >= 550) rank = "Diamond 3"
  else if (kills >= 450) rank = "Diamond 2"
  else if (kills >= 350) rank = "Diamond 1"
  else if (kills >= 250) rank = "Gold 3"
  else if (kills >= 200) rank = "Gold 2"
  else if (kills >= 150) rank = "Gold 1"
  else if (kills >= 100) rank = "Silver 3"
  else if (kills >= 75) rank = "Silver 2"
  else if (kills >= 50) rank = "Silver 1"
  else if (kills >= 25) rank = "Bronze 3"
  else if (kills >= 10) rank = "Bronze 2"
  else if (kills >= 1) rank = "Bronze 1"

  const previous = playerRanks[dbid] || "Bronze 1"
  if (rank !== previous) {
    api.sendMessage(playerId, `You ranked up! Now: ${rank}`, { color: "yellow" })
    api.broadcastMessage(`${name} reached rank ${rank} !!`, { color: "gold" })
    api.playSound(playerId, "cashRegister", 1, 1)
  }

  playerRanks[dbid] = rank
  const style = getRankStyle(rank)

  api.setTargetedPlayerSettingForEveryone(playerId, "nameTagInfo", {
    content: [{ str: name, style: { color: "cyan" } }],
    subtitle: [{ str: `[${rank}]`, style }]
  }, true)
}

// ================= Totem Of Undying =================
function onPlayerAttemptAltAction(id){

	if (api.getHeldItem(id)?.name == "Gold Spade" &&
		api.getHeldItem(id)?.attributes.customDisplayName == "Totem Of Undying"  		 &&	api.getEffects(id).includes ("Totem") == false){
	       /* ---apply totem effect--- */
		api.applyEffect(id, "Totem", null, {icon: "Gold Spade"})
		slot = api.getSelectedInventorySlotI(id)
		api.setItemSlot(id, slot, "Air")
	}
}

// Saves a victim who would drop below 5 health while holding / having the totem.
function tryTotem(victim, dmg) {
  if ((api.getHeldItem(victim)?.attributes?.customDisplayName === "Totem Of Undying" || api.getEffects(victim).includes('Totem'))
      && api.getHealth(victim) - dmg < 5) {
	/* ---TOTEM WORK--- */
    const pos = api.getPosition(victim);
    api.applyEffect(victim, 'Health Regen', 5000, {inbuiltLevel: 1});
	api.applyEffect(victim, "Heat Resistance", 10000, {inbuiltLevel: 1})
	api.applyEffect(victim, "Damage Reduction", 5000, {inbuiltLevel: 1})
	api.setHealth(victim, 30)
    api.setShieldAmount(victim, 30);
    particle(pos[0], pos[1], pos[2]);
    if (api.getHeldItem(victim)?.attributes?.customDisplayName === "Totem Of Undying"){
	slot = api.getSelectedInventorySlotI(victim)
	api.setItemSlot(victim, slot, "Air")}
	else {api.removeEffect(victim, 'Totem');}
  }
}

function onPlayerDamagingOtherPlayer(attacker, victim, dmg) {
  // Weapon effects first (mace smash, spear lunge, dagger poison, Breach, durability),
  // so the totem sees the real damage.
  const weaponDmg = computeWeaponDamage(attacker, victim, dmg);
  const finalDmg = weaponDmg === undefined ? dmg : weaponDmg;

  tryTotem(victim, finalDmg);

  if (weaponDmg !== undefined) return weaponDmg;
}

function onMobDamagingPlayer(attacker, victim, dmg) {
  tryTotem(victim, dmg);
}

function particle(x, y, z){
y += 1
api.playParticleEffect({
 		dir1: [-1, -1, -1],
 		dir2: [1, 1, 1],
  		pos1: [x + 2, y + 1.5, z + 2],
    	pos2: [x - 2, y - 1.5, z - 2],
    	texture: "glint",
    	minLifeTime: 0.5,
    	maxLifeTime: 2,
    	minEmitPower: 4,
    	maxEmitPower: 6,
    	minSize: 0.1,
   		maxSize: 0.5,
    	manualEmitCount: 85,
    	gravity: [0, -10, 0],
    	colorGradients: [
   	    {
   	        timeFraction: 0,
            minColor: [211, 214, 0, 0.5],
            maxColor: [0, 255, 0, 0.8],
        },
    	],
    	velocityGradients: [
        {
            timeFraction: 1,
            factor: 0.2,
            factor2: 1,
        },
    	],
    	blendMode: 1,
	})
}
