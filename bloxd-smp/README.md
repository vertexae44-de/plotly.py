# Unstable-style SMP — Bloxd.io World Code

`smp.js` is a single self-contained World Code script for [Bloxd.io](https://bloxd.io).

| Feature | What it does |
| --- | --- |
| **Life Orbs** | A player kill costs the victim a heart and drops it as an orb. Right-click an orb to absorb it. |
| **Permanent ban at 0 hearts** | Lose your last heart and you are kicked and locked out of the world for good. |
| **Windburst Mace** | A Moonstone Axe. Hit from the air to smash — works on **players and mobs** — with Wind Burst and Density. |
| **Moonstone Spear** | Right-click to lunge forward; hits during the lunge deal bonus damage. |
| **Golden Apples** | Two tiers. Heal, shield, Health Regen and fire resistance; the enchanted one permanently adds a heart. |
| **Durability** | Bloxd has none natively. This gives **every** tool, weapon, bow and armour piece a durability worked out from its name. |
| **Crafting** | The mace, the spear and both apples all have real recipes. |

## Install

1. **World Settings → Code → World Code**.
2. Paste the whole of `smp.js`.
3. Save. Everything is driven by the `CONFIG` object at the top of the file.

## Crafting

Recipes are registered per player on join, so they show up in the normal crafting menu.

| Item | Recipe |
| --- | --- |
| **Windburst Mace** (Moonstone Axe) | 5 Moonstone + 2 Stick + 1 Knight Heart |
| **Moonstone Spear** | 4 Moonstone + 2 Stick |
| **Golden Apple** | 1 Apple + 8 Gold Bar |
| **Enchanted Golden Apple** | 1 Apple + 8 Moonstone |

Life Orbs are not craftable on purpose — they only come from deaths and `/withdraw`.

## The mace

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
| `/give mace\|spear\|gapple\|egapple\|orb` | admins | Spawn any custom item |
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
- Custom items are ordinary Bloxd items (`Moonstone Axe`, `Apple`, `Knight Heart`) tagged through
  `customAttributes`. A plain apple is not a Golden Apple and a plain Moonstone Axe is not the mace —
  the tag is what counts, so nothing can be faked by renaming.
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

74 assertions covering hearts, orbs, both apples (heal, shield, regen, fire resistance), smash damage
against players and mobs, Density and Wind Burst, the spear lunge, durability derivation and
breakage, crafting registration, elimination and unban, and every command.
