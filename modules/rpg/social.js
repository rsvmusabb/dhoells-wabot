// ============================================================
// modules/rpg/social.js — Duel, Raid, Guild, Bounty, Market
// ============================================================

const { getPlayer, updatePlayer, getDisplayName, activeDuels, activeRaids, findPlayerGuild, getGuild, saveGuild, deleteGuild, loadBountyData, saveBountyData, loadMarketData, saveMarketData } = require('../utility/db');
const { formatCoins } = require('../utility/currency');
const { DUEL_BET, DUEL_TIMEOUT, GUILD_CREATE_COST, GUILD_BUFF_COST, GUILD_BUFF_DURATION, MARKET_FEE, RPG_CLASSES } = require('../../config');
const { getBuffedStats, quickBattle, runBattle, getRaidBoss, RPG_RAIDS, checkLevelUp, trackQuest, checkAchievements, tickBuffs, generateBattleImage } = require('./core');
const { delay } = require('@whiskeysockets/baileys');

async function handleDuel(sock, sender, msg, participant, textMessage, args, isBotGroupAdmin) {
    if (!sender.includes('@g.us')) { await sock.sendMessage(sender, { text: '❌ Duel hanya bisa di grup!' }, { quoted: msg }); return; }
    const dp = getPlayer(participant); if (!dp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) { await sock.sendMessage(sender, { text: '📌 Tag lawan: *.duel @6281234567890*' }, { quoted: msg }); return; }
    const opp = mentioned[0]; if (opp === participant) { await sock.sendMessage(sender, { text: '❌ Gak bisa duel diri sendiri!' }, { quoted: msg }); return; }
    if (activeDuels[sender]) { await sock.sendMessage(sender, { text: '⚠️ Masih ada duel aktif!' }, { quoted: msg }); return; }
    if (dp.coins < DUEL_BET) { await sock.sendMessage(sender, { text: `❌ Coin kurang! Butuh ${formatCoins(DUEL_BET)}` }, { quoted: msg }); return; }
    activeDuels[sender] = { challenger: participant, opponent: opp, phase: 'waiting', timestamp: Date.now() };
    setTimeout(() => { if (activeDuels[sender]?.phase === 'waiting') { delete activeDuels[sender]; sock.sendMessage(sender, { text: '⏰ Duel expired!' }); } }, DUEL_TIMEOUT);
    const cn = getDisplayName(participant), on = getDisplayName(opp); const c = RPG_CLASSES[dp.rpg.class];
    await sock.sendMessage(sender, { text: `╭━━━〔 *⚔️ RPG DUEL* 〕━━━\n┃\n┃ ${c.emoji} *${cn}* (Lv${dp.rpg.level} ${c.name})\n┃ menantang\n┃ 🎯 *@${opp.split('@')[0]}*\n┃\n┃ 🪙 Taruhan: *${formatCoins(DUEL_BET)}*\n┃ ⏰ 90 detik\n┃\n╰ @${opp.split('@')[0]} ketik *.terima*`, mentions: [opp] }, { quoted: msg });
}

async function handleTerima(sock, sender, msg, participant, textMessage) {
    const duel = activeDuels[sender]; const raid = activeRaids[sender];
    if (!duel && !raid) { await sock.sendMessage(sender, { text: '❌ Tidak ada duel/raid aktif.' }, { quoted: msg }); return; }
    if (duel && duel.phase === 'waiting' && participant === duel.opponent) {
        const op = getPlayer(participant); if (!op.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); delete activeDuels[sender]; return; }
        if (op.coins < DUEL_BET) { await sock.sendMessage(sender, { text: `❌ Coin kurang! Butuh ${formatCoins(DUEL_BET)}` }, { quoted: msg }); delete activeDuels[sender]; return; }
        duel.phase = 'fighting'; const p1 = getPlayer(duel.challenger), p2 = op;
        const n1 = getDisplayName(duel.challenger), n2 = getDisplayName(participant);
        const c1 = RPG_CLASSES[p1.rpg.class], c2 = RPG_CLASSES[p2.rpg.class];
        await sock.sendMessage(sender, { text: '⚔️ *DUEL DITERIMA!*' }, { quoted: msg }); await delay(1000);
        await sock.sendMessage(sender, { text: `${c1.emoji} *${n1}* (Lv${p1.rpg.level} ${c1.name})\n⚔️ VS ⚔️\n${c2.emoji} *${n2}* (Lv${p2.rpg.level} ${c2.name})` }); await delay(1500);
        const s1 = getBuffedStats(p1.rpg), s2 = getBuffedStats(p2.rpg); let h1 = s1.hp, h2 = s2.hp; const log = []; const first = s1.spd >= s2.spd;
        for (let t = 0; t < 15 && h1 > 0 && h2 > 0; t++) { for (const who of first ? ['p1', 'p2'] : ['p2', 'p1']) { if (h1 <= 0 || h2 <= 0) break; if (who === 'p1') { if (!require('./core').isDodge(s1.spd, s2.spd, s2.dodge) && !require('./core').isBlocked(s2.block)) { const { damage, isCrit } = require('./core').calcDamage(s1.atk, s2.def, s1.crit); h2 -= damage; log.push(`${c1.emoji} *${n1}* → *${n2}*! ${isCrit?'💥 CRIT ':''}*${damage}* dmg | ❤️ ${Math.max(0,h2)}`); } else { log.push(`💨 *${n2}* menghindari serangan!`); } } else { if (!require('./core').isDodge(s2.spd, s1.spd, s1.dodge) && !require('./core').isBlocked(s1.block)) { const { damage, isCrit } = require('./core').calcDamage(s2.atk, s1.def, s2.crit); h1 -= damage; log.push(`${c2.emoji} *${n2}* → *${n1}*! ${isCrit?'💥 CRIT ':''}*${damage}* dmg | ❤️ ${Math.max(0,h1)}`); } else { log.push(`💨 *${n1}* menghindari serangan!`); } } } }
        let lm = ''; for (const l of log) { lm += l + '\n'; if (lm.length > 500) { await sock.sendMessage(sender, { text: lm.trim() }); lm = ''; await delay(800); } } if (lm) { await sock.sendMessage(sender, { text: lm.trim() }); await delay(800); }
        const winnerId = h2 <= 0 ? duel.challenger : duel.opponent; const loserId = winnerId === duel.challenger ? duel.opponent : duel.challenger;
        const wP = getPlayer(winnerId), lP = getPlayer(loserId); const wName = getDisplayName(winnerId), lName = getDisplayName(loserId);
        wP.coins += DUEL_BET; wP.rpg.wins++; wP.rpg.hp = Math.max(1, winnerId === duel.challenger ? h1 : h2);
        lP.coins = Math.max(0, lP.coins - DUEL_BET); lP.rpg.losses++; lP.rpg.hp = Math.floor(lP.rpg.maxHp * 0.3);
        updatePlayer(winnerId, wP); updatePlayer(loserId, lP); trackQuest(winnerId, 'duel_win'); tickBuffs(winnerId); tickBuffs(loserId);
        const wCls = RPG_CLASSES[wP.rpg.class];
        const dr = `╭━━━〔 *🏆 ${wName} MENANG!* 〕━━━\n┃\n┃ ${wCls.emoji} *${wName}* +${DUEL_BET} 🪙 (${formatCoins(wP.coins)})\n┃ 💀 *${lName}* -${DUEL_BET} 🪙 (${formatCoins(lP.coins)})\n╰━━━━━━━━━━━━━━━━━━━`;
        try { const img = await generateBattleImage(wName, wP.rpg.class, lName, true, `${RPG_CLASSES[lP.rpg.class]?.name} anime fantasy`); await sock.sendMessage(sender, { image: img, caption: dr, mentions: [winnerId, loserId] }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: dr }, { quoted: msg }); }
        delete activeDuels[sender];
    } else if (raid && raid.phase === 'waiting' && participant === raid.partner) {
        const rp1 = getPlayer(raid.leader), rp2 = getPlayer(participant);
        if (!rp2.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); delete activeRaids[sender]; return; }
        raid.phase = 'fighting'; const boss = getRaidBoss(Math.max(rp1.rpg.level, rp2.rpg.level));
        const rn1 = raid.leader.split('@')[0], rn2 = participant.split('@')[0];
        const rc1 = RPG_CLASSES[rp1.rpg.class], rc2 = RPG_CLASSES[rp2.rpg.class];
        await sock.sendMessage(sender, { text: `🐲 *RAID DIMULAI!*\n\n${rc1.emoji} ${rn1} + ${rc2.emoji} ${rn2}\n⚔️ VS ⚔️\n${boss.emoji} *${boss.name}*\nHP: ${boss.hp} | ATK: ${boss.atk} | DEF: ${boss.def}` }); await delay(2000);
        const rs1 = getBuffedStats(rp1.rpg), rs2 = getBuffedStats(rp2.rpg); let bHp = boss.hp, rh1 = rp1.rpg.hp, rh2 = rp2.rpg.hp; const rlog = [];
        for (let t = 0; t < 20 && bHp > 0 && (rh1 > 0 || rh2 > 0); t++) {
            if (rh1 > 0) { const { damage, isCrit } = require('./core').calcDamage(rs1.atk, boss.def, rs1.crit); bHp -= damage; rlog.push(`${rc1.emoji} ${rn1} → ${boss.name}! ${isCrit?'💥':''}*${damage}* | 🐲 ${Math.max(0,bHp)}`); }
            if (rh2 > 0 && bHp > 0) { const { damage, isCrit } = require('./core').calcDamage(rs2.atk, boss.def, rs2.crit); bHp -= damage; rlog.push(`${rc2.emoji} ${rn2} → ${boss.name}! ${isCrit?'💥':''}*${damage}* | 🐲 ${Math.max(0,bHp)}`); }
            if (bHp > 0) { const target = (rh1 > 0 && rh2 > 0) ? (Math.random() > 0.5 ? 1 : 2) : (rh1 > 0 ? 1 : 2); const tDef = target === 1 ? rs1.def : rs2.def; const { damage, isCrit } = require('./core').calcDamage(boss.atk, tDef, 10); if (target === 1) { rh1 -= damage; rlog.push(`${boss.emoji} ${boss.name} → ${rn1}! *${damage}* | ❤️ ${Math.max(0,rh1)}`); } else { rh2 -= damage; rlog.push(`${boss.emoji} ${boss.name} → ${rn2}! *${damage}* | ❤️ ${Math.max(0,rh2)}`); } }
        }
        let rm = ''; for (const l of rlog) { rm += l + '\n'; if (rm.length > 500) { await sock.sendMessage(sender, { text: rm.trim() }); rm = ''; await delay(800); } } if (rm) { await sock.sendMessage(sender, { text: rm.trim() }); await delay(800); }
        if (bHp <= 0) { const cd = Math.floor(Math.random() * (boss.coinMax - boss.coinMin + 1)) + boss.coinMin; rp1.rpg.exp += boss.exp; rp1.rpg.hp = Math.max(1, rh1); rp1.coins += cd; rp1.rpg.monstersKilled++; rp2.rpg.exp += boss.exp; rp2.rpg.hp = Math.max(1, rh2); rp2.coins += cd; rp2.rpg.monstersKilled++; updatePlayer(raid.leader, rp1); updatePlayer(participant, rp2); const nl1 = checkLevelUp(raid.leader), nl2 = checkLevelUp(participant); let rw = `🏆 *RAID VICTORY!*\n\n${boss.emoji} ${boss.name} dikalahkan!\n\n⭐ +${boss.exp} EXP | 🪙 +${formatCoins(cd)} masing-masing`; if (nl1) rw += `\n🎉 ${rn1} LEVEL UP Lv${nl1}!`; if (nl2) rw += `\n🎉 ${rn2} LEVEL UP Lv${nl2}!`; await sock.sendMessage(sender, { text: rw, mentions: [raid.leader, participant] }); }
        else { rp1.rpg.hp = Math.floor(rp1.rpg.maxHp * 0.3); rp2.rpg.hp = Math.floor(rp2.rpg.maxHp * 0.3); updatePlayer(raid.leader, rp1); updatePlayer(participant, rp2); await sock.sendMessage(sender, { text: `💀 *RAID GAGAL!*\n\n${boss.emoji} ${boss.name} terlalu kuat!\nHP tim direset.` }); }
        delete activeRaids[sender];
    } else { await sock.sendMessage(sender, { text: '❌ Duel/raid ini bukan untuk kamu!' }, { quoted: msg }); }
}

async function handleRaid(sock, sender, msg, participant, textMessage) {
    if (!sender.includes('@g.us')) { await sock.sendMessage(sender, { text: '❌ Raid hanya bisa di grup!' }, { quoted: msg }); return; }
    const rp = getPlayer(participant); if (!rp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const rm = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!rm.length) { await sock.sendMessage(sender, { text: '📌 Tag partner: *.raid @orang*' }, { quoted: msg }); return; }
    const partner = rm[0]; if (partner === participant) { await sock.sendMessage(sender, { text: '❌ Gak bisa raid sendiri!' }, { quoted: msg }); return; }
    if (activeRaids[sender]) { await sock.sendMessage(sender, { text: '⚠️ Masih ada raid aktif!' }, { quoted: msg }); return; }
    activeRaids[sender] = { leader: participant, partner, phase: 'waiting' };
    setTimeout(() => { if (activeRaids[sender]?.phase === 'waiting') { delete activeRaids[sender]; sock.sendMessage(sender, { text: '⏰ Raid expired!' }); } }, DUEL_TIMEOUT);
    const rc = RPG_CLASSES[rp.rpg.class];
    await sock.sendMessage(sender, { text: `╭━━━〔 *🐲 RAID BOSS* 〕━━━\n┃\n┃ ${rc.emoji} *${participant.split('@')[0]}* (Lv${rp.rpg.level})\n┃ mengajak\n┃ 🤝 *@${partner.split('@')[0]}*\n┃\n┃ untuk melawan Raid Boss!\n┃ @${partner.split('@')[0]} ketik *.terima*\n╰━━━━━━━━━━━━━━━━━━━`, mentions: [partner] }, { quoted: msg });
}

async function handleGuild(sock, sender, msg, participant, textMessage) {
    const gp = getPlayer(participant); const ga = textMessage?.trim() || '';
    const gc = ga.split(' ')[0]?.toLowerCase(); const gv = ga.slice(gc?.length || 0).trim();
    if (gc === 'create') {
        if (!gv) { await sock.sendMessage(sender, { text: '📌 *.guild create <nama>*' }, { quoted: msg }); return; }
        if (findPlayerGuild(participant)) { await sock.sendMessage(sender, { text: '❌ Sudah punya guild!' }, { quoted: msg }); return; }
        if (gp.coins < GUILD_CREATE_COST) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(GUILD_CREATE_COST)}!` }, { quoted: msg }); return; }
        if (getGuild(gv)) { await sock.sendMessage(sender, { text: '❌ Nama guild sudah dipakai!' }, { quoted: msg }); return; }
        gp.coins -= GUILD_CREATE_COST; if (gp.rpg) { gp.rpg.guildName = gv.toLowerCase(); gp.rpg.guildRole = 'leader'; }
        updatePlayer(participant, gp); saveGuild(gv, { leader: participant, members: [], bank: 0, level: 1, exp: 0, buff: null, createdAt: Date.now() });
        checkAchievements(participant); await sock.sendMessage(sender, { text: `🏠 Guild *${gv}* berhasil dibuat!\n💰 -${formatCoins(GUILD_CREATE_COST)}` }, { quoted: msg });
    } else if (gc === 'join') {
        if (!gv) { await sock.sendMessage(sender, { text: '📌 *.guild join <nama>*' }, { quoted: msg }); return; }
        if (findPlayerGuild(participant)) { await sock.sendMessage(sender, { text: '❌ Sudah punya guild!' }, { quoted: msg }); return; }
        const tg = getGuild(gv); if (!tg) { await sock.sendMessage(sender, { text: '❌ Guild tidak ditemukan!' }, { quoted: msg }); return; }
        if ((tg.members || []).length >= 20) { await sock.sendMessage(sender, { text: '❌ Guild penuh! (max 20)' }, { quoted: msg }); return; }
        tg.members = tg.members || []; tg.members.push(participant); saveGuild(gv, tg);
        if (gp.rpg) { gp.rpg.guildName = gv.toLowerCase(); gp.rpg.guildRole = 'member'; } updatePlayer(participant, gp);
        await sock.sendMessage(sender, { text: `✅ Bergabung ke guild *${gv}*!` }, { quoted: msg });
    } else if (gc === 'leave') {
        const pg = findPlayerGuild(participant); if (!pg) { await sock.sendMessage(sender, { text: '❌ Tidak punya guild!' }, { quoted: msg }); return; }
        if (pg.leader === participant) { deleteGuild(pg.name); } else { pg.members = (pg.members || []).filter(m => m !== participant); saveGuild(pg.name, pg); }
        if (gp.rpg) { gp.rpg.guildName = null; gp.rpg.guildRole = null; } updatePlayer(participant, gp);
        await sock.sendMessage(sender, { text: '✅ Keluar dari guild.' }, { quoted: msg });
    } else if (gc === 'donate') {
        const amt = parseInt(gv); if (!amt || amt < 1) { await sock.sendMessage(sender, { text: '📌 *.guild donate <jumlah>*' }, { quoted: msg }); return; }
        const pg = findPlayerGuild(participant); if (!pg) { await sock.sendMessage(sender, { text: '❌ Tidak punya guild!' }, { quoted: msg }); return; }
        if (gp.coins < amt) { await sock.sendMessage(sender, { text: '❌ Coin tidak cukup!' }, { quoted: msg }); return; }
        gp.coins -= amt; updatePlayer(participant, gp);
        const gd = getGuild(pg.name); gd.bank = (gd.bank || 0) + amt; gd.exp = (gd.exp || 0) + Math.floor(amt / 2); saveGuild(pg.name, gd);
        await sock.sendMessage(sender, { text: `✅ Donasi *${formatCoins(amt)}* ke guild! Bank: ${formatCoins(gd.bank)}` }, { quoted: msg });
    } else if (gc === 'buff') {
        const pg = findPlayerGuild(participant); if (!pg) { await sock.sendMessage(sender, { text: '❌ Tidak punya guild!' }, { quoted: msg }); return; }
        const gd = getGuild(pg.name); if ((gd.bank || 0) < GUILD_BUFF_COST) { await sock.sendMessage(sender, { text: `❌ Guild bank kurang! Butuh ${formatCoins(GUILD_BUFF_COST)} (Bank: ${formatCoins(gd.bank || 0)})` }, { quoted: msg }); return; }
        gd.bank -= GUILD_BUFF_COST; gd.buff = { atk: 5, def: 5, expiresAt: Date.now() + GUILD_BUFF_DURATION }; saveGuild(pg.name, gd);
        await sock.sendMessage(sender, { text: `🔥 Guild buff aktif! ATK+5 DEF+5 selama 3 jam!\n💰 Bank: ${formatCoins(gd.bank)}` }, { quoted: msg });
    } else if (gc === 'members') {
        const pg = findPlayerGuild(participant); if (!pg) { await sock.sendMessage(sender, { text: '❌ Tidak punya guild!' }, { quoted: msg }); return; }
        let mt = `╭━━━〔 *🏠 ${pg.name.toUpperCase()}* 〕━━━\n┃ 👑 Leader: ${getDisplayName(pg.leader)}\n┃\n`;
        for (const m of (pg.members || [])) mt += `┃ 👤 ${getDisplayName(m)}\n`;
        mt += `┃\n┃ 💰 Bank: ${formatCoins(pg.bank || 0)} | 👥 ${(pg.members || []).length + 1}/20\n╰━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(sender, { text: mt }, { quoted: msg });
    } else {
        const pg = findPlayerGuild(participant);
        if (!pg) { await sock.sendMessage(sender, { text: `🏠 Kamu belum punya guild!\n\n*.guild create <nama>* — Buat (${formatCoins(GUILD_CREATE_COST)})\n*.guild join <nama>* — Gabung` }, { quoted: msg }); return; }
        const hasBuff = pg.buff && Date.now() < pg.buff?.expiresAt;
        await sock.sendMessage(sender, { text: `╭━━━〔 *🏠 ${pg.name.toUpperCase()}* 〕━━━\n┃\n┃ 👑 Leader: ${getDisplayName(pg.leader)}\n┃ 👥 Members: ${(pg.members || []).length + 1}/20\n┃ 💰 Bank: ${formatCoins(pg.bank || 0)}\n┃ 🔥 Buff: ${hasBuff ? 'ATK+5 DEF+5 ✅' : '❌ Tidak aktif'}\n┃\n╰━━━━━━━━━━━━━━━━━━━\n*.guild donate/buff/members/leave*` }, { quoted: msg });
    }
}

async function handleBounty(sock, sender, msg, participant, textMessage) {
    if (!sender.includes('@g.us')) { await sock.sendMessage(sender, { text: '❌ Hanya di grup!' }, { quoted: msg }); return; }
    const bp = getPlayer(participant); const bm = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const ba = parseInt(textMessage?.split(' ').pop()); if (!bm.length || !ba || ba < 250) { await sock.sendMessage(sender, { text: `📌 *.bounty @target <jumlah>* (min ${formatCoins(250)})` }, { quoted: msg }); return; }
    if (bp.coins < ba) { await sock.sendMessage(sender, { text: '❌ Coin tidak cukup!' }, { quoted: msg }); return; }
    const target = bm[0]; if (target === participant) { await sock.sendMessage(sender, { text: '❌ Ga bisa bounty diri sendiri!' }, { quoted: msg }); return; }
    bp.coins -= ba; updatePlayer(participant, bp);
    const bounties = loadBountyData(); bounties[target] = (bounties[target] || 0) + ba; saveBountyData(bounties);
    await sock.sendMessage(sender, { text: `🩸 *BOUNTY SET!*\n\n🎯 Target: @${target.split('@')[0]}\n💰 Bounty: ${formatCoins(bounties[target])}\n\n_Siapapun yang kill target di duel dapat bounty!_`, mentions: [target] }, { quoted: msg });
}

async function handleWanted(sock, sender, msg, participant, textMessage) {
    const bounties = loadBountyData(); const sorted = Object.entries(bounties).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (!sorted.length) { await sock.sendMessage(sender, { text: '🩸 Tidak ada bounty aktif.' }, { quoted: msg }); return; }
    let wt = `╭━━━〔 *🩸 WANTED BOARD* 〕━━━\n┃\n`;
    for (let i = 0; i < sorted.length; i++) wt += `┃ ${i + 1}. @${sorted[i][0].split('@')[0]} — ${formatCoins(sorted[i][1])}\n`;
    wt += '╰━━━━━━━━━━━━━━━━━━━';
    await sock.sendMessage(sender, { text: wt, mentions: sorted.map(s => s[0]) }, { quoted: msg });
}

async function handleMarket(sock, sender, msg, participant, textMessage) {
    const mp = getPlayer(participant); const ma = textMessage?.trim() || '';
    const mc = ma.split(' ')[0]?.toLowerCase(); const mv = ma.slice(mc?.length || 0).trim();
    if (mc === 'sell' || mc === 'jual') {
        const parts = mv.split(' '); const mPrice = parseInt(parts.pop()); const mItem = parts.join('_').toLowerCase();
        if (!mItem || !mPrice || mPrice < 1) { await sock.sendMessage(sender, { text: '📌 *.market sell <item> <harga>*\nContoh: *.market sell pedang_besi 20*' }, { quoted: msg }); return; }
        if (!mp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
        const mi = mp.rpg.inventory.indexOf(mItem); if (mi === -1) { await sock.sendMessage(sender, { text: '❌ Item tidak ada di inventory!' }, { quoted: msg }); return; }
        mp.rpg.inventory.splice(mi, 1); updatePlayer(participant, mp);
        const md = loadMarketData(); md.push({ id: Date.now(), seller: participant, item: mItem, price: mPrice, listedAt: Date.now() }); saveMarketData(md);
        const ii = RPG_ITEMS[mItem] || RPG_WEAPONS[mItem] || RPG_ARMORS[mItem] || RPG_SHIELDS[mItem];
        await sock.sendMessage(sender, { text: `✅ ${ii?.emoji || '📦'} *${ii?.name || mItem}* listed di market!\n💰 Harga: ${formatCoins(mPrice)}` }, { quoted: msg });
    } else if (mc === 'buy' || mc === 'beli') {
        const mid = parseInt(mv); if (!mid) { await sock.sendMessage(sender, { text: '📌 *.market buy <id>*' }, { quoted: msg }); return; }
        const md = loadMarketData(); const listing = md.find(l => l.id === mid);
        if (!listing) { await sock.sendMessage(sender, { text: '❌ Listing tidak ditemukan!' }, { quoted: msg }); return; }
        if (listing.seller === participant) { await sock.sendMessage(sender, { text: '❌ Ga bisa beli item sendiri!' }, { quoted: msg }); return; }
        if (mp.coins < listing.price) { await sock.sendMessage(sender, { text: '❌ Coin tidak cukup!' }, { quoted: msg }); return; }
        mp.coins -= listing.price; if (mp.rpg) mp.rpg.inventory.push(listing.item); updatePlayer(participant, mp);
        const sp = getPlayer(listing.seller); const fee = Math.floor(listing.price * MARKET_FEE); sp.coins += listing.price - fee; updatePlayer(listing.seller, sp);
        const nm = md.filter(l => l.id !== mid); saveMarketData(nm);
        await sock.sendMessage(sender, { text: `✅ Beli *${listing.item}* seharga ${formatCoins(listing.price)}!\n💰 Fee 10%: ${formatCoins(fee)}` }, { quoted: msg });
    } else {
        const md = loadMarketData().slice(-15);
        if (!md.length) { await sock.sendMessage(sender, { text: '🏪 Market kosong!\n\n*.market sell <item> <harga>* — Jual item' }, { quoted: msg }); return; }
        let mt = `╭━━━〔 *🏪 MARKETPLACE* 〕━━━\n┃\n`;
        for (const l of md) { const ii = RPG_ITEMS[l.item] || RPG_WEAPONS[l.item] || RPG_ARMORS[l.item] || RPG_SHIELDS[l.item]; mt += `┃ #${l.id} ${ii?.emoji || '📦'} *${ii?.name || l.item}* — ${formatCoins(l.price)}\n┃   👤 ${getDisplayName(l.seller)}\n┃\n`; }
        mt += '╰━━━━━━━━━━━━━━━━━━━\n*.market buy <id>* | *.market sell <item> <harga>*';
        await sock.sendMessage(sender, { text: mt }, { quoted: msg });
    }
}

async function handleArena(sock, sender, msg, participant, textMessage) {
    const { loadPlayerData, getArenaRank } = require('./core'); 
    const pData = getPlayer(participant);
    if (!pData.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    
    // Default arena data
    if (!pData.rpg.arena) pData.rpg.arena = { elo: 0, wins: 0, losses: 0, streak: 0 };
    
    // Find opponent
    const { loadPlayerData: loadAll } = require('../utility/db');
    const all = loadAll();
    const validOpps = Object.keys(all).filter(k => k !== participant && all[k].rpg);
    
    if (validOpps.length === 0) {
        await sock.sendMessage(sender, { text: '❌ Tidak ada pemain lain di arena saat ini.' }, { quoted: msg }); return;
    }
    
    // Pick random opponent (in real game we could pick closest ELO)
    const oppJid = validOpps[Math.floor(Math.random() * validOpps.length)];
    const oppData = all[oppJid];
    if (!oppData.rpg.arena) oppData.rpg.arena = { elo: 0, wins: 0, losses: 0, streak: 0 };
    
    const myStats = getBuffedStats(pData);
    const oppStats = getBuffedStats(oppData);
    
    // Run background quick battle
    const battle = quickBattle(myStats, oppStats);
    const win = battle.winner === 1;
    
    // Adjust ELO
    let eloChange = win ? 15 : -10;
    if (win && pData.rpg.arena.streak >= 3) eloChange += 5; // streak bonus
    
    pData.rpg.arena.elo = Math.max(0, pData.rpg.arena.elo + eloChange);
    if (win) { pData.rpg.arena.wins++; pData.rpg.arena.streak++; }
    else { pData.rpg.arena.losses++; pData.rpg.arena.streak = 0; }
    
    updatePlayer(participant, pData);
    
    // Check rank
    const { getArenaRank: getRank } = require('./core');
    const rank = getRank(pData.rpg.arena.elo);
    
    const oppName = oppData.displayName || oppJid.split('@')[0];
    const resText = win ? '🏆 *VICTORY!*' : '💀 *DEFEAT!*';
    const sign = eloChange > 0 ? '+' : '';
    
    let txt = `╭━━━〔 *⚔️ ARENA PVP* 〕━━━\n┃\n`;
    txt += `┃ 👤 *${getDisplayName(participant)}* vs *${oppName}*\n┃\n`;
    txt += `┃ ${resText}\n`;
    txt += `┃ 📈 ELO: ${sign}${eloChange} (Total: ${pData.rpg.arena.elo})\n`;
    txt += `┃ 🏅 Rank: ${rank.emoji} ${rank.name}\n`;
    txt += `┃ 🔄 Streak: ${pData.rpg.arena.streak} win\n`;
    txt += `╰━━━━━━━━━━━━━━━━━━━`;
    
    await sock.sendMessage(sender, { text: txt }, { quoted: msg });
}

module.exports = { handleDuel, handleTerima, handleRaid, handleArena, handleGuild, handleBounty, handleWanted, handleMarket };
