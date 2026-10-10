// =====================================================================
//  ✦ ARENA PVP ✦  -  world code  (v2)
//
//  • 14 buyable kits: Wood, Fur, Stone, Iron, Gold, Spiked, Diamond, Knight,
//    Golem, Moonstone, Amethite, Rubellite, Magmasteel, Serpentite
//    (full armour + tools + a MACE with Windburst & Density)
//  • Shop: Crucible mace (Breach), Wind Charges, Golden Apples
//  • Enchanting, 28 kill ranks, kill streaks, bounties, coins
//  • Lobby leaderboard + live top-3 in a styled gradient sidebar
//
//  Commands: !kits  !buy <kit|item>  !equip <kit>  !shop  !enchant
//            !top [kills|coins|streak]  !stats  !help
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
  return { kills: 0, deaths: 0, coins: START_COINS, streak: 0, best: 0, owned: [FIRST_KIT], kit: FIRST_KIT, enchants: 0, crucible: false };
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
   ["!top [kills|coins|streak]", "live leaderboard"], ["!stats", "show your stats"]].forEach(c => {
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
  tell(id, [seg("Welcome to ", "#9aa0b4", ITALIC)].concat(arenaTitle(), [seg("  -  type !help", "#9aa0b4", ITALIC)]));
}

function onPlayerLeave(id) {
  saveData(id);
  delete P[id];
  delete S[id];
  delete lastApple[id];
}

function onPlayerRespawn(id) {
  if (!P[id]) loadData(id);
  giveKit(id);
  stateOf(id).fall = 0;
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
  else if (cmd === "!help") showHelp(id);
  else return;
  return false;
}
