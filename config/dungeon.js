// ============================================================
// config/dungeon.js — Dungeon, World Boss, Dark World, Story
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

const WORLD_BOSS_POOL = [
    { name: 'Bahamut, Dragon Primordial', emoji: '🐉', baseHp: 5000, atk: 60, reward: { exp: 200, coinMin: 2000, coinMax: 5000 } },
    { name: 'Ifrit, Lord of Flames',      emoji: '🔥', baseHp: 6000, atk: 70, reward: { exp: 250, coinMin: 2500, coinMax: 6000 } },
    { name: 'Leviathan, Sea Emperor',     emoji: '🌊', baseHp: 7000, atk: 55, reward: { exp: 220, coinMin: 2200, coinMax: 5500 } },
    { name: 'Ragnarok, The End Bringer',  emoji: '💀', baseHp: 10000, atk: 80, reward: { exp: 400, coinMin: 4000, coinMax: 8000 } }
];
const WORLD_BOSS_DURATION = 30 * 60 * 1000;

const DARK_WORLD_DURATION = 30 * 60 * 1000;
const DARK_MONSTERS = [
    { name: 'Shadow Fiend',    emoji: '👻', hp: 200, atk: 28, def: 15, spd: 10, exp: 60,  coinMin: 800,  coinMax: 1500, loot: 'ramuan_hp_besar', lootChance: 30 },
    { name: 'Void Walker',     emoji: '🌑', hp: 300, atk: 35, def: 20, spd: 12, exp: 90,  coinMin: 1200, coinMax: 2000, loot: 'scroll_crit',     lootChance: 25 },
    { name: 'Abyss Knight',    emoji: '⚔️', hp: 450, atk: 42, def: 28, spd: 8,  exp: 130, coinMin: 1500, coinMax: 2500, loot: 'enchant_stone',   lootChance: 20 },
    { name: 'Demon King',      emoji: '👹', hp: 800, atk: 55, def: 35, spd: 14, exp: 250, coinMin: 2500, coinMax: 4500, loot: 'revive_stone',    lootChance: 40 },
    { name: 'Shadow Overlord', emoji: '😈', hp: 1200,atk: 65, def: 40, spd: 16, exp: 350, coinMin: 3500, coinMax: 6000, loot: 'awakening_stone', lootChance: 15 },
    { name: 'Void Dragon',     emoji: '🐉', hp: 1500,atk: 75, def: 45, spd: 18, exp: 500, coinMin: 5000, coinMax: 8000, loot: 'awakening_stone', lootChance: 25 }
];

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

const STORY_CHAPTERS = [
    { ch: 1, title: 'Awakening', levelReq: 1, boss: { name: 'Goblin King', emoji: '👺', hp: 100, atk: 15, def: 5, spd: 5, exp: 50, coinMin: 500, coinMax: 1000 }, reward: 'Pedang Besi' },
    { ch: 2, title: 'Forest of Shadows', levelReq: 5, boss: { name: 'Forest Guardian', emoji: '🌳', hp: 200, atk: 22, def: 12, spd: 6, exp: 100, coinMin: 1000, coinMax: 2000 }, reward: 'Zirah Besi' },
    { ch: 3, title: 'Cavern of Echoes', levelReq: 8, boss: { name: 'Cave Troll', emoji: '🗿', hp: 350, atk: 30, def: 18, spd: 4, exp: 180, coinMin: 2000, coinMax: 3500 }, reward: 'Busur Besi' },
    { ch: 4, title: 'Sky Castle', levelReq: 12, boss: { name: 'Harpy Queen', emoji: '🦅', hp: 500, atk: 38, def: 20, spd: 15, exp: 280, coinMin: 3500, coinMax: 5000 }, reward: 'Tongkat Kristal' },
    { ch: 5, title: 'Volcanic Depths', levelReq: 15, boss: { name: 'Magma Golem', emoji: '🌋', hp: 700, atk: 45, def: 30, spd: 8, exp: 400, coinMin: 5000, coinMax: 8000 }, reward: 'Belati Besi' },
    { ch: 6, title: 'Frozen Abyss', levelReq: 18, boss: { name: 'Frost Wyrm', emoji: '❄️', hp: 900, atk: 52, def: 35, spd: 12, exp: 550, coinMin: 8000, coinMax: 12000 }, reward: 'Sabit Besi' },
    { ch: 7, title: 'Demon Gate', levelReq: 22, boss: { name: 'Archdemon', emoji: '👿', hp: 1200, atk: 60, def: 40, spd: 14, exp: 700, coinMin: 12000, coinMax: 18000 }, reward: 'Palu Besi' },
    { ch: 8, title: "Dragon's Lair", levelReq: 25, boss: { name: 'Ancient Dragon', emoji: '🐉', hp: 1600, atk: 70, def: 48, spd: 16, exp: 900, coinMin: 18000, coinMax: 25000 }, reward: 'Katana Besi' },
    { ch: 9, title: 'Void Rift', levelReq: 30, boss: { name: 'Void Titan', emoji: '🌑', hp: 2000, atk: 80, def: 55, spd: 18, exp: 1200, coinMin: 25000, coinMax: 40000 }, reward: 'Kapak Besi' },
    { ch: 10, title: 'Final Battle', levelReq: 35, boss: { name: 'Dark God', emoji: '💀', hp: 3000, atk: 100, def: 70, spd: 22, exp: 2000, coinMin: 50000, coinMax: 100000 }, reward: 'Totem Roh' }
];
const STORY_TITLES = {
    isekai_newbie: { name: 'Isekai Newbie', emoji: '🌟' },
    demon_slayer: { name: 'Demon Slayer', emoji: '⚔️' },
    wyrm_slayer: { name: 'Wyrm Slayer', emoji: '🐉' },
    world_savior: { name: 'World Savior', emoji: '🏆' }
};

const DEMON_INVASION_PHASES = [
    { phase: 1, name: 'Demon Scouts', emoji: '👹', hp: 5000, atk: 40, reward: { exp: 300, coinMin: 3000, coinMax: 6000 } },
    { phase: 2, name: 'Demon Army', emoji: '👺', hp: 10000, atk: 60, reward: { exp: 600, coinMin: 6000, coinMax: 12000 } },
    { phase: 3, name: 'Demon Overlord', emoji: '😈', hp: 20000, atk: 80, reward: { exp: 1000, coinMin: 10000, coinMax: 25000 } }
];

module.exports = {
    DUNGEON_COOLDOWN, DUNGEON_MOBS, DUNGEON_BOSSES,
    WORLD_BOSS_POOL, WORLD_BOSS_DURATION,
    DARK_WORLD_DURATION, DARK_MONSTERS,
    VOID_EVENTS, CURSES,
    STORY_CHAPTERS, STORY_TITLES,
    DEMON_INVASION_PHASES
};
