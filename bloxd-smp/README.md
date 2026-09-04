# Unstable-style SMP — Bloxd.io World Code

`smp.js` is a single self-contained World Code script for [Bloxd.io](https://bloxd.io).

| Feature | What it does |
| --- | --- |
| **Hearts** | A player kill costs the victim a heart and drops it as a **Heart** (an Aura XP Orb). Right-click to eat it — **1 Heart = 1 heart, no limit**. |
| **Exile to the Void at 0 hearts** | Lose your last heart and you are stranded in a fourth dimension until you mine 3 Orbs of Resurrection. |
| **Moonstone Mace** | Hit from the air to smash — works on **players and mobs** — with Wind Burst and Density. Expensive to craft. |
| **Moonstone Spear** | Right-click to lunge forward; hits during the lunge deal bonus damage. |
| **Golden Apples** | Two tiers. Heal, shield, Health Regen and fire resistance; the enchanted one permanently adds a heart. |
| **Wind Charge** | A standalone launch item, craftable from Mango + Iron Fragment. Anyone can carry a stack, not just the mace. |
| **Repair Kit** | Craftable. `/repair` restores half of whatever you're holding's max durability. |
| **Bulwark shield** | Hold it and right-click to raise your guard. Or park it in the off-hand slot and it blocks 60% by itself, hand free for a sword. |
| **Off-hand slot** | A backpack slot (outside the hotbar) carries a second item: drag it in, `/offhand`, or the touchscreen button. Shown as a status icon. |
| **Durability** | Bloxd has none natively. Every tool, weapon, bow and armour piece gets one, shown as a wear bar in the tooltip. |
| **Crafting** | The mace, the spear, both apples and both portals all have real recipes. |
| **Nether & End** | Two extra dimensions with their own fog, light, gravity and portals — **real generated terrain**, and **ores** worth going for. |
| **Crystal PvP** | Place a Crystal, hit it, everything nearby is damaged and launched. |
| **Cart PvP** | Catch someone while they are in a boat and they take extra damage and get ejected. |
| **`!anon`** | Hides your body, your nametag and your name in chat. |
| **Death announcements** | One clean message and a server-wide toll for every death — no double kill messages. |

## Install

1. **World Settings → Code → World Code**.
2. Paste the whole of `smp.js`.
3. Save. Everything is driven by the `CONFIG` object at the top of the file.

## Crafting

Recipes are registered per player on join, so they show up in the normal crafting menu.

| Item | Recipe |
| --- | --- |
| **Moonstone Mace** | **400 Moonstone + 4 Knight Heart + 2 Stick** |
| **Moonstone Spear** | 4 Moonstone + 2 Stick |
| **Wind Charge** ×4 | 1 Mango + 1 Iron Fragment |
| **Repair Kit** ×2 | 4 Iron Fragment + 2 Stick |
| **Bulwark shield** | 6 Maple Wood Planks + 1 Iron Bar |
| **Golden Apple** | 1 Apple + 8 Gold Bar |
| **Enchanted Golden Apple** | 1 Apple + 8 Moonstone |
| **Purple Portal** ×2 (Nether) | 8 Obsidian + 1 Magma |
| **Black Portal** ×2 (The End) | 8 Obsidian + 1 Moonstone |
| **Wood / Iron / Gold / Diamond Hang Glider** | **100 Moonstone + 30 Diamond** (same cost for all four) |

Life Orbs are not craftable on purpose — they only come from deaths and `/withdraw`.

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
API does not expose the armour slots, so there is nothing to hook.

## Nether and the End

**Bloxd has one world — there is no dimension API.** So these are built the only way the engine
allows: each "dimension" is a far-apart region of the same world, dressed with its own fog, ambient
light, sky light and gravity through per-player client options.

| | Y (height) | Portal | Feel |
| --- | --- | --- | --- |
| Overworld | wherever you normally build | — | normal |
| The Nether | `y = -10000` | Purple Portal | red fog (`#6b1105`), 5-chunk view |
| The End | `y = -30000` | Black Portal | violet fog (`#2e0f52`), 8-chunk view, 0.7× gravity |
| The Void | `y = -50000` | none | near-black fog (`#050508`), 3-chunk view, 0.5× gravity |

**This is a Y-based layout, not the more usual X/Z one.** Each dimension is stacked directly below
the Overworld at a wildly different height rather than spread out sideways — a portal is a vertical
drop, and your x/z position carries straight across unchanged. `dimensions.verticalHalfSize`
(**500**) is how far above/below that Y still counts as "inside" the dimension; with 20000+ blocks
between each one, that only has to clear whatever generation actually builds, not fight a
neighbour. **This depends on Bloxd's vertical build range reaching that far down** — confirmed to
y=-100000 by testing, so all three sit safely inside it, but if a future world's limit is smaller,
lower every `groundY` (and `verticalHalfSize` if needed) to fit.

Craft a portal block, place it, **stand on it**. Standing on the same block inside that dimension
brings you home — the game remembers the Overworld height you left from (`state.overworldY`) so a
round trip lands you back roughly where you started, not at a fixed fallback. `/where` tells you
which dimension you are in; admins get `/dim <name>`.

Crossing a dimension's Y-band by falling, flying, or being moved also re-dresses the world, so
respawns and teleports are handled without a portal.

### Fog

Bloxd exposes exactly two fog controls, and every dimension sets **both** — a colour alone would
land with the player's own draw distance and be invisible:

| | `fogColourOverride` | `fogChunkDistanceOverride` |
| --- | --- | --- |
| The Nether | `#6b1105` (thick red haze) | 5 chunks |
| The End | `#2e0f52` (deep violet) | 8 chunks |
| The Void | `#050508` (near black) | 3 chunks |
| Overworld | — reset to the player's own setting | — |

Lower the chunk distance for thicker fog. Anything a dimension does not set is put back to default
on arrival, so leaving one never bleeds its look into the next — tests cover the push and the
reset.

### Terrain

Both regions **generate as you explore them**. Chunks fill in around every player in a Nether or End
region, spread over ticks (`columnsPerTick`) so a big reveal never stalls the server.

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
- **The Void** — far sparser black platforms in the dark, some carrying an Orb of Resurrection.

Terrain is **deterministic value noise**, not `Math.random`: the same column always produces the same
blocks, so chunk edges line up and nothing shifts between visits. A generated chunk is marked with one
block at `markerY` and **never rebuilt**, so anything players construct there is safe.

**Before you use this, confirm in-game that terrain actually generates this far down** — if it
does not, Bloxd's real vertical range is smaller than assumed here; bring every `groundY` closer to
0 until it works, keeping them well over `2 × verticalHalfSize` apart from each other. Set
`dimensions.enabled: false` to turn the whole system off.

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
region, the Void: near-black fog, three-chunk view distance, half gravity, and sparse black platforms
in the dark. You keep 3 hearts so you can move, and dying there costs nothing.

Scattered on those platforms are **Orbs of Resurrection** — green portal blocks. Mine **3** of them
and the Void spits you back into the overworld with 5 hearts. `/orbs` shows your count. There is no
portal out; the orbs are the only exit.

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
```

Set `ban.mode: "kick"` to go back to permanent bans (`/bans` and `/unban` still work in that mode).

## Wind Charge

A standalone item — not the mace's own mid-air ability, a separate thing anyone can carry. Bloxd has
no Wind Charge item, so this is a tagged **Iron Fragment**.

- Craft it from **1 Mango + 1 Iron Fragment**, four charges per craft.
- Right-click to launch yourself up and slightly forward. Consumed on use, own 2s cooldown.
- Doesn't touch the mace's own wind-charge-in-midair ability — both work independently, and
  hitting one's cooldown never affects the other.

## Repair Kit

Craft one from **4 Iron Fragment + 2 Stick** (a tagged **Yellow Portal** under the hood — a block
with no other use in this mod, so counting how many a player holds is never ambiguous, the same
trick the resurrection orbs use). Hold the damaged item you want fixed and run **`/repair`**: one
kit restores `repair.restoreFraction` (50% by default) of that item's max durability, capped at
full. Works on **anything** `durabilityForName` recognises — every tool, weapon, bow and armour
piece in the game, not only this mod's own gear — and keeps a mace or spear's special tooltip
(Wind Burst, lunge bonus) in sync rather than falling back to a bare number, via the same
`withDurability` helper that ordinary wear uses.

## Off-hand

Bloxd has **no off-hand slot**. Every inventory cell — slot 0, the top-left one, included — is
plain numbered storage the engine treats identically; there is no equip slot anywhere in the API.
So one slot is reserved *by convention*: a rule this script enforces by re-reading it every tick.
Whatever sits there is "off-handed".

**It lives outside the hotbar.** Bloxd's hotbar is indexes 0-9, so the off-hand is index **10** —
the first cell of your backpack, top-left of the inventory grid. It costs you no weapon slot.

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
off-hand above:

- Craft a **Bulwark** from **6 Maple Wood Planks + 1 Iron Bar**.
- **Two ways to use it:**
  - **Hold it and right-click** → your guard goes up. Right-click again to drop it. This is the
    timed, active way to block, and the shield never leaves your hand. (`/shield` does the same.)
  - **Or put it in the off-hand slot** (`offhand.slotIndex`, top-left of the
    inventory grid) and it protects you automatically, every tick, with your main hand free for a
    weapon — no clicking needed. This is a rule this script enforces on an ordinary slot, not a
    native engine feature, so it only works because the script checks that exact slot on every
    tick; putting the Bulwark in any other slot does nothing special.
  - Either way, while active it tops up your numeric shield (Bloxd's own
    `setShieldAmount`/`getShieldAmount` resource — the same one Golden Apples feed), blocks
    `shield.blockFraction` (60% by default) of incoming **player** damage, and drains your
    shield instead of your health for the part it absorbed. The off-hand slot is checked first, so
    if both are somehow active the passive one takes priority.
- **For PvP that means shield + sword at once:** put the Bulwark in your off-hand, hold your sword, and you
  swing with the sword while the shield keeps soaking 60% of what hits you. You never have to choose
  between carrying a weapon and carrying a guard.
- **The "off-hand" arm** is a real mesh — a small plate — attached to your other arm
  (`updateEntityNodeMeshAttachment` on `ArmLeftMesh`) for as long as either mechanism is active.
  That's the closest thing to a visual off-hand the engine actually supports.
- **The status shows in the literal top-left corner** of your screen, via Bloxd's own `headerChips`
  client option — the HUD strip that already carries your FPS counter and coordinates.
- Running out of shield **breaks the hand-raised guard** (auto-lowers it) rather than blocking for
  free once it hits zero — the off-hand one simply stops absorbing until the numeric shield refills.
  Switching away from a hand-raised shield, or dying, also auto-lowers it — checked once a tick,
  same tick that syncs the off-hand slot.

**Scope, stated plainly:** blocking covers player-vs-player hits (the path this script controls).
It does **not** reduce damage from real Bloxd mobs (`onMobDamagingPlayer` isn't hooked) or crystal
blasts (explosions bypass it, as in most games).

**Why a plain `Brown Paintball`:** the first attempt used `Brown Paintball Explosive Item`, and the
shield simply did not work — that item is one of Bloxd's **native throwables**, so the engine's own
throw behaviour fired on click instead of this script's. The plain paintball has no built-in click
behaviour to fight with, so right-click reaches the off-hand swap as intended.

## Deaths## Deaths — one message, one sound, every time

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
including the 30000-block dimension offsets — so it is heard by every player, anywhere, every time.
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
| `/repair` | everyone | Repair whatever you're holding using a Repair Kit |
| `/offhand` | everyone | Swap what you're holding into the off-hand slot (works on the shield too) |
| `/shield` | everyone | Raise or lower a held shield by hand, instead of off-handing it |
| `/give mace\|spear\|windcharge\|repairkit\|shield\|gapple\|egapple\|heart\|netherportal\|endportal` | admins | Spawn any custom item |
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

268 assertions covering hearts, the one-orb-per-player cap, dimension detection, coordinate
scaling both ways, portals and their cooldown, terrain generation (determinism, the nether's floor,
lava and ceiling, end islands and void, chunks never rebuilt, the overworld left alone), crystal
blast falloff and kill credit, the boat bonus, exile to the Void and the resurrection price,
Void platform and orb rarity, the durability bar, anonymity in chat, on nametags and in the killfeed
mobs, walking a step at a time, greeting, retaliating in range and on cooldown, fleeing, dying and
coming back as the same person, finding and chopping timber from the top of a
trunk down, refusing to reach outside their patch, building a hut with the right material and
skipping protected spots, the Wind Charge item's own cooldown and consumption, that it never
interferes with the mace's own charge, that /repair restores durability without overshooting and
keeps a mace's bespoke tooltip in sync, the shield's block fraction and shield-drain, its off-arm
mesh and HUD chip appearing and clearing, an empty shield auto-breaking, an untended raised shield
auto-lowering on the next tick, and that every death sends exactly
one message and one toll however it happened, both apples (heal, shield, regen, fire
resistance), smash damage against players and mobs, Density and Wind Burst, the spear lunge,
durability derivation and breakage, crafting registration and costs, elimination and unban, and
every command.
