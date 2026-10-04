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

// Iron Fragments act as a wind charge: right-click to burst yourself
// in the direction you're facing (with some extra lift).
function onPlayerClick(playerId, wasAltClick) {
  if (!wasAltClick) return;
  const held = api.getHeldItem(playerId);
  if (!held || held.name !== "Iron Fragments") return;

  api.removeItemName(playerId, "Iron Fragments", 1);

  const dir = api.getPlayerFacingInfo(playerId).dir;
  const power = 12;
  api.applyImpulse(playerId, dir[0] * power, Math.max(dir[1] * power, 0) + 8, dir[2] * power);
}

function onPlayerJoin(playerId) {
    api.sendMessage(playerId, "Type !wemmbukit for Wemmbu's kit.", {color: "Yellow"});
}
