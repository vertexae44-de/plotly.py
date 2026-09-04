// =============================================================================
//  Unstable-style SMP  -  Bloxd.io World Code
//
//  Paste this whole file into World Settings -> Code -> World Code.
//
//  Hearts           a player kill drops Hearts. Eat one, gain one heart, no limit
//  The Void         hit 0 hearts and you are exiled to dark abandoned ruins -
//                   kill 3 guardians there for orbs to escape
//  Moonstone Mace   smash players AND mobs from the air. Wind Burst + Density
//  Plain maces      Wood/Stone/Iron/Gold/Diamond - no smash, just steep cost
//  Moonstone Spear  right click to lunge, hit hard while lunging
//  Moonstone Dagger poisons whatever it hits
//  Wind Charge      craft from Mango + Iron Fragment, right click to launch
//  Hang Gliders     this world's elytra - steep recipe, works fine with a mace
//  Mending          /mend, or throw a Splash Aura XP Potion at your off-hand -
//                   both spend Aura XP Potions, the closest thing to "XP" here
//  Bulwark shield   put it in your off-hand and crouch to block 60% - nothing
//                   else makes it guard
//  Off-hand         slot 44 carries a second item, outside the hotbar.
//                   Drag it in, /offhand, or the on-screen button
//  Reforge          /reforge swaps attributes between your held item and off-hand
//  Golden Apples    two tiers. Heal, shield, regen and fire resistance
//  Durability       Bloxd has none, so this adds it to every tool, weapon,
//                   piece of armour and glider, with a live HUD chip
//  Nether, End      portals, own fog/light/gravity, far-apart regions
//  & Void
//  Villagers        real NPC mobs scattered near spawn, right click to trade
//  Ocean            a ring of water near spawn with a custom sea mob
//  Orbital Strike   one-time Master Rod, calls down a delayed blast
//  Stabshot         reusable Obsidian Rod, instant blast on a cooldown
//  Bed spawn        stand on any bed to set your respawn point
//  Crystal PvP      place a Crystal, hit it, everything nearby is launched
//  Cart PvP         catch someone in a boat and they take extra damage
//  !anon            hides your body, your nametag and your name in chat
//  Crafting         nearly everything above has a recipe
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
        item: "Green Portal",           // a real block, dropped by a slain void guardian
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

    // ---- Moonstone Dagger -------------------------------------------------------
    // A real Bloxd item ("Moonstone Dagger"), tagged so a hit with it also
    // poisons the target - its one enchant, always on, not something you add
    // separately.
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

    // ---- Plain maces --------------------------------------------------------
    // Five ordinary tiers - real Bloxd items ("Wood/Stone/Iron/Gold/Diamond
    // Mace") - with none of the Moonstone Mace's Wind Burst/Density/smash
    // ability. Just a weapon with durability, priced steeply per tier so
    // owning one is still a real investment even without the smash kit.
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

    // ---- Mending --------------------------------------------------------------
    // Bloxd exposes no XP/level stat to World Code at all, so "spending XP"
    // here means spending Aura XP Potions - a real, already-stackable item -
    // instead of a level number nothing in the API can read or touch. This
    // replaces the old Repair Kit item outright: /mend restores durability on
    // whatever you are holding, and throwing a Splash Aura XP Potion does the
    // same to whatever you are holding at the moment it lands. Works on any
    // durable item in the game, not only this mod's own weapons.
    mending: {
        enabled: true,
        item: "Aura XP Potion",
        splashItem: "Splash Aura XP Potion",
        costPerMend: 1,             // potions consumed per /mend or splash
        restoreFraction: 0.35,      // fraction of max durability restored each time
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
        // Slot 44 - deep in the backpack grid, well past the hotbar (0-9) and
        // past where the old slot 10 sat. Picked by explicit request rather
        // than convention; nothing else in a normal inventory lands there by
        // accident, so it is just as safe a reserved slot as 10 was.
        slotIndex: 44,
        effectIcon: true,    // show the carried item as a status effect icon
        particles: true,     // a glint puff on every swap
        swapSound: "swoosh",
        colour: "#9fe6a0",

        // Filling the off-hand is deliberate, never a side effect of a click:
        // drag an item into the slot, or use /offhand or the touchscreen
        // button. Set swapOnRightClick true to go back to click-to-swap.
        swapOnRightClick: false,
        touchButton: "🛡 Off-hand",   // null hides the button
    },

    // ---- Shield (Bulwark) ------------------------------------------------------
    // Bloxd has no dedicated shield item, so this rebuilds one from real
    // primitives. It is deliberately narrow: a shield does nothing at all
    // unless it is BOTH sitting in the off-hand slot above AND you are
    // crouching (api.isPlayerCrouching) - let go of either and the guard
    // drops immediately. There is no hand-raised mode any more; a shield
    // sitting in your main hand is just an item, since blocking now belongs
    // entirely to crouch + off-hand. It shows on your other arm as a mesh
    // attachment and a status chip in the top-left HUD strip, while it soaks
    // a fraction of incoming player damage using Bloxd's own numeric shield
    // resource.
    //
    // Scope: blocks player-vs-player hits. It does not reduce real-mob damage
    // (never hooked to onMobDamagingPlayer) or crystal/orbital blasts
    // (explosions bypass it, same as most games).
    shield: {
        enabled: true,
        // A plain Brown Paintball, deliberately NOT the "Brown Paintball
        // Explosive Item": that one is a native throwable with its own click
        // behaviour, which fights this script's for the same click.
        item: "Brown Paintball",
        name: "Shield",
        durability: 500,

        raiseShieldAmount: 30,     // tops the shield resource up to at least this while crouched
        maxShieldOption: 60,       // raises the client's shield ceiling so it can show
        blockFraction: 0.6,        // fraction of incoming player damage blocked
        blockDurabilityCost: 2,    // per hit blocked

        armNode: "ArmLeftMesh",    // the "off-hand" arm - opposite the weapon hand

        meshColour: [176, 184, 196],          // bright, up in front, blocking
        meshColourLowered: [110, 118, 130],   // dull, tucked down, not blocking
        meshOffset: [0, -0.2, 0.15],
        meshOffsetLowered: [0, -0.5, -0.05],

        hudChipBlocking: "\uD83D\uDEE1 Blocking",
        hudChipLowered: "\uD83D\uDEE1 In off-hand \u2014 crouch to block",

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

    // ---- Hang Gliders (this world's elytra) ------------------------------------
    // Bloxd has no elytra item; the hang glider is the closest real equivalent -
    // same role (strap in, jump, glide), so it stands in for one outright rather
    // than being built from something unrelated. All four are real Bloxd items
    // with their own native crafting recipes; this overrides every one of them
    // to the same steep cost, so which material a glider is skinned in is a
    // cosmetic choice, not a cheaper path. Nothing in this script stops you
    // swinging the mace while gliding - Bloxd doesn't gate combat on vehicle
    // state - so the "elytra + mace" combo just works by not being blocked.
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
            Glider: 1.6,
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
        //
        // Armour and gliders both DO get a durability number from the same
        // materials/kinds formula above (Helmet/Chestplate/Leggings/Boots/
        // Gauntlets/Glider are all in the kinds table), and both are
        // mendable via /mend or a splash potion whenever you are holding one
        // in your hand. What armour cannot get is automatic wear from being
        // hit while worn - the same missing-armour-slot limitation - so an
        // equipped helmet's durability never ticks down on its own. A
        // glider's does: every time you mount one (onPlayerEnteredVehicle),
        // if it is what you are holding, this spends a small flat cost -
        // there is no dedicated "still gliding" event to hook per second of
        // flight, so cost-per-flight is the closest real proxy available.
        gliderWearPerFlight: 4,
        hudBar: {
            enabled: true,
            segments: 8,
            icon: "🔧",   // wrench
        },
    },

    // ---- Dimensions ---------------------------------------------------------
    // Bloxd has ONE world, so these are far-apart regions of it dressed up with
    // their own fog, light and gravity, separated by X - the layout that was
    // tested and confirmed working in-game. (A later version stacked them by Y
    // instead, at y=-10000/-30000/-50000; that silently failed in practice -
    // Void terrain never generated and Nether/End arrivals fell straight
    // through, because Bloxd's real buildable range does not reach that deep
    // no matter what the docs suggested. Reverted back to X-separated regions,
    // which do not have that problem.)
    dimensions: {
        enabled: true,
        // How far from its origin still counts as "inside" a dimension. The
        // regions below sit 20000+ apart on X, so this only has to be wider
        // than whatever generation ever builds.
        regionHalfSize: 4000,
        // Where a player lands back in the Overworld if this session never
        // recorded where they left from (e.g. they joined already inside a
        // dimension).
        overworldFallbackPos: [0, 80, 0],
        buildArrivalPlatform: true,
        platformRadius: 3,
        travelCooldownMs: 1500,    // stops portals ping-ponging you

        list: {
            overworld: {
                name: "Overworld",
                originX: null, originZ: null,   // no region of its own - it's whatever no other claims
                platformBlock: "Stone",
                clientOptions: {},  // empty = the normal look
            },
            nether: {
                name: "The Nether",
                originX: -10000, originZ: 0,
                arrivalY: 56,
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
                originX: 50000, originZ: 0,
                arrivalY: 68,
                platformBlock: "Cracked Stone Bricks",
                // No portalBlock: the only way out is the resurrection orbs.
                clientOptions: {
                    // Eerie and near-black - darker than the old palette on
                    // purpose, so it reads as somewhere gone wrong rather than
                    // just dim.
                    fogColourOverride: "#020204",
                    fogChunkDistanceOverride: 3,      // you can barely see
                    ambientLightColourOverride: "#06060a",
                    skyLightColourOverride: "#0c0c14",
                    gravityMultiplier: 0.5,
                },
            },
            end: {
                name: "The End",
                originX: -30000, originZ: 0,
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
        // The Nether, End and Void regions start as empty air. This fills
        // chunks in around players as they explore, so the dimensions are
        // real places. Every height below is a LOCAL offset from the region's
        // own origin, not a world-absolute Y - all three regions sit at
        // ordinary, safely-buildable altitudes now.
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
                islandScale: 30, islandThreshold: 0.6,
                thickness: 4, driftScale: 24, drift: 12,
                // Dark, cracked and overgrown with rot - an abandoned place,
                // not just a dim one.
                blocks: {
                    base: "Black Concrete",
                    top: "Cracked Stone Bricks",
                    accent: "Mossy Stone Bricks",
                    accentChance: 0.25,
                },

                // Orbs of Resurrection no longer come from mining - they only
                // ever drop from the guardian mobs stationed in these ruins.
                // A structure only tries to place on a wide enough, solid
                // enough platform top, checked once per finished chunk rather
                // than per column, so towers and houses come out whole.
                structures: {
                    chance: 0.05,           // rolled once per generated chunk
                    minPlatformRadius: 4,   // how much flat top the roll requires
                    guardiansPerStructure: 3,
                    guardianMob: "Draugr Skeleton",
                    guardianVariation: "default",
                    crystalChance: 0.5,     // a finished structure's chance to also hold a Crystal
                    wallBlock: "Stone Bricks",
                    accentBlock: "Mossy Stone Bricks",
                    floorBlock: "Cracked Stone Bricks",
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

    // ---- Orbital Strike Cannon & Stabshot ---------------------------------
    // Bloxd has neither a TNT item nor an API call that detonates one - the
    // only "explosion" this whole script can make is the same trick Crystal
    // PvP already uses: damage everyone in a radius and draw particles/sound
    // over it. So both of these are built the same way, and "TNT" in both
    // recipes is substituted with a real Bloxd block that is actually
    // explosive - Moonstone Explosive - rather than an item that does
    // not exist.
    orbital: {
        enabled: true,
        // A Master Rod, one real use per craft: firing it breaks it.
        item: "Master Rod",
        name: "Orbital Strike Cannon",
        recipe: [
            { items: ["Moonstone Explosive"], amt: 500 },
            { items: ["Arrow"], amt: 30 },
            { items: ["Diamond Bow"], amt: 2 },
            { items: ["Knight Heart"], amt: 400 },
        ],
        radius: 10,
        damage: 90,
        knockbackUp: 10,
        delayMs: 1200,     // a beat between firing and the strike landing
        range: 60,          // how far out getPlayerTargetInfo may aim
    },
    stabshot: {
        enabled: true,
        // An Obsidian Rod - reusable, unlike the Orbital's one-shot Master Rod.
        item: "Obsidian Rod",
        name: "Stabshot",
        recipe: [
            { items: ["Gold Bow"], amt: 1 },
            { items: ["Knight Heart"], amt: 250 },
            { items: ["Moonstone Explosive"], amt: 230 },
        ],
        radius: 4,
        damage: 55,
        knockbackUp: 6,
        cooldownMs: 6000,
        range: 60,
    },

    // ---- Villagers ------------------------------------------------------------
    // Bloxd has no "Villager" mob and no documented item-barter trade UI, so
    // this uses the real "NPC" mob type (it ships with named human skins) and
    // does the trade itself: right click one (caught via onPlayerClick's
    // targetEId) and it swaps your offered item for its stock, straight
    // through the same inventory calls crafting uses - not the native shop,
    // whose "currency" field is undocumented and not worth guessing at.
    npc: {
        enabled: true,
        mobType: "NPC",
        variations: ["emma", "leo", "isabel", "sanjay", "imara", "enoch", "sara", "carmen"],
        countInOverworld: 6,
        spawnRadius: 40,        // scattered this far from world spawn [0,64,0]
        spawnCentre: [0, 64, 0],
        trades: [
            { give: "Moonstone", giveAmt: 8, want: "Diamond", wantAmt: 4 },
            { give: "Knight Heart", giveAmt: 1, want: "Moonstone", wantAmt: 40 },
            { give: "Aura XP Potion", giveAmt: 3, want: "Gold Bar", wantAmt: 6 },
            { give: "Lunite", giveAmt: 2, want: "Block of Emerald", wantAmt: 6 },
        ],
    },

    // ---- Ocean ------------------------------------------------------------
    // Bloxd has no sea-creature mob type at all, so the "sea mob" here is a
    // custom one built the only way the API allows: an existing mob type,
    // renamed and re-skinned to read as something else. Slime is the closest
    // fit physically (soft, aquatic-looking silhouette, no legs to look wrong
    // half-submerged).
    ocean: {
        enabled: true,
        ringRadius: 48,          // an ocean ring this far out from world spawn
        ringWidth: 20,
        waterLevel: 62,
        floorBlock: "Sand",
        waterBlock: "Water",
        seaMob: {
            mobType: "Slime",
            name: "Abyssal Crawler",
            countPerRing: 10,
        },
    },

    // ---- Bed spawn points -----------------------------------------------------
    // Standing on any bed sets your respawn point there, the way sleeping in
    // one does in Minecraft (Bloxd has no onPlayerSleep callback to hook, so
    // standing on it is the closest real trigger available). No bed slept in
    // yet - or the death that eliminated you outright - and you come back in
    // the Overworld instead.
    bedSpawn: {
        enabled: true,
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
        publicCommands: ["hp", "hearts", "withdraw", "mend", "offhand", "shield", "reforge",
            "smphelp", "where", "anon", "orbs"],
        adminNames: [],        // e.g. ["YourName"] - needed for /unban, /orb, /sethp
    },
};

const DB_MAX_HP = "smpMaxHp";
const DB_BANS = "smpBans";
const DB_ORBS_EATEN = "smpOrbsEaten";
const DB_DIMENSION = "smpDimension";
const DB_ANON = "smpAnon";
const DB_SPAWN_POS = "smpSpawnPos";

const ATTR_ORB = "smpOrb";
const ATTR_MACE = "smpMace";
const ATTR_SPEAR = "smpSpear";
const ATTR_DAGGER = "smpDagger";
const ATTR_ORBITAL = "smpOrbital";
const ATTR_STABSHOT = "smpStabshot";
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

function gliderAttributes(itemName, durabilityLeft) {
    const max = durabilityForName(itemName);
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDescription: "Glides. Wears " + CONFIG.durability.gliderWearPerFlight
            + " durability per flight.\n" + durabilityBar(left, max),
        customAttributes: { [ATTR_DUR]: left, [ATTR_DUR_MAX]: max },
    };
}

function orbitalAttributes() {
    const o = CONFIG.orbital;
    return {
        customDisplayName: o.name,
        customDescription: "Right click to call down a strike where you are looking.\n"
            + "One-time use: the rod breaks the moment it fires.",
        customAttributes: { [ATTR_ORBITAL]: true },
    };
}

function stabshotAttributes() {
    const s = CONFIG.stabshot;
    return {
        customDisplayName: s.name,
        customDescription: "Right click to strike where you are looking. Reusable, on a cooldown.",
        customAttributes: { [ATTR_STABSHOT]: true },
    };
}

function shieldAttributes(durabilityLeft) {
    const c = CONFIG.shield;
    const max = c.durability;
    const left = durabilityLeft == null ? max : durabilityLeft;
    return {
        customDisplayName: c.name,
        customDescription: "Blocks " + Math.round(c.blockFraction * 100)
            + "% of incoming player damage, but only while it sits in your off-hand slot"
            + " AND you are crouching. Holding it in your hand does nothing.\n"
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

    if (CONFIG.orbital.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.orbital.item, [{
            requires: CONFIG.orbital.recipe,
            produces: 1,
            attributes: orbitalAttributes(),
        }]);
    }

    if (CONFIG.stabshot.enabled) {
        api.editItemCraftingRecipes(playerId, CONFIG.stabshot.item, [{
            requires: CONFIG.stabshot.recipe,
            produces: 1,
            attributes: stabshotAttributes(),
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
            const item = CONFIG.gliders.items[i];
            api.editItemCraftingRecipes(playerId, item, [{
                requires: CONFIG.gliders.recipe,
                produces: 1,
                attributes: gliderAttributes(item),
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
 * Spends Aura XP Potions - the closest thing to a spendable "XP" resource
 * Bloxd exposes to World Code at all - to restore durability on one slot.
 * Works on anything durabilityForName recognises - every tool, weapon, bow
 * and armour piece in the game, not only this mod's own items. Shared by
 * /mend (mends whatever you are holding) and by landing a Splash Aura XP
 * Potion (mends whatever sits in your off-hand instead, since the item you
 * are holding at the moment you throw is the potion itself).
 */
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
 * A shield only guards while it is BOTH sitting in the off-hand slot AND the
 * player is crouching (api.isPlayerCrouching) - either one alone does
 * nothing. There is no hand-raised mode: a shield held in the main hand is
 * just an item.
 */
function shieldGuarding(playerId) {
    if (!CONFIG.shield.enabled) {
        return false;
    }
    return !!stateOf(playerId).offhandShieldOn && api.isPlayerCrouching(playerId);
}

/**
 * Which of three states a player's shield is in right now:
 *
 *   "blocking"  in the off-hand, crouching, and the shield resource has charge
 *   "lowered"   a shield in the off-hand, but not guarding right now
 *   "none"      no shield in the off-hand at all
 *
 * Derived from live inventory and crouch state every time rather than
 * tracked, so it cannot drift out of step with what the player is doing.
 */
function shieldState(playerId) {
    if (!CONFIG.shield.enabled || !stateOf(playerId).offhandShieldOn) {
        return "none";
    }
    if (shieldGuarding(playerId) && api.getShieldAmount(playerId) > 0) {
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

/**
 * Checked every tick, for every player: whatever sits in the off-hand slot
 * gets a status effect icon, and a shield parked there guards automatically
 * while crouched - no need to hold or click it, so a sword stays in your
 * main hand the whole time.
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
        return damage;
    }

    const reduced = Math.max(0, Math.round(damage * (1 - c.blockFraction)));
    const absorbed = damage - reduced;
    api.setShieldAmount(defenderId, Math.max(0, shieldLeft - absorbed));
    spendDurability(defenderId, slot, c.blockDurabilityCost);
    return reduced;
}

/**
 * Applies blocking to an incoming hit: only the off-hand shield, only while
 * crouching. Returns the damage that should actually land.
 */
function shieldBlock(defenderId, damage) {
    if (!CONFIG.shield.enabled || !shieldGuarding(defenderId)) {
        return damage;
    }
    const off = offhandSlot(defenderId);
    if (!off || !customAttrs(off.item)[ATTR_SHIELD]) {
        return damage;
    }
    return applyShieldAbsorption(defenderId, off, damage);
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

    if (custom[ATTR_DAGGER]) {
        spendDurability(attacker, slot, CONFIG.durability.costPerHit);
        if (isAlive(targetId)) {
            api.applyEffect(targetId, "Poisoned", CONFIG.dagger.poisonMs);
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

/** Which X-region a world position falls in. Anything unclaimed is the overworld. */
function dimensionAt(pos) {
    const half = CONFIG.dimensions.regionHalfSize;
    for (const key in CONFIG.dimensions.list) {
        const d = dimension(key);
        if (d.originX == null) {
            continue;   // the overworld has no region of its own
        }
        if (Math.abs(pos[0] - d.originX) <= half && Math.abs(pos[2] - d.originZ) <= half) {
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
 * Moves a player between dimensions - a jump to the target region's X/Z
 * origin, at a normal, ordinary Y. This is the layout that was tested and
 * confirmed working in-game.
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
        // left, not at some arbitrary fallback position.
        state.overworldPos = pos;
    }

    let x, y, z;
    if (to.originX == null) {
        const fallback = CONFIG.dimensions.overworldFallbackPos;
        const back = state.overworldPos || fallback;
        x = back[0]; y = back[1]; z = back[2];
    } else {
        x = to.originX;
        z = to.originZ;
        y = to.arrivalY;
    }

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
// Orbital Strike Cannon & Stabshot
// -----------------------------------------------------------------------------

/** Where a player is aiming: their block target if there is one, else a point out along their facing. */
function aimPoint(playerId, range) {
    const target = api.getPlayerTargetInfo(playerId);
    if (target && target.position) {
        return target.position;
    }
    const pos = api.getPosition(playerId);
    const facing = api.getPlayerFacingInfo(playerId);
    const dir = facing && facing.dir ? facing.dir : [0, 0, 1];
    return [pos[0] + dir[0] * range, pos[1] + dir[1] * range, pos[2] + dir[2] * range];
}

/** The same "damage everyone in a radius, then draw it" trick Crystal PvP uses - the only real explosion this API can make. */
function blastAt(sourceId, centre, radius, damage, knockbackUp, withItem) {
    const targets = api.getPlayerIds().concat(api.getMobIds());
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
        if (distance > radius) {
            continue;
        }
        const falloff = 1 - distance / radius;
        api.attemptApplyDamage({
            eId: sourceId,
            hitEId: victim,
            attemptedDmgAmt: Math.max(1, Math.round(damage * falloff)),
            withItem: withItem,
        });
        const length = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
        api.applyImpulse(victim, (dx / length) * 5 * falloff, knockbackUp * falloff, (dz / length) * 5 * falloff);
        if (isPlayer(victim)) {
            api.shakePlayerCamera(victim, Math.min(1, falloff), 600);
        }
    }
    api.broadcastSound("ominousBellHit", 1.0, 0.55, { playerIdOrPos: centre, maxHearDist: 90 });
    api.playParticleEffect({
        presetId: "stomp",
        pos1: [centre[0] - radius / 2, centre[1], centre[2] - radius / 2],
        pos2: [centre[0] + radius / 2, centre[1] + 3, centre[2] + radius / 2],
    });
}

// Strikes waiting on their delay - there is no timer API, so this is ticked
// forward the same way the terrain generation queue is.
const pendingStrikes = [];

function fireOrbital(playerId, slot) {
    const o = CONFIG.orbital;
    const centre = aimPoint(playerId, o.range);
    // One-time use: the rod breaks the instant it fires, whether or not
    // anything is actually there to hit.
    api.setItemSlot(playerId, slot.index, "Air", null, undefined, true);
    pendingStrikes.push({
        fireAt: api.now() + o.delayMs, centre: centre, radius: o.radius,
        damage: o.damage, knockbackUp: o.knockbackUp, sourceId: playerId,
    });
    tell(playerId, "Orbital strike incoming...", "#ff6b6b");
    api.playSound(playerId, "magicAccent4", 1.0, 0.6);
}

function fireStabshot(playerId, slot) {
    const s = CONFIG.stabshot;
    const state = stateOf(playerId);
    const now = api.now();
    const remaining = s.cooldownMs - (now - (state.lastStabshot || 0));
    if (remaining > 0) {
        api.queueCrosshairText(playerId, "Stabshot: " + Math.ceil(remaining / 1000) + "s", 800);
        return;
    }
    state.lastStabshot = now;
    blastAt(playerId, aimPoint(playerId, s.range), s.radius, s.damage, s.knockbackUp, s.item);
    api.playSound(playerId, "magicAccent3", 0.9, 0.7);
}

/** Fires whatever pending orbital strikes have come due. Called from tick(). */
function processPendingStrikes() {
    if (pendingStrikes.length === 0) {
        return;
    }
    const now = api.now();
    for (let i = pendingStrikes.length - 1; i >= 0; i--) {
        const strike = pendingStrikes[i];
        if (now >= strike.fireAt) {
            blastAt(strike.sourceId, strike.centre, strike.radius, strike.damage,
                strike.knockbackUp, CONFIG.orbital.item);
            pendingStrikes.splice(i, 1);
        }
    }
}

// -----------------------------------------------------------------------------
// Villagers & Ocean
// -----------------------------------------------------------------------------

// mobId -> the trade it offers. Assigned once at spawn, cycling through
// CONFIG.npc.trades, so every villager has exactly one fixed trade rather
// than the whole list (closer to how Minecraft villagers work).
const npcTrades = {};

let worldFeaturesSpawned = false;

/** Scatters the villagers and the ocean's sea mobs once, near world spawn. */
function spawnWorldFeatures() {
    if (worldFeaturesSpawned) {
        return;
    }
    worldFeaturesSpawned = true;

    if (CONFIG.npc.enabled) {
        const n = CONFIG.npc;
        for (let i = 0; i < n.countInOverworld; i++) {
            const angle = (i / n.countInOverworld) * Math.PI * 2;
            const x = n.spawnCentre[0] + Math.round(Math.cos(angle) * n.spawnRadius);
            const z = n.spawnCentre[2] + Math.round(Math.sin(angle) * n.spawnRadius);
            const variation = n.variations[i % n.variations.length];
            const mobId = api.attemptSpawnMob(n.mobType, x, n.spawnCentre[1], z, {
                variation: variation, name: "Villager",
            });
            if (mobId) {
                npcTrades[mobId] = n.trades[i % n.trades.length];
            }
        }
    }

    if (CONFIG.ocean.enabled) {
        const o = CONFIG.ocean;
        api.setBlockRect(
            [-o.ringRadius - o.ringWidth, o.waterLevel - 3, -o.ringRadius - o.ringWidth],
            [o.ringRadius + o.ringWidth, o.waterLevel - 1, o.ringRadius + o.ringWidth],
            o.floorBlock
        );
        api.setBlockRect(
            [-o.ringRadius - o.ringWidth, o.waterLevel - 3, -o.ringRadius - o.ringWidth],
            [o.ringRadius + o.ringWidth, o.waterLevel, o.ringRadius + o.ringWidth],
            o.waterBlock
        );
        for (let i = 0; i < o.seaMob.countPerRing; i++) {
            const angle = (i / o.seaMob.countPerRing) * Math.PI * 2;
            const x = Math.round(Math.cos(angle) * o.ringRadius);
            const z = Math.round(Math.sin(angle) * o.ringRadius);
            api.attemptSpawnMob(o.seaMob.mobType, x, o.waterLevel - 1, z, { name: o.seaMob.name });
        }
    }
}

/** Trades the player's offered items for the villager's stock, straight through inventory - no shop UI involved. */
function tradeWithNpc(playerId, mobId) {
    const trade = npcTrades[mobId];
    if (!trade) {
        return;
    }
    if (countItem(playerId, trade.want) < trade.wantAmt) {
        tell(playerId, "This villager wants " + trade.wantAmt + " " + trade.want + ".", "#ffa502");
        return;
    }
    consumeItems(playerId, trade.want, trade.wantAmt);
    api.giveItem(playerId, trade.give, trade.giveAmt);
    tell(playerId, "Traded " + trade.wantAmt + " " + trade.want + " for "
        + trade.giveAmt + " " + trade.give + ".", "#7bed9f");
    api.playSound(playerId, "levelup", 0.7, 1.2);
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

// Void guardian mobs currently alive, keyed by mob id - the only source of
// Orbs of Resurrection now. Populated by maybeBuildVoidStructure, consumed
// by onPlayerKilledMob.
const voidGuardians = {};

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

/**
 * Sprinkles ores through the solid rock of one column, between fromY and toY
 * inclusive - plain, ordinary Y values, since dimensions no longer shift
 * height at all. Deterministic like everything else in generation: height is
 * folded into the seed, so a given block always rolls the same way and a
 * regenerated chunk comes back identical rather than reshuffled.
 *
 * Only ever called on the rock BELOW the surface, so the top layer, the
 * bedrock floor and the ceiling are never replaced.
 */
function scatterOres(x, z, localX, localZ, ores, seed, fromY, toY) {
    if (!ores || ores.length === 0) {
        return;
    }
    for (let y = fromY; y <= toY; y++) {
        for (let i = 0; i < ores.length; i++) {
            const ore = ores[i];
            if (ore.minY !== undefined && y < ore.minY) {
                continue;
            }
            if (ore.maxY !== undefined && y > ore.maxY) {
                continue;
            }
            // A different seed per ore and per height, so the rolls are
            // independent rather than every ore hitting the same blocks.
            if (hash2(localX, localZ, seed + y * 7919 + i * 104729) < ore.chance) {
                api.setBlock(x, y, z, ore.block);
                break;   // one ore per block: the first match in the list wins
            }
        }
    }
}

/**
 * A closed cavern: bedrock floor, rolling ground, a lava sea and a ceiling.
 * localX/localZ are relative to the Nether region's own origin, so the
 * terrain pattern looks the same regardless of where that region sits.
 */
function buildNetherColumn(x, z, localX, localZ) {
    const c = CONFIG.dimensions.generation.nether;
    const b = c.blocks;

    const ground = Math.round(c.groundBase
        + (noise2(localX, localZ, c.groundScale, c.seed) - 0.5) * 2 * c.groundAmp);
    const ceiling = Math.round(c.ceilingBase
        - (noise2(localX, localZ, c.ceilingScale, c.seed + 7) - 0.5) * 2 * c.ceilingAmp);

    fill(x, c.floorY, c.floorY, z, b.floor);
    fill(x, c.floorY + 1, ground - 1, z, b.base);
    scatterOres(x, z, localX, localZ, c.ores, c.seed + 5000, c.floorY + 1, ground - 1);

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
    scatterOres(x, z, localX, localZ, c.ores, c.seed + 5000, centre - half, top - 1);
    fill(x, top, top, z, b.top);

    if (strength > 0.5 && hash2(localX, localZ, c.seed + 77) < c.pillarChance) {
        fill(x, top + 1, top + c.pillarHeight, z, b.pillar);
    }
}

/**
 * The height of solid ground at one Void column, or null over open void.
 * Shared by buildVoidColumn and the structure placer, so both agree on
 * where the ground actually is.
 */
function voidColumnTop(localX, localZ) {
    const c = CONFIG.dimensions.generation["void"];
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
        return null;
    }
    const half = Math.max(1, Math.round(strength * c.thickness));
    const centre = Math.round(c.baseY
        + (noise2(localX, localZ, c.driftScale, c.seed + 13) - 0.5) * 2 * c.drift);
    return { base: centre - half, top: centre + half - 1 };
}

/** Dark, cracked and abandoned-looking platforms, sparse in the dark. */
function buildVoidColumn(x, z, localX, localZ) {
    const c = CONFIG.dimensions.generation["void"];
    const b = c.blocks;
    const column = voidColumnTop(localX, localZ);
    if (!column) {
        return;
    }
    fill(x, column.base, column.top - 1, z, b.base);
    const surface = hash2(localX, localZ, c.seed + 61) < b.accentChance ? b.accent : b.top;
    fill(x, column.top, column.top, z, surface);
}

/** Builds a slice of the queue each tick so a big reveal never stalls the server. */
/**
 * Rolled once per finished Void chunk, never per column - a tower or house
 * needs several whole columns, so trying per-column would tear structures
 * apart across chunk edges. Picks the chunk's centre, and only builds if the
 * ground there (and a ring around it, per minPlatformRadius) is solid and
 * roughly flat - open void or a cliff edge is skipped rather than forced.
 */
function maybeBuildVoidStructure(cx, cz, originX, originZ) {
    const g = CONFIG.dimensions.generation;
    const s = g["void"].structures;
    if (!s || hash2(cx, cz, g["void"].seed + 4001) >= s.chance) {
        return;
    }

    const worldX = cx * g.chunkSize + (g.chunkSize >> 1);
    const worldZ = cz * g.chunkSize + (g.chunkSize >> 1);
    const localX = worldX - originX;
    const localZ = worldZ - originZ;
    const centreCol = voidColumnTop(localX, localZ);
    if (!centreCol) {
        return;   // open void at the centre - nowhere to stand
    }

    const r = s.minPlatformRadius;
    for (let dx = -r; dx <= r; dx += r) {
        for (let dz = -r; dz <= r; dz += r) {
            const col = voidColumnTop(localX + dx, localZ + dz);
            if (!col || Math.abs(col.top - centreCol.top) > 1) {
                return;   // too uneven or partly open - skip this roll
            }
        }
    }

    const baseY = centreCol.top + 1;
    const wide = hash2(cx, cz, g["void"].seed + 4002) < 0.5;
    if (wide) {
        buildVoidHouse(worldX, baseY, worldZ, s);
    } else {
        buildVoidTower(worldX, baseY, worldZ, s);
    }

    if (hash2(cx, cz, g["void"].seed + 4003) < s.crystalChance) {
        api.setBlock(worldX, baseY, worldZ - 3, CONFIG.crystal.block);
    }

    spawnVoidGuardians(worldX, baseY, worldZ, s);
}

/** A small hollow ruin: four walls, a mossy-trimmed doorway, an open roof. */
function buildVoidHouse(x, y, z, s) {
    const r = 3;
    api.setBlockRect([x - r, y, z - r], [x + r, y, z + r], s.floorBlock);
    api.setBlockRect([x - r, y + 1, z - r], [x + r, y + 4, z - r], s.wallBlock);
    api.setBlockRect([x - r, y + 1, z + r], [x + r, y + 4, z + r], s.wallBlock);
    api.setBlockRect([x - r, y + 1, z - r], [x - r, y + 4, z + r], s.wallBlock);
    api.setBlockRect([x + r, y + 1, z - r], [x + r, y + 4, z + r], s.accentBlock);
    // A doorway punched through the mossy wall.
    api.setBlockRect([x + r, y + 1, z - 1], [x + r, y + 2, z + 1], "Air");
}

/** A crumbling watchtower, hollow inside, mossy trim around the top. */
function buildVoidTower(x, y, z, s) {
    const r = 2;
    api.setBlockRect([x - r, y, z - r], [x + r, y + 8, z + r], s.wallBlock);
    api.setBlockRect([x - r + 1, y + 1, z - r + 1], [x + r - 1, y + 7, z + r - 1], "Air");
    api.setBlockRect([x - r, y + 8, z - r], [x + r, y + 8, z + r], s.accentBlock);
    api.setBlockRect([x - 1, y + 1, z - r], [x + 1, y + 2, z - r], "Air");   // doorway
}

/** Places the guardians a structure needs to actually pay out an orb. */
function spawnVoidGuardians(x, y, z, s) {
    for (let i = 0; i < s.guardiansPerStructure; i++) {
        const angle = (i / s.guardiansPerStructure) * Math.PI * 2;
        const gx = x + Math.round(Math.cos(angle) * 2);
        const gz = z + Math.round(Math.sin(angle) * 2);
        const mobId = api.attemptSpawnMob(s.guardianMob, gx, y + 1, gz, {
            variation: s.guardianVariation,
            name: "Void Guardian",
        });
        if (mobId) {
            voidGuardians[mobId] = true;
        }
    }
}

function processGeneration() {
    const g = CONFIG.dimensions.generation;
    if (!g.enabled) {
        return;
    }
    let budget = g.columnsPerTick;
    const perChunk = g.chunkSize * g.chunkSize;

    while (budget > 0 && genQueue.length > 0) {
        const job = genQueue[0];
        const region = dimension(job.dimKey);
        const originX = region.originX;
        const originZ = region.originZ;

        while (budget > 0 && job.column < perChunk) {
            const lx = job.column % g.chunkSize;
            const lz = (job.column / g.chunkSize) | 0;
            const x = job.cx * g.chunkSize + lx;
            const z = job.cz * g.chunkSize + lz;
            const localX = x - originX;
            const localZ = z - originZ;

            if (job.dimKey === "nether") {
                buildNetherColumn(x, z, localX, localZ);
            } else if (job.dimKey === "end") {
                buildEndColumn(x, z, localX, localZ);
            } else if (job.dimKey === "void") {
                buildVoidColumn(x, z, localX, localZ);
            }

            job.column++;
            budget--;
        }

        if (job.column >= perChunk) {
            api.setBlock(job.cx * g.chunkSize, g.markerY, job.cz * g.chunkSize, g.markerBlock);
            if (job.dimKey === "void") {
                maybeBuildVoidStructure(job.cx, job.cz, originX, originZ);
            }
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
    spawnWorldFeatures();

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

        // The off-hand slot is re-read every tick, for every player, so
        // dragging something in or out in the inventory screen counts too.
        if (CONFIG.offhand.enabled) {
            syncOffhand(playerId);
        }

        // Kept charged every tick you are actually guarding (off-hand shield
        // + crouching), not just the moment you seat it - otherwise a shield
        // that ran dry in one fight would silently never block again even
        // though you are still crouched with it out, which is the bug this
        // replaces.
        if (shieldGuarding(playerId)) {
            topUpShield(playerId);
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

    processPendingStrikes();
}

/** Any colour of Bed or Strongbed, head half included - standing on either sets your spawn. */
function isBedBlock(blockName) {
    return /\b(Bed|Strongbed)( Head)?$/.test(blockName);
}

function onBlockStandStart(playerId, x, y, z, blockName) {
    if (CONFIG.dimensions.enabled) {
        usePortal(playerId, blockName);
    }
    if (CONFIG.bedSpawn.enabled && isBedBlock(blockName)) {
        api.setPlayerDbValue(playerId, DB_SPAWN_POS, JSON.stringify([x, y, z]));
        api.queueCrosshairText(playerId, "Spawn point set", 1500);
    }
}

/** Bed spawn if one was set, otherwise the Overworld fallback position. */
function onRespawnRequest(playerId) {
    if (CONFIG.bedSpawn.enabled) {
        const raw = api.getPlayerDbValue(playerId, DB_SPAWN_POS);
        if (typeof raw === "string" && raw !== "") {
            try {
                const pos = JSON.parse(raw);
                if (Array.isArray(pos) && pos.length === 3) {
                    return pos;
                }
            } catch (err) {
                // fall through to the Overworld fallback below
            }
        }
    }
    return CONFIG.dimensions.overworldFallbackPos;
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
    } else if (custom[ATTR_ORBITAL]) {
        fireOrbital(playerId, slot);
    } else if (custom[ATTR_STABSHOT]) {
        fireStabshot(playerId, slot);
    } else if (CONFIG.offhand.enabled && CONFIG.offhand.swapOnRightClick) {
        // A shield does nothing on right click any more - putting one in the
        // off-hand is the only way it ever guards, and that is a deliberate
        // act (dragging it there, /offhand, or the touchscreen button), never
        // a side effect of a click.
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

    // The closest real proxy to "wear a glider down while flying": there is
    // no per-tick "still gliding" event to hook, so a flat cost is spent
    // once per mount instead, on whatever is currently held if it is a
    // glider. Fires for boats too, but spendDurability is a no-op unless
    // the held item is actually one of the gliders (max <= 0 otherwise).
    if (CONFIG.durability.enabled) {
        const slot = heldSlot(playerId);
        if (slot && CONFIG.gliders.items.indexOf(slot.item.name) !== -1) {
            spendDurability(playerId, slot, CONFIG.durability.gliderWearPerFlight);
        }
    }
}

function onPlayerExitedVehicle(playerId) {
    stateOf(playerId).inVehicle = false;
}

function onPlayerDamagingMob(playerId, mobId, damageDealt) {
    return handleWeaponHit(playerId, mobId, damageDealt);
}

/** Slaying a void guardian is the only source of Orbs of Resurrection now. */
function onPlayerKilledMob(playerId, mobId, damageDealt, withItem) {
    if (voidGuardians[mobId]) {
        delete voidGuardians[mobId];
        api.giveItem(playerId, CONFIG.resurrection.item, 1);
        tell(playerId, "The guardian drops a " + CONFIG.resurrection.name + ".", "#b39ddb");
        api.playSound(playerId, "magicAccent2", 0.8, 1.1);
    }
}

/** Right click (alt click) on a villager NPC trades; left click does nothing special. */
function onPlayerClick(playerId, wasAltClick, x, y, z, block, targetEId) {
    if (wasAltClick && targetEId && npcTrades[targetEId]) {
        tradeWithNpc(playerId, targetEId);
    }
}

/** A landed Splash Aura XP Potion mends whatever is in the thrower's off-hand. */
function onPlayerUsedThrowable(playerId, throwableName, thrownEntityId) {
    if (CONFIG.mending.enabled && throwableName === CONFIG.mending.splashItem) {
        mendOffhandItem(playerId);
    }
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

        case "mend":
            mendHeldItem(playerId);
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
            const s = shieldState(playerId);
            if (s === "none") {
                tell(playerId, "Put a " + CONFIG.shield.name + " in your off-hand slot ("
                    + CONFIG.offhand.slotIndex + ") to carry one.", "#ffa502");
            } else if (s === "blocking") {
                tell(playerId, "Blocking.", "#9fb4c7");
            } else {
                tell(playerId, "In your off-hand - crouch to block.", "#9fb4c7");
            }
            return true;
        }

        case "reforge": {
            // Attribute swapping: exchanges the custom attributes (durability,
            // enchant-style tags, everything) of your held item and whatever
            // sits in your off-hand slot. Base item names never change - only
            // what each one carries.
            const held = heldSlot(playerId);
            const off = offhandSlot(playerId);
            if (!held || !off) {
                tell(playerId, "Hold one item and carry another in your off-hand to swap their attributes.",
                    "#ff4757");
                return true;
            }
            const heldAttrs = held.item.attributes;
            const offAttrs = off.item.attributes;
            api.setItemSlot(playerId, held.index, held.item.name, held.item.amount, offAttrs, true);
            api.setItemSlot(playerId, off.index, off.item.name, off.item.amount, heldAttrs, true);
            tell(playerId, "Swapped attributes between " + displayName(held.item)
                + " and " + displayName(off.item) + ".", "#7bed9f");
            return true;
        }

        case "smphelp":
            tell(playerId,
                "/hp - your hearts | /withdraw <hearts> - turn hearts into "
                + CONFIG.orb.name + "s | right click a " + CONFIG.orb.name
                + " or Golden Apple to eat it | "
                + "craft the " + CONFIG.mace.name + " (" + CONFIG.mace.item + "), "
                + CONFIG.spear.name + ", " + CONFIG.dagger.name + " (poisons on hit) and "
                + CONFIG.windCharge.name + " | plain Wood/Stone/Iron/Gold/Diamond Maces too | "
                + "hold a damaged item and /mend, or throw a "
                + CONFIG.mending.splashItem + " to mend your off-hand instead - both cost "
                + CONFIG.mending.item + "s | "
                + "craft a " + CONFIG.shield.name + " and put it in your off-hand slot ("
                + CONFIG.offhand.slotIndex + ") - it only blocks while you are crouching | "
                + "/offhand or the on-screen button put an item there too | "
                + "/reforge swaps attributes between your held item and your off-hand | "
                + "craft and place a Purple Portal for the Nether or a "
                + "Black Portal for the End, then stand on it | /where shows your dimension | "
                + "craft a Crystal, place it and hit it to blow up everything nearby | "
                + "the " + CONFIG.orbital.name + " and " + CONFIG.stabshot.name
                + " call down a strike where you are looking | "
                + "right click a villager to trade | "
                + "sleep in (stand on) a bed to set your spawn point | "
                + "type " + CONFIG.anonymous.chatCommand + " to go anonymous | "
                + "hit 0 hearts and you are exiled to the Void - kill 3 guardians in its ruins "
                + "for " + CONFIG.resurrection.name + "s to get out (/orbs).",
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
            } else if (what === "dagger") {
                api.giveItem(playerId, CONFIG.dagger.item, 1, daggerAttributes());
            } else if (what === "shield") {
                api.giveItem(playerId, CONFIG.shield.item, 1, shieldAttributes(CONFIG.shield.durability));
            } else if (what === "orbital") {
                api.giveItem(playerId, CONFIG.orbital.item, 1, orbitalAttributes());
            } else if (what === "stabshot") {
                api.giveItem(playerId, CONFIG.stabshot.item, 1, stabshotAttributes());
            } else if (what === "netherportal") {
                api.giveItem(playerId, CONFIG.dimensions.list.nether.portalBlock, 8);
            } else if (what === "endportal") {
                api.giveItem(playerId, CONFIG.dimensions.list.end.portalBlock, 8);
            } else {
                tell(playerId,
                    "Usage: /give mace|spear|dagger|windcharge|shield|orbital|stabshot|gapple|egapple|heart"
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
