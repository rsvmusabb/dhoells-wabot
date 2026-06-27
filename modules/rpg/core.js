// ============================================================
// modules/rpg/core.js — RPG Core Engine
// Battle system, stats, leveling, quest tracking
// ============================================================

const {
    RPG_CLASSES, RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_MONSTERS,
    RPG_ACHIEVEMENTS, RPG_QUESTS, RPG_EVOLUTIONS, RPG_PETS, RPG_PETS_EVOLVED,
    RPG_SUMMONS, ELEMENT_ADVANTAGE, CLASS_ELEMENTS, ENCHANT_ATK_BONUS,
    MAX_STAMINA, STAMINA_COSTS, STAMINA_REGEN_PER_HOUR, MAX_DURABILITY,
    DURABILITY_LOSS_PER_BATTLE, KARMA_LEVELS, NPC_ENCOUNTERS, RANDOM_EVENTS,
    DUNGEON_MOBS, DUNGEON_BOSSES, ARENA_RANKS, WEATHERS, TIME_PHASES,
    WORLD_BOSS_POOL, WORLD_BOSS_DURATION, DARK_MONSTERS, DARK_WORLD_DURATION,
    CURSES, VOID_EVENTS, STORY_CHAPTERS, STORY_TITLES, DEMON_INVASION_PHASES,
    WEAPON_AWAKENINGS, BASE_UPGRADES, COOLDOWNS
} = require('../../config');

const { getPlayer, updatePlayer, getDisplayName, checkCooldown, playerCooldowns, activeDuels, activeRaids, activeWorldBoss, activeDemonInvasion } = require('../utility/db');
const { formatCoins } = require('../utility/currency');

// ============================================================
// TIME & WEATHER
// ============================================================
let currentWeather = WEATHERS[0];
let lastWeatherChange = 0;

function getTimePhase() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 0;
    if (h >= 12 && h < 17) return 1;
    if (h >= 17 && h < 21) return 2;
    return 3;
}

function getTimeLabel() { return TIME_PHASES[getTimePhase()]; }

function getTimeMultipliers() {
    const p = getTimePhase();
    return {
        monsterHp: p === 3 ? 1.3 : 1,
        monsterAtk: p === 3 ? 1.3 : 1,
        dropRate: p === 3 ? 1.2 : 1,
        shopDiscount: p === 1 ? 0.9 : 1,
        label: TIME_PHASES[p]
    };
}

function updateWeather() {
    const now = Date.now();
    if (now - lastWeatherChange > 3 * 60 * 60 * 1000) {
        currentWeather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
        lastWeatherChange = now;
    }
    return currentWeather;
}

// ============================================================
// KARMA
// ============================================================
function getKarmaLevel(karma) {
    let r = KARMA_LEVELS[3];
    for (const k of KARMA_LEVELS) { if (karma >= k.min) r = k; }
    return r;
}

// ============================================================
// ELEMENTS
// ============================================================
function getElementBonus(atkElement, defElement) {
    if (ELEMENT_ADVANTAGE[atkElement] === defElement) return 1.25;
    if (ELEMENT_ADVANTAGE[defElement] === atkElement) return 0.75;
    return 1.0;
}

// ============================================================
// PET STATS
// ============================================================
function getPetStats(pet) {
    if (!pet) return { atk: 0, def: 0, heal: 0, emoji: '', name: '' };
    const data = pet.evolved ? (RPG_PETS_EVOLVED[pet.id] || RPG_PETS[pet.id]) : (RPG_PETS[pet.id] || {});
    return {
        atk: (data.atk || 0) + Math.floor(pet.level / 3),
        def: (data.def || 0) + Math.floor(pet.level / 5),
        heal: data.heal || 0,
        emoji: data.emoji || '🐾',
        name: pet.customName || data.name || pet.id
    };
}

// ============================================================
// BUFFED STATS
// ============================================================
function getBuffedStats(rpg) {
    const weapon = RPG_WEAPONS[rpg.weapon];
    const armor = RPG_ARMORS[rpg.armor];
    const shield = RPG_SHIELDS[rpg.shield];
    const pet = getPetStats(rpg.pet);

    let atk = rpg.atk + (weapon?.atk || 0) + (rpg.weaponEnchant || 0) * ENCHANT_ATK_BONUS + pet.atk;
    let def = rpg.def + (armor?.def || 0) + (shield?.def || 0) + pet.def;
    let spd = rpg.spd;
    let crit = rpg.crit;
    let maxHp = rpg.maxHp + (armor?.hp || 0);
    let block = shield?.block || 0;
    let dodge = 0;
    let poison = 0;
    let regen = pet.heal;
    let lifesteal = 0;

    // Evolution bonuses
    if (rpg.evolution) {
        const evoPaths = RPG_EVOLUTIONS[rpg.class] || [];
        const evo = evoPaths.find(e => e.id === rpg.evolution);
        if (evo?.bonus) {
            atk += evo.bonus.atk || 0;
            def += evo.bonus.def || 0;
            spd += evo.bonus.spd || 0;
            crit += evo.bonus.crit || 0;
            maxHp += evo.bonus.maxHp || 0;
            dodge += evo.bonus.dodge || 0;
        }
    }

    // Class passive bonuses
    if (rpg.class === 'warrior') def = Math.floor(def * 1.15);
    if (rpg.class === 'archer') crit += 5;
    if (rpg.class === 'mage') atk = Math.floor(atk * 1.10);
    if (rpg.class === 'assassin') spd = Math.floor(spd * 1.20);
    if (rpg.class === 'necromancer') regen += Math.floor(atk * 0.15); // Lifesteal 15% as passive regen
    if (rpg.class === 'paladin') regen += 5; // Regen 5/turn
    if (rpg.class === 'samurai') { crit += 5; block += 5; } // Counter 20% = extra crit+block
    if (rpg.class === 'berserker' && rpg.hp <= rpg.maxHp * 0.3) atk = Math.floor(atk * 1.35); // Rage +35% ATK saat HP rendah
    if (rpg.class === 'shaman') poison += 3; // Poison 10% chance as flat poison 3

    // Guild buff
    if (rpg.guildName) {
        const { getGuild } = require('../utility/db');
        const guild = getGuild(rpg.guildName);
        if (guild?.buff && Date.now() < guild.buff.expiresAt) {
            atk += guild.buff.atk || 0;
            def += guild.buff.def || 0;
        }
    }

    // Buff bonuses
    for (const b of (rpg.buffs || [])) {
        if (b.stat === 'atk') atk += b.value;
        if (b.stat === 'def') def += b.value;
        if (b.stat === 'spd') spd += b.value;
        if (b.stat === 'crit') crit += b.value;
        if (b.stat === 'dodge') dodge += b.value;
        if (b.stat === 'block') block += b.value;
        if (b.stat === 'poison') poison += b.value;
        if (b.stat === 'regen') regen += b.value;
        if (b.stat === 'lifesteal') lifesteal += b.value;
    }

    // Weather effects
    const weather = updateWeather();
    if (weather.effects.atkBonus) atk += weather.effects.atkBonus;
    if (weather.effects.critPenalty) crit += weather.effects.critPenalty;
    if (weather.effects.dodgeBonus) dodge += weather.effects.dodgeBonus;
    if (weather.effects.spdPenalty) spd += weather.effects.spdPenalty;

    // Stamina penalty
    if ((rpg.stamina || MAX_STAMINA) < 20) { atk = Math.floor(atk * 0.8); def = Math.floor(def * 0.8); }

    // Durability penalty
    if ((rpg.durability || MAX_DURABILITY) <= 0) atk -= (weapon?.atk || 0);

    // Base bonuses
    if (rpg.base) {
        const bArmory = rpg.base.armory || 0; if (bArmory > 0) atk += BASE_UPGRADES.armory.levels[bArmory-1]?.bonus?.atk || 0;
        const bWall = rpg.base.wall || 0; if (bWall > 0) def += BASE_UPGRADES.wall.levels[bWall-1]?.bonus?.def || 0;
        const bInf = rpg.base.infirmary || 0; if (bInf > 0) regen += BASE_UPGRADES.infirmary.levels[bInf-1]?.bonus?.regen || 0;
    }

    // Summon bonus
    if (rpg.summon) { const sm = RPG_SUMMONS[rpg.summon]; if (sm) { atk += sm.atk; def += sm.def; } }

    return {
        atk: Math.max(1, atk), def: Math.max(0, def), spd: Math.max(1, spd),
        crit: Math.max(0, crit), hp: Math.min(rpg.hp, maxHp), maxHp,
        block: Math.min(block, 50), dodge: Math.min(dodge, 40),
        poison, regen, lifesteal: Math.min(lifesteal, 30), element: rpg.element || 'neutral'
    };
}

// ============================================================
// BATTLE MECHANICS
// ============================================================
function calcDamage(attackerAtk, defenderDef, critChance) {
    const isCrit = Math.random() * 100 < critChance;
    let dmg = attackerAtk - Math.floor(defenderDef / 2) + Math.floor(Math.random() * 9) - 3;
    if (isCrit) dmg = Math.floor(dmg * 2);
    return { damage: Math.max(1, dmg), isCrit };
}

function isDodge(attackerSpd, defenderSpd, extraDodge = 0) {
    const dodgeChance = Math.max(0, (defenderSpd - attackerSpd) * 2) + extraDodge;
    return Math.random() * 100 < Math.min(dodgeChance, 50);
}

function isBlocked(blockChance) {
    return Math.random() * 100 < blockChance;
}

// ============================================================
// QUICK BATTLE (for dungeon/arena — no messaging)
// ============================================================
function quickBattle(playerStats, enemy, hasRevive = false) {
    let fHp = playerStats.hp, eHp = enemy.hp;
    const fS = playerStats;
    const eS = { 
        atk: enemy.atk, 
        def: enemy.def, 
        spd: enemy.spd || 5, 
        crit: enemy.crit !== undefined ? enemy.crit : 5, 
        block: enemy.block || 0, 
        dodge: enemy.dodge || 0 
    };
    let turn = 0, revived = false;
    const fFirst = fS.spd >= eS.spd;
    while (fHp > 0 && eHp > 0 && turn < 25) {
        turn++;
        if (fS.regen > 0) fHp = Math.min(fS.maxHp, fHp + fS.regen);
        const order = fFirst ? ['f', 'e'] : ['e', 'f'];
        for (const who of order) {
            if (fHp <= 0 || eHp <= 0) break;
            if (who === 'f') {
                if (!isDodge(fS.spd, eS.spd)) { const { damage } = calcDamage(fS.atk, eS.def, fS.crit); eHp -= damage; }
            } else {
                if (!isDodge(eS.spd, fS.spd, fS.dodge) && !isBlocked(fS.block)) { const { damage } = calcDamage(eS.atk, fS.def, eS.crit); fHp -= damage; }
            }
        }
        if (fHp <= 0 && hasRevive && !revived) { fHp = Math.floor(fS.maxHp * 0.5); revived = true; }
    }
    return { won: eHp <= 0, playerHp: Math.max(0, fHp), turns: turn };
}

function quickPartyBattle(partyArr, enemy) {
    let eHp = enemy.hp;
    const eS = { 
        atk: enemy.atk, 
        def: enemy.def, 
        spd: enemy.spd || 5, 
        crit: enemy.crit !== undefined ? enemy.crit : 5, 
        block: enemy.block || 0, 
        dodge: enemy.dodge || 0 
    };
    let turn = 0;
    
    const fighters = partyArr.map(p => ({
        jid: p.jid, hp: p.hp, maxHp: p.maxHp, stats: p.stats, revive: p.revive, revived: false, alive: p.hp > 0
    }));

    while (eHp > 0 && fighters.some(f => f.alive) && turn < 40) {
        turn++;
        for (const f of fighters.filter(f => f.alive)) {
            if (eHp <= 0) break;
            if (f.stats.regen > 0) f.hp = Math.min(f.maxHp, f.hp + f.stats.regen);
            if (!isDodge(f.stats.spd, eS.spd, eS.dodge) && !isBlocked(eS.block)) {
                const { damage } = calcDamage(f.stats.atk, eS.def, f.stats.crit);
                eHp -= damage;
                if (f.stats.lifesteal > 0 && f.hp < f.maxHp) {
                    f.hp = Math.min(f.maxHp, f.hp + Math.floor(damage * f.stats.lifesteal / 100));
                }
            }
        }
        if (eHp <= 0) break;
        const living = fighters.filter(f => f.alive);
        if (living.length > 0) {
            const target = living[Math.floor(Math.random() * living.length)];
            if (!isDodge(eS.spd, target.stats.spd, target.stats.dodge) && !isBlocked(target.stats.block)) {
                const { damage } = calcDamage(eS.atk, target.stats.def, eS.crit);
                target.hp -= damage;
                if (target.hp <= 0) {
                    if (target.revive && !target.revived) { target.hp = Math.floor(target.maxHp * 0.5); target.revived = true; }
                    else target.alive = false;
                }
            }
        }
    }
    return { won: eHp <= 0, turns: turn, fighters };
}

// ============================================================
// FULL BATTLE (with log — for hunt)
// ============================================================
async function runBattle(fighter, enemy, sock, sender) {
    const log = [];
    let fHp = fighter.hp;
    let eHp = enemy.hp;
    const fStats = fighter.stats;
    const eStats = { atk: enemy.atk, def: enemy.def, spd: enemy.spd, crit: 5, block: 0, dodge: 0, poison: 0, regen: 0 };
    let turn = 0;
    const fFirst = fStats.spd >= eStats.spd;
    let fRevive = fighter.hasRevive || false;

    if (fStats.poison > 0) {
        log.push(`☠️ Racun diterapkan ke ${enemy.name}! -${fStats.poison} HP/turn`);
    }

    while (fHp > 0 && eHp > 0 && turn < 20) {
        turn++;
        if (fStats.regen > 0 && fHp > 0) {
            const regenHp = Math.min(fStats.regen, fStats.maxHp - fHp);
            if (regenHp > 0) { fHp += regenHp; log.push(`🔄 Regen! +${regenHp} HP | ❤️ ${fHp}/${fStats.maxHp}`); }
        }
        if (fStats.poison > 0 && eHp > 0) {
            eHp -= fStats.poison;
            log.push(`☠️ ${enemy.name} kena racun! -${fStats.poison} HP | 🖤 ${Math.max(0, eHp)}/${enemy.hp}`);
            if (eHp <= 0) break;
        }
        const attacker1 = fFirst ? 'fighter' : 'enemy';
        const attacker2 = fFirst ? 'enemy' : 'fighter';
        for (const who of [attacker1, attacker2]) {
            if (fHp <= 0 || eHp <= 0) break;
            if (who === 'fighter') {
                if (isDodge(fStats.spd, eStats.spd)) {
                    log.push(`💨 ${enemy.name} menghindari seranganmu!`);
                } else {
                    const { damage, isCrit } = calcDamage(fStats.atk, eStats.def, fStats.crit);
                    eHp -= damage;
                    log.push(`⚔️ Kamu menyerang ${enemy.name}! ${isCrit ? '💥 CRIT! ' : ''}*${damage}* dmg | 🖤 ${Math.max(0, eHp)}/${enemy.hp}`);
                    if (fStats.lifesteal > 0 && fHp < fStats.maxHp) {
                        const lsHeal = Math.floor(damage * fStats.lifesteal / 100);
                        if (lsHeal > 0) { fHp = Math.min(fStats.maxHp, fHp + lsHeal); log.push(`🩸 Lifesteal! +${lsHeal} HP | ❤️ ${fHp}/${fStats.maxHp}`); }
                    }
                }
            } else {
                if (isDodge(eStats.spd, fStats.spd, fStats.dodge)) {
                    log.push(`💨 Kamu menghindari serangan ${enemy.name}!`);
                } else if (isBlocked(fStats.block)) {
                    log.push(`🛡️ Kamu memblok serangan ${enemy.name}! *BLOCKED!*`);
                } else {
                    const { damage, isCrit } = calcDamage(eStats.atk, fStats.def, eStats.crit);
                    fHp -= damage;
                    log.push(`👹 ${enemy.name} menyerang! ${isCrit ? '💥 CRIT! ' : ''}*${damage}* dmg | ❤️ ${Math.max(0, fHp)}/${fStats.maxHp}`);
                }
            }
        }
        if (fHp <= 0 && fRevive) {
            fHp = Math.floor(fStats.maxHp * 0.5);
            fRevive = false;
            log.push(`💎 *BATU KEBANGKITAN AKTIF!* Revive dengan ${fHp} HP!`);
        }
    }
    return { log, playerHp: Math.max(0, fHp), enemyHp: Math.max(0, eHp), won: eHp <= 0, turns: turn, usedRevive: !fRevive && (fighter.hasRevive || false) };
}

// ============================================================
// MONSTER GENERATION
// ============================================================
function getMonsterForLevel(level) {
    const available = RPG_MONSTERS.filter(m => m.minLvl <= level);
    const weights = available.map(m => Math.max(1, 10 - Math.abs(level - m.minLvl)));
    const totalW = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW;
    for (let i = 0; i < available.length; i++) {
        r -= weights[i];
        if (r <= 0) return { ...available[i] };
    }
    return { ...available[0] };
}

function getDungeonMonster(floor) {
    const isBoss = floor % 10 === 0;
    if (isBoss) {
        const bossIdx = Math.min(Math.floor(floor / 10) - 1, DUNGEON_BOSSES.length - 1);
        const boss = DUNGEON_BOSSES[Math.max(0, bossIdx)];
        const scale = 1 + (floor - 10) * 0.05;
        return { ...boss, hp: Math.floor(boss.hp * scale), atk: Math.floor(boss.atk * scale), def: Math.floor(boss.def * scale), isBoss: true };
    }
    const mob = DUNGEON_MOBS[Math.floor(Math.random() * DUNGEON_MOBS.length)];
    const scale = 1 + (floor - 1) * 0.08;
    return { ...mob, hp: Math.floor(mob.hp * scale), atk: Math.floor(mob.atk * scale), def: Math.floor(mob.def * scale), isBoss: false };
}

function getRaidBoss(level) {
    if (level >= 15) return { ...RPG_RAIDS[Math.floor(Math.random() * 3)] };
    if (level >= 10) return { ...RPG_RAIDS[Math.floor(Math.random() * 2)] };
    return { ...RPG_RAIDS[0] };
}

const RPG_RAIDS = [
    { name: 'Orc Warlord', emoji: '👹', hp: 300, atk: 25, def: 12, spd: 6, exp: 80, coinMin: 1000, coinMax: 2000, loot: 'ramuan_hp_besar', lootChance: 50, pin: 'Orc Warlord fantasy anime' },
    { name: 'Dark Dragon', emoji: '🐉', hp: 500, atk: 40, def: 20, spd: 10, exp: 150, coinMin: 2000, coinMax: 3500, loot: 'scroll_crit', lootChance: 40, pin: 'Dark Dragon anime fantasy' },
    { name: 'Demon Lord', emoji: '😈', hp: 800, atk: 55, def: 30, spd: 12, exp: 250, coinMin: 3000, coinMax: 5000, loot: 'enchant_stone', lootChance: 35, pin: 'Demon Lord anime dark fantasy' }
];

// ============================================================
// LEVEL UP
// ============================================================
function getExpToLevel(level) { return level * 100; }

function checkLevelUp(playerId) {
    const player = getPlayer(playerId);
    const rpg = player.rpg;
    if (!rpg) return null;
    let leveled = false;
    while (rpg.exp >= getExpToLevel(rpg.level)) {
        rpg.exp -= getExpToLevel(rpg.level);
        rpg.level++;
        rpg.maxHp += 10;
        rpg.hp = rpg.maxHp;
        rpg.atk += 3;
        rpg.def += 2;
        rpg.spd += 1;
        rpg.skillPoints = (rpg.skillPoints || 0) + 1;
        leveled = true;
    }
    updatePlayer(playerId, player);
    return leveled ? rpg.level : null;
}

// ============================================================
// BUFF TICK
// ============================================================
function tickBuffs(playerId) {
    const player = getPlayer(playerId);
    if (!player.rpg || !player.rpg.buffs) return;
    player.rpg.buffs = player.rpg.buffs.filter(b => { b.duration--; return b.duration > 0; });
    if (player.rpg.skillCooldown > 0) player.rpg.skillCooldown--;
    updatePlayer(playerId, player);
}

// ============================================================
// ACHIEVEMENTS
// ============================================================
function checkAchievements(playerId) {
    const player = getPlayer(playerId);
    if (!player.rpg) return [];
    const newAchs = [];
    for (const [id, ach] of Object.entries(RPG_ACHIEVEMENTS)) {
        if ((player.rpg.achievements || []).includes(id)) continue;
        try { if (ach.check(player.rpg, player)) { player.rpg.achievements.push(id); newAchs.push(ach); } } catch (e) {}
    }
    if (newAchs.length > 0) updatePlayer(playerId, player);
    return newAchs;
}

// ============================================================
// QUEST TRACKING
// ============================================================
function trackQuest(playerId, type, amount = 1) {
    const player = getPlayer(playerId);
    if (!player.rpg?.quest || player.rpg.quest.type !== type) return null;
    player.rpg.quest.progress = (player.rpg.quest.progress || 0) + amount;
    if (player.rpg.quest.progress >= player.rpg.quest.target) {
        const reward = player.rpg.quest.reward;
        player.rpg.exp += reward.exp || 0;
        player.coins += reward.coins || 0;
        if (reward.item) player.rpg.inventory.push(reward.item);
        player.rpg.questsCompleted = (player.rpg.questsCompleted || 0) + 1;
        const completed = { ...player.rpg.quest };
        player.rpg.quest = null;
        updatePlayer(playerId, player);
        return completed;
    }
    updatePlayer(playerId, player);
    return false;
}

// ============================================================
// RPG INIT
// ============================================================
function initRPG(playerId, className) {
    const player = getPlayer(playerId);
    const cls = RPG_CLASSES[className];
    player.rpg = {
        class: className, evolution: null,
        level: 1, exp: 0,
        hp: cls.hp, maxHp: cls.hp,
        atk: cls.atk, def: cls.def, spd: cls.spd, crit: cls.crit,
        weapon: cls.starterWeapon, weaponEnchant: 0,
        armor: 'kulit_biasa', shield: 'tameng_kayu',
        inventory: ['ramuan_hp', 'ramuan_hp', 'ramuan_hp'],
        buffs: [],
        wins: 0, losses: 0, monstersKilled: 0,
        skillCooldown: 0,
        achievements: [], title: null,
        quest: null, questsCompleted: 0, lastQuestReset: 0,
        dungeonFloor: 0, lastDungeon: 0,
        pet: null,
        arena: { elo: 0, wins: 0, losses: 0, streak: 0 },
        guildName: null, guildRole: null,
        craftCount: 0, totalSpent: 0,
        skillPoints: 0, skillTree: [],
        base: {}, storyChapter: 0,
        summon: null, inDarkWorld: false,
        isDead: false, weaponAwakened: false,
        stamina: MAX_STAMINA, lastStaminaRegen: Date.now(),
        karma: 0, durability: MAX_DURABILITY,
        element: CLASS_ELEMENTS[className] || 'neutral',
    };
    updatePlayer(playerId, player);
    return player;
}

// ============================================================
// ARENA RANK
// ============================================================
function getArenaRank(elo) {
    for (let i = ARENA_RANKS.length - 1; i >= 0; i--) {
        if (elo >= ARENA_RANKS[i].minElo) return ARENA_RANKS[i];
    }
    return ARENA_RANKS[0];
}

// ============================================================
// TEXT CLEANER
// ============================================================
const { REPLACEMENT_CHAR: RC } = require('../../config');

function cleanOutgoingText(value) {
    if (typeof value !== 'string') return value;
    return value.split(RC).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trimEnd();
}

function cleanOutgoingMessage(content) {
    if (!content || typeof content !== 'object') return content;
    const cleaned = { ...content };
    if (typeof cleaned.text === 'string') cleaned.text = cleanOutgoingText(cleaned.text);
    if (typeof cleaned.caption === 'string') cleaned.caption = cleanOutgoingText(cleaned.caption);
    return cleaned;
}

function installOutgoingTextCleaner(sock) {
    const originalSendMessage = sock.sendMessage.bind(sock);
    sock.sendMessage = (jid, content, options) => originalSendMessage(jid, cleanOutgoingMessage(content), options);
}

// ============================================================
// CHUNK ARRAY
// ============================================================
function chunkArray(list, size) {
    if (!Array.isArray(list) || size <= 0) return [];
    const chunks = [];
    for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
    return chunks;
}

module.exports = {
    // Time & Weather
    getTimePhase, getTimeLabel, getTimeMultipliers, updateWeather,
    // Karma
    getKarmaLevel,
    // Elements
    getElementBonus,
    // Pet
    getPetStats,
    // Stats
    getBuffedStats,
    // Battle
    calcDamage, isDodge, isBlocked, quickBattle, quickPartyBattle, runBattle,
    // Monster
    getMonsterForLevel, getDungeonMonster, getRaidBoss, RPG_RAIDS,
    // Level
    getExpToLevel, checkLevelUp,
    // Buff
    tickBuffs,
    // Achievement
    checkAchievements,
    // Quest
    trackQuest,
    // Init
    initRPG,
    // Arena
    getArenaRank,
    // Text
    cleanOutgoingText, cleanOutgoingMessage, installOutgoingTextCleaner,
    // Util
    chunkArray
};
