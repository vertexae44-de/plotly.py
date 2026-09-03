# Unstable-style SMP — Bloxd.io World Code

`smp.js` is a single self-contained World Code script for [Bloxd.io](https://bloxd.io).
It adds the three things that make a lifesteal/unstable SMP work:

| Feature | What it does |
| --- | --- |
| **Life Orbs** | Getting killed by another player costs you max HP and drops that HP on the ground as orbs. Right-click an orb to absorb it. |
| **Windburst Mace** | A club branded as a mace. Hit someone while falling and it smashes for bonus damage, knocks everyone nearby away, and launches you back into the air. Right-click in mid-air to spend a wind charge. |
| **Durability** | Bloxd has no durability at all, so this adds it: tools and weapons wear down per hit and per block broken, and break when they run out. |

## Install

1. In your world: **World Settings → Code → World Code**.
2. Paste the entire contents of `smp.js`.
3. Save. That's it — everything is driven by the `CONFIG` object at the top of the file.

## Playing

- **Get the mace** — hold a `Moonstone Club` with 8 `Moonstone` in your inventory and right-click. Or run `/mace`.
- **Smash** — jump or fall at least 1.5 blocks and hit someone. Damage scales with how far you fell (2.5 per block, capped at 60), and Wind Burst throws you back up so you can chain it.
- **Wind charge** — right-click the mace in mid-air for a 4-second-cooldown vertical launch. Costs 3 durability.
- **Orbs** — kill someone, pick up the orb they drop, right-click it. Each orb is worth one heart.
- **Trade hearts** — `/withdraw 2` converts 2 of your own hearts into orbs you can hand to someone else.

### Commands

| Command | Who | Effect |
| --- | --- | --- |
| `/hp`, `/hearts` | everyone | Show your hearts |
| `/withdraw <hearts>` | everyone | Turn your hearts into Life Orbs |
| `/smphelp` | everyone | Short in-game reminder |
| `/mace` | everyone by default | Give yourself a Windburst Mace |
| `/orb [n]` | admins | Give yourself orbs |
| `/sethp <player> <hp>` | admins | Set someone's max HP |

Admins are matched by in-game name — fill in `CONFIG.commands.adminNames`, which starts empty.
Set `CONFIG.commands.freeMace` to `false` to restrict `/mace` to that list too.

## Tuning

Everything lives in `CONFIG` at the top of `smp.js`. Health in Bloxd runs 0–100 rather than 0–20,
so a "heart" here is 10 HP (`hpPerHeart`). The knobs you are most likely to want:

- `health.starting` / `health.min` / `health.max` — 100 / 20 / 200 by default, i.e. 10 / 2 / 20 hearts.
  The floor means players can be ground down but never eliminated; there is no ban or spectator mode.
- `death.hpLostToPlayer` — how much a PvP death costs. `death.hpLostToWorld` is 0, so fall damage is free.
- `death.killerAlsoGains` — set above 0 if you want classic instant lifesteal *on top of* the orbs.
- `mace.*` — smash thresholds, Wind Burst strength, splash knockback, forge cost.
- `durability.maxUses` — the per-item table. Anything not listed never wears out; delete entries to
  exempt items, or set `durability.enabled: false` to turn the whole system off.

## Implementation notes

- Max HP is persisted per player with `api.setPlayerDbValue`, so hearts survive relogs and lobby changes.
- Orbs and the mace are ordinary items (`Knight Heart`, `Moonstone Club`) tagged through
  `customAttributes`. A vanilla Knight Heart is *not* edible and a vanilla club is *not* a mace —
  the tag is what counts, so renaming can't fake either one.
- Durability is stored in the item's own `customAttributes` and rewritten into the slot on each use,
  because the engine has no durability concept to hook into.
- Fall distance is tracked in `tick()` by accumulating descent and resetting on any non-fall, which is
  what the "did they drop onto this hit" check needs.

## Tests

`test/` runs the script against a stubbed `api` object in a Node VM — no game needed:

```
cd test && node test.js
```

39 assertions covering heart gain/loss, the min/max clamps, orb drops and eating, smash damage and
wind burst, durability wear and breakage, forging, and every command.
