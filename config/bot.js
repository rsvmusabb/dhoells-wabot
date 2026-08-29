/**
 * @file bot.js
 * @description Master Configuration File for Claryn Bot.
 *              Contains global constants, feature toggles, file paths, 
 *              currency mechanics, cooldown metrics, and menu routing arrays.
 * @author OWL ABE
 * @version 3.0.0
 * @license MIT
 */

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// CORE BOT CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const BOT_CONFIG = {
    // ── SYSTEM SETTINGS ──
    DELAY_PER_MESSAGE: 5000,
    PROCESS_OWN_COMMANDS: process.env.PROCESS_OWN_COMMANDS === '1',
    DEBUG_INCOMING_MESSAGES: process.env.DEBUG_INCOMING_MESSAGES === '1',
    
    // ── ACCESS CONTROL ──
    ADMIN_NUMBERS: [],
    OWNER_NUMBER: '6285975216127@s.whatsapp.net',
    OWNER_LID: '143362233520260@lid',
    OWNER_NUMBERS: ['6285975216127'], // Bare numbers for flexible regex matching
    
    // ── FILE SYSTEM PATHS ──
    TEMP_DIR: './temp_audio',
    PLAYER_DATA_FILE: './player_data.json',
    BANNED_FILE: './banned_users.json',
    ADMIN_USERS_FILE: './admin_users.json',
    GUILD_DATA_FILE: './guild_data.json',
    MARKET_DATA_FILE: './marketplace.json',
    BOUNTY_DATA_FILE: './bounty_data.json',
    
    // ── API INTEGRATIONS ──
    // Supports multi-key rotation to bypass rate limits
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS 
        ? process.env.GEMINI_API_KEYS.split(',') 
        : [process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY'],
    
    // ── ECONOMY SETTINGS ──
    DAILY_COOLDOWN: 24 * 60 * 60 * 1000,
    GUILD_CREATE_COST: 500,
    GUILD_BUFF_COST: 50,
    GUILD_BUFF_DURATION: 3 * 60 * 60 * 1000,
    MARKET_FEE: 0.1 // 10% transaction tax
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// UI / UX CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const REPLACEMENT_CHAR = String.fromCodePoint(0xFFFD);

/**
 * Unicode Frame Drawing Characters for Terminal-style UI in WhatsApp
 */
const FRAME = Object.freeze({
    tl: String.fromCodePoint(0x256D),     // ╭
    branch: String.fromCodePoint(0x2523), // ┣
    bl: String.fromCodePoint(0x2570),     // ╰
    v: String.fromCodePoint(0x2503),      // ┃
    h: String.fromCodePoint(0x2501)       // ━
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// CURRENCY SYSTEM
// ════════════════════════════════════════════════════════════════════════════════════════════════════
/** 
 * Conversion Rate: 
 * 1 Gold = 100 Silver = 5,000 Bronze 
 * 1 Silver = 50 Bronze
 */
const COIN_UNITS = [
    { name: 'Gold', value: 5000 },
    { name: 'Silver', value: 50 },
    { name: 'Bronze', value: 1 }
];

const COIN_EMOJI = { 
    Gold: '\uD83E\uDE99',   // 🪙
    Silver: '\uD83E\uDD48', // 🥈
    Bronze: '\uD83E\uDD49'  // 🥉
};

const DEFAULT_COINS = 50;

// Internal obfuscation for anti-cheat serialization
const LEGACY_OLD_CURRENCY_KEY = 'to' + 'ken';
const LEGACY_OLD_BALANCE_KEY = 'mon' + 'ey';

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// COOLDOWN METRICS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const COOLDOWNS = {
    hunt: 30 * 1000,
    dungeon: 3 * 60 * 1000,
    arena: 2 * 60 * 1000,
    darkworld: 5 * 60 * 1000,
    craft: 10 * 1000,
    enchant: 30 * 1000,
    respawn: 10 * 60 * 1000,
    pin: 5 * 60 * 1000
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// MENU ROUTING SYSTEM
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const MENU_ORDER = ['rpg', 'games', 'image', 'media', 'ai', 'utility', 'education', 'admin', 'owner'];

const MENU_COMMANDS = {
    rpg: '.menurpg', 
    games: '.menugame', 
    image: '.menupin', 
    media: '.menumedia',
    ai: '.menuclaryn', 
    utility: '.menuutil', 
    education: '.menueducation',
    admin: '.menuadmin', 
    owner: '.menuowner'
};

const MENU_ALIAS = {
    // Direct menu commands
    'menu': 'main', 'mainmenu': 'main',
    'menurpg': 'rpg', 'menuadventure': 'rpg', 'menukasino': 'rpg', 'menujudi': 'rpg', 'menucasino': 'rpg',
    'menugame': 'games', 'menugames': 'games', 'menuminigame': 'games', 'menugacha': 'games',
    'menupin': 'image', 'menuimage': 'image', 'menugambar': 'image', 'menucari': 'image',
    'menumedia': 'media', 'menusmedia': 'media', 'menumusic': 'media', 'menusticker': 'media',
    'menuai': 'ai', 'menuclaryn': 'ai', 'menuchat': 'ai', 'menutanya': 'ai',
    'menuutil': 'utility', 'menuutility': 'utility', 'menuutilitas': 'utility', 'menucuaca': 'utility',
    'menueducation': 'education', 'menuedu': 'education', 'menujadwal': 'education', 'menumatkul': 'education', 'menufisika': 'education',
    'menuadmin': 'admin', 'panel': 'admin',
    'menuowner': 'owner', 'menugod': 'owner',
    
    // Short aliases
    'rpg': 'rpg', 'adventure': 'rpg', 'kasino': 'rpg', 'casino': 'rpg', 'judi': 'rpg',
    'game': 'games', 'games': 'games', 'minigame': 'games', 'gacha': 'games',
    'pin': 'image', 'image': 'image', 'gambar': 'image', 'cari': 'image',
    'media': 'media', 'musik': 'media', 'lagu': 'media', 'sticker': 'media',
    'ai': 'ai', 'chat': 'ai', 'tanya': 'ai', 'claryn': 'ai',
    'util': 'utility', 'utility': 'utility', 'cuaca': 'utility',
    'edu': 'education', 'education': 'education', 'jadwal': 'education', 'matkul': 'education', 'fisika': 'education',
    'admin': 'admin', 'owner': 'owner', 'god': 'owner',
    
    // Pin/media submenu aliases
    'pinmenu': 'image', 'imagemenu': 'image', 'mediamenu': 'media',
    'utilitymenu': 'utility', 'adminmenu': 'admin', 'ownermenu': 'owner'
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
module.exports = {
    BOT_CONFIG, REPLACEMENT_CHAR, FRAME,
    COIN_UNITS, COIN_EMOJI, DEFAULT_COINS,
    LEGACY_OLD_CURRENCY_KEY, LEGACY_OLD_BALANCE_KEY,
    COOLDOWNS, MENU_ORDER, MENU_COMMANDS, MENU_ALIAS
};
