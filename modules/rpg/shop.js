// ============================================================
// modules/rpg/shop.js — Shop, Buy, Sell, Inv, Equip, Use
// ============================================================

const { getPlayer, updatePlayer } = require('../utility/db');
const { formatCoins, getSellPrice } = require('../utility/currency');
const { RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_ITEMS, RPG_CLASSES, RPG_CRAFT_ITEMS, FRAME } = require('../../config');
const { checkLevelUp } = require('./core');

async function handleShop(sock, sender, msg, participant, textMessage) {
    const sp = getPlayer(participant);
    if (!sp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const sc = (textMessage || '').trim().toLowerCase(), pc = sp.rpg.class, pcls = RPG_CLASSES[pc];
    if (!sc || sc === 'menu') {
        await sock.sendMessage(sender, { text: `╭━━━〔*🛒 SHOP*〕━━━\n┃\n┃ 🪙 ${formatCoins(sp.coins)} | ⭐ Lv${sp.rpg.level} ${pcls.emoji} ${pcls.name}\n┃\n┃ ⚔️ *.shop senjata* | 🥋 *.shop armor*\n┃ 🔰 *.shop tameng* | 🧪 *.shop potion*\n┃ 📜 *.shop scroll* | 🎁 *.shop special*\n┃ 🛠️ *.shop custom*  | \n┃\n╰ *.shop <kategori>*` }, { quoted: msg }); return;
    }
    const showItem = (it, id, price, extra) => `┃ ${it.emoji} *${it.name}* — ${formatCoins(price)}\n┃   📋 ${it.desc}${extra ? '\n┃   ' + extra : ''}\n┃\n`;
    let out = '';
    if (sc === 'senjata' || sc === 'weapon') {
        out = `╭━━━〔*⚔️ SENJATA ${pcls.name.toUpperCase()}*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        for (const [id, w] of Object.entries(RPG_WEAPONS)) { if (w.class === pc && w.price > 0) { const rl = w.tier * 3 - 2; const st = sp.rpg.inventory.includes(id) || sp.rpg.weapon === id ? '✅ Owned' : sp.rpg.level >= rl ? '🛒 Bisa beli' : `🔒 Lv${rl}`; out += `┃ ${w.emoji} *${w.name}*\n┃   ⚔️ ATK+${w.atk} | T${w.tier} | ${formatCoins(w.price)}\n┃   ${st}\n┃\n`; } }
        out += '╰ *.buy <nama>*';
    } else if (sc === 'armor' || sc === 'zirah') {
        out = `╭━━━〔*🥋 ARMOR*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        for (const [id, a] of Object.entries(RPG_ARMORS)) { if (!a.price) continue; const rl = a.tier * 2; const st = sp.rpg.armor === id || sp.rpg.inventory.includes(id) ? '✅' : sp.rpg.level >= rl ? '🛒' : `🔒Lv${rl}`; out += showItem(a, id, a.price, `🛡️ DEF+${a.def} | ❤️ HP+${a.hp} | ${st}`); }
        out += '╰ *.buy <nama>*';
    } else if (sc === 'tameng' || sc === 'shield') {
        out = `╭━━━〔*🔰 TAMENG*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        for (const [id, s] of Object.entries(RPG_SHIELDS)) { if (!s.price) continue; const rl = s.tier * 2; const st = sp.rpg.shield === id || sp.rpg.inventory.includes(id) ? '✅' : sp.rpg.level >= rl ? '🛒' : `🔒Lv${rl}`; out += showItem(s, id, s.price, `🛡️ DEF+${s.def} | 🔰 Block ${s.block}% | ${st}`); }
        out += '╰ *.buy <nama>*';
    } else if (sc === 'potion' || sc === 'ramuan') {
        out = `╭━━━〔*🧪 POTION*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        for (const [id, it] of Object.entries(RPG_ITEMS)) { if (it.category === 'potion') out += showItem(it, id, it.price); }
        out += '╰ *.buy <nama>*';
    } else if (sc === 'scroll' || sc === 'jimat') {
        out = `╭━━━〔*📜 SCROLL*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        for (const [id, it] of Object.entries(RPG_ITEMS)) { if (it.category === 'scroll') out += showItem(it, id, it.price); }
        out += '╰ *.buy <nama>*';
    } else if (sc === 'special' || sc === 'spesial') {
        out = `╭━━━〔*🎁 SPECIAL*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        for (const [id, it] of Object.entries(RPG_ITEMS)) { if (it.category === 'special') out += showItem(it, id, it.price); }
        out += '╰ *.buy <nama>*';
    } else if (sc === 'custom' || sc === 'creation') {
        const { loadCustomItems } = require('../utility/db');
        const customDb = loadCustomItems();
        out = `╭━━━〔*🛠️ CUSTOM SHOP*〕━━━\n┃ 🪙 ${formatCoins(sp.coins)}\n┃\n`;
        let found = false;
        for (const [id, w] of Object.entries(customDb.weapons || {})) { found = true; out += `┃ ${w.emoji} *${w.name}* (Weapon)\n┃   ⚔️ ATK+${w.atk} | ${formatCoins(w.price)}\n┃\n`; }
        for (const [id, a] of Object.entries(customDb.armors || {})) { found = true; out += `┃ ${a.emoji} *${a.name}* (Armor)\n┃   🛡️ DEF+${a.def} | ❤️ HP+${a.hp} | ${formatCoins(a.price)}\n┃\n`; }
        for (const [id, i] of Object.entries(customDb.items || {})) { found = true; out += `┃ ${i.emoji} *${i.name}* (Item)\n┃   📋 ${i.desc} | ${formatCoins(i.price)}\n┃\n`; }
        if (!found) out += `┃ ❌ Belum ada item custom.\n┃ 💡 Owner bisa buat dengan .createitem\n┃\n`;
        out += '╰ *.buy <nama>*';
    } else { out = '❌ Kategori tidak ditemukan!\n\n*.shop senjata/armor/tameng/potion/scroll/special/custom*'; }
    await sock.sendMessage(sender, { text: out }, { quoted: msg });
}

async function handleBuy(sock, sender, msg, participant, textMessage) {
    const bp = getPlayer(participant); if (!bp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const bi = textMessage?.toLowerCase()?.replace(/\s+/g, '_'); if (!bi) { await sock.sendMessage(sender, { text: '📌 *.buy <item>*\nCek *.shop*' }, { quoted: msg }); return; }
    const w = RPG_WEAPONS[bi], it = RPG_ITEMS[bi], ba = RPG_ARMORS[bi], bs = RPG_SHIELDS[bi];
    const checkLevel = (price, reqLvl) => { if (bp.coins < price) return `❌ Butuh ${formatCoins(price)}!`; if (bp.rpg.level < reqLvl) return `❌ Butuh Lv${reqLvl}!`; return null; };
    if (w) { if (w.class !== bp.rpg.class && w.class !== 'all') { await sock.sendMessage(sender, { text: '❌ Bukan untuk class kamu!' }, { quoted: msg }); return; } const err = checkLevel(w.price, w.tier * 3 - 2); if (err) { await sock.sendMessage(sender, { text: err }, { quoted: msg }); return; } bp.coins -= w.price; bp.rpg.inventory.push(bi); updatePlayer(participant, bp); await sock.sendMessage(sender, { text: `✅ Beli ${w.emoji} *${w.name}*!\n⚔️ ATK+${w.atk}\n🪙 Sisa: ${formatCoins(bp.coins)}\n\nKetik *.equip ${bi}*` }, { quoted: msg }); }
    else if (ba) { if (!ba.price) { await sock.sendMessage(sender, { text: '❌ Tidak dijual!' }, { quoted: msg }); return; } const err = checkLevel(ba.price, ba.tier * 2); if (err) { await sock.sendMessage(sender, { text: err }, { quoted: msg }); return; } bp.coins -= ba.price; bp.rpg.inventory.push(bi); updatePlayer(participant, bp); await sock.sendMessage(sender, { text: `✅ Beli ${ba.emoji} *${ba.name}*!\n🛡️ DEF+${ba.def} | ❤️ HP+${ba.hp}\n🪙 Sisa: ${formatCoins(bp.coins)}\n\nKetik *.equip ${bi}*` }, { quoted: msg }); }
    else if (bs) { if (!bs.price) { await sock.sendMessage(sender, { text: '❌ Tidak dijual!' }, { quoted: msg }); return; } const err = checkLevel(bs.price, bs.tier * 2); if (err) { await sock.sendMessage(sender, { text: err }, { quoted: msg }); return; } bp.coins -= bs.price; bp.rpg.inventory.push(bi); updatePlayer(participant, bp); await sock.sendMessage(sender, { text: `✅ Beli ${bs.emoji} *${bs.name}*!\n🛡️ DEF+${bs.def} | 🔰 Block ${bs.block}%\n🪙 Sisa: ${formatCoins(bp.coins)}\n\nKetik *.equip ${bi}*` }, { quoted: msg }); }
    else if (it) { if (bp.coins < it.price) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(it.price)}!` }, { quoted: msg }); return; } bp.coins -= it.price; bp.rpg.inventory.push(bi); updatePlayer(participant, bp); await sock.sendMessage(sender, { text: `✅ Beli ${it.emoji} *${it.name}*!\n📋 ${it.desc}\n🪙 Sisa: ${formatCoins(bp.coins)}` }, { quoted: msg }); }
    else { await sock.sendMessage(sender, { text: '❌ Item tidak ditemukan! Cek *.shop*' }, { quoted: msg }); }
}

async function handleInv(sock, sender, msg, participant, textMessage) {
    const ip = getPlayer(participant); if (!ip.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const inv = ip.rpg.inventory || []; if (!inv.length) { await sock.sendMessage(sender, { text: '🎒 Inventory kosong! Beli di *.shop*' }, { quoted: msg }); return; }
    const ct = {}; inv.forEach(i => ct[i] = (ct[i] || 0) + 1);
    const iw = RPG_WEAPONS[ip.rpg.weapon], ia = RPG_ARMORS[ip.rpg.armor], is = RPG_SHIELDS[ip.rpg.shield];
    let it = `╭━━━〔*🎒 INVENTORY*〕━━━\n┃\n┣━━ *⚙️ Equipped* ━━\n┃ 🗡️ ${iw?.emoji || ''} ${iw?.name || 'None'} (ATK+${iw?.atk || 0})\n┃ 🥋 ${ia?.emoji || ''} ${ia?.name || 'None'} (DEF+${ia?.def || 0})\n┃ 🔰 ${is?.emoji || ''} ${is?.name || 'None'} (Block ${is?.block || 0}%)\n┃\n`;
    const cats = { '⚔️ Senjata': [], '🥋 Armor': [], '🔰 Tameng': [], '🧪 Potion': [], '📜 Scroll': [], '🎁 Special': [], '📦 Other': [] };
    for (const [id, c] of Object.entries(ct)) {
        if (RPG_WEAPONS[id]) cats['⚔️ Senjata'].push({ id, c, item: RPG_WEAPONS[id] });
        else if (RPG_ARMORS[id]) cats['🥋 Armor'].push({ id, c, item: RPG_ARMORS[id] });
        else if (RPG_SHIELDS[id]) cats['🔰 Tameng'].push({ id, c, item: RPG_SHIELDS[id] });
        else if (RPG_ITEMS[id]?.category === 'potion') cats['🧪 Potion'].push({ id, c, item: RPG_ITEMS[id] });
        else if (RPG_ITEMS[id]?.category === 'scroll') cats['📜 Scroll'].push({ id, c, item: RPG_ITEMS[id] });
        else if (RPG_ITEMS[id]?.category === 'special') cats['🎁 Special'].push({ id, c, item: RPG_ITEMS[id] });
        else cats['📦 Other'].push({ id, c, item: RPG_ITEMS[id] || { emoji: '📦', name: id } });
    }
    for (const [cat, items] of Object.entries(cats)) { if (items.length) { it += `┣━━ *${cat}* ━━\n`; for (const w of items) it += `┃ ${w.item.emoji} ${w.item.name} x${w.c}\n`; it += '┃\n'; } }
    it += '╰━━━━━━━━━━━━━━━━━━━';
    await sock.sendMessage(sender, { text: it }, { quoted: msg });
}

async function handleEquip(sock, sender, msg, participant, textMessage) {
    const ep = getPlayer(participant); if (!ep.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const ei = textMessage?.toLowerCase()?.replace(/\s+/g, '_'); if (!ei) { await sock.sendMessage(sender, { text: '📌 *.equip <item_id>*\n*.equip pedang_besi* / *.equip zirah_besi*' }, { quoted: msg }); return; }
    if (!ep.rpg.inventory.includes(ei)) { await sock.sendMessage(sender, { text: '❌ Item tidak ada di inventory!' }, { quoted: msg }); return; }
    const ew = RPG_WEAPONS[ei], ea = RPG_ARMORS[ei], es = RPG_SHIELDS[ei];
    if (ew) { if (ew.class !== ep.rpg.class && ew.class !== 'all') { await sock.sendMessage(sender, { text: '❌ Bukan untuk class kamu!' }, { quoted: msg }); return; } ep.rpg.weapon = ei; updatePlayer(participant, ep); await sock.sendMessage(sender, { text: `✅ ${ew.emoji} *${ew.name}* equipped!\n⚔️ ATK+${ew.atk}` }, { quoted: msg }); }
    else if (ea) { ep.rpg.armor = ei; updatePlayer(participant, ep); await sock.sendMessage(sender, { text: `✅ ${ea.emoji} *${ea.name}* equipped!\n🛡️ DEF+${ea.def} | ❤️ HP+${ea.hp}` }, { quoted: msg }); }
    else if (es) { ep.rpg.shield = ei; updatePlayer(participant, ep); await sock.sendMessage(sender, { text: `✅ ${es.emoji} *${es.name}* equipped!\n🛡️ DEF+${es.def} | 🔰 Block ${es.block}%` }, { quoted: msg }); }
    else { await sock.sendMessage(sender, { text: '❌ Item ini tidak bisa di-equip! Gunakan *.use* untuk consumable.' }, { quoted: msg }); }
}

async function handleUse(sock, sender, msg, participant, textMessage) {
    const up = getPlayer(participant); if (!up.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const ui = textMessage?.toLowerCase()?.replace(/\s+/g, '_'); if (!ui) { await sock.sendMessage(sender, { text: '📌 *.use ramuan_hp*' }, { quoted: msg }); return; }
    const uit = RPG_ITEMS[ui]; if (!uit) { await sock.sendMessage(sender, { text: '❌ Item tidak ditemukan!' }, { quoted: msg }); return; }
    const idx = up.rpg.inventory.indexOf(ui); if (idx === -1) { await sock.sendMessage(sender, { text: '❌ Item tidak ada di inventory!' }, { quoted: msg }); return; }
    up.rpg.inventory.splice(idx, 1); let um = '';
    if (uit.type === 'heal') { up.rpg.hp = Math.min(up.rpg.maxHp, up.rpg.hp + uit.value); um = `❤️ Heal +${uit.value} HP! HP: ${up.rpg.hp}/${up.rpg.maxHp}`; }
    else if (uit.type === 'fullheal') { up.rpg.hp = up.rpg.maxHp; um = `💝 Full heal! HP: ${up.rpg.hp}/${up.rpg.maxHp}`; }
    else if (uit.type === 'maxheal') { up.rpg.maxHp += uit.value; up.rpg.hp = up.rpg.maxHp; um = `✨ Full heal + Max HP +${uit.value}! HP: ${up.rpg.hp}/${up.rpg.maxHp}`; }
    else if (uit.type === 'buff') { up.rpg.buffs = up.rpg.buffs || []; up.rpg.buffs.push({ name: uit.name, stat: uit.stat, value: uit.value, duration: uit.duration }); if (uit.debuff) up.rpg.buffs.push({ name: uit.name + ' (debuff)', stat: uit.debuff.stat, value: uit.debuff.value, duration: uit.duration }); um = `🔥 Buff ${uit.name} aktif! ${uit.stat.toUpperCase()} +${uit.value} (${uit.duration} battle)`; }
    else if (uit.type === 'revive') { um = `💎 Batu Kebangkitan disimpan! Auto-revive saat HP 0.`; up.rpg.inventory.push(ui); }
    else if (uit.type === 'exp') { up.rpg.exp += uit.value; updatePlayer(participant, up); const el = checkLevelUp(participant); um = `📗 +${uit.value} EXP! Total: ${up.rpg.exp}/${up.rpg.level * 100}`; if (el) um += `\n\n🎉 *LEVEL UP! Level ${el}!*`; }
    else if (uit.type === 'coin') { up.coins += uit.value; um = `🎫 +${formatCoins(uit.value)}! Total: ${formatCoins(up.coins)}`; }
    else if (uit.type === 'mysterybox') { const all = Object.keys(RPG_ITEMS).filter(k => RPG_ITEMS[k].type !== 'mysterybox'); const rid = all[Math.floor(Math.random() * all.length)]; const ri = RPG_ITEMS[rid]; up.rpg.inventory.push(rid); um = `📦 Kamu membuka Peti Misteri...\n🎁 Dapat: ${ri.emoji} *${ri.name}*!`; }
    else if (uit.type === 'teleport') { up.rpg.buffs.push({ name: 'Teleport', stat: 'teleport', value: 1, duration: 1 }); um = `🌀 Scroll Teleport aktif! Hunt berikutnya lawan monster level tinggi.`; }
    updatePlayer(participant, up);
    const { trackQuest } = require('./core'); trackQuest(participant, 'use_item');
    await sock.sendMessage(sender, { text: `✅ Menggunakan ${uit.emoji} *${uit.name}*\n\n${um}` }, { quoted: msg });
}

async function handleSell(sock, sender, msg, participant, textMessage) {
    const sp = getPlayer(participant); if (!sp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const sa = textMessage?.toLowerCase()?.replace(/\s+/g, '_'); if (!sa) { await sock.sendMessage(sender, { text: '📌 *.sell <item_id>* — Jual item (40% harga)\n*.sellchar <nama>* — Jual karakter gacha' }, { quoted: msg }); return; }
    const si = sp.rpg.inventory.indexOf(sa); if (si === -1) { await sock.sendMessage(sender, { text: '❌ Item tidak ada di inventory!\n💡 Cek *.inv*' }, { quoted: msg }); return; }
    if (sp.rpg.weapon === sa || sp.rpg.armor === sa || sp.rpg.shield === sa) { await sock.sendMessage(sender, { text: '❌ Tidak bisa jual item yang sedang dipakai!' }, { quoted: msg }); return; }
    const price = getSellPrice(sa); if (price <= 0) { await sock.sendMessage(sender, { text: '❌ Item ini tidak bisa dijual!' }, { quoted: msg }); return; }
    const soldItem = RPG_ITEMS[sa] || RPG_WEAPONS[sa] || RPG_ARMORS[sa] || RPG_SHIELDS[sa];
    sp.rpg.inventory.splice(si, 1); sp.coins += price; updatePlayer(participant, sp);
    await sock.sendMessage(sender, { text: `✅ Jual ${soldItem?.emoji || '📦'} *${soldItem?.name || sa}*\n\n💰 +${formatCoins(price)}\n🪙 Total: *${formatCoins(sp.coins)}*` }, { quoted: msg });
}

async function handleSellchar(sock, sender, msg, participant, textMessage) {
    const sc = getPlayer(participant); const cn = textMessage?.trim(); if (!cn) { await sock.sendMessage(sender, { text: '📌 *.sellchar <nama>*\nKetik *.koleksi* untuk lihat karakter' }, { quoted: msg }); return; }
    const ci = sc.koleksi.findIndex(k => k.name.toLowerCase() === cn.toLowerCase()); if (ci === -1) { await sock.sendMessage(sender, { text: `❌ Karakter *${cn}* tidak ditemukan!\n💡 Ketik *.koleksi* untuk lihat` }, { quoted: msg }); return; }
    const sold = sc.koleksi[ci]; const price = sold.sellPrice || GACHA_POOL[sold.rarity]?.sellPrice || 1;
    sc.koleksi.splice(ci, 1); sc.coins += price; updatePlayer(participant, sc);
    await sock.sendMessage(sender, { text: `✅ Jual ${sold.emoji} *${sold.name}*\n📺 ${sold.anime || '-'} | ${sold.label}\n\n💰 +${formatCoins(price)}\n🪙 Total: *${formatCoins(sc.coins)}*\n📦 Sisa: *${sc.koleksi.length}*` }, { quoted: msg });
}

module.exports = { handleShop, handleBuy, handleSell, handleSellchar, handleInv, handleEquip, handleUse };
