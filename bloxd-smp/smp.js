// =============================================================================
//  Unstable-style SMP  -  Bloxd.io World Code
//
//  Paste this whole file into World Settings -> Code -> World Code.
//
//  Hearts           a player kill drops Hearts. Eat one, gain one heart, no limit
//  The Void         hit 0 hearts and you are exiled until you find 3 orbs
//  Moonstone Mace   smash players AND mobs from the air. Wind Burst + Density
//  Moonstone Spear  right click to lunge, hit hard while lunging
//  Wind Charge      craft from Mango + Iron Fragment, right click to launch
//  Repair Kit       craft from Iron Fragment + Stick, /repair to restore wear
//  Bulwark shield   right click to raise: blocks damage, shows on your off arm
//  Golden Apples    two tiers. Heal, shield, regen and fire resistance
//  Durability       Bloxd has none, so this adds it to every tool and weapon
//  Nether & End     portals, own fog/light/gravity, 8:1 nether coordinates
//  Crystal PvP      place a Crystal, hit it, everything nearby is launched
//  Cart PvP         catch someone in a boat and they take extra damage
//  !anon            hides your nametag and your name in chat
//  NPCs             player-model people who chop, mine, build huts, chat and fight
//  Crafting         mace, spear, apples, portals and crystals have recipes
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
        // What happens when you run out of hearts.
        //   "void" - exiled to the Void until you find 3 Orbs of Resurrection
        //   "kick" - permanently banned from the world (an admin can /unban)
        mode: "void",
        reason: "You hit 0 hearts. You are eliminated from this SMP.",
        voidReason: "You ran out of hearts. Find 3 Orbs of Resurrection to escape the Void.",
        announce: true,
        voidHearts: 30,      // HP you get while stranded, so you can move around
    },

    // ---- Escaping the Void --------------------------------------------------
    resurrection: {
        item: "Green Portal",           // a real block, mined out of the Void
        name: "Orb of Resurrection",
        required: 3,
        heartsOnReturn: 50,             // 5 hearts, a second chance not a reset
    },

    death: {
        hpLostToPlayer: 10,   // hearts the victim loses to a player kill
        hpLostToWorld: 0,     // fall damage / mobs / lava. 0 = free
        dropOrbs: true,
        dropOrbsOnWorldDeath: false,
        killerAlsoGains: 0,   // instant HP for the killer, on top of the orbs
    },

    // ---- Death announcements -------------------------------------------------
    // The engine's own killfeed panel prints an automatic entry for every kill
    // with no way to relabel or suppress just that entry, so leaving it on next
    // to our own message is what caused a kill to show twice. The fix is to
    // switch the panel off for everyone and let this be the only kill or death
    // message anyone ever sees - exactly one call site, exactly once per death.
    killFeed: {
        enabled: true,
        disableNativePanel: true,
        icon: "\u2620",              // a skull, so a death reads as a death
        playerColour: "#ff6b6b",
        worldColour: "#9aa0a6",
    },

    // A death is heard everywhere, not just nearby - so a fight on the far
    // side of the world still tells everyone something happened.
    deathSound: {
        enabled: true,
        sound: "ominousBellHit",
        volume: 1,
        rate: 0.6,
        // Bigger than any distance in the world, including the 30000-block
        // dimension offsets, so it reaches every player no matter where they are.
        maxHearDist: 1000000,
    },

    orb: {
        item: "Aura XP Orb",
        name: "Heart",               // eat one, gain one heart - no catch
        hp: 10,                      // one heart per orb
        despawnMs: 5 * 60 * 1000,    // 5 min is the engine maximum
        healOnEat: true,
        // How many a player may ever absorb. 0 = no limit, so kills genuinely
        // pay out - this is the whole point of a lifesteal SMP.
        usesPerPlayer: 0,
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

    // ---- Wind Charge ----------------------------------------------------------
    // A standalone throwable-style launch, separate from the mace's own wind
    // charge - anyone can carry a stack of these, not just whoever is holding
    // the mace. Bloxd has no Wind Charge item, so this is a tagged Iron Fragment.
    windCharge: {
        enabled: true,
        item: "Iron Fragment",   // a real Bloxd item; looks the part
        name: "Wind Charge",
        upwardImpulse: 9,
        forwardImpulse: 4,       // a small push the way you are facing too
        cooldownMs: 2000,
        recipe: [
            { items: ["Mango"], amt: 1 },
            { items: ["Iron Fragment"], amt: 1 },
        ],
        produces: 4,
    },

    // ---- Repair Kit -----------------------------------------------------------
    // Restores durability on whatever you're holding via /repair - works on any
    // durable item in the game, not just this mod's own weapons. The base item
    // (a portal block) has no other use anywhere in this script, so counting how
    // many a player holds by name is always unambiguous - the same trick the
    // Orbs of Resurrection use.
    repair: {
        enabled: true,
        item: "Yellow Portal",
        name: "Repair Kit",
        restoreFraction: 0.5,   // one kit restores half of an item's max durability
        recipe: [
            { items: ["Iron Fragment"], amt: 4 },
            { items: ["Stick"], amt: 2 },
        ],
        produces: 2,
    },

    // ---- Off-hand -------------------------------------------------------------
    // Bloxd has NO off-hand slot: every inventory cell, slot 0 included, is
    // plain numbered storage the engine treats identically. So slot 0 is
    // reserved by convention instead - a rule this script enforces, checked
    // every tick. Whatever sits there is "off-handed": it shows as a status
    // effect icon, and if it happens to be a Bulwark it protects you
    // automatically, leaving your main hand free for a sword. Right click a
    // plain item to swap it in, right click with an empty hand to take it
    // back, or /offhand to force-swap anything (a shield included).
    //
    // The item genuinely stays in the inventory rather than being held in a
    // variable, so a rejoin or a server restart can never lose it.
    offhand: {
        enabled: true,
        slotIndex: 0,        // the top-left cell of the inventory grid
        effectIcon: true,    // show the carried item as a status effect icon
        particles: true,     // a glint puff on every swap
        swapSound: "swoosh",
        colour: "#9fe6a0",

        // Bloxd has no key-binding hook, so these are the no-chat ways in:
        // right click whatever you are holding, or - on touchscreens - the
        // engine's own action button, labelled here.
        swapOnRightClick: true,
        touchButton: "🛡 Off-hand",   // null hides the button
    },

    // ---- Shield (Bulwark) ------------------------------------------------------
    // Bloxd has no dedicated shield item, so this rebuilds one from real
    // primitives: hold it and right click to raise it manually, OR park it in
    // the off-hand slot above and it protects you passively, without needing
    // to be selected - so you can fight with a sword and be guarded at the
    // same time. Either way it shows on your OTHER arm as a mesh attachment
    // and a status chip in the top-left HUD strip (the engine's own
    // headerChips option), while it soaks a fraction of incoming player
    // damage using Bloxd's own numeric shield resource.
    //
    // Scope: blocks player-vs-player hits and NPC attacks. It does not reduce
    // real-mob damage (never hooked to onMobDamagingPlayer) or crystal blasts
    // (explosions bypass it, same as most games).
    shield: {
        enabled: true,
        item: "Brown Paintball Explosive Item",   // a real Bloxd item, held as the visual base
        name: "Bulwark",
        durability: 500,

        raiseShieldAmount: 30,     // tops shield up to at least this when raised
        maxShieldOption: 60,       // raises the client's shield ceiling so it can show
        blockFraction: 0.6,        // fraction of incoming player/NPC damage blocked
        blockDurabilityCost: 2,    // per hit blocked

        armNode: "ArmLeftMesh",    // the "off-hand" arm - opposite the weapon hand
        meshColour: [176, 184, 196],
        hudChip: "\uD83D\uDEE1 Shield raised",

        recipe: [
            { items: ["Maple Wood Planks"], amt: 6 },
            { items: ["Iron Bar"], amt: 1 },
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
                    fogColourOverride: "#6b1105",       // thick red haze
                    fogChunkDistanceOverride: 5,        // you cannot see far in here
                    ambientLightColourOverride: "#5a1a0d",
                    skyLightColourOverride: "#a8331a",
                    gravityMultiplier: 1,
                },
            },
            "void": {
                name: "The Void",
                origin: [30000, 30000],
                scale: 1,
                platformBlock: "Obsidian",
                // No portalBlock: the only way out is the resurrection orbs.
                clientOptions: {
                    fogColourOverride: "#050508",
                    fogChunkDistanceOverride: 3,      // you can barely see
                    ambientLightColourOverride: "#0a0a12",
                    skyLightColourOverride: "#15151f",
                    gravityMultiplier: 0.5,
                },
            },
            end: {
                name: "The End",
                origin: [0, 30000],
                scale: 1,
                portalBlock: "Black Portal",
                platformBlock: "Obsidian",
                clientOptions: {
                    fogColourOverride: "#2e0f52",       // deep purple void
                    fogChunkDistanceOverride: 8,
                    ambientLightColourOverride: "#2a1247",
                    skyLightColourOverride: "#7d4fd1",
                    gravityMultiplier: 0.7,             // floatier, like the End
                },
            },
        },

        // ---- Terrain generation ---------------------------------------------
        // The Nether and End regions start as empty void. This fills chunks in
        // around players as they explore, so the dimensions are real places.
        generation: {
            enabled: true,
            chunkSize: 16,
            radius: 2,             // chunks generated around each player (2 = 5x5)
            columnsPerTick: 24,    // work budget, spread over ticks to avoid lag
            markerY: 0,            // one marker block per chunk records "generated"
            markerBlock: "Bedrock",

            nether: {
                seed: 1337,
                floorY: 20,
                ceilingY: 92,
                groundBase: 36, groundAmp: 12, groundScale: 26,
                ceilingBase: 78, ceilingAmp: 9, ceilingScale: 31,
                lavaLevel: 32,
                accentChance: 0.06,   // magma blotches on the surface
                blocks: {
                    floor: "Bedrock",
                    base: "Red Sandstone",
                    top: "Red Sand",
                    accent: "Magma",
                    liquid: "Lava",
                    ceiling: "Red Sandstone Bricks",
                },
            },

            "void": {
                seed: 4242,
                baseY: 60,
                centreIslandRadius: 10,
                islandScale: 30, islandThreshold: 0.72,   // far rarer than the End
                thickness: 3, driftScale: 24, drift: 12,
                orbChance: 0.006,     // how often a platform top carries an orb
                blocks: {
                    base: "Black Concrete",
                    top: "Obsidian",
                    orb: "Green Portal",
                },
            },

            end: {
                seed: 90210,
                baseY: 56,
                // Noise alone can leave the arrival point over open void, so the
                // centre of the region is always solid ground.
                centreIslandRadius: 24,
                islandScale: 44, islandThreshold: 0.5,
                thickness: 9, driftScale: 30, drift: 7,
                pillarChance: 0.004, pillarHeight: 14,
                blocks: {
                    base: "Bone Block",
                    top: "White Concrete",
                    pillar: "Obsidian",
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

    // ---- Crystal PvP --------------------------------------------------------
    // Place a Crystal, hit it, everything nearby gets blown apart.
    crystal: {
        enabled: true,
        block: "Crystal",
        damage: 45,
        radius: 6,
        knockback: 14,
        knockbackUp: 6,
        selfDamageFraction: 0.5,   // your own crystal hurts you less
        hitsMobs: true,
        breakBlocks: false,        // true lets crystals crater the terrain
        recipe: [
            { items: ["Obsidian"], amt: 4 },
            { items: ["Moonstone"], amt: 2 },
        ],
    },

    // ---- Cart PvP -----------------------------------------------------------
    // Bloxd has no minecarts or rails, so this rides on the vehicles it does
    // have: boats. Catch someone while they are in one and they pay for it.
    cart: {
        enabled: true,
        bonusDamage: 12,
        ejectOnHit: true,
        ejectImpulse: 13,
        ejectUp: 7,
    },

    // ---- Anonymous mode -----------------------------------------------------
    anonymous: {
        enabled: true,
        chatCommand: "!anon",
        displayName: "Anonymous",
        hideNameTag: true,
        hideInChat: true,
        // The native killfeed panel is handled globally by killFeed.* below, not
        // per-anon here - see the death announcements section.
        colour: "#9aa0a6",
    },

    // ---- NPCs ---------------------------------------------------------------
    // Real player models, not mobs: Bloxd's "Person" mesh entity wearing one of
    // the game's NPC skins, moved and fought by this script rather than mob AI.
    npcs: {
        enabled: true,
        count: 4,
        home: [0, 0],            // xz they live around
        wanderRadius: 45,
        respawnDelayMs: 90000,
        thinkEveryTicks: 20,     // decisions once a second
        moveEveryTicks: 2,       // footsteps ten times a second

        // Full-body NPC skins, applied through the "head" part like the engine does.
        skins: [
            "farmer", "trader", "monster_hunter_lorenzo", "wizard",
            "chef", "painter_spencer", "portal_mage", "trader_blue",
        ],
        names: [
            "Kade", "Milo", "Rin", "Ash", "Juno",
            "Wren", "Otto", "Sable", "Pip", "Vex",
        ],

        maxHealth: 100,
        walkSpeed: 0.16,         // blocks per movement step
        runSpeedMultiplier: 1.7,
        stepUp: 1,               // how high a ledge they can walk up
        arriveRadius: 1.5,

        attackRange: 2.6,
        attackDamage: 8,
        attackCooldownMs: 1200,

        // ---- Work -----------------------------------------------------------
        // They earn their keep: gather their trade's material, then spend it
        // building a hut at their own plot, one block at a time.
        work: {
            enabled: true,
            workEveryTicks: 10,      // one block action every half second
            radius: 30,              // how far from home they will work
            searchSamples: 12,       // random probes per hunt for something to do
            searchDepth: 14,         // how tall a column each probe reads
            reach: 3.2,              // how close they must stand to a block
            hut: { half: 2, height: 3 },
            restAfterHutMs: 60000,

            trades: {
                lumberjack: {
                    gathers: [
                        "Maple Log", "Pine Log", "Plum Log", "Cedar Log", "Aspen Log",
                        "Jungle Log", "Palm Log", "Pear Log", "Cherry Log",
                    ],
                    buildsWith: "Maple Wood Planks",
                    working: ["timber", "few more logs and im set", "this axe is blunt"],
                },
                miner: {
                    gathers: ["Stone", "Coal Ore", "Iron Ore", "Gravel"],
                    buildsWith: "Stone",
                    working: ["found a vein", "digging down", "just stone again"],
                },
            },
        },

        noticeRadius: 12,
        greetCooldownMs: 60000,
        chatterMinMs: 45000,
        chatterMaxMs: 150000,
        fleeAtHpFraction: 0.3,
        forgetProvokerMs: 20000,
        chatColour: "#c9d1d9",
        dropsLifeOrb: false,     // true makes NPC hunting an orb source

        // What they say. One personality per NPC, picked when they spawn.
        personalities: {
            friendly: {
                greet: ["hey", "oh hi", "yo", "hey there", "didnt see you"],
                idle: ["nice out here", "anyone seen my pickaxe", "brb mining", "this place is huge"],
                hurt: ["ow", "what was that for", "hey!!", "im not even armed"],
                flee: ["nope nope nope", "im out", "not worth it"],
                built: ["hut's done", "not bad if i say so myself", "home sweet home"],
            },
            cocky: {
                greet: ["sup", "you again", "look who it is", "yeah?"],
                idle: ["someone fight me", "bored", "20 hearts by friday", "easy game"],
                hurt: ["thats it?", "big mistake", "keep going", "cute"],
                flee: ["ill be back", "lucky hit", "this isnt over"],
                built: ["built that in a day", "better than yours", "done already"],
            },
            quiet: {
                greet: ["...", "hm", "hey.", "oh"],
                idle: ["...", "hm.", "quiet today"],
                hurt: ["stop", "why", "..."],
                flee: ["no", "leaving"],
                built: ["done.", "hm. finished"],
            },
            trader: {
                greet: ["got any moonstone?", "trading hearts, interested?", "hey, buying obsidian"],
                idle: ["wtb moonstone paying well", "selling gapples", "anyone got knight hearts"],
                hurt: ["hey! im a trader!", "thats bad for business", "rude"],
                flee: ["fine fine take it", "not paid enough for this"],
                built: ["shop's open", "come see the new place"],
            },
        },
    },

    commands: {
        publicCommands: ["hp", "hearts", "withdraw", "repair", "offhand", "shield", "smphelp",
            "where", "anon", "orbs", "npcs"],
        adminNames: [],        // e.g. ["YourName"] - needed for /unban, /orb, /sethp
    },
};

const DB_MAX_HP = "smpMaxHp";
const DB_BANS = "smpBans";
const DB_ORBS_EATEN = "smpOrbsEaten";
const DB_DIMENSION = "smpDimension";
const DB_ANON = "smpAnon";

const ATTR_ORB = "smpOrb";
const ATTR_MACE = "smpMace";
const ATTR_SPEAR = "smpSpear";
const ATTR_WINDCHARGE = "smpWindCharge";
const ATTR_SHIELD = "smpShield";
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
    // The elimination is already covered by announceDeath - no second message here.
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
        customDescription: "Right click to launch yourself. Consumed on use.",
        customAttributes: { [ATTR_WINDCHARGE]: true },
    };
}

function repairKitAttributes() {
    const r = CONFIG.repair;
    return {
        customDisplayName: r.name,
        customDescription: "Hold a damaged item and type /repair. Restores "
            + Math.round(r.restoreFraction * 100) + "% of its max durability.",
    };
}

function shieldAttributes(durabilityLeft) {
    const c = CONFIG.shield;
    const max = c.durability;
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDisplayName: c.name,
        customDescription: "Right click to raise it.\n"
            + "Blocks " + Math.round(c.blockFraction * 100) + "% of incoming damage while raised.\n"
            + durabilityBar(left, max),
        customAttributes: { [ATTR_SHIELD]: true, [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
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

/** A 12-segment wear bar, e.g. "durability 280/400  [!!!!!!!!....]". */
function durabilityBar(left, max) {
    const segments = 12;
    const filled = Math.max(0, Math.min(segments, Math.round((left / max) * segments)));
    let bar = "";
    for (let i = 0; i < segments; i++) {
        bar += i < filled ? "\u25B0" : "\u25B1";   // filled / empty parallelogram
    }
    const percent = Math.round((left / max) * 100);
    return bar + "  " + left + " / " + max + "  (" + percent + "%)";
}

function displayName(item) {
    if (item.attributes && item.attributes.customDisplayName) {
        return item.attributes.customDisplayName;
    }
    return item.name;
}

function countItem(playerId, itemName) {
    const amount = api.getInventoryItemAmount(playerId, itemName);
    return amount < 0 ? Infinity : amount;   // a negative count means infinite
}

/** Removes `amount` of an item, across however many stacks it is spread over. */
function consumeItems(playerId, itemName, amount) {
    if (countItem(playerId, itemName) < amount) {
        return false;   // never take a partial payment
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

    if (CONFIG.crystal.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.crystal.block, [{
            requires: CONFIG.crystal.recipe,
            produces: 1,
        }]);
    }

    if (CONFIG.windCharge.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.windCharge.item, [{
            requires: CONFIG.windCharge.recipe,
            produces: CONFIG.windCharge.produces,
            attributes: windChargeAttributes(),
        }]);
    }

    if (CONFIG.repair.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.repair.item, [{
            requires: CONFIG.repair.recipe,
            produces: CONFIG.repair.produces,
            attributes: repairKitAttributes(),
        }]);
    }

    if (CONFIG.shield.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.shield.item, [{
            requires: CONFIG.shield.recipe,
            produces: 1,
            attributes: shieldAttributes(CONFIG.shield.durability),
        }]);
    }

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

    writeSlot(playerId, slot.index, item, item.amount, withDurability(item, custom, left, max));

    const wasAbove = before > max * CONFIG.durability.warnAtFraction;
    if (wasAbove && left <= max * CONFIG.durability.warnAtFraction) {
        api.queueCrosshairText(playerId, displayName(item) + " is almost broken", 2000);
    }
}

/**
 * Rebuilds an item's attributes at a new durability, keeping any special
 * tooltip (mace/spear) in sync rather than falling back to a bare wear bar.
 * Shared by ordinary wear and by /repair, so the two can never drift apart.
 */
function withDurability(item, custom, left, max) {
    if (custom[ATTR_MACE]) {
        return maceAttributes(left);
    }
    if (custom[ATTR_SPEAR]) {
        return spearAttributes(left);
    }
    if (custom[ATTR_SHIELD]) {
        return shieldAttributes(left);
    }
    return {
        customDisplayName: item.attributes && item.attributes.customDisplayName,
        customDescription: durabilityBar(left, max),
        customAttributes: Object.assign({}, custom, { [ATTR_DUR]: left, [ATTR_DUR_MAX]: max }),
    };
}

/**
 * Spends one Repair Kit to restore durability on whatever the player is
 * holding. Works on anything durabilityForName recognises - every tool,
 * weapon, bow and armour piece in the game, not only this mod's own items.
 */
function repairHeldItem(playerId) {
    const r = CONFIG.repair;
    const slot = heldSlot(playerId);
    if (!slot) {
        tell(playerId, "Hold the item you want to repair first.", "#ff4757");
        return;
    }

    const max = maxDurabilityFor(slot.item);
    if (max <= 0) {
        tell(playerId, displayName(slot.item) + " has no durability to repair.", "#ff4757");
        return;
    }

    const custom = customAttrs(slot.item);
    const before = typeof custom[ATTR_DUR] === "number" ? custom[ATTR_DUR] : max;
    if (before >= max) {
        tell(playerId, displayName(slot.item) + " is already at full durability.", "#ffa502");
        return;
    }

    if (countItem(playerId, r.item) < 1) {
        tell(playerId, "You need a " + r.name + " to repair anything - craft one first.", "#ff4757");
        return;
    }
    consumeItems(playerId, r.item, 1);

    const left = Math.min(max, before + Math.round(max * r.restoreFraction));
    writeSlot(playerId, slot.index, slot.item, slot.item.amount,
        withDurability(slot.item, custom, left, max));

    tell(playerId, "Repaired " + displayName(slot.item) + ".", "#7bed9f");
    api.playSound(playerId, "levelup", 0.8, 1.1);
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
        api.queueCrosshairText(playerId, "You have already absorbed your " + CONFIG.orb.name, 2000);
        tell(playerId, "You can only absorb " + CONFIG.orb.usesPerPlayer + " " + CONFIG.orb.name
            + " ever. Trade this one to someone else.", "#ffa502");
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
// Wind Charge (the standalone item, not the mace's built-in ability)
// -----------------------------------------------------------------------------

/** Consumes one Wind Charge to launch the player up and slightly forward. */
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
    api.broadcastSound("magicAccent4", 0.8, 1.3, { playerIdOrPos: pos, maxHearDist: 25 });
    api.playParticleEffect({
        presetId: "stomp",
        pos1: [pos[0] - 1, pos[1], pos[2] - 1],
        pos2: [pos[0] + 1, pos[1] + 0.5, pos[2] + 1],
    });
}

// -----------------------------------------------------------------------------
// Off-hand
// -----------------------------------------------------------------------------

/** Reads the fixed "off-hand" slot - a script convention, not a native engine slot. */
function offhandSlot(playerId) {
    const item = api.getItemSlot(playerId, CONFIG.offhand.slotIndex);
    return item ? { index: CONFIG.offhand.slotIndex, item: item } : null;
}

/** Writes a whole item into a slot, or clears it when there is nothing to write. */
function putSlot(playerId, index, item) {
    if (!item) {
        api.setItemSlot(playerId, index, "Air", null, undefined, true);
        return;
    }
    api.setItemSlot(playerId, index, item.name, item.amount, item.attributes, true);
}

/**
 * Swaps what you are holding with what is in the off-hand slot, both ways:
 * a held item goes off-hand and whatever was there lands in your hand, and an
 * empty hand simply pulls the off-hand item back out.
 *
 * Because the off-hand is a real inventory slot this is a straight two-slot
 * swap - nothing is ever parked in a variable that a rejoin or a restart
 * could lose, and there is no "inventory full" case to fail on.
 */
function swapOffhand(playerId) {
    const c = CONFIG.offhand;
    const selected = api.getSelectedInventorySlotI(playerId);
    if (selected === c.slotIndex) {
        tell(playerId, "That slot is your off-hand already.", "#ffa502");
        return false;
    }

    const held = api.getItemSlot(playerId, selected);
    const stored = api.getItemSlot(playerId, c.slotIndex);
    if (!held && !stored) {
        return false;   // empty hand, empty off-hand: nothing to do
    }

    putSlot(playerId, c.slotIndex, held);
    putSlot(playerId, selected, stored);

    if (held) {
        tell(playerId, "Off-hand: " + displayName(held)
            + (stored ? " (returned " + displayName(stored) + ")" : ""), c.colour);
    } else {
        tell(playerId, "Took " + displayName(stored) + " out of your off-hand.", c.colour);
    }
    offhandSwapEffects(playerId);
    return true;
}

/** The glint puff and swoosh that sell the swap. */
function offhandSwapEffects(playerId) {
    const c = CONFIG.offhand;
    if (c.swapSound) {
        api.playSound(playerId, c.swapSound, 0.6, 1.2);
    }
    if (!c.particles) {
        return;
    }
    const pos = api.getPosition(playerId);
    if (!pos) {
        return;
    }
    api.playParticleEffect({
        pos1: [pos[0] - 0.5, pos[1] + 0.5, pos[2] - 0.5],
        pos2: [pos[0] + 0.5, pos[1] + 1.5, pos[2] + 0.5],
        dir1: [-0.5, 0.1, -0.5],
        dir2: [0.5, 1.5, 0.5],
        texture: "glint",
        minLifeTime: 0.4,
        maxLifeTime: 0.9,
        minEmitPower: 1,
        maxEmitPower: 3,
        minSize: 0.2,
        maxSize: 0.5,
        manualEmitCount: 12,
        gravity: [0, -6, 0],
        colorGradients: [
            { timeFraction: 0, minColor: [200, 200, 255, 1], maxColor: [255, 255, 255, 1] },
        ],
    }, playerId);
}

// -----------------------------------------------------------------------------
// Shield (Bulwark)
// -----------------------------------------------------------------------------

/** Shows the shield on the off arm and the HUD chip, topping up the numeric shield. */
function shieldVisualsOn(playerId) {
    const c = CONFIG.shield;
    if (api.getShieldAmount(playerId) < c.raiseShieldAmount) {
        api.setShieldAmount(playerId, c.raiseShieldAmount);
    }
    api.updateEntityNodeMeshAttachment(
        playerId, c.armNode, "Box",
        { width: 0.5, height: 0.7, depth: 0.12, diffuseColor: c.meshColour },
        [0, -0.2, 0.15]
    );
    api.setClientOption(playerId, "headerChips", [c.hudChip]);
}

/** Clears the off-arm mesh and the HUD chip. */
function shieldVisualsOff(playerId) {
    api.updateEntityNodeMeshAttachment(playerId, CONFIG.shield.armNode, null);
    api.setClientOption(playerId, "headerChips", []);
}

/** Raises the shield by hand: hold it and right click. */
function raiseShield(playerId) {
    stateOf(playerId).shieldRaised = true;
    shieldVisualsOn(playerId);
    tell(playerId, "Shield raised.", "#9fb4c7");
}

/** Lowers the hand-raised shield. Leaves a passive off-hand shield's visuals alone. */
function lowerShield(playerId) {
    const state = stateOf(playerId);
    state.shieldRaised = false;
    if (!state.offhandShieldOn) {
        shieldVisualsOff(playerId);
    }
}

function toggleShield(playerId) {
    if (stateOf(playerId).shieldRaised) {
        lowerShield(playerId);
        tell(playerId, "Shield lowered.", "#9fb4c7");
    } else {
        raiseShield(playerId);
    }
}

/**
 * Checked every tick, for every player: whatever sits in the off-hand slot
 * gets a status effect icon, and a Bulwark parked there also protects its
 * owner automatically, with no need to hold or click it - so a sword in your
 * main hand and a shield off-hand work at the same time. The shield visuals
 * only come down once neither this nor the hand-raised shield is active.
 *
 * Syncing from the slot itself (rather than only on swap) means dragging an
 * item in or out in the inventory screen works just as well as /offhand does.
 */
function syncOffhand(playerId) {
    const state = stateOf(playerId);
    const slot = offhandSlot(playerId);
    const item = slot ? slot.item : null;

    if (CONFIG.offhand.effectIcon) {
        const carried = item ? item.name : null;
        if (state.offhandIcon !== carried) {
            if (state.offhandIcon) {
                api.removeEffect(playerId, state.offhandIcon);
            }
            if (carried) {
                // A custom effect whose icon is the item itself - the closest
                // the HUD gets to showing something in a second hand.
                api.applyEffect(playerId, carried, null, {
                    icon: carried,
                    displayName: "Off-hand: " + displayName(item),
                });
            }
            state.offhandIcon = carried;
        }
    }

    if (!CONFIG.shield.enabled) {
        return;
    }
    const valid = !!(item && customAttrs(item)[ATTR_SHIELD]);

    if (valid && !state.offhandShieldOn) {
        state.offhandShieldOn = true;
        shieldVisualsOn(playerId);
    } else if (!valid && state.offhandShieldOn) {
        state.offhandShieldOn = false;
        if (!state.shieldRaised) {
            shieldVisualsOff(playerId);
        }
    }
}

/** Absorbs part of a hit into the numeric shield and wears the item that blocked it. */
function applyShieldAbsorption(defenderId, slot, damage) {
    const c = CONFIG.shield;
    const shieldLeft = api.getShieldAmount(defenderId);
    if (shieldLeft <= 0) {
        if (stateOf(defenderId).shieldRaised) {
            lowerShield(defenderId);   // the hand-raised guard breaks when empty
        }
        return damage;
    }

    const reduced = Math.max(0, Math.round(damage * (1 - c.blockFraction)));
    const absorbed = damage - reduced;
    api.setShieldAmount(defenderId, Math.max(0, shieldLeft - absorbed));
    spendDurability(defenderId, slot, c.blockDurabilityCost);
    return reduced;
}

/**
 * Applies blocking to an incoming hit: the passive off-hand shield takes
 * priority, then the manual hand-raised one. Returns the damage that should
 * actually land.
 */
function shieldBlock(defenderId, damage) {
    const c = CONFIG.shield;
    if (!c.enabled) {
        return damage;
    }
    const state = stateOf(defenderId);

    if (state.offhandShieldOn) {
        const off = offhandSlot(defenderId);
        if (off && customAttrs(off.item)[ATTR_SHIELD]) {
            return applyShieldAbsorption(defenderId, off, damage);
        }
    }

    if (state.shieldRaised) {
        const held = heldSlot(defenderId);
        if (!held || !customAttrs(held.item)[ATTR_SHIELD]) {
            lowerShield(defenderId);   // switched away without lowering it properly
            return damage;
        }
        return applyShieldAbsorption(defenderId, held, damage);
    }

    return damage;
}

// -----------------------------------------------------------------------------
// Shared weapon hit handling
// -----------------------------------------------------------------------------

/** Extra damage, and a launch, for catching someone while they are in a boat. */
function cartBonus(targetId) {
    const c = CONFIG.cart;
    if (!c.enabled || !isPlayer(targetId) || !stateOf(targetId).inVehicle) {
        return 0;
    }
    if (c.ejectOnHit) {
        api.applyImpulse(targetId, 0, c.ejectUp, 0);
        api.applyImpulse(targetId, c.ejectImpulse * 0.5, 0, c.ejectImpulse * 0.5);
    }
    return c.bonusDamage;
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

    spendDurability(attacker, slot, CONFIG.durability.costPerHit);
    return cart > 0 ? Math.round(damageDealt + cart) : undefined;
}

/** Weapon damage, then a raised shield on the target's side gets the final say. */
function handleWeaponHit(attacker, targetId, damageDealt) {
    const computed = computeWeaponDamage(attacker, targetId, damageDealt);
    if (!CONFIG.shield.enabled || !isPlayer(targetId)) {
        return computed;
    }
    const base = computed === undefined ? damageDealt : computed;
    const blocked = shieldBlock(targetId, base);
    // Only truly a no-op (undefined) when neither the weapon nor the shield
    // changed anything - a mace/spear hit still reports its number even when
    // that number happens to equal the input, matching their existing contract.
    if (computed === undefined && blocked === base) {
        return undefined;
    }
    return blocked;
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
    // Start filling the world in around them straight away rather than waiting
    // for the next tick's movement check.
    stateOf(playerId).lastGenChunk = null;
    queueChunksAround(toKey, [x, pos[1], z]);

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
// Crystal PvP
// -----------------------------------------------------------------------------

/** Everything the blast can reach: players always, mobs when enabled. */
function blastTargets() {
    const ids = api.getPlayerIds();
    return CONFIG.crystal.hitsMobs ? ids.concat(api.getMobIds()) : ids;
}

/**
 * Detonates at a block position. Damage and knockback both fall off linearly,
 * so standing at the edge of the blast is survivable and point blank is not.
 */
function explodeCrystal(placerId, x, y, z) {
    const c = CONFIG.crystal;
    const centre = [x + 0.5, y + 0.5, z + 0.5];
    const targets = blastTargets();

    for (let i = 0; i < targets.length; i++) {
        const victim = targets[i];
        const pos = api.getPosition(victim);
        if (!pos) {
            continue;
        }
        const dx = pos[0] - centre[0];
        const dy = pos[1] - centre[1];
        const dz = pos[2] - centre[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance > c.radius) {
            continue;
        }

        const falloff = 1 - distance / c.radius;
        let damage = c.damage * falloff;
        if (victim === placerId) {
            damage *= c.selfDamageFraction;
        }

        api.attemptApplyDamage({
            eId: placerId,
            hitEId: victim,
            attemptedDmgAmt: Math.max(1, Math.round(damage)),
            withItem: c.block,
        });

        // Push them out of the crater. A direct overlap still goes somewhere.
        const length = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
        api.applyImpulse(
            victim,
            (dx / length) * c.knockback * falloff,
            c.knockbackUp * falloff,
            (dz / length) * c.knockback * falloff
        );
        if (isPlayer(victim)) {
            api.shakePlayerCamera(victim, Math.min(1, falloff), 500);
        }
    }

    if (c.breakBlocks) {
        const r = Math.max(1, Math.round(c.radius / 2));
        api.setBlockRect([x - r, y - r, z - r], [x + r, y + r, z + r], "Air");
    }

    api.broadcastSound("ominousBellHit", 1.0, 0.7, { playerIdOrPos: centre, maxHearDist: 60 });
    api.playParticleEffect({
        presetId: "stomp",
        pos1: [centre[0] - c.radius / 2, centre[1], centre[2] - c.radius / 2],
        pos2: [centre[0] + c.radius / 2, centre[1] + 2, centre[2] + c.radius / 2],
    });
}

// -----------------------------------------------------------------------------
// NPCs
// -----------------------------------------------------------------------------

// One roster entry per NPC. The body is destroyed and rebuilt; the person is not.
const npcRoster = [];
const npcByEntity = {};
let npcTicks = 0;

function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function npcSay(npc, kind) {
    const lines = CONFIG.npcs.personalities[npc.personality][kind];
    if (!lines || !lines.length) {
        return;
    }
    api.broadcastMessage(npc.name + ": " + randomOf(lines), { color: CONFIG.npcs.chatColour });
    npc.lastChat = api.now();
}

function buildNpcRoster() {
    const n = CONFIG.npcs;
    const personalities = Object.keys(n.personalities);
    const names = n.names.slice();
    const skins = n.skins.slice();

    for (let i = 0; i < n.count; i++) {
        // Names and skins are drawn without replacement, so no two NPCs are twins.
        const name = names.length
            ? names.splice(Math.floor(Math.random() * names.length), 1)[0]
            : "Villager " + (i + 1);
        const skin = skins.length
            ? skins.splice(Math.floor(Math.random() * skins.length), 1)[0]
            : "farmer";
        const angle = (i / n.count) * Math.PI * 2;

        const trades = Object.keys(n.work.trades);
        npcRoster.push({
            name: name,
            skin: skin,
            trade: trades[i % trades.length],
            personality: personalities[i % personalities.length],
            // Spread their homes around the centre so they are not all in a pile.
            home: [
                n.home[0] + Math.cos(angle) * n.wanderRadius * 0.6,
                n.home[1] + Math.sin(angle) * n.wanderRadius * 0.6,
            ],
            entityId: null,
            hp: n.maxHealth,
            pos: null,
            target: null,
            running: false,
            deadUntil: 0,
            lastChat: 0,
            lastAttack: 0,
            nextChatter: api.now() + n.chatterMinMs,
            provokedBy: null,
            provokedAt: 0,
            greeted: {},
            stash: 0,
            workBlock: null,      // the block they are walking over to break
            plan: null,           // their hut, as a list of positions
            planIndex: 0,
            restUntil: 0,
        });
    }
}

/** Finds the surface to stand on near a column, so nobody floats or sinks. */
function groundYNear(x, y, z) {
    const n = CONFIG.npcs;
    const fx = Math.floor(x);
    const fz = Math.floor(z);
    const from = Math.floor(y) + n.stepUp;

    for (let probe = from; probe > from - 12; probe--) {
        if (!api.isBlockInLoadedChunk(fx, probe, fz)) {
            continue;
        }
        const here = api.getBlock(fx, probe, fz);
        const above = api.getBlock(fx, probe + 1, fz);
        if (here && here !== "Air" && (!above || above === "Air")) {
            return probe + 1;
        }
    }
    return null;   // nothing to stand on; keep the height we had
}

function spawnNpc(npc) {
    const n = CONFIG.npcs;
    const entityId = api.attemptCreateMeshEntity(
        "Person",
        { size: 1, pose: "standing", textures: { head: npc.skin } },
        npc.name
    );
    if (entityId == null) {
        // The mesh-entity budget is full. Try again shortly rather than give up.
        npc.deadUntil = api.now() + 10000;
        return;
    }

    npc.entityId = entityId;
    npc.hp = n.maxHealth;
    npc.provokedBy = null;
    npc.target = null;
    npcByEntity[entityId] = npc;

    const y = groundYNear(npc.home[0], 80, npc.home[1]);
    npc.pos = [npc.home[0], y == null ? 70 : y, npc.home[1]];
    api.setPosition(entityId, npc.pos[0], npc.pos[1], npc.pos[2]);
}

function despawnNpc(npc) {
    if (npc.entityId != null) {
        api.deleteMeshEntity(npc.entityId);
        delete npcByEntity[npc.entityId];
    }
    npc.entityId = null;
    npc.pos = null;
    npc.target = null;
    npc.provokedBy = null;
}

function nearestPlayerTo(pos, radius) {
    const ids = api.getPlayerIds();
    let best = null;
    let bestDist = radius;
    for (let i = 0; i < ids.length; i++) {
        const other = api.getPosition(ids[i]);
        if (!other) {
            continue;
        }
        const dx = other[0] - pos[0];
        const dy = other[1] - pos[1];
        const dz = other[2] - pos[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < bestDist) {
            bestDist = distance;
            best = ids[i];
        }
    }
    return best;
}

function distanceTo(npc, entityId) {
    const other = api.getPosition(entityId);
    if (!other || !npc.pos) {
        return Infinity;
    }
    const dx = other[0] - npc.pos[0];
    const dy = other[1] - npc.pos[1];
    const dz = other[2] - npc.pos[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Walks one step toward the current target and turns to face the way it is going. */
function stepNpc(npc) {
    const n = CONFIG.npcs;
    if (npc.entityId == null || !npc.target || !npc.pos) {
        return;
    }
    const dx = npc.target[0] - npc.pos[0];
    const dz = npc.target[1] - npc.pos[2];
    const flat = Math.sqrt(dx * dx + dz * dz);
    if (flat < n.arriveRadius) {
        npc.target = null;
        return;
    }

    const speed = n.walkSpeed * (npc.running ? n.runSpeedMultiplier : 1);
    const x = npc.pos[0] + (dx / flat) * speed;
    const z = npc.pos[2] + (dz / flat) * speed;
    const ground = groundYNear(x, npc.pos[1], z);
    const y = ground == null ? npc.pos[1] : ground;

    npc.pos = [x, y, z];
    api.setPosition(npc.entityId, x, y, z);
    api.setEntityHeading(npc.entityId, Math.atan2(dx, dz));
}

function npcAttack(npc, targetId) {
    const n = CONFIG.npcs;
    const now = api.now();
    if (now - npc.lastAttack < n.attackCooldownMs) {
        return;
    }
    if (distanceTo(npc, targetId) > n.attackRange) {
        return;
    }
    npc.lastAttack = now;
    const damage = CONFIG.shield.enabled && isPlayer(targetId)
        ? shieldBlock(targetId, n.attackDamage)
        : n.attackDamage;
    // Self-inflicted is the documented way for game code to apply damage.
    api.attemptApplyDamage({
        eId: targetId,
        hitEId: targetId,
        attemptedDmgAmt: damage,
        withItem: npc.name,
    });
    api.broadcastSound("hit1", 0.7, 1.0, { playerIdOrPos: npc.pos, maxHearDist: 20 });
}

function tradeOf(npc) {
    return CONFIG.npcs.work.trades[npc.trade];
}

function withinWorkArea(npc, x, z) {
    const r = CONFIG.npcs.work.radius;
    return Math.abs(x - npc.home[0]) <= r && Math.abs(z - npc.home[1]) <= r;
}

/**
 * Hunts for something of their trade to break, by probing random columns near
 * home. Bounded on purpose: a handful of probes a second, never a full scan.
 */
function findWorkBlock(npc) {
    const w = CONFIG.npcs.work;
    const wanted = tradeOf(npc).gathers;

    for (let i = 0; i < w.searchSamples; i++) {
        const x = Math.floor(npc.home[0] + (Math.random() * 2 - 1) * w.radius);
        const z = Math.floor(npc.home[1] + (Math.random() * 2 - 1) * w.radius);
        // Start above head height so a probe landing on a tree sees its trunk.
        const from = Math.floor(npc.pos ? npc.pos[1] : 64) + 5;

        for (let y = from; y > from - w.searchDepth; y--) {
            if (!api.isBlockInLoadedChunk(x, y, z)) {
                continue;
            }
            if (wanted.indexOf(api.getBlock(x, y, z)) !== -1) {
                return [x, y, z];
            }
        }
    }
    return null;
}

/** Lays out a small hut around the NPC's plot: floor, walls with a doorway, roof. */
function buildPlanFor(npc) {
    const hut = CONFIG.npcs.work.hut;
    const cx = Math.floor(npc.home[0]);
    const cz = Math.floor(npc.home[1]);
    const groundY = groundYNear(cx, npc.pos ? npc.pos[1] : 70, cz);
    if (groundY == null) {
        return null;
    }
    const base = groundY - 1;
    const plan = [];

    for (let dx = -hut.half; dx <= hut.half; dx++) {
        for (let dz = -hut.half; dz <= hut.half; dz++) {
            plan.push([cx + dx, base, cz + dz]);                    // floor
            plan.push([cx + dx, base + hut.height + 1, cz + dz]);   // roof
        }
    }
    for (let level = 1; level <= hut.height; level++) {
        for (let d = -hut.half; d <= hut.half; d++) {
            const edge = hut.half;
            // A doorway: leave the middle of one wall open at head height and below.
            const isDoor = d === 0 && level <= 2;
            if (!isDoor) {
                plan.push([cx + d, base + level, cz - edge]);
            }
            plan.push([cx + d, base + level, cz + edge]);
            plan.push([cx - edge, base + level, cz + d]);
            plan.push([cx + edge, base + level, cz + d]);
        }
    }
    return plan;
}

function nextBuildSpot(npc) {
    if (!npc.plan) {
        npc.plan = buildPlanFor(npc);
        npc.planIndex = 0;
    }
    if (!npc.plan) {
        return null;
    }
    const material = tradeOf(npc).buildsWith;

    // Skip anything already standing, so a rebuilt NPC does not redo finished work.
    while (npc.planIndex < npc.plan.length) {
        const spot = npc.plan[npc.planIndex];
        if (!api.isBlockInLoadedChunk(spot[0], spot[1], spot[2])
            || api.getBlock(spot[0], spot[1], spot[2]) !== material) {
            return spot;
        }
        npc.planIndex++;
    }
    return null;
}

function nearEnough(npc, spot) {
    if (!npc.pos) {
        return false;
    }
    const dx = spot[0] + 0.5 - npc.pos[0];
    const dy = spot[1] - npc.pos[1];
    const dz = spot[2] + 0.5 - npc.pos[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= CONFIG.npcs.work.reach;
}

/** The actual swing: one block broken or placed, only ever inside their own patch. */
function workNpc(npc) {
    const w = CONFIG.npcs.work;
    if (!w.enabled || npc.entityId == null || !npc.pos || npc.provokedBy) {
        return;
    }

    if (npc.job === "build" && npc.buildSpot && nearEnough(npc, npc.buildSpot)) {
        const spot = npc.buildSpot;
        const result = api.attemptWorldChangeBlock(null, spot[0], spot[1], spot[2],
            tradeOf(npc).buildsWith, {});
        npc.buildSpot = null;
        if (result === "preventChange") {
            npc.planIndex++;   // something is protecting that spot; move on
            return;
        }
        npc.stash--;
        npc.planIndex++;
        if (nextBuildSpot(npc) == null) {
            npcSay(npc, "built");
            npc.restUntil = api.now() + w.restAfterHutMs;
        }
        return;
    }

    if (npc.job === "gather" && npc.workBlock && nearEnough(npc, npc.workBlock)) {
        const spot = npc.workBlock;
        npc.workBlock = null;
        if (!withinWorkArea(npc, spot[0], spot[2])) {
            return;   // never reach outside their own patch
        }
        if (tradeOf(npc).gathers.indexOf(api.getBlock(spot[0], spot[1], spot[2])) === -1) {
            return;   // someone beat them to it
        }
        const result = api.attemptWorldChangeBlock(null, spot[0], spot[1], spot[2], "Air", {});
        if (result !== "preventChange") {
            npc.stash++;
        }
    }
}

/** One NPC's turn to think, ordered by urgency: survival, a fight, people, then life. */
function thinkNpc(npc) {
    const n = CONFIG.npcs;
    const now = api.now();

    if (npc.entityId == null) {
        if (now >= npc.deadUntil) {
            spawnNpc(npc);
        }
        return;
    }
    if (!npc.pos) {
        return;
    }

    // Losing badly: turn and run, and say so.
    if (npc.hp < n.maxHealth * n.fleeAtHpFraction && npc.provokedBy) {
        const away = api.getPosition(npc.provokedBy);
        if (away) {
            npc.running = true;
            npc.target = [
                npc.pos[0] + (npc.pos[0] - away[0]) * 3,
                npc.pos[2] + (npc.pos[2] - away[2]) * 3,
            ];
        }
        if (now - npc.lastChat > 6000) {
            npcSay(npc, "flee");
        }
        return;
    }

    // Someone hit them recently: go after them until they forget about it.
    if (npc.provokedBy && now - npc.provokedAt < n.forgetProvokerMs) {
        const chase = api.getPosition(npc.provokedBy);
        if (chase) {
            npc.running = true;
            npc.target = [chase[0], chase[2]];
            npcAttack(npc, npc.provokedBy);
        }
        return;
    }
    if (npc.provokedBy) {
        npc.provokedBy = null;
        npc.running = false;
    }

    // Someone walked up: stop, face them, and say hello - but not every time.
    const nearby = nearestPlayerTo(npc.pos, n.noticeRadius);
    if (nearby) {
        const at = api.getPosition(nearby);
        if (at && npc.entityId != null) {
            api.setEntityHeading(npc.entityId, Math.atan2(at[0] - npc.pos[0], at[2] - npc.pos[2]));
        }
        npc.target = null;
        if (now - (npc.greeted[nearby] || 0) > n.greetCooldownMs) {
            npc.greeted[nearby] = now;
            npcSay(npc, "greet");
        }
        return;
    }

    // Nobody around: get to work. Build if there is material and hut left to
    // raise, otherwise go and gather more of the trade's material.
    if (n.work.enabled && now >= npc.restUntil) {
        const spot = npc.stash > 0 ? nextBuildSpot(npc) : null;
        if (spot) {
            npc.job = "build";
            npc.buildSpot = spot;
            npc.running = false;
            npc.target = [spot[0] + 0.5, spot[2] + 0.5];
            if (now >= npc.nextChatter) {
                npcSay(npc, "working");
                npc.nextChatter = now + n.chatterMinMs
                    + Math.random() * (n.chatterMaxMs - n.chatterMinMs);
            }
            return;
        }

        npc.job = "gather";
        if (!npc.workBlock) {
            npc.workBlock = findWorkBlock(npc);
        }
        if (npc.workBlock) {
            npc.running = false;
            npc.target = [npc.workBlock[0] + 0.5, npc.workBlock[2] + 0.5];
            if (now >= npc.nextChatter) {
                npcSay(npc, "working");
                npc.nextChatter = now + n.chatterMinMs
                    + Math.random() * (n.chatterMaxMs - n.chatterMinMs);
            }
            return;
        }
    }

    // Nothing to do: wander the patch, mutter now and then.
    npc.job = "idle";
    if (now >= npc.nextChatter) {
        npcSay(npc, "idle");
        npc.nextChatter = now + n.chatterMinMs
            + Math.random() * (n.chatterMaxMs - n.chatterMinMs);
    }
    if (!npc.target) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * n.wanderRadius;
        npc.running = false;
        npc.target = [
            npc.home[0] + Math.cos(angle) * distance,
            npc.home[1] + Math.sin(angle) * distance,
        ];
    }
}

function tickNpcs() {
    const n = CONFIG.npcs;
    if (!n.enabled) {
        return;
    }
    npcTicks++;
    if (npcRoster.length === 0) {
        buildNpcRoster();
    }

    if (npcTicks % n.thinkEveryTicks === 0) {
        for (let i = 0; i < npcRoster.length; i++) {
            thinkNpc(npcRoster[i]);
        }
    }
    if (npcTicks % n.moveEveryTicks === 0) {
        for (let i = 0; i < npcRoster.length; i++) {
            stepNpc(npcRoster[i]);
        }
    }
    if (n.work.enabled && npcTicks % n.work.workEveryTicks === 0) {
        for (let i = 0; i < npcRoster.length; i++) {
            workNpc(npcRoster[i]);
        }
    }
}

function npcHurt(entityId, byPlayer, damage) {
    const npc = npcByEntity[entityId];
    if (!npc) {
        return;
    }
    npc.hp -= damage;
    npc.provokedBy = byPlayer;
    npc.provokedAt = api.now();

    if (npc.hp <= 0) {
        npcKilled(entityId, byPlayer);
        return;
    }
    if (api.now() - npc.lastChat > 4000) {
        npcSay(npc, "hurt");
    }
}

function npcKilled(entityId, byPlayer) {
    const npc = npcByEntity[entityId];
    if (!npc) {
        return;
    }
    const where = npc.pos;
    despawnNpc(npc);
    npc.deadUntil = api.now() + CONFIG.npcs.respawnDelayMs;

    api.broadcastMessage(CONFIG.killFeed.icon + " " + npc.name + " was killed by "
        + displayNameOf(byPlayer), { color: CONFIG.npcs.chatColour });

    if (CONFIG.npcs.dropsLifeOrb && where) {
        api.createItemDrop(where[0], where[1] + 1, where[2], CONFIG.orb.item, 1,
            false, orbAttributes(CONFIG.orb.hp), CONFIG.orb.despawnMs, byPlayer,
            { doPhysics: true });
    }
}

// -----------------------------------------------------------------------------
// Exile to the Void, and the way back
// -----------------------------------------------------------------------------

function inVoid(playerId) {
    return dimensionAt(api.getPosition(playerId)) === "void";
}

/** Running out of hearts strands you in the Void instead of ending your run. */
function exileToVoid(playerId) {
    const b = CONFIG.ban;
    applyMaxHp(playerId, b.voidHearts, b.voidHearts);
    travelTo(playerId, "void");
    tell(playerId, b.voidReason, "#b39ddb");
    api.sendFlyingMiddleMessage(playerId, "Exiled to the Void", 0, 3000);
    // The elimination is already covered by announceDeath - no second message here.
}

/**
 * Checked while a player is stranded. Once they are holding enough orbs the
 * orbs are spent and they are put back in the overworld with a few hearts.
 */
function checkResurrection(playerId) {
    const r = CONFIG.resurrection;
    const held = countItem(playerId, r.item);
    if (held < r.required) {
        return false;
    }
    if (!consumeItems(playerId, r.item, r.required)) {
        return false;
    }

    travelTo(playerId, "overworld");
    applyMaxHp(playerId, clampHp(r.heartsOnReturn), r.heartsOnReturn);

    tell(playerId, "The orbs burn away and the Void spits you out. You return with "
        + hearts(getMaxHp(playerId)) + " hearts.", "#7bed9f");
    api.sendFlyingMiddleMessage(playerId, "Resurrected", 0, 3000);
    api.playSound(playerId, "levelup", 1.0, 0.9);
    if (CONFIG.ban.announce) {
        api.broadcastMessage(displayNameOf(playerId) + " clawed their way out of the Void.",
            { color: "#7bed9f" });
    }
    return true;
}

// -----------------------------------------------------------------------------
// Anonymous mode
// -----------------------------------------------------------------------------

function isAnon(playerId) {
    return api.getPlayerDbValue(playerId, DB_ANON) === 1;
}

/** Blanks or restores the floating nametag everyone else sees above them. */
function applyAnonNameTag(playerId, anon) {
    if (!CONFIG.anonymous.hideNameTag) {
        return;
    }
    api.setTargetedPlayerSettingForEveryone(
        playerId,
        "nameTagInfo",
        anon ? { content: [{ str: CONFIG.anonymous.displayName }] } : null,
        true   // new joiners see it too, or anonymity leaks on every join
    );
}

/** The name everyone else should see for this player, anonymity included. */
function displayNameOf(playerId) {
    if (CONFIG.anonymous.enabled && isAnon(playerId)) {
        return CONFIG.anonymous.displayName;
    }
    return api.getEntityName(playerId);
}

function eliminationClause() {
    return CONFIG.ban.mode === "void" ? " \u2014 exiled to the Void." : " \u2014 eliminated.";
}

/**
 * The one and only place a death is announced, called exactly once per death
 * regardless of whether it costs hearts. Everything that used to announce a
 * kill, a ban or an exile separately now feeds through here instead, which is
 * what stops the same death producing two messages.
 */
function announceDeath(victim, killer, eliminated) {
    const kf = CONFIG.killFeed;
    if (!kf.enabled) {
        return;
    }

    let text;
    let colour;
    if (killer) {
        const weapon = stateOf(killer).lastWeapon;
        text = kf.icon + " " + displayNameOf(killer) + " slew " + displayNameOf(victim)
            + (weapon ? " with " + weapon : "")
            + (eliminated ? eliminationClause() : ".");
        colour = kf.playerColour;
    } else {
        text = kf.icon + " " + displayNameOf(victim)
            + (eliminated ? " ran out of hearts" + eliminationClause() : " died.");
        colour = kf.worldColour;
    }
    api.broadcastMessage(text, { color: colour });

    if (CONFIG.deathSound.enabled) {
        const pos = api.getPosition(victim) || [0, 64, 0];
        api.broadcastSound(CONFIG.deathSound.sound, CONFIG.deathSound.volume, CONFIG.deathSound.rate,
            { playerIdOrPos: pos, maxHearDist: CONFIG.deathSound.maxHearDist });
    }
}

function setAnon(playerId, anon) {
    api.setPlayerDbValue(playerId, DB_ANON, anon ? 1 : 0);
    applyAnonNameTag(playerId, anon);
    tell(playerId, anon
        ? "You are now " + CONFIG.anonymous.displayName + ". Type "
            + CONFIG.anonymous.chatCommand + " again to reveal yourself."
        : "You are no longer anonymous.", CONFIG.anonymous.colour);
}

// -----------------------------------------------------------------------------
// Terrain generation
// -----------------------------------------------------------------------------

// Deterministic value noise. Nothing here may use Math.random: the same column
// must always produce the same blocks, or chunk edges would not line up and a
// regenerated chunk would come back different.

function hash2(x, z, seed) {
    let h = (Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263) ^ Math.imul(seed | 0, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
}

/** Smoothed value noise in 0..1, sampled on a grid `scale` blocks wide. */
function noise2(x, z, scale, seed) {
    const gx = x / scale;
    const gz = z / scale;
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const fx = gx - x0;
    const fz = gz - z0;
    const sx = fx * fx * (3 - 2 * fx);   // smoothstep, so islands have soft edges
    const sz = fz * fz * (3 - 2 * fz);

    const n00 = hash2(x0, z0, seed);
    const n10 = hash2(x0 + 1, z0, seed);
    const n01 = hash2(x0, z0 + 1, seed);
    const n11 = hash2(x0 + 1, z0 + 1, seed);

    return (n00 * (1 - sx) + n10 * sx) * (1 - sz) + (n01 * (1 - sx) + n11 * sx) * sz;
}

const genQueue = [];      // chunks waiting to be built, oldest first
const genQueued = {};     // key -> in the queue right now
const genDone = {};       // key -> known built this session

function chunkKey(dimKey, cx, cz) {
    return dimKey + ":" + cx + "," + cz;
}

/**
 * A chunk is "already built" if we built it this session, or if its marker
 * block is still there from a previous one. Never rebuild: that would wipe
 * whatever players have made.
 */
function chunkGenerated(dimKey, cx, cz) {
    const g = CONFIG.dimensions.generation;
    const key = chunkKey(dimKey, cx, cz);
    if (genDone[key]) {
        return true;
    }
    const wx = cx * g.chunkSize;
    const wz = cz * g.chunkSize;
    if (api.isBlockInLoadedChunk(wx, g.markerY, wz)
        && api.getBlock(wx, g.markerY, wz) === g.markerBlock) {
        genDone[key] = true;
        return true;
    }
    return false;
}

function queueChunksAround(dimKey, pos) {
    const g = CONFIG.dimensions.generation;
    if (!g.enabled || !g[dimKey]) {
        return;   // the overworld is left alone
    }
    const cx0 = Math.floor(pos[0] / g.chunkSize);
    const cz0 = Math.floor(pos[2] / g.chunkSize);

    for (let dx = -g.radius; dx <= g.radius; dx++) {
        for (let dz = -g.radius; dz <= g.radius; dz++) {
            const cx = cx0 + dx;
            const cz = cz0 + dz;
            const key = chunkKey(dimKey, cx, cz);
            if (genQueued[key] || chunkGenerated(dimKey, cx, cz)) {
                continue;
            }
            genQueued[key] = true;
            genQueue.push({ dimKey: dimKey, cx: cx, cz: cz, column: 0 });
        }
    }
}

function fill(x, y1, y2, z, blockName) {
    if (y2 < y1) {
        return;
    }
    api.setBlockRect([x, y1, z], [x, y2, z], blockName);
}

/** A closed cavern: bedrock floor, rolling ground, a lava sea and a ceiling. */
function buildNetherColumn(x, z, localX, localZ) {
    const c = CONFIG.dimensions.generation.nether;
    const b = c.blocks;

    const ground = Math.round(c.groundBase
        + (noise2(localX, localZ, c.groundScale, c.seed) - 0.5) * 2 * c.groundAmp);
    const ceiling = Math.round(c.ceilingBase
        - (noise2(localX, localZ, c.ceilingScale, c.seed + 7) - 0.5) * 2 * c.ceilingAmp);

    fill(x, c.floorY, c.floorY, z, b.floor);
    fill(x, c.floorY + 1, ground - 1, z, b.base);

    const surface = hash2(localX, localZ, c.seed + 31) < c.accentChance ? b.accent : b.top;
    fill(x, ground, ground, z, surface);

    // Lava pools wherever the ground dips below the sea level.
    fill(x, ground + 1, c.lavaLevel, z, b.liquid);

    fill(x, ceiling, c.ceilingY, z, b.ceiling);
}

/** Floating islands over open void, thinning out towards their edges. */
function buildEndColumn(x, z, localX, localZ) {
    const c = CONFIG.dimensions.generation.end;
    const b = c.blocks;

    const island = noise2(localX, localZ, c.islandScale, c.seed);

    // The guaranteed centre island, fading out into the noise at its rim.
    const fromCentre = Math.sqrt(localX * localX + localZ * localZ);
    const centreStrength = fromCentre >= c.centreIslandRadius
        ? 0
        : 1 - fromCentre / c.centreIslandRadius;

    let strength = (island - c.islandThreshold) / (1 - c.islandThreshold);
    if (centreStrength > strength) {
        strength = centreStrength;
    }
    if (strength <= 0) {
        return;   // void, and it stays void
    }
    const half = Math.max(1, Math.round(strength * c.thickness));
    const centre = Math.round(c.baseY
        + (noise2(localX, localZ, c.driftScale, c.seed + 13) - 0.5) * 2 * c.drift);

    const top = centre + half - 1;
    fill(x, centre - half, top - 1, z, b.base);
    fill(x, top, top, z, b.top);

    if (strength > 0.5 && hash2(localX, localZ, c.seed + 77) < c.pillarChance) {
        fill(x, top + 1, top + c.pillarHeight, z, b.pillar);
    }
}

/** Sparse black platforms in the dark, some carrying an Orb of Resurrection. */
function buildVoidColumn(x, z, localX, localZ) {
    const c = CONFIG.dimensions.generation["void"];
    const b = c.blocks;

    const island = noise2(localX, localZ, c.islandScale, c.seed);
    const fromCentre = Math.sqrt(localX * localX + localZ * localZ);
    const centreStrength = fromCentre >= c.centreIslandRadius
        ? 0
        : 1 - fromCentre / c.centreIslandRadius;

    let strength = (island - c.islandThreshold) / (1 - c.islandThreshold);
    if (centreStrength > strength) {
        strength = centreStrength;
    }
    if (strength <= 0) {
        return;
    }

    const half = Math.max(1, Math.round(strength * c.thickness));
    const centre = Math.round(c.baseY
        + (noise2(localX, localZ, c.driftScale, c.seed + 13) - 0.5) * 2 * c.drift);
    const top = centre + half - 1;

    fill(x, centre - half, top - 1, z, b.base);
    fill(x, top, top, z, b.top);

    // The orbs are the whole point of the place, so they sit on top in plain sight.
    if (hash2(localX, localZ, c.seed + 99) < c.orbChance) {
        fill(x, top + 1, top + 1, z, b.orb);
    }
}

/** Builds a slice of the queue each tick so a big reveal never stalls the server. */
function processGeneration() {
    const g = CONFIG.dimensions.generation;
    if (!g.enabled) {
        return;
    }
    let budget = g.columnsPerTick;
    const perChunk = g.chunkSize * g.chunkSize;

    while (budget > 0 && genQueue.length > 0) {
        const job = genQueue[0];
        const originX = dimension(job.dimKey).origin[0];
        const originZ = dimension(job.dimKey).origin[1];

        while (budget > 0 && job.column < perChunk) {
            const lx = job.column % g.chunkSize;
            const lz = (job.column / g.chunkSize) | 0;
            const x = job.cx * g.chunkSize + lx;
            const z = job.cz * g.chunkSize + lz;

            // Noise is sampled in dimension-local space so the huge region
            // offsets do not shift the terrain between dimensions.
            if (job.dimKey === "nether") {
                buildNetherColumn(x, z, x - originX, z - originZ);
            } else if (job.dimKey === "end") {
                buildEndColumn(x, z, x - originX, z - originZ);
            } else if (job.dimKey === "void") {
                buildVoidColumn(x, z, x - originX, z - originZ);
            }

            job.column++;
            budget--;
        }

        if (job.column >= perChunk) {
            api.setBlock(job.cx * g.chunkSize, g.markerY, job.cz * g.chunkSize, g.markerBlock);
            genDone[chunkKey(job.dimKey, job.cx, job.cz)] = true;
            delete genQueued[chunkKey(job.dimKey, job.cx, job.cz)];
            genQueue.shift();
        }
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

    if (CONFIG.anonymous.enabled && isAnon(playerId)) {
        applyAnonNameTag(playerId, true);
    }

    // The native killfeed panel is switched off for good, not just during
    // anonymity - announceDeath is the only kill/death message anyone sees.
    if (CONFIG.killFeed.enabled && CONFIG.killFeed.disableNativePanel) {
        api.setClientOption(playerId, "showKillfeed", false);
    }

    if (CONFIG.shield.enabled) {
        api.setClientOption(playerId, "maxShield", CONFIG.shield.maxShieldOption);
    }

    // Gives touchscreen players a real button for the off-hand swap, since
    // they have neither a right mouse button nor an easy chat box.
    if (CONFIG.offhand.enabled && CONFIG.offhand.touchButton) {
        api.setClientOption(playerId, "touchscreenActionButton", CONFIG.offhand.touchButton);
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

        // A shield left raised with nothing backing it (swapped away, died
        // and respawned) is lowered automatically - independent of whether
        // dimensions are enabled, so it always runs.
        if (CONFIG.shield.enabled && state.shieldRaised) {
            const slot = heldSlot(playerId);
            if (!slot || !customAttrs(slot.item)[ATTR_SHIELD]) {
                lowerShield(playerId);
            }
        }

        // The off-hand slot is re-read every tick, for every player, so
        // dragging something in or out in the inventory screen counts too.
        if (CONFIG.offhand.enabled) {
            syncOffhand(playerId);
        }

        // Catches respawns, admin teleports and simply walking over a border.
        if (CONFIG.dimensions.enabled) {
            const key = dimensionAt(pos);
            if (key !== state.dimension) {
                enterDimension(playerId, key, true);
            }

            // Stranded players are watched for their way out.
            if (key === "void" && CONFIG.ban.mode === "void") {
                checkResurrection(playerId);
            }

            // Only look for new chunks when the player actually moves chunk.
            const size = CONFIG.dimensions.generation.chunkSize;
            const here = Math.floor(pos[0] / size) + "," + Math.floor(pos[2] / size);
            if (here !== state.lastGenChunk) {
                state.lastGenChunk = here;
                queueChunksAround(key, pos);
            }
        }
    }

    if (CONFIG.dimensions.enabled) {
        processGeneration();
    }
    tickNpcs();
}

function onBlockStandStart(playerId, x, y, z, blockName) {
    if (CONFIG.dimensions.enabled) {
        usePortal(playerId, blockName);
    }
}

function onAttemptKillPlayer(killedPlayer, attackingLifeform) {
    const byPlayer = isPlayer(attackingLifeform) && attackingLifeform !== killedPlayer;
    const loss = byPlayer ? CONFIG.death.hpLostToPlayer : CONFIG.death.hpLostToWorld;

    // Dying in the Void must not strand you deeper: exile is a state, not a
    // loop, and nothing worth announcing happens to someone already stranded.
    if (CONFIG.dimensions.enabled && inVoid(killedPlayer)) {
        return;
    }

    const before = getMaxHp(killedPlayer);
    const willEliminate = CONFIG.ban.enabled && loss > 0 && before - loss <= 0;

    // Exactly one message and one sound for this death, whatever it costs -
    // including a free fall or lava death, which never reached this point before.
    announceDeath(killedPlayer, byPlayer ? attackingLifeform : null, willEliminate);

    if (loss <= 0) {
        return;
    }

    const shouldDrop = CONFIG.death.dropOrbs && (byPlayer || CONFIG.death.dropOrbsOnWorldDeath);

    if (willEliminate) {
        if (shouldDrop) {
            dropOrbs(killedPlayer, before);
        }
        if (CONFIG.ban.mode === "void" && CONFIG.dimensions.enabled) {
            exileToVoid(killedPlayer);
        } else {
            applyMaxHp(killedPlayer, 0, 0);
            banPlayer(killedPlayer, CONFIG.ban.reason);
        }
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
        // An empty hand pulls whatever is in the off-hand back out.
        if (CONFIG.offhand.enabled) {
            swapOffhand(playerId);
        }
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
    } else if (custom[ATTR_WINDCHARGE]) {
        useWindChargeItem(playerId, slot);
    } else if (custom[ATTR_SHIELD] && CONFIG.offhand.enabled && CONFIG.offhand.swapOnRightClick) {
        // A shield's right click puts it straight in your off-hand, the way
        // Minecraft's F key does - no chat, one click, and your main hand is
        // free for a sword. /shield still raises one by hand if you'd rather.
        swapOffhand(playerId);
    } else if (custom[ATTR_SHIELD]) {
        toggleShield(playerId);
    } else if (CONFIG.offhand.enabled) {
        // Anything with no other right-click use of its own goes off-hand too.
        swapOffhand(playerId);
    }
}

/**
 * The engine's own touchscreen button, so phone players get the off-hand
 * without a keyboard or the chat box. Fires on press and release; only the
 * press should do anything.
 */
function onTouchscreenActionButton(playerId, touchDown) {
    if (touchDown && CONFIG.offhand.enabled) {
        swapOffhand(playerId);
    }
}

function onPlayerDamagingOtherPlayer(attackingPlayer, damagedPlayer, damageDealt) {
    // Remembered so announceDeath can name the weapon if this hit turns out
    // to be the fatal one - onAttemptKillPlayer is not told what was used.
    const slot = heldSlot(attackingPlayer);
    stateOf(attackingPlayer).lastWeapon = slot ? displayName(slot.item) : null;
    return handleWeaponHit(attackingPlayer, damagedPlayer, damageDealt);
}

function onPlayerEnteredVehicle(playerId) {
    stateOf(playerId).inVehicle = true;
}

function onPlayerExitedVehicle(playerId) {
    stateOf(playerId).inVehicle = false;
}

function onPlayerDamagingMob(playerId, mobId, damageDealt) {
    return handleWeaponHit(playerId, mobId, damageDealt);
}

function onPlayerDamagingMeshEntity(playerId, damagedId, damageDealt) {
    npcHurt(damagedId, playerId, damageDealt);
}

function onPlayerBreakMeshEntity(playerId, entityId) {
    npcKilled(entityId, playerId);
}

function onPlayerChangeBlock(playerId, x, y, z, fromBlock, toBlock) {
    // Only breaking wears a tool down; placing a block does not.
    if (toBlock !== "Air" || fromBlock === "Air") {
        return;
    }

    // Breaking a crystal is what sets it off.
    if (CONFIG.crystal.enabled && fromBlock === CONFIG.crystal.block) {
        explodeCrystal(playerId, x, y, z);
    }
    const slot = heldSlot(playerId);
    if (slot) {
        spendDurability(playerId, slot, CONFIG.durability.costPerBlockBroken);
    }
}

function onPlayerChat(playerId, chatMessage) {
    if (!CONFIG.anonymous.enabled) {
        return;
    }
    const text = String(chatMessage).trim();

    if (text.toLowerCase() === CONFIG.anonymous.chatCommand) {
        setAnon(playerId, !isAnon(playerId));
        return false;   // the command itself is never shown to anyone
    }

    if (CONFIG.anonymous.hideInChat && isAnon(playerId)) {
        // Swallow the real message and re-send it with the name stripped off.
        api.broadcastMessage(CONFIG.anonymous.displayName + ": " + text,
            { color: CONFIG.anonymous.colour });
        return false;
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
                line += " " + CONFIG.orb.name + "s left to absorb: " + orbUsesLeft(playerId) + ".";
            }
            tell(playerId, line, "#ff6b81");
            return true;
        }

        case "withdraw":
            return withdraw(playerId, args[0]);

        case "repair":
            repairHeldItem(playerId);
            return true;

        case "offhand":
            // The chat fallback. Right click and the touchscreen button do the
            // same thing without typing.
            if (!CONFIG.offhand.enabled) {
                tell(playerId, "The off-hand is switched off in this world.", "#ff4757");
            } else if (!swapOffhand(playerId)) {
                tell(playerId, "Hold something to put in your off-hand first.", "#ffa502");
            }
            return true;

        case "shield": {
            // Raising a shield by hand, for anyone who wants to time their
            // blocks instead of letting the off-hand one soak automatically.
            const held = heldSlot(playerId);
            if (!held || !customAttrs(held.item)[ATTR_SHIELD]) {
                tell(playerId, "Hold a " + CONFIG.shield.name + " to raise it by hand.", "#ffa502");
                return true;
            }
            toggleShield(playerId);
            return true;
        }

        case "smphelp":
            tell(playerId,
                "/hp - your hearts | /withdraw <hearts> - turn hearts into "
                + CONFIG.orb.name + "s | right click a " + CONFIG.orb.name
                + " or Golden Apple to eat it | "
                + "craft the " + CONFIG.mace.name + " (" + CONFIG.mace.item + "), "
                + CONFIG.spear.name + " and " + CONFIG.windCharge.name + " | "
                + "craft a " + CONFIG.repair.name + " and hold a damaged item, then /repair | "
                + "craft a " + CONFIG.shield.name + " and RIGHT CLICK it to wear it in your "
                + "off-hand (slot " + (CONFIG.offhand.slotIndex + 1) + ", top-left) - then fight "
                + "with a sword and stay guarded at the same time. Right click any item to swap "
                + "it off-hand, right click with an empty hand to take it back, or use the "
                + "on-screen button on mobile. /offhand and /shield do the same from chat | "
                + "craft and place a Purple Portal for the Nether or a "
                + "Black Portal for the End, then stand on it | /where shows your dimension | "
                + "craft a Crystal, place it and hit it to blow up everything nearby | "
                + "type " + CONFIG.anonymous.chatCommand + " to go anonymous | "
                + "hit 0 hearts and you are exiled to the Void - mine 3 "
                + CONFIG.resurrection.name + "s there to get out (/orbs).",
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
            } else if (what === "orb" || what === "heart") {
                api.giveItem(playerId, CONFIG.orb.item, 1, orbAttributes(CONFIG.orb.hp));
            } else if (what === "windcharge") {
                api.giveItem(playerId, CONFIG.windCharge.item, 1, windChargeAttributes());
            } else if (what === "repairkit") {
                api.giveItem(playerId, CONFIG.repair.item, 1, repairKitAttributes());
            } else if (what === "shield") {
                api.giveItem(playerId, CONFIG.shield.item, 1, shieldAttributes(CONFIG.shield.durability));
            } else if (what === "netherportal") {
                api.giveItem(playerId, CONFIG.dimensions.list.nether.portalBlock, 8);
            } else if (what === "endportal") {
                api.giveItem(playerId, CONFIG.dimensions.list.end.portalBlock, 8);
            } else {
                tell(playerId,
                    "Usage: /give mace|spear|windcharge|repairkit|shield|gapple|egapple|heart"
                        + "|netherportal|endportal",
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

        case "anon":
            setAnon(playerId, !isAnon(playerId));
            return true;

        case "orbs": {
            const r = CONFIG.resurrection;
            const held = countItem(playerId, r.item);
            tell(playerId, inVoid(playerId)
                ? r.name + "s: " + held + " / " + r.required + " - mine the green blocks."
                : "You are not in the Void.", "#b39ddb");
            return true;
        }

        case "npcs": {
            const parts2 = [];
            for (let i = 0; i < npcRoster.length; i++) {
                const npc = npcRoster[i];
                parts2.push(npc.name + " the " + npc.trade
                    + (npc.entityId == null
                        ? " (respawning)"
                        : " (" + (npc.job || "idle") + ", " + npc.stash + " stashed, "
                            + Math.max(0, Math.round(npc.hp)) + " hp)"));
            }
            tell(playerId, parts2.length ? parts2.join(" | ") : "No NPCs yet.", "#c9d1d9");
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
    tell(playerId, "Withdrew " + hearts(removed) + " hearts as " + orbs + " " + CONFIG.orb.name + "(s)."
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
