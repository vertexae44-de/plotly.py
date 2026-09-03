// =============================================================================
//  Unstable-style SMP  -  Bloxd.io World Code
//
//  Paste this whole file into World Code (World Settings -> Code -> World Code).
//
//  What it adds:
//    * Life Orbs   - dying drops orbs; whoever right-clicks one gains max HP
//    * Windburst Mace - a smash weapon that launches you into the air on a hit
//    * Durability  - tools and weapons wear out and break (Bloxd has none by default)
//
//  Everything is tunable in CONFIG below. Health in Bloxd is 0-100, not 20,
//  so one "heart" here is HP_PER_HEART points.
// =============================================================================

const CONFIG = {
    hpPerHeart: 10,

    health: {
        starting: 100,   // 10 hearts, the Bloxd default
        min: 20,         //  2 hearts - you can never be ground below this
        max: 200,        // 20 hearts
    },

    death: {
        hpLostToPlayer: 10,   // HP the victim loses when another player kills them
        hpLostToWorld: 0,     // HP lost to fall damage / mobs / lava (0 = free deaths)
        dropOrbs: true,
        dropOrbsOnWorldDeath: false,
        killerAlsoGains: 0,   // instant HP for the killer, on top of the orbs
    },

    orb: {
        item: "Knight Heart",          // base item the orb is made of
        name: "Life Orb",
        hp: 10,                        // HP one orb gives when eaten
        despawnMs: 5 * 60 * 1000,      // 5 min is the engine maximum
        healOnEat: true,               // also top up current health, not just the cap
    },

    mace: {
        item: "Moonstone Club",        // Bloxd has no Mace, so we brand a club
        name: "Windburst Mace",
        durability: 400,

        minSmashFall: 1.5,             // blocks you must be falling before a hit smashes
        damagePerBlockFallen: 2.5,
        maxSmashDamage: 60,

        windBurstLevel: 3,             // 1-5, scales the pop-up after a smash
        windBurstPerLevel: 4.5,

        // Right-click in mid-air to spend a charge and launch yourself upward.
        chargeUpwardImpulse: 11,
        chargeCooldownMs: 4000,
        chargeDurabilityCost: 3,

        knockbackRadius: 4.5,          // splash knockback around the player you smashed
        knockbackForce: 9,
        knockbackUp: 5,

        // Survival route: right click a plain club while carrying the cost.
        forgeCost: { item: "Moonstone", amount: 8 },
    },

    durability: {
        enabled: true,
        // Uses before an item breaks. Anything not listed never wears out.
        maxUses: {
            "Wood Sword": 60, "Stone Sword": 130, "Iron Sword": 250,
            "Gold Sword": 90, "Diamond Sword": 1560, "Knight Sword": 2000,
            "Wood Pickaxe": 60, "Stone Pickaxe": 130, "Iron Pickaxe": 250,
            "Gold Pickaxe": 90, "Diamond Pickaxe": 1560, "Moonstone Pickaxe": 2400,
            "Wood Axe": 60, "Stone Axe": 130, "Iron Axe": 250,
            "Gold Axe": 90, "Diamond Axe": 1560, "Moonstone Axe": 2400,
            "Wood Club": 60, "Stone Club": 130, "Iron Club": 250,
            "Gold Club": 90, "Diamond Club": 1560, "Moonstone Club": 2400,
            "Wood Spear": 60, "Stone Spear": 130, "Iron Spear": 250,
            "Gold Spear": 90, "Diamond Spear": 1560, "Moonstone Spear": 2400,
        },
        warnAtFraction: 0.1,   // flash a warning under 10% durability
        costPerHit: 1,
        costPerBlockBroken: 1,
    },

    commands: {
        // Anyone may run these.
        publicCommands: ["hp", "hearts", "withdraw", "smphelp"],
        // Only names in adminNames may run these.
        adminNames: [],        // e.g. ["YourName"]
        freeMace: true,        // false restricts /mace to adminNames
    },
};

const DB_MAX_HP = "smpMaxHp";
const ATTR_ORB = "smpOrb";
const ATTR_MACE = "smpMace";
const ATTR_DUR = "smpDur";
const ATTR_DUR_MAX = "smpDurMax";

// Per-player runtime state. Rebuilt on join, so nothing here needs persisting.
const players = {};

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function stateOf(playerId) {
    let s = players[playerId];
    if (!s) {
        s = players[playerId] = { fallDistance: 0, lastY: null, lastCharge: 0 };
    }
    return s;
}

function clampHp(hp) {
    return Math.max(CONFIG.health.min, Math.min(CONFIG.health.max, Math.round(hp)));
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
        // Shrinking the cap must pull current health down with it, or the bar reads wrong.
        api.setHealth(playerId, hp);
    } else if (healBy > 0) {
        api.setHealth(playerId, Math.min(hp, current + healBy));
    }
}

/**
 * Moves a player's max HP and returns how much actually changed, which is less
 * than requested once they hit the configured floor or ceiling.
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
    return {
        customDisplayName: CONFIG.orb.name,
        customDescription: "Right click to absorb " + hearts(hp) + " hearts.",
        customAttributes: { [ATTR_ORB]: true, hp: hp },
    };
}

function maceAttributes(durabilityLeft) {
    const max = CONFIG.mace.durability;
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDisplayName: CONFIG.mace.name,
        customDescription:
            "Wind Burst " + CONFIG.mace.windBurstLevel + " - fall onto them to smash.\n" +
            "Right click in mid-air to launch yourself.\n" +
            "Durability: " + left + " / " + max,
        customAttributes: { [ATTR_MACE]: true, [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
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

/** Overwrites a slot, preserving the stack size, or clears it when the count runs out. */
function writeSlot(playerId, index, item, amount, attributes) {
    if (amount != null && amount <= 0) {
        api.setItemSlot(playerId, index, "Air", null, undefined, true);
        return;
    }
    api.setItemSlot(playerId, index, item.name, amount, attributes, true);
}

function countItem(playerId, itemName) {
    const amount = api.getInventoryItemAmount(playerId, itemName);
    return amount < 0 ? Infinity : amount;   // a negative count means infinite
}

/** Removes `amount` of an item across however many stacks it is spread over. */
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

// -----------------------------------------------------------------------------
// Durability
// -----------------------------------------------------------------------------

function maxDurabilityFor(item) {
    const custom = customAttrs(item);
    if (typeof custom[ATTR_DUR_MAX] === "number") {
        return custom[ATTR_DUR_MAX];
    }
    const configured = CONFIG.durability.maxUses[item.name];
    return typeof configured === "number" ? configured : 0;
}

/**
 * Spends durability on whatever is in the given slot.
 * Bloxd has no built-in durability, so it lives in the item's custom attributes
 * and the slot is rewritten each time it changes.
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

    const attributes = custom[ATTR_MACE]
        ? maceAttributes(left)
        : {
              customDisplayName: item.attributes && item.attributes.customDisplayName,
              customDescription: "Durability: " + left + " / " + max,
              customAttributes: Object.assign({}, custom, { [ATTR_DUR]: left, [ATTR_DUR_MAX]: max }),
          };

    writeSlot(playerId, slot.index, item, item.amount, attributes);

    const wasAbove = before > max * CONFIG.durability.warnAtFraction;
    if (wasAbove && left <= max * CONFIG.durability.warnAtFraction) {
        api.queueCrosshairText(playerId, displayName(item) + " is almost broken", 2000);
    }
}

function displayName(item) {
    if (item.attributes && item.attributes.customDisplayName) {
        return item.attributes.customDisplayName;
    }
    return item.name;
}

// -----------------------------------------------------------------------------
// Life Orbs
// -----------------------------------------------------------------------------

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
            false,                       // never merge: each orb carries its own HP value
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

    if (getMaxHp(playerId) >= CONFIG.health.max) {
        api.queueCrosshairText(playerId, "Already at " + hearts(CONFIG.health.max) + " hearts", 1500);
        api.playSound(playerId, "hit1", 0.5, 0.7);
        return;
    }

    const gained = addMaxHp(playerId, hp, CONFIG.orb.healOnEat ? hp : 0);
    if (gained <= 0) {
        return;
    }

    const amount = slot.item.amount == null ? 1 : slot.item.amount;
    writeSlot(playerId, slot.index, slot.item, amount - 1, slot.item.attributes);

    tell(playerId, "You absorbed " + hearts(gained) + " hearts. You now have "
        + hearts(getMaxHp(playerId)) + ".", "#ff6b81");
    api.playSound(playerId, "levelup", 0.8, 1.2);

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

/**
 * Upgrades a plain club into the Windburst Mace in exchange for the forge cost.
 * Stays quiet unless the player is clearly trying, so it never spams normal club use.
 */
function tryForgeMace(playerId, slot) {
    const cost = CONFIG.mace.forgeCost;
    const held = countItem(playerId, cost.item);
    if (held <= 0) {
        return;
    }
    if (held < cost.amount) {
        api.queueCrosshairText(playerId,
            "Need " + cost.amount + " " + cost.item + " to forge a " + CONFIG.mace.name, 2000);
        return;
    }
    if (!consumeItems(playerId, cost.item, cost.amount)) {
        return;
    }

    writeSlot(playerId, slot.index, slot.item, slot.item.amount, maceAttributes(CONFIG.mace.durability));
    tell(playerId, "Forged a " + CONFIG.mace.name + ".", "#7bed9f");
    api.playSound(playerId, "levelup", 0.9, 0.9);
}

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
 * Turns a normal mace hit into a smash when the attacker is falling.
 * Returns the damage the hit should deal.
 */
function maceSmash(attacker, victim, baseDamage, slot) {
    const state = stateOf(attacker);
    const fell = state.fallDistance;

    spendDurability(attacker, slot, CONFIG.durability.costPerHit);

    if (fell < CONFIG.mace.minSmashFall) {
        return baseDamage;
    }

    const bonus = Math.min(CONFIG.mace.maxSmashDamage, fell * CONFIG.mace.damagePerBlockFallen);
    const centre = api.getPosition(victim);

    // Wind Burst: the smash throws the attacker back into the air.
    const lift = CONFIG.mace.windBurstLevel * CONFIG.mace.windBurstPerLevel;
    api.applyImpulse(attacker, 0, lift, 0);
    api.preventFallDamageNextGrounding(attacker);
    state.fallDistance = 0;

    knockbackAround(centre, attacker, victim);

    api.broadcastSound("ominousBellHit", 0.9, 1.0, { playerIdOrPos: centre, maxHearDist: 40 });
    api.playParticleEffect({
        presetId: "stomp",
        pos1: [centre[0] - 2, centre[1], centre[2] - 2],
        pos2: [centre[0] + 2, centre[1] + 1, centre[2] + 2],
    });
    api.shakePlayerCamera(victim, 0.6, 400);

    return Math.round(baseDamage + bonus);
}

function knockbackAround(centre, attacker, alreadyHit) {
    const radius = CONFIG.mace.knockbackRadius;
    const ids = api.getPlayerIds();

    for (let i = 0; i < ids.length; i++) {
        const other = ids[i];
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

        // Falls off linearly, and a direct overlap still gets pushed somewhere.
        const strength = (1 - distance / radius) * CONFIG.mace.knockbackForce;
        const length = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
        api.applyImpulse(other, (dx / length) * strength, CONFIG.mace.knockbackUp, (dz / length) * strength);
    }
}

// -----------------------------------------------------------------------------
// Callbacks
// -----------------------------------------------------------------------------

function onPlayerJoin(playerId) {
    stateOf(playerId);
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
            // Accumulate while descending; any non-fall resets it, which is what a
            // "did they fall onto this hit" check needs.
            state.fallDistance = dropped > 0.05 ? state.fallDistance + dropped : 0;
        }
        state.lastY = pos[1];
    }
}

function onAttemptKillPlayer(killedPlayer, attackingLifeform) {
    const byPlayer = isPlayer(attackingLifeform) && attackingLifeform !== killedPlayer;
    const loss = byPlayer ? CONFIG.death.hpLostToPlayer : CONFIG.death.hpLostToWorld;
    if (loss <= 0) {
        return;
    }

    const lost = -addMaxHp(killedPlayer, -loss, 0);
    if (lost <= 0) {
        tell(killedPlayer, "You are at the minimum of " + hearts(CONFIG.health.min) + " hearts.", "#ffa502");
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

    const shouldDrop = CONFIG.death.dropOrbs && (byPlayer || CONFIG.death.dropOrbsOnWorldDeath);
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
    } else if (custom[ATTR_MACE]) {
        windCharge(playerId, slot);
    } else if (slot.item.name === CONFIG.mace.item) {
        tryForgeMace(playerId, slot);
    }
}

function onPlayerDamagingOtherPlayer(attackingPlayer, damagedPlayer, damageDealt) {
    const slot = heldSlot(attackingPlayer);
    if (!slot) {
        return;
    }
    if (customAttrs(slot.item)[ATTR_MACE]) {
        return maceSmash(attackingPlayer, damagedPlayer, damageDealt, slot);
    }
    spendDurability(attackingPlayer, slot, CONFIG.durability.costPerHit);
}

function onPlayerDamagingMob(playerId) {
    const slot = heldSlot(playerId);
    if (slot) {
        spendDurability(playerId, slot, CONFIG.durability.costPerHit);
    }
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
    if (!isPublic && !isAdmin(playerId) && !(name === "mace" && CONFIG.commands.freeMace)) {
        return false;
    }

    switch (name) {
        case "hp":
        case "hearts":
            tell(playerId, "You have " + hearts(getMaxHp(playerId)) + " / "
                + hearts(CONFIG.health.max) + " hearts.", "#ff6b81");
            return true;

        case "withdraw":
            return withdraw(playerId, args[0]);

        case "mace":
            api.giveItem(playerId, CONFIG.mace.item, 1, maceAttributes(CONFIG.mace.durability));
            tell(playerId, "Given a " + CONFIG.mace.name + ".", "#7bed9f");
            return true;

        case "orb": {
            const amount = Math.max(1, parseInt(args[0], 10) || 1);
            for (let i = 0; i < amount; i++) {
                api.giveItem(playerId, CONFIG.orb.item, 1, orbAttributes(CONFIG.orb.hp));
            }
            return true;
        }

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

        case "smphelp":
            tell(playerId, "/hp - your hearts | /withdraw <hearts> - turn hearts into Life Orbs"
                + " | right click a Life Orb to eat it | right click the "
                + CONFIG.mace.name + " in mid-air to wind charge | right click a "
                + CONFIG.mace.item + " holding " + CONFIG.mace.forgeCost.amount + " "
                + CONFIG.mace.forgeCost.item + " to forge the mace", "#70a1ff");
            return true;

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
    if (getMaxHp(playerId) - hp < CONFIG.health.min) {
        tell(playerId, "You cannot drop below " + hearts(CONFIG.health.min) + " hearts.", "#ff4757");
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
    tell(playerId, "Withdrew " + hearts(removed) + " hearts as " + orbs + " Life Orb(s).", "#7bed9f");
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
