// ============================================================
// modules/games/handler.js — Games Command Handlers
// Gacha, RPS, Daily, Coins, Koleksi, Top, Setnama
// ============================================================

const { formatCoins, addCoins } = require('../utility/currency');
const { getPlayer, updatePlayer, getDisplayName, loadPlayerData } = require('../utility/db');
const { GACHA_POOL, rollGacha, buildCollectionCaption, getGachaMenuText } = require('./gacha');
const { RPS_CHOICES, RPS_EMOJI, playRPS, RPS_REWARD_WIN, RPS_REWARD_LOSE } = require('./rps');
const { DAILY_COOLDOWN, GACHA_PRICES, RPG_CLASSES, FRAME } = require('../../config');
const { trackQuest, checkLevelUp, checkAchievements, getBuffedStats, chunkArray, renderCollectionPage } = require('../rpg/core');
const { delay } = require('@whiskeysockets/baileys');

// Daily reward: 50 Bronze (5 Silver)
const DAILY_REWARD = 50;

async function handleGacha(sock, sender, msg, participant, textMessage) {
    const gp = getPlayer(participant);
    const ga = (textMessage || '').trim();
    if (!ga || ga === 'menu') {
        await sock.sendMessage(sender, { text: getGachaMenuText(gp.coins) }, { quoted: msg }); return;
    }
    const pc = ga === '5' ? 5 : 1;
    const cost = pc === 5 ? GACHA_PRICES.multi : GACHA_PRICES.single;
    if (gp.coins < cost) {
        await sock.sendMessage(sender, { text: `❌ Coin tidak cukup! Punya *${formatCoins(gp.coins)}*, butuh *${formatCoins(cost)}*.\n💡 Main *.rps* / *.hunt* / *.daily* untuk nambah Coin!` }, { quoted: msg }); return;
    }
    gp.coins -= cost;
    if (pc === 1) {
        const r = rollGacha();
        await sock.sendMessage(sender, { text: '🎰 *GACHA ROLLING...*\n\n⏳ _Menentukan karakter..._' }, { quoted: msg });
        await delay(2000);
        const dupe = gp.koleksi.some(k => k.name === r.name);
        let dm = '';
        if (dupe) { const ref = Math.floor(r.sellPrice / 2); gp.coins += ref; dm = `♻️ _Duplikat! Refund +${formatCoins(ref)}_`; }
        else { gp.koleksi.push({ name: r.name, rarity: r.rarity, stars: r.stars, label: r.label, emoji: r.emoji, anime: r.anime, desc: r.desc, sellPrice: r.sellPrice }); dm = '🆕 _Karakter baru!_'; }
        updatePlayer(participant, gp);
        const gt = `╭━━━〔 *🎰 GACHA RESULT* 〕━━━\n┃\n┃ ${r.emoji} ${r.label.toUpperCase()}\n┃ 🎭 *${r.name}*\n┃ 📺 _${r.anime}_\n┃ 📋 _${r.desc}_\n┃\n┃ ${dm}\n┃\n┃ 🪙 Sisa: *${formatCoins(gp.coins)}* | 📦 Koleksi: *${gp.koleksi.length}*\n╰━━━━━━━━━━━━━━━━━━━`.trim();
        await sock.sendMessage(sender, { text: gt }, { quoted: msg });
    } else {
        await sock.sendMessage(sender, { text: '🎰 *GACHA 5x PULL!*\n\n⏳ _Rolling 5 karakter..._' }, { quoted: msg });
        await delay(2000);
        const rs = []; let br = null; let tr = 0;
        for (let i = 0; i < 5; i++) {
            const r = rollGacha();
            const d = gp.koleksi.some(k => k.name === r.name) || rs.some(p => p.name === r.name);
            if (d) { const ref = Math.floor(r.sellPrice / 2); tr += ref; rs.push({ ...r, isDupe: true, refund: ref }); }
            else { gp.koleksi.push({ name: r.name, rarity: r.rarity, stars: r.stars, label: r.label, emoji: r.emoji, anime: r.anime, desc: r.desc, sellPrice: r.sellPrice }); rs.push({ ...r, isDupe: false, refund: 0 }); }
            if (!br || r.stars > br.stars) br = r;
        }
        gp.coins += tr; updatePlayer(participant, gp);
        let mt = `╭━━━〔 *🎰 GACHA 5x RESULT* 〕━━━\n┃\n`;
        for (let i = 0; i < rs.length; i++) mt += `┃ ${i + 1}. ${rs[i].emoji} *${rs[i].name}*\n┃    ${rs[i].isDupe ? `Duplikat (+${formatCoins(rs[i].refund)})` : 'BARU!'}\n┃\n`;
        mt += `┣━━━━━━━━━━━━━━━━━━━\n┃ 🪙 Sisa: *${formatCoins(gp.coins)}*${tr > 0 ? ` (+${tr} refund)` : ''}\n┃ 📦 Koleksi: *${gp.koleksi.length}*\n╰━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(sender, { text: mt }, { quoted: msg });
    }
}

async function handleRps(sock, sender, msg, participant, textMessage) {
    const ch = textMessage.toLowerCase().trim();
    if (!RPS_CHOICES.includes(ch)) {
        // Show help + history
        const pl = getPlayer(participant);
        const rpsStats = pl.rpsStats || { wins: 0, losses: 0, draws: 0, total: 0 };
        await sock.sendMessage(sender, {
            text: `📌 Pilih: *.rps batu* / *.rps gunting* / *.rps kertas*\n\n📊 *RPS History Kamu:*\n🏆 Menang: *${rpsStats.wins}* | 💀 Kalah: *${rpsStats.losses}* | 🤝 Seri: *${rpsStats.draws}*\n📈 Total: *${rpsStats.total}* main\n\n💰 Menang: +${RPS_REWARD_WIN} Bronze | Kalah: ${RPS_REWARD_LOSE} Bronze`
        }, { quoted: msg });
        return;
    }
    const pl = getPlayer(participant);
    const g = playRPS(ch);

    // Update stats
    if (!pl.rpsStats) pl.rpsStats = { wins: 0, losses: 0, draws: 0, total: 0 };
    pl.rpsStats.total++;
    if (g.result === 'menang') pl.rpsStats.wins++;
    else if (g.result === 'kalah') pl.rpsStats.losses++;
    else pl.rpsStats.draws++;

    pl.coins += g.coinChange;
    if (pl.coins < 0) pl.coins = 0;
    updatePlayer(participant, pl);

    const re = g.result === 'menang' ? '🏆' : g.result === 'kalah' ? '💀' : '🤝';
    const ct = g.coinChange > 0 ? `+${g.coinChange}` : `${g.coinChange}`;

    await sock.sendMessage(sender, {
        text: `╭━━━〔 *✊✌️✋ SUIT* 〕━━━\n┃\n┃ Kamu: ${RPS_EMOJI[ch]} *${ch.toUpperCase()}*\n┃ Bot: ${RPS_EMOJI[g.botChoice]} *${g.botChoice.toUpperCase()}*\n┃\n┃ ${re} Hasil: *${g.result.toUpperCase()}!*\n┃ 🪙 Coin: ${ct} (Saldo: ${formatCoins(pl.coins)})\n┃\n┣━━ *📊 RPS Stats* ━━\n┃ 🏆 ${pl.rpsStats.wins}W / 💀 ${pl.rpsStats.losses}L / 🤝 ${pl.rpsStats.draws}D\n╰━━━━━━━━━━━━━━━━━━━`.trim()
    }, { quoted: msg });
}

async function handleDaily(sock, sender, msg, participant, textMessage) {
    const dp = getPlayer(participant), now = Date.now();
    if (dp.lastDaily && (now - dp.lastDaily) < DAILY_COOLDOWN) {
        const rem = DAILY_COOLDOWN - (now - dp.lastDaily);
        await sock.sendMessage(sender, { text: `⏰ Sudah klaim hari ini!\n\nCoba lagi dalam *${Math.floor(rem / 3600000)}j ${Math.floor((rem % 3600000) / 60000)}m*` }, { quoted: msg }); return;
    }
    dp.coins += DAILY_REWARD; dp.lastDaily = now; updatePlayer(participant, dp); trackQuest(participant, 'earn_coin', DAILY_REWARD);
    await sock.sendMessage(sender, { text: `✅ *Daily Claimed!*\n\n🪙 +${DAILY_REWARD} Bronze\n💰 Saldo: *${formatCoins(dp.coins)}*\n\n_Klaim lagi besok!_ ✨` }, { quoted: msg });
}

async function handleCoins(sock, sender, msg, participant, textMessage) {
    const cp = getPlayer(participant);
    const rpsStats = cp.rpsStats || { wins: 0, losses: 0, draws: 0, total: 0 };
    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🪙 COIN WALLET* 〕━━━\n┃\n┃ 🪙 Saldo: *${formatCoins(cp.coins)}*\n┃ 📦 Koleksi: *${cp.koleksi.length}* karakter\n┃\n┃ 💡 Cara dapat Coin:\n┃  ▸ *.rps* - Menang +${RPS_REWARD_WIN} Bronze\n┃  ▸ *.daily* - +${DAILY_REWARD} Bronze gratis/hari\n┃  ▸ *.hunt* - Dapat Coin dari monster\n┃\n┣━━ *📊 RPS Stats* ━━\n┃ 🏆 ${rpsStats.wins}W / 💀 ${rpsStats.losses}L / 🤝 ${rpsStats.draws}D\n╰━━━━━━━━━━━━━━━━━━━`.trim()
    }, { quoted: msg });
}

async function handleKoleksi(sock, sender, msg, participant, textMessage) {
    const kp = getPlayer(participant);
    if (!kp.koleksi.length) { await sock.sendMessage(sender, { text: '📦 Koleksi kosong!\n\nGunakan *.gacha* untuk mendapatkan karakter.' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🎨 _Generating koleksi kolase..._' }, { quoted: msg });
    const ps = 15, pages = chunkArray(kp.koleksi, ps), kt = buildCollectionCaption(kp.koleksi);
    for (let pi = 0; pi < pages.length; pi++) {
        const cs = pages[pi], rs = pi * ps + 1, re = rs + cs.length - 1;
        try { const cb = await renderCollectionPage(cs, { rangeStart: rs, rangeEnd: re, total: kp.koleksi.length, page: pi + 1, pageCount: pages.length }); await sock.sendMessage(sender, { image: cb, caption: kt }, { quoted: msg }); }
        catch (e) { await sock.sendMessage(sender, { text: `${kt}\n\n⚠️ Gagal render halaman ${pi + 1}/${pages.length}.` }, { quoted: msg }); }
    }
}

async function handleTop(sock, sender, msg, participant, textMessage) {
    const ad = loadPlayerData(), ps = Object.entries(ad);
    if (!ps.length) { await sock.sendMessage(sender, { text: '📭 Belum ada pemain.' }, { quoted: msg }); return; }
    const md = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const gn = (id, info) => info.displayName || id.split('@')[0];
    const sc = [...ps].sort((a, b) => b[1].coins - a[1].coins).slice(0, 10);
    const sl = [...ps].filter(([, i]) => i.rpg).sort((a, b) => { const d = (b[1].rpg?.level || 0) - (a[1].rpg?.level || 0); return d !== 0 ? d : (b[1].rpg?.monstersKilled || 0) - (a[1].rpg?.monstersKilled || 0); }).slice(0, 10);
    const sw = [...ps].filter(([, i]) => i.rpg).sort((a, b) => (b[1].rpg?.wins || 0) - (a[1].rpg?.wins || 0)).slice(0, 5);
    let tt = `╭━━━〔 *🏆 LEADERBOARD* 〕━━━\n┃\n┣━━ *🪙 Top Coin* ━━\n`;
    sc.forEach(([id, info], i) => { tt += `┃ ${md[i]} *${gn(id, info)}* - ${formatCoins(info.coins)} 🪙\n`; });
    if (sl.length) { tt += `┃\n┣━━ *⭐ Top RPG Level* ━━\n`; sl.forEach(([id, info], i) => { const c = RPG_CLASSES[info.rpg.class]; tt += `┃ ${md[i]} *${gn(id, info)}* - Lv${info.rpg.level} ${c?.emoji || ''} ${c?.name || ''} | ${info.rpg.monstersKilled} kills\n`; }); }
    if (sw.length) { tt += `┃\n┣━━ *⚔️ Top Duel Wins* ━━\n`; sw.forEach(([id, info], i) => { tt += `┃ ${md[i]} *${gn(id, info)}* - ${info.rpg.wins}W/${info.rpg.losses}L\n`; }); }
    tt += `┃\n┃ 👥 Total: *${ps.length}*\n┃ 💡 *.setnama <nama>*\n╰━━━━━━━━━━━━━━━━━━━`;
    await sock.sendMessage(sender, { text: tt }, { quoted: msg });
}

async function handleSetnama(sock, sender, msg, participant, textMessage) {
    if (!textMessage?.trim() || textMessage.trim().length < 2) { await sock.sendMessage(sender, { text: '📌 Masukkan nama!\nContoh: *.setnama Dhoells*' }, { quoted: msg }); return; }
    const nn = textMessage.trim().substring(0, 20), sp = getPlayer(participant), on = sp.displayName || participant.split('@')[0];
    sp.displayName = nn; updatePlayer(participant, sp);
    await sock.sendMessage(sender, { text: `✅ Nama diubah!\n\n🏷️ *${on}* → *${nn}*` }, { quoted: msg });
}

module.exports = { handleGacha, handleRps, handleDaily, handleCoins, handleKoleksi, handleTop, handleSetnama };
