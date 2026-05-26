// ============================================================
// modules/utility/db.js — Database & Player Management (JSON)
// Clean rewrite: no native dependencies, write queue protected
// ============================================================

const fs = require('fs');
const path = require('path');
const { BOT_CONFIG, DEFAULT_COINS, LEGACY_OLD_CURRENCY_KEY, LEGACY_OLD_BALANCE_KEY, COOLDOWNS } = require('../../config');

// Ensure temp dir exists
if (!fs.existsSync(BOT_CONFIG.TEMP_DIR)) {
    fs.mkdirSync(BOT_CONFIG.TEMP_DIR, { recursive: true });
}

// ============================================================
// WRITE QUEUE — prevents race conditions on JSON files
// ============================================================
const writeQueues = {};
function queueWrite(filePath, data) {
    writeQueues[filePath] = data;
    if (!writeQueues._timer) {
        writeQueues._timer = setTimeout(() => {
            for (const [fp, d] of Object.entries(writeQueues)) {
                if (fp === '_timer') continue;
                try {
                    fs.writeFileSync(fp, JSON.stringify(d, null, 2));
                } catch (e) {
                    console.error('[DB ERROR] write:', e.message);
                }
            }
            writeQueues._timer = null;
        }, 100);
    }
}

// ============================================================
// PLAYER DATA
// ============================================================
function loadPlayerData() {
    try {
        if (fs.existsSync(BOT_CONFIG.PLAYER_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(BOT_CONFIG.PLAYER_DATA_FILE, 'utf-8'));
        }
    } catch (e) {
        console.error('[DB ERROR] loadPlayerData:', e.message);
    }
    return {};
}

function savePlayerData(data) {
    queueWrite(BOT_CONFIG.PLAYER_DATA_FILE, data);
}

function getPlayer(playerId) {
    const data = loadPlayerData();
    if (!data[playerId]) {
        data[playerId] = {
            coins: DEFAULT_COINS,
            rpg: null,
            koleksi: [],
            displayName: null,
            lastDaily: null
        };
        savePlayerData(data);
    }
    return data[playerId];
}

function updatePlayer(playerId, playerInfo) {
    const data = loadPlayerData();
    data[playerId] = playerInfo;
    savePlayerData(data);
}

function getDisplayName(playerId) {
    const player = getPlayer(playerId);
    return player.displayName || playerId.split('@')[0];
}

// ============================================================
// CURRENCY NORMALIZATION (legacy migration)
// ============================================================
function normalizePlayerCurrency(player) {
    if (!player) return player;
    if (player[LEGACY_OLD_CURRENCY_KEY] !== undefined && player.coins === undefined) {
        player.coins = player[LEGACY_OLD_CURRENCY_KEY];
        delete player[LEGACY_OLD_CURRENCY_KEY];
    }
    if (player[LEGACY_OLD_BALANCE_KEY] !== undefined && player.coins === undefined) {
        player.coins = player[LEGACY_OLD_BALANCE_KEY];
        delete player[LEGACY_OLD_BALANCE_KEY];
    }
    if (player.coins === undefined) player.coins = DEFAULT_COINS;
    player.coins = Math.max(0, Math.floor(Number(player.coins) || 0));
    return player;
}

// ============================================================
// BAN SYSTEM
// ============================================================
function loadBannedUsers() {
    try {
        if (fs.existsSync(BOT_CONFIG.BANNED_FILE)) {
            return JSON.parse(fs.readFileSync(BOT_CONFIG.BANNED_FILE, 'utf-8'));
        }
    } catch (e) {}
    return [];
}

function saveBannedUsers(list) {
    try { fs.writeFileSync(BOT_CONFIG.BANNED_FILE, JSON.stringify(list, null, 2)); } catch (e) {}
}

function isBanned(jid) {
    const key = (jid || '').split('@')[0];
    return loadBannedUsers().some(b => b.split('@')[0] === key);
}

function banUser(jid) {
    if (isBanned(jid)) return;
    const list = loadBannedUsers();
    list.push(jid);
    saveBannedUsers(list);
}

function unbanUser(jid) {
    const key = (jid || '').split('@')[0];
    saveBannedUsers(loadBannedUsers().filter(b => b.split('@')[0] !== key));
}

// ============================================================
// ADMIN SYSTEM
// ============================================================
function loadAdmins() {
    try {
        if (fs.existsSync(BOT_CONFIG.ADMIN_USERS_FILE)) {
            return JSON.parse(fs.readFileSync(BOT_CONFIG.ADMIN_USERS_FILE, 'utf-8'));
        }
    } catch (e) {}
    return [];
}

function saveAdmins(list) {
    try { fs.writeFileSync(BOT_CONFIG.ADMIN_USERS_FILE, JSON.stringify(list, null, 2)); } catch (e) {}
}

function isBotAdmin(jid) {
    return loadAdmins().some(a => a === jid) || (BOT_CONFIG.ADMIN_NUMBERS || []).map(normalizeJid).includes(jid);
}

// ============================================================
// OWNER CHECK — ABSOLUT, NO EXCEPTIONS
// ============================================================
function isOwner(jid) {
    if (!jid) return false;
    const clean = jid.split(':')[0].split('@')[0];
    const ownerFull = BOT_CONFIG.OWNER_NUMBER;
    const ownerLid = BOT_CONFIG.OWNER_LID || '';
    const ownerClean = ownerFull.split('@')[0];
    return jid === ownerFull || jid === ownerLid || clean === ownerClean;
}

function isPrivileged(jid) {
    return isOwner(jid) || isBotAdmin(jid);
}

// ============================================================
// JID UTILITIES
// ============================================================
function normalizeJid(jid) {
    if (!jid) return '';
    jid = jid.trim();
    if (!jid.includes('@')) return jid + '@s.whatsapp.net';
    return jid;
}

function jidKey(jid) { return jid.split('@')[0]; }
function sameJid(a, b) { return normalizeJid(a) === normalizeJid(b); }

// ============================================================
// GUILD DATA
// ============================================================
function loadGuildData() {
    try {
        if (fs.existsSync(BOT_CONFIG.GUILD_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(BOT_CONFIG.GUILD_DATA_FILE, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

function saveGuildData(data) {
    try { fs.writeFileSync(BOT_CONFIG.GUILD_DATA_FILE, JSON.stringify(data, null, 2)); } catch (e) {}
}

function getGuild(name) {
    return loadGuildData()[name.toLowerCase()] || null;
}

function saveGuild(name, data) {
    const all = loadGuildData();
    all[name.toLowerCase()] = data;
    saveGuildData(all);
}

function deleteGuild(name) {
    const all = loadGuildData();
    delete all[name.toLowerCase()];
    saveGuildData(all);
}

function findPlayerGuild(playerId) {
    const all = loadGuildData();
    for (const [name, g] of Object.entries(all)) {
        if (g.leader === playerId) return { name, ...g };
        if ((g.members || []).includes(playerId)) return { name, ...g };
    }
    return null;
}

// ============================================================
// MARKET DATA
// ============================================================
function loadMarketData() {
    try {
        if (fs.existsSync(BOT_CONFIG.MARKET_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(BOT_CONFIG.MARKET_DATA_FILE, 'utf-8'));
        }
    } catch (e) {}
    return [];
}

function saveMarketData(data) {
    try { fs.writeFileSync(BOT_CONFIG.MARKET_DATA_FILE, JSON.stringify(data, null, 2)); } catch (e) {}
}

// ============================================================
// BOUNTY DATA
// ============================================================
function loadBountyData() {
    try {
        if (fs.existsSync(BOT_CONFIG.BOUNTY_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(BOT_CONFIG.BOUNTY_DATA_FILE, 'utf-8'));
        }
    } catch (e) {}
    return {};
}

function saveBountyData(data) {
    try { fs.writeFileSync(BOT_CONFIG.BOUNTY_DATA_FILE, JSON.stringify(data, null, 2)); } catch (e) {}
}

// ============================================================
// CUSTOM ITEMS
// ============================================================
const CUSTOM_ITEMS_FILE = './database/custom_items.json';

function loadCustomItems() {
    try {
        if (fs.existsSync(CUSTOM_ITEMS_FILE)) {
            const data = JSON.parse(fs.readFileSync(CUSTOM_ITEMS_FILE, 'utf-8'));
            const { RPG_WEAPONS, RPG_ARMORS, RPG_ITEMS } = require('../../config');
            if (data.weapons) Object.assign(RPG_WEAPONS, data.weapons);
            if (data.armors) Object.assign(RPG_ARMORS, data.armors);
            if (data.items) Object.assign(RPG_ITEMS, data.items);
            return data;
        }
    } catch (e) {
        console.error('[DB ERROR] loadCustomItems:', e.message);
    }
    return { weapons: {}, armors: {}, items: {} };
}

function saveCustomItems(data) {
    try {
        if (!fs.existsSync('./database')) fs.mkdirSync('./database');
        fs.writeFileSync(CUSTOM_ITEMS_FILE, JSON.stringify(data, null, 2));
        loadCustomItems();
    } catch (e) {
        console.error('[DB ERROR] saveCustomItems:', e.message);
    }
}

// ============================================================
// COOLDOWN SYSTEM (in-memory)
// ============================================================
const playerCooldowns = {};

function checkCooldown(playerId, action) {
    if (!playerCooldowns[playerId]) playerCooldowns[playerId] = {};
    const last = playerCooldowns[playerId][action] || 0;
    const cd = COOLDOWNS[action] || 0;
    const remaining = cd - (Date.now() - last);
    if (remaining > 0) return remaining;
    playerCooldowns[playerId][action] = Date.now();
    return 0;
}

function formatCooldown(ms) {
    if (ms >= 60000) return `${Math.ceil(ms/60000)}m`;
    return `${Math.ceil(ms/1000)}s`;
}

// ============================================================
// ACTIVE SESSIONS (in-memory, persisted via JSON files)
// ============================================================
const activeDuels = {};
const activeRaids = {};
const activeGambles = {};
let activeWorldBoss = null;
let activeDemonInvasion = null;

function saveSession(key, data) {
    try {
        fs.writeFileSync(`./sessions_${key}.json`, JSON.stringify(data, null, 2));
    } catch (e) {}
}

function loadSession(key) {
    try {
        const file = `./sessions_${key}.json`;
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {}
    return null;
}

// Auto-save sessions every 30 seconds
setInterval(() => {
    saveSession('activeDuels', activeDuels);
    saveSession('activeRaids', activeRaids);
    saveSession('activeGambles', activeGambles);
    if (activeWorldBoss) saveSession('activeWorldBoss', activeWorldBoss);
    if (activeDemonInvasion) saveSession('activeDemonInvasion', activeDemonInvasion);
}, 30000);

// Restore sessions on startup
Object.assign(activeDuels, loadSession('activeDuels') || {});
Object.assign(activeRaids, loadSession('activeRaids') || {});
Object.assign(activeGambles, loadSession('activeGambles') || {});
const savedBoss = loadSession('activeWorldBoss');
const savedInvasion = loadSession('activeDemonInvasion');
if (savedBoss) activeWorldBoss = savedBoss;
if (savedInvasion) activeDemonInvasion = savedInvasion;

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    getPlayer, updatePlayer, getDisplayName,
    normalizePlayerCurrency,
    loadBannedUsers, saveBannedUsers, isBanned, banUser, unbanUser,
    loadAdmins, saveAdmins, isBotAdmin, isOwner, isPrivileged,
    normalizeJid, jidKey, sameJid,
    getGuild, saveGuild, deleteGuild, findPlayerGuild,
    loadMarketData, saveMarketData,
    loadBountyData, saveBountyData,
    loadCustomItems, saveCustomItems,
    checkCooldown, formatCooldown,
    playerCooldowns, activeDuels, activeRaids, activeGambles, activeWorldBoss, activeDemonInvasion,
    saveSession, loadSession,
    loadPlayerData, savePlayerData
};

// Initialize on load
loadCustomItems();
