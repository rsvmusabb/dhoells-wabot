// ============================================================
// config/game.js — Game mechanics, gacha, duel, survival, kasino
// ============================================================

const GACHA_PRICES = { single: 500, multi: 2000 };
const DUEL_BET = 500;
const DUEL_TIMEOUT = 90000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

// Stamina
const MAX_STAMINA = 100;
const STAMINA_COSTS = { hunt: 10, dungeon: 15, arena: 12, darkworld: 20 };
const STAMINA_REGEN_PER_HOUR = 5;

// Durability
const MAX_DURABILITY = 100;
const DURABILITY_LOSS_PER_BATTLE = 5;
const REPAIR_COST_PER_POINT = 0.03;

// Arena
const ARENA_RANKS = [
    { id: 'bronze',  name: 'Bronze',  emoji: '🥉', minElo: 0,   reward: 5 },
    { id: 'silver',  name: 'Silver',  emoji: '🥈', minElo: 100, reward: 10 },
    { id: 'gold',    name: 'Gold',    emoji: '🥇', minElo: 250, reward: 20 },
    { id: 'diamond', name: 'Diamond', emoji: '💎', minElo: 500, reward: 35 },
    { id: 'mythic',  name: 'Mythic',  emoji: '🏆', minElo: 800, reward: 50 }
];

// Enchant
const ENCHANT_RATES = { 1: 90, 2: 75, 3: 60, 4: 45, 5: 30, 6: 20, 7: 10 };
const ENCHANT_ATK_BONUS = 4;

// Weapon Awakening
const WEAPON_AWAKENINGS = {
    excalibur:     { name: 'Awakened Excalibur',     atkBonus: 30,  special: 'Holy Damage',    cost: 50000, stoneReq: 3 },
    artemis_bow:   { name: 'Awakened Artemis Bow',   atkBonus: 30,  special: 'Pierce Armor',   cost: 50000, stoneReq: 3 },
    staff_merlin:  { name: 'Awakened Staff of Merlin',atkBonus: 30, special: 'Mana Shield',    cost: 50000, stoneReq: 3 },
    phantom_blade: { name: 'Awakened Phantom Blade',  atkBonus: 30,  special: 'Phase Strike',   cost: 50000, stoneReq: 3 },
    deaths_scythe: { name: "Awakened Death's Scythe", atkBonus: 30,  special: 'Soul Harvest',   cost: 50000, stoneReq: 3 },
    mjolnir:       { name: 'Awakened Mjolnir',        atkBonus: 30,  special: 'Thunder God',   cost: 50000, stoneReq: 3 },
    muramasa:      { name: 'Awakened Muramasa',       atkBonus: 30,  special: 'Blood Blade',    cost: 50000, stoneReq: 3 },
    ragnarok_axe:  { name: 'Awakened Ragnarok Axe',   atkBonus: 30,  special: 'World Breaker',  cost: 50000, stoneReq: 3 },
    gaia_staff:    { name: 'Awakened Gaia Staff',     atkBonus: 30,  special: 'Nature Wrath',   cost: 50000, stoneReq: 3 }
};

// Extra Items (materials)
const EXTRA_ITEMS = {
    awakening_stone: { name: 'Awakening Stone', emoji: '💎', desc: 'Material untuk awakening senjata tier 5', type: 'material', price: 10000, category: 'special' }
};

// NPC Encounters
const NPC_ENCOUNTERS = [
    { name: 'Blacksmith', emoji: '🔨', type: 'repair', desc: 'Seorang pandai besi menawarkan jasanya...', msg: '🔨 Blacksmith: "Aku bisa repair senjatamu!"' },
    { name: 'Healer', emoji: '💊', type: 'heal', desc: 'Seorang tabib misterius muncul...', msg: '💊 Healer: "Biarkan aku menyembuhkanmu..."' },
    { name: 'Merchant', emoji: '🧳', type: 'shop', desc: 'Seorang pedagang keliling menawarkan barang langka...', msg: '🧳 Merchant: "Mau beli barang langka?"' },
    { name: 'Info Broker', emoji: '📜', type: 'info', desc: 'Seorang mata-mata memberikan informasi...', msg: '📜 Info Broker: "Aku punya info berharga..."' },
    { name: 'Beggar', emoji: '🥺', type: 'karma', desc: 'Seorang pengemis meminta belas kasihmu...', msg: '🥺 Beggar: "Tolong, aku butuh bantuan..."' },
    { name: 'Thief', emoji: '🥷', type: 'steal', desc: 'Seseorang mencoba mencuri kamu!', msg: '🥷 Thief: "Hahaha, dompetmu jadi milikku!"' }
];

// Random Events
const RANDOM_EVENTS = [
    { name: 'Wandering Merchant', emoji: '🧳', type: 'shop', desc: 'Kamu menemukan pedagang keliling dengan harga spesial!', weight: 15 },
    { name: 'Ambush', emoji: '⚔️', type: 'battle', desc: 'Kamu diserang monster liar!', weight: 20 },
    { name: 'Ancient Blessing', emoji: '✨', type: 'buff', desc: 'Berkat kuno menyinari jalanmu...', weight: 10 },
    { name: 'Hidden Portal', emoji: '🌀', type: 'teleport', desc: 'Portal misterius muncul di depanmu!', weight: 5 },
    { name: 'Cursed Chest', emoji: '📦', type: 'chest', desc: 'Kamu menemukan peti terkutuk...', weight: 10 },
    { name: 'Treasure', emoji: '💎', type: 'treasure', desc: 'Kamu menemukan harta karun tersembunyi!', weight: 8 }
];

// Karma
const KARMA_LEVELS = [
    { min: -100, max: -50, name: 'Demon', emoji: '😈', shopMod: 1.5, hostile: true },
    { min: -49, max: -20, name: 'Evil', emoji: '👿', shopMod: 1.2, hostile: true },
    { min: -19, max: -1, name: 'Bad', emoji: '😈', shopMod: 1.1, hostile: false },
    { min: 0, max: 0, name: 'Neutral', emoji: '😐', shopMod: 1.0, hostile: false },
    { min: 1, max: 20, name: 'Good', emoji: '😊', shopMod: 0.95, hostile: false },
    { min: 21, max: 50, name: 'Saint', emoji: '😇', shopMod: 0.85, hostile: false },
    { min: 51, max: 100, name: 'Angel', emoji: '👼', shopMod: 0.7, hostile: false }
];

// Time & Weather
const TIME_PHASES = ['Pagi', 'Siang', 'Sore', 'Malam'];
const WEATHERS = [
    { name: 'Clear', emoji: '☀️', atkMod: 0, defMod: 0, spdMod: 0 },
    { name: 'Rain', emoji: '🌧️', atkMod: -2, defMod: 2, spdMod: -1 },
    { name: 'Snow', emoji: '❄️', atkMod: -3, defMod: 0, spdMod: -3 },
    { name: 'Storm', emoji: '⛈️', atkMod: 5, defMod: -3, spdMod: 2 },
    { name: 'Fog', emoji: '🌫️', atkMod: -1, defMod: -1, spdMod: -2 }
];

// Crafting
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

// Food
const RPG_FOODS = {
    roti:  { name: 'Roti',  emoji: '🍞', stamina: 10, hp: 0,  price: 100 },
    daging: { name: 'Daging', emoji: '🥩', stamina: 20, hp: 10, price: 250 },
    sup:   { name: 'Sup',   emoji: '🍲', stamina: 15, hp: 5,  price: 150 },
    ikan:  { name: 'Ikan',  emoji: '🐟', stamina: 18, hp: 8,  price: 200 },
    buah:  { name: 'Buah',  emoji: '🍎', stamina: 8,  hp: 3,  price: 80 },
    kue:   { name: 'Kue',   emoji: '🍰', stamina: 25, hp: 15, price: 350 },
    ramuan_makan: { name: 'Ramuan Makan', emoji: '🧪', stamina: 30, hp: 20, price: 500 },
    makanan_legend: { name: 'Makanan Legend', emoji: '🌟', stamina: 50, hp: 50, price: 2000 }
};

// Guild
const GUILD_CREATE_COST = 500;
const GUILD_BUFF_COST = 50;
const GUILD_BUFF_DURATION = 3 * 60 * 60 * 1000;

// Market
const MARKET_FEE = 0.1;

module.exports = {
    GACHA_PRICES, DUEL_BET, DUEL_TIMEOUT, DAILY_COOLDOWN,
    MAX_STAMINA, STAMINA_COSTS, STAMINA_REGEN_PER_HOUR,
    MAX_DURABILITY, DURABILITY_LOSS_PER_BATTLE, REPAIR_COST_PER_POINT,
    ARENA_RANKS, ENCHANT_RATES, ENCHANT_ATK_BONUS,
    WEAPON_AWAKENINGS, EXTRA_ITEMS,
    NPC_ENCOUNTERS, RANDOM_EVENTS, KARMA_LEVELS,
    TIME_PHASES, WEATHERS,
    RPG_RECIPES, RPG_CRAFT_ITEMS, RPG_FOODS,
    GUILD_CREATE_COST, GUILD_BUFF_COST, GUILD_BUFF_DURATION, MARKET_FEE
};
