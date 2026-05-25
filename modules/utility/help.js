// ============================================================
// modules/utility/help.js — Help System & Menu Builder
// ============================================================

const { FRAME } = require('../../config');
const { MENU_CATEGORIES } = require('./menu-categories');
const { isOwner, isPrivileged } = require('./db');

function frameTitle(icon, title) {
    return `${FRAME.tl}${FRAME.h.repeat(3)}〔 *${icon} ${title}* 〕${FRAME.h.repeat(3)}`;
}

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

function getVisibleMenuOrder(participant) {
    const { MENU_ORDER } = require('../../config');
    return MENU_ORDER.filter(key => {
        if (key === 'owner') return isOwner(participant);
        if (key === 'admin') return isPrivileged(participant);
        return true;
    });
}

function buildMainMenuText(participant) {
    const { MENU_COMMANDS } = require('../../config');
    const robotIcon = String.fromCodePoint(0x1F916);
    const onlineIcon = String.fromCodePoint(0x1F7E2);
    let text = frameTitle(robotIcon, 'DHOELLS BOT') + '\n' + FRAME.v + '\n';
    text += FRAME.v + ' Name: *Dhoells Push & Music*\n';
    text += FRAME.v + ' Status: *Online* ' + onlineIcon + '\n' + FRAME.v + '\n';
    text += FRAME.branch + FRAME.h.repeat(2) + ' *📋 MENU UTAMA* ' + FRAME.h.repeat(2) + '\n';
    for (const key of getVisibleMenuOrder(participant)) {
        const item = MENU_CATEGORIES[key];
        text += FRAME.v + ' ' + item.icon + ' *' + MENU_COMMANDS[key] + '* — ' + item.title + '\n';
    }
    text += FRAME.v + '\n' + FRAME.v + ' 💡 Ketik *.menurpg* untuk menu RPG lengkap\n';
    text += FRAME.v + ' 💡 Ketik *.menugame* untuk gacha & mini games\n';
    text += FRAME.v + ' 💡 Baru? Ketik *.role warrior* untuk mulai!\n';
    text += FRAME.bl + FRAME.h.repeat(19);
    return text;
}

function buildSubMenuText(category, participant) {
    const item = MENU_CATEGORIES[category];
    if (!item) return buildUnknownMenuText(category, participant);
    let text = `${frameTitle(item.icon, item.title.toUpperCase())}\n${FRAME.v}\n`;
    text += `${FRAME.v} ${item.hint}\n${FRAME.v}\n`;
    if (item.sections) {
        for (const section of item.sections) {
            text += `${FRAME.branch}${FRAME.h.repeat(2)} *${section.header}* ${FRAME.h.repeat(2)}\n`;
            for (const [cmd, desc] of section.commands) {
                text += `${FRAME.v}  ≽ *${cmd}*\n${FRAME.v}     ${desc}\n`;
            }
            text += `${FRAME.v}\n`;
        }
    } else if (item.commands) {
        for (const [cmd, desc] of item.commands) {
            text += `${FRAME.branch} ≽ *${cmd}*\n${FRAME.v}   ${desc}\n${FRAME.v}\n`;
        }
    }
    text += `${FRAME.v} Menu utama: *.menu*\n`;
    text += `${FRAME.bl}${FRAME.h.repeat(19)}`;
    return text;
}

function buildUnknownMenuText(category, participant) {
    const pinIcon = String.fromCodePoint(0x1F4CC);
    const valid = getVisibleMenuOrder(participant).map(key => '.menu ' + key).join('\n');
    let text = frameTitle(pinIcon, 'MENU TIDAK DITEMUKAN') + '\n' + FRAME.v + '\n';
    text += FRAME.v + ' Kategori *' + (category || '-') + '* tidak dikenal.\n';
    text += FRAME.v + '\n' + FRAME.branch + FRAME.h.repeat(2) + ' *Kategori tersedia* ' + FRAME.h.repeat(2) + '\n';
    text += valid.split('\n').map(item => FRAME.v + ' > ' + item).join('\n') + '\n';
    text += FRAME.bl + FRAME.h.repeat(19);
    return text;
}

// ============================================================
// HELP TOPICS
// ============================================================
const HELP_TOPICS = {
    rpg: { icon: '🏰', title: 'RPG System', text: '🏰 *RPG SYSTEM*\n\nSistem RPG lengkap dengan class, battle, skill tree, dan 30+ fitur.\n\n📋 *Sub-topik:*\n▸ *.help battle* — Hunt, Duel, Raid, Arena\n▸ *.help dungeon* — Dungeon & Boss\n▸ *.help shop* — Toko, Buy, Sell\n▸ *.help equipment* — Weapon, Armor, Enchant\n▸ *.help guild* — Guild system\n▸ *.help skill* — Skill Tree & Class Skill\n▸ *.help isekai* — Dark World, Story, Invasion\n▸ *.help survival* — Stamina, Food, Repair\n▸ *.help gacha* — Gacha character\n▸ *.help pet* — Pet companion\n▸ *.help quest* — Quest & Achievement\n▸ *.help craft* — Crafting & Enchant\n▸ *.help base* — Base Building\n▸ *.help pvp* — PvP, Bounty, Karma\n▸ *.help market* — Marketplace\n\n_Ketik .help <topik> untuk detail!_' },
    battle: { icon: '⚔️', title: 'Battle System', text: '⚔️ *BATTLE SYSTEM*\n\n🎯 *Commands:*\n▸ *.hunt* — Solo hunt monster random\n   └ Dapat: EXP, Coin, Loot\n   └ Butuh: Stamina 10\n   └ Cooldown: 30 detik\n\n▸ *.duel @tag* — PvP 1v1 (grup only)\n   └ Bet: 5 Silver\n   └ Menang: +5 Silver, +karma\n   └ Kalah: -5 Silver, -karma\n\n▸ *.raid @tag* — Co-op 2 player\n   └ Tag teman untuk bantuin\n   └ Boss lebih kuat, reward lebih gede\n\n▸ *.arena* — Ranked PvP\n   └ ELO system (Bronze→Mythic)\n   └ *.arena rank* cek peringkat\n   └ Cooldown: 2 menit\n\n▸ *.skill* — Pakai skill class\n   └ Cooldown 3 turn battle\n\n💡 _Tips: Equip weapon + eat food sebelum battle!_' },
    dungeon: { icon: '🏚️', title: 'Dungeon System', text: '🏚️ *DUNGEON SYSTEM*\n\n📖 Floor 1→100, makin tinggi makin susah!\n\n▸ *.dungeon* / *.dg* — Masuk floor selanjutnya\n   └ Cooldown: 3 menit\n   └ Stamina: 15\n   └ Setiap 10 floor = BOSS!\n   └ Boss drop: enchant_stone, revive_stone\n\n▸ *.dungeoninfo* — Info floor saat ini\n   └ Nama monster, stats, reward\n\n📊 *Scaling:*\n   └ Floor 1-10: Mudah (Slime, Goblin)\n   └ Floor 11-30: Sedang\n   └ Floor 31-50: Sulit\n   └ Floor 51-100: Extreme (drop langka!)\n\n💡 _Boss setiap floor 10, 20, 30... drop item langka!_' },
    shop: { icon: '🛒', title: 'Shop System', text: '🛒 *SHOP SYSTEM*\n\n▸ *.shop* — Buka toko RPG\n   └ Weapon, Armor, Shield, Potion, Scroll\n   └ Harga tergantung karma & waktu\n   └ Siang: diskon 10%!\n\n▸ *.buy <item_id>* — Beli item\n   └ Contoh: *.buy pedang_besi*\n   └ Contoh: *.buy ramuan_hp*\n\n▸ *.sell <item_id>* — Jual item\n   └ Harga jual: 40% harga beli\n   └ Contoh: *.sell pedang_kayu*\n\n▸ *.inv* — Lihat inventory\n▸ *.use <item>* — Pakai potion/scroll\n\n📦 *Kategori Item:*\n   └ 🗡️ Senjata (per class)\n   └ 🥋 Armor (universal)\n   └ 🔰 Shield (universal)\n   └ 🧪 Potion (HP, ATK, DEF, dll)\n   └ 📜 Scroll (buff sementara)' },
    equipment: { icon: '🔨', title: 'Equipment System', text: '🔨 *EQUIPMENT SYSTEM*\n\n▸ *.equip <item_id>* — Pasang equipment\n   └ Weapon: sesuai class\n   └ Armor & Shield: universal\n\n▸ *.enchant* — Enchant senjata\n   └ Butuh: enchant_stone + coin\n   └ +1 sampai +7\n   └ +4 keatas bisa GAGAL! (item hilang 😈)\n\n▸ *.awaken* — Awaken weapon tier 5\n   └ Butuh: awakening_stone + coin\n   └ Unlock form legendary + bonus ATK\n\n▸ *.repair* — Perbaiki senjata\n   └ Durability turun setiap battle\n   └ 0 = weapon BREAK (hilang ATK bonus)\n   └ Biaya: 3 Silver per 100 durability\n\n🗡️ *Weapon Tiers:*\n   └ T1: Kayu (free) → T5: Legendary (150 Silver)' },
    guild: { icon: '🏠', title: 'Guild System', text: '🏠 *GUILD SYSTEM*\n\n▸ *.guild create <nama>* — Buat guild (50 Silver)\n▸ *.guild join <nama>* — Gabung guild\n▸ *.guild leave* — Keluar guild\n▸ *.guild members* — List member\n▸ *.guild donate <jml>* — Donasi ke bank\n▸ *.guild buff* — Aktifkan buff (50 Silver bank)\n   └ ATK+5, DEF+5 selama 1 jam\n\n📊 *Info:*\n   └ Max 20 member per guild\n   └ Leader keluar = guild bubar\n   └ Guild bank untuk upgrade & buff' },
    skill: { icon: '📖', title: 'Skill System', text: '📖 *SKILL SYSTEM*\n\n▸ *.skilltree* / *.st* — Lihat skill tree\n▸ *.skilltree <nama>* — Unlock skill\n\n🔮 *Skill Points:*\n   └ +1 SP setiap level up\n   └ Unlock passive bonus permanen\n\n📋 *3 Branch per Class:*\n   └ ⚔️ Attack — Damage & lifesteal\n   └ 🛡️ Defense — Block & HP\n   └ 🔧 Utility — Speed & regen\n\n▸ *.skill* — Pakai active skill\n   └ Warrior: Shield Bash (stun)\n   └ Archer: Rain of Arrows (2x hit)\n   └ Mage: Fireball (damage+burn)\n   └ Assassin: Shadow Strike (ignore DEF)' },
    isekai: { icon: '🌙', title: 'Isekai Dark System', text: '🌙 *ISEKAI DARK SYSTEM*\n\n▸ *.darkworld* / *.dw* — Masuk Dark World\n   └ Level 10+ only\n   └ Monster 2x kuat, reward 3x\n   └ Kalah = masuk Void Realm + curse!\n\n▸ *.story* / *.lore* — Story Quest (10 ch)\n   └ Linear quest dengan boss tiap chapter\n   └ Reward: EXP, Coin, Item, Title\n\n▸ *.respawn* — Keluar dari Void (20 Silver)\n   └ Random Void event (buff/curse/item)\n\n▸ *.invasion* — Demon King Event\n   └ 3 phase boss (semua player serang)\n   └ *.invattack* untuk attack\n   └ Reward dibagi semua peserta\n\n▸ *.summon* — Familiar companion\n   └ *.summon roll* (15 Silver)\n   └ Element: Fire/Water/Nature/Dark/Light\n   └ Bonus ATK + DEF di battle' },
    survival: { icon: '🍖', title: 'Survival & Realism', text: '🍖 *SURVIVAL & REALISM*\n\n▸ *.status* — Dashboard semua stats\n▸ *.eat <food>* — Makan (recover stamina)\n▸ *.rest* — Inn (5 Silver, full restore)\n▸ *.camp* — Kemah (gratis, 50% restore)\n▸ *.repair* — Perbaiki weapon\n▸ *.weather* — Cek cuaca & waktu\n▸ *.karma* — Cek reputasi\n\n🍖 *Stamina:*\n   └ Max: 100 | Auto-regen 5/jam\n   └ Hunt: -10 | Dungeon: -15 | Arena: -12\n   └ Stamina < 20 = ATK/DEF -20%!\n\n🗡️ *Durability:*\n   └ -5 per battle | 0 = weapon BREAK!\n\n☯️ *Karma:*\n   └ Kill player = -karma\n   └ Help NPC = +karma\n   └ High karma = discount shop\n   └ Low karma = NPC hostile!\n\n🌤️ *Weather (3 jam rotate):*\n   └ ☀️ Cerah, 🌧️ Hujan (+Water), ❄️ Salju\n   └ 🌩️ Badai (+ATK), 🌫️ Kabut (+Dodge)\n\n🕐 *Day/Night:*\n   └ Malam: Monster +30%, Drop +20%\n   └ Siang: Shop discount 10%' },
    gacha: { icon: '🎰', title: 'Gacha System', text: '🎰 *GACHA SYSTEM*\n\n▸ *.gacha* — Menu gacha & drop rate\n▸ *.gacha 1* — Single pull (5 Silver)\n▸ *.gacha 5* — Multi pull 5x (20 Silver, hemat!)\n▸ *.koleksi* — Lihat koleksi karakter\n▸ *.sellchar <nama>* — Jual karakter\n\n⭐ *7 Star System:*\n   └ ⭐ 1 Star (35%) — 0.1 Silver\n   └ ⭐⭐ 2 Star (25%) — 0.2 Silver\n   └ ⭐⭐⭐ 3 Star (18%) — 0.5 Silver\n   └ ⭐x4 (12%) — 0.8 Silver\n   └ ⭐x5 (6%) — 1.2 Silver\n   └ ⭐x6 (3.7%) — 2 Silver\n   └ ⭐x7 (0.3%) — 3 Silver\n\n🎌 *Anime Collection:*\n   └ Naruto, One Piece, Dragon Ball\n   └ Black Clover, JoJo, Bleach, dll' },
    pet: { icon: '🐾', title: 'Pet System', text: '🐾 *PET SYSTEM*\n\n▸ *.pet* — Lihat info pet\n▸ *.pet feed* — Kasih makan pet\n   └ +1 level pet\n   └ Stats naik sesuai type\n▸ *.pet rename <nama>* — Ganti nama pet\n\n🐺 *Available Pets:*\n   └ 🐺 Serigala (ATK) → Dire Wolf\n   └ 🐱 Kucing Sihir (Heal) → Sphinx\n   └ 🐲 Naga Kecil (ATK) → Elder Dragon\n   └ 🐢 Kura-kura (DEF) → Guardian\n   └ 🥚 Telur Phoenix (Heal) → Phoenix\n   └ 🟢 Slime Pet (All) → King Slime\n   └ 🦅 Elang (SPD) → Thunderbird\n   └ 🐻 Beruang (Tank) → War Bear\n\n📖 *Evolusi:*\n   └ Level 10 = evolve ke form baru!\n   └ Stats 2x setelah evolve' },
    quest: { icon: '🎯', title: 'Quest & Achievement', text: '🎯 *QUEST & ACHIEVEMENT*\n\n▸ *.quest* — Ambil/lihat quest harian\n   └ Jenis: Kill, Collect, Clear dungeon\n   └ Reward: EXP + Coin + Item\n   └ Reset tiap 24 jam\n\n▸ *.achievement* / *.ach* — Lihat achievements\n▸ *.title <id>* — Pasang title\n\n🏆 *Title System:*\n   └ Didapat dari achievement\n   └ Tampil di profil RPG\n   └ Contoh: Monster Hunter, Dungeon Master' },
    craft: { icon: '🔨', title: 'Crafting System', text: '🔨 *CRAFTING SYSTEM*\n\n▸ *.craft* — Lihat semua recipe\n▸ *.craft <recipe_id>* — Craft item\n\n📋 *Recipe Contoh:*\n   └ 3x ramuan_hp → 1x ramuan_hp_besar\n   └ 5x enchant_stone → 1x awakening_stone\n   └ Dan banyak lagi...\n\n▸ *.enchant* — Enchant senjata\n   └ Butuh enchant_stone + coin\n   └ +1 sampai +7 (makin tinggi makin susah)\n   └ Gagal = item hilang! 😈' },
    base: { icon: '🏰', title: 'Base Building', text: '🏰 *BASE BUILDING*\n\n▸ *.base* — Lihat base kamu\n▸ *.base upgrade <building>* — Upgrade\n\n🏗️ *Buildings:*\n   └ ⚔️ *Armory* (Lv1-3) — ATK bonus\n   └ 🏥 *Infirmary* (Lv1-3) — Regen bonus\n   └ 💰 *Treasury* (Lv1-3) — Passive income\n   └ 🧱 *Wall* (Lv1-3) — DEF bonus\n   └ 🗼 *Tower* (Lv1-3) — Mix bonus\n\n💰 *Cost per Level:*\n   └ Lv1: 30-50 Silver\n   └ Lv2: 80-120 Silver\n   └ Lv3: 200-300 Silver\n\n💡 _Upgrade base = permanent stat bonus!_' },
    pvp: { icon: '🩸', title: 'PvP & Bounty', text: '🩸 *PVP & BOUNTY*\n\n▸ *.duel @tag* — PvP 1v1 (5 Silver bet)\n▸ *.arena* — Ranked PvP (ELO)\n▸ *.bounty @target <jumlah>* — Pasang bounty\n   └ Min 5 Silver\n   └ Siapapun kill target dapat bounty!\n▸ *.wanted* — Lihat bounty board\n\n☯️ *Karma Effect:*\n   └ Kill player = -karma\n   └ Low karma = NPC hunter attack saat hunt!\n   └ High karma = shop discount + NPC friendly' },
    market: { icon: '🏪', title: 'Marketplace', text: '🏪 *MARKETPLACE*\n\n▸ *.market* — Lihat semua listing\n▸ *.market sell <item> <harga>* — Jual ke market\n▸ *.market buy <id>* — Beli dari market\n\n📊 *Info:*\n   └ Fee: 10% ke system\n   └ Player-to-player trading\n   └ Bisa jual weapon, potion, item apapun' },
    food: { icon: '🍖', title: 'Food & Stamina', text: '🍖 *FOOD & STAMINA*\n\n▸ *.eat* — Lihat menu makanan\n▸ *.eat <food>* — Makan dari inventory/beli\n\n🍽️ *Food List:*\n   └ 🍞 Roti (3 Silver) — +15 stamina\n   └ 🍖 Daging (8 Silver) — +30 stam, +10 HP\n   └ 🍲 Sup (6 Silver) — +20 stam, +20 HP\n   └ 🍎 Apel Emas (15 Silver) — +50 stam, +30 HP\n   └ 👑 Feast (30 Silver) — FULL restore\n   └ 🍙 Onigiri (2 Silver) — +12 stam, +5 HP\n   └ 🍜 Ramen (7 Silver) — +25 stam, +15 HP\n   └ 🍯 Madu (10 Silver) — +35 stamina' }
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

function buildHelpListText() {
    let text = `${frameTitle('❓', 'HELP TOPICS')}\n${FRAME.v}\n`;
    text += `${FRAME.v} Ketik *.help <topik>* untuk detail\n${FRAME.v}\n`;
    const seen = new Set();
    for (const [key, topic] of Object.entries(HELP_TOPICS)) {
        if (seen.has(key)) continue; seen.add(key);
        text += `${FRAME.branch} ${topic.icon} *.help ${key}*  ${topic.title}\n`;
    }
    text += `${FRAME.v}\n${FRAME.v} Contoh: *.help battle*\n`;
    text += `${FRAME.v} Menu: *.menu* | *.menurpg*\n`;
    text += `${FRAME.bl}${FRAME.h.repeat(19)}`;
    return text;
}

function buildHelpTopicText(topic) {
    const key = HELP_ALIASES[topic.toLowerCase()] || topic.toLowerCase();
    const data = HELP_TOPICS[key];
    if (!data) return null;
    return `${frameTitle(data.icon, data.title.toUpperCase())}\n\n${data.text}\n\n_Ketik .help untuk semua topik_`;
}

module.exports = {
    frameTitle, normalizeMenuCategory, getVisibleMenuOrder,
    buildMainMenuText, buildSubMenuText, buildUnknownMenuText,
    buildHelpListText, buildHelpTopicText, HELP_TOPICS, HELP_ALIASES
};
