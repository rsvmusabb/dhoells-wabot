// ============================================================
// config.js — Foundation module for Dhoells Bot
// All constants, RPG data, currency system, game config
// ============================================================

const fs = require('fs');
const path = require('path');

// ============================================================
// BOT CONFIGURATION
// ============================================================
const BOT_CONFIG = {
    DELAY_PER_MESSAGE: 5000,
    ADMIN_NUMBERS: [],
    OWNER_NUMBER: 'YOUR_PHONE_NUMBER@s.whatsapp.net',
    OWNER_LID: 'YOUR_LID_NUMBER@lid',
    TEMP_DIR: './temp_audio',
    PLAYER_DATA_FILE: './player_data.json',
    BANNED_FILE: './banned_users.json',
    ADMIN_USERS_FILE: './admin_users.json',
    DAILY_COOLDOWN: 24 * 60 * 60 * 1000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY', // Get free key from https://aistudio.google.com/apikey
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

// ============================================================
// CURRENCY SYSTEM — 1 Gold = 100 Silver = 5,000 Bronze
// 1 Silver = 50 Bronze, 1 Gold = 100 Silver
// ============================================================
const COIN_UNITS = [
    { name: 'Gold', value: 5000 },
    { name: 'Silver', value: 50 },
    { name: 'Bronze', value: 1 }
];
const COIN_EMOJI = { Gold: '🪙', Silver: '🥈', Bronze: '🥉' };
const DEFAULT_COINS = 50;
const LEGACY_OLD_CURRENCY_KEY = 'to' + 'ken';
const LEGACY_OLD_BALANCE_KEY = 'mon' + 'ey';

// ============================================================
// RPG CLASSES
// ============================================================
const RPG_CLASSES = {
    warrior:     { emoji: '⚔️', name: 'Warrior',     hp: 120, atk: 12, def: 10, spd: 5,  crit: 10, passive: '+15% DEF',         skill: 'Shield Bash',    skillDesc: 'Stun lawan 1 turn',              starterWeapon: 'pedang_kayu' },
    archer:      { emoji: '🏹', name: 'Archer',      hp: 90,  atk: 15, def: 5,  spd: 12, crit: 25, passive: '+20% CRIT',        skill: 'Rain of Arrows', skillDesc: '2x hit serangan',                starterWeapon: 'busur_kayu' },
    mage:        { emoji: '🔮', name: 'Mage',        hp: 80,  atk: 18, def: 4,  spd: 8,  crit: 15, passive: '+25% ATK',         skill: 'Fireball',       skillDesc: 'Damage besar + burn',             starterWeapon: 'tongkat_kayu' },
    assassin:    { emoji: '🗡️', name: 'Assassin',    hp: 85,  atk: 16, def: 3,  spd: 15, crit: 30, passive: '+20% SPD',         skill: 'Shadow Strike',  skillDesc: 'Ignore DEF lawan',               starterWeapon: 'belati_kayu' },
    necromancer: { emoji: '☠️', name: 'Necromancer', hp: 100, atk: 14, def: 6,  spd: 7,  crit: 12, passive: 'Lifesteal 15%',    skill: 'Soul Drain',     skillDesc: 'Serang + heal 50% damage dealt',  starterWeapon: 'sabit_kayu' },
    paladin:     { emoji: '🛡️', name: 'Paladin',     hp: 140, atk: 10, def: 12, spd: 4,  crit: 8,  passive: 'Regen 5/turn',     skill: 'Holy Shield',    skillDesc: 'Block semua damage 1 turn + heal 30', starterWeapon: 'palu_kayu' },
    samurai:     { emoji: '⚔️', name: 'Samurai',     hp: 95,  atk: 17, def: 7,  spd: 10, crit: 20, passive: 'Counter 20%',      skill: 'Iaijutsu',       skillDesc: 'Serangan kilat, ignore dodge',    starterWeapon: 'katana_kayu' },
    berserker:   { emoji: '🪓', name: 'Berserker',   hp: 110, atk: 14, def: 5,  spd: 8,  crit: 18, passive: 'Rage +ATK saat HP rendah', skill: 'Blood Rage', skillDesc: 'ATK x2 selama 2 turn, DEF-50%', starterWeapon: 'kapak_kayu' },
    shaman:      { emoji: '🌿', name: 'Shaman',      hp: 95,  atk: 13, def: 8,  spd: 6,  crit: 10, passive: 'Poison 10% chance', skill: 'Hex',           skillDesc: 'Kurangi ATK+DEF lawan 30% 3 turn', starterWeapon: 'totem_kayu' }
};

// ============================================================
// RPG WEAPONS
// ============================================================
const RPG_WEAPONS = {
    pedang_kayu:   { name: 'Pedang Kayu',   atk: 3,  class: 'warrior', tier: 1, price: 0,   emoji: '🗡️' },
    pedang_besi:   { name: 'Pedang Besi',   atk: 8,  class: 'warrior', tier: 2, price: 1500,  emoji: '⚔️' },
    pedang_perak:  { name: 'Pedang Perak',  atk: 15, class: 'warrior', tier: 3, price: 3000,  emoji: '🗡️' },
    pedang_api:    { name: 'Pedang Api',    atk: 25, class: 'warrior', tier: 4, price: 6000,  emoji: '🔥' },
    excalibur:     { name: 'Excalibur',     atk: 45, class: 'warrior', tier: 5, price: 15000, emoji: '✨' },
    busur_kayu:    { name: 'Busur Kayu',    atk: 3,  class: 'archer',  tier: 1, price: 0,   emoji: '🏹' },
    busur_besi:    { name: 'Busur Besi',    atk: 8,  class: 'archer',  tier: 2, price: 1500,  emoji: '🏹' },
    busur_angin:   { name: 'Busur Angin',   atk: 15, class: 'archer',  tier: 3, price: 3000,  emoji: '💨' },
    busur_petir:   { name: 'Busur Petir',   atk: 25, class: 'archer',  tier: 4, price: 6000,  emoji: '⚡' },
    artemis_bow:   { name: 'Artemis Bow',   atk: 45, class: 'archer',  tier: 5, price: 15000, emoji: '🌙' },
    tongkat_kayu:  { name: 'Tongkat Kayu',  atk: 3,  class: 'mage',    tier: 1, price: 0,   emoji: '🪄' },
    tongkat_kristal:{ name: 'Tongkat Kristal', atk: 8, class: 'mage',  tier: 2, price: 1500,  emoji: '💎' },
    tongkat_sihir: { name: 'Tongkat Sihir', atk: 15, class: 'mage',    tier: 3, price: 3000,  emoji: '🔮' },
    tongkat_api:   { name: 'Tongkat Api',   atk: 25, class: 'mage',    tier: 4, price: 6000,  emoji: '🔥' },
    staff_merlin:  { name: 'Staff of Merlin', atk: 45, class: 'mage',  tier: 5, price: 15000, emoji: '⭐' },
    belati_kayu:   { name: 'Belati Kayu',   atk: 3,  class: 'assassin', tier: 1, price: 0,   emoji: '🔪' },
    belati_besi:   { name: 'Belati Besi',   atk: 8,  class: 'assassin', tier: 2, price: 1500,  emoji: '🗡️' },
    belati_bayangan:{ name: 'Belati Bayangan', atk: 15, class: 'assassin', tier: 3, price: 3000, emoji: '🌑' },
    belati_racun:  { name: 'Belati Racun',  atk: 25, class: 'assassin', tier: 4, price: 6000,  emoji: '☠️' },
    phantom_blade: { name: 'Phantom Blade', atk: 45, class: 'assassin', tier: 5, price: 15000, emoji: '👻' },
    // Necromancer weapons
    sabit_kayu:    { name: 'Sabit Kayu',     atk: 3,  class: 'necromancer', tier: 1, price: 0,     emoji: '🪓' },
    sabit_besi:    { name: 'Sabit Besi',     atk: 8,  class: 'necromancer', tier: 2, price: 1500,  emoji: '☠️' },
    sabit_jiwa:    { name: 'Sabit Jiwa',     atk: 15, class: 'necromancer', tier: 3, price: 3000,  emoji: '💀' },
    sabit_kutukan: { name: 'Sabit Kutukan',  atk: 25, class: 'necromancer', tier: 4, price: 6000,  emoji: '🔮' },
    deaths_scythe: { name: "Death's Scythe", atk: 45, class: 'necromancer', tier: 5, price: 15000, emoji: '🌑' },
    // Paladin weapons
    palu_kayu:     { name: 'Palu Kayu',      atk: 3,  class: 'paladin', tier: 1, price: 0,     emoji: '🔨' },
    palu_besi:     { name: 'Palu Besi',      atk: 8,  class: 'paladin', tier: 2, price: 1500,  emoji: '🔨' },
    palu_suci:     { name: 'Palu Suci',      atk: 15, class: 'paladin', tier: 3, price: 3000,  emoji: '✨' },
    palu_cahaya:   { name: 'Palu Cahaya',    atk: 25, class: 'paladin', tier: 4, price: 6000,  emoji: '🌟' },
    mjolnir:       { name: 'Mjolnir',        atk: 45, class: 'paladin', tier: 5, price: 15000, emoji: '⚡' },
    // Samurai weapons
    katana_kayu:   { name: 'Katana Kayu',    atk: 3,  class: 'samurai', tier: 1, price: 0,     emoji: '🌾' },
    katana_besi:   { name: 'Katana Besi',    atk: 8,  class: 'samurai', tier: 2, price: 1500,  emoji: '⚔️' },
    katana_angin:  { name: 'Katana Angin',   atk: 15, class: 'samurai', tier: 3, price: 3000,  emoji: '🌬️' },
    katana_naga:   { name: 'Katana Naga',    atk: 25, class: 'samurai', tier: 4, price: 6000,  emoji: '🐉' },
    muramasa:      { name: 'Muramasa',       atk: 45, class: 'samurai', tier: 5, price: 15000, emoji: '🌙' },
    // Berserker weapons
    kapak_kayu:    { name: 'Kapak Kayu',     atk: 3,  class: 'berserker', tier: 1, price: 0,     emoji: '🪵' },
    kapak_besi:    { name: 'Kapak Besi',     atk: 8,  class: 'berserker', tier: 2, price: 1500,  emoji: '🪓' },
    kapak_perang:  { name: 'Kapak Perang',   atk: 15, class: 'berserker', tier: 3, price: 3000,  emoji: '🔥' },
    kapak_darah:   { name: 'Kapak Darah',    atk: 25, class: 'berserker', tier: 4, price: 6000,  emoji: '❤️‍🔥' },
    ragnarok_axe:  { name: 'Ragnarok Axe',   atk: 45, class: 'berserker', tier: 5, price: 15000, emoji: '🌋' },
    // Shaman weapons
    totem_kayu:    { name: 'Totem Kayu',     atk: 3,  class: 'shaman', tier: 1, price: 0,     emoji: '🌿' },
    totem_batu:    { name: 'Totem Batu',     atk: 8,  class: 'shaman', tier: 2, price: 1500,  emoji: '🪨' },
    totem_roh:     { name: 'Totem Roh',      atk: 15, class: 'shaman', tier: 3, price: 3000,  emoji: '👻' },
    totem_alam:    { name: 'Totem Alam',     atk: 25, class: 'shaman', tier: 4, price: 6000,  emoji: '🌍' },
    gaia_staff:    { name: 'Gaia Staff',     atk: 45, class: 'shaman', tier: 5, price: 15000, emoji: '🌳' },
    
    // ==========================================
    // TIER 6 (Mythic) - ATK: 75, Price: 30000
    // ==========================================
    pedang_mythic: { name: 'Godslayer Sword',atk: 75, class: 'warrior', tier: 6, price: 30000, emoji: '🗡️' },
    busur_mythic:  { name: 'Mythic Bow',     atk: 75, class: 'archer',  tier: 6, price: 30000, emoji: '🏹' },
    tongkat_mythic:{ name: 'Mythic Staff',   atk: 75, class: 'mage',    tier: 6, price: 30000, emoji: '🪄' },
    belati_mythic: { name: 'Mythic Dagger',  atk: 75, class: 'assassin',tier: 6, price: 30000, emoji: '🔪' },
    sabit_mythic:  { name: 'Mythic Scythe',  atk: 75, class: 'necromancer', tier: 6, price: 30000, emoji: '🪓' },
    palu_mythic:   { name: 'Mythic Hammer',  atk: 75, class: 'paladin', tier: 6, price: 30000, emoji: '🔨' },
    katana_mythic: { name: 'Mythic Katana',  atk: 75, class: 'samurai', tier: 6, price: 30000, emoji: '⚔️' },
    kapak_mythic:  { name: 'Mythic Axe',     atk: 75, class: 'berserker',tier: 6, price: 30000, emoji: '🪓' },
    totem_mythic:  { name: 'Mythic Totem',   atk: 75, class: 'shaman',  tier: 6, price: 30000, emoji: '🪵' },

    // ==========================================
    // TIER 7 (Divine) - ATK: 120, Price: 60000
    // ==========================================
    pedang_divine: { name: 'Divine Excalibur', atk: 120, class: 'warrior', tier: 7, price: 60000, emoji: '✨' },
    busur_divine:  { name: 'Apollo Bow',       atk: 120, class: 'archer',  tier: 7, price: 60000, emoji: '☀️' },
    tongkat_divine:{ name: 'Staff of Yggdrasil',atk: 120,class: 'mage',    tier: 7, price: 60000, emoji: '🌳' },
    belati_divine: { name: 'Shadow Fang',      atk: 120, class: 'assassin',tier: 7, price: 60000, emoji: '🌑' },
    sabit_divine:  { name: 'Soul Reaper',      atk: 120, class: 'necromancer', tier: 7, price: 60000, emoji: '💀' },
    palu_divine:   { name: 'Aegis Hammer',     atk: 120, class: 'paladin', tier: 7, price: 60000, emoji: '🛡️' },
    katana_divine: { name: 'Masamune',         atk: 120, class: 'samurai', tier: 7, price: 60000, emoji: '🌸' },
    kapak_divine:  { name: 'Leviathan Axe',    atk: 120, class: 'berserker',tier: 7, price: 60000, emoji: '❄️' },
    totem_divine:  { name: 'Totem of Spirits', atk: 120, class: 'shaman',  tier: 7, price: 60000, emoji: '👻' },

    // ==========================================
    // TIER 8 (Godly) - ATK: 200, Price: 150000
    // ==========================================
    pedang_godly:  { name: 'Blade of Olympus', atk: 200, class: 'warrior', tier: 8, price: 150000, emoji: '⚡' },
    busur_godly:   { name: 'Bow of Heavens',   atk: 200, class: 'archer',  tier: 8, price: 150000, emoji: '🌠' },
    tongkat_godly: { name: 'Staff of Creation',atk: 200, class: 'mage',    tier: 8, price: 150000, emoji: '🌌' },
    belati_godly:  { name: 'Dagger of The Void',atk: 200,class: 'assassin',tier: 8, price: 150000, emoji: '🌌' },
    sabit_godly:   { name: 'Scythe of Hades',  atk: 200, class: 'necromancer', tier: 8, price: 150000, emoji: '🔥' },
    palu_godly:    { name: 'Hammer of Thor',   atk: 200, class: 'paladin', tier: 8, price: 150000, emoji: '⚡' },
    katana_godly:  { name: 'Blade of Amaterasu',atk:200, class: 'samurai', tier: 8, price: 150000, emoji: '☀️' },
    kapak_godly:   { name: 'Axe of Ares',      atk: 200, class: 'berserker',tier: 8, price: 150000, emoji: '💥' },
    totem_godly:   { name: 'Totem of Ancients',atk: 200, class: 'shaman',  tier: 8, price: 150000, emoji: '✨' }
};

// ============================================================
// RPG ITEMS (Potions, Scrolls, Consumables)
// ============================================================
const RPG_ITEMS = {
    ramuan_hp:          { name: 'Ramuan HP Kecil',    emoji: '❤️', price: 300,   desc: 'Heal +40 HP', type: 'heal', value: 40, category: 'potion', pin: 'health potion RPG fantasy' },
    ramuan_hp_sedang:   { name: 'Ramuan HP Sedang',   emoji: '💗', price: 600,   desc: 'Heal +80 HP', type: 'heal', value: 80, category: 'potion', pin: 'health potion RPG fantasy' },
    ramuan_hp_besar:    { name: 'Ramuan HP Besar',    emoji: '💖', price: 1200,  desc: 'Heal +150 HP', type: 'heal', value: 150, category: 'potion', pin: 'large health potion RPG' },
    ramuan_hp_full:     { name: 'Ramuan Full Heal',   emoji: '💝', price: 2000,  desc: 'Full heal HP', type: 'fullheal', value: 0, category: 'potion', pin: 'full heal potion fantasy' },
    ramuan_max:         { name: 'Ramuan Max',          emoji: '✨', price: 2500,  desc: 'Full heal + maxHP +15', type: 'maxheal', value: 15, category: 'potion', pin: 'max potion RPG fantasy' },
    ramuan_regen:       { name: 'Ramuan Regenerasi',   emoji: '🔄', price: 1800,  desc: 'Regen +20 HP/turn (3 turn)', type: 'buff', stat: 'regen', value: 20, duration: 3, category: 'potion', pin: 'regen potion fantasy' },
    ramuan_kekuatan:    { name: 'Ramuan Kekuatan',     emoji: '💪', price: 500,   desc: 'ATK +10 (2 battle)', type: 'buff', stat: 'atk', value: 10, duration: 2, category: 'potion', pin: 'strength potion RPG' },
    elixir_kekuatan:    { name: 'Elixir Kekuatan',     emoji: '🦾', price: 1500,  desc: 'ATK +25 (3 battle)', type: 'buff', stat: 'atk', value: 25, duration: 3, category: 'potion', pin: 'strength elixir fantasy' },
    ramuan_berserker:   { name: 'Ramuan Berserker',    emoji: '😤', price: 2200,  desc: 'ATK +40, DEF -10 (2 battle)', type: 'buff', stat: 'atk', value: 40, duration: 2, debuff: { stat: 'def', value: -10 }, category: 'potion', pin: 'berserker potion dark' },
    ramuan_pertahanan:  { name: 'Ramuan Pertahanan',   emoji: '🛡️', price: 500,  desc: 'DEF +10 (2 battle)', type: 'buff', stat: 'def', value: 10, duration: 2, category: 'potion', pin: 'defense potion RPG' },
    elixir_baja:        { name: 'Elixir Baja',         emoji: '🔩', price: 1500,  desc: 'DEF +25 (3 battle)', type: 'buff', stat: 'def', value: 25, duration: 3, category: 'potion', pin: 'steel elixir fantasy' },
    ramuan_titan:       { name: 'Ramuan Titan',        emoji: '🗿', price: 3000,  desc: 'DEF +40, HP +50 (2 battle)', type: 'buff', stat: 'def', value: 40, duration: 2, category: 'potion', pin: 'titan potion fantasy' },
    ramuan_kecepatan:   { name: 'Ramuan Kecepatan',    emoji: '💨', price: 500,   desc: 'SPD +5 (3 battle)', type: 'buff', stat: 'spd', value: 5, duration: 3, category: 'potion', pin: 'speed potion RPG' },
    elixir_kilat:       { name: 'Elixir Kilat',        emoji: '⚡', price: 1200,  desc: 'SPD +12 (3 battle)', type: 'buff', stat: 'spd', value: 12, duration: 3, category: 'potion', pin: 'lightning elixir fantasy' },
    scroll_kritis:      { name: 'Scroll Kritis',       emoji: '🎯', price: 1000,  desc: 'CRIT +20% (2 battle)', type: 'buff', stat: 'crit', value: 20, duration: 2, category: 'scroll', pin: 'critical scroll fantasy' },
    scroll_kritis_max:  { name: 'Scroll Kritis Max',   emoji: '💢', price: 2000,  desc: 'CRIT +40% (1 battle)', type: 'buff', stat: 'crit', value: 40, duration: 1, category: 'scroll', pin: 'critical hit scroll anime' },
    scroll_api:         { name: 'Scroll Api',          emoji: '🔥', price: 800,   desc: 'ATK +15 fire (1 battle)', type: 'buff', stat: 'atk', value: 15, duration: 1, category: 'scroll', pin: 'fire scroll RPG' },
    scroll_petir:       { name: 'Scroll Petir',        emoji: '⛈️', price: 1200,  desc: 'ATK +25 thunder (1 battle)', type: 'buff', stat: 'atk', value: 25, duration: 1, category: 'scroll', pin: 'thunder scroll fantasy' },
    scroll_es:          { name: 'Scroll Es',           emoji: '❄️', price: 1000,  desc: 'ATK +18, SPD enemy -3 (1 battle)', type: 'buff', stat: 'atk', value: 18, duration: 1, category: 'scroll', pin: 'ice scroll RPG' },
    scroll_angin:       { name: 'Scroll Angin',        emoji: '🌪️', price: 1000,  desc: 'SPD +10, dodge +10% (2 battle)', type: 'buff', stat: 'spd', value: 10, duration: 2, category: 'scroll', pin: 'wind scroll fantasy' },
    jimat_dodge:        { name: 'Jimat Menghindar',    emoji: '🍃', price: 1500,  desc: 'Dodge +15% (2 battle)', type: 'buff', stat: 'dodge', value: 15, duration: 2, category: 'scroll', pin: 'dodge amulet fantasy' },
    jimat_block:        { name: 'Jimat Tameng',        emoji: '🔰', price: 1500,  desc: 'Block +15% (2 battle)', type: 'buff', stat: 'block', value: 15, duration: 2, category: 'scroll', pin: 'shield amulet fantasy' },
    ramuan_racun:       { name: 'Ramuan Racun',        emoji: '☠️', price: 1200,  desc: 'Poison enemy -15hp/turn (3 turn)', type: 'buff', stat: 'poison', value: 15, duration: 3, category: 'potion', pin: 'poison potion dark' },
    racun_mematikan:    { name: 'Racun Mematikan',     emoji: '💀', price: 2500,  desc: 'Poison enemy -30hp/turn (2 turn)', type: 'buff', stat: 'poison', value: 30, duration: 2, category: 'potion', pin: 'deadly poison dark' },
    revive_stone:       { name: 'Batu Kebangkitan',    emoji: '💎', price: 2000,  desc: 'Auto-revive 50% HP saat mati', type: 'revive', category: 'special', pin: 'resurrection stone fantasy' },
    batu_exp:           { name: 'Batu EXP',            emoji: '📗', price: 2500,  desc: 'Instant +80 EXP', type: 'exp', value: 80, category: 'special', pin: 'experience stone RPG' },
    batu_exp_besar:     { name: 'Batu EXP Besar',      emoji: '📕', price: 5000,  desc: 'Instant +200 EXP', type: 'exp', value: 200, category: 'special', pin: 'large experience crystal' },
    coin_voucher:       { name: 'Coin Voucher',        emoji: '🎫', price: 12000, desc: 'Instant +3 Gold (15000 Bronze)', type: 'coin', value: 15000, category: 'special', pin: 'gold voucher RPG' },
    scroll_teleport:    { name: 'Scroll Teleport',      emoji: '🌀', price: 1000,  desc: 'Langsung skip ke monster level tinggi', type: 'teleport', category: 'special', pin: 'teleport scroll fantasy' },
    peti_misteri:       { name: 'Peti Misteri',         emoji: '📦', price: 3500,  desc: 'Random item (bisa legendary!)', type: 'mysterybox', category: 'special', pin: 'mystery box RPG treasure' },
    
    // NEW ITEMS
    ramuan_lifesteal:   { name: 'Ramuan Lifesteal',     emoji: '🩸', price: 4000,  desc: 'Lifesteal +20% (2 battle)', type: 'buff', stat: 'lifesteal', value: 20, duration: 2, category: 'potion', pin: 'lifesteal potion fantasy' },
    elixir_kebangkitan: { name: 'Elixir Kebangkitan',   emoji: '✨', price: 8000,  desc: 'Revive 100% HP jika mati (1x)', type: 'revive_full', category: 'special', pin: 'divine revive elixir' },
    batu_exp_mythic:    { name: 'Batu EXP Mythic',      emoji: '💠', price: 15000, desc: 'Instant +1000 EXP', type: 'exp', value: 1000, category: 'special', pin: 'mythic experience crystal' },
    scroll_dewa:        { name: 'Scroll Dewa',          emoji: '📜', price: 10000, desc: 'ATK +50, DEF +50, SPD +10 (1 battle)', type: 'buff_all', value: { atk: 50, def: 50, spd: 10 }, duration: 1, category: 'scroll', pin: 'divine scroll fantasy' }
};

// ============================================================
// RPG ARMORS
// ============================================================
const RPG_ARMORS = {
    kulit_biasa:    { name: 'Armor Kulit',        emoji: '🥋', def: 3,  hp: 10,  tier: 1, price: 0,   pin: 'leather armor anime fantasy' },
    zirah_besi:     { name: 'Zirah Besi',         emoji: '⛓️', def: 8,  hp: 25,  tier: 2, price: 1500,  pin: 'iron armor knight anime' },
    zirah_perak:    { name: 'Zirah Perak',        emoji: '🔘', def: 15, hp: 50,  tier: 3, price: 3500,  pin: 'silver armor knight fantasy' },
    zirah_sihir:    { name: 'Zirah Enchanted',    emoji: '💜', def: 25, hp: 80,  tier: 4, price: 7000,  pin: 'enchanted magic armor anime' },
    zirah_naga:     { name: 'Zirah Naga',         emoji: '🐲', def: 40, hp: 120, tier: 5, price: 16000, pin: 'dragon scale armor anime epic' },
    zirah_iblis:    { name: 'Zirah Iblis',        emoji: '😈', def: 50, hp: 150, tier: 6, price: 25000, pin: 'demon armor dark anime epic' },
    zirah_dewa:     { name: 'Zirah Dewa',         emoji: '👼', def: 65, hp: 200, tier: 7, price: 40000, pin: 'god divine armor anime legendary' },
    zirah_mythic:   { name: 'Armor Mythic',       emoji: '🌟', def: 85, hp: 300, tier: 8, price: 80000, pin: 'mythic armor anime' },
    zirah_kosmik:   { name: 'Zirah Kosmik',       emoji: '🌌', def: 120, hp: 500, tier: 9, price: 150000, pin: 'cosmic armor galaxy anime' }
};

// ============================================================
// RPG SHIELDS
// ============================================================
const RPG_SHIELDS = {
    tameng_kayu:     { name: 'Tameng Kayu',       emoji: '🪵', def: 2,  block: 5,   tier: 1, price: 0,   pin: 'wooden shield fantasy' },
    tameng_besi:     { name: 'Tameng Besi',       emoji: '🔩', def: 5,  block: 10,  tier: 2, price: 1200,  pin: 'iron shield knight anime' },
    tameng_perak:    { name: 'Tameng Perak',      emoji: '⚪', def: 10, block: 15,  tier: 3, price: 2800,  pin: 'silver shield fantasy anime' },
    tameng_sihir:    { name: 'Tameng Enchanted',  emoji: '🟣', def: 18, block: 20,  tier: 4, price: 5500,  pin: 'magic enchanted shield anime' },
    tameng_legenda:  { name: 'Tameng Legenda',    emoji: '🏅', def: 28, block: 25,  tier: 5, price: 13000, pin: 'legendary shield epic anime' },
    tameng_titan:    { name: 'Tameng Titan',      emoji: '🗿', def: 38, block: 30,  tier: 6, price: 20000, pin: 'titan shield dark anime' },
    tameng_dewa:     { name: 'Tameng Dewa',       emoji: '✨', def: 50, block: 35,  tier: 7, price: 35000, pin: 'divine god shield anime legendary' },
    tameng_mythic:   { name: 'Tameng Mythic',     emoji: '🌟', def: 65, block: 40,  tier: 8, price: 70000, pin: 'mythic shield anime' },
    tameng_kosmik:   { name: 'Tameng Kosmik',     emoji: '🌌', def: 90, block: 50,  tier: 9, price: 120000, pin: 'cosmic shield galaxy anime' }
};

// ============================================================
// RPG MONSTERS
// ============================================================
const RPG_MONSTERS = [
    { id: 'slime',       name: 'Slime',       emoji: '🟢', hp: 30,  atk: 5,  def: 2,  spd: 3,  exp: 5,   coinMin: 100, coinMax: 200,  loot: 'ramuan_hp', lootChance: 30, minLvl: 1,  pin: 'slime monster anime' },
    { id: 'goblin',      name: 'Goblin',      emoji: '👺', hp: 50,  atk: 8,  def: 4,  spd: 5,  exp: 10,  coinMin: 200, coinMax: 300,  loot: 'ramuan_hp', lootChance: 40, minLvl: 1,  pin: 'goblin anime monster' },
    { id: 'wolf',        name: 'Shadow Wolf', emoji: '🐺', hp: 80,  atk: 12, def: 6,  spd: 8,  exp: 20,  coinMin: 300, coinMax: 500,  loot: 'ramuan_kecepatan', lootChance: 20, minLvl: 3, pin: 'dark wolf anime' },
    { id: 'skeleton',    name: 'Skeleton',    emoji: '💀', hp: 100, atk: 16, def: 8,  spd: 6,  exp: 30,  coinMin: 400, coinMax: 600,  loot: 'scroll_api', lootChance: 20, minLvl: 5,  pin: 'skeleton warrior anime' },
    { id: 'dark_knight', name: 'Dark Knight', emoji: '🖤', hp: 150, atk: 22, def: 12, spd: 7,  exp: 50,  coinMin: 600, coinMax: 1000, loot: 'scroll_kritis', lootChance: 15, minLvl: 7, pin: 'dark knight anime' },
    { id: 'dragon',      name: 'Dragon',      emoji: '🐉', hp: 250, atk: 30, def: 18, spd: 10, exp: 80,  coinMin: 1000, coinMax: 1500, loot: 'ramuan_max', lootChance: 15, minLvl: 10, pin: 'fire dragon anime' },
    { id: 'demon_lord',  name: 'Demon Lord',  emoji: '😈', hp: 400, atk: 40, def: 25, spd: 12, exp: 150, coinMin: 2000, coinMax: 3000, loot: 'revive_stone', lootChance: 20, minLvl: 15, pin: 'demon lord anime' }
];

// ============================================================
// ACHIEVEMENTS
// ============================================================
const RPG_ACHIEVEMENTS = {
    first_blood:    { name: 'First Blood',     emoji: '🩸', desc: 'Bunuh 1 monster', check: (r) => r.monstersKilled >= 1 },
    hunter:         { name: 'Hunter',          emoji: '🏹', desc: 'Bunuh 10 monster', check: (r) => r.monstersKilled >= 10 },
    serial_killer:  { name: 'Serial Killer',   emoji: '💀', desc: 'Bunuh 50 monster', check: (r) => r.monstersKilled >= 50 },
    dragon_slayer:  { name: 'Dragon Slayer',   emoji: '🐉', desc: 'Bunuh 100 monster', check: (r) => r.monstersKilled >= 100 },
    legend_killer:  { name: 'Legend Killer',    emoji: '⚡', desc: 'Bunuh 500 monster', check: (r) => r.monstersKilled >= 500 },
    gladiator:      { name: 'Gladiator',       emoji: '🏟️', desc: 'Menang 10 duel', check: (r) => r.wins >= 10 },
    champion:       { name: 'Champion',        emoji: '👑', desc: 'Menang 50 duel', check: (r) => r.wins >= 50 },
    unbreakable:    { name: 'Unbreakable',     emoji: '🛡️', desc: 'Survive 20 kekalahan', check: (r) => r.losses >= 20 },
    collector:      { name: 'Collector',       emoji: '📦', desc: '30+ item di inventory', check: (r) => (r.inventory || []).length >= 30 },
    veteran:        { name: 'Veteran',         emoji: '⭐', desc: 'Capai level 15', check: (r) => r.level >= 15 },
    transcendent:   { name: 'Transcendent',    emoji: '🏆', desc: 'Capai level 25', check: (r) => r.level >= 25 },
    dungeon_crawler:{ name: 'Dungeon Crawler', emoji: '🗺️', desc: 'Clear floor 10', check: (r) => (r.dungeonFloor || 0) >= 10 },
    deep_diver:     { name: 'Deep Diver',      emoji: '🌊', desc: 'Clear floor 50', check: (r) => (r.dungeonFloor || 0) >= 50 },
    guild_founder:  { name: 'Guild Founder',   emoji: '🏠', desc: 'Buat guild', check: (r) => r.guildRole === 'leader' },
    pet_master:     { name: 'Pet Master',      emoji: '🐾', desc: 'Pet level 10+', check: (r) => (r.pet?.level || 0) >= 10 },
    craftsman:      { name: 'Craftsman',       emoji: '🔨', desc: 'Craft 10 item', check: (r) => (r.craftCount || 0) >= 10 },
    arena_king:     { name: 'Arena King',      emoji: '⚔️', desc: 'Capai Diamond rank', check: (r) => (r.arena?.elo || 0) >= 500 }
};

// ============================================================
// QUESTS
// ============================================================
const RPG_QUESTS = [
    { id: 'kill_3',    type: 'kill',    target: 3,  desc: 'Bunuh 3 monster',   reward: { exp: 30,  coins: 50 } },
    { id: 'kill_7',    type: 'kill',    target: 7,  desc: 'Bunuh 7 monster',   reward: { exp: 70,  coins: 100, item: 'ramuan_hp' } },
    { id: 'kill_15',   type: 'kill',    target: 15, desc: 'Bunuh 15 monster',  reward: { exp: 150, coins: 200, item: 'ramuan_hp_besar' } },
    { id: 'duel_2',    type: 'duel_win',target: 2,  desc: 'Menang 2 duel',     reward: { exp: 50,  coins: 80 } },
    { id: 'duel_5',    type: 'duel_win',target: 5,  desc: 'Menang 5 duel',     reward: { exp: 120, coins: 180, item: 'scroll_kritis' } },
    { id: 'use_3',     type: 'use_item',target: 3,  desc: 'Pakai 3 item',      reward: { exp: 25,  coins: 40 } },
    { id: 'dungeon_3', type: 'dungeon', target: 3,  desc: 'Clear 3 floor',     reward: { exp: 80,  coins: 120 } },
    { id: 'dungeon_7', type: 'dungeon', target: 7,  desc: 'Clear 7 floor',     reward: { exp: 180, coins: 250, item: 'revive_stone' } },
    { id: 'craft_2',   type: 'craft',   target: 2,  desc: 'Craft 2 item',      reward: { exp: 40,  coins: 60 } },
    { id: 'earn_20',   type: 'earn_coin', target: 2000, desc: 'Dapatkan 2 Silver (2000 Bronze)', reward: { exp: 35, coins: 500 } }
];
const QUEST_COOLDOWN = 24 * 60 * 60 * 1000;

// ============================================================
// CLASS EVOLUTIONS
// ============================================================
const RPG_EVOLUTIONS = {
    warrior: [
        { id: 'paladin',   name: 'Paladin',    emoji: '🛡️', reqLevel: 20, bonus: { def: 15, maxHp: 50 },  passive: '+25% DEF, Regen 5/turn', skill: 'Holy Shield', skillDesc: 'Block semua dmg 1 turn + heal 30', skillEffect: { stat: 'def', value: 30, duration: 2 } },
        { id: 'berserker', name: 'Berserker',  emoji: '🪓', reqLevel: 20, bonus: { atk: 20, spd: 5 },     passive: '+30% ATK, -10% DEF',     skill: 'Blood Rage',  skillDesc: 'ATK x2 selama 2 turn',            skillEffect: { stat: 'atk', value: 40, duration: 2 } }
    ],
    archer: [
        { id: 'sniper',    name: 'Sniper',     emoji: '🎯', reqLevel: 20, bonus: { atk: 15, crit: 15 },   passive: '+35% CRIT',               skill: 'Headshot',    skillDesc: 'Guaranteed CRIT + 2x dmg',        skillEffect: { stat: 'crit', value: 50, duration: 1 } },
        { id: 'ranger',    name: 'Ranger',     emoji: '🌿', reqLevel: 20, bonus: { spd: 10, def: 8 },     passive: '+25% Dodge',              skill: 'Evasion',     skillDesc: '100% dodge selama 1 turn',         skillEffect: { stat: 'dodge', value: 100, duration: 1 } }
    ],
    mage: [
        { id: 'archmage',    name: 'Archmage',    emoji: '🌟', reqLevel: 20, bonus: { atk: 25 },           passive: '+35% Magic ATK',          skill: 'Meteor',      skillDesc: 'Massive magic AoE damage',         skillEffect: { stat: 'atk', value: 50, duration: 1 } },
        { id: 'necromancer', name: 'Necromancer', emoji: '💀', reqLevel: 20, bonus: { maxHp: 30, atk: 10 }, passive: 'Lifesteal 15%',           skill: 'Soul Drain',  skillDesc: 'Damage + heal 50% dmg dealt',      skillEffect: { stat: 'regen', value: 15, duration: 3 } }
    ],
    assassin: [
        { id: 'shadow_lord', name: 'Shadow Lord', emoji: '🌑', reqLevel: 20, bonus: { spd: 15, crit: 10 }, passive: '+30% SPD, +25% CRIT',    skill: 'Death Mark',  skillDesc: 'Target takes 2x dmg next hit',     skillEffect: { stat: 'atk', value: 35, duration: 2 } },
        { id: 'ninja',       name: 'Ninja',       emoji: '🥷', reqLevel: 20, bonus: { atk: 10, spd: 10 },  passive: '+30% Dodge',              skill: 'Shadow Clone', skillDesc: 'Attack 2x in one turn',            skillEffect: { stat: 'spd', value: 20, duration: 2 } }
    ],
    necromancer: [
        { id: 'lich_king',   name: 'Lich King',   emoji: '💀', reqLevel: 20, bonus: { atk: 15, maxHp: 40 }, passive: 'Lifesteal 25%, Undead Army', skill: 'Army of Dead', skillDesc: 'Summon undead, 3x hit damage',   skillEffect: { stat: 'atk', value: 30, duration: 3 } },
        { id: 'blood_mage',  name: 'Blood Mage',  emoji: '🩸', reqLevel: 20, bonus: { atk: 20, spd: 5 },    passive: 'Sacrifice HP for 2x ATK',    skill: 'Blood Nova',  skillDesc: '-20% HP, damage = 3x ATK to all', skillEffect: { stat: 'atk', value: 45, duration: 1 } }
    ],
    paladin: [
        { id: 'crusader',    name: 'Crusader',    emoji: '⚔️', reqLevel: 20, bonus: { def: 20, maxHp: 60 }, passive: 'Holy Aura: regen 8/turn',    skill: 'Divine Judgment', skillDesc: 'Holy damage + heal full',      skillEffect: { stat: 'def', value: 35, duration: 2 } },
        { id: 'templar',     name: 'Templar',     emoji: '🛡️', reqLevel: 20, bonus: { def: 15, atk: 10 },  passive: 'Reflect 20% dmg',            skill: 'Sacred Barrier', skillDesc: 'Reflect semua damage 2 turn', skillEffect: { stat: 'block', value: 50, duration: 2 } }
    ],
    samurai: [
        { id: 'shogun',      name: 'Shogun',      emoji: '🏯', reqLevel: 20, bonus: { atk: 18, crit: 12 },  passive: 'Bushido: +35% CRIT, +ATK',   skill: 'Issen',       skillDesc: 'One-shot jika CRIT (3x dmg)',      skillEffect: { stat: 'crit', value: 40, duration: 1 } },
        { id: 'ronin',       name: 'Ronin',       emoji: '🌙', reqLevel: 20, bonus: { spd: 12, atk: 12 },   passive: 'Counter 35%, Lone Wolf',     skill: 'Zantetsuken', skillDesc: 'Serangan menembus semua DEF',       skillEffect: { stat: 'atk', value: 35, duration: 2 } }
    ],
    berserker: [
        { id: 'warlord',     name: 'Warlord',     emoji: '👹', reqLevel: 20, bonus: { atk: 25, maxHp: 30 }, passive: 'Rage: +50% ATK dibawah 30% HP', skill: 'Apocalypse', skillDesc: 'Damage gila + self heal 25%',   skillEffect: { stat: 'atk', value: 50, duration: 2 } },
        { id: 'gladiator',   name: 'Gladiator',   emoji: '🏆', reqLevel: 20, bonus: { atk: 15, def: 10 },   passive: 'Arena Master +25% duel dmg', skill: 'Execute',     skillDesc: 'Insta-kill jika lawan <20% HP',    skillEffect: { stat: 'atk', value: 40, duration: 1 } }
    ],
    shaman: [
        { id: 'druid',       name: 'Druid',       emoji: '🌿', reqLevel: 20, bonus: { def: 12, maxHp: 40 }, passive: 'Nature Heal 10/turn',        skill: 'Thorns',      skillDesc: 'Reflect 30% dmg + poison 3 turn',  skillEffect: { stat: 'regen', value: 15, duration: 3 } },
        { id: 'witch_doctor',name: 'Witch Doctor', emoji: '🪄', reqLevel: 20, bonus: { atk: 15, spd: 8 },   passive: 'Curse: -20% enemy stats',    skill: 'Voodoo',      skillDesc: 'Debuff ALL stats lawan 40% 2 turn', skillEffect: { stat: 'atk', value: 30, duration: 2 } }
    ]
};

// ============================================================
// DUNGEON MOBS & BOSSES
// ============================================================
const DUNGEON_COOLDOWN = 3 * 60 * 1000;
const DUNGEON_MOBS = [
    { name: 'Dungeon Rat',     emoji: '🐀', hp: 20,  atk: 4,  def: 2,  spd: 3,  exp: 5,   coinMin: 50,  coinMax: 150 },
    { name: 'Cave Spider',     emoji: '🕷️', hp: 35,  atk: 7,  def: 3,  spd: 5,  exp: 10,  coinMin: 100, coinMax: 250 },
    { name: 'Undead Soldier',  emoji: '💀', hp: 60,  atk: 12, def: 6,  spd: 4,  exp: 20,  coinMin: 200, coinMax: 400 },
    { name: 'Dark Mage',       emoji: '🧙', hp: 80,  atk: 18, def: 5,  spd: 7,  exp: 35,  coinMin: 350, coinMax: 600 },
    { name: 'Dungeon Golem',   emoji: '🗿', hp: 150, atk: 22, def: 15, spd: 3,  exp: 60,  coinMin: 500, coinMax: 900 }
];
const DUNGEON_BOSSES = [
    { name: 'Floor Guardian',  emoji: '👹', hp: 200, atk: 25, def: 12, spd: 6,  exp: 80,  coinMin: 800,  coinMax: 1500, loot: 'enchant_stone', lootChance: 50 },
    { name: 'Abyss Warden',    emoji: '😈', hp: 400, atk: 35, def: 20, spd: 8,  exp: 150, coinMin: 1500, coinMax: 3000, loot: 'revive_stone',  lootChance: 40 },
    { name: 'Dungeon Overlord',emoji: '👿', hp: 800, atk: 50, def: 30, spd: 10, exp: 300, coinMin: 3000, coinMax: 6000, loot: 'awakening_stone', lootChance: 30 }
];

// ============================================================
// PETS
// ============================================================
const RPG_PETS = {
    serigala:   { name: 'Serigala',       emoji: '🐺', atk: 5,  def: 2,  heal: 0,  evolveTo: 'dire_wolf' },
    kucing:     { name: 'Kucing Sihir',   emoji: '🐱', atk: 1,  def: 1,  heal: 5,  evolveTo: 'sphinx' },
    naga_kecil: { name: 'Naga Kecil',     emoji: '🐲', atk: 6,  def: 3,  heal: 0,  evolveTo: 'elder_dragon' },
    kura_kura:  { name: 'Kura-kura',      emoji: '🐢', atk: 0,  def: 6,  heal: 2,  evolveTo: 'guardian' },
    telur_phoenix:{ name: 'Telur Phoenix',emoji: '🥚', atk: 2,  def: 2,  heal: 3,  evolveTo: 'phoenix' },
    slime_pet:  { name: 'Slime Pet',      emoji: '🟢', atk: 3,  def: 3,  heal: 3,  evolveTo: 'king_slime' },
    elang:      { name: 'Elang',          emoji: '🦅', atk: 4,  def: 1,  heal: 0,  evolveTo: 'thunderbird' },
    beruang:    { name: 'Beruang',        emoji: '🐻', atk: 3,  def: 5,  heal: 1,  evolveTo: 'war_bear' }
};
const RPG_PETS_EVOLVED = {
    dire_wolf:    { name: 'Dire Wolf',     emoji: '🐺', atk: 12, def: 5,  heal: 0 },
    sphinx:       { name: 'Sphinx',        emoji: '🐱', atk: 3,  def: 3,  heal: 12 },
    elder_dragon: { name: 'Elder Dragon',  emoji: '🐉', atk: 15, def: 8,  heal: 0 },
    guardian:     { name: 'Guardian',      emoji: '🐢', atk: 0,  def: 15, heal: 5 },
    phoenix:      { name: 'Phoenix',       emoji: '🔥', atk: 5,  def: 5,  heal: 10 },
    king_slime:   { name: 'King Slime',    emoji: '👑', atk: 8,  def: 8,  heal: 8 },
    thunderbird:  { name: 'Thunderbird',   emoji: '⚡', atk: 10, def: 3,  heal: 0 },
    war_bear:     { name: 'War Bear',      emoji: '🐻', atk: 8,  def: 12, heal: 3 }
};

// ============================================================
// CRAFTING
// ============================================================
const RPG_RECIPES = {
    ramuan_hp_besar:  { name: 'Ramuan HP Besar',   emoji: '💖', ingredients: { ramuan_hp: 3 }, result: 'ramuan_hp_besar' },
    ramuan_hp_max:    { name: 'Ramuan HP Max',      emoji: '💝', ingredients: { ramuan_hp_besar: 2 }, result: 'ramuan_hp_max' },
    elixir_full:      { name: 'Elixir Full Restore',emoji: '🌟', ingredients: { ramuan_hp_max: 1, ramuan_hp_besar: 2 }, result: 'elixir_full' },
    scroll_power:     { name: 'Scroll Power+',      emoji: '📜', ingredients: { scroll_atk: 2, scroll_crit: 1 }, result: 'scroll_power_plus' },
    enchant_stone:    { name: 'Batu Enchant',       emoji: '💎', ingredients: { batu_exp_kecil: 3 }, result: 'enchant_stone' },
    pet_food:         { name: 'Makanan Pet',        emoji: '🍖', ingredients: { ramuan_hp: 2 }, result: 'pet_food' },
    super_potion:     { name: 'Super Potion',       emoji: '⚗️', ingredients: { ramuan_hp_sedang: 3, ramuan_kecepatan: 1 }, result: 'super_potion' },
    revival_crystal:  { name: 'Kristal Revive',     emoji: '💎', ingredients: { revive_stone: 1, enchant_stone: 2 }, result: 'revival_crystal' }
};
const RPG_CRAFT_ITEMS = {
    enchant_stone:    { name: 'Batu Enchant',       emoji: '💎', desc: 'Untuk enchant senjata', type: 'material', price: 2500, category: 'special' },
    pet_food:         { name: 'Makanan Pet',        emoji: '🍖', desc: 'Feed pet +50 EXP', type: 'pet_feed', value: 50, price: 800, category: 'special' },
    scroll_power_plus:{ name: 'Scroll Power+',      emoji: '📜', desc: 'ATK+30 & CRIT+20 (3 battle)', type: 'buff', stat: 'atk', value: 30, duration: 3, price: 4000, category: 'scroll' },
    super_potion:     { name: 'Super Potion',       emoji: '⚗️', desc: 'Heal +120 HP + SPD+10', type: 'heal', value: 120, price: 2000, category: 'potion' },
    revival_crystal:  { name: 'Kristal Revive',     emoji: '💎', desc: 'Auto-revive 80% HP', type: 'revive', price: 6000, category: 'special' },
    elixir_full:      { name: 'Elixir Full Restore',emoji: '🌟', desc: 'Full HP + clear debuffs', type: 'fullheal', price: 5000, category: 'potion' }
};
const ENCHANT_RATES = { 1: 90, 2: 75, 3: 60, 4: 45, 5: 30, 6: 20, 7: 10 };
const ENCHANT_ATK_BONUS = 4;

// ============================================================
// ARENA
// ============================================================
const ARENA_RANKS = [
    { id: 'bronze',  name: 'Bronze',  emoji: '🥉', minElo: 0,   reward: 5 },
    { id: 'silver',  name: 'Silver',  emoji: '🥈', minElo: 100, reward: 10 },
    { id: 'gold',    name: 'Gold',    emoji: '🥇', minElo: 250, reward: 20 },
    { id: 'diamond', name: 'Diamond', emoji: '💎', minElo: 500, reward: 35 },
    { id: 'mythic',  name: 'Mythic',  emoji: '🏆', minElo: 800, reward: 50 }
];

// ============================================================
// WORLD BOSS
// ============================================================
const WORLD_BOSS_POOL = [
    { name: 'Bahamut, Dragon Primordial', emoji: '🐉', baseHp: 5000, atk: 60, reward: { exp: 200, coinMin: 2000, coinMax: 5000 } },
    { name: 'Ifrit, Lord of Flames',      emoji: '🔥', baseHp: 6000, atk: 70, reward: { exp: 250, coinMin: 2500, coinMax: 6000 } },
    { name: 'Leviathan, Sea Emperor',     emoji: '🌊', baseHp: 7000, atk: 55, reward: { exp: 220, coinMin: 2200, coinMax: 5500 } },
    { name: 'Ragnarok, The End Bringer',  emoji: '💀', baseHp: 10000, atk: 80, reward: { exp: 400, coinMin: 4000, coinMax: 8000 } }
];
const WORLD_BOSS_DURATION = 30 * 60 * 1000;

// ============================================================
// COOLDOWNS
// ============================================================
const COOLDOWNS = {
    hunt: 30 * 1000,
    dungeon: 3 * 60 * 1000,
    arena: 2 * 60 * 1000,
    darkworld: 5 * 60 * 1000,
    craft: 10 * 1000,
    enchant: 30 * 1000,
    respawn: 10 * 60 * 1000
};

// ============================================================
// DEATH & VOID REALM
// ============================================================
const VOID_EVENTS = [
    { name: 'Mysterious Sage', emoji: '🧙', type: 'buff', desc: 'Seorang sage misterius memberimu kekuatan...', effect: { stat: 'atk', value: 10, duration: 5 }, msg: '✨ ATK+10 selama 5 battle!' },
    { name: 'Dark Curse', emoji: '💀', type: 'curse', desc: 'Bayangan gelap mencengkeram jiwamu...', effect: { stat: 'def', value: -5, duration: 3 }, msg: '☠️ DEF-5 selama 3 battle!' },
    { name: 'Soul Fragment', emoji: '💎', type: 'coin', desc: 'Kamu menemukan pecahan jiwa bercahaya...', value: 5, msg: '💎 +5 Bronze!' },
    { name: 'Void Whisper', emoji: '👁️', type: 'exp', desc: 'Bisikan void mengajarmu sesuatu...', value: 30, msg: '📗 +30 EXP!' },
    { name: 'Nothing', emoji: '🌑', type: 'none', desc: 'Keheningan absolut...', msg: '🌑 Tidak terjadi apa-apa.' },
    { name: 'Death Merchant', emoji: '💀', type: 'item', desc: 'Pedagang misterius menawarkan ramuan...', item: 'ramuan_hp_besar', msg: '🧪 Dapat Ramuan HP Besar!' }
];
const CURSES = [
    { name: 'Curse of Weakness', emoji: '💀', stat: 'atk', value: -5, duration: 3 },
    { name: 'Curse of Fragility', emoji: '🩸', stat: 'def', value: -5, duration: 3 },
    { name: 'Curse of Slowness', emoji: '🐌', stat: 'spd', value: -3, duration: 3 },
    { name: 'Curse of Blindness', emoji: '👁️', stat: 'crit', value: -10, duration: 3 }
];

// ============================================================
// DARK WORLD
// ============================================================
const DARK_WORLD_DURATION = 30 * 60 * 1000;
const DARK_MONSTERS = [
    { name: 'Shadow Fiend',    emoji: '👻', hp: 200, atk: 28, def: 15, spd: 10, exp: 60,  coinMin: 800,  coinMax: 1500, loot: 'ramuan_hp_besar', lootChance: 30 },
    { name: 'Void Walker',     emoji: '🌑', hp: 300, atk: 35, def: 20, spd: 12, exp: 90,  coinMin: 1200, coinMax: 2000, loot: 'scroll_crit',     lootChance: 25 },
    { name: 'Abyss Knight',    emoji: '⚔️', hp: 450, atk: 42, def: 28, spd: 8,  exp: 130, coinMin: 1500, coinMax: 2500, loot: 'enchant_stone',   lootChance: 20 },
    { name: 'Demon King',      emoji: '👹', hp: 800, atk: 55, def: 35, spd: 14, exp: 250, coinMin: 2500, coinMax: 4500, loot: 'revive_stone',    lootChance: 40 },
    { name: 'Shadow Overlord', emoji: '😈', hp: 1200,atk: 65, def: 40, spd: 16, exp: 350, coinMin: 3500, coinMax: 6000, loot: 'awakening_stone', lootChance: 15 },
    { name: 'Void Dragon',     emoji: '🐉', hp: 1500,atk: 75, def: 45, spd: 18, exp: 500, coinMin: 5000, coinMax: 8000, loot: 'awakening_stone', lootChance: 25 }
];

// ============================================================
// SKILL TREES
// ============================================================
const RPG_SKILL_TREES = {
    warrior: {
        attack: [
            { id: 'w_atk1', name: 'Brutal Strike', desc: 'ATK+3 permanent', cost: 1, effect: { atk: 3 } },
            { id: 'w_atk2', name: 'Rage', desc: 'ATK+5 permanent', cost: 2, effect: { atk: 5 }, req: 'w_atk1' },
            { id: 'w_atk3', name: 'Bloodlust', desc: 'Lifesteal 5%', cost: 3, effect: { lifesteal: 5 }, req: 'w_atk2' }
        ],
        defense: [
            { id: 'w_def1', name: 'Iron Skin', desc: 'DEF+3 permanent', cost: 1, effect: { def: 3 } },
            { id: 'w_def2', name: 'Fortify', desc: 'MaxHP+20', cost: 2, effect: { maxHp: 20 }, req: 'w_def1' },
            { id: 'w_def3', name: 'Unbreakable', desc: 'Block+5%', cost: 3, effect: { block: 5 }, req: 'w_def2' }
        ],
        utility: [
            { id: 'w_util1', name: 'Battle Cry', desc: 'SPD+2', cost: 1, effect: { spd: 2 } },
            { id: 'w_util2', name: 'Intimidate', desc: 'CRIT+5%', cost: 2, effect: { crit: 5 }, req: 'w_util1' },
            { id: 'w_util3', name: 'War Veteran', desc: 'Regen 3/turn', cost: 3, effect: { regen: 3 }, req: 'w_util2' }
        ]
    },
    archer: {
        attack: [
            { id: 'a_atk1', name: 'Sharp Eye', desc: 'CRIT+5%', cost: 1, effect: { crit: 5 } },
            { id: 'a_atk2', name: 'Piercing Shot', desc: 'ATK+5', cost: 2, effect: { atk: 5 }, req: 'a_atk1' },
            { id: 'a_atk3', name: 'Lethal Shot', desc: 'CRIT+10% + ATK+3', cost: 3, effect: { crit: 10, atk: 3 }, req: 'a_atk2' }
        ],
        defense: [
            { id: 'a_def1', name: 'Nimble', desc: 'Dodge+5%', cost: 1, effect: { dodge: 5 } },
            { id: 'a_def2', name: 'Camouflage', desc: 'Dodge+8%', cost: 2, effect: { dodge: 8 }, req: 'a_def1' },
            { id: 'a_def3', name: 'Wind Walker', desc: 'SPD+5 + Dodge+5%', cost: 3, effect: { spd: 5, dodge: 5 }, req: 'a_def2' }
        ],
        utility: [
            { id: 'a_util1', name: 'Poison Arrow', desc: 'Poison 3/turn', cost: 1, effect: { poison: 3 } },
            { id: 'a_util2', name: 'Trap Master', desc: 'DEF+4', cost: 2, effect: { def: 4 }, req: 'a_util1' },
            { id: 'a_util3', name: 'Eagle Vision', desc: 'CRIT+8% + SPD+3', cost: 3, effect: { crit: 8, spd: 3 }, req: 'a_util2' }
        ]
    },
    mage: {
        attack: [
            { id: 'm_atk1', name: 'Arcane Bolt', desc: 'ATK+4', cost: 1, effect: { atk: 4 } },
            { id: 'm_atk2', name: 'Elemental Fury', desc: 'ATK+6', cost: 2, effect: { atk: 6 }, req: 'm_atk1' },
            { id: 'm_atk3', name: 'Meteor Storm', desc: 'ATK+8 + Poison 5', cost: 3, effect: { atk: 8, poison: 5 }, req: 'm_atk2' }
        ],
        defense: [
            { id: 'm_def1', name: 'Mana Shield', desc: 'DEF+3', cost: 1, effect: { def: 3 } },
            { id: 'm_def2', name: 'Barrier', desc: 'MaxHP+25 + DEF+3', cost: 2, effect: { maxHp: 25, def: 3 }, req: 'm_def1' },
            { id: 'm_def3', name: 'Time Stop', desc: 'Dodge+12%', cost: 3, effect: { dodge: 12 }, req: 'm_def2' }
        ],
        utility: [
            { id: 'm_util1', name: 'Meditation', desc: 'Regen 4/turn', cost: 1, effect: { regen: 4 } },
            { id: 'm_util2', name: 'Enchant Aura', desc: 'ATK+3 + DEF+3', cost: 2, effect: { atk: 3, def: 3 }, req: 'm_util1' },
            { id: 'm_util3', name: 'Arcane Mastery', desc: 'CRIT+8% + Lifesteal 5%', cost: 3, effect: { crit: 8, lifesteal: 5 }, req: 'm_util2' }
        ]
    },
    assassin: {
        attack: [
            { id: 's_atk1', name: 'Venom Blade', desc: 'Poison 4/turn', cost: 1, effect: { poison: 4 } },
            { id: 's_atk2', name: 'Backstab', desc: 'ATK+5 + CRIT+5%', cost: 2, effect: { atk: 5, crit: 5 }, req: 's_atk1' },
            { id: 's_atk3', name: 'Assassinate', desc: 'ATK+8 + CRIT+8%', cost: 3, effect: { atk: 8, crit: 8 }, req: 's_atk2' }
        ],
        defense: [
            { id: 's_def1', name: 'Shadow Step', desc: 'Dodge+8%', cost: 1, effect: { dodge: 8 } },
            { id: 's_def2', name: 'Smoke Bomb', desc: 'Dodge+10% + SPD+3', cost: 2, effect: { dodge: 10, spd: 3 }, req: 's_def1' },
            { id: 's_def3', name: 'Phantom', desc: 'Dodge+12% + DEF+5', cost: 3, effect: { dodge: 12, def: 5 }, req: 's_def2' }
        ],
        utility: [
            { id: 's_util1', name: 'Swift', desc: 'SPD+4', cost: 1, effect: { spd: 4 } },
            { id: 's_util2', name: 'Steal', desc: 'Drop Coin +20%', cost: 2, effect: { coinBonus: 20 }, req: 's_util1' },
            { id: 's_util3', name: 'Death Mark', desc: 'Lifesteal 8% + SPD+3', cost: 3, effect: { lifesteal: 8, spd: 3 }, req: 's_util2' }
        ]
    },
    necromancer: {
        attack: [
            { id: 'n_atk1', name: 'Dark Bolt', desc: 'ATK+4', cost: 1, effect: { atk: 4 } },
            { id: 'n_atk2', name: 'Curse of Agony', desc: 'Poison 6/turn', cost: 2, effect: { poison: 6 }, req: 'n_atk1' },
            { id: 'n_atk3', name: 'Death Coil', desc: 'ATK+8 + Lifesteal 8%', cost: 3, effect: { atk: 8, lifesteal: 8 }, req: 'n_atk2' }
        ],
        defense: [
            { id: 'n_def1', name: 'Bone Armor', desc: 'DEF+4', cost: 1, effect: { def: 4 } },
            { id: 'n_def2', name: 'Undead Fortitude', desc: 'MaxHP+30', cost: 2, effect: { maxHp: 30 }, req: 'n_def1' },
            { id: 'n_def3', name: 'Soul Shield', desc: 'DEF+6 + Regen 5', cost: 3, effect: { def: 6, regen: 5 }, req: 'n_def2' }
        ],
        utility: [
            { id: 'n_util1', name: 'Drain Life', desc: 'Lifesteal 5%', cost: 1, effect: { lifesteal: 5 } },
            { id: 'n_util2', name: 'Dark Pact', desc: 'ATK+5 + Lifesteal 5%', cost: 2, effect: { atk: 5, lifesteal: 5 }, req: 'n_util1' },
            { id: 'n_util3', name: 'Army of Dead', desc: 'ATK+6 + Regen 5 + Poison 4', cost: 3, effect: { atk: 6, regen: 5, poison: 4 }, req: 'n_util2' }
        ]
    },
    paladin: {
        attack: [
            { id: 'p_atk1', name: 'Holy Smite', desc: 'ATK+3', cost: 1, effect: { atk: 3 } },
            { id: 'p_atk2', name: 'Divine Strike', desc: 'ATK+5 + CRIT+5%', cost: 2, effect: { atk: 5, crit: 5 }, req: 'p_atk1' },
            { id: 'p_atk3', name: 'Judgment', desc: 'ATK+8 + ignore 10% DEF', cost: 3, effect: { atk: 8 }, req: 'p_atk2' }
        ],
        defense: [
            { id: 'p_def1', name: 'Holy Armor', desc: 'DEF+5', cost: 1, effect: { def: 5 } },
            { id: 'p_def2', name: 'Sacred Shield', desc: 'Block+8%', cost: 2, effect: { block: 8 }, req: 'p_def1' },
            { id: 'p_def3', name: 'Divine Protection', desc: 'MaxHP+40 + DEF+5', cost: 3, effect: { maxHp: 40, def: 5 }, req: 'p_def2' }
        ],
        utility: [
            { id: 'p_util1', name: 'Lay on Hands', desc: 'Regen 5/turn', cost: 1, effect: { regen: 5 } },
            { id: 'p_util2', name: 'Aura of Light', desc: 'Regen 5 + DEF+3', cost: 2, effect: { regen: 5, def: 3 }, req: 'p_util1' },
            { id: 'p_util3', name: 'Blessing', desc: 'All stats +3', cost: 3, effect: { atk: 3, def: 3, spd: 3 }, req: 'p_util2' }
        ]
    },
    samurai: {
        attack: [
            { id: 'sm_atk1', name: 'Kendo', desc: 'ATK+4', cost: 1, effect: { atk: 4 } },
            { id: 'sm_atk2', name: 'Double Slash', desc: 'ATK+5 + CRIT+8%', cost: 2, effect: { atk: 5, crit: 8 }, req: 'sm_atk1' },
            { id: 'sm_atk3', name: 'Hissatsu', desc: 'ATK+10 + CRIT+10%', cost: 3, effect: { atk: 10, crit: 10 }, req: 'sm_atk2' }
        ],
        defense: [
            { id: 'sm_def1', name: 'Parry', desc: 'Block+6%', cost: 1, effect: { block: 6 } },
            { id: 'sm_def2', name: 'Riposte', desc: 'Block+6% + ATK+3', cost: 2, effect: { block: 6, atk: 3 }, req: 'sm_def1' },
            { id: 'sm_def3', name: 'Zen Guard', desc: 'Dodge+10% + DEF+5', cost: 3, effect: { dodge: 10, def: 5 }, req: 'sm_def2' }
        ],
        utility: [
            { id: 'sm_util1', name: 'Bushido', desc: 'SPD+3', cost: 1, effect: { spd: 3 } },
            { id: 'sm_util2', name: 'Focus', desc: 'CRIT+8% + SPD+3', cost: 2, effect: { crit: 8, spd: 3 }, req: 'sm_util1' },
            { id: 'sm_util3', name: 'Way of the Sword', desc: 'ATK+5 + CRIT+5% + SPD+3', cost: 3, effect: { atk: 5, crit: 5, spd: 3 }, req: 'sm_util2' }
        ]
    },
    berserker: {
        attack: [
            { id: 'b_atk1', name: 'Cleave', desc: 'ATK+5', cost: 1, effect: { atk: 5 } },
            { id: 'b_atk2', name: 'Frenzy', desc: 'ATK+7 + SPD+3', cost: 2, effect: { atk: 7, spd: 3 }, req: 'b_atk1' },
            { id: 'b_atk3', name: 'Rampage', desc: 'ATK+10 + Lifesteal 8%', cost: 3, effect: { atk: 10, lifesteal: 8 }, req: 'b_atk2' }
        ],
        defense: [
            { id: 'b_def1', name: 'Tough Skin', desc: 'MaxHP+20', cost: 1, effect: { maxHp: 20 } },
            { id: 'b_def2', name: 'War Cry', desc: 'DEF+5 + MaxHP+20', cost: 2, effect: { def: 5, maxHp: 20 }, req: 'b_def1' },
            { id: 'b_def3', name: 'Undying Rage', desc: 'Regen 8 + MaxHP+20', cost: 3, effect: { regen: 8, maxHp: 20 }, req: 'b_def2' }
        ],
        utility: [
            { id: 'b_util1', name: 'Bloodthirst', desc: 'Lifesteal 5%', cost: 1, effect: { lifesteal: 5 } },
            { id: 'b_util2', name: 'Intimidate', desc: 'ATK+4 + CRIT+5%', cost: 2, effect: { atk: 4, crit: 5 }, req: 'b_util1' },
            { id: 'b_util3', name: 'Unstoppable', desc: 'ATK+6 + SPD+4 + CRIT+5%', cost: 3, effect: { atk: 6, spd: 4, crit: 5 }, req: 'b_util2' }
        ]
    },
    shaman: {
        attack: [
            { id: 'sh_atk1', name: 'Nature Bolt', desc: 'ATK+3 + Poison 3', cost: 1, effect: { atk: 3, poison: 3 } },
            { id: 'sh_atk2', name: 'Spirit Strike', desc: 'ATK+5 + Poison 4', cost: 2, effect: { atk: 5, poison: 4 }, req: 'sh_atk1' },
            { id: 'sh_atk3', name: 'Plague', desc: 'ATK+6 + Poison 6 + Lifesteal 5%', cost: 3, effect: { atk: 6, poison: 6, lifesteal: 5 }, req: 'sh_atk2' }
        ],
        defense: [
            { id: 'sh_def1', name: 'Bark Skin', desc: 'DEF+4', cost: 1, effect: { def: 4 } },
            { id: 'sh_def2', name: 'Earth Shield', desc: 'DEF+5 + MaxHP+20', cost: 2, effect: { def: 5, maxHp: 20 }, req: 'sh_def1' },
            { id: 'sh_def3', name: 'Nature Ward', desc: 'Regen 8 + Block+5%', cost: 3, effect: { regen: 8, block: 5 }, req: 'sh_def2' }
        ],
        utility: [
            { id: 'sh_util1', name: 'Spirit Bond', desc: 'Regen 4', cost: 1, effect: { regen: 4 } },
            { id: 'sh_util2', name: 'Totemic Power', desc: 'ATK+3 + DEF+3 + SPD+2', cost: 2, effect: { atk: 3, def: 3, spd: 2 }, req: 'sh_util1' },
            { id: 'sh_util3', name: 'Ancestral Guide', desc: 'All stats +4', cost: 3, effect: { atk: 4, def: 4, spd: 4, crit: 4 }, req: 'sh_util2' }
        ]
    }
};

// ============================================================
// BASE BUILDING
// ============================================================
const BASE_UPGRADES = {
    armory:    { name: 'Armory',    emoji: '⚔️', levels: [ { cost: 30, bonus: { atk: 3 } }, { cost: 80, bonus: { atk: 6 } }, { cost: 200, bonus: { atk: 10 } } ] },
    infirmary: { name: 'Infirmary', emoji: '🏥', levels: [ { cost: 30, bonus: { regen: 2 } }, { cost: 80, bonus: { regen: 5 } }, { cost: 200, bonus: { regen: 8 } } ] },
    treasury:  { name: 'Treasury',  emoji: '💰', levels: [ { cost: 40, bonus: { income: 1 } }, { cost: 100, bonus: { income: 3 } }, { cost: 250, bonus: { income: 5 } } ] },
    wall:      { name: 'Wall',      emoji: '🧱', levels: [ { cost: 35, bonus: { def: 3 } }, { cost: 90, bonus: { def: 6 } }, { cost: 220, bonus: { def: 10 } } ] },
    tower:     { name: 'Tower',     emoji: '🗼', levels: [ { cost: 50, bonus: { towerAtk: 10 } }, { cost: 120, bonus: { towerAtk: 25 } }, { cost: 300, bonus: { towerAtk: 50 } } ] }
};

// ============================================================
// RANDOM EVENTS
// ============================================================
const RANDOM_EVENTS = [
    { id: 'merchant',    name: '🧙 Mysterious Merchant', chance: 3, type: 'shop', desc: 'Pedagang misterius muncul dari kegelapan...', items: ['ramuan_hp_besar', 'scroll_crit', 'enchant_stone'], discount: 50 },
    { id: 'ambush',      name: '💀 Ambush!', chance: 3, type: 'combat', desc: 'Kamu diserang 2 monster sekaligus!', multiplier: 2 },
    { id: 'blessing',    name: '🌟 Divine Blessing', chance: 3, type: 'buff', desc: 'Cahaya suci turun dari langit...', buff: { stat: 'atk', value: 15, duration: 5, name: 'Divine Blessing' } },
    { id: 'portal',      name: '🕳️ Mysterious Portal', chance: 2, type: 'dungeon', desc: 'Portal misterius muncul! Teleport ke dungeon rahasia...', bonusFloors: 3 },
    { id: 'cursed_chest', name: '👻 Cursed Chest', chance: 2, type: 'chest', desc: 'Peti terkutuk muncul...', coinReward: 2000, curse: { stat: 'def', value: -8, duration: 3, name: 'Chest Curse' } },
    { id: 'treasure',    name: '💎 Hidden Treasure', chance: 2, type: 'treasure', desc: 'Kamu menemukan harta karun tersembunyi!', coinReward: 1500, expReward: 40 }
];

// ============================================================
// WEAPON AWAKENING
// ============================================================
const WEAPON_AWAKENINGS = {
    excalibur:     { name: 'Excalibur: Blade of Light', emoji: '✨', atkBonus: 20, special: 'Holy Strike: +15% damage vs dark enemies', cost: 100, stoneReq: 3 },
    artemis_bow:   { name: 'Artemis: Moonlight Bow',    emoji: '🌙', atkBonus: 18, special: 'Moonshot: CRIT+15% permanent',             cost: 100, stoneReq: 3 },
    staff_merlin:  { name: 'Merlin: Staff of Infinity', emoji: '♾️', atkBonus: 22, special: 'Arcane Surge: Regen 8/turn',                cost: 100, stoneReq: 3 },
    phantom_blade: { name: 'Phantom: Void Cutter',      emoji: '🌑', atkBonus: 20, special: 'Void Cut: Lifesteal 10%',                  cost: 100, stoneReq: 3 },
    deaths_scythe: { name: "Death's Scythe: Soul Reaper", emoji: '💀', atkBonus: 22, special: 'Soul Harvest: Lifesteal 15% + Poison 5', cost: 100, stoneReq: 3 },
    mjolnir:       { name: 'Mjolnir: Thunder God',       emoji: '⚡', atkBonus: 20, special: 'Thunder: Stun 1 turn + DEF+10',          cost: 100, stoneReq: 3 },
    muramasa:      { name: 'Muramasa: Demon Blade',      emoji: '🌙', atkBonus: 22, special: 'Demon Cut: CRIT+20% + Ignore DEF 15%',   cost: 100, stoneReq: 3 },
    ragnarok_axe:  { name: 'Ragnarok: World Ender',      emoji: '🌋', atkBonus: 24, special: 'Ragnarok: ATK+30% saat HP <30%',        cost: 100, stoneReq: 3 },
    gaia_staff:    { name: 'Gaia: Nature\'s Wrath',      emoji: '🌳', atkBonus: 18, special: 'Nature: Regen 10/turn + Poison 8',       cost: 100, stoneReq: 3 }
};

// ============================================================
// SUMMONS
// ============================================================
const RPG_SUMMONS = {
    fire_spirit:   { name: 'Fire Spirit',   emoji: '🔥', element: 'fire',   atk: 10, def: 3,  skill: 'Fireball (ATK+15 1 turn)' },
    water_spirit:  { name: 'Water Spirit',  emoji: '💧', element: 'water',  atk: 5,  def: 8,  skill: 'Heal Wave (Regen 8)' },
    earth_golem:   { name: 'Earth Golem',   emoji: '🪨', element: 'nature', atk: 7,  def: 12, skill: 'Stone Wall (Block+15%)' },
    wind_hawk:     { name: 'Wind Hawk',     emoji: '🦅', element: 'fire',   atk: 12, def: 2,  skill: 'Gale Slash (SPD+10)' },
    dark_wraith:   { name: 'Dark Wraith',   emoji: '👻', element: 'dark',   atk: 14, def: 4,  skill: 'Soul Drain (Lifesteal 8%)' },
    ice_phoenix:   { name: 'Ice Phoenix',   emoji: '❄️', element: 'water',  atk: 11, def: 6,  skill: 'Frost Nova (ATK+12)' },
    thunder_wolf:  { name: 'Thunder Wolf',  emoji: '⚡', element: 'nature', atk: 13, def: 5,  skill: 'Lightning Fang (CRIT+20%)' },
    void_serpent:  { name: 'Void Serpent',   emoji: '🐍', element: 'dark',   atk: 15, def: 3,  skill: 'Void Bite (Poison 8/turn)' }
};
const ELEMENT_ADVANTAGE = { fire: 'nature', nature: 'water', water: 'fire', dark: 'fire' };

// ============================================================
// STORY CHAPTERS
// ============================================================
const STORY_CHAPTERS = [
    { ch: 1, title: 'The Awakening',     desc: 'Kamu terbangun di dunia asing... ingatan hilang. Seorang sage mengatakan kamu "Orang Terpilih".',   bossName: 'Goblin Captain', bossHp: 80, bossAtk: 12, bossDef: 5, reward: { exp: 50, coins: 100, title: 'isekai_newbie' }, reqLevel: 1 },
    { ch: 2, title: 'Village in Danger',  desc: 'Desa terdekat diserang monster. Penduduk meminta bantuanmu.',  bossName: 'Orc Warlord', bossHp: 150, bossAtk: 20, bossDef: 10, reward: { exp: 100, coins: 200 }, reqLevel: 3 },
    { ch: 3, title: 'The Dark Forest',    desc: 'Rumor tentang artefak kuno di hutan gelap. Kamu harus memasukinya.', bossName: 'Forest Guardian', bossHp: 250, bossAtk: 28, bossDef: 15, reward: { exp: 150, coins: 300, item: 'enchant_stone' }, reqLevel: 5 },
    { ch: 4, title: 'Betrayal',           desc: 'Seseorang yang kamu percaya ternyata berkhianat. Pertarungan tak terelakkan.', bossName: 'Dark Paladin', bossHp: 350, bossAtk: 35, bossDef: 20, reward: { exp: 200, coins: 400 }, reqLevel: 8 },
    { ch: 5, title: 'The Demon Gate',     desc: 'Gerbang dimensi iblis terbuka. Pasukan iblis mulai menyerbu.', bossName: 'Demon General', bossHp: 500, bossAtk: 45, bossDef: 25, reward: { exp: 300, coins: 500, title: 'demon_slayer' }, reqLevel: 10 },
    { ch: 6, title: 'Void Expedition',    desc: 'Kamu memasuki void realm untuk mencari jawaban tentang asal-usulmu.', bossName: 'Void Sentinel', bossHp: 700, bossAtk: 55, bossDef: 30, reward: { exp: 400, coins: 600, item: 'awakening_stone' }, reqLevel: 13 },
    { ch: 7, title: 'The Lost Kingdom',   desc: 'Kerajaan kuno yang hilang ditemukan. Rajanya telah berubah jadi undead.', bossName: 'Lich King', bossHp: 900, bossAtk: 65, bossDef: 35, reward: { exp: 500, coins: 700 }, reqLevel: 16 },
    { ch: 8, title: 'Dragon\'s Wrath',    desc: 'Naga purba bangkit dari tidur panjangnya. Seluruh benua terancam.', bossName: 'Ancient Wyrm', bossHp: 1200, bossAtk: 75, bossDef: 40, reward: { exp: 600, coins: 800, title: 'wyrm_slayer' }, reqLevel: 19 },
    { ch: 9, title: 'The Final Truth',    desc: 'Kamu akhirnya mengetahui siapa yang memanggilmu ke dunia ini... dan alasannya.', bossName: 'The Creator', bossHp: 1500, bossAtk: 85, bossDef: 45, reward: { exp: 800, coins: 1000, item: 'awakening_stone' }, reqLevel: 22 },
    { ch: 10, title: 'Endgame: Ragnarok', desc: 'Pertempuran terakhir. Nasib seluruh dunia ada di tanganmu.', bossName: 'Ragnarok, God of Destruction', bossHp: 2000, bossAtk: 100, bossDef: 50, reward: { exp: 1500, coins: 2000, title: 'world_savior' }, reqLevel: 25 }
];
const STORY_TITLES = {
    isekai_newbie: { name: 'Isekai Newbie', emoji: '🌀' },
    demon_slayer: { name: 'Demon Slayer', emoji: '🗡️' },
    wyrm_slayer: { name: 'Wyrm Slayer', emoji: '🐲' },
    world_savior: { name: 'World Savior', emoji: '🌟' }
};

// ============================================================
// DEMON INVASION
// ============================================================
const DEMON_INVASION_PHASES = [
    { phase: 1, name: 'Minion Wave',   emoji: '👹', hp: 3000,  atk: 30, reward: { exp: 50,  coinMin: 500,  coinMax: 1500 } },
    { phase: 2, name: 'Elite Guard',   emoji: '⚔️', hp: 5000,  atk: 50, reward: { exp: 100, coinMin: 1000, coinMax: 2500 } },
    { phase: 3, name: 'Demon King',    emoji: '👿', hp: 10000, atk: 80, reward: { exp: 300, coinMin: 3000, coinMax: 6000 } }
];

// ============================================================
// EXTRA ITEMS
// ============================================================
const EXTRA_ITEMS = {
    awakening_stone: { name: 'Awakening Stone', emoji: '🌟', desc: 'Untuk awaken senjata tier 5', type: 'material', price: 8000, category: 'special' }
};

// ============================================================
// DAY/NIGHT CYCLE
// ============================================================
const TIME_PHASES = ['🌅 Pagi','☀️ Siang','🌇 Sore','🌙 Malam'];

// ============================================================
// WEATHER
// ============================================================
const WEATHERS = [
    { id:'clear',  emoji:'☀️', name:'Cerah',  effects:{} },
    { id:'rain',   emoji:'🌧️', name:'Hujan',  effects:{ waterBonus:20 } },
    { id:'snow',   emoji:'❄️', name:'Salju',  effects:{ spdPenalty:-3 } },
    { id:'storm',  emoji:'🌩️', name:'Badai',  effects:{ atkBonus:15, critPenalty:-10 } },
    { id:'fog',    emoji:'🌫️', name:'Kabut',  effects:{ dodgeBonus:20 } }
];

// ============================================================
// HUNGER & STAMINA
// ============================================================
const MAX_STAMINA = 100;
const STAMINA_COSTS = { hunt: 10, dungeon: 15, arena: 12, darkworld: 20 };
const STAMINA_REGEN_PER_HOUR = 5;
const RPG_FOODS = {
    roti:       { name:'Roti',         emoji:'🍞', stamina:15, hp:0,   price: 300,  desc:'Roti sederhana' },
    daging:     { name:'Daging Bakar', emoji:'🍖', stamina:30, hp:10,  price: 800,  desc:'Daging bakar juicy' },
    sup:        { name:'Sup Hangat',   emoji:'🍲', stamina:20, hp:20,  price: 600,  desc:'Sup hangat bergizi' },
    apel_emas:  { name:'Apel Emas',    emoji:'🍎', stamina:50, hp:30,  price: 1500, desc:'Apel langka penuh energi' },
    feast:      { name:'Royal Feast',  emoji:'👑', stamina:100,hp:999, price: 3000, desc:'Makanan raja, full restore' },
    onigiri:    { name:'Onigiri',      emoji:'🍙', stamina:12, hp:5,   price: 200,  desc:'Nasi kepal simpel' },
    ramen:      { name:'Ramen',        emoji:'🍜', stamina:25, hp:15,  price: 700,  desc:'Ramen panas spesial' },
    madu:       { name:'Madu Hutan',   emoji:'🍯', stamina:35, hp:0,   price: 1000, desc:'Madu energi tinggi' }
};

// ============================================================
// NPC ENCOUNTERS
// ============================================================
const NPC_ENCOUNTERS = [
    { id:'blacksmith', name:'🔨 Blacksmith',  desc:'Pandai besi menawarkan repair gratis!', type:'repair' },
    { id:'healer',     name:'💚 Healer',      desc:'Tabib desa menyembuhkanmu.', type:'heal', value:50 },
    { id:'merchant',   name:'🧙 Merchant',    desc:'Pedagang keliling menjual item langka.', type:'shop', items:['enchant_stone','madu','apel_emas'] },
    { id:'info_broker', name:'🕵️ Info Broker', desc:'Informan membisikkan lokasi harta...', type:'info', reward:{ exp:20, coins:5 } },
    { id:'beggar',     name:'👴 Pengemis',    desc:'Pengemis tua meminta bantuan...', type:'karma', karmaCost:0, karmaGain:3, coinCost: 300 },
    { id:'thief',      name:'🗡️ Pencuri',     desc:'Pencuri mencoba merampokmu!', type:'combat', hp:60, atk:15, def:5 }
];

// ============================================================
// KARMA
// ============================================================
const KARMA_LEVELS = [
    { min:-100, name:'Iblis',        emoji:'😈', shopMod:1.2, npcHostile:true },
    { min:-30,  name:'Penjahat',     emoji:'💀', shopMod:1.1, npcHostile:true },
    { min:-10,  name:'Tersangka',    emoji:'⚠️', shopMod:1.05,npcHostile:false },
    { min:0,    name:'Netral',       emoji:'⚖️', shopMod:1.0, npcHostile:false },
    { min:20,   name:'Baik Hati',    emoji:'😇', shopMod:0.95,npcHostile:false },
    { min:50,   name:'Pahlawan',     emoji:'🦸', shopMod:0.9, npcHostile:false },
    { min:100,  name:'Suci',         emoji:'✨', shopMod:0.85,npcHostile:false }
];

// ============================================================
// WEAPON DURABILITY
// ============================================================
const MAX_DURABILITY = 100;
const DURABILITY_LOSS_PER_BATTLE = 5;
const REPAIR_COST_PER_POINT = 0.03;

// ============================================================
// ELEMENTS
// ============================================================
const ELEMENTS = ['fire','water','nature','dark','light','neutral'];
const ELEMENT_CHART = { fire:'nature', nature:'water', water:'fire', dark:'light', light:'dark' };
const CLASS_ELEMENTS = { warrior:'fire', archer:'nature', mage:'water', assassin:'dark', necromancer:'dark', paladin:'light', samurai:'fire', berserker:'fire', shaman:'nature' };

// ============================================================
// DUEL
// ============================================================
const DUEL_BET = 500;
const DUEL_TIMEOUT = 90000;

// ============================================================
// GACHA
// ============================================================
const GACHA_PRICES = { single: 500, multi: 2000 };

// ============================================================
// MENU SYSTEM
// ============================================================
const MENU_ORDER = ['rpg', 'games', 'education', 'image', 'media', 'ai', 'utility', 'admin', 'owner'];
const MENU_COMMANDS = {
    rpg: '.menurpg', games: '.menugame', education: '.menueducation', image: '.menupin', media: '.menumedia',
    ai: '.menuai', utility: '.menuutil', admin: '.menuadmin', owner: '.menuowner'
};
const MENU_ALIAS = {
    menurpg: 'rpg', menugame: 'games', menugames: 'games', menuai: 'ai',
    menupin: 'image', menuimage: 'image', menumedia: 'media',
    menuutility: 'utility', menuutil: 'utility', menuadmin: 'admin', menuowner: 'owner',
    pinmenu: 'image', imagemenu: 'image', mediamenu: 'media',
    utilitymenu: 'utility', adminmenu: 'admin', ownermenu: 'owner',
    menueducation: 'education', educationmenu: 'education'
};

// MENU_CATEGORIES moved to modules/utility/menu-categories.js
// Import with: const { MENU_CATEGORIES } = require('./modules/utility/menu-categories');

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    // Config
    BOT_CONFIG, REPLACEMENT_CHAR, FRAME,
    // Currency
    COIN_UNITS, COIN_EMOJI, DEFAULT_COINS, LEGACY_OLD_CURRENCY_KEY, LEGACY_OLD_BALANCE_KEY,
    // RPG Data
    RPG_CLASSES, RPG_WEAPONS, RPG_ITEMS, RPG_ARMORS, RPG_SHIELDS, RPG_MONSTERS,
    RPG_ACHIEVEMENTS, RPG_QUESTS, QUEST_COOLDOWN, RPG_EVOLUTIONS,
    // Dungeon
    DUNGEON_COOLDOWN, DUNGEON_MOBS, DUNGEON_BOSSES,
    // Pets
    RPG_PETS, RPG_PETS_EVOLVED,
    // Crafting
    RPG_RECIPES, RPG_CRAFT_ITEMS, ENCHANT_RATES, ENCHANT_ATK_BONUS,
    // Arena
    ARENA_RANKS,
    // World Boss
    WORLD_BOSS_POOL, WORLD_BOSS_DURATION,
    // Cooldowns
    COOLDOWNS,
    // Death & Void
    VOID_EVENTS, CURSES,
    // Dark World
    DARK_WORLD_DURATION, DARK_MONSTERS,
    // Skill Trees
    RPG_SKILL_TREES,
    // Base
    BASE_UPGRADES,
    // Events
    RANDOM_EVENTS,
    // Awakening
    WEAPON_AWAKENINGS,
    // Summons
    RPG_SUMMONS, ELEMENT_ADVANTAGE,
    // Story
    STORY_CHAPTERS, STORY_TITLES,
    // Invasion
    DEMON_INVASION_PHASES,
    // Extra
    EXTRA_ITEMS,
    // Time & Weather
    TIME_PHASES, WEATHERS,
    // Survival
    MAX_STAMINA, STAMINA_COSTS, STAMINA_REGEN_PER_HOUR, RPG_FOODS,
    // NPC
    NPC_ENCOUNTERS,
    // Karma
    KARMA_LEVELS,
    // Durability
    MAX_DURABILITY, DURABILITY_LOSS_PER_BATTLE, REPAIR_COST_PER_POINT,
    // Elements
    ELEMENTS, ELEMENT_CHART, CLASS_ELEMENTS,
    // Duel
    DUEL_BET, DUEL_TIMEOUT,
    // Gacha
    GACHA_PRICES,
    // Menu
    MENU_ORDER, MENU_COMMANDS, MENU_ALIAS
};
