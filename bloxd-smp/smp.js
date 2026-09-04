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
//  Bulwark shield   hold it, right click to raise your guard. Or put it in
//                   your off-hand and it blocks 60% while you swing a sword
//  Off-hand         your backpack's first slot carries a second item, outside
//                   the hotbar. Drag it in, /offhand, or the on-screen button
//  Golden Apples    two tiers. Heal, shield, regen and fire resistance
//  Durability       Bloxd has none, so this adds it to every tool and weapon,
//                   with a live HUD chip for whatever you're holding
//  Nether & End     portals, own fog/light/gravity, stacked far below by height
//  Crystal PvP      place a Crystal, hit it, everything nearby is launched
//  Cart PvP         catch someone in a boat and they take extra damage
//  !anon            hides your body, your nametag and your name in chat
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
        // Bigger than any distance in the world, dimension offsets included,
        // so it reaches every player no matter where they are.
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

        // A deliberate second way in, on top of kills and /withdraw - steep
        // enough that killing another player stays the cheap route to a heart.
        craftable: true,
        recipe: [
            { items: ["Block of Diamond"], amt: 4 },
            { items: ["Knight Heart"], amt: 2 },
            { items: ["Lunite"], amt: 4 },
        ],
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
            { items: ["Moonstone"], amt: 400 },
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
    // Bloxd has NO off-hand slot: every inventory cell is plain numbered
    // storage the engine treats identically. So the first backpack slot (the
    // one just past the hotbar) is reserved by convention instead - a rule
    // this script enforces, checked every tick. Whatever sits there is
    // "off-handed": it shows as a status effect icon, and if it happens to be
    // a Bulwark it protects you automatically, leaving your main hand free
    // for a sword. You put it there yourself: drag it into the slot, or use
    // /offhand or the touchscreen button.
    //
    // The item genuinely stays in the inventory rather than being held in a
    // variable, so a rejoin or a server restart can never lose it.
    offhand: {
        enabled: true,
        // The hotbar is indexes 0-9, so 10 is the FIRST BACKPACK SLOT - the
        // top-left cell of the inventory grid, outside the hotbar entirely.
        // The off-hand costs you no hotbar space this way.
        slotIndex: 10,
        effectIcon: true,    // show the carried item as a status effect icon
        particles: true,     // a glint puff on every swap
        swapSound: "swoosh",
        colour: "#9fe6a0",

        // Filling the off-hand is deliberate, never a side effect of a click:
        // drag an item into the slot, or use /offhand or the touchscreen
        // button. Right click is left alone so it keeps meaning "use this
        // item" - a held shield blocks with it rather than losing it to the
        // off-hand. Set swapOnRightClick true to go back to click-to-swap.
        swapOnRightClick: false,
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
    // Scope: blocks player-vs-player hits. It does not reduce real-mob damage
    // (never hooked to onMobDamagingPlayer) or crystal blasts (explosions
    // bypass it, same as most games).
    shield: {
        enabled: true,
        // A plain Brown Paintball, deliberately NOT the "Brown Paintball
        // Explosive Item": that one is a native throwable, so the engine's own
        // throw behaviour fired on click instead of this script's, which is
        // what stopped the shield working at all. This one has no built-in
        // click behaviour to fight with.
        item: "Brown Paintball",
        name: "Shield",
        durability: 500,

        raiseShieldAmount: 30,     // tops shield up to at least this when raised
        maxShieldOption: 60,       // raises the client's shield ceiling so it can show
        blockFraction: 0.6,        // fraction of incoming player damage blocked
        blockDurabilityCost: 2,    // per hit blocked

        armNode: "ArmLeftMesh",    // the "off-hand" arm - opposite the weapon hand

        // The shield is on your arm the whole time you have one, whether it is
        // guarding or not - it just sits lower and duller when it isn't, so
        // you can see at a glance which state you are in.
        meshColour: [176, 184, 196],          // bright, up in front, blocking
        meshColourLowered: [110, 118, 130],   // dull, tucked down, not blocking
        meshOffset: [0, -0.2, 0.15],
        meshOffsetLowered: [0, -0.5, -0.05],

        hudChipBlocking: "\uD83D\uDEE1 Blocking",
        hudChipLowered: "\uD83D\uDEE1 Shield lowered",

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

    // ---- Hang Gliders ---------------------------------------------------------
    // All four are real Bloxd items with their own native crafting recipes;
    // this overrides every one of them to the same steep cost, so which
    // material a glider is skinned in is a cosmetic choice, not a cheaper path.
    gliders: {
        enabled: true,
        items: ["Wood Hang Glider", "Iron Hang Glider", "Gold Hang Glider", "Diamond Hang Glider"],
        recipe: [
            { items: ["Moonstone"], amt: 100 },
            { items: ["Diamond"], amt: 30 },
        ],
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

        // A second, always-visible durability readout in the top-left HUD strip,
        // alongside the existing one in the item's own tooltip - so you can watch
        // it wear down without opening your inventory. Only ever the item you are
        // HOLDING: Bloxd's API does not expose the armour slots, so an equipped
        // helmet/chestplate/leggings/boots/gauntlets durability bar is not
        // something this script can read or draw - there is nothing to hook.
        hudBar: {
            enabled: true,
            segments: 8,
            icon: "🔧",   // wrench
        },
    },

    // ---- Dimensions ---------------------------------------------------------
    // Bloxd has ONE world, so these are far-apart regions of it dressed up with
    // their own fog, light and gravity. Check your world is big enough for the
    // offsets below and lower them if it is not.
    dimensions: {
        enabled: true,
        // Dimensions used to sit in far-apart X/Z locations - that version
        // was tested and confirmed working in-game. This instead stacks
        // them at different Y (height) values - Nether at y=-10000, End at
        // y=-30000, Void at y=-50000 - all sharing the same x/z, so a
        // portal is a vertical drop rather than a horizontal walk. Bloxd's
        // vertical build range reaches at least y=-100000, so all three
        // sit safely inside it.
        //
        // How far above/below its groundY still counts as "inside" a
        // dimension. The three below sit at least 20000 apart, so this only
        // has to clear the tallest thing generation ever builds (well under
        // 500 blocks) - it is not fighting neighbouring claims the way the
        // old X/Z half-size was.
        verticalHalfSize: 500,
        // Where a player lands back in the Overworld if this session never
        // recorded the height they left from (e.g. they joined already
        // inside a dimension).
        overworldFallbackY: 100,
        buildArrivalPlatform: true,
        platformRadius: 3,
        travelCooldownMs: 1500,    // stops portals ping-ponging you

        list: {
            overworld: {
                name: "Overworld",
                groundY: null,      // no Y-band of its own - it's whatever no other claims
                platformBlock: "Stone",
                clientOptions: {},  // empty = the normal look
            },
            nether: {
                name: "The Nether",
                groundY: -10000,
                arrivalY: 56,        // local height within the band you land at
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
                groundY: -50000,
                arrivalY: 65,
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
                groundY: -30000,
                arrivalY: 60,
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

                // Ores replace the rock below the surface, never the surface
                // itself, the bedrock floor or the ceiling. The first entry
                // whose roll succeeds wins, so put the common ones first.
                // Moonstone lives down near the lava - the mace costs 400 of
                // it, so this is the reason to come here at all.
                ores: [
                    { block: "Coal Ore", chance: 0.030 },
                    { block: "Iron Ore", chance: 0.020 },
                    { block: "Gold Ore", chance: 0.012 },
                    // Kept deliberately thin: the mace costs 400 Moonstone, and
                    // that is meant to be a long grind, not an afternoon.
                    { block: "Moonstone Ore", chance: 0.0015, maxY: 34 },
                    { block: "Lunite Ore", chance: 0.0008, maxY: 28 },
                ],

                blocks: {
                    floor: "Bedrock",
                    // Dark Red Stone top and bottom, so it reads as one solid
                    // netherrack mass rather than sandstone with a sandy lid.
                    base: "Dark Red Stone",
                    top: "Dark Red Stone",
                    accent: "Magma",
                    liquid: "Lava",
                    ceiling: "Dark Red Brick",
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

                // Richer per block than the Nether, because there is far less
                // rock here - most End columns are open void, so a low chance
                // would mean finding almost nothing.
                ores: [
                    { block: "Iron Ore", chance: 0.045 },
                    { block: "Emerald Ore", chance: 0.025 },
                    { block: "Moonstone Ore", chance: 0.020 },
                    { block: "Diamond Ore", chance: 0.016 },
                    { block: "Lunite Ore", chance: 0.008 },
                ],

                blocks: {
                    // Yellowstone is the closest thing Bloxd has to end stone -
                    // pale, moonlit, and uniform all the way through, so an
                    // island looks carved from one piece.
                    base: "Yellowstone",
                    top: "Yellowstone",
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
        // Anonymity that only blanks a nametag is thin - people recognise a
        // skin. This turns the body off too, using the engine's own "Invisible"
        // effect, so going anonymous actually hides you.
        invisible: true,
        // The native killfeed panel is handled globally by killFeed.* below, not
        // per-anon here - see the death announcements section.
        colour: "#9aa0a6",
    },

    commands: {
        publicCommands: ["hp", "hearts", "withdraw", "repair", "offhand", "shield", "smphelp",
            "where", "anon", "orbs"],
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
        customDescription: "Right click to raise it, right click again to lower it.\n"
            + "Blocks " + Math.round(c.blockFraction * 100) + "% of incoming damage while up.\n"
            + "Or put it in your off-hand slot to block without holding it.\n"
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

/** A row of filled/empty parallelogram blocks, e.g. "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1". */
function blockBar(left, max, segments) {
    const filled = Math.max(0, Math.min(segments, Math.round((left / max) * segments)));
    let bar = "";
    for (let i = 0; i < segments; i++) {
        bar += i < filled ? "\u25B0" : "\u25B1";   // filled / empty parallelogram
    }
    return bar;
}

/** A 12-segment wear bar, e.g. "durability 280/400  [!!!!!!!!....]". */
function durabilityBar(left, max) {
    const percent = Math.round((left / max) * 100);
    return blockBar(left, max, 12) + "  " + left + " / " + max + "  (" + percent + "%)";
}

/**
 * A compact durability readout for the top-left HUD strip, shown alongside
 * whatever else is up there (the shield chip, if any) - separate from the
 * bar already in the item's own tooltip, so it stays visible without opening
 * the inventory. Only the currently HELD item: Bloxd's API exposes no way to
 * read the armour slots, so worn gear cannot be shown here at all.
 */
function durabilityHudChip(playerId) {
    if (!CONFIG.durability.hudBar.enabled) {
        return null;
    }
    const held = heldSlot(playerId);
    if (!held) {
        return null;
    }
    const max = maxDurabilityFor(held.item);
    if (max <= 0) {
        return null;   // not a durable item
    }
    const custom = customAttrs(held.item);
    const left = typeof custom[ATTR_DUR] === "number" ? custom[ATTR_DUR] : max;
    const c = CONFIG.durability.hudBar;
    return c.icon + " " + displayName(held.item) + " " + blockBar(left, max, c.segments);
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

    // Every glider, whatever it is skinned in, costs the same steep recipe.
    if (CONFIG.gliders.enabled) {
        for (let i = 0; i < CONFIG.gliders.items.length; i++) {
            api.editItemCraftingRecipes(playerId, CONFIG.gliders.items[i], [{
                requires: CONFIG.gliders.recipe,
                produces: 1,
            }]);
        }
    }

    if (CONFIG.orb.craftable) {
        api.editItemCraftingRecipes(playerId, CONFIG.orb.item, [{
            requires: CONFIG.orb.recipe,
            produces: 1,
            attributes: orbAttributes(CONFIG.orb.hp),
        }]);
    }
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

    if (apple.shield > 0 && isAlive(playerId)) {
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
// Shield
// -----------------------------------------------------------------------------

/**
 * Which of three states a player's shield is in right now:
 *
 *   "blocking"  guarding - off-hand shields always are, a held one when raised
 *   "lowered"   they have a shield in hand but the guard is down
 *   "none"      no shield anywhere the script cares about
 *
 * Derived from live inventory every time rather than tracked, so it cannot
 * drift out of step with what the player is actually carrying.
 */
function shieldState(playerId) {
    if (!CONFIG.shield.enabled) {
        return "none";
    }
    const state = stateOf(playerId);
    const held = heldSlot(playerId);
    const inHand = !!(held && customAttrs(held.item)[ATTR_SHIELD]);

    if (!state.offhandShieldOn && !inHand) {
        return "none";
    }
    // A shield in the off-hand guards the whole time it sits there; a held one
    // only once the guard is up. Either way, a guard with no shield resource
    // behind it is not actually stopping anything, so it reads as lowered -
    // which is exactly what shieldBlock does with it too.
    const guarding = state.offhandShieldOn || state.shieldRaised;
    if (guarding && api.getShieldAmount(playerId) > 0) {
        return "blocking";
    }
    return "lowered";
}

/**
 * setShieldAmount rejects a lifeform that is not alive right now - mid-death,
 * on the respawn screen, or already kicked. tick() and a fatal hit can both
 * reach the shield code in that exact window, so every write to the shield
 * resource checks the engine's own isAlive first rather than letting it throw.
 */
function isAlive(lifeformId) {
    return api.isAlive(lifeformId);
}

/** Tops the numeric shield up to the working minimum when a guard goes up. */
function topUpShield(playerId) {
    if (!isAlive(playerId)) {
        return;
    }
    const c = CONFIG.shield;
    if (api.getShieldAmount(playerId) < c.raiseShieldAmount) {
        api.setShieldAmount(playerId, c.raiseShieldAmount);
    }
}

/**
 * Puts the shield on the player's off arm and returns the HUD chip text for
 * it, or null if there is nothing to show. The shield is visible the whole
 * time they have one - off-hand or in hand, guarding or not - it just sits
 * lower and duller when the guard is down.
 *
 * Only the mesh attachment is written here; the returned text is combined
 * with everything else the HUD strip shows (the durability bar included)
 * into one headerChips write, done by refreshHudChips. That combining is
 * why this can no longer write headerChips itself - two features writing
 * the same array independently would each erase the other's chip.
 */
function applyShieldVisuals(playerId) {
    const c = CONFIG.shield;
    const state = stateOf(playerId);
    const now = shieldState(playerId);
    // An invisible body may carry nothing visible: a shield box hanging in the
    // air where a hidden player stands gives them away completely. The HUD chip
    // is drawn on their own screen only, so they can still read their own state.
    const hidden = anonHidden(playerId);
    const key = now + (hidden ? "|hidden" : "");
    if (state.shieldVisual !== key) {
        state.shieldVisual = key;
        if (now === "none" || hidden) {
            api.updateEntityNodeMeshAttachment(playerId, c.armNode, null);
        } else {
            const blocking = now === "blocking";
            api.updateEntityNodeMeshAttachment(
                playerId, c.armNode, "Box",
                {
                    width: 0.5, height: 0.7, depth: 0.12,
                    diffuseColor: blocking ? c.meshColour : c.meshColourLowered,
                },
                blocking ? c.meshOffset : c.meshOffsetLowered
            );
        }
    }

    if (now === "none") {
        return null;
    }
    return now === "blocking" ? c.hudChipBlocking : c.hudChipLowered;
}

/**
 * Rebuilds the whole top-left HUD chip strip from every feature that wants a
 * chip there - the shield state and the held item's durability bar - and
 * writes it in one call, only when the combined result actually changed.
 */
function refreshHudChips(playerId) {
    const chips = [];
    if (CONFIG.shield.enabled) {
        const shieldChip = applyShieldVisuals(playerId);
        if (shieldChip) {
            chips.push(shieldChip);
        }
    }
    const durChip = durabilityHudChip(playerId);
    if (durChip) {
        chips.push(durChip);
    }

    const state = stateOf(playerId);
    const key = chips.join("");
    if (state.hudChipsKey === key) {
        return;
    }
    state.hudChipsKey = key;
    api.setClientOption(playerId, "headerChips", chips);
}

/** Raises the shield by hand: hold it and right click. */
function raiseShield(playerId) {
    stateOf(playerId).shieldRaised = true;
    topUpShield(playerId);
    refreshHudChips(playerId);
    tell(playerId, "Shield raised.", "#9fb4c7");
}

/** Drops the guard. The shield stays on the arm, just lowered. */
function lowerShield(playerId) {
    stateOf(playerId).shieldRaised = false;
    refreshHudChips(playerId);
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
    // Just the flag - applyShieldVisuals reads it and decides what to draw.
    const wasOn = state.offhandShieldOn;
    state.offhandShieldOn = !!(item && customAttrs(item)[ATTR_SHIELD]);
    if (state.offhandShieldOn && !wasOn) {
        // Seating a shield here is the moment its guard goes up, so this is
        // where it charges. Re-seating an emptied one recharges it too.
        topUpShield(playerId);
    }
}

/** Absorbs part of a hit into the numeric shield and wears the item that blocked it. */
function applyShieldAbsorption(defenderId, slot, damage) {
    const c = CONFIG.shield;
    if (!isAlive(defenderId)) {
        return damage;
    }
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

/** Which Y-band a world position falls in. Anything unclaimed is the overworld. */
function dimensionAt(pos) {
    const half = CONFIG.dimensions.verticalHalfSize;
    for (const key in CONFIG.dimensions.list) {
        const d = dimension(key);
        if (d.groundY == null) {
            continue;   // the overworld has no band of its own
        }
        if (Math.abs(pos[1] - d.groundY) <= half) {
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

/**
 * Moves a player between dimensions. They are stacked by height now, not
 * spread across x/z, so this is a vertical drop to the target's Y-band -
 * x and z carry straight across unchanged.
 */
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

    const state = stateOf(playerId);
    if (fromKey === "overworld") {
        // Remembered so a later return trip lands you back near where you
        // left, not at some arbitrary fallback height.
        state.overworldY = pos[1];
    }

    const x = pos[0];
    const z = pos[2];
    const y = to.groundY == null
        ? (state.overworldY != null ? state.overworldY : CONFIG.dimensions.overworldFallbackY)
        : to.groundY + to.arrivalY;

    ensureArrivalGround(x, y, z, to.platformBlock);
    api.setPosition(playerId, x, y, z);
    enterDimension(playerId, toKey, true);
    // Start filling the world in around them straight away rather than waiting
    // for the next tick's movement check.
    state.lastGenChunk = null;
    queueChunksAround(toKey, [x, y, z]);

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

/**
 * Turns the body itself on or off. "Invisible" is one of the engine's inbuilt
 * effects, and a null duration is how this script asks for one that does not
 * time out - the same way the off-hand icon is applied.
 */
function applyAnonInvisibility(playerId, anon) {
    if (!CONFIG.anonymous.invisible) {
        return;
    }
    if (anon) {
        api.applyEffect(playerId, "Invisible", null);
    } else {
        api.removeEffect(playerId, "Invisible");
    }
}

/** True while this player's body is hidden, so nothing may be drawn on it. */
function anonHidden(playerId) {
    return CONFIG.anonymous.enabled && CONFIG.anonymous.invisible && isAnon(playerId);
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
    applyAnonInvisibility(playerId, anon);
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
    const markerY = g.markerY + dimension(dimKey).groundY;
    if (api.isBlockInLoadedChunk(wx, markerY, wz)
        && api.getBlock(wx, markerY, wz) === g.markerBlock) {
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

/**
 * Sprinkles ores through the solid rock of one column, between fromY and toY
 * inclusive (both already shifted by the dimension's groundY, same as
 * everything else this writes). Deterministic like everything else in
 * generation: local height is folded into the seed, so a given block always
 * rolls the same way and a regenerated chunk comes back identical rather
 * than reshuffled.
 *
 * Only ever called on the rock BELOW the surface, so the top layer, the
 * bedrock floor and the ceiling are never replaced. ore.minY/maxY are local
 * heights (as if groundY were 0), so groundY is added before comparing.
 */
function scatterOres(x, z, localX, localZ, ores, seed, fromY, toY, groundY) {
    if (!ores || ores.length === 0) {
        return;
    }
    for (let y = fromY; y <= toY; y++) {
        const localY = y - groundY;
        for (let i = 0; i < ores.length; i++) {
            const ore = ores[i];
            if (ore.minY !== undefined && localY < ore.minY) {
                continue;
            }
            if (ore.maxY !== undefined && localY > ore.maxY) {
                continue;
            }
            // A different seed per ore and per height, so the rolls are
            // independent rather than every ore hitting the same blocks.
            if (hash2(localX, localZ, seed + localY * 7919 + i * 104729) < ore.chance) {
                api.setBlock(x, y, z, ore.block);
                break;   // one ore per block: the first match in the list wins
            }
        }
    }
}

/**
 * A closed cavern: bedrock floor, rolling ground, a lava sea and a ceiling.
 * groundY is the dimension's Y-band centre - every height in CONFIG is a
 * local offset from it, added here so the whole cavern actually lands there.
 */
function buildNetherColumn(x, z, localX, localZ, groundY) {
    const c = CONFIG.dimensions.generation.nether;
    const b = c.blocks;
    const floorY = c.floorY + groundY;
    const ceilingY = c.ceilingY + groundY;
    const lavaLevel = c.lavaLevel + groundY;

    const ground = Math.round(c.groundBase
        + (noise2(localX, localZ, c.groundScale, c.seed) - 0.5) * 2 * c.groundAmp) + groundY;
    const ceiling = Math.round(c.ceilingBase
        - (noise2(localX, localZ, c.ceilingScale, c.seed + 7) - 0.5) * 2 * c.ceilingAmp) + groundY;

    fill(x, floorY, floorY, z, b.floor);
    fill(x, floorY + 1, ground - 1, z, b.base);
    scatterOres(x, z, localX, localZ, c.ores, c.seed + 5000, floorY + 1, ground - 1, groundY);

    const surface = hash2(localX, localZ, c.seed + 31) < c.accentChance ? b.accent : b.top;
    fill(x, ground, ground, z, surface);

    // Lava pools wherever the ground dips below the sea level.
    fill(x, ground + 1, lavaLevel, z, b.liquid);

    fill(x, ceiling, ceilingY, z, b.ceiling);
}

/** Floating islands over open void, thinning out towards their edges. */
function buildEndColumn(x, z, localX, localZ, groundY) {
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
        + (noise2(localX, localZ, c.driftScale, c.seed + 13) - 0.5) * 2 * c.drift) + groundY;

    const top = centre + half - 1;
    fill(x, centre - half, top - 1, z, b.base);
    scatterOres(x, z, localX, localZ, c.ores, c.seed + 5000, centre - half, top - 1, groundY);
    fill(x, top, top, z, b.top);

    if (strength > 0.5 && hash2(localX, localZ, c.seed + 77) < c.pillarChance) {
        fill(x, top + 1, top + c.pillarHeight, z, b.pillar);
    }
}

/** Sparse black platforms in the dark, some carrying an Orb of Resurrection. */
function buildVoidColumn(x, z, localX, localZ, groundY) {
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
        + (noise2(localX, localZ, c.driftScale, c.seed + 13) - 0.5) * 2 * c.drift) + groundY;
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
        const groundY = dimension(job.dimKey).groundY;

        while (budget > 0 && job.column < perChunk) {
            const lx = job.column % g.chunkSize;
            const lz = (job.column / g.chunkSize) | 0;
            const x = job.cx * g.chunkSize + lx;
            const z = job.cz * g.chunkSize + lz;

            // Dimensions all share the same x/z space now - Y is what tells
            // them apart - so noise is sampled directly in world x/z.
            if (job.dimKey === "nether") {
                buildNetherColumn(x, z, x, z, groundY);
            } else if (job.dimKey === "end") {
                buildEndColumn(x, z, x, z, groundY);
            } else if (job.dimKey === "void") {
                buildVoidColumn(x, z, x, z, groundY);
            }

            job.column++;
            budget--;
        }

        if (job.column >= perChunk) {
            api.setBlock(job.cx * g.chunkSize, g.markerY + groundY, job.cz * g.chunkSize, g.markerBlock);
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
        applyAnonInvisibility(playerId, true);
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

        // A guard left up with nothing backing it (swapped away, died and
        // respawned) drops automatically - independent of whether dimensions
        // are enabled, so it always runs.
        if (CONFIG.shield.enabled && state.shieldRaised) {
            const slot = heldSlot(playerId);
            if (!slot || !customAttrs(slot.item)[ATTR_SHIELD]) {
                state.shieldRaised = false;
            }
        }

        // The off-hand slot is re-read every tick, for every player, so
        // dragging something in or out in the inventory screen counts too.
        if (CONFIG.offhand.enabled) {
            syncOffhand(playerId);
        }

        // Then redraw the shield from whatever the inventory now says (this is
        // what makes simply HOLDING one show it on your arm, with no click) and
        // the held item's durability bar, in one combined HUD write.
        refreshHudChips(playerId);

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
        // An empty hand pulls the off-hand item back out, when click-to-swap
        // is on. Off by default: /offhand and the touch button do this.
        if (CONFIG.offhand.enabled && CONFIG.offhand.swapOnRightClick) {
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
    } else if (custom[ATTR_SHIELD]) {
        // Hold the shield up to block, click again to drop the guard. Putting
        // one in the off-hand instead is a deliberate act - dragging it there,
        // /offhand or the touchscreen button - never a side effect of a click.
        toggleShield(playerId);
    } else if (CONFIG.offhand.enabled && CONFIG.offhand.swapOnRightClick) {
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
                + "craft a " + CONFIG.shield.name + " - hold it and RIGHT CLICK to raise your "
                + "guard, right click again to drop it | "
                + "or drag it into your off-hand slot (top-left of your backpack, not the "
                + "hotbar) and it blocks by itself, leaving your hand free for a sword - "
                + "/offhand or the on-screen button put it there too | "
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
