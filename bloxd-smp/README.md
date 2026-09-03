# Unstable-style SMP — Bloxd.io World Code

`smp.js` is a single self-contained World Code script for [Bloxd.io](https://bloxd.io).

| Feature | What it does |
| --- | --- |
| **Life Orbs** | A player kill costs the victim a heart and drops it as an **Aura XP Orb**. Right-click to absorb it — **once per player, ever**. |
| **Permanent ban at 0 hearts** | Lose your last heart and you are kicked and locked out of the world for good. |
| **Moonstone Mace** | Hit from the air to smash — works on **players and mobs** — with Wind Burst and Density. Expensive to craft. |
| **Moonstone Spear** | Right-click to lunge forward; hits during the lunge deal bonus damage. |
| **Golden Apples** | Two tiers. Heal, shield, Health Regen and fire resistance; the enchanted one permanently adds a heart. |
| **Durability** | Bloxd has none natively. This gives **every** tool, weapon, bow and armour piece a durability worked out from its name. |
| **Crafting** | The mace, the spear, both apples and both portals all have real recipes. |
| **Nether & End** | Two extra dimensions with their own fog, light, gravity and portals. |

## Install

1. **World Settings → Code → World Code**.
2. Paste the whole of `smp.js`.
3. Save. Everything is driven by the `CONFIG` object at the top of the file.

## Crafting

Recipes are registered per player on join, so they show up in the normal crafting menu.

| Item | Recipe |
| --- | --- |
| **Moonstone Mace** | **40 Moonstone + 4 Knight Heart + 2 Stick** |
| **Moonstone Spear** | 4 Moonstone + 2 Stick |
| **Golden Apple** | 1 Apple + 8 Gold Bar |
| **Enchanted Golden Apple** | 1 Apple + 8 Moonstone |
| **Purple Portal** ×2 (Nether) | 8 Obsidian + 1 Magma |
| **Black Portal** ×2 (The End) | 8 Obsidian + 1 Moonstone |

Life Orbs are not craftable on purpose — they only come from deaths and `/withdraw`.

## Life Orbs — one per player

Orbs are **Aura XP Orbs**, so they read as XP on the ground. Each is worth exactly one heart.

The catch: `orb.usesPerPlayer` is **1**. A player may absorb one orb in their entire life on the
world, so nobody can farm kills up to the 20-heart cap. Beyond that limit the orb is *not* consumed —
it stays in the inventory so it can still be traded to someone who has a use left. `/hp` shows how
many uses you have left. Set `orb.usesPerPlayer: 0` for no limit at all, or a higher number to allow
a few.

## The mace

The mace is the real `Moonstone Mace` item, and it is meant to be an endgame grind: 40 Moonstone,
4 Knight Hearts and 2 Sticks.

- **Smash** — fall at least 1.5 blocks and hit something. Bonus damage is `2.5 × blocks fallen`
  (capped at 60), and it lands on mobs just as it does on players.
- **Density 3** — adds a further `0.75 × level × blocks fallen`, so a longer drop hits much harder.
- **Wind Burst 3** — the smash throws you `4.5 × level` back into the air, and cancels the fall
  damage, so you can chain smashes.
- **Splash** — everything within 4.5 blocks of the impact, mobs included, is knocked away and up.
- **Wind charge** — right-click in mid-air for a vertical launch. 4 s cooldown, 3 durability.

Set `mace.windBurstLevel` or `mace.densityLevel` to `0` to turn either enchant off.

## Golden Apples

Bloxd has no Golden Apple item, so both are `Apple` with a custom name and tag.

| | Golden Apple | Enchanted Golden Apple |
| --- | --- | --- |
| Heals | 4 hearts | 10 hearts |
| Shield | +20 | +60 |
| Health Regen | 10 s | 30 s |
| Fire resistance | 15 s | 60 s |
| Permanent hearts | — | +1 |

Bloxd calls fire resistance **`Heat Resistance`** — there is no effect named "Fire Resistance", so
that is the one the script applies. Rename either apple with `apples.golden.name` /
`apples.enchanted.name`, and change any duration by setting `regenMs` or `heatResistMs`
(0 turns that effect off).

## Durability on everything

Rather than a hand-written list, durability is derived from the item's own name:

```
uses = materials[<material word>] * kinds[<last word>]
```

So `Moonstone Axe` is `2400 × 1`, `Iron Chestplate` is `250 × 1.3`, `Black Wood Bow` is `60 × 1.2`.
Every sword, dagger, club, spear, axe, pickaxe, spade, hoe, bow, crossbow, shield and armour piece
in the game is covered, including ones added later — no table to keep updating. Anything that is not
gear (blocks, food, materials) never wears out.

- Add or retune a tier in `durability.materials`, or a category in `durability.kinds`.
- `durability.overrides` takes exact item names and wins over the rule. **Set one to `0` to make
  that item unbreakable.**
- Gear with an unrecognised material word falls back to `durability.defaultMaterialUses` (200).

Wear is spent on **hits and blocks broken**, so it applies to what you are holding. Armour gets a
durability value and shows it in the tooltip, but does not tick down when you take a hit — Bloxd's
API does not expose the armour slots, so there is nothing to hook.

## Nether and the End

**Bloxd has one world — there is no dimension API.** So these are built the only way the engine
allows: each "dimension" is a far-apart region of the same world, dressed with its own fog, ambient
light, sky light and gravity through per-player client options.

| | Region centre | Scale | Portal | Feel |
| --- | --- | --- | --- | --- |
| Overworld | `0, 0` | 1× | — | normal |
| The Nether | `30000, 0` | 8× | Purple Portal | red fog, short view distance |
| The End | `0, 30000` | 1× | Black Portal | dark violet fog, 0.7× gravity |

Craft a portal block, place it, **stand on it**. Standing on the same block inside that dimension
brings you home. Nether coordinates are divided by 8 exactly like Minecraft, so a long walk there is
a short one back. `/where` tells you which dimension you are in; admins get `/dim <name>`.

Crossing a region border on foot also re-dresses the world, so respawns and teleports are handled
without a portal.

**What this does not do:** it does not generate Nether or End *terrain*. Those regions start empty,
so arriving builds a small platform under you (`platformBlock`, `platformRadius`) rather than
dropping you through the void. Building the landscape is up to you and your players.

**Before you use this, check your world is big enough for a 30000-block offset** — lower
`dimensions.list.*.origin` if it is not, keeping the regions at least `2 × regionHalfSize` apart.
Set `dimensions.enabled: false` to turn the whole system off.

## Bans

Reaching 0 hearts is permanent. The ban is stored on the world keyed by the player's **account id**,
not their name, so changing name does not get them back in. Admins can lift one with `/unban <name>`
even while that player is offline. Set `ban.enabled: false` to use a heart floor (`health.min`)
instead of eliminations.

## Commands

| Command | Who | Effect |
| --- | --- | --- |
| `/hp`, `/hearts` | everyone | Show your hearts |
| `/withdraw <hearts>` | everyone | Turn your hearts into Life Orbs to trade |
| `/smphelp` | everyone | Short in-game reminder |
| `/where` | everyone | Which dimension you are in |
| `/give mace\|spear\|gapple\|egapple\|orb\|netherportal\|endportal` | admins | Spawn any custom item |
| `/dim overworld\|nether\|end` | admins | Travel between dimensions |
| `/bans`, `/unban <name>` | admins | List and lift bans |
| `/sethp <player> <hp>` | admins | Set someone's max HP |

Admins are matched by in-game name — fill in `CONFIG.commands.adminNames`, which starts empty.
**`/unban` needs at least one admin name in there**, so set it before anyone gets eliminated.

## Tuning

Bloxd health runs 0–100, not 0–20, so a "heart" here is 10 HP (`hpPerHeart`).

- `health.starting` / `health.max` — 100 / 200 by default, i.e. 10 and 20 hearts.
- `death.hpLostToPlayer` — what a PvP death costs. `death.hpLostToWorld` is 0, so fall damage is free.
- `death.killerAlsoGains` — above 0 gives the killer instant lifesteal *on top of* the orbs.
- `mace.*` / `spear.*` — smash thresholds, enchant levels, lunge force, cooldowns, recipes.
- `apples.golden` / `apples.enchanted` — name, heal, shield, regen and fire-resistance durations,
  permanent hearts, recipes.
- `durability.materials` / `kinds` / `overrides` — see **Durability on everything** above. Set
  `durability.enabled: false` to switch the whole system off.

## Implementation notes

- Max HP is persisted per player with `api.setPlayerDbValue`, so hearts survive relogs.
- Custom items are ordinary Bloxd items (`Moonstone Mace`, `Apple`, `Aura XP Orb`) tagged through
  `customAttributes`. A plain apple is not a Golden Apple and a plain Moonstone Mace is not *the*
  mace — the tag is what counts, so nothing can be faked by renaming.
- How many orbs a player has absorbed is persisted per player, so the one-use cap survives relogs.
- Recipes carry those tags in the recipe's own `attributes` field, which is how a crafted item comes
  out custom.
- Durability lives in each item's `customAttributes` and is rewritten into the slot on every use,
  because the engine has no durability concept to hook into. The per-name lookup is cached, and
  matches on whole words so `Moonstone` is never read as `Stone`.
- Fall distance is tracked in `tick()` by accumulating descent and resetting on any non-fall.
- Bans are stored as JSON in the lobby db. A corrupt value is treated as "nobody is banned" rather
  than locking the whole world out.

## Tests

`test/` runs the script against a stubbed `api` in a Node VM — no game needed:

```
cd test && node test.js
```

118 assertions covering hearts, the one-orb-per-player cap, dimension detection, coordinate
scaling both ways, portals and their cooldown, arrival platforms, both apples (heal, shield, regen, fire
resistance), smash damage against players and mobs, Density and Wind Burst, the spear lunge,
durability derivation and breakage, crafting registration and costs, elimination and unban, and
every command.
