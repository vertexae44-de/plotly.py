// =====================================================================
//  ✦ ARENA PVP ✦  -  world code  (v3)
//  Written against the official Bloxd code-api docs (github.com/Bloxdy/code-api).
//
//  • KIT MENU: a real in-game shop window (!kits) where players see, buy and
//    equip 14 kits - plus Extras, Enchant, Arenas and Profile tabs
//  • SIDEBAR: kills, deaths, K/D, balance, rank, streak, kit, arena and the top
//    killers, in gradient colours
//  • Maces (Windburst / Density / Stomp), Crucible (Breach), Wind Charges
//  • 10 generated arenas per player, ranks, bounties, lobby leaderboard
//
//  Commands: !kits  !shop  !buy <kit|item>  !equip <kit>  !enchant  !kitlist
//            !top [kills|coins|streak]  !stats  !help  !guide [1-5]
//            !arenas  !arena <n|name>  !join <player>  !lobby
// =====================================================================

// ---------------------------------------------------------------------
//  Settings
// ---------------------------------------------------------------------
const START_COINS = 100;
const KILL_COINS = 30;               // per kill
const STREAK_BONUS = 5;              // extra coins per streak step (max 10 steps)
const RANKUP_COINS = 200;            // bonus when you rank up
const BOUNTY_STREAK = 5;             // streak at which you get a bounty on your head
const BOUNTY_PER_STREAK = 15;        // coins per streak step paid to whoever kills you
const ENCHANT_COST_PER_TIER = 250;   // tier 1 = 250 ... tier 5 = 1250
const MAX_ENCHANT_TIER = 5;
const SPAWN_PROTECTION_MS = 4000;
const RESPAWN_KIT_DELAY_MS = 600;    // kit is handed out this long after respawning
const SIDEBAR_REFRESH_MS = 1000;
const SAVE_SLOT = 21;                // moonstone chest slot used for saving
const LOBBY_SPAWN = null;            // [x, y, z] to respawn at in the lobby, or null for the game's default

const ARMOR_PIECES = ["Helmet", "Chestplate", "Gauntlets", "Leggings", "Boots"];
const TOOL_PIECES = ["Sword", "Axe", "Pickaxe", "Spade"];
const WEAPON_WORDS = ["Sword", "Axe", "Mace", "Spear", "Dagger", "Club", "Whip"];

// ---------------------------------------------------------------------
//  Kits. For every piece the game tries "<prefix> <Piece>" for each prefix in
//  order and gives the first one that exists. That is how hybrid kits work
//  (e.g. Fur Chestplate + Wood everything else) and why the new-ore kits fall
//  back to Diamond / Moonstone gear if the game has no such item.
// ---------------------------------------------------------------------
function kitDef(title, price, c1, c2, icon, armour, tools, mace, extra, desc, tint) {
  return { title: title, price: price, c1: c1, c2: c2, icon: icon, armour: armour, tools: tools, mace: mace, extra: extra, desc: desc, tint: tint };
}

const KITS = {
  wood:       kitDef("Wood",       0,     [170, 120, 60],  [225, 185, 115], "Wood Chestplate",    ["Wood"],                                 ["Wood"],                           ["Wood"],                        ["Wood"],       "Full Wood armour, tools, mace, spear and dagger."),
  fur:        kitDef("Fur",        150,   [190, 150, 110], [245, 230, 205], "Fur Chestplate",     ["Fur", "Wood"],                          ["Stone"],                          ["Stone"],                       ["Stone"],      "Fur chestplate over Wood armour, with Stone weapons."),
  stone:      kitDef("Stone",      300,   [135, 140, 150], [205, 210, 220], "Stone Sword",        ["Stone", "Wood"],                        ["Stone"],                          ["Stone"],                       ["Stone"],      "Stone tools, mace, spear and dagger."),
  iron:       kitDef("Iron",       500,   [215, 215, 225], [120, 130, 150], "Iron Chestplate",    ["Iron"],                                 ["Iron"],                           ["Iron"],                        ["Iron"],       "Full Iron armour, tools and weapons."),
  gold:       kitDef("Gold",       800,   [255, 200, 0],   [255, 240, 130], "Gold Chestplate",    ["Gold"],                                 ["Gold"],                           ["Gold"],                        ["Gold"],       "Full Gold armour, tools and weapons."),
  spiked:     kitDef("Spiked",     1100,  [170, 170, 185], [255, 80, 80],   "Spiked Boots",       ["Spiked", "Iron"],                       ["Iron"],                           ["Iron"],                        ["Iron"],       "Iron armour with Spiked Boots, Iron weapons."),
  diamond:    kitDef("Diamond",    1600,  [60, 220, 255],  [175, 255, 255], "Diamond Chestplate", ["Diamond"],                              ["Diamond"],                        ["Diamond"],                     ["Diamond"],    "Full Diamond armour, tools and weapons."),
  knight:     kitDef("Knight",     2300,  [110, 135, 205], [215, 225, 255], "Knight Sword",       ["Knight", "Diamond"],                    ["Knight", "Diamond"],              ["Diamond"],                     ["Diamond"],    "Diamond armour with the Knight Sword and Diamond mace."),
  golem:      kitDef("Golem",      3200,  [185, 120, 70],  [120, 205, 125], "Golem Pickaxe",      ["Golem", "Diamond"],                     ["Golem", "Diamond"],               ["Diamond"],                     ["Diamond"],    "Diamond armour with the Golem Pickaxe and Diamond mace."),
  moonstone:  kitDef("Moonstone",  4500,  [150, 130, 255], [230, 220, 255], "Moonstone Mace",     ["Moonstone", "Diamond"],                 ["Moonstone", "Diamond"],           ["Moonstone"],                   ["Moonstone"],  "Diamond armour with a Moonstone mace, spear and tools."),
  amethite:   kitDef("Amethite",   6000,  [190, 90, 255],  [255, 150, 235], "Diamond Chestplate", ["Kingly Amethite", "Amethite", "Diamond"],["Amethite", "Moonstone", "Diamond"],["Amethite", "Moonstone"],      ["Amethite", "Moonstone"],  "New ore: Amethite gear (Diamond / Moonstone if the game lacks it).", "#c78bff"),
  rubellite:  kitDef("Rubellite",  8000,  [255, 50, 90],   [255, 165, 135], "Diamond Chestplate", ["Kingly Rubellite", "Rubellite", "Diamond"],["Rubellite", "Moonstone", "Diamond"],["Rubellite", "Moonstone"],    ["Rubellite", "Moonstone"], "New ore: Rubellite gear (Diamond / Moonstone if the game lacks it).", "#ff6b86"),
  magmasteel: kitDef("Magmasteel", 11000, [255, 110, 0],   [255, 230, 60],  "Diamond Chestplate", ["Kingly Magmasteel", "Magmasteel", "Diamond"],["Magmasteel", "Moonstone", "Diamond"],["Magmasteel", "Moonstone"],["Magmasteel", "Moonstone"], "New ore: Magmasteel gear (Diamond / Moonstone if the game lacks it).", "#ff9a3c"),
  serpentite: kitDef("Serpentite", 15000, [40, 255, 150],  [40, 190, 255],  "Diamond Chestplate", ["Kingly Serpentite", "Serpentite", "Serpentine", "Diamond"],["Serpentite", "Serpentine", "Moonstone", "Diamond"],["Serpentite", "Serpentine", "Moonstone"],["Serpentite", "Serpentine", "Moonstone"], "New ore: Serpentite gear (Diamond / Moonstone if the game lacks it).", "#3dffa8"),
};
const KIT_ORDER = ["wood", "fur", "stone", "iron", "gold", "spiked", "diamond", "knight", "golem", "moonstone", "amethite", "rubellite", "magmasteel", "serpentite"];
const FIRST_KIT = "wood";

// Shop extras
const SHOP = {
  crucible:   { title: "Crucible Mace", price: 2500, once: true,  icon: "Moonstone Mace", desc: "Breach mace - hits harder through armour. Given every spawn.", c1: [255, 70, 70], c2: [255, 190, 90] },
  windcharge: { title: "Wind Charges",  price: 150,  once: false, icon: "Iron Fragment",  desc: "x8 - right-click to launch yourself and blast foes away.", c1: [120, 230, 255], c2: [190, 255, 220] },
  apples:     { title: "Golden Apples", price: 100,  once: false, icon: "Apple",          desc: "x16 - eat for a burst of Speed, Strength and Resistance.", c1: [255, 215, 0], c2: [255, 160, 40] },
};
const SHOP_ORDER = ["crucible", "windcharge", "apples"];

// Mace tuning
const MACE = {
  minFall: 1.5,            // blocks you must fall for a smash
  dmgPerBlock: 2.5,
  maxBonus: 60,
  windburstLevel: 3,       // launches YOU skyward after a smash
  windburstPer: 4.5,
  densityLevel: 3,         // extra damage per block fallen
  densityPer: 0.75,
  chargeUp: 11,            // right-click launch
  chargeCooldownMs: 4000,
  kbRadius: 4.5,
  kbForce: 9,
  kbUp: 5,
  breachBonus: 0.5,        // Crucible: +50% damage (Bloxd has no way to read a player's armour)
};

// Wind charge item tuning
const WIND = {
  items: ["Iron Fragment"],
  up: 9,
  forward: 4,
  cooldownMs: 2000,
  radius: 5,
  force: 10,
  kbUp: 5,
};

// Golden apple effects
const APPLE_SECONDS = 8;
const APPLE_EFFECTS = [["Damage Reduction", 2], ["Speed", 2], ["Health Regen", 2], ["Damage", 1]];

// Ranks by kills: [minKills, name]. Each family has its own gradient.
const RANKS = [
  [0, "Bronze I"], [10, "Bronze II"], [25, "Bronze III"],
  [50, "Silver I"], [75, "Silver II"], [100, "Silver III"],
  [150, "Gold I"], [200, "Gold II"], [250, "Gold III"],
  [350, "Diamond I"], [450, "Diamond II"], [550, "Diamond III"],
  [700, "Sapphire I"], [850, "Sapphire II"], [1000, "Sapphire III"],
  [1200, "Ruby I"], [1400, "Ruby II"], [1600, "Ruby III"],
  [1850, "Elite I"], [2100, "Elite II"], [2350, "Elite III"],
  [2650, "Champion I"], [2950, "Champion II"], [3250, "Champion III"],
  [3500, "Mythic I"], [3750, "Mythic II"], [4000, "Mythic III"],
  [5000, "LEGEND"],
];
const RANK_TIERS = {
  Bronze:   [[205, 127, 50],  [255, 196, 128]],
  Silver:   [[170, 175, 185], [245, 248, 255]],
  Gold:     [[255, 200, 0],   [255, 242, 125]],
  Diamond:  [[60, 220, 255],  [175, 255, 255]],
  Sapphire: [[60, 90, 255],   [145, 195, 255]],
  Ruby:     [[255, 40, 80],   [255, 155, 155]],
  Elite:    [[160, 60, 255],  [235, 155, 255]],
  Champion: [[255, 90, 190],  [255, 185, 235]],
  Mythic:   [[255, 230, 90],  [255, 255, 195]],
  LEGEND:   [[255, 60, 0],    [255, 235, 0]],
};

// Gradient colour pairs for stat values
const GRAD = {
  green:  [[80, 255, 120],  [195, 255, 150]],
  red:    [[255, 70, 70],   [255, 155, 120]],
  gold:   [[255, 215, 0],   [255, 150, 40]],
  orange: [[255, 120, 0],   [255, 225, 60]],
  purple: [[190, 90, 255],  [255, 150, 235]],
  blue:   [[80, 200, 255],  [165, 160, 255]],
  white:  [[255, 255, 255], [185, 195, 230]],
};

// ---------------------------------------------------------------------
//  Gradient / styled text helpers
// ---------------------------------------------------------------------
function toHex(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

function mix(c1, c2, t) {
  return "#" + toHex(c1[0] + (c2[0] - c1[0]) * t) + toHex(c1[1] + (c2[1] - c1[1]) * t) + toHex(c1[2] + (c2[2] - c1[2]) * t);
}

// One coloured segment per character, fading from c1 to c2 (use for SHORT text in chat).
function gradient(text, c1, c2, extra) {
  const out = [];
  const n = Math.max(1, text.length - 1);
  for (let i = 0; i < text.length; i++) {
    out.push({ str: text[i], style: Object.assign({ color: mix(c1, c2, i / n) }, extra || {}) });
  }
  return out;
}

// Gradient with only a few colour steps - keeps big payloads (sidebar, shop) small.
function coarse(text, c1, c2, extra, steps) {
  const n = Math.max(1, Math.min(steps || 3, text.length));
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * text.length / n), b = Math.floor((i + 1) * text.length / n);
    out.push({ str: text.slice(a, b), style: Object.assign({ color: mix(c1, c2, n === 1 ? 0 : i / (n - 1)) }, extra || {}) });
  }
  return out;
}

function seg(str, color, extra) {
  return { str: str, style: Object.assign({ color: color || "#ffffff" }, extra || {}) };
}

const BOLD = { fontWeight: "bold" };
const ITALIC = { fontStyle: "italic" };
const BOLD_ITALIC = { fontWeight: "bold", fontStyle: "italic" };
const TITLE_A = [255, 80, 200];
const TITLE_B = [80, 200, 255];

function plain(segs) {
  return segs.map(s => s.str).join("");
}

function stripItalic(segs) {
  return segs.map(s => {
    if (!s.style || !s.style.fontStyle) return s;
    const st = Object.assign({}, s.style);
    delete st.fontStyle;
    return { str: s.str, style: st };
  });
}

// Chat message: styled -> styled without italics -> plain text.
function tell(playerId, segs) {
  try { api.sendMessage(playerId, segs); return; } catch (e) {}
  try { api.sendMessage(playerId, stripItalic(segs)); return; } catch (e) {}
  try { api.sendMessage(playerId, plain(segs), { color: "white" }); } catch (e) {}
}

function shout(segs) {
  try { api.broadcastMessage(segs); return; } catch (e) {}
  try { api.broadcastMessage(stripItalic(segs)); return; } catch (e) {}
  try { api.broadcastMessage(plain(segs), { color: "white" }); } catch (e) {}
}

// Appends a newline to the last segment (keeps the segment count low).
function withNl(segs) {
  const out = segs.slice();
  const last = out[out.length - 1];
  out[out.length - 1] = { str: last.str + "\n", style: last.style };
  return out;
}

function line() { return [seg("────────────────────────", "#555566")]; }

function arenaTitle(prefix) {
  return gradient((prefix || "") + "✦ ARENA PVP ✦", TITLE_A, TITLE_B, BOLD_ITALIC);
}

function sendSafe(fn) { try { fn(); } catch (e) {} }

// Reports a failure ONCE per player and tag (so a bad API call is visible, not silent).
const reported = {};
function reportOnce(id, tag, e) {
  const key = id + ":" + tag;
  if (reported[key]) return;
  reported[key] = true;
  sendSafe(() => api.sendMessage(id, "[ARENA] " + tag + " failed: " + e, { color: "#ff6b6b" }));
  sendSafe(() => api.log("[ARENA] " + tag + " failed: " + e));
}

function moneySegs(amount) {
  return coarse("$" + amount, GRAD.gold[0], GRAD.gold[1], BOLD, 3);
}

// ---------------------------------------------------------------------
//  Player data (saved in the player's moonstone chest, like a profile)
// ---------------------------------------------------------------------
const P = {};   // playerId -> data

function defaults() {
  return { kills: 0, deaths: 0, coins: START_COINS, streak: 0, best: 0, owned: [FIRST_KIT], kit: FIRST_KIT, enchants: 0, crucible: false, guide: false };
}

function saveData(id) {
  const d = P[id];
  if (!d) return;
  sendSafe(() => api.setMoonstoneChestItemSlot(id, SAVE_SLOT, "Black Carpet", 1, { customDisplayName: JSON.stringify(d) }));
}

function loadData(id) {
  const d = defaults();
  try {
    const item = api.getMoonstoneChestItemSlot(id, SAVE_SLOT);
    const raw = item && item.attributes && item.attributes.customDisplayName;
    if (raw) {
      const s = JSON.parse(raw);
      for (const key of Object.keys(d)) {
        if (s[key] !== undefined && typeof s[key] === typeof d[key]) d[key] = s[key];
      }
      // keep only kits that still exist; the old "starter" becomes the first kit
      d.owned = (Array.isArray(d.owned) ? d.owned : []).map(k => (k === "starter" ? FIRST_KIT : k)).filter(k => KITS[k]);
      if (d.owned.indexOf(FIRST_KIT) === -1) d.owned.unshift(FIRST_KIT);
      if (d.kit === "starter") d.kit = FIRST_KIT;
      if (!KITS[d.kit]) d.kit = FIRST_KIT;
    }
  } catch (e) {}
  P[id] = d;
  return d;
}

// ---------------------------------------------------------------------
//  Ranks, name tags, leaderboards
// ---------------------------------------------------------------------
function rankFor(kills) {
  let r = RANKS[0];
  for (const entry of RANKS) {
    if (kills >= entry[0]) r = entry;
  }
  const tier = RANK_TIERS[r[1].split(" ")[0]] || RANK_TIERS.Bronze;
  return { name: r[1], c1: tier[0], c2: tier[1] };
}

function rankSegs(rank, extra, steps) {
  return steps ? coarse(rank.name, rank.c1, rank.c2, extra || BOLD, steps) : gradient(rank.name, rank.c1, rank.c2, extra || BOLD);
}

function nextRankInfo(kills) {
  for (const entry of RANKS) {
    if (kills < entry[0]) return { name: entry[1], need: entry[0] - kills };
  }
  return null;
}

function kitName(key, extra, steps) {
  const k = KITS[key];
  return steps ? coarse(k.title, k.c1, k.c2, extra || BOLD, steps) : gradient(k.title, k.c1, k.c2, extra || BOLD);
}

function kdOf(d) {
  return d.deaths > 0 ? (d.kills / d.deaths).toFixed(2) : d.kills.toFixed(2);
}

function updateNameTag(id) {
  const d = P[id];
  if (!d) return;
  const rank = rankFor(d.kills);
  sendSafe(() => api.setTargetedPlayerSettingForEveryone(id, "nameTagInfo", {
    content: gradient(api.getEntityName(id), [80, 220, 255], [185, 140, 255], BOLD),
    subtitle: [seg("[", "#6f7690", BOLD)].concat(rankSegs(rank, BOLD), [seg("]", "#6f7690", BOLD)]),
  }, true));
}

// Built-in lobby leaderboard (Kills / Deaths / K/D)
function setupLobbyBoard(id) {
  sendSafe(() => api.setClientOption(id, "lobbyLeaderboardInfo", {
    pfp: {},
    name: { displayName: "Name" },
    a: { displayName: "Kills" },
    b: { displayName: "Deaths" },
    c: { displayName: "K/D" },
  }));
}

function updateLobbyBoard(id) {
  const d = P[id];
  if (!d) return;
  sendSafe(() => api.setTargetedPlayerSettingForEveryone(id, "lobbyLeaderboardValues", {
    a: String(d.kills),
    b: String(d.deaths),
    c: kdOf(d),
  }));
}

// Live ranking of everyone online by a stat
function topBy(field, n) {
  const rows = [];
  for (const id of api.getPlayerIds()) {
    const d = P[id];
    if (d) rows.push({ id: id, name: api.getEntityName(id), value: d[field] });
  }
  rows.sort((a, b) => b.value - a.value);
  return rows.slice(0, n);
}

const PODIUM = ["#ffd700", "#c0c0c0", "#cd7f32", "#9aa0b4", "#9aa0b4"];

function showTop(id, arg) {
  const field = ({ kills: "kills", coins: "coins", streak: "streak", deaths: "deaths" })[(arg || "kills").toLowerCase()] || "kills";
  const rows = topBy(field, 5);
  tell(id, line());
  tell(id, gradient("  ✦ LEADERBOARD - " + field.toUpperCase() + " ✦", TITLE_A, TITLE_B, BOLD_ITALIC));
  rows.forEach((r, i) => {
    tell(id, [seg(" #" + (i + 1) + " ", PODIUM[i], BOLD)].concat(
      gradient(r.name, [255, 255, 255], [185, 195, 230], BOLD_ITALIC),
      [seg("  ", "#ffffff")], coarse(String(r.value), GRAD.gold[0], GRAD.gold[1], BOLD, 2)));
  });
  tell(id, line());
}

// ---------------------------------------------------------------------
//  SIDEBAR  (RightInfoText)
//  Sent every second, so it is kept small: gradients use a few colour steps
//  instead of one segment per letter, and it is only re-sent when it changed.
// ---------------------------------------------------------------------
function sideLine(label, valueSegs) {
  return [seg(label + " ", "#9aa0b4")].concat(valueSegs);
}

const lastSideKey = {};

function updateSidebar(id) {
  const d = P[id];
  if (!d) return;
  const rank = rankFor(d.kills);
  const next = nextRankInfo(d.kills);
  const k = KITS[d.kit];
  const arena = inArena[id] !== undefined && arenas[inArena[id]] ? ARENA_TYPES[arenas[inArena[id]].type] : null;

  let segs = [];
  segs = segs.concat(withNl(coarse("✦ ARENA PVP ✦", TITLE_A, TITLE_B, BOLD, 4)));
  segs = segs.concat(sideLine("Rank", withNl(rankSegs(rank, BOLD, 2))));
  segs = segs.concat(sideLine("Kills", [seg(d.kills + "\n", "#7dff7d", BOLD)]));
  segs = segs.concat(sideLine("Deaths", [seg(d.deaths + "\n", "#ff7d7d", BOLD)]));
  segs = segs.concat(sideLine("K/D", [seg(kdOf(d) + "\n", "#ffd27d", BOLD)]));
  segs = segs.concat(sideLine("Balance", withNl(coarse("$" + d.coins, GRAD.gold[0], GRAD.gold[1], BOLD, 2))));
  segs = segs.concat(sideLine("Streak", [seg(d.streak + " (best " + d.best + ")\n", "#ff9a3c", BOLD)]));
  segs = segs.concat(sideLine("Kit", withNl(coarse(k.title, k.c1, k.c2, BOLD, 2))));
  segs = segs.concat(sideLine("Arena", arena ? withNl(coarse(arena.title, arena.c1, arena.c2, BOLD, 2)) : [seg("Lobby\n", "#9aa0b4", BOLD)]));
  if (next) segs.push(seg("Next " + next.name + " in " + next.need + "\n", "#6f7690"));
  segs.push(seg("— TOP KILLERS —\n", "#ffb02e", BOLD));
  topBy("kills", 3).forEach((r, i) => {
    segs.push(seg("#" + (i + 1) + " " + r.name + " " + r.value + "\n", PODIUM[i], BOLD));
  });

  const key = JSON.stringify(segs);
  if (lastSideKey[id] === key) return;       // nothing changed - don't resend
  lastSideKey[id] = key;
  try {
    api.setClientOption(id, "RightInfoText", segs);
  } catch (e) {
    reportOnce(id, "sidebar", e);
    // fall back to a plain, unstyled sidebar so the stats are still visible
    sendSafe(() => api.setClientOption(id, "RightInfoText", plain(segs)));
  }
}

// ---------------------------------------------------------------------
//  Giving kits and items
// ---------------------------------------------------------------------
// Tries every name until the game gives one. Returns true on success.
function giveFirst(id, names, amount, attrs) {
  for (const name of names) {
    try {
      const given = attrs ? api.giveItem(id, name, amount, attrs) : api.giveItem(id, name, amount);
      if (typeof given !== "number" || given > 0) return true;
    } catch (e) {}
  }
  return false;
}

function giveCrucible(id) {
  return giveFirst(id, ["Moonstone Mace", "Diamond Mace"], 1, {
    customDisplayName: "Crucible",
    customDescription: "Breach - hits harder through armour. Right-click to launch.",
    customAttributes: { arenaCrucible: true },
  });
}

function giveWindCharges(id, amount) {
  return giveFirst(id, WIND.items, amount, {
    customDisplayName: "Wind Charge",
    customDescription: "Right-click: launch yourself and blast nearby players away.",
    customAttributes: { arenaWind: true },
  });
}

function giveApples(id, amount) {
  return giveFirst(id, ["Apple"], amount, { customDisplayName: "Golden Apple", customAttributes: { enchantmentTier: "Tier 5" } });
}

function giveKit(id) {
  const d = P[id];
  if (!d) return;
  sendSafe(() => api.clearInventory(id));
  const k = KITS[d.kit];
  const failed = [];

  ARMOR_PIECES.forEach(piece => {
    if (!giveFirst(id, k.armour.map(p => p + " " + piece), 1)) failed.push(piece);
  });
  TOOL_PIECES.forEach(piece => {
    if (!giveFirst(id, k.tools.map(p => p + " " + piece), 1)) failed.push(piece);
  });

  // The kit mace: Windburst + Density
  if (!giveFirst(id, k.mace.map(p => p + " Mace"), 1, {
    customDisplayName: "✦ " + k.title + " Mace",
    customDescription: "Windburst + Density. Smash from above. Right-click to launch.",
    customAttributes: { arenaMace: true },
  })) failed.push("Mace");

  giveFirst(id, k.extra.map(p => p + " Spear"), 1);
  giveFirst(id, k.extra.map(p => p + " Dagger"), 1);
  if (d.crucible && !giveCrucible(id)) failed.push("Crucible");

  giveWindCharges(id, 4);
  giveApples(id, 8);
  sendSafe(() => api.giveItem(id, "Cornbread", 32));

  if (failed.length > 0) {
    tell(id, [seg("Could not give: " + failed.join(", ") + " (item not found).", "#ff6b6b", ITALIC)]);
  }
}

function resolveKey(arg, order, table) {
  const q = (arg || "").toLowerCase().trim();
  if (!q) return null;
  for (const key of order) {
    const title = table[key].title.toLowerCase();
    if (key === q || title === q || title.indexOf(q) === 0) return key;
  }
  return null;
}

// ---------------------------------------------------------------------
//  Buying, equipping, enchanting (used by BOTH the shop menu and chat commands)
// ---------------------------------------------------------------------
function spend(id, price) {
  const d = P[id];
  if (d.coins < price) {
    tell(id, [seg("Not enough coins - you need $" + (price - d.coins) + " more.", "#ff6b6b", BOLD)]);
    return false;
  }
  d.coins -= price;
  return true;
}

function bought(id) {
  saveData(id);
  updateSidebar(id);
  sendSafe(() => api.playSound(id, "cashRegister", 1, 1));
}

function equipKit(id, key) {
  const d = P[id];
  d.kit = key;
  saveData(id);
  giveKit(id);
  updateSidebar(id);
  tell(id, [seg("Equipped ", "#7dff7d", BOLD)].concat(kitName(key, BOLD_ITALIC), [seg(".", "#7dff7d", BOLD)]));
}

// Owned kit -> equip it. Not owned -> buy it (and equip it right away).
function buyOrEquipKit(id, key) {
  const d = P[id];
  const k = KITS[key];
  if (!k) return;
  if (d.owned.indexOf(key) === -1) {
    if (!spend(id, k.price)) return;
    d.owned.push(key);
    bought(id);
    tell(id, [seg("Bought ", "#7dff7d", BOLD)].concat(kitName(key, BOLD_ITALIC), [seg("!", "#7dff7d", BOLD)]));
  }
  if (d.kit !== key) equipKit(id, key);
}

function buyExtra(id, key) {
  const d = P[id];
  const s = SHOP[key];
  if (!s) return;
  if (s.once && d[key]) return tell(id, [seg("You already own that.", "#ffa502", ITALIC)]);
  if (!spend(id, s.price)) return;

  if (key === "crucible") {
    d[key] = true;
    giveCrucible(id);
  } else if (key === "windcharge") {
    giveWindCharges(id, 8);
  } else if (key === "apples") {
    giveApples(id, 16);
  }
  bought(id);
  tell(id, [seg("Bought ", "#7dff7d", BOLD)].concat(gradient(s.title, s.c1, s.c2, BOLD_ITALIC), [seg("!", "#7dff7d", BOLD)]));
}

function itemClass(itemName) {
  const last = itemName.split(" ").pop();
  if (ARMOR_PIECES.indexOf(last) !== -1) return "armor";
  if (last === "Mace") return "mace";
  if (WEAPON_WORDS.indexOf(last) !== -1) return "weapon";
  return null;
}

// What enchanting the held item would do (or why it cannot be done).
function enchantInfo(id) {
  const d = P[id];
  const slot = api.getSelectedInventorySlotI(id);
  const item = api.getItemSlot(id, slot);
  if (!item) return { ok: false, reason: "Hold an armour piece or weapon first." };
  const cls = itemClass(item.name);
  if (!cls) return { ok: false, reason: "Only armour, swords, axes, maces, spears and daggers can be enchanted." };
  const attrs = (item.attributes && item.attributes.customAttributes) || {};
  const m = /Tier (\d+)/.exec(attrs.enchantmentTier || "");
  const current = m ? parseInt(m[1], 10) : 0;
  if (current >= MAX_ENCHANT_TIER) return { ok: false, reason: "That item is already max tier!" };
  const next = current + 1;
  return { ok: true, slot: slot, item: item, cls: cls, attrs: attrs, current: current, next: next, cost: ENCHANT_COST_PER_TIER * next, afford: d.coins >= ENCHANT_COST_PER_TIER * next };
}

function enchantHeld(id) {
  const d = P[id];
  const info = enchantInfo(id);
  if (!info.ok) return tell(id, [seg(info.reason, "#ffa502", ITALIC)]);
  if (!info.afford) return tell(id, [seg("Enchanting to Tier " + info.next + " costs $" + info.cost + " - you have $" + d.coins + ".", "#ff6b6b", BOLD)]);

  const enchantments = info.cls === "armor" ? { "Protection": info.next, "Health": info.next }
    : info.cls === "mace" ? { "Stomp Damage": info.next, "Damage": info.next }
    : { "Damage": info.next, "Attack Speed": info.next };

  // Keep the item's own tags (arenaMace etc.) and just add the enchant.
  const newAttrs = {
    customDisplayName: info.item.attributes && info.item.attributes.customDisplayName,
    customDescription: info.item.attributes && info.item.attributes.customDescription,
    customAttributes: Object.assign({}, info.attrs, { enchantments: enchantments, enchantmentTier: "Tier " + info.next }),
  };

  d.coins -= info.cost;
  d.enchants += 1;
  try {
    api.setItemSlot(id, info.slot, info.item.name, info.item.amount, newAttrs, true);
  } catch (e) {
    d.coins += info.cost;
    d.enchants -= 1;
    return tell(id, [seg("The game rejected that enchant, you were not charged.", "#ff6b6b", ITALIC)]);
  }
  saveData(id);
  updateSidebar(id);
  tell(id, [seg("Enchanted to ", "#c58cff", BOLD)].concat(gradient("Tier " + info.next, [190, 90, 255], [255, 150, 235], BOLD_ITALIC),
            [seg(" for $" + info.cost + "!", "#c58cff", BOLD)]));
  sendSafe(() => api.playSound(id, "levelup", 1, 1.2));
}

// ---------------------------------------------------------------------
//  KIT MENU - the in-game shop window (api.createShopItemForPlayer / openShop)
//  Tabs: Kits, Extras, Enchant, Arenas, Profile. Prices are paid from the
//  player's own coin balance, so items are created without a "cost" and the
//  Buy button text carries the price; onPlayerBoughtShopItem does the rest.
// ---------------------------------------------------------------------
const CAT = { kits: "Kits", extras: "Extras", enchant: "Enchant", arenas: "Arenas", profile: "Profile" };
const CAT_PRIORITY = { Kits: 50, Extras: 40, Enchant: 30, Arenas: 20, Profile: 10 };

function putItem(id, cat, key, item) {
  try {
    api.createShopItemForPlayer(id, cat, key, item);
  } catch (e) {
    reportOnce(id, "kit menu", e);
  }
}

function kitItem(id, key, index) {
  const d = P[id];
  const k = KITS[key];
  const owned = d.owned.indexOf(key) !== -1;
  const equipped = d.kit === key;
  const afford = d.coins >= k.price;

  let desc = [seg(k.desc + "\n", "#c9cde0")];
  desc = desc.concat(owned ? [seg(equipped ? "● Equipped" : "✔ Owned", "#7dff7d", BOLD)]
    : [seg("Price ", "#9aa0b4")].concat(moneySegs(k.price)));
  desc = desc.concat([seg("   Balance ", "#6f7690")], moneySegs(d.coins));

  const item = {
    image: k.icon,
    customTitle: coarse(k.title, k.c1, k.c2, BOLD, 4),
    description: desc,
    canBuy: !equipped && (owned || afford),
    isSelected: equipped,
    buyButtonText: equipped ? "Equipped" : owned ? "Equip" : "Buy  $" + k.price,
    redDot: !owned && afford && k.price > 0,
    sortPriority: 1000 - index,
  };
  if (k.tint) item.imageColour = k.tint;
  return item;
}

function extraItem(id, key, index) {
  const d = P[id];
  const s = SHOP[key];
  const have = s.once && d[key];
  const afford = d.coins >= s.price;
  return {
    image: s.icon,
    customTitle: coarse(s.title, s.c1, s.c2, BOLD, 4),
    description: [seg(s.desc + "\n", "#c9cde0"), seg(have ? "✔ Owned" : "Price ", have ? "#7dff7d" : "#9aa0b4", have ? BOLD : undefined)]
      .concat(have ? [] : moneySegs(s.price), [seg("   Balance ", "#6f7690")], moneySegs(d.coins)),
    canBuy: !have && afford,
    buyButtonText: have ? "Owned" : "Buy  $" + s.price,
    redDot: !have && afford,
    sortPriority: 1000 - index,
  };
}

function enchantItem(id) {
  const d = P[id];
  const info = enchantInfo(id);
  let desc;
  if (!info.ok) {
    desc = [seg(info.reason + "\n", "#c9cde0"), seg("Balance ", "#6f7690")].concat(moneySegs(d.coins));
  } else {
    desc = [seg("Holding ", "#9aa0b4"), seg(info.item.name + "\n", "#ffffff", BOLD),
            seg("Tier " + info.current + " → Tier " + info.next + "   Cost ", "#9aa0b4")].concat(moneySegs(info.cost),
            [seg("   Balance ", "#6f7690")], moneySegs(d.coins));
  }
  return {
    image: "Gold Enchanting Table",
    customTitle: coarse("Enchant Held Item", [190, 90, 255], [255, 150, 235], BOLD, 4),
    description: desc,
    canBuy: info.ok && info.afford,
    buyButtonText: info.ok ? "Enchant  $" + info.cost : "Hold an item",
    redDot: info.ok && info.afford,
    sortPriority: 1000,
  };
}

const ARENA_ICONS = ["Stone Bricks", "Maple Wood Planks", "Lava", "Ice", "Sandstone", "Glass", "Obsidian", "Grass Block", "Block of Gold", "Stone"];

function arenaItem(id, index) {
  const t = ARENA_TYPES[index];
  const mine = arenas[id];
  const current = !!mine && mine.type === index;
  const building = !!mine && !mine.ready;
  return {
    image: ARENA_ICONS[index],
    customTitle: coarse(t.title, t.c1, t.c2, BOLD, 4),
    description: [seg(t.desc + "\n", "#c9cde0"), seg(current ? "● Your arena" : "Free - builds your own copy", current ? "#7dff7d" : "#9aa0b4", current ? BOLD : undefined)],
    canBuy: !building,
    isSelected: current,
    buyButtonText: building ? "Building..." : current ? "Rebuild & go" : "Build & go",
    sortPriority: 1000 - index,
  };
}

function profileItems(id) {
  const d = P[id];
  const rank = rankFor(d.kills);
  const next = nextRankInfo(d.kills);
  const lab = t => seg(t, "#9aa0b4");

  let stats = [lab("Rank ")].concat(rankSegs(rank, BOLD, 3),
    [lab("   Kills "), seg(String(d.kills), "#7dff7d", BOLD), lab("   Deaths "), seg(String(d.deaths), "#ff7d7d", BOLD),
     lab("   K/D "), seg(kdOf(d), "#ffd27d", BOLD), seg("\n", "#ffffff"), lab("Balance ")], moneySegs(d.coins),
    [lab("   Streak "), seg(d.streak + " (best " + d.best + ")", "#ff9a3c", BOLD), lab("   Enchants "), seg(String(d.enchants), "#c58cff", BOLD)]);
  if (next) stats = stats.concat([seg("\nNext rank: " + next.name + " in " + next.need + " kills", "#6f7690")]);

  let top = [];
  topBy("kills", 5).forEach((r, i) => {
    top.push(seg("#" + (i + 1) + " " + r.name + "  " + r.value + " kills" + (i < 4 ? "\n" : ""), PODIUM[i], BOLD));
  });
  if (top.length === 0) top = [seg("Nobody online yet.", "#9aa0b4")];

  return {
    stats: { image: "Diamond Sword", customTitle: coarse("Your Stats", TITLE_A, TITLE_B, BOLD, 4), description: stats, canBuy: false, buyButtonText: "—", sortPriority: 1000 },
    top: { image: "Gold Sword", customTitle: coarse("Top Killers (online)", [255, 215, 0], [255, 140, 60], BOLD, 4), description: top, canBuy: false, buyButtonText: "—", sortPriority: 900 },
  };
}

function setHeaders(id) {
  const d = P[id];
  const text = [seg("Balance ", "#9aa0b4")].concat(moneySegs(d.coins), [seg("   Kit ", "#9aa0b4")], kitName(d.kit, BOLD, 2),
    [seg("   Rank ", "#9aa0b4")], rankSegs(rankFor(d.kills), BOLD, 2));
  for (const cat of Object.keys(CAT_PRIORITY)) {
    try {
      api.configureShopCategoryForPlayer(id, cat, { sortPriority: CAT_PRIORITY[cat], description: text });
    } catch (e) {
      reportOnce(id, "kit menu tabs", e);
      break;
    }
  }
}

function refreshKits(id) { KIT_ORDER.forEach((key, i) => putItem(id, CAT.kits, key, kitItem(id, key, i))); }
function refreshExtras(id) { SHOP_ORDER.forEach((key, i) => putItem(id, CAT.extras, key, extraItem(id, key, i))); }
function refreshEnchant(id) { putItem(id, CAT.enchant, "enchant", enchantItem(id)); }
function refreshArenas(id) { ARENA_TYPES.forEach((t, i) => putItem(id, CAT.arenas, t.key, arenaItem(id, i))); }
function refreshProfile(id) {
  const items = profileItems(id);
  putItem(id, CAT.profile, "stats", items.stats);
  putItem(id, CAT.profile, "top", items.top);
}

// Everything that depends on the coin balance
function refreshMoney(id) {
  if (!P[id]) return;
  refreshKits(id);
  refreshExtras(id);
  refreshEnchant(id);
  refreshProfile(id);
  setHeaders(id);
}

function refreshShop(id) {
  if (!P[id]) return;
  refreshMoney(id);
  refreshArenas(id);
}

// Opens the shop window on a tab; falls back to a chat list if that is not possible.
function openMenu(id, category) {
  if (!P[id]) loadData(id);
  try {
    api.openShop(id, false, category || CAT.kits);
  } catch (e) {
    reportOnce(id, "open kit menu", e);
    showKitsText(id);
  }
}

// The shop window calls this after a successful purchase click.
function onPlayerBoughtShopItem(id, categoryKey, itemKey) {
  if (!P[id]) loadData(id);
  if (categoryKey === CAT.kits) buyOrEquipKit(id, itemKey);
  else if (categoryKey === CAT.extras) buyExtra(id, itemKey);
  else if (categoryKey === CAT.enchant) enchantHeld(id);
  else if (categoryKey === CAT.arenas) {
    const idx = arenaTypeOf(itemKey);
    if (idx >= 0) startArena(id, idx);
  }
  refreshMoney(id);
}

function onPlayerToggledShopMenu(id, isOpen) {
  if (!isOpen || !P[id]) return;
  refreshEnchant(id);      // depends on what is in your hand right now
  refreshProfile(id);
}

// ---------------------------------------------------------------------
//  Chat versions of the menus (used when the shop window is unavailable)
// ---------------------------------------------------------------------
function showKitsText(id) {
  const d = P[id];
  tell(id, line());
  tell(id, gradient("  ✦ KIT MENU ✦", TITLE_A, TITLE_B, BOLD_ITALIC));
  KIT_ORDER.forEach(key => {
    const k = KITS[key];
    const owned = d.owned.indexOf(key) !== -1;
    const status = d.kit === key ? seg("  ● EQUIPPED", "#7dff7d", BOLD)
      : owned ? seg("  ✔ owned  (!equip " + key + ")", "#9aa0b4", ITALIC)
      : seg("  $" + k.price + "  (!buy " + key + ")", d.coins >= k.price ? "#ffe600" : "#ff6b6b", BOLD);
    tell(id, [seg(" • ", "#555566")].concat(kitName(key, BOLD_ITALIC), [status]));
  });
  SHOP_ORDER.forEach(key => {
    const s = SHOP[key];
    const have = s.once && d[key];
    tell(id, [seg(" • ", "#555566")].concat(gradient(s.title, s.c1, s.c2, BOLD_ITALIC),
      [have ? seg("  ✔ owned", "#7dff7d", BOLD) : seg("  $" + s.price + "  (!buy " + key + ")", d.coins >= s.price ? "#ffe600" : "#ff6b6b", BOLD)]));
  });
  tell(id, [seg(" Balance: ", "#9aa0b4", ITALIC), seg("$" + d.coins, "#ffe600", BOLD)]);
  tell(id, line());
}

function showHelp(id) {
  tell(id, line());
  tell(id, arenaTitle("  "));
  [["!kits", "open the KIT MENU (buy and equip kits)"], ["!shop", "menu: Crucible, Wind Charges, Golden Apples"],
   ["!buy <kit|item>", "buy by name instead of the menu"], ["!equip <kit>", "switch to a kit you own"],
   ["!enchant", "enchant the item in your hand"], ["!kitlist", "kit list in chat"],
   ["!top [kills|coins|streak]", "live leaderboard"], ["!stats", "your stats"],
   ["!guide [1-5]", "step-by-step instructions"], ["!arenas", "pick from 10 arena types"], ["!arena <n|name>", "build your own arena"],
   ["!join <player>", "visit a friend's arena"], ["!lobby", "leave the arena"]].forEach(c => {
    tell(id, [seg(" " + c[0], "#7dd3ff", BOLD), seg("  " + c[1], "#9aa0b4", ITALIC)]);
  });
  tell(id, [seg(" Fall onto players with a mace to SMASH. Streaks of " + BOUNTY_STREAK + "+ put a bounty on your head!", "#ffe600", ITALIC)]);
  tell(id, line());
}

function showStats(id) {
  const d = P[id];
  const rank = rankFor(d.kills);
  const lab = t => seg(t, "#9aa0b4", ITALIC);
  tell(id, line());
  tell(id, [lab(" Rank ")].concat(rankSegs(rank, BOLD_ITALIC),
    [lab("   Kills ")], coarse(String(d.kills), GRAD.green[0], GRAD.green[1], BOLD, 2),
    [lab("   Deaths ")], coarse(String(d.deaths), GRAD.red[0], GRAD.red[1], BOLD, 2),
    [lab("   K/D ")], coarse(kdOf(d), GRAD.orange[0], GRAD.orange[1], BOLD, 2)));
  tell(id, [lab(" Balance ")].concat(moneySegs(d.coins),
    [lab("   Best streak ")], coarse(String(d.best), GRAD.orange[0], GRAD.orange[1], BOLD, 2),
    [lab("   Enchants ")], coarse(String(d.enchants), GRAD.purple[0], GRAD.purple[1], BOLD, 2)));
  tell(id, line());
}

// ---------------------------------------------------------------------
//  IN-GAME INSTRUCTIONS  (!guide, shown when a player joins)
// ---------------------------------------------------------------------
const GUIDE_PAGES = [
  { title: "Getting Started", c1: [255, 80, 200], c2: [255, 190, 120], lines: [
    ["Welcome to ", "✦ ARENA PVP ✦", " - fight, earn coins, climb the ranks."],
    ["1. ", "Fight players", " to earn coins ($30 + a streak bonus per kill)."],
    ["2. ", "!kits", " opens the KIT MENU: see, buy and equip 14 kits."],
    ["3. ", "The menu tabs", ": Kits, Extras, Enchant, Arenas and your Profile."],
    ["4. ", "!arena", " builds a private arena - friends can come in with !join."],
    ["Tip: ", "!help", " lists every command, !guide <1-5> pages through this guide."],
  ] },
  { title: "Kit Menu & Shop", c1: [255, 215, 0], c2: [255, 140, 40], lines: [
    ["Kits go from ", "Wood", " (free) up to Diamond, Moonstone and the new ores."],
    ["Every kit is armour, ", "tools, a mace, a spear and a dagger", "."],
    ["In the menu, ", "Buy", " takes the coins and equips the kit at once; kits you own say Equip."],
    ["The ", "Extras tab", " sells the Crucible mace, Wind Charges and Golden Apples."],
    ["The ", "Enchant tab", " upgrades the item in your hand up to Tier 5 ($250 x tier)."],
    ["Your ", "balance", " is on the sidebar and at the top of every menu tab."],
  ] },
  { title: "Combat & Maces", c1: [255, 120, 0], c2: [255, 230, 60], lines: [
    ["Maces: ", "fall onto a player", " (1.5+ blocks) and hit them for a SMASH."],
    ["A smash adds ", "Density damage", " per block fallen, launches YOU upward (Windburst) and knocks back everyone near."],
    ["Right-click a mace: ", "launch yourself", " into the air (4 second cooldown)."],
    ["Crucible: ", "Breach", " - 50% extra damage that armour does not stop."],
    ["Wind Charge: ", "right-click", " to launch yourself and blast nearby players away."],
    ["Golden Apple: ", "eat it fully", " for 8 seconds of Speed, Strength, Resistance and Regen."],
  ] },
  { title: "Arenas", c1: [120, 220, 255], c2: [190, 255, 220], lines: [
    ["The ", "Arenas tab", " (or !arenas) has 10 arena types: Colosseum, Sky Islands, Lava Pit,"],
    ["Frozen Lake, Desert Ruins, Glass Cage, Nether Fortress, Pillar Forest, King's Pit, Smash Towers.", "", ""],
    ["!arena <number or name> ", "builds YOUR arena", " and teleports you in when it is ready."],
    ["!join <player> ", "visits a friend's arena", " - everyone inside can fight."],
    ["!lobby ", "takes you back", " to where you were. Dying inside an arena respawns you there."],
    ["Pick ", "a new arena any time", " - it rebuilds in the same spot."],
  ] },
  { title: "Ranks & Leaderboards", c1: [190, 90, 255], c2: [255, 150, 235], lines: [
    ["Kills raise your ", "rank", ": Bronze, Silver, Gold, Diamond, Sapphire, Ruby, Elite, Champion, Mythic, LEGEND."],
    ["Every rank-up pays a ", "$200 bonus", " and is announced to the whole server."],
    ["Streaks of ", "5+ kills", " put a BOUNTY on your head - whoever ends your streak gets paid."],
    ["!top ", "[kills|coins|streak]", " shows the live leaderboard of everyone online."],
    ["The ", "sidebar", " shows your rank, kills, deaths, balance, kit, arena and the top 3 killers."],
    ["Your coins, kills, kits and enchants ", "are saved", " - they are still there next time you join."],
  ] },
];

const GUIDE_PAGES_RETURNING = 1;   // pages shown on every later join (set to 5 to always show everything)

function showGuide(id, arg) {
  let n = parseInt((arg || "1").trim(), 10);
  if (isNaN(n)) n = 1;
  n = Math.max(1, Math.min(GUIDE_PAGES.length, n));
  const page = GUIDE_PAGES[n - 1];

  tell(id, line());
  tell(id, gradient("  ✦ GUIDE ✦  " + page.title + "  (" + n + "/" + GUIDE_PAGES.length + ")", page.c1, page.c2, BOLD_ITALIC));
  page.lines.forEach(l => {
    tell(id, [seg(" " + l[0], "#9aa0b4", ITALIC), seg(l[1] || "", "#7dd3ff", BOLD), seg(l[2] || "", "#9aa0b4", ITALIC)]);
  });
  tell(id, [seg(n < GUIDE_PAGES.length ? " Next page: !guide " + (n + 1) : " That is everything - good luck out there!", "#6f7690", ITALIC)]);
  tell(id, line());
}

// ---------------------------------------------------------------------
//  Combat state: fall tracking, cooldowns
// ---------------------------------------------------------------------
const S = {};   // playerId -> { fall, lastY, lastCharge, lastWind }
function stateOf(id) {
  if (!S[id]) S[id] = { fall: 0, lastY: null, lastCharge: 0, lastWind: 0 };
  return S[id];
}

function trackFall(id) {
  const s = stateOf(id);
  const pos = api.getPosition(id);
  if (!pos) return;
  const y = pos[1];
  if (s.lastY === null || y >= s.lastY) s.fall = 0;       // standing or rising
  else s.fall += s.lastY - y;                              // falling
  s.lastY = y;
}

function dist3(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Pushes players (and mobs) near `centre` away from it.
function knockbackAround(centre, attacker, alreadyHit, radius, force, up) {
  let targets = api.getPlayerIds();
  try { targets = targets.concat(api.getMobIds()); } catch (e) {}
  for (const other of targets) {
    if (other === attacker || other === alreadyHit) continue;
    const pos = api.getPosition(other);
    if (!pos) continue;
    const d = dist3(centre, pos);
    if (d > radius) continue;
    const strength = (1 - d / radius) * force;
    const len = Math.max(0.001, Math.sqrt((pos[0] - centre[0]) ** 2 + (pos[2] - centre[2]) ** 2));
    api.applyImpulse(other, ((pos[0] - centre[0]) / len) * strength, up, ((pos[2] - centre[2]) / len) * strength);
  }
}

function burst(pos) {
  sendSafe(() => api.playParticleEffect({
    dir1: [-1, 0, -1], dir2: [1, 1, 1],
    pos1: [pos[0] - 1, pos[1], pos[2] - 1], pos2: [pos[0] + 1, pos[1] + 1, pos[2] + 1],
    texture: "glint", minLifeTime: 0.3, maxLifeTime: 0.9, minEmitPower: 2, maxEmitPower: 5,
    minSize: 0.2, maxSize: 0.8, manualEmitCount: 60, gravity: [0, -3, 0],
    colorGradients: [{ timeFraction: 0, minColor: [255, 255, 255, 1], maxColor: [150, 220, 255, 1] }],
    velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }], blendMode: 1,
  }));
}

// ---------------------------------------------------------------------
//  Mace, Crucible, Wind Charge
// ---------------------------------------------------------------------
function heldInfo(id) {
  const item = api.getHeldItem(id);
  if (!item) return null;
  return { item: item, tags: (item.attributes && item.attributes.customAttributes) || {} };
}

// Gambit-style mace: falling smash with Windburst (launches YOU) + Density.
function maceSmash(attacker, victim, dmg) {
  const s = stateOf(attacker);
  if (s.fall < MACE.minFall) return dmg;

  let bonus = Math.min(MACE.maxBonus, s.fall * MACE.dmgPerBlock);
  bonus += MACE.densityLevel * MACE.densityPer * s.fall;

  const centre = api.getPosition(victim);
  api.applyImpulse(attacker, 0, MACE.windburstLevel * MACE.windburstPer, 0);
  sendSafe(() => api.preventFallDamageNextGrounding(attacker));
  s.fall = 0;

  if (centre) {
    knockbackAround(centre, attacker, victim, MACE.kbRadius, MACE.kbForce, MACE.kbUp);
    burst(centre);
    sendSafe(() => api.broadcastSound("ominousBellHit", 0.9, 1.0, { playerIdOrPos: centre, maxHearDist: 40 }));
  }
  tell(attacker, [seg("SMASH! ", "#ff9a3c", BOLD_ITALIC), seg("+" + Math.round(bonus) + " dmg", "#ffe600", BOLD)]);
  return Math.round(dmg + bonus);
}

// Crucible: Breach - extra damage that armour does not stop.
function crucibleHit(dmg) {
  return Math.round(dmg * (1 + MACE.breachBonus));
}

// Right-click with a mace / Crucible: launch upward (cooldown).
function maceLaunch(id) {
  const s = stateOf(id);
  const now = api.now();
  const wait = MACE.chargeCooldownMs - (now - s.lastCharge);
  if (wait > 0) {
    sendSafe(() => api.queueCrosshairText(id, "Launch: " + Math.ceil(wait / 1000) + "s", 800));
    return;
  }
  s.lastCharge = now;
  api.applyImpulse(id, 0, MACE.chargeUp, 0);
  sendSafe(() => api.preventFallDamageNextGrounding(id));
  burst(api.getPosition(id));
}

// Right-click with a Wind Charge: launch + blast nearby players, uses one up.
function useWindCharge(id, item) {
  const s = stateOf(id);
  const now = api.now();
  const wait = WIND.cooldownMs - (now - s.lastWind);
  if (wait > 0) {
    sendSafe(() => api.queueCrosshairText(id, "Wind Charge: " + Math.ceil(wait / 1000) + "s", 800));
    return;
  }
  s.lastWind = now;
  sendSafe(() => api.removeItemName(id, item.name, 1));

  const dir = api.getPlayerFacingInfo(id).dir;
  const len = Math.max(0.001, Math.sqrt(dir[0] * dir[0] + dir[2] * dir[2]));
  api.applyImpulse(id, (dir[0] / len) * WIND.forward, WIND.up, (dir[2] / len) * WIND.forward);
  sendSafe(() => api.preventFallDamageNextGrounding(id));

  const pos = api.getPosition(id);
  knockbackAround(pos, id, null, WIND.radius, WIND.force, WIND.kbUp);
  burst(pos);
  sendSafe(() => api.broadcastSound("magicAccent4", 0.8, 1.3, { playerIdOrPos: pos, maxHearDist: 25 }));
}

// ---------------------------------------------------------------------
//  Golden apples: effects when fully eaten (detected from the inventory)
// ---------------------------------------------------------------------
const lastApple = {};

function applyAppleEffects(id) {
  for (const [effect, level] of APPLE_EFFECTS) {
    sendSafe(() => api.applyEffect(id, effect, APPLE_SECONDS * 1000, { inbuiltLevel: level }));
  }
  sendSafe(() => api.playSound(id, "levelup", 0.8, 1.2));
}

function checkApple(id) {
  const slot = api.getSelectedInventorySlotI(id);
  const item = api.getItemSlot(id, slot);
  const now = item && item.name === "Apple" ? (item.amount == null ? 1 : item.amount) : 0;
  const prev = lastApple[id];
  if (prev && prev.slot === slot && now < prev.amount) applyAppleEffects(id);
  lastApple[id] = now > 0 ? { slot: slot, amount: now } : null;
}

// ---------------------------------------------------------------------
//  ARENAS - every player can generate their own arena (10 types) and
//  invite others with !join. Arenas are built from blocks in a queue
//  (a few block rectangles per tick) so the server never freezes.
// ---------------------------------------------------------------------
const ARENA_BASE = [0, 150, 0];    // x, floor-level y, z of arena slot 0 - pick open sky/void space in your world
const ARENA_SPACING = 70;          // distance between players' arenas (along x)
const ARENA_R = 16;                // arena radius (arena is 33 x 33)
const OPS_PER_TICK = 6;            // block rectangles placed per tick
const MAX_RECT_BLOCKS = 3000;      // bigger rectangles are split into pieces of at most this size

// Verified block names (from the official BLOCK_NAMES list)
const B = {
  air: "Air", stone: "Stone", stoneBrick: "Stone Bricks", planks: "Maple Wood Planks", lava: "Lava",
  ice: "Ice", snow: "Snow", sand: "Sand", sandstone: "Sandstone", glass: "Glass",
  obsidian: "Obsidian", grass: "Grass Block", gold: "Block of Gold",
};

// Each type draws with add(x1,y1,z1, x2,y2,z2, material) in coordinates relative to
// the arena centre: y = -1 is the top floor layer, y = 0 is where players stand.
const ARENA_TYPES = [
  { key: "colosseum", title: "Colosseum", c1: [255, 200, 120], c2: [255, 110, 80], spawn: [0, 1, 0],
    desc: "Walled stone ring with pillars - classic duels.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "stoneBrick");
      add(-R, 0, -R, R, 7, -R + 1, "stone"); add(-R, 0, R - 1, R, 7, R, "stone");
      add(-R, 0, -R, -R + 1, 7, R, "stone"); add(R - 1, 0, -R, R, 7, R, "stone");
      [[-8, -8], [-8, 8], [8, -8], [8, 8], [0, -12], [0, 12], [-12, 0], [12, 0]].forEach(q => add(q[0], 0, q[1], q[0], 6, q[1], "stoneBrick"));
      add(-3, 0, -3, 3, 0, 3, "gold");
    } },
  { key: "skyislands", title: "Sky Islands", c1: [120, 220, 255], c2: [190, 255, 220], spawn: [0, 1, 0],
    desc: "Floating islands over the void - knock them off!",
    build: (add) => {
      add(-6, -2, -6, 6, -1, 6, "planks");
      [[14, 0], [-14, 0], [0, 14], [0, -14]].forEach(q => add(q[0] - 4, -2, q[1] - 4, q[0] + 4, -1, q[1] + 4, "stone"));
      add(6, -2, -1, 10, -1, 1, "planks"); add(-10, -2, -1, -6, -1, 1, "planks");
      add(-1, -2, 6, 1, -1, 10, "planks"); add(-1, -2, -10, 1, -1, -6, "planks");
    } },
  { key: "lavapit", title: "Lava Pit", c1: [255, 90, 0], c2: [255, 220, 60], spawn: [-12, 1, 0],
    desc: "A lava lake with a stone cross bridge in the middle.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "stone");
      add(-7, -2, -7, 7, -1, 7, "lava");
      add(-7, -2, -1, 7, -1, 1, "stoneBrick"); add(-1, -2, -7, 1, -1, 7, "stoneBrick");
      add(-2, -2, -2, 2, 0, 2, "stoneBrick");
      add(-R, 0, -R, R, 3, -R, "stone"); add(-R, 0, R, R, 3, R, "stone");
      add(-R, 0, -R, -R, 3, R, "stone"); add(R, 0, -R, R, 3, R, "stone");
    } },
  { key: "frozenlake", title: "Frozen Lake", c1: [150, 230, 255], c2: [255, 255, 255], spawn: [0, 1, 0],
    desc: "Slippery ice floor with snow mounds for cover.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "ice");
      add(-R, 0, -R, R, 4, -R, "snow"); add(-R, 0, R, R, 4, R, "snow");
      add(-R, 0, -R, -R, 4, R, "snow"); add(R, 0, -R, R, 4, R, "snow");
      [[6, 6], [-6, 6], [6, -6], [-6, -6]].forEach(q => add(q[0] - 1, 0, q[1] - 1, q[0] + 1, 1, q[1] + 1, "snow"));
    } },
  { key: "desertruins", title: "Desert Ruins", c1: [255, 200, 110], c2: [215, 140, 70], spawn: [0, 1, 0],
    desc: "Sand, broken walls and sandstone pillars.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "sand");
      add(-R, 0, -R, R, 2, -R, "sandstone"); add(-R, 0, R, R, 2, R, "sandstone");
      add(-R, 0, -R, -R, 2, R, "sandstone"); add(R, 0, -R, R, 2, R, "sandstone");
      [[-10, -10, 6], [-10, 10, 4], [10, -10, 5], [10, 10, 7], [0, -9, 3], [0, 9, 3], [-9, 0, 5], [9, 0, 5], [5, 5, 2], [-5, -5, 2]]
        .forEach(q => add(q[0], 0, q[1], q[0], q[2], q[1], "sandstone"));
    } },
  { key: "glasscage", title: "Glass Cage", c1: [200, 240, 255], c2: [140, 180, 255], spawn: [0, 1, 0],
    desc: "A sealed glass box with stepped platforms.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "planks");
      add(-R, 0, -R, R, 10, -R, "glass"); add(-R, 0, R, R, 10, R, "glass");
      add(-R, 0, -R, -R, 10, R, "glass"); add(R, 0, -R, R, 10, R, "glass");
      add(-R, 11, -R, R, 11, R, "glass");
      add(-9, 0, -9, -5, 1, -5, "planks"); add(5, 0, 5, 9, 1, 9, "planks");
      add(-9, 0, 5, -5, 2, 9, "planks"); add(5, 0, -9, 9, 2, -5, "planks");
    } },
  { key: "netherfortress", title: "Nether Fortress", c1: [160, 60, 255], c2: [255, 60, 60], spawn: [0, 3, 0],
    desc: "Obsidian keep, corner towers and a lava moat.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "obsidian");
      add(-R + 1, -2, -R + 1, R - 1, -1, -R + 3, "lava"); add(-R + 1, -2, R - 3, R - 1, -1, R - 1, "lava");
      add(-R + 1, -2, -R + 1, -R + 3, -1, R - 1, "lava"); add(R - 3, -2, -R + 1, R - 1, -1, R - 1, "lava");
      add(-R, 0, -R, R, 8, -R, "obsidian"); add(-R, 0, R, R, 8, R, "obsidian");
      add(-R, 0, -R, -R, 8, R, "obsidian"); add(R, 0, -R, R, 8, R, "obsidian");
      add(-5, 0, -5, 5, 2, 5, "obsidian");
      [[-11, -11], [-11, 11], [11, -11], [11, 11]].forEach(q => add(q[0] - 1, 0, q[1] - 1, q[0] + 1, 9, q[1] + 1, "obsidian"));
    } },
  { key: "pillarforest", title: "Pillar Forest", c1: [90, 255, 130], c2: [255, 240, 120], spawn: [0, 1, 0],
    desc: "Grass field full of stone pillars - perfect for mace smashes.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "grass");
      add(-R, 0, -R, R, 3, -R, "stone"); add(-R, 0, R, R, 3, R, "stone");
      add(-R, 0, -R, -R, 3, R, "stone"); add(R, 0, -R, R, 3, R, "stone");
      const g = [-12, -6, 0, 6, 12];
      let n = 0;
      g.forEach(x => g.forEach(z => {
        n++;
        if (x === 0 && z === 0) return;
        add(x, 0, z, x, 3 + ((n * 7) % 6), z, "stone");
      }));
    } },
  { key: "kingspit", title: "King's Pit", c1: [255, 215, 0], c2: [255, 140, 40], spawn: [-15, 1, 0],
    desc: "Stepped pit - fight your way down to the golden throne.",
    build: (add, R) => {
      add(-R, -12, -R, R, -1, R, "stone");
      for (let i = 1; i <= 4; i++) add(-(R - 3 * i), -i, -(R - 3 * i), R - 3 * i, -1, R - 3 * i, "air");
      add(-1, -5, -1, 1, -5, 1, "gold");
      add(-R, 0, -R, R, 5, -R, "stone"); add(-R, 0, R, R, 5, R, "stone");
      add(-R, 0, -R, -R, 5, R, "stone"); add(R, 0, -R, R, 5, R, "stone");
    } },
  { key: "smashtowers", title: "Smash Towers", c1: [255, 120, 200], c2: [120, 200, 255], spawn: [0, 1, -13],
    desc: "A giant central tower ringed by shorter ones - drop in with a mace.",
    build: (add, R) => {
      add(-R, -2, -R, R, -1, R, "stoneBrick");
      add(-2, 0, -2, 2, 21, 2, "stoneBrick");
      add(-4, 22, -4, 4, 22, 4, "stoneBrick");
      [[10, 0], [-10, 0], [0, 10], [0, -10], [7, 7], [-7, 7], [7, -7], [-7, -7]].forEach((q, i) =>
        add(q[0] - 1, 0, q[1] - 1, q[0] + 1, 9 + i * 2, q[1] + 1, "stone"));
      add(-R, 0, -R, R, 3, -R, "stone"); add(-R, 0, R, R, 3, R, "stone");
      add(-R, 0, -R, -R, 3, R, "stone"); add(R, 0, -R, R, 3, R, "stone");
    } },
];

const arenas = {};        // ownerId -> { slot, type, center, spawn, ready }
const inArena = {};       // playerId -> ownerId of the arena they are in
const lobbyPos = {};      // playerId -> where they were before entering an arena
const slotBusy = {};      // slot index -> true while used
const buildJobs = [];     // queued builds

function arenaTypeOf(arg) {
  const q = (arg || "").toLowerCase().trim();
  if (!q) return -1;
  const n = parseInt(q, 10);
  if (!isNaN(n) && n >= 1 && n <= ARENA_TYPES.length) return n - 1;
  for (let i = 0; i < ARENA_TYPES.length; i++) {
    const t = ARENA_TYPES[i];
    if (t.key === q || t.title.toLowerCase() === q || t.title.toLowerCase().indexOf(q) === 0) return i;
  }
  return -1;
}

function arenaTitleName(i, extra) {
  const t = ARENA_TYPES[i];
  return gradient(t.title, t.c1, t.c2, extra || BOLD);
}

// Splits a big rectangle into pieces of at most MAX_RECT_BLOCKS blocks.
function pushRect(ops, x1, y1, z1, x2, y2, z2, key) {
  const dx = x2 - x1 + 1, dy = y2 - y1 + 1, dz = z2 - z1 + 1;
  if (dx * dy * dz <= MAX_RECT_BLOCKS) {
    ops.push({ x1: x1, y1: y1, z1: z1, x2: x2, y2: y2, z2: z2, key: key });
  } else if (dx >= dy && dx >= dz) {
    const m = x1 + Math.floor(dx / 2) - 1;
    pushRect(ops, x1, y1, z1, m, y2, z2, key);
    pushRect(ops, m + 1, y1, z1, x2, y2, z2, key);
  } else if (dy >= dz) {
    const m = y1 + Math.floor(dy / 2) - 1;
    pushRect(ops, x1, y1, z1, x2, m, z2, key);
    pushRect(ops, x1, m + 1, z1, x2, y2, z2, key);
  } else {
    const m = z1 + Math.floor(dz / 2) - 1;
    pushRect(ops, x1, y1, z1, x2, y2, m, key);
    pushRect(ops, x1, y1, m + 1, x2, y2, z2, key);
  }
}

function processBuild() {
  let ops = OPS_PER_TICK;
  while (buildJobs.length > 0 && ops > 0) {
    if (typeof api.isNearInterrupt === "function" && api.isNearInterrupt()) return;   // never run out of time budget
    const job = buildJobs[0];
    if (job.i >= job.ops.length) {
      buildJobs.shift();
      sendSafe(() => job.onDone && job.onDone());
      continue;
    }
    const op = job.ops[job.i];
    safeStep("blocks", () => api.setBlockRect([op.x1, op.y1, op.z1], [op.x2, op.y2, op.z2], B[op.key]));
    job.i++;
    ops--;
  }
}

function freeSlot() {
  for (let i = 0; i < 200; i++) if (!slotBusy[i]) return i;
  return -1;
}

function makeOps(center, typeIndex) {
  const ops = [];
  const add = (x1, y1, z1, x2, y2, z2, key) => pushRect(ops,
    center[0] + Math.min(x1, x2), center[1] + Math.min(y1, y2), center[2] + Math.min(z1, z2),
    center[0] + Math.max(x1, x2), center[1] + Math.max(y1, y2), center[2] + Math.max(z1, z2), key);
  add(-ARENA_R - 2, -14, -ARENA_R - 2, ARENA_R + 2, 34, ARENA_R + 2, "air");   // clear the whole volume first
  if (typeIndex >= 0) ARENA_TYPES[typeIndex].build(add, ARENA_R);
  return ops;
}

function sendToLobby(id) {
  const lp = lobbyPos[id];
  delete inArena[id];
  if (lp) sendSafe(() => api.setPosition(id, lp[0], lp[1], lp[2]));
}

// Players standing in an arena that is about to be rebuilt/removed are sent back.
function evacuate(owner) {
  for (const pid of api.getPlayerIds()) {
    if (pid !== owner && inArena[pid] === owner) {
      sendToLobby(pid);
      tell(pid, [seg("The arena owner is rebuilding - you were sent back to the lobby.", "#ffa502", ITALIC)]);
    }
  }
}

function enterArena(id, owner) {
  const a = arenas[owner];
  if (!a || !a.ready) return false;
  if (!inArena[id]) {
    const pos = api.getPosition(id);
    if (pos) lobbyPos[id] = [pos[0], pos[1], pos[2]];
  }
  inArena[id] = owner;
  const jitter = id === owner ? 0 : (Math.random() - 0.5) * 6;
  sendSafe(() => api.setPosition(id, a.spawn[0] + jitter, a.spawn[1], a.spawn[2] + jitter));
  return true;
}

function startArena(id, typeIndex) {
  const existing = arenas[id];
  if (existing && !existing.ready) return tell(id, [seg("Your arena is still being built - one moment!", "#ffa502", ITALIC)]);

  let slot;
  if (existing) { slot = existing.slot; evacuate(id); }
  else {
    slot = freeSlot();
    if (slot < 0) return tell(id, [seg("All arena slots are in use right now.", "#ff6b6b", ITALIC)]);
    slotBusy[slot] = true;
  }

  const t = ARENA_TYPES[typeIndex];
  const center = [ARENA_BASE[0] + slot * ARENA_SPACING, ARENA_BASE[1], ARENA_BASE[2]];
  const spawn = [center[0] + t.spawn[0] + 0.5, center[1] + t.spawn[1], center[2] + t.spawn[2] + 0.5];
  arenas[id] = { slot: slot, type: typeIndex, center: center, spawn: spawn, ready: false };

  tell(id, [seg("Building ", "#9aa0b4", ITALIC)].concat(arenaTitleName(typeIndex, BOLD_ITALIC), [seg(" ...", "#9aa0b4", ITALIC)]));
  refreshArenas(id);
  buildJobs.push({
    ops: makeOps(center, typeIndex), i: 0,
    onDone: () => {
      if (!arenas[id]) return;           // owner left while building
      arenas[id].ready = true;
      enterArena(id, id);
      tell(id, [seg("Arena ready: ", "#7dff7d", BOLD)].concat(arenaTitleName(typeIndex, BOLD_ITALIC),
        [seg("  -  friends can join with !join " + api.getEntityName(id), "#9aa0b4", ITALIC)]));
      refreshArenas(id);
      updateSidebar(id);
    },
  });
}

function removeArena(id) {
  const a = arenas[id];
  if (!a) return;
  evacuate(id);
  delete arenas[id];
  buildJobs.push({
    ops: makeOps(a.center, -1), i: 0,
    onDone: () => { delete slotBusy[a.slot]; },
  });
}

function showArenas(id) {
  tell(id, line());
  tell(id, gradient("  ✦ ARENAS ✦", TITLE_A, TITLE_B, BOLD_ITALIC));
  ARENA_TYPES.forEach((t, i) => {
    tell(id, [seg(" " + (i + 1) + ". ", "#555566", BOLD)].concat(arenaTitleName(i, BOLD_ITALIC), [seg("  " + t.desc, "#6f7690", ITALIC)]));
  });
  tell(id, [seg(" !arena <number|name>  builds YOUR arena      !join <player>  visit one      !lobby  go back", "#9aa0b4", ITALIC)]);
  tell(id, line());
}

function joinArena(id, arg) {
  const q = (arg || "").toLowerCase().trim();
  if (!q) return tell(id, [seg("Usage: !join <player name>", "#ffa502", ITALIC)]);
  for (const owner of Object.keys(arenas)) {
    if (api.getEntityName(owner).toLowerCase().indexOf(q) === 0 && arenas[owner].ready) {
      enterArena(id, owner);
      tell(id, [seg("Joined ", "#7dff7d", BOLD), seg(api.getEntityName(owner) + "'s ", "#ffffff", BOLD)].concat(arenaTitleName(arenas[owner].type, BOLD_ITALIC)));
      updateSidebar(id);
      return;
    }
  }
  tell(id, [seg("No ready arena found for that player.", "#ff6b6b", ITALIC)]);
}

function leaveToLobby(id) {
  if (!inArena[id]) return tell(id, [seg("You are not in an arena.", "#ffa502", ITALIC)]);
  if (!lobbyPos[id]) return tell(id, [seg("No lobby position saved.", "#ff6b6b", ITALIC)]);
  sendToLobby(id);
  tell(id, [seg("Back to the lobby.", "#7dff7d", BOLD)]);
  updateSidebar(id);
}

// ---------------------------------------------------------------------
//  Callbacks
// ---------------------------------------------------------------------
function onPlayerJoin(id) {
  loadData(id);
  setupLobbyBoard(id);
  giveKit(id);
  updateNameTag(id);
  updateLobbyBoard(id);
  updateSidebar(id);
  refreshShop(id);
  tell(id, [seg("Welcome to ", "#9aa0b4", ITALIC)].concat(arenaTitle(), [seg("  -  type !kits to open the kit menu", "#9aa0b4", ITALIC)]));
  // Instructions are shown on every join: the whole guide the first time,
  // then page 1 (the quick start) each time after that.
  const firstTime = !P[id].guide;
  const pages = firstTime ? GUIDE_PAGES.length : GUIDE_PAGES_RETURNING;
  for (let n = 1; n <= pages; n++) showGuide(id, String(n));
  if (firstTime) {
    P[id].guide = true;
    saveData(id);
  }
}

function onPlayerLeave(id) {
  saveData(id);
  removeArena(id);
  delete inArena[id];
  delete lobbyPos[id];
  delete P[id];
  delete S[id];
  delete lastApple[id];
  delete lastSideKey[id];
  delete pendingKit[id];
}

// The game asks where to respawn a player: send them back into their arena.
// (There is no "respawned" callback, so the kit is handed out a moment later from tick.)
const pendingKit = {};
function onRespawnRequest(id) {
  if (!P[id]) loadData(id);
  pendingKit[id] = api.now() + RESPAWN_KIT_DELAY_MS;
  stateOf(id).fall = 0;
  const owner = inArena[id];
  if (owner !== undefined && arenas[owner] && arenas[owner].ready) return arenas[owner].spawn.slice();
  if (LOBBY_SPAWN) return LOBBY_SPAWN.slice();
}

function handlePendingKit(id, now) {
  if (!pendingKit[id] || now < pendingKit[id]) return;
  let alive = true;
  try { alive = api.isAlive(id); } catch (e) {}
  if (!alive) return;                      // still dead - try again next tick
  delete pendingKit[id];
  giveKit(id);
  sendSafe(() => api.applyEffect(id, "Damage Reduction", SPAWN_PROTECTION_MS, { inbuiltLevel: 3 }));
  updateSidebar(id);
}

function onPlayerKilledOtherPlayer(killer, victim) {
  const k = P[killer], v = P[victim];
  const kName = api.getEntityName(killer), vName = api.getEntityName(victim);

  if (k) {
    const before = rankFor(k.kills).name;
    k.kills += 1;
    k.streak += 1;
    if (k.streak > k.best) k.best = k.streak;

    let reward = KILL_COINS + Math.min(k.streak, 10) * STREAK_BONUS;
    let bounty = 0;
    if (v && v.streak >= BOUNTY_STREAK) bounty = v.streak * BOUNTY_PER_STREAK;
    k.coins += reward + bounty;

    tell(killer, [seg("+$" + reward, "#ffe600", BOLD), seg("  (streak " + k.streak + ")", "#ff9a3c", ITALIC)]
      .concat(bounty > 0 ? [seg("   BOUNTY +$" + bounty, "#ff5555", BOLD_ITALIC)] : []));

    if (bounty > 0) {
      shout([seg(kName, "#ffffff", BOLD), seg(" collected a ", "#9aa0b4", ITALIC), seg("$" + bounty + " BOUNTY", "#ff5555", BOLD), seg(" on " + vName + "!", "#9aa0b4", ITALIC)]);
    }
    if (k.streak === BOUNTY_STREAK) {
      shout([seg(kName, "#ffffff", BOLD)].concat(gradient(" now has a BOUNTY on their head!", [255, 60, 60], [255, 170, 60], BOLD_ITALIC)));
    } else if (k.streak === 10 || (k.streak > 10 && k.streak % 5 === 0)) {
      shout([seg(kName, "#ffffff", BOLD)].concat(gradient(" is on a " + k.streak + " KILL STREAK!", [255, 120, 0], [255, 230, 60], BOLD_ITALIC)));
    }

    const after = rankFor(k.kills);
    if (after.name !== before) {
      k.coins += RANKUP_COINS;
      shout([seg(kName, "#ffffff", BOLD), seg(" ranked up to ", "#9aa0b4", ITALIC)].concat(rankSegs(after, BOLD_ITALIC), [seg("!", "#9aa0b4", BOLD)]));
      tell(killer, [seg("Rank up bonus: +$" + RANKUP_COINS, "#ffe600", BOLD)]);
      sendSafe(() => api.playSound(killer, "cashRegister", 1, 1));
    }
    saveData(killer);
    updateNameTag(killer);
    updateLobbyBoard(killer);
    updateSidebar(killer);
    refreshMoney(killer);              // new balance -> new prices you can afford in the menu
  }

  if (v) {
    if (v.streak >= BOUNTY_STREAK) {
      shout([seg(vName, "#ffffff", BOLD), seg("'s " + v.streak + " streak was ended by ", "#9aa0b4", ITALIC), seg(kName, "#ffffff", BOLD), seg("!", "#9aa0b4", ITALIC)]);
    }
    v.deaths += 1;
    v.streak = 0;
    saveData(victim);
    updateLobbyBoard(victim);
    updateSidebar(victim);
    refreshProfile(victim);
  }
  return "keepInventory";              // players keep their kit when they die
}

// Right-click: mace launch / Crucible launch / Wind Charge
function onPlayerAltAction(id) {
  const held = heldInfo(id);
  if (!held) return;
  if (held.tags.arenaMace || held.tags.arenaCrucible) maceLaunch(id);
  else if (held.tags.arenaWind) useWindCharge(id, held.item);
}

function onPlayerDamagingOtherPlayer(attacker, victim, dmg) {
  const held = heldInfo(attacker);
  if (!held) return;
  let result = dmg;
  if (held.tags.arenaMace) result = maceSmash(attacker, victim, dmg);
  else if (held.tags.arenaCrucible) result = crucibleHit(dmg);
  if (result !== dmg) return result;
}

// Runs one part of the tick; an error in it is reported once (so we can see which
// part failed) and never stops the other parts.
const reportedSteps = {};
function safeStep(name, fn) {
  try {
    fn();
  } catch (e) {
    if (!reportedSteps[name]) {
      reportedSteps[name] = true;
      sendSafe(() => api.broadcastMessage("[ARENA] tick step '" + name + "' failed: " + e, { color: "#ff6b6b" }));
    }
  }
}

let lastSidebar = 0;
function tick() {
  safeStep("build", processBuild);
  const ids = api.getPlayerIds();
  const now = api.now();
  for (const id of ids) {
    safeStep("fall", () => trackFall(id));
    safeStep("apple", () => checkApple(id));
    safeStep("respawn", () => handlePendingKit(id, now));
  }
  if (now - lastSidebar >= SIDEBAR_REFRESH_MS) {
    lastSidebar = now;
    for (const id of ids) safeStep("sidebar", () => updateSidebar(id));
  }
}

function onPlayerChat(id, msg) {
  if (typeof msg !== "string" || !msg.startsWith("!")) return;
  if (!P[id]) loadData(id);

  const parts = msg.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  if (cmd === "!kits" || cmd === "!kit" || cmd === "!menu") openMenu(id, CAT.kits);
  else if (cmd === "!shop") openMenu(id, CAT.extras);
  else if (cmd === "!kitlist") showKitsText(id);
  else if (cmd === "!buy") {
    const kitKey = resolveKey(arg, KIT_ORDER, KITS);
    const itemKey = resolveKey(arg, SHOP_ORDER, SHOP);
    if (kitKey) { buyOrEquipKit(id, kitKey); refreshMoney(id); }
    else if (itemKey) { buyExtra(id, itemKey); refreshMoney(id); }
    else tell(id, [seg("Unknown kit or item. Open the menu with !kits.", "#ff6b6b", ITALIC)]);
  }
  else if (cmd === "!equip") {
    const key = resolveKey(arg, KIT_ORDER, KITS);
    if (!key) tell(id, [seg("Unknown kit. Open the menu with !kits.", "#ff6b6b", ITALIC)]);
    else if (P[id].owned.indexOf(key) === -1) tell(id, [seg("You don't own that kit yet - open !kits to buy it.", "#ff6b6b", ITALIC)]);
    else { equipKit(id, key); refreshMoney(id); }
  }
  else if (cmd === "!enchant") { enchantHeld(id); refreshMoney(id); }
  else if (cmd === "!top" || cmd === "!lb" || cmd === "!leaderboard") showTop(id, arg);
  else if (cmd === "!stats") { showStats(id); }
  else if (cmd === "!arenas") openMenu(id, CAT.arenas);
  else if (cmd === "!arena") {
    const idx = arenaTypeOf(arg);
    if (!arg) openMenu(id, CAT.arenas);
    else if (idx < 0) tell(id, [seg("Unknown arena. Type !arenas to see all 10.", "#ff6b6b", ITALIC)]);
    else startArena(id, idx);
  }
  else if (cmd === "!join") joinArena(id, arg);
  else if (cmd === "!lobby" || cmd === "!leave") leaveToLobby(id);
  else if (cmd === "!guide" || cmd === "!howto" || cmd === "!tutorial") showGuide(id, arg);
  else if (cmd === "!help") showHelp(id);
  else return;
  return false;
}
