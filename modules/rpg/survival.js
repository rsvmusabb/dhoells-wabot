// ============================================================
// modules/rpg/survival.js — Eat, Rest, Camp, Repair, Weather, Karma, Status
// ============================================================

const { getPlayer, updatePlayer } = require('../utility/db');
const { formatCoins } = require('../utility/currency');
const { RPG_FOODS, MAX_STAMINA, MAX_DURABILITY, DURABILITY_LOSS_PER_BATTLE, REPAIR_COST_PER_POINT, KARMA_LEVELS, WEATHERS, TIME_PHASES, FRAME } = require('../../config');
const { updateWeather, getTimePhase, getTimeMultipliers, getKarmaLevel, getBuffedStats } = require('./core');

async function handleEat(sock, sender, msg, participant, textMessage) {
    const ep = getPlayer(participant); if (!ep.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const fi = textMessage?.toLowerCase()?.replace(/\s+/g, '_');
    if (!fi) {
        let ft = `╭━━━〔 *🍖 FOOD MENU* 〕━━━\n┃ 🍖 Stamina: ${ep.rpg.stamina || 0}/${MAX_STAMINA}\n┃\n`;
        for (const [id, f] of Object.entries(RPG_FOODS)) ft += `┃ ${f.emoji} *${f.name}* — ${formatCoins(f.price)}\n┃   🍖+${f.stamina} ${f.hp > 0 ? `❤️+${f.hp}` : ''} ${f.desc}\n┃\n`;
        ft += '╰━━━━━━━━━━━━━━━━━━━\n💡 *.eat <nama>* atau *.buy <nama>* dulu';
        await sock.sendMessage(sender, { text: ft }, { quoted: msg }); return;
    }
    const food = RPG_FOODS[fi]; if (!food) { await sock.sendMessage(sender, { text: '❌ Makanan tidak ditemukan!' }, { quoted: msg }); return; }
    const idx = ep.rpg.inventory.indexOf(fi);
    if (idx === -1) { if (ep.coins < food.price) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(food.price)}!` }, { quoted: msg }); return; } ep.coins -= food.price; } else ep.rpg.inventory.splice(idx, 1);
    ep.rpg.stamina = Math.min(MAX_STAMINA, (ep.rpg.stamina || 0) + food.stamina);
    if (food.hp > 0) ep.rpg.hp = Math.min(ep.rpg.maxHp, ep.rpg.hp + food.hp);
    updatePlayer(participant, ep);
    await sock.sendMessage(sender, { text: `${food.emoji} Makan *${food.name}*!\n🍖 Stamina: ${ep.rpg.stamina}/${MAX_STAMINA}${food.hp > 0 ? `\n❤️ HP +${food.hp}` : ''}` }, { quoted: msg });
}

async function handleRest(sock, sender, msg, participant, textMessage) {
    const rp = getPlayer(participant); if (!rp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (rp.coins < 500) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(500)}! Coba *.camp* (gratis, 50%)` }, { quoted: msg }); return; }
    rp.coins -= 500; rp.rpg.hp = rp.rpg.maxHp; rp.rpg.stamina = MAX_STAMINA; updatePlayer(participant, rp);
    await sock.sendMessage(sender, { text: `🏨 Istirahat di Inn!\n❤️ HP: ${rp.rpg.hp}/${rp.rpg.maxHp} (FULL)\n🍖 Stamina: ${MAX_STAMINA}/${MAX_STAMINA} (FULL)\n💰 -${formatCoins(500)}` }, { quoted: msg });
}

async function handleCamp(sock, sender, msg, participant, textMessage) {
    const cp = getPlayer(participant); if (!cp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    cp.rpg.hp = Math.min(cp.rpg.maxHp, cp.rpg.hp + Math.floor(cp.rpg.maxHp * 0.5));
    cp.rpg.stamina = Math.min(MAX_STAMINA, (cp.rpg.stamina || 0) + 50); updatePlayer(participant, cp);
    await sock.sendMessage(sender, { text: `⛺ Berkemah di hutan...\n❤️ HP: ${cp.rpg.hp}/${cp.rpg.maxHp} (+50%)\n🍖 Stamina: ${cp.rpg.stamina}/${MAX_STAMINA} (+50)` }, { quoted: msg });
}

async function handleRepair(sock, sender, msg, participant, textMessage) {
    const rp = getPlayer(participant); if (!rp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const cur = rp.rpg.durability ?? MAX_DURABILITY;
    if (cur >= MAX_DURABILITY) { await sock.sendMessage(sender, { text: '✅ Senjata masih bagus! (100/100)' }, { quoted: msg }); return; }
    const need = MAX_DURABILITY - cur; const cost = Math.ceil(need * REPAIR_COST_PER_POINT);
    if (rp.coins < cost) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(cost)}!\n🔧 Durability: ${cur}/${MAX_DURABILITY}` }, { quoted: msg }); return; }
    rp.coins -= cost; rp.rpg.durability = MAX_DURABILITY; updatePlayer(participant, rp);
    await sock.sendMessage(sender, { text: `🔧 Senjata diperbaiki!\n🗡️ Durability: ${MAX_DURABILITY}/${MAX_DURABILITY}\n💰 -${formatCoins(cost)}` }, { quoted: msg });
}

async function handleWeatherCmd(sock, sender, msg, participant, textMessage) {
    const w = updateWeather(); const t = getTimeMultipliers();
    let wm = `╭━━━〔 *🌍 WORLD STATUS* 〕━━━\n┃\n┃ ${t.label}\n┃ ${w.emoji} Cuaca: *${w.name}*\n┃\n┃ 📊 Efek aktif:\n`;
    if (getTimePhase() === 3) wm += '┃ 🌙 Monster +30% | Drop +20%\n';
    if (getTimePhase() === 1) wm += '┃ ☀️ Shop discount 10%\n';
    if (w.effects.atkBonus) wm += `┃ ⚔️ All ATK +${w.effects.atkBonus}\n`;
    if (w.effects.critPenalty) wm += `┃ 💥 CRIT ${w.effects.critPenalty}\n`;
    if (w.effects.dodgeBonus) wm += `┃ 💨 Dodge +${w.effects.dodgeBonus}%\n`;
    if (w.effects.spdPenalty) wm += `┃ 💨 SPD ${w.effects.spdPenalty}\n`;
    if (w.effects.waterBonus) wm += `┃ 💧 Water element +${w.effects.waterBonus}%\n`;
    wm += '╰━━━━━━━━━━━━━━━━━━━';
    await sock.sendMessage(sender, { text: wm }, { quoted: msg });
}

async function handleKarma(sock, sender, msg, participant, textMessage) {
    const kp = getPlayer(participant); if (!kp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const kl = getKarmaLevel(kp.rpg.karma || 0);
    await sock.sendMessage(sender, { text: `╭━━━〔 *☯️ KARMA* 〕━━━\n┃\n┃ ${kl.emoji} *${kl.name}*\n┃ ☯️ Karma: ${kp.rpg.karma || 0}\n┃\n┃ 🛒 Shop: ${kl.shopMod < 1 ? `${Math.round((1 - kl.shopMod) * 100)}% discount` : `${Math.round((kl.shopMod - 1) * 100)}% markup`}\n┃ ${kl.npcHostile ? '⚠️ NPC hostiles!' : '✅ NPC friendly'}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
}

async function handleStatus(sock, sender, msg, participant, textMessage) {
    const sp = getPlayer(participant); if (!sp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const w2 = updateWeather(); const t2 = getTimeMultipliers(); const kl2 = getKarmaLevel(sp.rpg.karma || 0);
    const durP = Math.floor(((sp.rpg.durability ?? MAX_DURABILITY) / MAX_DURABILITY) * 100);
    const staP = Math.floor(((sp.rpg.stamina || 0) / MAX_STAMINA) * 100);
    await sock.sendMessage(sender, { text: `╭━━━〔 *📊 STATUS* 〕━━━\n┃\n┃ ${t2.label} | ${w2.emoji} ${w2.name}\n┃\n┃ 🍖 Stamina: ${'█'.repeat(Math.floor(staP / 10))}${'░'.repeat(10 - Math.floor(staP / 10))} ${sp.rpg.stamina || 0}/${MAX_STAMINA}\n┃ 🗡️ Durability: ${'█'.repeat(Math.floor(durP / 10))}${'░'.repeat(10 - Math.floor(durP / 10))} ${sp.rpg.durability ?? MAX_DURABILITY}/${MAX_DURABILITY}\n┃ ☯️ Karma: ${kl2.emoji} ${kl2.name} (${sp.rpg.karma || 0})\n┃ 🔥 Element: ${sp.rpg.element || 'neutral'}\n┃ ${sp.rpg.isDead ? '💀 DEAD (Void Realm)' : '✅ Alive'}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
}

module.exports = { handleEat, handleRest, handleCamp, handleRepair, handleWeatherCmd, handleKarma, handleStatus };
