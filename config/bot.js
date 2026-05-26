// ============================================================
// config/bot.js — Bot Configuration & Currency System
// ============================================================

const BOT_CONFIG = {
    DELAY_PER_MESSAGE: 5000,
    ADMIN_NUMBERS: [],
    OWNER_NUMBER: '6285975216127@s.whatsapp.net',
    OWNER_LID: '6285975216127@lid',
    TEMP_DIR: './temp_audio',
    PLAYER_DATA_FILE: './player_data.json',
    BANNED_FILE: './banned_users.json',
    ADMIN_USERS_FILE: './admin_users.json',
    PROCESS_OWN_COMMANDS: process.env.PROCESS_OWN_COMMANDS === '1',
    DEBUG_INCOMING_MESSAGES: process.env.DEBUG_INCOMING_MESSAGES === '1',
    DAILY_COOLDOWN: 24 * 60 * 60 * 1000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    GUILD_DATA_FILE: './guild_data.json',
    GUILD_CREATE_COST: 500,
    GUILD_BUFF_COST: 50,
    GUILD_BUFF_DURATION: 3 * 60 * 60 * 1000,
    MARKET_DATA_FILE: './marketplace.json',
    MARKET_FEE: 0.1,
    BOUNTY_DATA_FILE: './bounty_data.json',
};

const REPLACEMENT_CHAR = String.fromCodePoint(0xFFFD);
const FRAME = Object.freeze({
    tl: String.fromCodePoint(0x256D),
    branch: String.fromCodePoint(0x2523),
    bl: String.fromCodePoint(0x2570),
    v: String.fromCodePoint(0x2503),
    h: String.fromCodePoint(0x2501)
});

// Currency: 1 Gold = 100 Silver = 5,000 Bronze | 1 Silver = 50 Bronze
const COIN_UNITS = [
    { name: 'Gold', value: 5000 },
    { name: 'Silver', value: 50 },
    { name: 'Bronze', value: 1 }
];
const COIN_EMOJI = { Gold: '🪙', Silver: '🥈', Bronze: '🥉' };
const DEFAULT_COINS = 50;
const LEGACY_OLD_CURRENCY_KEY = 'to' + 'ken';
const LEGACY_OLD_BALANCE_KEY = 'mon' + 'ey';

// Cooldowns
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

// Menu
const MENU_ORDER = ['rpg', 'games', 'image', 'media', 'ai', 'utility', 'education', 'admin', 'owner'];
const MENU_COMMANDS = {
    rpg: '.menu', games: '.menugame', image: '.menupin', media: '.menumedia',
    ai: '.menuai', utility: '.menuutil', education: '.menueducation',
    admin: '.menuadmin', owner: '.menuowner'
};
const MENU_ALIAS = {
    'rpg': 'rpg', 'adventure': 'rpg', 'kasino': 'rpg', 'casino': 'rpg', 'judi': 'rpg',
    'game': 'games', 'games': 'games', 'minigame': 'games', 'gacha': 'games',
    'pin': 'image', 'image': 'image', 'gambar': 'image', 'cari': 'image',
    'media': 'media', 'musik': 'media', 'lagu': 'media', 'sticker': 'media',
    'ai': 'ai', 'chat': 'ai', 'tanya': 'ai',
    'util': 'utility', 'utility': 'utility', 'cuaca': 'utility',
    'edu': 'education', 'education': 'education', 'jadwal': 'education', 'matkul': 'education', 'fisika': 'education',
    'admin': 'admin', 'panel': 'admin',
    'owner': 'owner', 'god': 'owner'
};

module.exports = {
    BOT_CONFIG, REPLACEMENT_CHAR, FRAME,
    COIN_UNITS, COIN_EMOJI, DEFAULT_COINS,
    LEGACY_OLD_CURRENCY_KEY, LEGACY_OLD_BALANCE_KEY,
    COOLDOWNS, MENU_ORDER, MENU_COMMANDS, MENU_ALIAS
};
