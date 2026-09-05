# Unstable-style SMP — Bloxd.io World Code

`smp.js` is a single self-contained World Code script for [Bloxd.io](https://bloxd.io).

| Feature | What it does |
| --- | --- |
| **Hearts** | A player kill costs the victim a heart and drops it as a **Heart** (an Aura XP Orb). Right-click to eat it — **1 Heart = 1 heart, no limit**. |
| **Exile to the Void at 0 hearts** | Lose your last heart and you are stranded in dark, abandoned ruins until you kill 3 guardians for Orbs of Resurrection. |
| **Moonstone Mace** | Hit from the air to smash — works on **players and mobs** — with Wind Burst and Density. Expensive to craft. |
| **Plain maces** | Wood/Stone/Iron/Gold/Diamond — no smash, no Wind Burst, just an ordinary weapon at a steep price. |
| **Moonstone Spear** | Right-click to lunge forward; hits during the lunge deal bonus damage. |
| **Moonstone Dagger** | Poisons whatever it hits. |
| **Plain daggers** | Wood/Stone/Iron/Gold/Diamond — no poison, just an ordinary weapon at a steep price. |
| **Golden Apples** | Two tiers. Heal, shield, Health Regen and fire resistance; the enchanted one permanently adds a heart. |
| **Wind Charge** | A standalone launch item, craftable from Mango + Iron Fragment. Anyone can carry a stack, not just the mace. |
| **Hang Gliders** | This world's elytra — a real Bloxd item, steep recipe. Nothing stops you swinging the mace while gliding. |
| **Mending** | `/mend`, or throw a Splash Aura XP Potion at your off-hand — both spend Aura XP Potions, since Bloxd has no XP/level stat to spend instead. |
| **Bulwark shield** | Park it in the off-hand slot **and crouch** — that is the only way it ever blocks, 60% of incoming player damage. Axes and maces disable it on a blocked hit, like Minecraft. |
| **Off-hand slot** | Slot 44 carries a second item, outside the hotbar: drag it in, `/offhand`, or the touchscreen button. Shown as a status icon. |
| **Reforge** | `/reforge` swaps the custom attributes between your held item and your off-hand item. |
| **Durability** | Bloxd has none natively. Every tool, weapon, bow, armour piece and glider gets one, shown as a wear bar in the tooltip and a second live chip in the HUD for whatever you're holding. |
| **Nether, End & Void** | Three extra regions with their own fog, light, gravity and portals — **real generated terrain**, and **ores** worth going for. |
| **Village & Villagers** | A ring of real houses around spawn, one real `NPC` mob per house — right-click one to trade. |
| **Ocean** | A ring of water near spawn, stocked with a custom sea mob (Bloxd ships none). |
| **Bed spawn** | Stand on any bed to set your respawn point there. |
| **Crafting** | Almost everything above has a real recipe. |
| **Crystal PvP** | Place a Crystal, hit it, everything nearby is damaged and launched. |
| **Cart PvP** | Catch someone while they are in a boat and they take extra damage and get ejected. |
| **`!anon`** | Hides your body, your nametag and your name in chat. |
| **Death announcements** | One clean message and a server-wide toll for every death — no double kill messages. |
| **Whisper** | `/whisper <player> <message>` (or `/w`) sends a private line only the two of you see. |

## Install

1. **World Settings → Code → World Code**.
2. Paste the whole of `smp.js`.
3. Save. Everything is driven by the `CONFIG` object at the top of the file.

## Crafting

Recipes are registered per player on join, so they show up in the normal crafting menu.

| Item | Recipe |
| --- | --- |
| **Moonstone Mace** | **400 Moonstone + 4 Knight Heart + 2 Stick** |
| **Wood / Stone / Iron / Gold / Diamond Mace** | 80 Maple Wood Planks + 20 Stick / 120 Stone + 20 Stick / 150 Iron Bar + 20 Stick / 180 Gold Bar + 20 Stick / 200 Diamond + 20 Stick |
| **Moonstone Spear** | 4 Moonstone + 2 Stick |
| **Moonstone Dagger** | 5 Rotten Flesh + 90 Moonstone + 4 Stick |
| **Wood / Stone / Iron / Gold / Diamond Dagger** | 40 Maple Wood Planks + 10 Stick / 60 Stone + 10 Stick / 75 Iron Bar + 10 Stick / 90 Gold Bar + 10 Stick / 100 Diamond + 10 Stick |
| **Wind Charge** ×4 | 1 Mango + 1 Iron Fragment |
| **Bulwark shield** | 6 Maple Wood Planks + 1 Iron Bar |
| **Golden Apple** | 1 Apple + 8 Gold Bar |
| **Enchanted Golden Apple** | 1 Apple + 8 Moonstone |
| **Purple Portal** ×2 (Nether) | 8 Obsidian + 1 Magma |
| **Black Portal** ×2 (The End) | 8 Obsidian + 1 Moonstone |
| **Wood / Iron / Gold / Diamond Hang Glider** | **100 Moonstone + 30 Diamond** (same cost for all four) |
| **Heart** | 4 Block of Diamond + 2 Knight Heart + 4 Lunite |
| **"what the skibidi bop un dada really bought this ok"** (Diorite) | 39000 Block of Moonstone — a joke/vanity flex, no gameplay effect |

Kills and `/withdraw` are still the cheap way to a Heart — the crafting recipe is a deliberately
steep third option, not a replacement for either.

## Hearts

A death drops a **Heart** (item name `Aura XP Orb` under the hood — Bloxd has no dedicated heart
item). Right-click one to eat it: **1 Heart = 1 heart, always, with no lifetime cap.** That's the
whole trade a lifesteal SMP runs on — win a fight, eat the proof, get stronger. `/withdraw 2` turns
your own hearts back into Hearts to give or trade away.

The old lifetime cap (`orb.usesPerPlayer`) is still in the code and still tested — set it back to
`1` (or any number) if you ever want to reintroduce a limit — but the shipped default is `0`,
unlimited.

## The mace

The mace is the real `Moonstone Mace` item, and it is meant to be an endgame grind: 400 Moonstone,
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

The tooltip shows a 12-segment wear bar rather than a bare number:

```
Moonstone Mace
Wind Burst 3 - smash launches you skyward.
Density 3 - the further you fall, the harder it hits.
▰▰▰▰▰▰▰▰▱▱▱▱  2100 / 2640  (80%)
```

Wear is spent on **hits and blocks broken**, so it applies to what you are holding. Armour gets a
durability value and shows it in the tooltip, but does not tick down when you take a hit — Bloxd's
API does not expose the armour slots, so there is nothing to hook. Gliders get one too, but wear on
mount instead (`onPlayerEnteredVehicle`, `durability.gliderWearPerFlight` per flight) — there is no
per-tick "still gliding" event to hook, so a flat cost per launch is the closest real proxy.

### HUD durability chip

A second, always-visible readout — separate from the tooltip bar — shows up in the top-left HUD
strip (`headerChips`) for whatever you are currently **holding**:

```
🔧 Iron Sword ▰▰▰▰▰▰▱▱
```

It updates every tick as the item wears, shares the HUD strip with the shield chip when both apply
(a shield in hand shows its own guard state *and* its own durability, as two separate chips), and
disappears the moment you switch to something non-durable. Turn it off with
`durability.hudBar.enabled: false`, or change its segment count/icon.

**This cannot show worn armour** (helmet, chestplate, leggings, boots, gauntlets) — Bloxd's API has
no way to read what is in the armour slots at all, the same limit that keeps armour durability from
ticking down on a hit. Only the held item is visible to the script, so only the held item can be
shown here.

## Nether, End & Void

**Bloxd has one world — there is no dimension API.** So these are built the only way the engine
allows: each "dimension" is a far-apart region of the same world, dressed with its own fog, ambient
light, sky light and gravity through per-player client options.

| | Y origin | Portal | Feel |
| --- | --- | --- | --- |
| Overworld | ordinary height | — | normal |
| The Nether | `y = -10000` | Purple Portal | red fog (`#6b1105`), 5-chunk view |
| The End | `y = -30000` | Black Portal | violet fog (`#2e0f52`), 8-chunk view, 0.7× gravity |
| The Void | `y = -50000` | none | near-black fog (`#020204`), 3-chunk view, 0.5× gravity |

**Stacked by Y, at x=0,z=0 for all three.** This exact layout (`y = -10000` / `-30000` / `-50000`)
has failed twice before in real in-game testing — arrivals landing back in the Overworld instead of
the target dimension, and no terrain generating — most likely Bloxd's own buildable range rejecting
positions this deep. It's being run at the same depth again anyway. **If it fails the same way a
third time, the fix is a shallower Y (a few hundred to a few thousand, not tens of thousands), not
retrying these exact numbers again.**

`dimensions.regionHalfHeight` (**3000**) is how far from that Y origin still counts as "inside" the
dimension; with 20000 blocks between each origin, that clears whatever generation actually builds
without reaching into a neighbour's band or back into ordinary Overworld height.

Craft a portal block, place it, **stand on it**. Standing on the same block inside that dimension
brings you home — the game remembers the Overworld position you left from (`state.overworldPos`)
so a round trip lands you back exactly where you started, not at a fixed fallback. `/where` tells
you which dimension you are in; admins get `/dim <name>`.

Crossing a dimension's region boundary by falling, flying, or being moved also re-dresses the
world, so respawns and teleports are handled without a portal.

### Fog

Bloxd exposes exactly two fog controls, and every dimension sets **both** — a colour alone would
land with the player's own draw distance and be invisible:

| | `fogColourOverride` | `fogChunkDistanceOverride` |
| --- | --- | --- |
| The Nether | `#6b1105` (thick red haze) | 5 chunks |
| The End | `#2e0f52` (deep violet) | 8 chunks |
| The Void | `#020204` (near black, deliberately darker than the other two) | 3 chunks |
| Overworld | — reset to the player's own setting | — |

Lower the chunk distance for thicker fog. Anything a dimension does not set is put back to default
on arrival, so leaving one never bleeds its look into the next — tests cover the push and the
reset.

### Terrain

All three regions **generate as you explore them**. Chunks fill in around every player, spread over
ticks (`columnsPerTick`) so a big reveal never stalls the server.

- **Nether** — a closed cavern of **Dark Red Stone**, top to bottom, so it reads as one solid
  netherrack mass: bedrock floor, rolling ground with magma blotches, a lava sea in the dips, and a
  Dark Red Brick ceiling overhead. **Ores** run through the rock below the surface:
  Coal, Iron and Gold in quantity, plus thin seams of **Moonstone** (below y34) and **Lunite**
  (below y28). The mace costs 400 Moonstone and the Nether yields roughly 4 per chunk, so arming
  yourself is a genuine grind.
- **The End** — floating islands of **Yellowstone** over open void, tapering at their edges, with
  occasional obsidian spires. Yellowstone is the closest thing Bloxd has to end stone: pale,
  moonlit, and uniform all the way through, so an island looks carved from one piece. A guaranteed island sits at the region centre (`centreIslandRadius`) so arriving players
  always have ground under them. Its rock is **richer per block** than the Nether's — Iron,
  Emerald, Moonstone, Diamond and Lunite — because most End columns are open void, so there is
  far less stone to dig through.
- **The Void** — a closed cavern like the Nether's rather than floating islands: bedrock floor,
  rolling ground, a Black Concrete ceiling overhead, all in **Black Concrete** with **Brown
  Concrete** patches instead of the Nether's red stone and magma — dark and dead rather than
  hostile-looking. No lava sea. Scattered through it are small ruined **towers and houses** built
  from Stone Bricks and Mossy Stone Bricks, each one guarded by 3 hostile mobs — see **The Void,
  and the way out** below for how those actually pay out an escape.

Terrain is **deterministic value noise**, not `Math.random`: the same column always produces the same
blocks, so chunk edges line up and nothing shifts between visits. A generated chunk is marked with one
block at `markerY` and **never rebuilt**, so anything players construct there is safe.

Set `dimensions.enabled: false` to turn the whole system off.

## Crystal PvP

Craft a **Crystal** (4 Obsidian + 2 Moonstone), place it, and break it. Everything within 6 blocks
takes up to 45 damage and gets launched, both falling off linearly with distance — point blank is
lethal, the rim is survivable. Your own crystal does half damage to you (`selfDamageFraction`), and
the kill is credited to whoever set it off. Crystals do **not** crater the terrain unless you set
`crystal.breakBlocks: true`.

## Cart PvP

**Bloxd has no minecarts or rails**, so this rides on the vehicle it does have: boats. Hit a player
while they are in one and the blow does `cart.bonusDamage` extra and ejects them out of it. The bonus
stacks with the mace smash and the spear lunge.

## Whisper

`/whisper <player> <message>` (or the shorter `/w`) sends a private line straight to one other
player — both of you see it, nobody else does. It goes through the same `tell()`/`sendMessage` call
every other private notice in this script uses (durability warnings, trade results, and so on),
never `broadcastMessage`, so there is no path for it to leak into public chat. The target gets a
quiet confirmation sound so a whisper doesn't go unnoticed among everything else on screen.

Anonymity applies here too, the same as it does to chat and the killfeed: whisper while `!anon` is
on and the other player sees "Anonymous", not your real name. Whispering to yourself, to nobody
(an unrecognised name), or with no message attached all fail with a plain usage message rather than
silently doing nothing. Set `whisper.enabled: false` to turn the command off entirely.

## Anonymous mode

Type **`!anon`** in chat (or `/anon`). Your floating nametag is replaced with "Anonymous" for
everyone, including players who join later, your chat messages are re-sent with your name
stripped off, and your body turns fully invisible via the engine's own `Invisible` effect — a
nametag swap alone still leaves a recognisable skin walking around. Type it again to reveal
yourself. The setting is saved per player, so it survives a relog. Set `anonymous.invisible: false`
if you would rather keep just the name-hiding.

Going invisible also means nothing is drawn *on* you: if you are carrying a shield, the shield mesh
on your arm is hidden along with the rest of you (your own HUD chip still tells you whether you're
blocking — that's on your screen only). The moment you reveal yourself, the shield reappears.

**The killfeed leak is handled.** The engine's killfeed prints real names and offers no way to
rewrite them — so while *anyone* is anonymous it is switched off for everybody
(`showKillfeed: false`) and kills are announced in chat instead, where the name is ours to choose.
The moment nobody is anonymous, the normal killfeed comes back. Set `anonymous.hideKillfeed: false`
if you would rather keep the killfeed and accept the leak.

## The Void, and the way out

Running out of hearts no longer ends your run — it **exiles you**. You are dropped into a fourth
region, the Void: near-black fog, three-chunk view distance, half gravity, and dark, cracked
platforms scattered with abandoned ruins. You keep 3 hearts so you can move, and dying there costs
nothing.

**Orbs of Resurrection no longer come from mining.** Each ruin (a tower or a house, picked at
random) is guarded by 3 hostile mobs (`Draugr Skeleton` by default) — kill them and each one drops
a Green Portal block, tagged as an Orb of Resurrection. Mine nothing; the guardians are the only
source. Collect **3** and the Void spits you back into the overworld with 5 hearts. `/orbs` shows
your count. There is still no portal out — killing guardians is the only exit.

```js
ban: {
    mode: "void",       // or "kick" for the old permanent ban
    voidHearts: 30,     // 3 hearts while stranded
},
resurrection: {
    item: "Green Portal",
    required: 3,
    heartsOnReturn: 50, // 5 hearts
},
dimensions.generation["void"].structures: {
    chance: 0.05,               // rolled once per generated chunk
    guardiansPerStructure: 3,
    guardianMob: "Draugr Skeleton",
    crystalChance: 0.5,         // a finished structure's chance to also hold a Crystal
},
```

A finished ruin has a `crystalChance` of also holding a **Crystal** block, so the void guardians'
fights can turn into Crystal PvP fights too.

Set `ban.mode: "kick"` to go back to permanent bans (`/bans` and `/unban` still work in that mode).

## Wind Charge

A standalone item — not the mace's own mid-air ability, a separate thing anyone can carry. Bloxd has
no Wind Charge item, so this is a tagged **Iron Fragment**.

- Craft it from **1 Mango + 1 Iron Fragment**, four charges per craft.
- Right-click to launch yourself up and slightly forward. Consumed on use, own 2s cooldown.
- Doesn't touch the mace's own wind-charge-in-midair ability — both work independently, and
  hitting one's cooldown never affects the other.

## Mending

Bloxd exposes **no XP/level stat to World Code at all** — there is nothing to read or spend. So
"spending XP" here means spending **Aura XP Potions**, a real, already-stackable item, instead of a
number the API can't touch. This replaces the old Repair Kit item outright.

- Hold the damaged item you want fixed and run **`/mend`**: it spends `mending.costPerMend` (1 by
  default) Aura XP Potions and restores `mending.restoreFraction` (35% by default) of that item's
  max durability, capped at full.
- Or **throw a Splash Aura XP Potion** — since you're necessarily holding the potion itself at that
  moment, this mends whatever is sitting in your **off-hand** slot instead of your main hand.
- Works on **anything** `durabilityForName` recognises — every tool, weapon, bow, armour piece and
  glider in the game, not only this mod's own gear — and keeps a mace or spear's special tooltip
  (Wind Burst, lunge bonus) in sync rather than falling back to a bare number, via the same
  `withDurability` helper that ordinary wear uses.

## Off-hand

Bloxd has **no off-hand slot**. Every inventory cell — slot 0, the top-left one, included — is
plain numbered storage the engine treats identically; there is no equip slot anywhere in the API.
So one slot is reserved *by convention*: a rule this script enforces by re-reading it every tick.
Whatever sits there is "off-handed".

**It lives outside the hotbar.** Bloxd's hotbar is indexes 0-9; the off-hand is index **44** —
well inside the backpack grid, past anything the hotbar or a normal loadout would ever touch by
accident. It costs you no weapon slot.

**Filling it is always deliberate** — never a side effect of a click, so right-click keeps meaning
"use this item" and a held shield blocks with it instead of vanishing out of your hand:

- **Drag the item into that backpack slot** in the inventory screen.
- **`/offhand`** swaps whatever you're holding into it, and hands back whatever was there. Run it
  with an empty hand to take the off-hand item back out.
- **The on-screen action button** (labelled `🛡 Off-hand`) does the same swap for touchscreen
  players, via Bloxd's own `touchscreenActionButton` option and `onTouchscreenActionButton`.

If you'd rather right-click do the swapping, set `offhand.swapOnRightClick` back to `true`.
- The sync reads the slot itself every tick, so any of the three routes above end up in the same
  state — nothing depends on catching the swap as it happens.
- Whatever is off-handed shows as a **status effect icon** using the item's own icon
  (`applyEffect` with a custom `icon`), so you can see what you're carrying there.
- The item genuinely **stays in your inventory**, so a rejoin or a server restart can't lose it —
  it's a two-slot swap, not an item held in a variable, and there's no "inventory full" failure.

## Shield (Bulwark)

Bloxd has no dedicated shield item either, so this builds one from real primitives on top of the
off-hand above — deliberately narrow now:

- Craft a **Bulwark** from **6 Maple Wood Planks + 1 Iron Bar**.
- **It only guards when BOTH of these are true at once:**
  1. it is sitting in your **off-hand slot** (44), and
  2. you are **crouching** (`api.isPlayerCrouching`).

  Let go of either — stand up, or take it out of the off-hand — and the guard drops immediately.
  There is **no hand-raised mode any more**: a shield in your main hand does nothing at all, right
  click included. `/shield` is now an info command that tells you your current state, not a way to
  raise one by hand.
- While guarding it tops up your numeric shield (Bloxd's own `setShieldAmount`/`getShieldAmount`
  resource — the same one Golden Apples feed) **every tick**, not just the moment you seat it, so a
  shield that ran dry mid-fight recharges on its own the next tick you're still crouched with it
  out — it blocks `shield.blockFraction` (60% by default) of incoming **player** damage and drains
  your shield instead of your health for the part it absorbed.
- **For PvP that means shield + sword at once:** put the Bulwark in your off-hand, hold your sword,
  and crouch when you want the guard up — you swing with the sword while the shield soaks 60% of
  what hits you. You never have to choose between carrying a weapon and carrying a guard, only
  between attacking and blocking at any given moment (you can't swing effectively while crouched
  and blocking anyway, which is the intended trade-off).
- **The off-hand arm** is a real mesh — a small plate — attached to your other arm
  (`updateEntityNodeMeshAttachment` on `ArmLeftMesh`) for as long as a shield sits in the off-hand,
  whether you're currently crouching or not; it just sits lower and duller when you're not.
- **The status shows in the literal top-left corner** of your screen, via Bloxd's own `headerChips`
  client option — the HUD strip that already carries your FPS counter and coordinates.
- **The instant a hit actually lands on a raised guard**, everyone nearby (not just the defender)
  sees a `shieldOuter` particle burst over the defender and hears a `hit2` clack — the arm mesh and
  the HUD chip are the idle "guard is up" look, this is the one-shot "a hit just got blocked" feedback.
  The defender also gets a quick "Blocked!" crosshair flash. Nothing plays if the guard soaks nothing
  (empty shield resource, not crouching, not in the off-hand, etc.) — only on a real absorption.

**Scope, stated plainly:** blocking covers player-vs-player hits (the path this script controls).
It does **not** reduce damage from real Bloxd mobs (`onMobDamagingPlayer` isn't hooked) or crystal
blasts (explosions bypass it, as in most games).

### Axes and maces disable the shield

The same trade Minecraft's axe has against a shield: land a hit with an **axe** (any material) or
**any mace** (the Moonstone one or a plain tier) on a guard that's actively blocking, and it
doesn't just get absorbed — the guard is **disabled outright** for `shield.disableDurationMs`
(4s by default). The numeric shield resource is zeroed too, so there's nothing left even if the
defender lets go of crouch and grabs the shield again immediately; they get a "Shield disabled!"
crosshair message. It comes back on its own once the window passes — no need to re-seat it.
Every other weapon (swords, spears, daggers, bows) just gets absorbed as normal. Tune which
weapon kinds trigger it in `shield.disableKinds` (matched the same way durability kinds are, by
the item's last word — `"Axe"` or `"Mace"` by default).

**Why a plain `Brown Paintball`:** the first attempt used `Brown Paintball Explosive Item`, and the
shield simply did not work — that item is one of Bloxd's **native throwables**, so the engine's own
throw behaviour fired on click instead of this script's. The plain paintball has no built-in click
behaviour to fight with.

## Reforge

**`/reforge`** — hold one item and carry another in your off-hand slot, and it swaps the two items'
`customAttributes` (durability, poison tag, everything a `customAttributes` object can carry)
between them. Base item names never change, only what each one carries — so you could, for
example, move a mace's Wind Burst/Density tag onto a fresh copy while leaving the old one a plain
weapon. There is no crafting cost; it's a straight swap.

## Village & Villagers

Bloxd has **no Villager mob** and no documented item-barter trade UI, so this uses the real `NPC`
mob type (it ships with named human skins: `emma`, `leo`, `isabel`, `sanjay`, `imara`, `enoch`,
`sara`, `carmen`) and does the trade itself through the same inventory calls crafting uses — not
the native shop system, whose `currency` field is undocumented and not worth guessing at.

Villagers no longer just stand around in open terrain — `npc.village` (on by default) builds a real
cluster of buildings around `npc.spawnCentre` the first time a player joins:

- A small **paved plaza** (`village.plazaBlock`, `village.plazaRadius`) at the very centre.
- `village.houseCount` (6) **houses** in a ring `village.ringRadius` (18) blocks out — each a hollow
  stone-brick-floored, wood-plank-walled box (`village.footprint`/`village.wallHeight`) with a flat
  brick roof, a glass window centred on every side, and a doorway punched through whichever wall
  faces the plaza, so every house opens inward.
- A **dirt path** (`village.pathBlock`) straight from the plaza to each house's doorstep.
- One villager stands just outside each house's own doorway, on the plaza side.

Bloxd's World Code doesn't generate the Overworld (unlike the Nether/End/Void, which this script
*does* build — see below), so there's no way to know the real terrain height at spawn ahead of
time. Every footprint's ground is found by scanning straight down for the first solid block
(`findGroundY`), falling back to `spawnCentre`'s own Y if the chunk isn't loaded yet or nothing
solid turns up. Set
`village.enabled: false` to fall back to the old behaviour — `npc.countInOverworld` villagers
scattered loosely around `npc.spawnRadius` with no buildings at all.

Each villager is assigned exactly one fixed trade from `npc.trades` (cycling through the list), the
way a Minecraft villager offers one trade rather than your whole wishlist. **Right click** a
villager to trade — it fails cleanly with a chat message if you don't have enough of what it wants.

## Ocean

Bloxd ships **no sea-creature mob type at all**, so `ocean.seaMob` is the same trick as the shield
and Wind Charge: an existing mob (`Slime` by default), renamed and re-skinned to read as something
else — an "Abyssal Crawler". A ring of sand and water generates once near world spawn
(`ocean.ringRadius`/`ocean.ringWidth`/`ocean.waterLevel`), stocked with `ocean.seaMob.countPerRing`
of them.

## Bed spawn points

Standing on any bed (any colour, `Bed` or `Strongbed`, head half included) sets your respawn point
there — Bloxd has no `onPlayerSleep` callback to hook, so standing on it is the closest real
trigger to "sleeping in it". No bed set yet, and you come back at `dimensions.overworldFallbackPos`
in the Overworld instead.

## Deaths — one message, one sound, every time

Bloxd's native killfeed panel prints an automatic entry for every kill with **no way to relabel or
suppress just that entry**. Leaving it on next to a custom message is exactly what caused a kill to
show twice. The fix: the panel is switched off for everyone from the moment they join, permanently —
not just while someone is anonymous — and this script's own message is the only one anyone ever sees.

Every death, anywhere in the world, produces **exactly one broadcast and exactly one toll**, from a
single call site:

```
☠ Alice slew Bob with Moonstone Mace.
☠ Bob ran out of hearts — exiled to the Void.
☠ Otto died.
```

- **A kill names the weapon** — the last item the killer was holding when they landed a hit is
  remembered for this, since the game doesn't tell world code what killed someone.
- **An elimination merges into the same line** rather than sending a second message — you get the
  kill and the outcome together, once.
- **Even a free fall/lava death gets its one message and its toll** — it just says "died." with no
  killer, since those don't cost hearts by default.
- **Dying again while already exiled in the Void raises nothing** — you can't really die twice.
- **Anonymity still swaps the name** inside that one message, same as before.

The toll (`deathSound`) uses `maxHearDist: 1000000` — far past any real distance in the world,
including the 50000-block dimension offsets — so it is heard by every player, anywhere, every time.
Set `killFeed.enabled: false` or `deathSound.enabled: false` to turn either half off independently.

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
| `!anon` / `/anon` | everyone | Toggle anonymous mode |
| `/orbs` | everyone | Orbs of Resurrection collected, while in the Void |
| `/whisper <player> <message>` / `/w` | everyone | Send a private message only that player sees |
| `/mend` | everyone | Mend whatever you're holding, spending Aura XP Potions |
| `/offhand` | everyone | Swap what you're holding into the off-hand slot (works on the shield too) |
| `/shield` | everyone | Shows your current shield state (off-hand + crouch is the only way it ever blocks) |
| `/reforge` | everyone | Swap attributes between your held item and your off-hand item |
| `/give mace\|spear\|dagger\|windcharge\|shield\|gapple\|egapple\|heart\|netherportal\|endportal` | admins | Spawn any custom item |
| `/dim overworld\|nether\|end\|void` | admins | Travel between dimensions |
| `/bans`, `/unban <name>` | admins | List and lift bans |
| `/sethp <player> <hp>` | admins | Set someone's max HP |

Admins are matched by in-game name — fill in `CONFIG.commands.adminNames`, which starts empty.
**`/unban` needs at least one admin name in there**, so set it before anyone gets eliminated.

## Known limitations

Things the Bloxd API genuinely does not expose, worked around rather than faked:

- **No XP/level stat.** Mending spends a real item (Aura XP Potion) instead.
- **No Villager mob, no documented trade-UI currency.** Villagers are the real `NPC` mob type,
  traded through plain inventory calls rather than the native shop.
- **No sea-creature mob type.** The ocean's sea mob is an existing mob (`Slime` by default),
  renamed and re-skinned.
- **No way to read the armour slots.** Armour gets a durability number from the same
  materials/kinds formula as everything else, and can be mended if you pull it into your hand, but
  it never wears down automatically from a hit while worn — there's nothing to hook.
- **No armour-enchant API.** Native armour enchants (Health, Health Regen, etc., if a player finds
  or buys them outside this script) are outside anything World Code can see or strip.

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

350+ assertions covering hearts, the one-orb-per-player cap, dimension detection, X/Z region
geometry and round trips, portals and their cooldown, terrain generation (determinism, the
nether's floor, lava and ceiling, end islands and void, chunks never rebuilt, the overworld left
alone), crystal blast falloff and kill credit, the boat bonus, exile to the Void and the
resurrection price, Void platform generation, the durability bar, anonymity in chat, on nametags
and in the killfeed, the Wind Charge item's own cooldown and consumption, that it never interferes
with the mace's own charge, that /mend restores durability without overshooting and keeps a mace's
bespoke tooltip in sync (and that a splash potion mends the off-hand instead of the held item), the
shield's block fraction and shield-drain, its off-arm mesh and HUD chip appearing and clearing, a
shield only guarding with the off-hand + crouch combination and never from a held item, the shield
resource recharging every guarding tick rather than only once, that every death sends exactly one
message and one toll however it happened, both apples (heal, shield, regen, fire resistance),
smash damage against players and mobs, Density and Wind Burst, the spear lunge, the dagger's poison
and wear, the five plain mace tiers craftable with no smash tag, reforge swapping attributes both
ways, glider durability and its per-flight wear, villager spawning and trading, ocean sea mob
spawning, bed spawn points and the respawn fallback, durability derivation and breakage, crafting
registration and costs, elimination and unban, and every command.
