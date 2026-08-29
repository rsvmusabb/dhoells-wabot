/**
 * @file help.js
 * @description Help System & Menu Builder module. Constructs the ASCII terminal UI for WhatsApp.
 *              Dynamically renders menus based on user privileges (User, Admin, Owner).
 * @author OWL ABE
 * @version 3.0.0
 * @license MIT
 */

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const { FRAME, MENU_COMMANDS, MENU_ORDER } = require('../../config');
const { MENU_CATEGORIES } = require('./menu-categories');
const { isOwner, isPrivileged } = require('./db');

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// UI BUILDERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Creates a framed header string.
 * @param {string} icon - The emoji icon.
 * @param {string} title - The header title.
 * @returns {string} Formatted ASCII header.
 */
function frameTitle(icon, title) {
    return `${FRAME.tl}${FRAME.h.repeat(3)}〔 *${icon} ${title}* 〕${FRAME.h.repeat(3)}`;
}

/**
 * Normalizes user menu requests into canonical category keys.
 * @param {string} value - User's menu alias (e.g. 'game').
 * @returns {string} Canonical menu key (e.g. 'games').
 */
function normalizeMenuCategory(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return 'main';
    
    const aliases = {
        game: 'games', mini: 'games', minigame: 'games', mini_games: 'games',
        pin: 'image', pinterest: 'image', gambar: 'image', images: 'image',
        music: 'media', musik: 'media', audio: 'media',
        tools: 'utility', util: 'utility', ai_tools: 'ai', rpgadventure: 'rpg',
        modul: 'education', fisika: 'education', pelajaran: 'education',
        kasino: 'rpg', casino: 'rpg', judi: 'rpg', slot: 'rpg', coinflip: 'rpg', dice: 'rpg', tebak: 'rpg'
    };
    
    return aliases[key] || key;
}

/**
 * Retrieves the visible menu keys based on user privilege.
 * @param {string} participant - User's JID.
 * @returns {Array<string>} Array of visible menu keys.
 */
function getVisibleMenuOrder(participant) {
    return MENU_ORDER.filter(key => {
        if (key === 'owner') return isOwner(participant);
        if (key === 'admin') return isPrivileged(participant);
        return true;
    });
}

/**
 * Builds the main dashboard menu.
 * @param {string} participant - User's JID.
 * @returns {string} The final compiled string for the main menu.
 */
function buildMainMenuText(participant) {
    let text = frameTitle('\uD83C\uDF38', 'CLARYN BOT') + '\n' + FRAME.v + '\n';
    
    text += `${FRAME.v} Name: *Claryn AI & RPG*\n`;
    text += `${FRAME.v} Status: *Online \uD83D\uDFE2*\n`;
    text += `${FRAME.v}\n`;
    text += `${FRAME.branch}${FRAME.h.repeat(2)} \uD83D\uDCCB *MENU UTAMA* ${FRAME.h.repeat(6)}\n`;
    
    for (const key of getVisibleMenuOrder(participant)) {
        const item = MENU_CATEGORIES[key];
        text += `${FRAME.v} ${item.icon} *${MENU_COMMANDS[key]}* — ${item.title}\n`;
    }
    
    text += `${FRAME.v}\n`;
    text += `${FRAME.v} \uD83D\uDCA1 Ketik *.menurpg* untuk menu RPG lengkap\n`;
    text += `${FRAME.v} \uD83D\uDCA1 Ketik *.menugame* untuk gacha & mini games\n`;
    text += `${FRAME.v} \uD83D\uDCA1 Baru? Ketik *.role warrior* untuk mulai!\n`;
    text += `${FRAME.bl}${FRAME.h.repeat(19)}`;
    
    return text;
}

/**
 * Builds a specific sub-menu based on category.
 * @param {string} category - The category key.
 * @param {string} participant - User's JID.
 * @returns {string} The formatted sub-menu string.
 */
function buildSubMenuText(category, participant) {
    const item = MENU_CATEGORIES[category];
    if (!item) return buildUnknownMenuText(category, participant);
    
    let text = `${frameTitle(item.icon, item.title.toUpperCase())}\n${FRAME.v}\n`;
    text += `${FRAME.v} ${item.hint}\n${FRAME.v}\n`;
    
    if (item.sections) {
        for (const section of item.sections) {
            text += `${FRAME.branch}${FRAME.h.repeat(2)} *${section.header}* ${FRAME.h.repeat(2)}\n`;
            for (const [cmd, desc] of section.commands) {
                text += `${FRAME.v}  \u227D *${cmd}*\n${FRAME.v}     ${desc}\n`;
            }
            text += `${FRAME.v}\n`;
        }
    } else if (item.commands) {
        for (const [cmd, desc] of item.commands) {
            text += `${FRAME.branch} \u227D *${cmd}*\n${FRAME.v}   ${desc}\n${FRAME.v}\n`;
        }
    }
    
    text += `${FRAME.v} Menu utama: *.menu*\n`;
    text += `${FRAME.bl}${FRAME.h.repeat(19)}`;
    return text;
}

/**
 * Builds the fallback menu for unknown categories.
 */
function buildUnknownMenuText(category, participant) {
    const pinIcon = '\uD83D\uDCCC';
    const valid = getVisibleMenuOrder(participant).map(key => '.menu ' + key).join('\n');
    
    let text = frameTitle(pinIcon, 'MENU TIDAK DITEMUKAN') + '\n' + FRAME.v + '\n';
    text += `${FRAME.v} Kategori *${category || '-'}* tidak dikenal.\n`;
    text += `${FRAME.v}\n${FRAME.branch}${FRAME.h.repeat(2)} *Kategori tersedia* ${FRAME.h.repeat(2)}\n`;
    text += valid.split('\n').map(item => `${FRAME.v} > ${item}`).join('\n') + '\n';
    text += `${FRAME.bl}${FRAME.h.repeat(19)}`;
    return text;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// HELP TOPICS DIRECTORY
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const HELP_TOPICS = {
    rpg: { icon: '\uD83C\uDFEF', title: 'RPG System', text: '\uD83C\uDFEF *RPG SYSTEM*\n\nSistem RPG lengkap dengan class, battle, skill tree, dan 30+ fitur.\n\n\uD83D\uDCCB *Sub-topik:*\n▸ *.help battle* — Hunt, Duel, Raid, Arena\n▸ *.help dungeon* — Dungeon & Boss\n▸ *.help shop* — Toko, Buy, Sell\n▸ *.help equipment* — Weapon, Armor, Enchant\n▸ *.help guild* — Guild system\n▸ *.help skill* — Skill Tree & Class Skill\n▸ *.help isekai* — Dark World, Story, Invasion\n▸ *.help survival* — Stamina, Food, Repair\n▸ *.help gacha* — Gacha character\n▸ *.help pet* — Pet companion\n▸ *.help quest* — Quest & Achievement\n▸ *.help craft* — Crafting & Enchant\n▸ *.help base* — Base Building\n▸ *.help pvp* — PvP, Bounty, Karma\n▸ *.help market* — Marketplace\n\n_Ketik .help <topik> untuk detail!_' },
    battle: { icon: '\u2694\uFE0F', title: 'Battle System', text: '\u2694\uFE0F *BATTLE SYSTEM*\n\n\uD83C\uDFAF *Commands:*\n▸ *.hunt* — Solo hunt monster random\n   └ Dapat: EXP, Coin, Loot\n   └ Butuh: Stamina 10\n   └ Cooldown: 30 detik\n\n▸ *.duel @tag* — PvP 1v1 (grup only)\n   └ Bet: 5 Silver\n   └ Menang: +5 Silver, +karma\n   └ Kalah: -5 Silver, -karma\n\n▸ *.raid @tag* — Co-op 2 player\n   └ Tag teman untuk bantuin\n   └ Boss lebih kuat, reward lebih gede\n\n▸ *.arena* — Ranked PvP\n   └ ELO system (Bronze→Mythic)\n   └ *.arena rank* cek peringkat\n   └ Cooldown: 2 menit\n\n▸ *.skill* — Pakai skill class\n   └ Cooldown 3 turn battle\n\n\uD83D\uDCA1 _Tips: Equip weapon + eat food sebelum battle!_' },
    dungeon: { icon: '\uD83C\uDFDA\uFE0F', title: 'Dungeon System', text: '\uD83C\uDFDA\uFE0F *DUNGEON SYSTEM*\n\n\uD83D\uDCD6 Floor 1→100, makin tinggi makin susah!\n\n▸ *.dungeon* / *.dg* — Masuk floor selanjutnya\n   └ Cooldown: 3 menit\n   └ Stamina: 15\n   └ Setiap 10 floor = BOSS!\n   └ Boss drop: enchant_stone, revive_stone\n\n▸ *.dungeoninfo* — Info floor saat ini\n   └ Nama monster, stats, reward\n\n\uD83D\uDCCA *Scaling:*\n   └ Floor 1-10: Mudah (Slime, Goblin)\n   └ Floor 11-30: Sedang\n   └ Floor 31-50: Sulit\n   └ Floor 51-100: Extreme (drop langka!)\n\n\uD83D\uDCA1 _Boss setiap floor 10, 20, 30... drop item langka!_' },
    shop: { icon: '\uD83D\uDED2', title: 'Shop System', text: '\uD83D\uDED2 *SHOP SYSTEM*\n\n▸ *.shop* — Buka toko RPG\n   └ Weapon, Armor, Shield, Potion, Scroll\n   └ Harga tergantung karma & waktu\n   └ Siang: diskon 10%!\n\n▸ *.buy <item_id>* — Beli item\n   └ Contoh: *.buy pedang_besi*\n   └ Contoh: *.buy ramuan_hp*\n\n▸ *.sell <item_id>* — Jual item\n   └ Harga jual: 40% harga beli\n   └ Contoh: *.sell pedang_kayu*\n\n▸ *.inv* — Lihat inventory\n▸ *.use <item>* — Pakai potion/scroll\n\n\uD83D\uDCE6 *Kategori Item:*\n   └ \uD83D\uDDE1\uFE0F Senjata (per class)\n   └ \uD83E\uDD4B Armor (universal)\n   └ \uD83D\uDEE1\uFE0F Shield (universal)\n   └ \uD83E\uDDEA Potion (HP, ATK, DEF, dll)\n   └ \uD83D\uDCDC Scroll (buff sementara)' }
    // Abbreviated for formatting
};

const HELP_ALIASES = {
    rpg:'rpg', battle:'battle', hunt:'battle', duel:'pvp', arena:'battle', dungeon:'dungeon',
    shop:'shop', toko:'shop', buy:'shop', sell:'shop', beli:'shop', jual:'shop',
    equipment:'equipment', equip:'equipment', weapon:'equipment', armor:'equipment', enchant:'equipment', awaken:'equipment',
    guild:'guild', clan:'guild',
    skill:'skill', skilltree:'skill', st:'skill',
    isekai:'isekai', dark:'isekai', darkworld:'isekai', story:'isekai', invasion:'isekai', summon:'isekai', respawn:'isekai',
    survival:'survival', stamina:'survival', weather:'survival', cuaca:'survival', karma:'survival', repair:'survival', status:'survival',
    gacha:'gacha', pull:'gacha', koleksi:'gacha',
    pet:'pet', familiar:'pet',
    quest:'quest', achievement:'quest', ach:'quest', title:'quest',
    craft:'craft', crafting:'craft',
    base:'base', building:'base',
    pvp:'pvp', bounty:'pvp', wanted:'pvp',
    market:'market', marketplace:'market', trade:'market',
    food:'food', eat:'food', makan:'food', rest:'food', camp:'food'
};

/**
 * Builds the index list of all available help topics.
 */
function buildHelpListText() {
    let text = `${frameTitle('\u2753', 'HELP TOPICS')}\n${FRAME.v}\n`;
    text += `${FRAME.v} Ketik *.help <topik>* untuk detail\n${FRAME.v}\n`;
    
    const seen = new Set();
    for (const [key, topic] of Object.entries(HELP_TOPICS)) {
        if (seen.has(key)) continue; 
        seen.add(key);
        text += `${FRAME.branch} ${topic.icon} *.help ${key}*  ${topic.title}\n`;
    }
    
    text += `${FRAME.v}\n${FRAME.v} Contoh: *.help battle*\n`;
    text += `${FRAME.v} Menu: *.menu* | *.menurpg*\n`;
    text += `${FRAME.bl}${FRAME.h.repeat(19)}`;
    return text;
}

/**
 * Builds the specific help guide for a selected topic.
 */
function buildHelpTopicText(topic) {
    const key = HELP_ALIASES[topic.toLowerCase()] || topic.toLowerCase();
    const data = HELP_TOPICS[key];
    if (!data) return null;
    return `${frameTitle(data.icon, data.title.toUpperCase())}\n\n${data.text}\n\n_Ketik .help untuk semua topik_`;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
module.exports = {
    frameTitle, 
    normalizeMenuCategory, 
    getVisibleMenuOrder,
    buildMainMenuText, 
    buildSubMenuText, 
    buildUnknownMenuText,
    buildHelpListText, 
    buildHelpTopicText, 
    HELP_TOPICS, 
    HELP_ALIASES
};
