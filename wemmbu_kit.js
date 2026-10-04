function onPlayerChat(playerId, msg) {
  if (msg.startsWith("!Wemmbukit") || msg.startsWith("!wemmbukit")) {
    api.giveItem(playerId, "Kingly Amethite Helmet", 1, {customAttributes: {enchantments: {"Protection": 3, "Health": 2}, enchantmentTier: "Tier 5"}});
    api.giveItem(playerId, "Kingly Amethite Chestplate", 1, {customAttributes: {enchantments: {"Protection": 3, "Health Regen": 2}, enchantmentTier: "Tier 5"}});
    api.giveItem(playerId, "Kingly Amethite Leggings", 1, {customAttributes: {enchantments: {"Protection": 3, "Health": 2}, enchantmentTier: "Tier 5"}});
    api.giveItem(playerId, "Kingly Amethite Boots", 1, {customAttributes: {enchantments: {"Protection": 3, "Health Regen": 2}, enchantmentTier: "Tier 5"}});
    api.giveItem(playerId, "Diamond Sword", 1, {customDisplayName: "Sanguine Sword", customAttributes: {enchantments: {"Damage": 3, "Attack Speed": 2}, enchantmentTier: "Tier 5"}});
    api.giveItem(playerId, "Diamond Axe", 1);
    api.giveItem(playerId, "Moonstone Mace", 1, {customDisplayName: "Gambit", customAttributes: {enchantments: {"Windburst": 1, "Density": 1}}});
    api.giveItem(playerId, "Moonstone Mace", 1, {customDisplayName: "Crucible", customAttributes: {enchantments: {"Breach": 1}}});
    api.giveItem(playerId, "Iron Fragments", 999, {customDisplayName: "Wind Charge"});
    api.giveItem(playerId, "Strength Potion", 1);
    api.giveItem(playerId, "Splash Strength Potion", 5);
    api.giveItem(playerId, "Speed Potion", 1);
    api.giveItem(playerId, "Splash Speed Potion", 5);
    api.giveItem(playerId, "Iron Chest", 5, {customDisplayName: "Shulker"});
    api.giveItem(playerId, "Cornbread", 64);
    api.giveItem(playerId, "Cobweb", 999);
    api.giveItem(playerId, "Moonstone Orb", 999);
    api.giveItem(playerId, "Moonstone Chest", 999, {customDisplayName: "Ender Chets"});
    api.sendMessage(playerId, "Successfully received Wemmbu kit.", {color: "Yellow"});
    return false;
  }

  if (msg.startsWith("!reset")) {
    api.sendMessage(playerId, "Wemmbu kit reset.", {color: "lime"});
    return false;
  }
}

// ---- Iron Fragments = wind charge ----
// Right-click: boosts you in the direction you're facing and knocks back
// every other player within WIND_RADIUS, away from you.
const WIND_RADIUS = 6;
const WIND_SELF_POWER = 12;
const WIND_KNOCKBACK = 14;

function onPlayerClick(playerId, wasAltClick) {
  if (!wasAltClick) return;
  const held = api.getHeldItem(playerId);
  if (!held || held.name !== "Iron Fragments") return;

  api.removeItemName(playerId, "Iron Fragments", 1);

  const dir = api.getPlayerFacingInfo(playerId).dir;
  api.applyImpulse(playerId, dir[0] * WIND_SELF_POWER, Math.max(dir[1] * WIND_SELF_POWER, 0) + 8, dir[2] * WIND_SELF_POWER);

  const origin = api.getPosition(playerId);
  for (const otherId of api.getPlayerIds()) {
    if (otherId === playerId) continue;
    const pos = api.getPosition(otherId);
    const dx = pos[0] - origin[0];
    const dy = pos[1] - origin[1];
    const dz = pos[2] - origin[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > WIND_RADIUS || dist === 0) continue;
    // Closer players get pushed harder.
    const strength = WIND_KNOCKBACK * (1 - dist / WIND_RADIUS);
    api.applyImpulse(otherId, (dx / dist) * strength, 6 + strength * 0.4, (dz / dist) * strength);
  }
}

// ---- Mace: Windburst + Density ----
// Windburst: hitting a player with a mace launches them upward.
// Density: bonus damage per block the attacker has fallen before the hit.
const WINDBURST_LAUNCH = 18;
const DENSITY_PER_BLOCK = 1.5;
const DENSITY_MAX_BONUS = 30;

const lastY = {};
const peakY = {};

function tick() {
  for (const id of api.getPlayerIds()) {
    const y = api.getPosition(id)[1];
    // Not falling (standing or rising): peak follows the player.
    // Falling: peak stays at the top of the fall.
    if (lastY[id] === undefined || y >= lastY[id]) peakY[id] = y;
    lastY[id] = y;
  }
}

function onPlayerDamagingOtherPlayer(attackerId, victimId, damage, withItem) {
  if (withItem !== "Moonstone Mace") return;

  const held = api.getHeldItem(attackerId);
  const name = held && held.attributes && held.attributes.customDisplayName;

  let bonus = 0;
  if (name === "Gambit") {
    // Density
    const fallen = Math.max(0, (peakY[attackerId] || 0) - api.getPosition(attackerId)[1]);
    bonus = Math.min(fallen * DENSITY_PER_BLOCK, DENSITY_MAX_BONUS);
    peakY[attackerId] = api.getPosition(attackerId)[1];
    // Windburst
    api.applyImpulse(victimId, 0, WINDBURST_LAUNCH, 0);
  }
  if (bonus > 0) return damage + bonus;
}

// ---- Shulker (Iron Chest) ----
// Any Iron Chest placed gets filled with gold apples.
const SHULKER_SLOTS = 27;
const SHULKER_APPLES_PER_SLOT = 16;

function onPlayerChangeBlock(playerId, x, y, z, fromBlock, toBlock) {
  if (toBlock !== "Iron Chest") return;
  for (let slot = 0; slot < SHULKER_SLOTS; slot++) {
    api.setStandardChestItemSlot([x, y, z], slot, "Gold Apple", SHULKER_APPLES_PER_SLOT);
  }
}

function onPlayerJoin(playerId) {
    api.sendMessage(playerId, "Type !wemmbukit for Wemmbu's kit.", {color: "Yellow"});
}
