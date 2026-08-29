// ============================================================
// modules/admin/handler.js — Admin & Owner Command Handlers
// Cheat, God Mode, Kasino Control, Group Management
// ============================================================

const { getPlayer, updatePlayer, getDisplayName, isOwner, isPrivileged, loadAdmins, saveAdmins, loadPlayerData, loadBannedUsers, banUser, unbanUser, normalizeJid, jidKey, sameJid } = require('../utility/db');
const { formatCoins, addCoins } = require('../utility/currency');
const { BOT_CONFIG, DELAY_PER_MESSAGE, RPG_ITEMS, RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_CLASSES } = require('../../config');
const { checkLevelUp, initRPG } = require('../rpg/core');
const { delay } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function resolveTarget(msg, textMessage, args) {
    // 1. Cek @tag di message (mentionedJid) — bisa di message langsung atau di extendedTextMessage
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
        || msg.message?.mentionedJid
        || [];
    if (mentioned.length > 0) return mentioned[0];

    // 2. Cek textMessage untuk mention format @xxxx (bisa LID atau nomor)
    if (textMessage) {
        // Format LID: @XXXXXXXXXXX (diikuti @lid di system)
        // Format nomor: @628xxxx
        const mentionMatch = textMessage.match(/@(\S+)/);
        if (mentionMatch) {
            const raw = mentionMatch[1];
            // Kalau sudah ada @, mungkin full JID
            if (raw.includes('@')) return raw;
            // Cek apakah pure digit
            const cleaned = raw.replace(/[^\d]/g, '');
            if (cleaned.length >= 8) {
                let num = cleaned;
                if (num.startsWith('0')) num = '62' + num.substring(1);
                if (!num.startsWith('62') && num.length <= 15) num = '62' + num;
                return num + '@s.whatsapp.net';
            }
        }
    }

    // 3. Cek args[0] untuk nomor HP (minimal 8 digit, maks 15)
    if (args && args.length > 0) {
        const firstArg = args[0].replace(/[\s\-\+\(\)]/g, '');
        if (/^\d{8,15}$/.test(firstArg)) {
            let num = firstArg;
            if (num.startsWith('0')) num = '62' + num.substring(1);
            if (!num.startsWith('62')) num = '62' + num;
            return num + '@s.whatsapp.net';
        }
        // Support full JID as argument
        if (firstArg.includes('@')) return firstArg;
    }

    return null;
}

// Helper: cek @tag di message, kalau nggak ada return participant (diri sendiri)
function getTargetFromMsg(msg, participant) {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
        || msg.message?.mentionedJid
        || [];
    return mentioned.length > 0 ? mentioned[0] : participant;
}

async function handleAdminCommand(sock, sender, msg, participant, textMessage, args, command) {
    // ==================== OWNER ONLY ====================
    if (['addadmin', 'tambahadmin'].includes(command)) {
        if (!isOwner(participant)) { await sock.sendMessage(sender, { text: '🚫 Hanya *Owner*.' }, { quoted: msg }); return; }
        const target = await resolveTarget(msg, textMessage, args);
        console.log(`[ADDADMIN] participant=${participant}, textMessage="${textMessage}", args=${JSON.stringify(args)}, target=${target}`);
        if (!target) { await sock.sendMessage(sender, { text: '📌 *.addadmin @tag* atau *.addadmin 628xxxx*' }, { quoted: msg }); return; }
        if (isOwner(target)) { await sock.sendMessage(sender, { text: '👑 Target itu Owner.' }, { quoted: msg }); return; }
        const admins = loadAdmins();
        if (admins.some(a => sameJid(a, target))) { await sock.sendMessage(sender, { text: `ℹ️ @${jidKey(target)} sudah Admin.`, mentions: [target] }, { quoted: msg }); return; }
        admins.push(target); saveAdmins(admins);
        await sock.sendMessage(sender, { text: `✅ Admin ditambahkan!\n\n@${jidKey(target)} sekarang bisa akses *.menuadmin*`, mentions: [target] }, { quoted: msg });
        return;
    }
    if (['deladmin', 'hapusadmin', 'removeadmin'].includes(command)) {
        if (!isOwner(participant)) { await sock.sendMessage(sender, { text: '🚫 Hanya *Owner*.' }, { quoted: msg }); return; }
        const target = await resolveTarget(msg, textMessage, args);
        if (!target) { await sock.sendMessage(sender, { text: '📌 *.deladmin @tag*' }, { quoted: msg }); return; }
        const admins = loadAdmins();
        const next = admins.filter(a => !sameJid(a, target));
        if (next.length === admins.length) { await sock.sendMessage(sender, { text: `ℹ️ @${jidKey(target)} tidak ada di daftar.`, mentions: [target] }, { quoted: msg }); return; }
        saveAdmins(next);
        await sock.sendMessage(sender, { text: `✅ Admin dihapus!\n\n@${jidKey(target)} sudah tidak punya akses.`, mentions: [target] }, { quoted: msg });
        return;
    }
    if (['listadmin', 'adminlist'].includes(command)) {
        if (!isOwner(participant)) { await sock.sendMessage(sender, { text: '🚫 Hanya *Owner*.' }, { quoted: msg }); return; }
        const saved = loadAdmins();
        const all = [...new Set([...(BOT_CONFIG.ADMIN_NUMBERS || []).map(normalizeJid).filter(Boolean), ...saved])];
        let lt = '👑 *ADMIN BOT LIST*\n\n';
        if (!all.length) lt += 'Belum ada Admin Bot tambahan.';
        else all.forEach((jid, i) => { lt += `${i + 1}. @${jidKey(jid)}\n`; });
        await sock.sendMessage(sender, { text: lt.trim(), mentions: all }, { quoted: msg });
        return;
    }

    // ==================== PRIVILEGED (Owner + Admin) ====================
    // Owner bypasses everything — this guard is for non-owner only
    if (!isPrivileged(participant)) { await sock.sendMessage(sender, { text: '⛔ Hanya *Owner/Admin Bot*.' }, { quoted: msg }); return; }

    // Guard: God Mode hanya untuk Owner
    const godModeCmds = ['addcoin', 'setcoin', 'debuff', 'mincoin', 'createitem', 'setlevel', 'setlvl', 'setexp', 'addexp', 'setstats', 'setstat', 'setkarma', 'maxstamina', 'maxstam', 'staminafull', 'maxdurability', 'maxdur', 'durfull', 'fullheal', 'heal', 'giveitem', 'giveweapon', 'givearmor', 'giveshield', 'resetplayer', 'allplayer', 'alldata'];
    if (godModeCmds.includes(command) && !isOwner(participant)) {
        await sock.sendMessage(sender, { text: '🚫 Hanya *Owner* yang bisa menggunakan fitur God Mode/Cheat.' }, { quoted: msg }); return;
    }

    // Guard: Kasino control hanya untuk Owner
    const kasinoControlCmds = ['setwin', 'menangterus', 'alwayswin', 'setlose', 'kalahterus', 'alwayslose', 'setnormal', 'normalmode', 'resetmode', 'checkmode', 'cekmode', 'modeplayer'];
    if (kasinoControlCmds.includes(command) && !isOwner(participant)) {
        await sock.sendMessage(sender, { text: '🚫 Hanya *Owner* yang bisa mengontrol mode kasino.' }, { quoted: msg }); return;
    }

    // ---- CHEAT COIN (support gold/silver/bronze) ----
    if (command === 'addcoin') {
        // Format: .addcoin <jumlah> <g/s/b> @tag
        // .addcoin 100 @tag (default bronze)
        // .addcoin 10 g @tag (gold)
        // .addcoin 500 b (tanpa @tag = ke diri sendiri)
        const amt = parseInt(args[0]);
        if (isNaN(amt) || amt === 0) {
            await sock.sendMessage(sender, { text: '📌 *.addcoin <jumlah> <g/s/b> @tag*\n\nContoh:\n▸ *.addcoin 100* (Bronze, diri sendiri)\n▸ *.addcoin 10 g @tag* (Gold)\n▸ *.addcoin 50 s @tag* (Silver)\n▸ *.addcoin 500 b @tag* (Bronze)' }, { quoted: msg });
            return;
        }
        const unit = (args[1] || 'b').toLowerCase();
        let multiplier = 1;
        let unitLabel = 'Bronze';
        if (unit === 'g' || unit === 'gold') { multiplier = 5000; unitLabel = 'Gold'; }
        else if (unit === 's' || unit === 'silver') { multiplier = 50; unitLabel = 'Silver'; }
        else { multiplier = 1; unitLabel = 'Bronze'; }

        // Cari target: cek apakah ada @tag di message, kalau nggak pakai participant
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentioned.length > 0 ? mentioned[0] : participant;
        const tp = getPlayer(target);
        const totalAmt = amt * multiplier;
        tp.coins = Math.max(0, tp.coins + totalAmt);
        updatePlayer(target, tp);
        const targetName = target === participant ? 'diri sendiri' : getDisplayName(target);
        await sock.sendMessage(sender, {
            text: `👑 *GOD MODE — ADD COIN*\n\n💰 *${amt} ${unitLabel}* (${formatCoins(totalAmt)}) diberikan ke *${targetName}*\n⚖️ Saldo: *${formatCoins(tp.coins)}*`
        }, { quoted: msg });
        return;
    }

    if (['setcoin', 'debuff', 'mincoin'].includes(command)) {
        const amt = parseInt(args[0]);
        if (isNaN(amt) || amt < 0) {
            await sock.sendMessage(sender, { text: '📌 *.setcoin <jumlah> <g/s/b> @tag*\nContoh: *.setcoin 0 @tag* (Bikin miskin)' }, { quoted: msg });
            return;
        }
        const unit = (args[1] || 'b').toLowerCase();
        let multiplier = 1;
        let unitLabel = 'Bronze';
        if (unit === 'g' || unit === 'gold') { multiplier = 5000; unitLabel = 'Gold'; }
        else if (unit === 's' || unit === 'silver') { multiplier = 50; unitLabel = 'Silver'; }
        
        const target = await resolveTarget(msg, textMessage, args);
        if (!target) { await sock.sendMessage(sender, { text: '📌 Tag atau sebutkan nomor targetnya!' }, { quoted: msg }); return; }
        const tp = getPlayer(target);
        const totalAmt = amt * multiplier;
        tp.coins = totalAmt;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, {
            text: `👑 *GOD MODE — DEBUFF COIN*\n\n📉 Coin *${getDisplayName(target)}* di-set ke *${amt} ${unitLabel}* (${formatCoins(totalAmt)})!`
        }, { quoted: msg });
        return;
    }

    // ---- CREATE CUSTOM ITEM ----
    if (command === 'createitem') {
        const fullArgs = textMessage.slice(command.length + 1).split('|').map(s => s.trim());
        if (fullArgs.length < 5) {
            await sock.sendMessage(sender, { text: '📌 Format salah!\n\nGunakan: *.createitem <id> | <weapon/armor/item> | <nama item> | <atk/def/value> | <harga> | [emoji]*\n\nContoh:\n*.createitem pedang_dewa | weapon | Pedang Dewa | 500 | 250000 | 🗡️*' }, { quoted: msg });
            return;
        }
        const [id, type, name, statValStr, priceStr, emoji = '✨'] = fullArgs;
        const statVal = parseInt(statValStr) || 0;
        const price = parseInt(priceStr) || 0;
        
        const { loadCustomItems, saveCustomItems } = require('../utility/db');
        const customDb = loadCustomItems();
        let itemData = {};

        if (type.toLowerCase() === 'weapon') {
            itemData = { name, atk: statVal, class: 'all', tier: 10, price, emoji, pin: 'custom weapon fantasy' };
            customDb.weapons = customDb.weapons || {};
            customDb.weapons[id] = itemData;
        } else if (type.toLowerCase() === 'armor') {
            itemData = { name, def: statVal, hp: statVal * 2, tier: 10, price, emoji, pin: 'custom armor fantasy' };
            customDb.armors = customDb.armors || {};
            customDb.armors[id] = itemData;
        } else {
            // default to item consumable (heal)
            itemData = { name, emoji, price, desc: `Custom Item +${statVal}`, type: 'heal', value: statVal, category: 'special' };
            customDb.items = customDb.items || {};
            customDb.items[id] = itemData;
        }

        saveCustomItems(customDb);
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — CREATE ITEM*\n\n✅ Item *${name}* (${emoji}) berhasil diciptakan dan disimpan permanen di database!\nID: \`${id}\`\nStat: ${statVal}\nHarga: ${formatCoins(price)}\n\n💡 _Item sudah langsung masuk ke sistem Shop._` }, { quoted: msg });
        return;
    }

    // ---- CHEAT LEVEL ----
    if (['setlevel', 'setlvl'].includes(command)) {
        const lvl = parseInt(args[0]);
        if (isNaN(lvl) || lvl < 1 || lvl > 999) { await sock.sendMessage(sender, { text: '📌 *.setlevel <1-999> @tag*' }, { quoted: msg }); return; }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        const oldLvl = tp.rpg.level;
        const cls = RPG_CLASSES[tp.rpg.class];
        // Recalculate stats from base class + level scaling
        const levelBonus = lvl - 1; // bonus dari naik level
        tp.rpg.level = lvl;
        tp.rpg.exp = 0;
        tp.rpg.maxHp = cls.hp + (levelBonus * 10);
        tp.rpg.hp = tp.rpg.maxHp;
        tp.rpg.atk = cls.atk + (levelBonus * 3);
        tp.rpg.def = cls.def + (levelBonus * 2);
        tp.rpg.spd = cls.spd + levelBonus;
        tp.rpg.stamina = 100;
        tp.rpg.durability = 100;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, {
            text: `👑 *GOD MODE — SET LEVEL*\n\n⭐ *${getDisplayName(target)}*: Lv${oldLvl} → *Lv${lvl}*\n❤️ HP: ${tp.rpg.hp}/${tp.rpg.maxHp}\n⚔️ ATK: ${tp.rpg.atk} | 🛡️ DEF: ${tp.rpg.def}\n💨 SPD: ${tp.rpg.spd} | 🍖 Stamina: 100`
        }, { quoted: msg });
        return;
    }

    // ---- CHEAT EXP ----
    if (['setexp', 'addexp'].includes(command)) {
        const exp = parseInt(args[0]);
        if (isNaN(exp) || exp <= 0) { await sock.sendMessage(sender, { text: '📌 *.setexp <jumlah> @tag*' }, { quoted: msg }); return; }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.exp += exp;
        const leveled = checkLevelUp(target);
        updatePlayer(target, tp);
        let text = `👑 *GOD MODE — ADD EXP*\n\n📗 +${exp} EXP ke *${getDisplayName(target)}*\n⭐ Level: ${tp.rpg.level}\n📊 EXP: ${tp.rpg.exp}`;
        if (leveled) text += `\n\n🎉 *LEVEL UP! Sekarang Lv${leveled}!*`;
        await sock.sendMessage(sender, { text }, { quoted: msg });
        return;
    }

    // ---- CHEAT STATS (ATK/DEF/SPD) ----
    if (['setstats', 'setstat'].includes(command)) {
        // .setstats <stat> <nilai> @tag
        // stat: atk, def, spd, hp, maxhp, crit, block, dodge
        const stat = (args[0] || '').toLowerCase();
        const val = parseInt(args[1]);
        const validStats = ['atk', 'def', 'spd', 'hp', 'maxhp', 'crit', 'block', 'dodge'];
        if (!validStats.includes(stat) || isNaN(val)) {
            await sock.sendMessage(sender, { text: `📌 *.setstats <stat> <nilai> @tag*\n\nStat: ${validStats.join(', ')}\nContoh: *.setstats atk 999 @tag*` }, { quoted: msg });
            return;
        }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        if (stat === 'hp') tp.rpg.hp = Math.min(val, tp.rpg.maxHp);
        else if (stat === 'maxhp') { tp.rpg.maxHp = val; tp.rpg.hp = val; }
        else tp.rpg[stat] = val;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — SET STAT*\n\n⚙️ *${stat.toUpperCase()}* ${getDisplayName(target)} diset ke *${val}*\n\n⚔️ ATK: ${tp.rpg.atk} | 🛡️ DEF: ${tp.rpg.def}\n💨 SPD: ${tp.rpg.spd} | ❤️ HP: ${tp.rpg.hp}/${tp.rpg.maxHp}` }, { quoted: msg });
        return;
    }

    // ---- CHEAT KARMA ----
    if (['setkarma'].includes(command)) {
        const val = parseInt(args[0]);
        if (isNaN(val)) { await sock.sendMessage(sender, { text: '📌 *.setkarma <nilai> @tag*\nContoh: *.setkarma 100 @tag* (Pahlawan)\n*.setkarma -50 @tag* (Penjahat)' }, { quoted: msg }); return; }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.karma = val;
        updatePlayer(target, tp);
        let karmaLabel = 'Netral';
        if (val >= 100) karmaLabel = 'Suci ✨';
        else if (val >= 50) karmaLabel = 'Pahlawan 🦸';
        else if (val >= 20) karmaLabel = 'Baik Hati 😇';
        else if (val <= -100) karmaLabel = 'Iblis 😈';
        else if (val <= -30) karmaLabel = 'Penjahat 💀';
        else if (val <= -10) karmaLabel = 'Tersangka ⚠️';
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — SET KARMA*\n\n☯️ Karma *${getDisplayName(target)}* diset ke *${val}*\n${karmaLabel}` }, { quoted: msg });
        return;
    }

    // ---- MAX STAMINA & DURABILITY ----
    if (['maxstamina', 'maxstam', 'staminafull'].includes(command)) {
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.stamina = 100;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — MAX STAMINA*\n\n🍖 Stamina *${getDisplayName(target)}* diisi penuh!\n📊 ${tp.rpg.stamina}/100` }, { quoted: msg });
        return;
    }
    if (['maxdurability', 'maxdur', 'durfull'].includes(command)) {
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.durability = 100;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — MAX DURABILITY*\n\n🗡️ Durability *${getDisplayName(target)}* diisi penuh!\n📊 ${tp.rpg.durability}/100` }, { quoted: msg });
        return;
    }

    // ---- FULL HEAL ----
    if (['fullheal', 'heal'].includes(command)) {
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.hp = tp.rpg.maxHp; tp.rpg.stamina = 100; tp.rpg.durability = 100; tp.rpg.buffs = []; tp.rpg.skillCooldown = 0; tp.rpg.isDead = false;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — FULL HEAL*\n\n❤️ *${getDisplayName(target)}* full restore!\nHP: ${tp.rpg.hp}/${tp.rpg.maxHp}\n🍖 Stamina: 100/100\n🗡️ Durability: 100/100\n🌀 Skill cooldown reset!\n✅ Status: Alive` }, { quoted: msg });
        return;
    }

    // ---- GIVE ITEM ----
    if (command === 'giveitem') {
        const itemId = args[0]?.toLowerCase()?.replace(/\s+/g, '_');
        if (!itemId || (!RPG_ITEMS[itemId] && !RPG_WEAPONS[itemId] && !RPG_ARMORS[itemId] && !RPG_SHIELDS[itemId])) {
            let il = '📌 Item tersedia (ketik *.giveitem <id> @tag*):\n\n🧪 *Potion*: '; for (const [id, it] of Object.entries(RPG_ITEMS)) { if (it.category === 'potion') il += `\n▸ *${id}* - ${it.emoji} ${it.name} (${formatCoins(it.price)})`; }
            il += '\n\n📜 *Scroll*: '; for (const [id, it] of Object.entries(RPG_ITEMS)) { if (it.category === 'scroll') il += `\n▸ *${id}* - ${it.emoji} ${it.name} (${formatCoins(it.price)})`; }
            il += '\n\n🎁 *Special*: '; for (const [id, it] of Object.entries(RPG_ITEMS)) { if (it.category === 'special') il += `\n▸ *${id}* - ${it.emoji} ${it.name} (${formatCoins(it.price)})`; }
            il += '\n\n⚔️ *Weapon*: '; for (const [id, w] of Object.entries(RPG_WEAPONS)) { if (w.price > 0) il += `\n▸ *${id}* - ${w.emoji} ${w.name} (ATK+${w.atk})`; }
            il += '\n\n🥋 *Armor*: '; for (const [id, a] of Object.entries(RPG_ARMORS)) { if (a.price > 0) il += `\n▸ *${id}* - ${a.emoji} ${a.name} (DEF+${a.def})`; }
            il += '\n\n🔰 *Shield*: '; for (const [id, s] of Object.entries(RPG_SHIELDS)) { if (s.price > 0) il += `\n▸ *${id}* - ${s.emoji} ${s.name} (Block ${s.block}%)`; }
            await sock.sendMessage(sender, { text: il }, { quoted: msg }); return;
        }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        const count = parseInt(args[1]) || 1;
        for (let i = 0; i < count; i++) tp.rpg.inventory.push(itemId);
        updatePlayer(target, tp);
        const item = RPG_ITEMS[itemId] || RPG_WEAPONS[itemId] || RPG_ARMORS[itemId] || RPG_SHIELDS[itemId];
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — GIVE ITEM*\n\n🎁 Memberi ${item.emoji} *${item.name}* x${count} ke *${getDisplayName(target)}*\n📦 Inventory: ${tp.rpg.inventory.length} items` }, { quoted: msg });
        return;
    }

    // ---- GIVE WEAPON (shortcut) ----
    if (command === 'giveweapon') {
        const wId = args[0]?.toLowerCase()?.replace(/\s+/g, '_');
        if (!wId || !RPG_WEAPONS[wId]) { let wl = '📌 Weapon tersedia:\n'; for (const [id, w] of Object.entries(RPG_WEAPONS)) wl += `▸ *${id}* - ${w.emoji} ${w.name} (ATK+${w.atk}, ${formatCoins(w.price)})\n`; wl += '\nFormat: *.giveweapon <weapon_id> @tag*'; await sock.sendMessage(sender, { text: wl }, { quoted: msg }); return; }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.inventory.push(wId); updatePlayer(target, tp);
        const gw = RPG_WEAPONS[wId];
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — GIVE WEAPON*\n\n🗡️ Memberi ${gw.emoji} *${gw.name}* ke *${getDisplayName(target)}*\n⚔️ ATK+${gw.atk} | T${gw.tier}\n\nKetik *.equip ${wId}* untuk memasang` }, { quoted: msg });
        return;
    }

    // ---- GIVE ARMOR (shortcut) ----
    if (command === 'givearmor') {
        const aId = args[0]?.toLowerCase()?.replace(/\s+/g, '_');
        if (!aId || !RPG_ARMORS[aId]) { let al = '📌 Armor tersedia:\n'; for (const [id, a] of Object.entries(RPG_ARMORS)) if (a.price > 0) al += `▸ *${id}* - ${a.emoji} ${a.name} (DEF+${a.def}, ${formatCoins(a.price)})\n`; al += '\nFormat: *.givearmor <armor_id> @tag*'; await sock.sendMessage(sender, { text: al }, { quoted: msg }); return; }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.inventory.push(aId); updatePlayer(target, tp);
        const ga = RPG_ARMORS[aId];
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — GIVE ARMOR*\n\n🥋 Memberi ${ga.emoji} *${ga.name}* ke *${getDisplayName(target)}*\n🛡️ DEF+${ga.def} | ❤️ HP+${ga.hp}\n\nKetik *.equip ${aId}* untuk memasang` }, { quoted: msg });
        return;
    }

    // ---- GIVE SHIELD (shortcut) ----
    if (command === 'giveshield') {
        const sId = args[0]?.toLowerCase()?.replace(/\s+/g, '_');
        if (!sId || !RPG_SHIELDS[sId]) { let sl = '📌 Shield tersedia:\n'; for (const [id, s] of Object.entries(RPG_SHIELDS)) if (s.price > 0) sl += `▸ *${id}* - ${s.emoji} ${s.name} (DEF+${s.def}, Block ${s.block}%, ${formatCoins(s.price)})\n`; sl += '\nFormat: *.giveshield <shield_id> @tag*'; await sock.sendMessage(sender, { text: sl }, { quoted: msg }); return; }
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Player belum punya class!' }, { quoted: msg }); return; }
        tp.rpg.inventory.push(sId); updatePlayer(target, tp);
        const gs = RPG_SHIELDS[sId];
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — GIVE SHIELD*\n\n🔰 Memberi ${gs.emoji} *${gs.name}* ke *${getDisplayName(target)}*\n🛡️ DEF+${gs.def} | 🔰 Block ${gs.block}%\n\nKetik *.equip ${sId}* untuk memasang` }, { quoted: msg });
        return;
    }

    // ---- RESET PLAYER ----
    if (command === 'resetplayer') {
        const target = await resolveTarget(msg, textMessage, args);
        if (!target) { await sock.sendMessage(sender, { text: '📌 *.resetplayer @tag*' }, { quoted: msg }); return; }
        const tp = getPlayer(target);
        tp.rpg = null; tp.coins = 50; tp.koleksi = []; tp.rpsStats = null; tp.kasinoStats = null;
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *GOD MODE — RESET PLAYER*\n\n🔄 Data *${getDisplayName(target)}* direset!\n💰 Coin: 50 Bronze (starter)\n📦 Koleksi: dikosongkan\n📊 Stats: dikosongkan\n\nKetik *.role* untuk mulai ulang.` }, { quoted: msg });
        return;
    }

    // ---- ALL PLAYER DATA ----
    if (['allplayer', 'alldata'].includes(command)) {
        const ad = loadPlayerData(); const entries = Object.entries(ad);
        if (!entries.length) { await sock.sendMessage(sender, { text: '📭 Belum ada data player.' }, { quoted: msg }); return; }
        let at = `👑 *ALL PLAYER DATA* (${entries.length} players)\n\n`;
        for (const [id, info] of entries) {
            const name = info.displayName || id.split('@')[0];
            const rpgInfo = info.rpg ? `Lv${info.rpg.level} ${info.rpg.class} | HP:${info.rpg.hp}/${info.rpg.maxHp}` : 'No RPG';
            at += `▸ *${name}*\n  🪙 ${formatCoins(info.coins)} | ${rpgInfo} | 📦 ${info.koleksi?.length || 0}\n\n`;
        }
        await sock.sendMessage(sender, { text: at.trim() }, { quoted: msg });
        return;
    }

    // ==================== FITUR DEWA — KASINO CONTROL ====================
    // (Owner-only guard sudah di atas, kasinoControlCmds check)
    if (['setwin', 'menangterus', 'alwayswin'].includes(command)) {
        // Set player selalu menang di kasino
        const target = await resolveTarget(msg, textMessage, args);
        if (!target) { await sock.sendMessage(sender, { text: '📌 *.setwin @tag*' }, { quoted: msg }); return; }
        const tp = getPlayer(target);
        if (!tp.kasinoStats) tp.kasinoStats = {};
        tp.kasinoStats.mode = 'always_win';
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *FITUR DEWA — SET WIN*\n\n🏆 *${getDisplayName(target)}* sekarang SELALU MENANG di kasino!\n\n🎰 Slot: selalu jackpot\n🪙 Coinflip: selalu menang\n🎲 Dice: selalu kalah\n🔢 Tebak: selalu benar\n\nKetik *.setnormal @tag* untuk reset.` }, { quoted: msg });
        return;
    } else if (['setlose', 'kalahterus', 'alwayslose'].includes(command)) {
        const target = await resolveTarget(msg, textMessage, args);
        if (!target) { await sock.sendMessage(sender, { text: '📌 *.setlose @tag*' }, { quoted: msg }); return; }
        const tp = getPlayer(target);
        if (!tp.kasinoStats) tp.kasinoStats = {};
        tp.kasinoStats.mode = 'always_lose';
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *FITUR DEWA — SET LOSE*\n\n💀 *${getDisplayName(target)}* sekarang SELALAH KALAH di kasino!\n\n🎰 Slot: selalu lose\n🪙 Coinflip: selalu kalah\n🎲 Dice: selalu salah\n🔢 Tebak: selalu salah\n\nKetik *.setnormal @tag* untuk reset.` }, { quoted: msg });
        return;
    } else if (['setnormal', 'normalmode', 'resetmode'].includes(command)) {
        const target = await resolveTarget(msg, textMessage, args);
        if (!target) { await sock.sendMessage(sender, { text: '📌 *.setnormal @tag*' }, { quoted: msg }); return; }
        const tp = getPlayer(target);
        if (!tp.kasinoStats) tp.kasinoStats = {};
        tp.kasinoStats.mode = 'normal';
        updatePlayer(target, tp);
        await sock.sendMessage(sender, { text: `👑 *FITUR DEWA — SET NORMAL*\n\n⚖️ *${getDisplayName(target)}* kembali NORMAL.\nKasino berjalan fair seperti biasa.` }, { quoted: msg });
        return;
    } else if (['checkmode', 'cekmode', 'modeplayer'].includes(command)) {
        const target = getTargetFromMsg(msg, participant);
        const tp = getPlayer(target);
        const mode = tp.kasinoStats?.mode || 'normal';
        const modeText = mode === 'always_win' ? '🏆 SELALU MENANG' : mode === 'always_lose' ? '💀 SELALU KALAH' : '⚖️ NORMAL (fair)';
        await sock.sendMessage(sender, { text: `👑 *FITUR DEWA — CHECK MODE*\n\n👤 *${getDisplayName(target)}*\n🎰 Mode Kasino: *${modeText}*` }, { quoted: msg });
        return;
    }

    // ==================== GROUP COMMANDS ====================
    if (['kick', 'tendang'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        const km = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!km.length) { await sock.sendMessage(sender, { text: '📌 *.kick @tag*' }, { quoted: msg }); return; }
        if (!isOwner(participant) && km.some(jid => isOwner(jid))) { await sock.sendMessage(sender, { text: '⛔ Admin tidak bisa kick Owner.' }, { quoted: msg }); return; }
        try { await sock.groupParticipantsUpdate(sender, km, 'remove'); await sock.sendMessage(sender, { text: `👑 *Kicked!*\n\n${km.map(j => `▸ @${j.split('@')[0]}`).join('\n')}`, mentions: km }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal kick: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['mute', 'mutegrup'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        try { await sock.groupSettingUpdate(sender, 'announcement'); await sock.sendMessage(sender, { text: '👑 *Grup dimute!*\n🔇 Hanya admin yang bisa kirim pesan.' }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal mute: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['unmute', 'unmutegrup'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        try { await sock.groupSettingUpdate(sender, 'not_announcement'); await sock.sendMessage(sender, { text: '👑 *Grup di-unmute!*\n🔊 Semua member bisa kirim pesan.' }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal unmute: ${e.message}` }, { quoted: msg }); }
        return;
    }

    // ==================== BAN/UNBAN (Owner + Admin) ====================
    if (command === 'ban') {
        const bm = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!bm.length) { await sock.sendMessage(sender, { text: '📌 *.ban @tag*' }, { quoted: msg }); return; }
        if (bm.some(jid => isOwner(jid))) { await sock.sendMessage(sender, { text: '⛔ Tidak bisa ban Owner.' }, { quoted: msg }); return; }
        if (!isOwner(participant) && bm.some(jid => isPrivileged(jid))) { await sock.sendMessage(sender, { text: '⛔ Admin tidak bisa ban Admin lain.' }, { quoted: msg }); return; }
        for (const jid of bm) banUser(jid);
        await sock.sendMessage(sender, { text: `👑 *BANNED!*\n\n${bm.map(j => `🚫 @${j.split('@')[0]}`).join('\n')}`, mentions: bm }, { quoted: msg });
        return;
    }
    if (command === 'unban') {
        const ubm = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!ubm.length) { await sock.sendMessage(sender, { text: '📌 *.unban @tag*' }, { quoted: msg }); return; }
        for (const jid of ubm) unbanUser(jid);
        await sock.sendMessage(sender, { text: `👑 *UNBANNED!*\n\n${ubm.map(j => `✅ @${j.split('@')[0]}`).join('\n')}`, mentions: ubm }, { quoted: msg });
        return;
    }
    if (command === 'banlist') {
        const banned = loadBannedUsers();
        if (!banned.length) { await sock.sendMessage(sender, { text: '✅ Tidak ada user yang diban.' }, { quoted: msg }); return; }
        let bl = `👑 *BAN LIST* (${banned.length})\n\n`;
        banned.forEach((jid, i) => { bl += `${i + 1}. @${jid.split('@')[0]}\n`; });
        await sock.sendMessage(sender, { text: bl, mentions: banned }, { quoted: msg });
        return;
    }

    // ==================== OWNER ONLY GROUP ====================
    if (!isOwner(participant)) { await sock.sendMessage(sender, { text: '🚫 Hanya *OWNER*.' }, { quoted: msg }); return; }
    if (command === 'promote') {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        const pm = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!pm.length) { await sock.sendMessage(sender, { text: '📌 *.promote @tag*' }, { quoted: msg }); return; }
        try { await sock.groupParticipantsUpdate(sender, pm, 'promote'); await sock.sendMessage(sender, { text: `👑 *Promoted!*\n\n${pm.map(j => `▸ @${j.split('@')[0]} ➜ Admin`).join('\n')}`, mentions: pm }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (command === 'demote') {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        const dm2 = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!dm2.length) { await sock.sendMessage(sender, { text: '📌 *.demote @tag*' }, { quoted: msg }); return; }
        try { await sock.groupParticipantsUpdate(sender, dm2, 'demote'); await sock.sendMessage(sender, { text: `👑 *Demoted!*\n\n${dm2.map(j => `▸ @${j.split('@')[0]} ➜ Member`).join('\n')}`, mentions: dm2 }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['setgroupname', 'setnamagrup'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        if (!textMessage) { await sock.sendMessage(sender, { text: '📌 *.setgroupname <nama baru>*' }, { quoted: msg }); return; }
        try { await sock.groupUpdateSubject(sender, textMessage); await sock.sendMessage(sender, { text: `👑 Nama grup diubah ke: *${textMessage}*` }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['setgroupdesc', 'setdescgrup'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        if (!textMessage) { await sock.sendMessage(sender, { text: '📌 *.setgroupdesc <deskripsi>*' }, { quoted: msg }); return; }
        try { await sock.groupUpdateDescription(sender, textMessage); await sock.sendMessage(sender, { text: '👑 Deskripsi grup diubah!' }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }

    if (['broadcast', 'bc'].includes(command)) {
        if (!textMessage) { await sock.sendMessage(sender, { text: '📌 *.broadcast <pesan>*' }, { quoted: msg }); return; }
        await sock.sendMessage(sender, { text: '📡 _Memulai broadcast..._' }, { quoted: msg });
        try {
            const groups = await sock.groupFetchAllParticipating();
            const gids = Object.keys(groups); let s = 0, f = 0;
            for (const gid of gids) { try { await sock.sendMessage(gid, { text: `📢 *BROADCAST*\n\n${textMessage}\n\n_— Dhoells Bot_` }); s++; } catch (e) { f++; } await delay(2000); }
            await sock.sendMessage(sender, { text: `👑 *Broadcast Selesai!*\n\n✅ Berhasil: ${s} grup\n❌ Gagal: ${f} grup` }, { quoted: msg });
        } catch (e) { await sock.sendMessage(sender, { text: `❌ Error: ${e.message}` }, { quoted: msg }); }
        return;
    }

    // ==================== OWNER ONLY: LACAK, KONTAK, PUSH ====================
    if (['lacak', 'track', 'cekno'].includes(command)) {
        if (!textMessage) { await sock.sendMessage(sender, { text: '📌 *.lacak 085975216127* / *.lacak 8.8.8.8* / *.lacak google.com*' }, { quoted: msg }); return; }
        const inp = textMessage.trim();
        const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(inp);
        const isDomain = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/.test(inp);
        const isPhone = /^[\d\-\+\s\(\)]{8,20}$/.test(inp) && !isIP;
        if (isIP || isDomain) {
            await sock.sendMessage(sender, { text: `🔍 _Melacak ${isDomain ? 'domain' : 'IP'}: ${inp}..._` }, { quoted: msg });
            try {
                const { data } = await axios.get(`http://ip-api.com/json/${inp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`, { timeout: 10000 });
                if (data?.status !== 'success') { await sock.sendMessage(sender, { text: `❌ Gagal: ${data?.message || 'tidak valid'}` }, { quoted: msg }); return; }
                let r = `╭━━━〔 *🔍 LACAK ${isDomain ? 'DOMAIN' : 'IP'}* 〕━━━\n┃\n┃ 🎯 *${inp}*\n┃ 🌐 *${data.query}*\n┃\n┣━━ *📍 Lokasi* ━━\n┃ 🏳️ ${data.country} (${data.countryCode})\n┃ 🏙️ ${data.city || '-'}\n┃ 🗺️ ${data.regionName || '-'}\n┃ 📌 ${data.lat}, ${data.lon}\n┃ 🕐 ${data.timezone || '-'}\n┃\n┣━━ *📡 Network* ━━\n┃ 🏢 ${data.isp || '-'}\n┃ 🏛️ ${data.org || '-'}\n┃ 🔗 ${data.as || '-'}\n┃ 📱 ${data.mobile ? 'Ya' : 'Tidak'}\n┃ 🛡️ ${data.proxy ? 'Ya ⚠️' : 'Tidak'}\n╰━━━━━━━━━━━━━━━━━━━`;
                await sock.sendMessage(sender, { text: r }, { quoted: msg });
            } catch (e) { await sock.sendMessage(sender, { text: `❌ Error: ${e.message}` }, { quoted: msg }); }
        } else if (isPhone) {
            let raw = inp.replace(/[\s\-\+\(\)]/g, '');
            if (raw.startsWith('0')) raw = '62' + raw.substring(1);
            if (!raw.startsWith('62')) raw = '62' + raw;
            await sock.sendMessage(sender, { text: `🔍 _Melacak nomor +${raw}..._` }, { quoted: msg });
            const ID_OPS = { '0811': 'Telkomsel', '0812': 'Telkomsel', '0813': 'Telkomsel', '0821': 'Telkomsel', '0822': 'Telkomsel', '0823': 'Telkomsel', '0851': 'Telkomsel', '0852': 'Telkomsel', '0853': 'Telkomsel', '0814': 'Indosat', '0815': 'Indosat', '0816': 'Indosat', '0855': 'Indosat', '0856': 'Indosat', '0857': 'Indosat', '0858': 'Indosat', '0817': 'XL', '0818': 'XL', '0819': 'XL', '0859': 'XL', '0877': 'XL', '0878': 'XL', '0831': 'Axis', '0832': 'Axis', '0833': 'Axis', '0838': 'Axis', '0895': 'Tri', '0896': 'Tri', '0897': 'Tri', '0898': 'Tri', '0899': 'Tri', '0881': 'Smartfren', '0882': 'Smartfren', '0883': 'Smartfren', '0884': 'Smartfren', '0885': 'Smartfren', '0886': 'Smartfren', '0887': 'Smartfren', '0888': 'Smartfren', '0889': 'Smartfren' };
            const localNum = raw.startsWith('62') ? '0' + raw.substring(2) : raw;
            let detOp = 'Tidak diketahui';
            for (const [pfx, op] of Object.entries(ID_OPS)) { if (localNum.startsWith(pfx)) { detOp = op; break; } }
            let waStatus = '❌ Tidak terdaftar';
            try { const [r] = await sock.onWhatsApp(raw + '@s.whatsapp.net'); if (r?.exists) waStatus = '✅ Terdaftar'; } catch (e) { }
            const pt = `╭━━━〔 *🔍 LACAK NOMOR* 〕━━━\n┃\n┃ 📱 *+${raw}*\n┃ 📞 *${localNum}*\n┃\n┣━━ *💬 WhatsApp* ━━\n┃ ${waStatus}\n┃\n┣━━ *📡 Operator* ━━\n┃ 🏢 *${detOp}*\n┃ 🏳️ Indonesia 🇮🇩\n┃ 🔢 Kode: +62\n┃\n╰━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: pt }, { quoted: msg });
        } else { await sock.sendMessage(sender, { text: '❌ Input tidak dikenali.' }, { quoted: msg }); }
        return;
    }
    if (['lacakip', 'iplookup'].includes(command)) {
        if (!textMessage) { await sock.sendMessage(sender, { text: '📌 *.lacakip <IP/domain>*\nContoh: *.lacakip 8.8.8.8*' }, { quoted: msg }); return; }
        await sock.sendMessage(sender, { text: `🔍 _Melacak ${textMessage.trim()}..._` }, { quoted: msg });
        try {
            const { data } = await axios.get(`http://ip-api.com/json/${textMessage.trim()}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`, { timeout: 10000 });
            if (data?.status !== 'success') { await sock.sendMessage(sender, { text: `❌ Gagal: ${data?.message || 'tidak valid'}` }, { quoted: msg }); return; }
            const r = `╭━━━〔 *🔍 IP LOOKUP* 〕━━━\n┃\n┃ 🎯 *${textMessage.trim()}*\n┃ 🌐 *${data.query}*\n┃\n┣━━ *📍 Lokasi* ━━\n┃ 🏳️ ${data.country} (${data.countryCode})\n┃ 🏙️ ${data.city || '-'}\n┃ 🗺️ ${data.regionName || '-'}\n┃ 📌 ${data.lat}, ${data.lon}\n┃ 🕐 ${data.timezone}\n┃\n┣━━ *📡 Network* ━━\n┃ 🏢 ${data.isp || '-'}\n┃ 🏛️ ${data.org || '-'}\n┃ 🔗 ${data.as || '-'}\n┃ 📱 ${data.mobile ? 'Ya' : 'Tidak'}\n┃ 🛡️ ${data.proxy ? 'Ya ⚠️' : 'Tidak'}\n╰━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: r }, { quoted: msg });
        } catch (e) { await sock.sendMessage(sender, { text: `❌ Error: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['getkontak', 'getcontact', 'listkontak'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        await sock.sendMessage(sender, { text: '📇 _Mengambil data kontak grup..._' }, { quoted: msg });
        try {
            const gm = await sock.groupMetadata(sender); const members = gm.participants;
            let ct = `╭━━━〔 *📇 KONTAK GRUP* 〕━━━\n┃\n┃ 📌 *${gm.subject}*\n┃ 👥 Total: *${members.length}* member\n┃\n`;
            const al = []; const ml = [];
            for (const m of members) { const isAdm = m.admin === 'admin' || m.admin === 'superadmin'; const role = m.admin === 'superadmin' ? '👑 Owner' : m.admin === 'admin' ? '🛡️ Admin' : '👤 Member'; const entry = `┃ ${role} +${m.id.split('@')[0]}`; if (isAdm) al.push(entry); else ml.push(entry); }
            if (al.length) { ct += `┣━━ *🛡️ Admin (${al.length})* ━━\n`; ct += al.join('\n') + '\n┃\n'; }
            ct += `┣━━ *👥 Member (${ml.length})* ━━\n`; ct += ml.slice(0, 50).join('\n'); if (ml.length > 50) ct += `\n┃ ... dan ${ml.length - 50} lainnya`;
            ct += `\n┃\n╰━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: ct }, { quoted: msg });
        } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['savekontak', 'savecontact', 'exportkontak'].includes(command)) {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        await sock.sendMessage(sender, { text: '💾 _Menyimpan kontak grup..._' }, { quoted: msg });
        try {
            const gm = await sock.groupMetadata(sender); const members = gm.participants;
            const safeName = gm.subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            const fileName = `kontak_${safeName}_${Date.now()}.txt`;
            const filePath = path.join(BOT_CONFIG.TEMP_DIR, fileName);
            let fc = `=== KONTAK GRUP: ${gm.subject} ===\nTanggal: ${new Date().toLocaleString('id-ID')}\nTotal: ${members.length}\n========================================\n\n--- ADMIN ---\n`;
            for (const m of members) { if (m.admin) fc += `[${m.admin === 'superadmin' ? 'Owner' : 'Admin'}] +${m.id.split('@')[0]}\n`; }
            fc += `\n--- MEMBER ---\n`;
            for (const m of members) { if (!m.admin) fc += `+${m.id.split('@')[0]}\n`; }
            fs.writeFileSync(filePath, fc);
            await sock.sendMessage(sender, { document: fs.readFileSync(filePath), mimetype: 'text/plain', fileName, caption: `📇 *Kontak Tersimpan!*\n\n📌 ${gm.subject}\n👥 ${members.length} kontak` }, { quoted: msg });
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (['cariuser', 'finduser', 'stalker'].includes(command)) {
        const cm = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targetJid = '';
        if (cm.length > 0) targetJid = cm[0];
        else if (textMessage) { let num = textMessage.replace(/[\s\-\+\(\)]/g, ''); if (num.startsWith('0')) num = '62' + num.substring(1); if (!num.startsWith('62')) num = '62' + num; targetJid = num + '@s.whatsapp.net'; }
        else { await sock.sendMessage(sender, { text: '📌 *.cariuser 085975216127* / *.cariuser @tag*' }, { quoted: msg }); return; }
        const targetNum = targetJid.split('@')[0];
        await sock.sendMessage(sender, { text: `🔍 _Mencari +${targetNum} di semua grup..._` }, { quoted: msg });
        try {
            const allGroups = await sock.groupFetchAllParticipating(); const entries = Object.entries(allGroups); let found = [];
            for (const [gid, gd] of entries) { const f = gd.participants?.find(p => p.id.split('@')[0] === targetNum || p.id === targetJid); if (f) { const role = f.admin === 'superadmin' ? '👑 Owner' : f.admin === 'admin' ? '🛡️ Admin' : '👤 Member'; found.push({ name: gd.subject, count: gd.participants?.length || 0, role }); } }
            let waCheck = '❌ Tidak terdaftar'; try { const [r] = await sock.onWhatsApp(targetJid); waCheck = r?.exists ? '✅ Terdaftar' : '❌ Tidak terdaftar'; } catch (e) { }
            let rt = `╭━━━〔 *🔍 CARI USER* 〕━━━\n┃\n┃ 📱 *+${targetNum}*\n┃ 💬 WhatsApp: *${waCheck}*\n┃ 🔍 Scan: *${entries.length}* grup\n┃\n┣━━ *📍 Ditemukan di ${found.length} grup* ━━\n┃`;
            if (!found.length) rt += `\n┃ ❌ Tidak ditemukan.`;
            else for (let i = 0; i < found.length; i++) rt += `\n┃ ${i + 1}. *${found[i].name}*\n┃    ${found[i].role} | 👥 ${found[i].count} member`;
            rt += `\n╰━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: rt }, { quoted: msg });
        } catch (e) { await sock.sendMessage(sender, { text: `❌ Gagal: ${e.message}` }, { quoted: msg }); }
        return;
    }
    if (command === 'pushkontak') {
        if (!sender.endsWith('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya untuk grup!' }, { quoted: msg }); return; }
        if (!textMessage) { await sock.sendMessage(sender, { text: '📌 *.pushkontak <pesan>*' }, { quoted: msg }); return; }
        await sock.sendMessage(sender, { text: '📤 Memulai Push Kontak...' }, { quoted: msg });
        try {
            const gm = await sock.groupMetadata(sender); const members = gm.participants;
            const myId = sock.user.id.split(':')[0] + '@s.whatsapp.net'; let s = 0, f = 0;
            for (const m of members) { if (m.id === myId) continue; try { await sock.sendMessage(m.id, { text: textMessage }); s++; } catch (e) { f++; } await delay(DELAY_PER_MESSAGE); }
            await sock.sendMessage(sender, { text: `✅ *Push Kontak Selesai!*\n\n📌 Grup: ${gm.subject}\n✅ Berhasil: ${s}\n❌ Gagal: ${f}` });
        } catch (e) { await sock.sendMessage(sender, { text: `❌ Error: ${e.message}` }, { quoted: msg }); }
        return;
    }
}

module.exports = { handleAdminCommand, resolveTarget };
