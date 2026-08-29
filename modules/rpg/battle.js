// ============================================================
// modules/rpg/battle.js — Hunt & Battle Handler
// ============================================================

const { getPlayer, updatePlayer } = require('../utility/db');
const { formatCoins } = require('../utility/currency');
const { getMonsterForLevel, getBuffedStats, runBattle, checkLevelUp, tickBuffs, trackQuest, checkAchievements, getPetStats, initRPG, updateWeather, getTimeLabel, getTimeMultipliers, getKarmaLevel } = require('./core');
const { generateBattleImage } = require('./battle-image');
const { delay } = require('@whiskeysockets/baileys');
const { RPG_CLASSES, RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_ITEMS, NPC_ENCOUNTERS, RANDOM_EVENTS, MAX_STAMINA, STAMINA_COSTS, STAMINA_REGEN_PER_HOUR, MAX_DURABILITY, DURABILITY_LOSS_PER_BATTLE, RPG_PETS } = require('../../config');

async function handleHunt(sock, sender, msg, participant, textMessage) {
    const hp = getPlayer(participant);
    if (!hp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class! Ketik *.role* dulu.' }, { quoted: msg }); return; }

    // Death check
    if (hp.rpg.isDead) {
        const { checkCooldown, formatCooldown } = require('../utility/db');
        const cr = checkCooldown(participant, 'respawn');
        if (cr > 0) { await sock.sendMessage(sender, { text: `💀 Masih di *Void Realm*!\n⏰ Respawn: *${formatCooldown(cr)}*\n💰 Atau *.respawn* (20 Silver)` }, { quoted: msg }); return; }
        hp.rpg.isDead = false; hp.rpg.hp = Math.floor(hp.rpg.maxHp * 0.3); updatePlayer(participant, hp);
    }

    // Cooldown check
    const { checkCooldown, formatCooldown } = require('../utility/db');
    const hcd = checkCooldown(participant, 'hunt');
    if (hcd > 0) { await sock.sendMessage(sender, { text: `⏰ Cooldown! Tunggu *${formatCooldown(hcd)}* lagi.` }, { quoted: msg }); return; }

    if (hp.rpg.hp <= 0) { hp.rpg.hp = Math.floor(hp.rpg.maxHp * 0.3); updatePlayer(participant, hp); }

    // Stamina regen
    const hp2 = getPlayer(participant);
    const hph = Math.floor((Date.now() - (hp2.rpg.lastStaminaRegen || Date.now())) / 3600000);
    if (hph > 0) { hp2.rpg.stamina = Math.min(MAX_STAMINA, (hp2.rpg.stamina || 0) + hph * STAMINA_REGEN_PER_HOUR); hp2.rpg.lastStaminaRegen = Date.now(); updatePlayer(participant, hp2); }

    if ((hp2.rpg.stamina || 0) < STAMINA_COSTS.hunt) { await sock.sendMessage(sender, { text: `❌ Stamina tidak cukup! (${hp2.rpg.stamina || 0}/${STAMINA_COSTS.hunt})\n💡 *.eat* atau *.rest*` }, { quoted: msg }); return; }

    hp2.rpg.stamina -= STAMINA_COSTS.hunt;
    hp2.rpg.durability = Math.max(0, (hp2.rpg.durability || MAX_DURABILITY) - DURABILITY_LOSS_PER_BATTLE);
    if (hp2.rpg.durability <= 0) await sock.sendMessage(sender, { text: '⚠️ Senjata RUSAK! Ketik *.repair*' }, { quoted: msg });
    updatePlayer(participant, hp2);

    // NPC Encounter (10%)
    if (Math.random() < 0.10) {
        const npc = NPC_ENCOUNTERS[Math.floor(Math.random() * NPC_ENCOUNTERS.length)];
        let nm = `╭━━━〔*${npc.name}*〕━━━\n┃ ${npc.desc}\n┃\n`;
        if (npc.type === 'heal') { hp2.rpg.hp = Math.min(hp2.rpg.maxHp, hp2.rpg.hp + npc.value); nm += `┃ ❤️ +${npc.value} HP!\n`; }
        else if (npc.type === 'repair') { hp2.rpg.durability = MAX_DURABILITY; nm += `┃ 🔧 Senjata diperbaiki!\n`; }
        else if (npc.type === 'info') { hp2.rpg.exp += npc.reward.exp; hp2.coins += npc.reward.coins; nm += `┃ 📗 +${npc.reward.exp} EXP | 🪙 +${formatCoins(npc.reward.coins)}\n`; }
        else if (npc.type === 'karma') { hp2.rpg.karma = (hp2.rpg.karma || 0) + npc.karmaGain; nm += `┃ ☯️ Karma +${npc.karmaGain}\n`; }
        updatePlayer(participant, hp2); nm += '╰━━━━━━━━━━━━━━━━━━━';
        await sock.sendMessage(sender, { text: nm }, { quoted: msg }); await delay(1500);
    }

    // Random Event (15%)
    if (Math.random() < 0.15) {
        const tc = RANDOM_EVENTS.reduce((a, b) => a + b.chance, 0);
        let roll = Math.random() * tc; let ev = RANDOM_EVENTS[0];
        for (const e of RANDOM_EVENTS) { roll -= e.chance; if (roll <= 0) { ev = e; break; } }
        let em = `╭━━━〔*${ev.name}*〕━━━\n┃\n┃ ${ev.desc}\n┃\n`;
        if (ev.type === 'buff') { hp2.rpg.buffs.push(ev.buff); updatePlayer(participant, hp2); em += `┃ ${ev.buff.name}: +${ev.buff.value} ${ev.buff.stat} (${ev.buff.duration}b)\n`; }
        else if (ev.type === 'treasure') { hp2.coins += ev.coinReward; hp2.rpg.exp += ev.expReward; updatePlayer(participant, hp2); em += `┃ 🪙 +${formatCoins(ev.coinReward)} | 📗 +${ev.expReward} EXP\n`; }
        else if (ev.type === 'chest') { hp2.coins += ev.coinReward; hp2.rpg.buffs.push({ ...ev.curse }); updatePlayer(participant, hp2); em += `┃ 🪙 +${formatCoins(ev.coinReward)}\n┃ ☠️ Curse: ${ev.curse.name}\n`; }
        else if (ev.type === 'dungeon') { hp2.rpg.dungeonFloor = (hp2.rpg.dungeonFloor || 0) + ev.bonusFloors; updatePlayer(participant, hp2); em += `┃ 🗺️ Teleport +${ev.bonusFloors} floors!\n`; }
        em += '╰━━━━━━━━━━━━━━━━━━━';
        await sock.sendMessage(sender, { text: em }, { quoted: msg }); await delay(1500);
    }

    const mon = getMonsterForLevel(hp2.rpg.level);
    const hs = getBuffedStats(hp2.rpg);
    const dn = hp2.displayName || participant.split('@')[0];
    const cl = RPG_CLASSES[hp2.rpg.class];
    const hw = RPG_WEAPONS[hp2.rpg.weapon], ha = RPG_ARMORS[hp2.rpg.armor], hsh = RPG_SHIELDS[hp2.rpg.shield];
    const rv = (hp2.rpg.inventory || []).includes('revive_stone');

    await sock.sendMessage(sender, { text: `🌲 *${dn} memasuki hutan...*\n\n${mon.emoji} *${mon.name}* muncul!\n👹 HP:${mon.hp} ATK:${mon.atk} DEF:${mon.def}\n\n${cl.emoji} *${dn}* (Lv${hp2.rpg.level})\n⚔️ ATK:${hs.atk} | 🛡️ DEF:${hs.def} | 💨 SPD:${hs.spd}\n🗡️ ${hw?.name || '-'} | 🥋 ${ha?.name || '-'} | 🔰 ${hsh?.name || '-'}\n\n⚔️ _Battle dimulai!_` }, { quoted: msg });
    await delay(1500);

    const bat = await runBattle({ hp: hp2.rpg.hp, maxHp: hs.maxHp, stats: hs, hasRevive: rv }, mon, sock, sender);
    const lc = []; let ck = '';
    for (const l of bat.log) { ck += l + '\n'; if (ck.length > 500) { lc.push(ck); ck = ''; } }
    if (ck) lc.push(ck);
    for (const c of lc) { await sock.sendMessage(sender, { text: c.trim() }); await delay(1000); }

    hp2.rpg.hp = bat.playerHp;
    if (bat.usedRevive) { const ri = hp2.rpg.inventory.indexOf('revive_stone'); if (ri !== -1) hp2.rpg.inventory.splice(ri, 1); }

    if (bat.won) {
        const cd = Math.floor(Math.random() * (mon.coinMax - mon.coinMin + 1)) + mon.coinMin;
        hp2.rpg.exp += mon.exp; hp2.rpg.monstersKilled++; hp2.coins += cd;
        let lm = ''; 
        if (Math.random() * 100 < mon.lootChance) { 
            hp2.rpg.inventory.push(mon.loot); 
            const li = RPG_ITEMS[mon.loot] || RPG_WEAPONS[mon.loot]; 
            lm += `\n🎁 Loot: ${li?.emoji || '📦'} *${li?.name || mon.loot}*`; 
        }
        
        // Universal Drop System (30% chance for random consumable)
        if (Math.random() < 0.30) {
            const universalPool = ['ramuan_hp', 'ramuan_hp_sedang', 'scroll_api', 'scroll_es', 'batu_exp', 'ramuan_kekuatan'];
            const ud = universalPool[Math.floor(Math.random() * universalPool.length)];
            hp2.rpg.inventory.push(ud);
            const ui = RPG_ITEMS[ud];
            lm += `\n✨ Extra Drop: ${ui?.emoji || '📦'} *${ui?.name || ud}*`;
        }
        
        updatePlayer(participant, hp2);
        const nl = checkLevelUp(participant); tickBuffs(participant);
        const hq = trackQuest(participant, 'kill'); trackQuest(participant, 'earn_coin', cd); checkAchievements(participant);
        let pm = ''; const hpa = getPlayer(participant);
        if (!hpa.rpg.pet && Math.random() < 0.10) { const pk = Object.keys(RPG_PETS); const pi = pk[Math.floor(Math.random() * pk.length)]; const pd = RPG_PETS[pi]; hpa.rpg.pet = { id: pi, level: 1, exp: 0, evolved: false, customName: null }; updatePlayer(participant, hpa); pm = `\n\n🐾 *PET FOUND!* ${pd.emoji} ${pd.name} bergabung!`; }
        let rm = `🏆 *VICTORY!*\n\n${cl.emoji} *${dn}* mengalahkan ${mon.emoji} *${mon.name}*!\n\n⭐ +${mon.exp} EXP | 🪙 +${formatCoins(cd)}${lm}${pm}`;
        if (nl) rm += `\n\n🎉 *LEVEL UP! Level ${nl}*\n+10 HP | +3 ATK | +2 DEF | +1 SPD`;
        if (hq) rm += `\n\n🎯 *QUEST COMPLETE!* +${hq.reward.exp} EXP +${formatCoins(hq.reward.coins)}`;
        rm += `\n\n❤️ HP: ${hp2.rpg.hp}/${getPlayer(participant).rpg.maxHp}`;
        try { const img = await generateBattleImage(dn, hp2.rpg.class, mon.name, true, mon.pin); await sock.sendMessage(sender, { image: img, caption: rm }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: rm }, { quoted: msg }); }
    } else {
        hp2.rpg.losses++; hp2.rpg.hp = Math.floor(hp2.rpg.maxHp * 0.3); updatePlayer(participant, hp2); tickBuffs(participant);
        const dm = `💀 *DEFEATED!*\n\n${mon.emoji} *${mon.name}* terlalu kuat!\n${cl.emoji} ${dn} dikalahkan...\n❤️ HP direset ke ${hp2.rpg.hp}/${hp2.rpg.maxHp}\n\n_Gunakan *.use ramuan_hp* untuk heal_`;
        try { const img = await generateBattleImage(dn, hp2.rpg.class, mon.name, false, mon.pin); await sock.sendMessage(sender, { image: img, caption: dm }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: dm }, { quoted: msg }); }
    }
}

module.exports = { handleHunt };
