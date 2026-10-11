// =====================================================================
//  ✦ ARENA PVP ✦  -  world code  (v2)
//
//  • 14 buyable kits: Wood, Fur, Stone, Iron, Gold, Spiked, Diamond, Knight,
//    Golem, Moonstone, Amethite, Rubellite, Magmasteel, Serpentite
//    (full armour + tools + a MACE with Windburst & Density)
//  • Shop: Crucible mace (Breach), Wind Charges, Golden Apples
//  • Enchanting, 28 kill ranks, kill streaks, bounties, coins
//  • Lobby leaderboard + live top-3 in a styled gradient sidebar
//  • 10 generated arena types - build your own, friends !join it
//
//  Commands: !kits  !buy <kit|item>  !equip <kit>  !shop  !enchant
//            !top [kills|coins|streak]  !stats  !help
//            !arenas  !arena <n|name>  !join <player>  !lobby  !guide [1-5]
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
const SIDEBAR_REFRESH_MS = 1000;
const SAVE_SLOT = 21;                // moonstone chest slot used for saving

const ARMOR_PIECES = ["Helmet", "Chestplate", "Gauntlets", "Leggings", "Boots"];
const TOOL_PIECES = ["Sword", "Axe", "Pickaxe", "Spade"];

// Each kit: item-name prefixes to try in order, mace names to try, price,
// and the two colours of its gradient. Cheapest first = progression order.
const KITS = {
  wood:       { title: "Wood",       prefixes: ["Wood"],                       maces: ["Wood Mace"],                      price: 0,     c1: [170, 120, 60],  c2: [225, 185, 115] },
  fur:        { title: "Fur",        prefixes: ["Fur"],                        maces: ["Wood Mace"],                      price: 150,   c1: [190, 150, 110], c2: [245, 230, 205] },
  stone:      { title: "Stone",      prefixes: ["Stone"],                      maces: ["Stone Mace"],                     price: 300,   c1: [135, 140, 150], c2: [205, 210, 220] },
  iron:       { title: "Iron",       prefixes: ["Iron"],                       maces: ["Iron Mace", "Stone Mace"],        price: 500,   c1: [215, 215, 225], c2: [120, 130, 150] },
  gold:       { title: "Gold",       prefixes: ["Gold"],                       maces: ["Gold Mace"],                      price: 800,   c1: [255, 200, 0],   c2: [255, 240, 130] },
  spiked:     { title: "Spiked",     prefixes: ["Spiked"],                     maces: ["Iron Mace"],                      price: 1100,  c1: [170, 170, 185], c2: [255, 80, 80] },
  diamond:    { title: "Diamond",    prefixes: ["Diamond"],                    maces: ["Diamond Mace"],                   price: 1600,  c1: [60, 220, 255],  c2: [175, 255, 255] },
  knight:     { title: "Knight",     prefixes: ["Knight"],                     maces: ["Diamond Mace"],                   price: 2300,  c1: [110, 135, 205], c2: [215, 225, 255] },
  golem:      { title: "Golem",      prefixes: ["Golem"],                      maces: ["Diamond Mace"],                   price: 3200,  c1: [185, 120, 70],  c2: [120, 205, 125] },
  moonstone:  { title: "Moonstone",  prefixes: ["Moonstone"],                  maces: ["Moonstone Mace"],                 price: 4500,  c1: [150, 130, 255], c2: [230, 220, 255] },
  amethite:   { title: "Amethite",   prefixes: ["Kingly Amethite", "Amethite"], maces: ["Moonstone Mace", "Diamond Mace"], price: 6000,  c1: [190, 90, 255],  c2: [255, 150, 235] },
  rubellite:  { title: "Rubellite",  prefixes: ["Rubellite", "Kingly Rubellite"], maces: ["Moonstone Mace", "Diamond Mace"], price: 8000, c1: [255, 50, 90],   c2: [255, 165, 135] },
  magmasteel: { title: "Magmasteel", prefixes: ["Magmasteel", "Kingly Magmasteel"], maces: ["Moonstone Mace", "Diamond Mace"], price: 11000, c1: [255, 110, 0], c2: [255, 230, 60] },
  serpentite: { title: "Serpentite", prefixes: ["Serpentite", "Serpentine", "Kingly Serpentite"], maces: ["Moonstone Mace", "Diamond Mace"], price: 15000, c1: [40, 255, 150], c2: [40, 190, 255] },
};
const KIT_ORDER = ["wood", "fur", "stone", "iron", "gold", "spiked", "diamond", "knight", "golem", "moonstone", "amethite", "rubellite", "magmasteel", "serpentite"];
const FIRST_KIT = "wood";

// Shop extras
const SHOP = {
  crucible:   { title: "Crucible Mace", price: 2500, once: true,  desc: "Breach mace - ignores armour. Given every spawn.", c1: [255, 70, 70], c2: [255, 190, 90] },
  windcharge: { title: "Wind Charges",  price: 150,  once: false, desc: "x8 - right-click to launch yourself and blast foes away.", c1: [120, 230, 255], c2: [190, 255, 220] },
  apples:     { title: "Golden Apples", price: 100,  once: false, desc: "x16 - eat for a burst of Speed, Strength and Resistance.", c1: [255, 215, 0], c2: [255, 160, 40] },
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
  breachPerPiece: 0.2,     // Crucible: +20% damage per armour piece the victim wears
};

// Wind charge item tuning
const WIND = {
  items: ["Iron Fragment", "Iron Fragments"],
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

// Gradient colour pairs for stat values and labels
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

// One coloured segment per character, fading from c1 to c2.
function gradient(text, c1, c2, extra) {
  const out = [];
  const n = Math.max(1, text.length - 1);
  for (let i = 0; i < text.length; i++) {
    out.push({ str: text[i], style: Object.assign({ color: mix(c1, c2, i / n) }, extra || {}) });
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

// Sends styled text; falls back to plain text if the game rejects the array form.
function tell(playerId, segs) {
  try {
    api.sendMessage(playerId, segs);
  } catch (e) {
    try { api.sendMessage(playerId, plain(segs), { color: "white" }); } catch (e2) {}
  }
}

function shout(segs) {
  try {
    api.broadcastMessage(segs);
  } catch (e) {
    try { api.broadcastMessage(plain(segs), { color: "white" }); } catch (e2) {}
  }
}

function kitName(key, extra) {
  const k = KITS[key];
  return gradient(k.title, k.c1, k.c2, extra || BOLD);
}

function shopName(key, extra) {
  const s = SHOP[key];
  return gradient(s.title, s.c1, s.c2, extra || BOLD);
}

// Gradient text from a named pair in GRAD (bold by default)
function gseg(text, key, extra) {
  const pair = GRAD[key] || GRAD.white;
  return gradient(String(text), pair[0], pair[1], extra || BOLD);
}

function line() { return [seg("────────────────────────", "#555566")]; }

function arenaTitle(prefix) {
  return gradient((prefix || "") + "✦ ARENA PVP ✦", TITLE_A, TITLE_B, BOLD_ITALIC);
}

function sendSafe(fn) { try { fn(); } catch (e) {} }

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
      // keep only kits that still exist; old "starter" becomes the first kit
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

function rankSegs(rank, extra) {
  return gradient(rank.name, rank.c1, rank.c2, extra || BOLD);
}

function nextRankInfo(kills) {
  for (const entry of RANKS) {
    if (kills < entry[0]) return { name: entry[1], need: entry[0] - kills };
  }
  return null;
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

function kdOf(d) {
  return d.deaths > 0 ? (d.kills / d.deaths).toFixed(2) : d.kills.toFixed(2);
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
      [seg("  ", "#ffffff")], gseg(r.value, i === 0 ? "gold" : "white")));
  });
  tell(id, line());
}

// ---------------------------------------------------------------------
//  Sidebar
// ---------------------------------------------------------------------
function statLine(label, value, gradKey) {
  return [seg(label + " ", "#9aa0b4", ITALIC)].concat(gseg(value, gradKey), [seg("\n", "#ffffff")]);
}

function updateSidebar(id) {
  const d = P[id];
  if (!d) return;
  const rank = rankFor(d.kills);
  const next = nextRankInfo(d.kills);

  let segs = [];
  segs = segs.concat(arenaTitle());
  segs.push(seg("\n", "#ffffff"));
  segs.push(seg("Rank ", "#9aa0b4", ITALIC));
  segs = segs.concat(rankSegs(rank, BOLD_ITALIC), [seg("\n", "#ffffff")]);
  segs = segs.concat(statLine("Kills", d.kills, "green"));
  segs = segs.concat(statLine("Deaths", d.deaths, "red"));
  segs = segs.concat(statLine("K/D", kdOf(d), "orange"));
  segs = segs.concat(statLine("Streak", d.streak + " (best " + d.best + ")", "orange"));
  segs = segs.concat(statLine("Coins", "$" + d.coins, "gold"));
  segs.push(seg("Kit ", "#9aa0b4", ITALIC));
  segs = segs.concat(kitName(d.kit, BOLD_ITALIC));
  segs.push(seg("\n", "#ffffff"));
  const where = inArena[id] !== undefined && arenas[inArena[id]] ? arenas[inArena[id]].type : -1;
  segs.push(seg("Arena ", "#9aa0b4", ITALIC));
  segs = segs.concat(where >= 0 ? arenaTitleName(where, BOLD_ITALIC) : [seg("Lobby", "#9aa0b4", BOLD_ITALIC)], [seg("\n", "#ffffff")]);
  if (next) segs.push(seg("Next: " + next.name + " in " + next.need + "\n", "#6f7690", ITALIC));

  segs = segs.concat(gradient("— TOP KILLERS —", [255, 215, 0], [255, 140, 60], BOLD));
  segs.push(seg("\n", "#ffffff"));
  topBy("kills", 3).forEach((r, i) => {
    segs.push(seg("#" + (i + 1) + " ", PODIUM[i], BOLD));
    segs = segs.concat(gradient(r.name, [255, 255, 255], [185, 195, 230], ITALIC));
    segs.push(seg(" ", "#ffffff"));
    segs = segs.concat(gseg(r.value, i === 0 ? "gold" : "white"), [seg("\n", "#ffffff")]);
  });

  sendSafe(() => api.setClientOption(id, "RightInfoText", segs));
}

// ---------------------------------------------------------------------
//  Kits and items
// ---------------------------------------------------------------------
// Tries every name until the game accepts one. Returns true on success.
function giveFirst(id, names, amount, attrs) {
  for (const name of names) {
    try {
      api.giveItem(id, name, amount, attrs);
      return true;
    } catch (e) {}
  }
  return false;
}

function giveKit(id) {
  const d = P[id];
  if (!d) return;
  sendSafe(() => api.clearInventory(id));
  const k = KITS[d.kit];
  const failed = [];

  ARMOR_PIECES.concat(TOOL_PIECES).forEach(piece => {
    const names = k.prefixes.map(p => p + " " + piece);
    if (!giveFirst(id, names, 1, { customDisplayName: "✦ " + k.title + " " + piece })) failed.push(piece);
  });

  // The kit mace: Windburst + Density
  if (!giveFirst(id, k.maces, 1, {
    customDisplayName: "✦ " + k.title + " Mace",
    customDescription: "Windburst + Density. Smash from above. Right-click to launch.",
    customAttributes: { arenaMace: true },
  })) failed.push("Mace");

  // Bought Crucible
  if (d.crucible) {
    if (!giveFirst(id, ["Moonstone Mace", "Diamond Mace"], 1, {
      customDisplayName: "Crucible",
      customDescription: "Breach - ignores armour. Right-click to launch.",
      customAttributes: { arenaCrucible: true },
    })) failed.push("Crucible");
  }

  giveWindCharges(id, 4);
  giveApples(id, 8);
  sendSafe(() => api.giveItem(id, "Cornbread", 32));

  if (failed.length > 0) {
    tell(id, [seg("Could not give: " + failed.join(", ") + " (item name not recognised).", "#ff6b6b", ITALIC)]);
  }
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
//  Menus (chat)
// ---------------------------------------------------------------------
function showKits(id) {
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
  tell(id, [seg(" Coins: ", "#9aa0b4", ITALIC), seg("$" + d.coins, "#ffe600", BOLD),
            seg("   |   !shop for extras, !enchant to enchant your held item", "#6f7690", ITALIC)]);
  tell(id, line());
}

function showShop(id) {
  const d = P[id];
  tell(id, line());
  tell(id, gradient("  ✦ SHOP ✦", TITLE_A, TITLE_B, BOLD_ITALIC));
  SHOP_ORDER.forEach(key => {
    const s = SHOP[key];
    const have = s.once && d[key];
    const status = have ? seg("  ✔ owned", "#7dff7d", BOLD)
      : seg("  $" + s.price + "  (!buy " + key + ")", d.coins >= s.price ? "#ffe600" : "#ff6b6b", BOLD);
    tell(id, [seg(" • ", "#555566")].concat(shopName(key, BOLD_ITALIC), [status]));
    tell(id, [seg("     " + s.desc, "#6f7690", ITALIC)]);
  });
  tell(id, line());
}

function showHelp(id) {
  tell(id, line());
  tell(id, arenaTitle("  "));
  [["!kits", "open the kit menu (14 kits)"], ["!buy <kit|item>", "buy a kit or shop item"], ["!equip <kit>", "switch kit (applies now)"],
   ["!shop", "Crucible, Wind Charges, Golden Apples"], ["!enchant", "enchant the item in your hand"],
   ["!top [kills|coins|streak]", "live leaderboard"], ["!stats", "show your stats"],
   ["!guide [1-5]", "step-by-step instructions"], ["!arenas", "pick from 10 arena types"], ["!arena <n|name>", "build your own arena"], ["!join <player>", "visit a friend's arena"], ["!lobby", "leave the arena"]].forEach(c => {
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
    [lab("   Kills ")], gseg(d.kills, "green"),
    [lab("   Deaths ")], gseg(d.deaths, "red"),
    [lab("   K/D ")], gseg(kdOf(d), "orange")));
  tell(id, [lab(" Coins ")].concat(gseg("$" + d.coins, "gold"),
    [lab("   Best streak ")], gseg(d.best, "orange"),
    [lab("   Enchants ")], gseg(d.enchants, "purple")));
  tell(id, line());
}

// ---------------------------------------------------------------------
//  PART 2 - IN-GAME INSTRUCTIONS  (!guide, shown automatically to new players)
// ---------------------------------------------------------------------
const GUIDE_PAGES = [
  { title: "Getting Started", c1: [255, 80, 200], c2: [255, 190, 120], lines: [
    ["Welcome to ", "✦ ARENA PVP ✦", " - fight, earn coins, climb the ranks."],
    ["1. ", "Fight players", " to earn coins ($30 + a streak bonus per kill)."],
    ["2. ", "!kits", " shows 14 kits. Buy better armour and weapons with your coins."],
    ["3. ", "!equip <kit>", " puts a kit on right away. You keep it after dying."],
    ["4. ", "!arena", " builds a private arena - friends can come in with !join."],
    ["Tip: ", "!help", " lists every command, !guide <1-5> pages through this guide."],
  ] },
  { title: "Kits & Shop", c1: [255, 215, 0], c2: [255, 140, 40], lines: [
    ["Kits go from ", "Wood", " (free) up to Amethite, Rubellite, Magmasteel and Serpentite."],
    ["Every kit is a full set: ", "5 armour pieces", ", Sword, Axe, Pickaxe, Spade and a Mace."],
    ["!buy <kit> ", "buys it once", " and it is yours forever (saved between sessions)."],
    ["!shop ", "sells extras", ": the Crucible mace, Wind Charges and Golden Apples."],
    ["!enchant ", "upgrades the item in your hand", " up to Tier 5 (Tier 1 = $250, Tier 5 = $1250)."],
    ["Armour gets ", "Protection + Health", ", weapons get Damage + Attack Speed."],
  ] },
  { title: "Combat & Maces", c1: [255, 120, 0], c2: [255, 230, 60], lines: [
    ["Maces: ", "fall onto a player", " (1.5+ blocks) and hit them for a SMASH."],
    ["A smash adds ", "Density damage", " per block fallen, launches YOU upward (Windburst) and knocks back everyone near."],
    ["Right-click a mace: ", "launch yourself", " into the air (4 second cooldown)."],
    ["Crucible: ", "Breach", " - deals extra damage for every armour piece your target wears."],
    ["Wind Charge: ", "right-click", " to launch yourself and blast nearby players away."],
    ["Golden Apple: ", "eat it fully", " for 8 seconds of Speed, Strength, Resistance and Regen."],
  ] },
  { title: "Arenas", c1: [120, 220, 255], c2: [190, 255, 220], lines: [
    ["!arenas ", "lists 10 arena types", ": Colosseum, Sky Islands, Lava Pit, Frozen Lake, Desert Ruins,"],
    ["Glass Cage, Nether Fortress, Pillar Forest, King's Pit and Smash Towers.", "", ""],
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
    ["The ", "sidebar", " shows your rank, stats, kit, arena and the top 3 killers."],
    ["Your coins, kills, kits and enchants ", "are saved", " - they are still there next time you join."],
  ] },
];

function showGuide(id, arg) {
  let n = parseInt((arg || "1").trim(), 10);
  if (isNaN(n)) n = 1;
  n = Math.max(1, Math.min(GUIDE_PAGES.length, n));
  const page = GUIDE_PAGES[n - 1];

  tell(id, line());
  tell(id, gradient("  ✦ GUIDE ✦  " + page.title + "  (" + n + "/" + GUIDE_PAGES.length + ")", page.c1, page.c2, BOLD_ITALIC));
  page.lines.forEach(l => {
    tell(id, [seg(" " + l[0], "#9aa0b4", ITALIC), seg(l[1], "#7dd3ff", BOLD), seg(l[2], "#9aa0b4", ITALIC)]);
  });
  tell(id, [seg(n < GUIDE_PAGES.length ? " Next page: !guide " + (n + 1) : " That is everything - good luck out there!", "#6f7690", ITALIC)]);
  tell(id, line());
}

// ---------------------------------------------------------------------
//  Buy / equip / enchant
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

function buy(id, arg) {
  const d = P[id];
  const kitKey = resolveKey(arg, KIT_ORDER, KITS);
  const itemKey = resolveKey(arg, SHOP_ORDER, SHOP);

  if (kitKey) {
    if (d.owned.indexOf(kitKey) !== -1) return tell(id, [seg("You already own that kit - use !equip " + kitKey + ".", "#ffa502", ITALIC)]);
    if (!spend(id, KITS[kitKey].price)) return;
    d.owned.push(kitKey);
    bought(id);
    return tell(id, [seg("Bought ", "#7dff7d", BOLD)].concat(kitName(kitKey, BOLD_ITALIC), [seg("!  Use !equip " + kitKey + " to wear it.", "#7dff7d", BOLD)]));
  }

  if (itemKey) {
    const s = SHOP[itemKey];
    if (s.once && d[itemKey]) return tell(id, [seg("You already own that.", "#ffa502", ITALIC)]);
    if (!spend(id, s.price)) return;

    if (itemKey === "crucible") {
      d.crucible = true;
      giveFirst(id, ["Moonstone Mace", "Diamond Mace"], 1, {
        customDisplayName: "Crucible",
        customDescription: "Breach - ignores armour. Right-click to launch.",
        customAttributes: { arenaCrucible: true },
      });
    } else if (itemKey === "windcharge") {
      giveWindCharges(id, 8);
    } else if (itemKey === "apples") {
      giveApples(id, 16);
    }
    bought(id);
    return tell(id, [seg("Bought ", "#7dff7d", BOLD)].concat(shopName(itemKey, BOLD_ITALIC), [seg("!", "#7dff7d", BOLD)]));
  }

  tell(id, [seg("Unknown kit or item. Try !kits or !shop.", "#ff6b6b", ITALIC)]);
}

function equipKit(id, arg) {
  const d = P[id];
  const key = resolveKey(arg, KIT_ORDER, KITS);
  if (!key) return tell(id, [seg("Unknown kit. Type !kits to see the menu.", "#ff6b6b", ITALIC)]);
  if (d.owned.indexOf(key) === -1) return tell(id, [seg("You don't own that kit yet - !buy " + key, "#ff6b6b", ITALIC)]);

  d.kit = key;
  saveData(id);
  giveKit(id);
  updateSidebar(id);
  tell(id, [seg("Equipped ", "#7dff7d", BOLD)].concat(kitName(key, BOLD_ITALIC), [seg(".", "#7dff7d", BOLD)]));
}

function itemClass(itemName) {
  const last = itemName.split(" ").pop();
  if (ARMOR_PIECES.indexOf(last) !== -1) return "armor";
  if (last === "Sword" || last === "Axe" || last === "Mace") return "weapon";
  return null;
}

function enchantHeld(id) {
  const d = P[id];
  const slot = api.getSelectedInventorySlotI(id);
  const item = api.getItemSlot(id, slot);
  if (!item) return tell(id, [seg("Hold the armour piece or weapon you want to enchant.", "#ffa502", ITALIC)]);

  const cls = itemClass(item.name);
  if (!cls) return tell(id, [seg("You can only enchant armour, swords, axes and maces.", "#ff6b6b", ITALIC)]);

  const attrs = (item.attributes && item.attributes.customAttributes) || {};
  const m = /Tier (\d+)/.exec(attrs.enchantmentTier || "");
  const current = m ? parseInt(m[1], 10) : 0;
  if (current >= MAX_ENCHANT_TIER) return tell(id, [seg("That item is already max tier!", "#c58cff", BOLD)]);

  const next = current + 1;
  const cost = ENCHANT_COST_PER_TIER * next;
  if (d.coins < cost) return tell(id, [seg("Enchanting to Tier " + next + " costs $" + cost + " - you have $" + d.coins + ".", "#ff6b6b", BOLD)]);

  const enchantments = cls === "armor"
    ? { "Protection": next, "Health": next }
    : { "Damage": next, "Attack Speed": next };

  // Keep the item's own tags (arenaMace etc.) and just add the enchant.
  const newAttrs = {
    customDisplayName: item.attributes && item.attributes.customDisplayName,
    customDescription: item.attributes && item.attributes.customDescription,
    customAttributes: Object.assign({}, attrs, { enchantments: enchantments, enchantmentTier: "Tier " + next }),
  };

  d.coins -= cost;
  d.enchants += 1;
  try {
    api.setItemSlot(id, slot, item.name, item.amount, newAttrs, true);
  } catch (e) {
    d.coins += cost;
    d.enchants -= 1;
    return tell(id, [seg("The game rejected that enchant, you were not charged.", "#ff6b6b", ITALIC)]);
  }
  saveData(id);
  updateSidebar(id);
  tell(id, [seg("Enchanted to ", "#c58cff", BOLD)].concat(gradient("Tier " + next, [190, 90, 255], [255, 150, 235], BOLD_ITALIC),
            [seg(" for $" + cost + "!", "#c58cff", BOLD)]));
  sendSafe(() => api.playSound(id, "levelup", 1, 1.2));
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

function countArmorPieces(id) {
  try {
    return api.getArmorItems(id).filter(Boolean).length;
  } catch (e) {
    return 4;   // can't read armour: assume a full set
  }
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

// Crucible: Breach - each armour piece on the victim gives damage back.
function crucibleHit(victim, dmg) {
  return Math.round(dmg + dmg * MACE.breachPerPiece * countArmorPieces(victim));
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
//  (a few operations per tick) so the server never freezes.
// ---------------------------------------------------------------------
const ARENA_BASE = [0, 150, 0];    // x, floor-level y, z of arena slot 0 - pick open sky/void space in your world
const ARENA_SPACING = 70;          // distance between players' arenas (along x)
const ARENA_R = 16;                // arena radius (arena is 33 x 33)
const OPS_PER_TICK = 6;            // block-rectangle operations per tick
const BLOCKS_PER_TICK = 4000;      // fallback: single blocks per tick when setBlockRect is missing

// Block names to try, in order, for each material (the first the game accepts is used).
const B = {
  air:        ["Air"],
  stone:      ["Stone"],
  stoneBrick: ["Stone Bricks", "Stone Brick", "Stone"],
  planks:     ["Maple Wood Planks", "Wood Planks", "Planks", "Stone"],
  lava:       ["Lava"],
  ice:        ["Ice", "Snow", "Stone"],
  snow:       ["Snow", "Ice", "Stone"],
  sand:       ["Sand", "Sandstone", "Stone"],
  sandstone:  ["Sandstone", "Sand", "Stone"],
  glass:      ["Glass", "Stone"],
  obsidian:   ["Obsidian", "Stone"],
  grass:      ["Grass Block", "Grass", "Dirt", "Stone"],
  gold:       ["Gold Block", "Gold", "Stone"],
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
const resolvedBlock = {}; // material key -> block name that worked

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

// Picks the first block name from B[key] the game accepts (tested at a probe position).
function blockFor(key, probe) {
  if (resolvedBlock[key]) return resolvedBlock[key];
  const cands = B[key] || B.stone;
  if (cands.length === 1) return (resolvedBlock[key] = cands[0]);
  for (const name of cands) {
    try {
      api.setBlock(probe[0], probe[1], probe[2], name);
      if (api.getBlock(probe[0], probe[1], probe[2]) === name) {
        api.setBlock(probe[0], probe[1], probe[2], "Air");
        return (resolvedBlock[key] = name);
      }
    } catch (e) {}
  }
  sendSafe(() => api.setBlock(probe[0], probe[1], probe[2], "Air"));
  return (resolvedBlock[key] = cands[cands.length - 1]);
}

function processBuild() {
  let ops = OPS_PER_TICK, budget = BLOCKS_PER_TICK;
  const hasRect = typeof api.setBlockRect === "function";
  while (buildJobs.length > 0 && ops > 0 && budget > 0) {
    const job = buildJobs[0];
    if (job.i >= job.ops.length) {
      buildJobs.shift();
      sendSafe(() => job.onDone && job.onDone());
      continue;
    }
    const op = job.ops[job.i];
    const name = blockFor(op.key, job.probe);
    if (hasRect) {
      sendSafe(() => api.setBlockRect([op.x1, op.y1, op.z1], [op.x2, op.y2, op.z2], name));
      job.i++; ops--;
      continue;
    }
    if (!op.cur) op.cur = { x: op.x1, y: op.y1, z: op.z1 };
    const c = op.cur;
    while (budget > 0 && !op.done) {
      sendSafe(() => api.setBlock(c.x, c.y, c.z, name));
      budget--;
      c.z++;
      if (c.z > op.z2) { c.z = op.z1; c.y++; if (c.y > op.y2) { c.y = op.y1; c.x++; if (c.x > op.x2) op.done = true; } }
    }
    if (op.done) { job.i++; ops--; }
  }
}

function freeSlot() {
  for (let i = 0; i < 200; i++) if (!slotBusy[i]) return i;
  return -1;
}

function makeOps(center, typeIndex) {
  const ops = [];
  const add = (x1, y1, z1, x2, y2, z2, key) => ops.push({
    x1: center[0] + Math.min(x1, x2), x2: center[0] + Math.max(x1, x2),
    y1: center[1] + Math.min(y1, y2), y2: center[1] + Math.max(y1, y2),
    z1: center[2] + Math.min(z1, z2), z2: center[2] + Math.max(z1, z2),
    key: key,
  });
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
  buildJobs.push({
    ops: makeOps(center, typeIndex), i: 0, probe: [center[0], center[1] - 6, center[2]],
    onDone: () => {
      if (!arenas[id]) return;           // owner left while building
      arenas[id].ready = true;
      enterArena(id, id);
      tell(id, [seg("Arena ready: ", "#7dff7d", BOLD)].concat(arenaTitleName(typeIndex, BOLD_ITALIC),
        [seg("  -  friends can join with !join " + api.getEntityName(id), "#9aa0b4", ITALIC)]));
      updateSidebar(id);
    },
  });
}

function removeArena(id) {
  const a = arenas[id];
  if (!a) return;
  evacuate(id);
  delete arenas[id];
  const probeY = a.center[1] - 6;
  buildJobs.push({
    ops: makeOps(a.center, -1), i: 0, probe: [a.center[0], probeY, a.center[2]],
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
  sendSafe(() => api.setClientOption(id, "skyBox", "space_lightblue"));
  setupLobbyBoard(id);
  giveKit(id);
  updateNameTag(id);
  updateLobbyBoard(id);
  updateSidebar(id);
  tell(id, [seg("Welcome to ", "#9aa0b4", ITALIC)].concat(arenaTitle(), [seg("  -  type !help or !guide", "#9aa0b4", ITALIC)]));
  if (!P[id].guide) {            // first time here: show the instructions once
    P[id].guide = true;
    saveData(id);
    showGuide(id, "1");
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
}

function onPlayerRespawn(id) {
  if (!P[id]) loadData(id);
  giveKit(id);
  stateOf(id).fall = 0;
  const owner = inArena[id];
  if (owner !== undefined && arenas[owner] && arenas[owner].ready) enterArena(id, owner);
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
  }
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
  else if (held.tags.arenaCrucible) result = crucibleHit(victim, dmg);
  if (result !== dmg) return result;
}

let lastSidebar = 0;
function tick() {
  processBuild();
  const ids = api.getPlayerIds();
  for (const id of ids) {
    trackFall(id);
    checkApple(id);
  }
  const now = api.now();
  if (now - lastSidebar >= SIDEBAR_REFRESH_MS) {
    lastSidebar = now;
    for (const id of ids) updateSidebar(id);
  }
}

function onPlayerChat(id, msg) {
  if (!msg.startsWith("!")) return;
  if (!P[id]) loadData(id);

  const parts = msg.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  if (cmd === "!kits" || cmd === "!kit" || cmd === "!menu") showKits(id);
  else if (cmd === "!shop") showShop(id);
  else if (cmd === "!buy") buy(id, arg);
  else if (cmd === "!equip") equipKit(id, arg);
  else if (cmd === "!enchant") enchantHeld(id);
  else if (cmd === "!top" || cmd === "!lb" || cmd === "!leaderboard") showTop(id, arg);
  else if (cmd === "!stats") showStats(id);
  else if (cmd === "!arenas") showArenas(id);
  else if (cmd === "!arena") {
    const idx = arenaTypeOf(arg);
    if (!arg) showArenas(id);
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
