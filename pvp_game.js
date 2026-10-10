// =====================================================================
//  ✦ ARENA PVP ✦  -  world code
//  Kits (Iron / Amethite / Rubellite / Magmasteel / Serpentite) you BUY with
//  coins, enchanting, ranks, kill streaks and a styled gradient sidebar.
//
//  Commands:  !kits  !buy <kit>  !equip <kit>  !enchant  !stats  !help
// =====================================================================

// ---------------------------------------------------------------------
//  Settings
// ---------------------------------------------------------------------
const START_COINS = 100;
const KILL_COINS = 30;               // per kill
const STREAK_BONUS = 5;              // extra coins per streak step (max 10 steps)
const ENCHANT_COST_PER_TIER = 250;   // tier 1 = 250, tier 2 = 500 ... tier 5 = 1250
const MAX_ENCHANT_TIER = 5;
const SIDEBAR_REFRESH_MS = 1000;
const SAVE_SLOT = 21;                // moonstone chest slot used for saving

const ARMOR_PIECES = ["Helmet", "Chestplate", "Gauntlets", "Leggings", "Boots"];
const TOOL_PIECES = ["Sword", "Axe", "Pickaxe", "Spade"];

// Each kit: item-name prefixes to try in order (the game's exact naming is
// not certain, so the first one that gives successfully is used), price and
// the two colours of its gradient.
const KITS = {
  starter:    { title: "Iron Starter", prefixes: ["Iron"],                                price: 0,    c1: [210, 210, 220], c2: [120, 130, 150] },
  amethite:   { title: "Amethite",     prefixes: ["Kingly Amethite", "Amethite"],         price: 600,  c1: [190, 90, 255],  c2: [255, 150, 235] },
  rubellite:  { title: "Rubellite",    prefixes: ["Rubellite", "Kingly Rubellite"],       price: 1800, c1: [255, 50, 90],   c2: [255, 160, 130] },
  magmasteel: { title: "Magmasteel",   prefixes: ["Magmasteel", "Kingly Magmasteel"],     price: 4000, c1: [255, 110, 0],   c2: [255, 225, 60] },
  serpentite: { title: "Serpentite",   prefixes: ["Serpentite", "Serpentine", "Kingly Serpentite"], price: 8000, c1: [40, 255, 150], c2: [40, 190, 255] },
};
const KIT_ORDER = ["starter", "amethite", "rubellite", "magmasteel", "serpentite"];

// Ranks by kills: [minKills, name, colour]
const RANKS = [
  [0,    "Bronze I",    "#cd7f32"], [10,   "Bronze II",   "#cd7f32"], [25,   "Bronze III",   "#cd7f32"],
  [50,   "Silver I",    "#c0c0c0"], [75,   "Silver II",   "#c0c0c0"], [100,  "Silver III",   "#c0c0c0"],
  [150,  "Gold I",      "#ffd700"], [200,  "Gold II",     "#ffd700"], [250,  "Gold III",     "#ffd700"],
  [350,  "Diamond I",   "#4de8ff"], [450,  "Diamond II",  "#4de8ff"], [550,  "Diamond III",  "#4de8ff"],
  [700,  "Sapphire I",  "#4d6bff"], [850,  "Sapphire II", "#4d6bff"], [1000, "Sapphire III", "#4d6bff"],
  [1200, "Ruby I",      "#ff3355"], [1400, "Ruby II",     "#ff3355"], [1600, "Ruby III",     "#ff3355"],
  [1850, "Elite I",     "#b050ff"], [2100, "Elite II",    "#b050ff"], [2350, "Elite III",    "#b050ff"],
  [2650, "Champion I",  "#ff70c8"], [2950, "Champion II", "#ff70c8"], [3250, "Champion III", "#ff70c8"],
  [3500, "Mythic I",    "#fff48a"], [3750, "Mythic II",   "#fff48a"], [4000, "Mythic III",   "#fff48a"],
  [5000, "LEGEND",      "#ffe600"],
];

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

function line() { return [seg("────────────────────────", "#555566")]; }

// ---------------------------------------------------------------------
//  Player data (saved in the player's moonstone chest, like a profile)
// ---------------------------------------------------------------------
const P = {};   // playerId -> data

function defaults() {
  return { kills: 0, deaths: 0, coins: START_COINS, streak: 0, best: 0, owned: ["starter"], kit: "starter", enchants: 0 };
}

function saveData(id) {
  const d = P[id];
  if (!d) return;
  try {
    api.setMoonstoneChestItemSlot(id, SAVE_SLOT, "Black Carpet", 1, { customDisplayName: JSON.stringify(d) });
  } catch (e) {}
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
      if (!Array.isArray(d.owned) || d.owned.indexOf("starter") === -1) d.owned = ["starter"].concat(Array.isArray(s.owned) ? s.owned : []);
    }
  } catch (e) {}
  P[id] = d;
  return d;
}

// ---------------------------------------------------------------------
//  Ranks
// ---------------------------------------------------------------------
function rankFor(kills) {
  let r = RANKS[0];
  for (const entry of RANKS) {
    if (kills >= entry[0]) r = entry;
  }
  return { name: r[1], color: r[2] };
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
  try {
    api.setTargetedPlayerSettingForEveryone(id, "nameTagInfo", {
      content: [{ str: api.getEntityName(id), style: { color: "cyan" } }],
      subtitle: [{ str: "[" + rank.name + "]", style: { color: rank.color, fontWeight: "bold" } }],
    }, true);
  } catch (e) {}
}

// ---------------------------------------------------------------------
//  Sidebar
// ---------------------------------------------------------------------
function statLine(label, value, color) {
  return [seg(label + " ", "#9aa0b4", ITALIC), seg(String(value) + "\n", color, BOLD)];
}

function updateSidebar(id) {
  const d = P[id];
  if (!d) return;
  const rank = rankFor(d.kills);
  const next = nextRankInfo(d.kills);
  const kd = d.deaths > 0 ? (d.kills / d.deaths).toFixed(2) : d.kills.toFixed(2);

  let segs = [];
  segs = segs.concat(gradient("✦ ARENA PVP ✦", [255, 80, 200], [80, 200, 255], BOLD_ITALIC));
  segs.push(seg("\n", "#ffffff"));
  segs = segs.concat(statLine("Rank", rank.name, rank.color));
  segs = segs.concat(statLine("Kills", d.kills, "#7dff7d"));
  segs = segs.concat(statLine("Deaths", d.deaths, "#ff7d7d"));
  segs = segs.concat(statLine("K/D", kd, "#ffd27d"));
  segs = segs.concat(statLine("Streak", d.streak + " (best " + d.best + ")", "#ff9a3c"));
  segs = segs.concat(statLine("Coins", "$" + d.coins, "#ffe600"));
  segs.push(seg("Kit ", "#9aa0b4", ITALIC));
  segs = segs.concat(kitName(d.kit, BOLD));
  segs.push(seg("\n", "#ffffff"));
  if (next) segs = segs.concat([seg("Next: " + next.name + " in " + next.need + "\n", "#6f7690", ITALIC)]);

  try {
    api.setClientOption(id, "RightInfoText", segs);
  } catch (e) {}
}

// ---------------------------------------------------------------------
//  Kits
// ---------------------------------------------------------------------
// Gives one piece, trying every name prefix until the game accepts one.
function givePiece(id, key, piece, extraAttrs) {
  const k = KITS[key];
  const display = "✦ " + k.title + " " + piece;
  for (const prefix of k.prefixes) {
    try {
      api.giveItem(id, prefix + " " + piece, 1, Object.assign({ customDisplayName: display }, extraAttrs || {}));
      return true;
    } catch (e) {}
  }
  return false;
}

function giveKit(id) {
  const d = P[id];
  if (!d) return;
  try { api.clearInventory(id); } catch (e) {}

  const failed = [];
  ARMOR_PIECES.concat(TOOL_PIECES).forEach(piece => {
    if (!givePiece(id, d.kit, piece)) failed.push(piece);
  });

  try { api.giveItem(id, "Apple", 16, { customDisplayName: "Golden Apple" }); } catch (e) {}
  try { api.giveItem(id, "Cornbread", 32); } catch (e) {}

  if (failed.length > 0) {
    tell(id, [seg("Could not give: " + failed.join(", ") + " (item name not recognised).", "#ff6b6b", ITALIC)]);
  }
}

function resolveKit(arg) {
  const q = (arg || "").toLowerCase().trim();
  if (!q) return null;
  for (const key of KIT_ORDER) {
    if (key === q || KITS[key].title.toLowerCase() === q || KITS[key].title.toLowerCase().indexOf(q) === 0) return key;
  }
  return null;
}

// ---------------------------------------------------------------------
//  Menus (chat)
// ---------------------------------------------------------------------
function showKits(id) {
  const d = P[id];
  tell(id, line());
  tell(id, gradient("  ✦ KIT MENU ✦", [255, 80, 200], [80, 200, 255], BOLD_ITALIC));
  KIT_ORDER.forEach(key => {
    const k = KITS[key];
    const owned = d.owned.indexOf(key) !== -1;
    const status = d.kit === key ? seg("  ● EQUIPPED", "#7dff7d", BOLD)
      : owned ? seg("  ✔ owned  (!equip " + key + ")", "#9aa0b4", ITALIC)
      : seg("  $" + k.price + "  (!buy " + key + ")", d.coins >= k.price ? "#ffe600" : "#ff6b6b", BOLD);
    tell(id, [seg(" • ", "#555566")].concat(kitName(key, BOLD_ITALIC), [status]));
  });
  tell(id, [seg(" Coins: ", "#9aa0b4", ITALIC), seg("$" + d.coins, "#ffe600", BOLD),
            seg("   |   !enchant to enchant the item you hold", "#6f7690", ITALIC)]);
  tell(id, line());
}

function showHelp(id) {
  tell(id, line());
  tell(id, gradient("  ✦ ARENA PVP ✦", [255, 80, 200], [80, 200, 255], BOLD_ITALIC));
  [["!kits", "open the kit menu"], ["!buy <kit>", "buy a kit with coins"], ["!equip <kit>", "switch kit (applies now)"],
   ["!enchant", "enchant the item in your hand"], ["!stats", "show your stats"]].forEach(c => {
    tell(id, [seg(" " + c[0], "#7dd3ff", BOLD), seg("  " + c[1], "#9aa0b4", ITALIC)]);
  });
  tell(id, [seg(" Earn coins from kills - bigger streaks pay more!", "#ffe600", ITALIC)]);
  tell(id, line());
}

function showStats(id) {
  const d = P[id];
  const rank = rankFor(d.kills);
  tell(id, line());
  tell(id, [seg(" Rank ", "#9aa0b4", ITALIC), seg(rank.name, rank.color, BOLD),
            seg("   Kills ", "#9aa0b4", ITALIC), seg(String(d.kills), "#7dff7d", BOLD),
            seg("   Deaths ", "#9aa0b4", ITALIC), seg(String(d.deaths), "#ff7d7d", BOLD)]);
  tell(id, [seg(" Coins ", "#9aa0b4", ITALIC), seg("$" + d.coins, "#ffe600", BOLD),
            seg("   Best streak ", "#9aa0b4", ITALIC), seg(String(d.best), "#ff9a3c", BOLD),
            seg("   Enchants ", "#9aa0b4", ITALIC), seg(String(d.enchants), "#c58cff", BOLD)]);
  tell(id, line());
}

// ---------------------------------------------------------------------
//  Buy / equip / enchant
// ---------------------------------------------------------------------
function buyKit(id, arg) {
  const d = P[id];
  const key = resolveKit(arg);
  if (!key) return tell(id, [seg("Unknown kit. Type !kits to see the menu.", "#ff6b6b", ITALIC)]);
  if (d.owned.indexOf(key) !== -1) return tell(id, [seg("You already own that kit - use !equip " + key + ".", "#ffa502", ITALIC)]);
  const price = KITS[key].price;
  if (d.coins < price) return tell(id, [seg("Not enough coins - you need $" + (price - d.coins) + " more.", "#ff6b6b", BOLD)]);

  d.coins -= price;
  d.owned.push(key);
  saveData(id);
  updateSidebar(id);
  tell(id, [seg("Bought ", "#7dff7d", BOLD)].concat(kitName(key, BOLD_ITALIC), [seg("!  Use !equip " + key + " to wear it.", "#7dff7d", BOLD)]));
  try { api.playSound(id, "cashRegister", 1, 1); } catch (e) {}
}

function equipKit(id, arg) {
  const d = P[id];
  const key = resolveKit(arg);
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
  try { api.playSound(id, "levelup", 1, 1.2); } catch (e) {}
}

// ---------------------------------------------------------------------
//  Callbacks
// ---------------------------------------------------------------------
function onPlayerJoin(id) {
  loadData(id);
  try { api.setClientOption(id, "skyBox", "space_lightblue"); } catch (e) {}
  giveKit(id);
  updateNameTag(id);
  updateSidebar(id);
  tell(id, [seg("Welcome to ", "#9aa0b4", ITALIC)].concat(gradient("✦ ARENA PVP ✦", [255, 80, 200], [80, 200, 255], BOLD_ITALIC),
            [seg("  -  type !help", "#9aa0b4", ITALIC)]));
}

function onPlayerLeave(id) {
  saveData(id);
  delete P[id];
}

function onPlayerRespawn(id) {
  if (!P[id]) loadData(id);
  giveKit(id);
  updateSidebar(id);
}

function onPlayerKilledOtherPlayer(killer, victim) {
  const k = P[killer], v = P[victim];
  if (k) {
    const before = rankFor(k.kills).name;
    k.kills += 1;
    k.streak += 1;
    if (k.streak > k.best) k.best = k.streak;
    const reward = KILL_COINS + Math.min(k.streak, 10) * STREAK_BONUS;
    k.coins += reward;
    tell(killer, [seg("+$" + reward, "#ffe600", BOLD), seg("  (streak " + k.streak + ")", "#ff9a3c", ITALIC)]);

    if (k.streak === 5 || k.streak === 10 || k.streak % 15 === 0) {
      shout([seg(api.getEntityName(killer), "#ffffff", BOLD)].concat(
        gradient(" is on a " + k.streak + " KILL STREAK!", [255, 120, 0], [255, 230, 60], BOLD_ITALIC)));
    }
    const after = rankFor(k.kills);
    if (after.name !== before) {
      shout([seg(api.getEntityName(killer), "#ffffff", BOLD), seg(" ranked up to ", "#9aa0b4", ITALIC), seg(after.name + "!", after.color, BOLD_ITALIC)]);
      try { api.playSound(killer, "cashRegister", 1, 1); } catch (e) {}
    }
    saveData(killer);
    updateNameTag(killer);
    updateSidebar(killer);
  }
  if (v) {
    v.deaths += 1;
    v.streak = 0;
    saveData(victim);
    updateSidebar(victim);
  }
}

let lastSidebar = 0;
function tick() {
  const now = api.now();
  if (now - lastSidebar < SIDEBAR_REFRESH_MS) return;
  lastSidebar = now;
  for (const id of api.getPlayerIds()) updateSidebar(id);
}

function onPlayerChat(id, msg) {
  if (!msg.startsWith("!")) return;
  if (!P[id]) loadData(id);

  const parts = msg.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  if (cmd === "!kits" || cmd === "!kit" || cmd === "!menu" || cmd === "!shop") showKits(id);
  else if (cmd === "!buy") buyKit(id, arg);
  else if (cmd === "!equip") equipKit(id, arg);
  else if (cmd === "!enchant") enchantHeld(id);
  else if (cmd === "!stats") showStats(id);
  else if (cmd === "!help") showHelp(id);
  else return;
  return false;
}
