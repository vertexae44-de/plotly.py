// =====================================================================
//  WORLD CODE  (Wemmbu kit + Sonic Boom + Totem + Ranks/Leaderboard)
// =====================================================================

// ================= Wemmbu kit settings =================
// Durability given to the armor, sword, axe and maces in the kit.
const DURABILITY = 5000;

// Names the wind charge item might go by in the game; the first that works is used.
const WIND_ITEM_NAMES = ["Iron Fragments", "Iron Fragment"];

// The "golden apple" is a normal Apple renamed and given the Tier 5 enchant tier.
const GOLDEN_APPLE_OPTS = {customDisplayName: "Golden Apple", customAttributes: {enchantmentTier: "Tier 5"}};

// Gives an item. If the game rejects the options (e.g. an unknown attribute),
// retries with just the display name, then with no options, so one bad
// attribute never stops the rest of the kit. Returns true on success.
function give(playerId, name, amount, opts) {
  const attempts = [opts];
  if (opts && opts.customAttributes) {
    attempts.push(opts.customDisplayName ? {customDisplayName: opts.customDisplayName} : undefined);
  }
  if (opts) attempts.push(undefined);
  for (const o of attempts) {
    try {
      if (o) api.giveItem(playerId, name, amount, o);
      else api.giveItem(playerId, name, amount);
      return true;
    } catch (e) {}
  }
  return false;
}

// Tries each name in turn and stops at the first one the game accepts.
function giveAny(playerId, names, amount, opts) {
  return names.some(n => give(playerId, n, amount, opts));
}

const KIT = [
  ["Kingly Amethite Helmet", 1, {customAttributes: {durability: DURABILITY, enchantments: {"Protection": 3, "Health": 2}, enchantmentTier: "Tier 5"}}],
  ["Kingly Amethite Chestplate", 1, {customAttributes: {durability: DURABILITY, enchantments: {"Protection": 3, "Health Regen": 2}, enchantmentTier: "Tier 5"}}],
  ["Kingly Amethite Leggings", 1, {customAttributes: {durability: DURABILITY, enchantments: {"Protection": 3, "Health": 2}, enchantmentTier: "Tier 5"}}],
  ["Kingly Amethite Boots", 1, {customAttributes: {durability: DURABILITY, enchantments: {"Protection": 3, "Health Regen": 2}, enchantmentTier: "Tier 5"}}],
  ["Diamond Sword", 1, {customDisplayName: "Sanguine Sword", customAttributes: {durability: DURABILITY, enchantments: {"Damage": 3, "Attack Speed": 2}, enchantmentTier: "Tier 5"}}],
  ["Diamond Axe", 1, {customAttributes: {durability: DURABILITY}}],
  ["Moonstone Mace", 1, {customDisplayName: "Gambit", customAttributes: {durability: DURABILITY, enchantments: {"Windburst": 1, "Density": 1}}}],
  ["Moonstone Mace", 1, {customDisplayName: "Crucible", customAttributes: {durability: DURABILITY, enchantments: {"Breach": 1}}}],
  ["Strength Potion", 1],
  ["Splash Strength Potion", 5],
  ["Speed Potion", 1],
  ["Splash Speed Potion", 5],
  ["Apple", 64, GOLDEN_APPLE_OPTS],
  ["Cornbread", 64],
  ["Cobweb", 999],
  ["Moonstone Orb", 999],
  ["Moonstone Chest", 999, {customDisplayName: "Ender Chets"}],
];

function onPlayerChat(playerId, msg) {
  if (msg.startsWith("!Wemmbukit") || msg.startsWith("!wemmbukit")) {
    const failed = [];
    for (const [name, amount, opts] of KIT) {
      if (!give(playerId, name, amount, opts)) failed.push(name);
    }
    if (!giveAny(playerId, WIND_ITEM_NAMES, 999, {customDisplayName: "Wind Charge"})) {
      failed.push("Wind Charge (Iron Fragments)");
    }
    api.sendMessage(playerId, "Successfully received Wemmbu kit.", {color: "Yellow"});
    if (failed.length > 0) {
      api.sendMessage(playerId, "Could not give: " + failed.join(", "), {color: "Red"});
    }
    return false;
  }

  if (msg.startsWith("!reset")) {
    api.sendMessage(playerId, "Wemmbu kit reset.", {color: "lime"});
    return false;
  }
}

// ================= Golden Apple: effects for a few seconds =================
const APPLE_EFFECT_SECONDS = 8;
const APPLE_EFFECTS = [
  ["Damage Reduction", 2],
  ["Speed", 2],
  ["Health Regen", 2],
  ["Damage", 1],
];

function applyGoldenAppleEffects(playerId) {
  for (const [effect, level] of APPLE_EFFECTS) {
    try {
      api.applyEffect(playerId, effect, APPLE_EFFECT_SECONDS * 1000, {inbuiltLevel: level});
    } catch (e) {}
  }
}

// Eating tracking: a right-click on a Golden Apple starts a "eating" entry.
// tick() watches that slot; once the apple is used up the player has fully
// eaten it and gets the effects. Switching slots or waiting too long cancels.
const APPLE_EAT_TIMEOUT_MS = 4000;
const eating = {};

function isGoldenApple(item) {
  return !!item && item.name === "Apple" && item.attributes?.customDisplayName === "Golden Apple";
}

function checkEating(id) {
  const e = eating[id];
  if (!e) return;
  if (api.now() - e.start > APPLE_EAT_TIMEOUT_MS || api.getSelectedInventorySlotI(id) !== e.slot) {
    delete eating[id]; // cancelled
    return;
  }
  const held = api.getHeldItem(id);
  if (!isGoldenApple(held) || held.amount < e.amount) {
    delete eating[id];
    applyGoldenAppleEffects(id); // fully eaten
  }
}

// ================= Iron Fragments = wind charge =================
// Right-click: boosts you in the direction you're facing and knocks back
// every other player within WIND_RADIUS, away from you.
const WIND_RADIUS = 7;
const WIND_SELF_POWER = 13;
const WIND_KNOCKBACK = 16;

function useWindCharge(playerId, held) {
  api.removeItemName(playerId, held.name, 1);

  const dir = api.getPlayerFacingInfo(playerId).dir;
  api.applyImpulse(playerId, dir[0] * WIND_SELF_POWER, Math.max(dir[1] * WIND_SELF_POWER, 0) + 9, dir[2] * WIND_SELF_POWER);

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

// ================= Sonic Boom =================
let skTime = {}

function checkCooldown(pId, slot, time) {
    if (!skTime[pId]) skTime[pId] = []
    if (!skTime[pId][slot]) skTime[pId][slot] = 0

    if (api.now() - skTime[pId][slot] > time) {
        skTime[pId][slot] = api.now()
        return true
    }
    return false
}

function useSonicBoom(id) {
    let facing = api.getPlayerFacingInfo(id).dir;
    let pos = api.getPosition(id);
    let amount = 8;

    // check cooldown 3s
    if (!checkCooldown(id, 1, 15000)) {
        api.sendMessage(id, "Sonic Boom is cooldown");
        return;
    }

    // âm thanh
    api.broadcastSound("cannonFire1", 1, 5, {
        playerIdOrPos: id,
        maxHearDist: 15
    });

    // hiệu ứng bắn Sonic Boom
    for (let i = 0; i < amount; i++) {
        api.playParticleEffect({
            dir2: [1, 0, 1],
            dir1: [facing[0], facing[0], facing[2]],
            pos1: [pos[0] + ((i+2)*facing[0]), pos[1] + 1, pos[2] + ((i+2)*facing[2])],
            pos2: [pos[0] + ((i+2)*facing[0]), pos[1] + 1, pos[2] + ((i+2)*facing[2])],
            texture: "bubble",
            minLifeTime: 0.05 + (i/100),
            maxLifeTime: 0.05 + (i/100),
            minEmitPower: 2,
            maxEmitPower: 2,
            minSize: 0.5,
            maxSize: 3 - (i/10),
            manualEmitCount: 10,
            gravity: [0, -2, 0],
            colorGradients: [
                { timeFraction: 0, minColor: [180, 230, 250], maxColor: [200, 255, 255] }
            ],
            velocityGradients: [{ timeFraction: 0, factor: 1, factor2: 1 }],
            blendMode: 1,
        });

        const magnitude = Math.sqrt(facing[0]*facing[0] + facing[1]*facing[1] + facing[2]*facing[2]);
        const normalized = [facing[0]/magnitude, facing[1]/magnitude, facing[2]/magnitude];
        let x = Math.floor(pos[0] + normalized[0] * i);
        let z = Math.floor(pos[2] + normalized[2] * i);
        let y = Math.floor(pos[1]);

        let hit = api.getEntitiesInRect([x-3,y-3,z-3],[x+3,y+3,z+3]);
        if (hit) {
            for (let h = 0; h < hit.length; h++) {
                let target = hit[h];
                if (target != id) {
                    api.attemptApplyDamage({
                        eId: id,
                        hitEId: target,
                        attemptedDmgAmt: 60,
                        withItem: "Black Sticky Paintball Explosive",
                        attackDir: [facing[0],facing[1],facing[2]],
                        showCritParticles : true,
                        reduceVerticalKbVelocity : false
                    });
                }
            }
        }
    }

    // ====== Buff khi dùng Sonic Boom ======
    api.applyEffect(id,"Speed",15000,{inbuiltLevel:2})
    api.applyEffect(id,"Damage Reduction",15000,{inbuiltLevel:2})
    api.applyEffect(id,"Damage",15000,{inbuiltLevel:10})
    api.setShieldAmount(id,150)

    // hồi máu ngay lập tức
    const oldHealth = api.getHealth(id)
    if(oldHealth < 130){
        api.setHealth(id, oldHealth+30, undefined, true)
    }

    // báo hiệu cooldown bằng icon Black Planks
    api.applyEffect(id, "10", 15000, {
        icon: "Black Planks",
        displayName: `Sonic Boom Cooldown`
    })
}

// ================= Click handler (Sonic Boom + Golden Apple + Wind Charge) =================
function onPlayerClick(id, wasAltClick) {
    let held = api.getHeldItem(id);
    if (!held) return;
    let name = held.attributes?.customDisplayName;

    if (name == "Sonic Boom") {
        useSonicBoom(id);
        return;
    }

    if (!wasAltClick) return;

    if (isGoldenApple(held)) {
        if (!eating[id]) {
            eating[id] = {start: api.now(), slot: api.getSelectedInventorySlotI(id), amount: held.amount};
        }
        return;
    }

    if (WIND_ITEM_NAMES.includes(held.name)) {
        useWindCharge(id, held);
    }
}

function onPlayerOpenedChest(playerId, x, y, z, isMoonstoneChest) {
    try {
        if (isMoonstoneChest) {
            api.setPosition(playerId, 43.48, 37.00, 58.49);
        }
    } catch (err) {
        // lỗi sẽ bị bỏ qua
    }
}

// ================= Mace: Windburst + Density + Breach =================
// Windburst: hitting a player with Gambit launches you (and a bit of them) upward.
// Density: bonus damage per block the attacker has fallen before the hit.
const WINDBURST_SELF_LAUNCH = 16;   // launches you (the mace user)
const WINDBURST_VICTIM_LAUNCH = 10;  // launches the player you hit (set 0 to disable)
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
    checkEating(id);
  }
}

// Breach: armor is partly ignored. Each worn armor piece would normally
// soak up damage, so we give that damage back: +BREACH_PER_PIECE of the
// hit per armor piece the victim wears.
const BREACH_PER_PIECE = 0.2;

function countArmorPieces(playerId) {
  try {
    return api.getArmorItems(playerId).filter(Boolean).length;
  } catch (e) {
    return 4; // can't read armor: assume a full set
  }
}

// Extra damage (and Windburst launch) for Gambit / Crucible hits.
function maceBonus(attackerId, victimId, damage, withItem) {
  const name = api.getHeldItem(attackerId)?.attributes?.customDisplayName;

  if (name === "Gambit") {
    // Density
    const fallen = Math.max(0, (peakY[attackerId] || 0) - api.getPosition(attackerId)[1]);
    peakY[attackerId] = api.getPosition(attackerId)[1];
    // Windburst
    api.applyImpulse(attackerId, 0, WINDBURST_SELF_LAUNCH, 0);
    if (WINDBURST_VICTIM_LAUNCH > 0) api.applyImpulse(victimId, 0, WINDBURST_VICTIM_LAUNCH, 0);
    return Math.min(fallen * DENSITY_PER_BLOCK, DENSITY_MAX_BONUS);
  }
  if (name === "Crucible") {
    // Breach
    return damage * BREACH_PER_PIECE * countArmorPieces(victimId);
  }
  return 0;
}

// ================= Kills / Deaths / Ranks =================
let playerKills = {}
let playerDeaths = {}
let playerRanks = {}

// ================= Rank colors =================
const rankColors = {
  "Bronze 1": "orange", "Bronze 2": "orange", "Bronze 3": "orange",
  "Silver 1": "lightgray", "Silver 2": "lightgray", "Silver 3": "lightgray",
  "Gold 1": "gold", "Gold 2": "gold", "Gold 3": "gold",
  "Diamond 1": "cyan", "Diamond 2": "cyan", "Diamond 3": "cyan",
  "Sapphire 1": "blue", "Sapphire 2": "blue", "Sapphire 3": "blue",
  "Ruby 1": "red", "Ruby 2": "red", "Ruby 3": "red",
  "Elite 1": "purple", "Elite 2": "purple", "Elite 3": "purple",
  "Champion 1": "pink", "Champion 2": "pink", "Champion 3": "pink",
  "Mythic 1": "lightyellow", "Mythic 2": "lightyellow", "Mythic 3": "lightyellow",
  "Legend": "yellow"
}
function getRankStyle(rank) {
  return { color: rankColors[rank] || "white" }
}

// ================== SAVE / LOAD (slot 20) ==================
function saveStats(id, kills, deaths) {
  api.setMoonstoneChestItemSlot(id, 20, "Black Carpet", 1, {
    customDisplayName: JSON.stringify({ kills, deaths })
  })
}

function loadStats(id) {
  let item = api.getMoonstoneChestItemSlot(id, 20)
  if (!item?.attributes?.customDisplayName) return { kills: 0, deaths: 0 }
  try {
    let data = JSON.parse(item.attributes.customDisplayName)
    return {
      kills: typeof data.kills === "number" ? data.kills : 0,
      deaths: typeof data.deaths === "number" ? data.deaths : 0
    }
  } catch {
    return { kills: 0, deaths: 0 }
  }
}

// ================== UPDATE STATS ==================
function addKills(playerId, amount) {
  const dbid = api.getPlayerDbId(playerId)
  const name = api.getEntityName(playerId)

  if (!playerKills[dbid]) playerKills[dbid] = [name, 0]
  playerKills[dbid][0] = name
  playerKills[dbid][1] += amount

  saveStats(playerId, playerKills[dbid][1], playerDeaths[dbid]?.[1] || 0)
  updateRank(playerId)
  updateKD(playerId)
}

function addDeaths(playerId, amount) {
  const dbid = api.getPlayerDbId(playerId)
  const name = api.getEntityName(playerId)

  if (!playerDeaths[dbid]) playerDeaths[dbid] = [name, 0]
  playerDeaths[dbid][0] = name
  playerDeaths[dbid][1] += amount

  saveStats(playerId, playerKills[dbid]?.[1] || 0, playerDeaths[dbid][1])
  updateKD(playerId)
}

function updateKD(playerId) {
  const dbid = api.getPlayerDbId(playerId)
  const kills = playerKills[dbid]?.[1] || 0
  const deaths = playerDeaths[dbid]?.[1] || 0
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills

  api.setTargetedPlayerSettingForEveryone(playerId, "lobbyLeaderboardValues", {
    a: kills.toString(),
    b: deaths.toString(),
    c: kd.toString()
  })
}

// ================== EVENTS ==================
function onPlayerJoin(playerId) {
  const dbid = api.getPlayerDbId(playerId)
  const name = api.getEntityName(playerId)

  const stats = loadStats(playerId)
  playerKills[dbid] = [name, stats.kills]
  playerDeaths[dbid] = [name, stats.deaths]

  api.setClientOption(playerId, "skyBox", "space_lightblue")
  api.setClientOption(playerId, "lobbyLeaderboardInfo", {
    pfp: {},
    name: { displayName: "Name" },
    a: { displayName: "Kills" },
    b: { displayName: "Deaths" },
    c: { displayName: "K/D" }
  })

  updateRank(playerId)
  updateKD(playerId)

  api.sendMessage(playerId, "Type !wemmbukit for Wemmbu's kit.", {color: "Yellow"})
}

function onPlayerKilledOtherPlayer(killer, victim) {
  addKills(killer, 1)
  addDeaths(victim, 1)
  api.giveItem(killer, "Draugr Knight Spawner Block", 1, {customDisplayName:"Sculk Coin"});
}

function onPlayerRespawn(playerId) {
  // Nếu muốn respawn tính Death thì mở dòng này
  // addDeaths(playerId, 1)
}

// ================== RANK ==================
function updateRank(playerId) {
  const dbid = api.getPlayerDbId(playerId)
  const kills = playerKills[dbid]?.[1] || 0
  const name = api.getEntityName(playerId)

  let rank = "Bronze 1"
  if (kills >= 5000) rank = "Legend"
  else if (kills >= 4000) rank = "Mythic 3"
  else if (kills >= 3750) rank = "Mythic 2"
  else if (kills >= 3500) rank = "Mythic 1"
  else if (kills >= 3250) rank = "Champion 3"
  else if (kills >= 2950) rank = "Champion 2"
  else if (kills >= 2650) rank = "Champion 1"
  else if (kills >= 2350) rank = "Elite 3"
  else if (kills >= 2100) rank = "Elite 2"
  else if (kills >= 1850) rank = "Elite 1"
  else if (kills >= 1600) rank = "Ruby 3"
  else if (kills >= 1400) rank = "Ruby 2"
  else if (kills >= 1200) rank = "Ruby 1"
  else if (kills >= 1000) rank = "Sapphire 3"
  else if (kills >= 850) rank = "Sapphire 2"
  else if (kills >= 700) rank = "Sapphire 1"
  else if (kills >= 550) rank = "Diamond 3"
  else if (kills >= 450) rank = "Diamond 2"
  else if (kills >= 350) rank = "Diamond 1"
  else if (kills >= 250) rank = "Gold 3"
  else if (kills >= 200) rank = "Gold 2"
  else if (kills >= 150) rank = "Gold 1"
  else if (kills >= 100) rank = "Silver 3"
  else if (kills >= 75) rank = "Silver 2"
  else if (kills >= 50) rank = "Silver 1"
  else if (kills >= 25) rank = "Bronze 3"
  else if (kills >= 10) rank = "Bronze 2"
  else if (kills >= 1) rank = "Bronze 1"

  const previous = playerRanks[dbid] || "Bronze 1"
  if (rank !== previous) {
    api.sendMessage(playerId, `You ranked up! Now: ${rank}`, { color: "yellow" })
    api.broadcastMessage(`${name} reached rank ${rank} !!`, { color: "gold" })
    api.playSound(playerId, "cashRegister", 1, 1)
  }

  playerRanks[dbid] = rank
  const style = getRankStyle(rank)

  api.setTargetedPlayerSettingForEveryone(playerId, "nameTagInfo", {
    content: [{ str: name, style: { color: "cyan" } }],
    subtitle: [{ str: `[${rank}]`, style }]
  }, true)
}

// ================= Totem Of Undying =================
function onPlayerAttemptAltAction(id){

	if (api.getHeldItem(id)?.name == "Gold Spade" &&
		api.getHeldItem(id)?.attributes.customDisplayName == "Totem Of Undying"  		 &&	api.getEffects(id).includes ("Totem") == false){
	       /* ---apply totem effect--- */
		api.applyEffect(id, "Totem", null, {icon: "Gold Spade"})
		slot = api.getSelectedInventorySlotI(id)
		api.setItemSlot(id, slot, "Air")
	}
}

// Saves a victim who would drop below 5 health while holding / having the totem.
function tryTotem(victim, dmg) {
  if ((api.getHeldItem(victim)?.attributes?.customDisplayName === "Totem Of Undying" || api.getEffects(victim).includes('Totem'))
      && api.getHealth(victim) - dmg < 5) {
	/* ---TOTEM WORK--- */
    const pos = api.getPosition(victim);
    api.applyEffect(victim, 'Health Regen', 5000, {inbuiltLevel: 1});
	api.applyEffect(victim, "Heat Resistance", 10000, {inbuiltLevel: 1})
	api.applyEffect(victim, "Damage Reduction", 5000, {inbuiltLevel: 1})
	api.setHealth(victim, 30)
    api.setShieldAmount(victim, 30);
    particle(pos[0], pos[1], pos[2]);
    if (api.getHeldItem(victim)?.attributes?.customDisplayName === "Totem Of Undying"){
	slot = api.getSelectedInventorySlotI(victim)
	api.setItemSlot(victim, slot, "Air")}
	else {api.removeEffect(victim, 'Totem');}
  }
}

function onPlayerDamagingOtherPlayer(attacker, victim, dmg, withItem) {
  // Mace effects first, so the totem sees the real (boosted) damage.
  const bonus = maceBonus(attacker, victim, dmg, withItem);
  const finalDmg = dmg + bonus;

  tryTotem(victim, finalDmg);

  if (bonus > 0) return finalDmg;
}

function onMobDamagingPlayer(attacker, victim, dmg) {
  tryTotem(victim, dmg);
}

function particle(x, y, z){
y += 1
api.playParticleEffect({
 		dir1: [-1, -1, -1],
 		dir2: [1, 1, 1],
  		pos1: [x + 2, y + 1.5, z + 2],
    	pos2: [x - 2, y - 1.5, z - 2],
    	texture: "glint",
    	minLifeTime: 0.5,
    	maxLifeTime: 2,
    	minEmitPower: 4,
    	maxEmitPower: 6,
    	minSize: 0.1,
   		maxSize: 0.5,
    	manualEmitCount: 85,
    	gravity: [0, -10, 0],
    	colorGradients: [
   	    {
   	        timeFraction: 0,
            minColor: [211, 214, 0, 0.5],
            maxColor: [0, 255, 0, 0.8],
        },
    	],
    	velocityGradients: [
        {
            timeFraction: 1,
            factor: 0.2,
            factor2: 1,
        },
    	],
    	blendMode: 1,
	})
}
