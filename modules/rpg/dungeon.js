// ============================================================
// modules/rpg/dungeon.js — Dungeon, World Boss, Dark World, Invasion
// ============================================================

const { getPlayer, updatePlayer, getDisplayName, isOwner, checkCooldown, formatCooldown, playerCooldowns, activeWorldBoss, activeDemonInvasion } = require('../utility/db');
const { formatCoins } = require('../utility/currency');
const { DUNGEON_COOLDOWN, WORLD_BOSS_POOL, WORLD_BOSS_DURATION, DARK_MONSTERS, DARK_WORLD_DURATION, CURSES, VOID_EVENTS, STORY_CHAPTERS, STORY_TITLES, DEMON_INVASION_PHASES, MAX_STAMINA, STAMINA_COSTS, MAX_DURABILITY, DURABILITY_LOSS_PER_BATTLE, RPG_ITEMS, RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_CLASSES, RPG_SUMMONS, WEAPON_AWAKENINGS, FRAME } = require('../../config');
const { getDungeonMonster, getBuffedStats, quickBattle, checkLevelUp, trackQuest, checkAchievements, tickBuffs, getRaidBoss, RPG_RAIDS, updateWeather, getTimeLabel, getTimeMultipliers, getKarmaLevel } = require('./core');
const { delay } = require('@whiskeysockets/baileys');

async function handleDungeon(sock, sender, msg, participant, textMessage) {
    const dp = getPlayer(participant); if (!dp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const now = Date.now();
    if (dp.rpg.lastDungeon && (now - dp.rpg.lastDungeon) < DUNGEON_COOLDOWN) { const rem = DUNGEON_COOLDOWN - (now - dp.rpg.lastDungeon); await sock.sendMessage(sender, { text: `⏰ Cooldown! Tunggu *${Math.ceil(rem / 1000)}s* lagi.` }, { quoted: msg }); return; }
    const floor = (dp.rpg.dungeonFloor || 0) + 1;
    if (floor > 100) { await sock.sendMessage(sender, { text: '🏆 Kamu sudah clear semua 100 floor! MAX!' }, { quoted: msg }); return; }
    const mob = getDungeonMonster(floor); dp.rpg.lastDungeon = now; updatePlayer(participant, dp);
    await sock.sendMessage(sender, { text: `╭━━━〔 *🗺️ DUNGEON F${floor}* 〕━━━\n┃\n┃ ${mob.emoji} *${mob.name}* ${mob.isBoss ? '👑 BOSS!' : ''}\n┃ ❤️ ${mob.hp} | ⚔️ ${mob.atk} | 🛡️ ${mob.def}\n┃\n╰ ⚔️ *Pertarungan dimulai...*` }, { quoted: msg });
    await delay(2000);
    const dgStats = getBuffedStats(dp.rpg); const hasRev = dp.rpg.inventory.includes('revive_stone');
    const battle = quickBattle(dgStats, mob, hasRev);
    if (battle.won) {
        dp.rpg.dungeonFloor = floor; dp.rpg.monstersKilled++;
        const coinAmount = mob.coinMin + Math.floor(Math.random() * (mob.coinMax - mob.coinMin + 1));
        dp.rpg.exp += mob.exp; dp.coins += coinAmount;
        let lootMsg = ''; 
        if (Math.random() * 100 < mob.lootChance && mob.loot) { 
            dp.rpg.inventory.push(mob.loot); 
            lootMsg += `\n┃ 📦 Loot: ${RPG_ITEMS[mob.loot]?.emoji || '📦'} ${RPG_ITEMS[mob.loot]?.name || mob.loot}`; 
        }
        
        // Universal Drop System (40% chance in Dungeon)
        if (Math.random() < 0.40) {
            const universalPool = ['ramuan_hp_sedang', 'ramuan_hp_besar', 'scroll_kritis', 'jimat_dodge', 'batu_exp', 'scroll_teleport', 'peti_misteri'];
            const ud = universalPool[Math.floor(Math.random() * universalPool.length)];
            dp.rpg.inventory.push(ud);
            const ui = RPG_ITEMS[ud] || { emoji: '📦', name: ud };
            lootMsg += `\n┃ ✨ Extra Drop: ${ui.emoji} ${ui.name}`;
        }
        
        updatePlayer(participant, dp); checkLevelUp(participant);
        const qr = trackQuest(participant, 'dungeon'); trackQuest(participant, 'kill'); trackQuest(participant, 'earn_coin', coinAmount); checkAchievements(participant);
        let winMsg = `╭━━━〔 *🗺️ F${floor} CLEAR!* 〕━━━\n┃\n┃ 📗 +${mob.exp} EXP | 🪙 +${formatCoins(coinAmount)}${lootMsg}\n┃ 🗺️ Floor: *${floor}/100*\n╰━━━━━━━━━━━━━━━━━━━`;
        if (qr) winMsg += `\n\n🎯 *QUEST COMPLETE!* +${qr.reward.exp} EXP +${formatCoins(qr.reward.coins)}`;
        await sock.sendMessage(sender, { text: winMsg }, { quoted: msg });
    } else {
        dp.rpg.hp = Math.max(1, Math.floor(dp.rpg.maxHp * 0.3)); updatePlayer(participant, dp);
        await sock.sendMessage(sender, { text: `╭━━━〔 *🗺️ F${floor} GAGAL* 〕━━━\n┃\n┃ 💀 Kalah di floor ${floor}!\n┃ ❤️ HP dipulihkan 30%\n┃ 💡 Upgrade gear & coba lagi!\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
    }
}

async function handleDungeonInfo(sock, sender, msg, participant, textMessage) {
    const dp = getPlayer(participant); if (!dp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const nf = (dp.rpg.dungeonFloor || 0) + 1; const nm = getDungeonMonster(nf > 100 ? 100 : nf);
    await sock.sendMessage(sender, { text: `╭━━━〔 *🗺️ DUNGEON INFO* 〕━━━\n┃\n┃ 🗺️ Current: Floor *${dp.rpg.dungeonFloor || 0}*\n┃ ⏭️ Next: F${nf} — ${nm.emoji} ${nm.name} ${nm.isBoss ? '👑BOSS' : ''}\n┃   ❤️${nm.hp} ⚔️${nm.atk} 🛡️${nm.def}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
}

async function handleWorldBoss(sock, sender, msg, participant, textMessage) {
    if (!activeWorldBoss) {
        if (!isOwner(participant)) { await sock.sendMessage(sender, { text: '❌ Tidak ada World Boss aktif!\n💡 Owner: *.worldboss spawn*' }, { quoted: msg }); return; }
        if (textMessage?.toLowerCase()?.includes('spawn')) {
            const boss = WORLD_BOSS_POOL[Math.floor(Math.random() * WORLD_BOSS_POOL.length)];
            activeWorldBoss = { ...boss, hp: boss.baseHp, maxHp: boss.baseHp, attackers: {}, startTime: Date.now() };
            setTimeout(() => { activeWorldBoss = null; }, WORLD_BOSS_DURATION);
            await sock.sendMessage(sender, { text: `╭━━━〔 *🎪 WORLD BOSS!* 〕━━━\n┃\n┃ ${boss.emoji} *${boss.name}*\n┃ ❤️ HP: ${boss.baseHp}\n┃ ⚔️ ATK: ${boss.atk}\n┃\n┃ ⏰ 30 menit! Semua serang!\n┃ Ketik *.wbattack*\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); return;
        }
        await sock.sendMessage(sender, { text: '📌 *.worldboss spawn* untuk summon' }, { quoted: msg }); return;
    }
    const hpP = Math.floor(activeWorldBoss.hp / activeWorldBoss.maxHp * 100);
    const bar = '█'.repeat(Math.floor(hpP / 10)) + '░'.repeat(10 - Math.floor(hpP / 10));
    const ta = Object.entries(activeWorldBoss.attackers).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let wb = `╭━━━〔 *🎪 WORLD BOSS* 〕━━━\n┃\n┃ ${activeWorldBoss.emoji} *${activeWorldBoss.name}*\n┃ ❤️ [${bar}] ${activeWorldBoss.hp}/${activeWorldBoss.maxHp}\n┃\n┃ 🏆 Top Damage:\n`;
    for (let i = 0; i < ta.length; i++) wb += `┃  ${i + 1}. ${getDisplayName(ta[i][0])} — ${ta[i][1]} dmg\n`;
    wb += '╰━━━━━━━━━━━━━━━━━━━';
    await sock.sendMessage(sender, { text: wb }, { quoted: msg });
}

async function handleWbAttack(sock, sender, msg, participant, textMessage) {
    if (!activeWorldBoss) { await sock.sendMessage(sender, { text: '❌ Tidak ada World Boss aktif!' }, { quoted: msg }); return; }
    const wbP = getPlayer(participant); if (!wbP.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (activeWorldBoss.attackers[participant]) { await sock.sendMessage(sender, { text: '❌ Kamu sudah attack boss ini!' }, { quoted: msg }); return; }
    const wbS = getBuffedStats(wbP.rpg);
    const dmg = Math.max(10, Math.floor(wbS.atk * (1.5 + Math.random()) - activeWorldBoss.atk * 0.1));
    activeWorldBoss.attackers[participant] = dmg; activeWorldBoss.hp -= dmg;
    await sock.sendMessage(sender, { text: `⚔️ *${getDisplayName(participant)}* menyerang ${activeWorldBoss.emoji} *${activeWorldBoss.name}*!\n\n💥 Damage: *${dmg}*\n❤️ Boss HP: ${Math.max(0, activeWorldBoss.hp)}/${activeWorldBoss.maxHp}` }, { quoted: msg });
    if (activeWorldBoss.hp <= 0) {
        const rew = activeWorldBoss.reward; let rm = `╭━━━〔 *🎪 BOSS DEFEATED!* 〕━━━\n┃\n┃ ${activeWorldBoss.emoji} *${activeWorldBoss.name}* kalah!\n┃\n┃ 🏆 Rewards:\n`;
        for (const [pid, pdmg] of Object.entries(activeWorldBoss.attackers)) { const p = getPlayer(pid); const ca = rew.coinMin + Math.floor(Math.random() * (rew.coinMax - rew.coinMin + 1)); p.coins += ca; if (p.rpg) p.rpg.exp += rew.exp; updatePlayer(pid, p); checkLevelUp(pid); rm += `┃ 🪙 ${getDisplayName(pid)}: +${formatCoins(ca)} +${rew.exp}EXP (${pdmg}dmg)\n`; }
        rm += '╰━━━━━━━━━━━━━━━━━━━'; activeWorldBoss = null; await sock.sendMessage(sender, { text: rm }, { quoted: msg });
    }
}

async function handleDarkWorld(sock, sender, msg, participant, textMessage) {
    const dp = getPlayer(participant); if (!dp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const dwCD = checkCooldown(participant, 'darkworld');
    if (dwCD > 0) { await sock.sendMessage(sender, { text: `⏰ Cooldown: *${formatCooldown(dwCD)}*` }, { quoted: msg }); return; }
    if (dp.rpg.level < 10) { await sock.sendMessage(sender, { text: '❌ Butuh minimal Level 10!' }, { quoted: msg }); return; }
    const dm = DARK_MONSTERS[Math.floor(Math.random() * DARK_MONSTERS.length)];
    await sock.sendMessage(sender, { text: `╭━━━〔 *🌙 DARK WORLD* 〕━━━\n┃\n┃ ${dm.emoji} *${dm.name}* muncul!\n┃ ❤️${dm.hp} ⚔️${dm.atk} 🛡️${dm.def}\n┃\n╰ ⚔️ Pertarungan dimulai...` }, { quoted: msg });
    await delay(2000);
    const dwS = getBuffedStats(dp.rpg); const dwB = quickBattle(dwS, dm, dp.rpg.inventory.includes('revive_stone'));
    if (dwB.won) {
        const ca = dm.coinMin + Math.floor(Math.random() * (dm.coinMax - dm.coinMin + 1));
        dp.rpg.exp += dm.exp; dp.coins += ca; dp.rpg.monstersKilled++;
        let loot = ''; if (Math.random() * 100 < dm.lootChance && dm.loot) { dp.rpg.inventory.push(dm.loot); loot = `\n┃ 📦 ${dm.loot}`; }
        updatePlayer(participant, dp); checkLevelUp(participant); trackQuest(participant, 'kill'); checkAchievements(participant);
        await sock.sendMessage(sender, { text: `╭━━━〔 *🌙 DARK VICTORY!* 〕━━━\n┃\n┃ 📗 +${dm.exp} EXP | 🪙 +${ca}${loot}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
    } else {
        dp.rpg.isDead = true; dp.rpg.hp = 0; const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
        dp.rpg.buffs.push({ name: curse.name, stat: curse.stat, value: curse.value, duration: curse.duration }); updatePlayer(participant, dp);
        playerCooldowns[participant] = playerCooldowns[participant] || {}; playerCooldowns[participant].respawn = Date.now();
        await sock.sendMessage(sender, { text: `╭━━━〔 *💀 DARK DEATH* 〕━━━\n┃\n┃ Kalah di Dark World!\n┃ ☠️ ${curse.emoji} ${curse.name}\n┃ 💀 Masuk Void Realm...\n┃ ⏰ Respawn: 10 menit atau *.respawn* (20 Silver)\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
    }
}

async function handleRespawn(sock, sender, msg, participant, textMessage) {
    const rp = getPlayer(participant); if (!rp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (!rp.rpg.isDead) { await sock.sendMessage(sender, { text: '✅ Kamu masih hidup!' }, { quoted: msg }); return; }
    if (rp.coins < 1000) { await sock.sendMessage(sender, { text: '❌ Butuh 20 Silver! Atau tunggu respawn otomatis.' }, { quoted: msg }); return; }
    rp.coins -= 1000; rp.rpg.isDead = false; rp.rpg.hp = Math.floor(rp.rpg.maxHp * 0.5); updatePlayer(participant, rp);
    const ve = VOID_EVENTS[Math.floor(Math.random() * VOID_EVENTS.length)];
    let vm = `╭━━━〔 *💀 VOID REALM* 〕━━━\n┃\n┃ ${ve.emoji} *${ve.name}*\n┃ 📖 ${ve.desc}\n┃ ${ve.msg}\n`;
    if (ve.type === 'buff') rp.rpg.buffs.push({ name: ve.name, stat: ve.effect.stat, value: ve.effect.value, duration: ve.effect.duration });
    if (ve.type === 'coin') rp.coins += ve.value;
    if (ve.type === 'exp') rp.rpg.exp += ve.value;
    if (ve.type === 'item') rp.rpg.inventory.push(ve.item);
    if (ve.type === 'curse') rp.rpg.buffs.push({ name: ve.name, stat: ve.effect.stat, value: ve.effect.value, duration: ve.effect.duration });
    updatePlayer(participant, rp);
    vm += `┃\n┃ ✅ Respawn! HP: ${rp.rpg.hp}\n╰━━━━━━━━━━━━━━━━━━━`;
    await sock.sendMessage(sender, { text: vm }, { quoted: msg });
}

async function handleInvasion(sock, sender, msg, participant, textMessage) {
    if (!activeDemonInvasion) {
        if (!isOwner(participant)) { await sock.sendMessage(sender, { text: '❌ Tidak ada invasion aktif!\n💡 Owner: *.invasion start*' }, { quoted: msg }); return; }
        if (textMessage?.toLowerCase()?.includes('start')) {
            const p1 = DEMON_INVASION_PHASES[0]; activeDemonInvasion = { phase: 1, ...p1, hp: p1.hp, maxHp: p1.hp, attackers: {}, startTime: Date.now() };
            setTimeout(() => { activeDemonInvasion = null; }, 30 * 60 * 1000);
            await sock.sendMessage(sender, { text: `╭━━━〔 *👿 DEMON INVASION!* 〕━━━\n┃\n┃ Phase 1: ${p1.emoji} *${p1.name}*\n┃ ❤️ ${p1.hp} | ⚔️ ${p1.atk}\n┃\n┃ ⏰ 30 menit! *.invattack*\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); return;
        }
        return;
    }
    const hpP = Math.floor(activeDemonInvasion.hp / activeDemonInvasion.maxHp * 100);
    const bar = '█'.repeat(Math.floor(hpP / 10)) + '░'.repeat(10 - Math.floor(hpP / 10));
    await sock.sendMessage(sender, { text: `╭━━━〔 *👿 INVASION P${activeDemonInvasion.phase}* 〕━━━\n┃ ${activeDemonInvasion.emoji} *${activeDemonInvasion.name}*\n┃ ❤️ [${bar}] ${activeDemonInvasion.hp}/${activeDemonInvasion.maxHp}\n┃ 👥 ${Object.keys(activeDemonInvasion.attackers).length} attackers\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
}

async function handleInvAttack(sock, sender, msg, participant, textMessage) {
    if (!activeDemonInvasion) { await sock.sendMessage(sender, { text: '❌ Tidak ada invasion aktif!' }, { quoted: msg }); return; }
    const ivP = getPlayer(participant); if (!ivP.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (activeDemonInvasion.attackers[participant]) { await sock.sendMessage(sender, { text: '❌ Sudah attack phase ini!' }, { quoted: msg }); return; }
    const ivS = getBuffedStats(ivP.rpg); const dmg = Math.max(10, Math.floor(ivS.atk * (1.5 + Math.random())));
    activeDemonInvasion.attackers[participant] = dmg; activeDemonInvasion.hp -= dmg;
    await sock.sendMessage(sender, { text: `⚔️ Attack! 💥 ${dmg} damage\n❤️ ${Math.max(0, activeDemonInvasion.hp)}/${activeDemonInvasion.maxHp}` }, { quoted: msg });
    if (activeDemonInvasion.hp <= 0) {
        const rew = activeDemonInvasion.reward;
        for (const [pid] of Object.entries(activeDemonInvasion.attackers)) { const p = getPlayer(pid); const ca = rew.coinMin + Math.floor(Math.random() * (rew.coinMax - rew.coinMin + 1)); p.coins += ca; if (p.rpg) p.rpg.exp += rew.exp; updatePlayer(pid, p); checkLevelUp(pid); }
        const nextPhase = DEMON_INVASION_PHASES.find(p => p.phase === activeDemonInvasion.phase + 1);
        if (nextPhase) { activeDemonInvasion = { phase: nextPhase.phase, ...nextPhase, hp: nextPhase.hp, maxHp: nextPhase.hp, attackers: {}, startTime: Date.now() }; await sock.sendMessage(sender, { text: `╭━━━〔 *👿 PHASE ${nextPhase.phase}!* 〕━━━\n┃ ${nextPhase.emoji} *${nextPhase.name}*\n┃ ❤️ ${nextPhase.hp}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); }
        else { activeDemonInvasion = null; await sock.sendMessage(sender, { text: '🏆 *DEMON KING DEFEATED!*\nAll rewards distributed!' }, { quoted: msg }); }
    }
}

async function handleStory(sock, sender, msg, participant, textMessage) {
    const sp = getPlayer(participant); if (!sp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const ch = (sp.rpg.storyChapter || 0) + 1; const chapter = STORY_CHAPTERS.find(c => c.ch === ch);
    if (!chapter) { await sock.sendMessage(sender, { text: '🏆 Semua 10 chapter selesai!\n🌟 *True Isekai Hero!*' }, { quoted: msg }); return; }
    if (sp.rpg.level < chapter.reqLevel) { await sock.sendMessage(sender, { text: `❌ Chapter ${ch} butuh Level ${chapter.reqLevel}! (kamu Lv${sp.rpg.level})` }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: `╭━━━〔 *📜 CH.${ch}: ${chapter.title}* 〕━━━\n┃\n┃ 📖 ${chapter.desc}\n┃\n┃ 👹 BOSS: *${chapter.bossName}*\n┃ ❤️${chapter.bossHp} ⚔️${chapter.bossAtk} 🛡️${chapter.bossDef}\n╰ ⚔️ Pertarungan dimulai...` }, { quoted: msg });
    await delay(2000);
    const soS = getBuffedStats(sp.rpg); const soB = quickBattle(soS, { hp: chapter.bossHp, atk: chapter.bossAtk, def: chapter.bossDef, spd: 10 }, sp.rpg.inventory.includes('revive_stone'));
    if (soB.won) {
        sp.rpg.storyChapter = ch; sp.rpg.exp += chapter.reward.exp; sp.coins += chapter.reward.coins;
        if (chapter.reward.item) sp.rpg.inventory.push(chapter.reward.item);
        if (chapter.reward.title && !(sp.rpg.achievements || []).includes(chapter.reward.title)) sp.rpg.achievements.push(chapter.reward.title);
        updatePlayer(participant, sp); checkLevelUp(participant);
        const next = STORY_CHAPTERS.find(c => c.ch === ch + 1);
        await sock.sendMessage(sender, { text: `╭━━━〔 *📜 CH.${ch} CLEAR!* 〕━━━\n┃\n┃ 📗 +${chapter.reward.exp} EXP | 🪙 +${formatCoins(chapter.reward.coins)}${chapter.reward.title ? '\n┃ 🎖️ Title: ' + (STORY_TITLES[chapter.reward.title]?.name || '') : ''}${chapter.reward.item ? '\n┃ 📦 ' + chapter.reward.item : ''}\n┃${next ? `\n┃ ⏭️ Next: Ch.${next.ch} — ${next.title} (Lv${next.reqLevel})` : '\n┃ 🏆 STORY COMPLETE!'}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
    } else { sp.rpg.hp = Math.max(1, Math.floor(sp.rpg.maxHp * 0.3)); updatePlayer(participant, sp); await sock.sendMessage(sender, { text: `💀 Kalah di Ch.${ch}! Level up & coba lagi.` }, { quoted: msg }); }
}

async function handleSummon(sock, sender, msg, participant, textMessage) {
    const sm = getPlayer(participant); if (!sm.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const sa = textMessage?.toLowerCase()?.replace(/\s+/g, '_');
    if (!sa) {
        if (sm.rpg.summon) { const s = RPG_SUMMONS[sm.rpg.summon]; if (s) { await sock.sendMessage(sender, { text: `╭━━━〔 *🧬 FAMILIAR* 〕━━━\n┃\n┃ ${s.emoji} *${s.name}*\n┃ 🔥 ${s.element} | ⚔️+${s.atk} 🛡️+${s.def}\n┃ 🌀 ${s.skill}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); return; } }
        let st = `╭━━━〔 *🧬 SUMMON* 〕━━━\n┃ Kamu belum punya summon!\n┃\n┃ *.summon roll* (15 Silver)\n┃\n`;
        for (const [id, s] of Object.entries(RPG_SUMMONS)) st += `┃ ${s.emoji} ${s.name} (${s.element}) ATK+${s.atk}\n`;
        st += '╰━━━━━━━━━━━━━━━━━━━'; await sock.sendMessage(sender, { text: st }, { quoted: msg }); return;
    }
    if (sa === 'roll') {
        if (sm.coins < 750) { await sock.sendMessage(sender, { text: '❌ Butuh 15 Silver!' }, { quoted: msg }); return; }
        sm.coins -= 750; const keys = Object.keys(RPG_SUMMONS); const sid = keys[Math.floor(Math.random() * keys.length)]; sm.rpg.summon = sid; updatePlayer(participant, sm);
        const s = RPG_SUMMONS[sid]; await sock.sendMessage(sender, { text: `🧬 *SUMMON!*\n\n${s.emoji} *${s.name}* bergabung!\n🔥 ${s.element} | ⚔️+${s.atk} 🛡️+${s.def}\n🌀 ${s.skill}` }, { quoted: msg });
    }
}

async function handleAwaken(sock, sender, msg, participant, textMessage) {
    const ap = getPlayer(participant); if (!ap.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (ap.rpg.weaponAwakened) { await sock.sendMessage(sender, { text: '✨ Senjata sudah awakened!' }, { quoted: msg }); return; }
    const awk = WEAPON_AWAKENINGS[ap.rpg.weapon];
    if (!awk) { await sock.sendMessage(sender, { text: '❌ Senjata ini tidak bisa di-awaken!\n💡 Butuh senjata tier 5' }, { quoted: msg }); return; }
    const stones = ap.rpg.inventory.filter(i => i === 'awakening_stone').length;
    if (stones < awk.stoneReq) { await sock.sendMessage(sender, { text: `❌ Butuh ${awk.stoneReq}x 🌟 Awakening Stone! Punya: ${stones}` }, { quoted: msg }); return; }
    if (ap.coins < awk.cost) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(awk.cost)}!` }, { quoted: msg }); return; }
    for (let i = 0; i < awk.stoneReq; i++) { const idx = ap.rpg.inventory.indexOf('awakening_stone'); if (idx >= 0) ap.rpg.inventory.splice(idx, 1); }
    ap.coins -= awk.cost; ap.rpg.weaponAwakened = true; ap.rpg.atk += awk.atkBonus; updatePlayer(participant, ap);
    await sock.sendMessage(sender, { text: `╭━━━〔 *✨ WEAPON AWAKENED!* 〕━━━\n┃\n┃ ${awk.emoji} *${awk.name}*\n┃ ⚔️ ATK +${awk.atkBonus}\n┃ 🌟 ${awk.special}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
}

async function handleEnchant(sock, sender, msg, participant, textMessage) {
    const ep = getPlayer(participant); if (!ep.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const cur = ep.rpg.weaponEnchant || 0; const next = cur + 1; if (next > 7) { await sock.sendMessage(sender, { text: '✨ Senjata sudah +7 MAX!' }, { quoted: msg }); return; }
    const hasStone = ep.rpg.inventory.indexOf('enchant_stone');
    if (hasStone === -1) { await sock.sendMessage(sender, { text: `❌ Butuh 💎 Batu Enchant!\n\nCara dapat:\n• *.craft enchant_stone* (3x Batu EXP)\n• Drop dari boss dungeon\n\n📊 Senjata: +${cur} → +${next} (${ENCHANT_RATES[next]}% success)` }, { quoted: msg }); return; }
    ep.rpg.inventory.splice(hasStone, 1);
    const success = Math.random() * 100 < ENCHANT_RATES[next];
    if (success) { ep.rpg.weaponEnchant = next; updatePlayer(participant, ep); const wep = RPG_WEAPONS[ep.rpg.weapon]; await sock.sendMessage(sender, { text: `╭━━━〔 *✨ ENCHANT +${next}!* 〕━━━\n┃\n┃ ✅ BERHASIL!\n┃ 🗡️ ${wep?.name || 'Weapon'} +${next}\n┃ ⚔️ ATK +${next * ENCHANT_ATK_BONUS} bonus\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); }
    else { ep.rpg.weaponEnchant = Math.max(0, cur - 1); updatePlayer(participant, ep); await sock.sendMessage(sender, { text: `╭━━━〔 *💥 ENCHANT GAGAL!* 〕━━━\n┃\n┃ ❌ Enchant gagal!\n┃ 💎 Batu Enchant hilang\n┃ 📉 Enchant turun ke +${ep.rpg.weaponEnchant}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); }
}

async function handlePet(sock, sender, msg, participant, textMessage) {
    const pp = getPlayer(participant); if (!pp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const pa = textMessage?.toLowerCase()?.trim();
    if (!pp.rpg.pet) { await sock.sendMessage(sender, { text: '🐾 Kamu belum punya pet!\n\n💡 Pet bisa didapat dari:\n• *.hunt* (10% drop chance)\n• Boss dungeon drop' }, { quoted: msg }); return; }
    if (pa === 'feed') {
        if (pp.coins < 500) { await sock.sendMessage(sender, { text: '❌ Butuh 10 Silver untuk feed pet!' }, { quoted: msg }); return; }
        pp.coins -= 500; pp.rpg.pet.exp += 50;
        const { RPG_PETS, RPG_PETS_EVOLVED } = require('../../config');
        let lm = ''; const per = pp.rpg.pet.level * 80;
        while (pp.rpg.pet.exp >= per) { pp.rpg.pet.exp -= per; pp.rpg.pet.level++; lm = `\n🎉 Pet LEVEL UP! Lv${pp.rpg.pet.level}`; }
        if (pp.rpg.pet.level >= 10 && !pp.rpg.pet.evolved) { const base = RPG_PETS[pp.rpg.pet.id]; if (base?.evolveTo) { pp.rpg.pet.id = base.evolveTo; pp.rpg.pet.evolved = true; lm += `\n✨ *PET EVOLVED!* → ${RPG_PETS_EVOLVED[base.evolveTo]?.name || base.evolveTo}`; } }
        updatePlayer(participant, pp); checkAchievements(participant);
        await sock.sendMessage(sender, { text: `🍖 Pet diberi makan! +50 EXP${lm}\n🪙 Sisa: ${formatCoins(pp.coins)}` }, { quoted: msg }); return;
    }
    if (pa?.startsWith('rename ')) { pp.rpg.pet.customName = pa.slice(7).trim().slice(0, 20); updatePlayer(participant, pp); await sock.sendMessage(sender, { text: `✅ Pet renamed: *${pp.rpg.pet.customName}*` }, { quoted: msg }); return; }
    const ps = getPetStats(pp.rpg.pet); const per2 = pp.rpg.pet.level * 80;
    await sock.sendMessage(sender, { text: `╭━━━〔 *🐾 PET INFO* 〕━━━\n┃\n┃ ${ps.emoji} *${ps.name}* Lv${pp.rpg.pet.level}\n┃ 📊 EXP: ${pp.rpg.pet.exp}/${per2}\n┃ ${pp.rpg.pet.evolved ? '✨ EVOLVED' : '🔄 Evolve at Lv10'}\n┃\n┃ ⚔️ ATK +${ps.atk} | 🛡️ DEF +${ps.def} | 💚 Heal ${ps.heal}/turn\n┃\n╰━━━━━━━━━━━━━━━━━━━\n🍖 *.pet feed* (${formatCoins(500)}) | ✏️ *.pet rename <nama>*` }, { quoted: msg });
}

const activeParties = {};

async function handleParty(sock, sender, msg, participant, textMessage) {
    const dp = getPlayer(participant); if (!dp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const args = textMessage.toLowerCase().trim().split(/\s+/);
    const cmd = args[0] || 'info';

    const findMyParty = (jid) => {
        for (const host in activeParties) {
            if (activeParties[host].members.includes(jid)) return activeParties[host];
        }
        return null;
    };

    if (cmd === 'create') {
        if (findMyParty(participant)) { await sock.sendMessage(sender, { text: '❌ Kamu sudah di dalam party!' }, { quoted: msg }); return; }
        activeParties[participant] = { host: participant, members: [participant], max: 5 };
        await sock.sendMessage(sender, { text: `✅ *Party Dibuat!*\n\n👑 Host: @${participant.split('@')[0]}\n👥 Anggota: 1/5\n\nTemanmu bisa ketik: *.party join @${participant.split('@')[0]}*`, mentions: [participant] }, { quoted: msg });
        return;
    }

    if (cmd === 'join') {
        if (findMyParty(participant)) { await sock.sendMessage(sender, { text: '❌ Kamu sudah di dalam party!' }, { quoted: msg }); return; }
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentioned.length) { await sock.sendMessage(sender, { text: '📌 Tag host party-nya: *.party join @host*' }, { quoted: msg }); return; }
        const host = mentioned[0];
        const party = activeParties[host];
        if (!party) { await sock.sendMessage(sender, { text: '❌ Party tidak ditemukan atau host sudah bubar.' }, { quoted: msg }); return; }
        if (party.members.length >= party.max) { await sock.sendMessage(sender, { text: '❌ Party penuh (Max 5)!' }, { quoted: msg }); return; }
        
        party.members.push(participant);
        await sock.sendMessage(sender, { text: `✅ Berhasil bergabung ke party @${host.split('@')[0]}!\n👥 Total: ${party.members.length}/5`, mentions: [host, participant] }, { quoted: msg });
        return;
    }

    if (cmd === 'leave') {
        const party = findMyParty(participant);
        if (!party) { await sock.sendMessage(sender, { text: '❌ Kamu tidak sedang di dalam party!' }, { quoted: msg }); return; }
        if (party.host === participant) {
            delete activeParties[participant];
            await sock.sendMessage(sender, { text: '🚪 Host keluar, party dibubarkan!' }, { quoted: msg });
        } else {
            party.members = party.members.filter(m => m !== participant);
            await sock.sendMessage(sender, { text: `🚪 Kamu keluar dari party.`, mentions: [participant] }, { quoted: msg });
        }
        return;
    }

    if (cmd === 'info') {
        const party = findMyParty(participant);
        if (!party) {
            await sock.sendMessage(sender, { text: `╭━━━〔 *👥 DUNGEON PARTY* 〕━━━\n┃\n┃ ⚠️ Kamu belum punya party!\n┃\n┃ 🛠️ *.party create*\n┃ 🔗 *.party join @tag*\n┃ 🚪 *.party leave*\n┃ ⚔️ *.party dungeon* (Host only)\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
            return;
        }
        let txt = `╭━━━〔 *👥 PARTY INFO* 〕━━━\n┃\n┃ 👑 Host: @${party.host.split('@')[0]}\n┃ 👥 Anggota (${party.members.length}/5):\n`;
        party.members.forEach((m, i) => {
            const mName = getDisplayName(m);
            const mData = getPlayer(m);
            txt += `┃  ${i+1}. ${mName} (Lv${mData.rpg?.level || 1})\n`;
        });
        txt += `┃\n┃ 💡 Host ketik *.party dungeon* untuk mabar!\n╰━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(sender, { text: txt, mentions: party.members }, { quoted: msg });
        return;
    }

    if (cmd === 'dungeon') {
        const party = findMyParty(participant);
        if (!party) { await sock.sendMessage(sender, { text: '❌ Kamu tidak punya party!' }, { quoted: msg }); return; }
        if (party.host !== participant) { await sock.sendMessage(sender, { text: '❌ Hanya Host yang bisa start dungeon!' }, { quoted: msg }); return; }
        
        // Cek floor berdasar host
        const floor = (dp.rpg.dungeonFloor || 0) + 1;
        if (floor > 100) { await sock.sendMessage(sender, { text: '🏆 Host sudah clear semua 100 floor! MAX!' }, { quoted: msg }); return; }
        
        const mob = getDungeonMonster(floor);
        // Scale Boss based on party size!
        const scale = party.members.length;
        const partyEnemy = { ...mob, hp: mob.hp * scale, atk: Math.floor(mob.atk * (1 + (scale-1)*0.2)) };
        
        let startMsg = `╭━━━〔 *🗺️ PARTY DUNGEON F${floor}* 〕━━━\n┃\n┃ 👥 Party Size: *${scale} Player(s)*\n┃ ${mob.emoji} *${mob.name}*\n┃ ❤️ ${partyEnemy.hp} | ⚔️ ${partyEnemy.atk} | 🛡️ ${partyEnemy.def}\n┃\n╰ ⚔️ *Pertarungan dimulai...*`;
        await sock.sendMessage(sender, { text: startMsg }, { quoted: msg });
        
        const { delay } = require('@whiskeysockets/baileys');
        await delay(2000);
        
        const partyArr = [];
        for (const m of party.members) {
            const mData = getPlayer(m);
            if (mData.rpg) {
                const bStats = getBuffedStats(mData.rpg);
                partyArr.push({ jid: m, hp: mData.rpg.hp, maxHp: mData.rpg.maxHp, stats: bStats, revive: mData.rpg.inventory.includes('revive_stone') });
            }
        }
        
        const { quickPartyBattle } = require('./core');
        const battle = quickPartyBattle(partyArr, partyEnemy);
        
        if (battle.won) {
            let winMsg = `╭━━━〔 *🗺️ PARTY F${floor} CLEAR!* 〕━━━\n┃\n`;
            for (const p of battle.fighters) {
                const mData = getPlayer(p.jid);
                mData.rpg.hp = Math.max(1, p.hp);
                if (p.alive) {
                    const coinAmount = mob.coinMin + Math.floor(Math.random() * (mob.coinMax - mob.coinMin + 1));
                    mData.rpg.exp += mob.exp; mData.coins += coinAmount;
                    if (p.jid === participant) mData.rpg.dungeonFloor = floor; // Only host advances? Or all? Let's say all.
                    mData.rpg.dungeonFloor = Math.max(mData.rpg.dungeonFloor || 0, floor);
                    mData.rpg.monstersKilled++;
                    let lootMsg = ''; 
                    if (Math.random() * 100 < mob.lootChance && mob.loot) { 
                        mData.rpg.inventory.push(mob.loot); 
                        lootMsg += ` 📦 +${mob.loot}`; 
                    }
                    
                    if (Math.random() < 0.40) {
                        const universalPool = ['ramuan_hp_sedang', 'ramuan_hp_besar', 'scroll_kritis', 'jimat_dodge', 'batu_exp', 'scroll_teleport', 'peti_misteri'];
                        const ud = universalPool[Math.floor(Math.random() * universalPool.length)];
                        mData.rpg.inventory.push(ud);
                        lootMsg += ` ✨ +${ud}`;
                    }
                    
                    winMsg += `┃ ✅ @${p.jid.split('@')[0]}: 📗 +${mob.exp} EXP | 🪙 +${formatCoins(coinAmount)}${lootMsg}\n`;
                } else {
                    winMsg += `┃ 💀 @${p.jid.split('@')[0]}: Tumbang (No Drop)\n`;
                }
                updatePlayer(p.jid, mData);
            }
            winMsg += `╰━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: winMsg, mentions: party.members }, { quoted: msg });
        } else {
            let loseMsg = `╭━━━〔 *🗺️ PARTY F${floor} GAGAL* 〕━━━\n┃\n┃ 💀 Party Wipeout!\n`;
            for (const p of battle.fighters) {
                const mData = getPlayer(p.jid);
                mData.rpg.hp = Math.max(1, Math.floor(mData.rpg.maxHp * 0.3));
                updatePlayer(p.jid, mData);
                loseMsg += `┃ 📉 @${p.jid.split('@')[0]} HP dipulihkan 30%\n`;
            }
            loseMsg += `╰━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: loseMsg, mentions: party.members }, { quoted: msg });
        }
        // Auto disband or keep party? Let's keep it.
        return;
    }
}

module.exports = { handleDungeon, handleDungeonInfo, handleWorldBoss, handleWbAttack, handleDarkWorld, handleRespawn, handleInvasion, handleInvAttack, handleStory, handleSummon, handleAwaken, handleEnchant, handlePet, handleParty };
