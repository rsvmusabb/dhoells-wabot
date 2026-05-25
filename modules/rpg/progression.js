// ============================================================
// modules/rpg/progression.js — Role, Profile, Quest, Evolve, Skills
// ============================================================

const { getPlayer, updatePlayer } = require('../utility/db');
const { formatCoins } = require('../utility/currency');
const { RPG_CLASSES, RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_ACHIEVEMENTS, RPG_QUESTS, QUEST_COOLDOWN, RPG_EVOLUTIONS, RPG_SKILL_TREES, BASE_UPGRADES, FRAME } = require('../../config');
const { initRPG, checkLevelUp, checkAchievements, getBuffedStats, getExpToLevel, trackQuest } = require('./core');

async function handleRole(sock, sender, msg, participant, textMessage) {
    const cl = textMessage?.toLowerCase();
    if (!cl || !RPG_CLASSES[cl]) {
        let cl = '╭━━━〔 *🛡️ PILIH CLASS* 〕━━━\n┃\n';
        for (const [k, v] of Object.entries(RPG_CLASSES)) cl += `┃ ${v.emoji} *${v.name}*  HP:${v.hp} ATK:${v.atk} DEF:${v.def} SPD:${v.spd} CRIT:${v.crit}%\n┃   ${v.passive} | Skill: ${v.skill}\n┃\n`;
        cl += '╰ Ketik: *.role warrior*'; await sock.sendMessage(sender, { text: cl }, { quoted: msg }); return;
    }
    const ep = getPlayer(participant); if (ep.rpg) { await sock.sendMessage(sender, { text: `❌ Sudah punya class *${RPG_CLASSES[ep.rpg.class].name}*!` }, { quoted: msg }); return; }
    initRPG(participant, cl); const c = RPG_CLASSES[cl];
    await sock.sendMessage(sender, { text: `╭━━━〔 *${c.emoji} CLASS SELECTED* 〕━━━\n┃\n┃ 🛡️ *${c.name}*\n┃ ❤️ HP:${c.hp} | ⚔️ ATK:${c.atk} | 🛡️ DEF:${c.def}\n┃ 💥 CRIT:${c.crit}% | ✨ ${c.passive}\n┃ 🌀 ${c.skill} - ${c.skillDesc}\n┃ 🗡️ ${RPG_WEAPONS[c.starterWeapon].name}\n┃\n╰ Ketik *.hunt* untuk mulai!` }, { quoted: msg });
}

async function handleProfile(sock, sender, msg, participant, textMessage) {
    const rp = getPlayer(participant); if (!rp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class! Ketik *.role* dulu.' }, { quoted: msg }); return; }
    const r = rp.rpg, rc = RPG_CLASSES[r.class], rw = RPG_WEAPONS[r.weapon], ra = RPG_ARMORS[r.armor], rs2 = RPG_SHIELDS[r.shield];
    const bs = getBuffedStats(r); const dn = rp.displayName || participant.split('@')[0];
    const hpP = Math.floor((r.hp / bs.maxHp) * 100), hpB = '█'.repeat(Math.max(0, Math.floor((r.hp / bs.maxHp) * 20))) + '░'.repeat(20 - Math.max(0, Math.floor((r.hp / bs.maxHp) * 20)));
    const exM = getExpToLevel(r.level), exP = Math.floor((r.exp / exM) * 100), exB = '▓'.repeat(Math.max(0, Math.floor((r.exp / exM) * 20))) + '░'.repeat(20 - Math.max(0, Math.floor((r.exp / exM) * 20)));
    const cp = bs.atk * 2 + bs.def * 1.5 + bs.spd + Math.floor(bs.crit / 2) + Math.floor(bs.maxHp / 10);
    let bt = ''; if (r.buffs?.length) { bt = '\n┣━━ *🔮 Active Buffs* ━━'; for (const b of r.buffs) bt += `\n┃ 🔹 ${b.name} (${b.stat}+${b.value}, ${b.duration}b)`; }
    await sock.sendMessage(sender, { text: `╭━━━━━━━━━━━━━━━━━━━━━╮\n┃ ${rc.emoji} *RPG PROFILE* ${rc.emoji}\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n┌── *👤 IDENTITY* ──\n│ 🏷️ *${dn}*\n│ ${rc.emoji} ${rc.name} | ⭐ Lv${r.level}\n│ ⚡ CP: *${Math.floor(cp)}* | 💰 ${formatCoins(rp.coins)}\n└─────────────\n\n┌── *❤️ VITALS* ──\n│ ${hpP > 60 ? '🟢' : hpP > 30 ? '🟡' : '🔴'} HP: *${r.hp}/${bs.maxHp}* [${hpB}] ${hpP}%\n│ ⭐ EXP: *${r.exp}/${exM}* [${exB}] ${exP}%\n└─────────────\n\n┌── *⚔️ STATS* ──\n│ ⚔️ ATK: *${bs.atk}* | 🛡️ DEF: *${bs.def}*\n│ 💨 SPD: *${bs.spd}* | 💥 CRIT: *${bs.crit}%*\n│ 🔰 Block: *${bs.block}%* | 🍃 Dodge: *+${bs.dodge}%*\n└─────────────\n\n┌── *🎽 EQUIPMENT* ──\n│ 🗡️ ${rw?.name || '-'} ${rw?.emoji || ''} (ATK+${rw?.atk || 0})\n│ 🥋 ${ra?.name || '-'} ${ra?.emoji || ''} (DEF+${ra?.def || 0})\n│ 🔰 ${rs2?.name || '-'} ${rs2?.emoji || ''} (Block ${rs2?.block || 0}%)\n└─────────────\n\n┌── *📊 RECORD* ──\n│ ⚔️ ${r.wins}W/${r.losses}L | 👹 ${r.monstersKilled} kills\n│ 🎒 ${r.inventory?.length || 0} items | 🌀 ${rc.skill} ${r.skillCooldown > 0 ? `CD:${r.skillCooldown}` : '✅'}\n└─────────────${bt}` }, { quoted: msg });
}

async function handleAchievement(sock, sender, msg, participant, textMessage) {
    const ap = getPlayer(participant); if (!ap.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const na = checkAchievements(participant);
    let at = `╭━━━〔 *📜 ACHIEVEMENTS* 〕━━━\n┃\n`;
    for (const [id, a] of Object.entries(RPG_ACHIEVEMENTS)) { const has = (ap.rpg.achievements || []).includes(id); at += `┃ ${has ? '✅' : '⬜'} ${a.emoji} *${a.name}* — ${a.desc}\n`; }
    at += `┃\n┃ 🏅 Unlocked: *${(ap.rpg.achievements || []).length}/${Object.keys(RPG_ACHIEVEMENTS).length}*\n`;
    if (ap.rpg.title) { const t = RPG_ACHIEVEMENTS[ap.rpg.title]; at += `┃ 🎖️ Title: ${t?.emoji || ''} ${t?.name || ap.rpg.title}\n`; }
    at += `╰━━━━━━━━━━━━━━━━━━━\n💡 *.title <id>*`;
    if (na.length) at += `\n\n🎉 *BARU:* ${na.map(a => a.emoji + ' ' + a.name).join(', ')}`;
    await sock.sendMessage(sender, { text: at }, { quoted: msg });
}

async function handleQuest(sock, sender, msg, participant, textMessage) {
    const qp = getPlayer(participant); if (!qp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (qp.rpg.quest) {
        const q = qp.rpg.quest, bar = '█'.repeat(Math.floor(q.progress / q.target * 10)) + '░'.repeat(10 - Math.floor(q.progress / q.target * 10));
        await sock.sendMessage(sender, { text: `╭━━━〔 *🎯 QUEST AKTIF* 〕━━━\n┃\n┃ 📋 ${q.desc}\n┃ 📊 [${bar}] ${q.progress}/${q.target}\n┃\n┃ 🎁 Reward: ${q.reward.exp} EXP + ${formatCoins(q.reward.coins)}${q.reward.item ? ' + ' + q.reward.item : ''}\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg }); return;
    }
    const now = Date.now();
    if (qp.rpg.lastQuestReset && (now - qp.rpg.lastQuestReset) < QUEST_COOLDOWN) {
        const rem = QUEST_COOLDOWN - (now - qp.rpg.lastQuestReset);
        await sock.sendMessage(sender, { text: `⏰ Quest baru tersedia dalam *${Math.floor(rem / 3600000)}j ${Math.floor((rem % 3600000) / 60000)}m*` }, { quoted: msg }); return;
    }
    const rq = RPG_QUESTS[Math.floor(Math.random() * RPG_QUESTS.length)];
    qp.rpg.quest = { ...rq, progress: 0 }; qp.rpg.lastQuestReset = now; updatePlayer(participant, qp);
    await sock.sendMessage(sender, { text: `╭━━━〔 *🎯 QUEST BARU!* 〕━━━\n┃\n┃ 📋 *${rq.desc}*\n┃ 📊 Progress: 0/${rq.target}\n┃\n┃ 🎁 Reward:\n┃   📗 ${rq.reward.exp} EXP\n┃   🪙 ${formatCoins(rq.reward.coins)}${rq.reward.item ? '\n┃   📦 ' + rq.reward.item : ''}\n╰━━━━━━━━━━━━━━━━━━━\n💡 Progress auto-tracked!` }, { quoted: msg });
}

async function handleEvolve(sock, sender, msg, participant, textMessage) {
    const ep = getPlayer(participant); if (!ep.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (ep.rpg.evolution) { const evo = RPG_EVOLUTIONS[ep.rpg.class]?.find(e => e.id === ep.rpg.evolution); await sock.sendMessage(sender, { text: `✅ Sudah evolusi ke ${evo?.emoji || ''} *${evo?.name || ep.rpg.evolution}*!` }, { quoted: msg }); return; }
    const paths = RPG_EVOLUTIONS[ep.rpg.class]; if (!paths) { await sock.sendMessage(sender, { text: '❌ Class tidak punya evolusi!' }, { quoted: msg }); return; }
    const evArg = textMessage?.toLowerCase()?.replace(/\s+/g, '_');
    if (!evArg) {
        let et = `╭━━━〔 *🔄 CLASS EVOLUTION* 〕━━━\n┃\n┃ ⚠️ Butuh: *Level 20+* (kamu Lv${ep.rpg.level})\n┃\n`;
        for (const p of paths) et += `┃ ${p.emoji} *${p.name}*\n┃   ${p.passive}\n┃   🌀 ${p.skill} — ${p.skillDesc}\n┃   📊 ${Object.entries(p.bonus).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(', ')}\n┃\n`;
        et += `╰━━━━━━━━━━━━━━━━━━━\n💡 *.evolve <nama>* (contoh: *.evolve paladin*)`;
        await sock.sendMessage(sender, { text: et }, { quoted: msg }); return;
    }
    const chosen = paths.find(p => p.id === evArg || p.name.toLowerCase() === evArg);
    if (!chosen) { await sock.sendMessage(sender, { text: '❌ Evolusi tidak ditemukan!' }, { quoted: msg }); return; }
    if (ep.rpg.level < chosen.reqLevel) { await sock.sendMessage(sender, { text: `❌ Butuh level ${chosen.reqLevel}! Kamu Lv${ep.rpg.level}` }, { quoted: msg }); return; }
    ep.rpg.evolution = chosen.id;
    for (const [stat, val] of Object.entries(chosen.bonus)) { if (ep.rpg[stat] !== undefined) ep.rpg[stat] += val; }
    updatePlayer(participant, ep);
    await sock.sendMessage(sender, { text: `╭━━━〔 *🔄 EVOLUTION!* 〕━━━\n┃\n┃ ${chosen.emoji} Berevolusi ke *${chosen.name}*!\n┃\n┃ 🌀 Skill: *${chosen.skill}*\n┃ 📋 ${chosen.skillDesc}\n┃ 💫 Passive: ${chosen.passive}\n┃ 📊 Bonus: ${Object.entries(chosen.bonus).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(', ')}\n┃\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
}

async function handleSkillTree(sock, sender, msg, participant, textMessage) {
    const sp = getPlayer(participant); if (!sp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const stArg = textMessage?.toLowerCase()?.trim();
    const tree = RPG_SKILL_TREES[sp.rpg.class]; if (!tree) { await sock.sendMessage(sender, { text: '❌ Tidak punya skill tree!' }, { quoted: msg }); return; }
    if (!stArg) {
        let st = `╭━━━〔 *📖 SKILL TREE* 〕━━━\n┃ 🔮 SP: *${sp.rpg.skillPoints || 0}*\n┃\n`;
        for (const [branch, skills] of Object.entries(tree)) {
            const icon = branch === 'attack' ? '⚔️' : branch === 'defense' ? '🛡️' : '🔧';
            st += `┣━━ *${icon} ${branch.toUpperCase()}* ━━\n`;
            for (const s of skills) { const has = (sp.rpg.skillTree || []).includes(s.id); st += `┃ ${has ? '✅' : '⬜'} *${s.name}* (${s.cost}SP) — ${s.desc}\n`; }
            st += '┃\n';
        }
        st += '╰━━━━━━━━━━━━━━━━━━━\n💡 *.skilltree <nama_skill>*';
        await sock.sendMessage(sender, { text: st }, { quoted: msg }); return;
    }
    const allSkills = [...tree.attack, ...tree.defense, ...tree.utility];
    const skill = allSkills.find(s => s.id === stArg || s.name.toLowerCase() === stArg);
    if (!skill) { await sock.sendMessage(sender, { text: '❌ Skill tidak ditemukan!' }, { quoted: msg }); return; }
    if ((sp.rpg.skillTree || []).includes(skill.id)) { await sock.sendMessage(sender, { text: '✅ Sudah unlock!' }, { quoted: msg }); return; }
    if (skill.req && !(sp.rpg.skillTree || []).includes(skill.req)) { await sock.sendMessage(sender, { text: '❌ Unlock prerequisite dulu!' }, { quoted: msg }); return; }
    if ((sp.rpg.skillPoints || 0) < skill.cost) { await sock.sendMessage(sender, { text: `❌ Butuh ${skill.cost} SP! Punya: ${sp.rpg.skillPoints || 0}` }, { quoted: msg }); return; }
    sp.rpg.skillPoints -= skill.cost; sp.rpg.skillTree = sp.rpg.skillTree || []; sp.rpg.skillTree.push(skill.id);
    for (const [k, v] of Object.entries(skill.effect)) { if (sp.rpg[k] !== undefined) sp.rpg[k] += v; }
    updatePlayer(participant, sp);
    await sock.sendMessage(sender, { text: `✅ *${skill.name}* unlocked!\n📋 ${skill.desc}\n🔮 SP remaining: ${sp.rpg.skillPoints}` }, { quoted: msg });
}

async function handleBase(sock, sender, msg, participant, textMessage) {
    const bp = getPlayer(participant); if (!bp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const ba = textMessage?.toLowerCase()?.trim();
    if (!ba) {
        let bt = `╭━━━〔 *🏰 BASE* 〕━━━\n┃\n`;
        for (const [id, info] of Object.entries(BASE_UPGRADES)) { const lvl = bp.rpg.base?.[id] || 0; const nc = lvl < 3 ? info.levels[lvl]?.cost : 'MAX'; bt += `┃ ${info.emoji} *${info.name}* Lv${lvl}/3 ${lvl >= 3 ? '✅' : ''}\n┃   Next: ${nc !== 'MAX' ? nc + '🪙' : 'MAX!'}\n┃\n`; }
        bt += '╰━━━━━━━━━━━━━━━━━━━\n💡 *.base upgrade <nama>*';
        await sock.sendMessage(sender, { text: bt }, { quoted: msg }); return;
    }
    if (ba.startsWith('upgrade ')) {
        const bid = ba.slice(8).trim(); const info = BASE_UPGRADES[bid];
        if (!info) { await sock.sendMessage(sender, { text: '❌ Building tidak ditemukan! (armory/infirmary/treasury/wall/tower)' }, { quoted: msg }); return; }
        const lvl = bp.rpg.base?.[bid] || 0;
        if (lvl >= 3) { await sock.sendMessage(sender, { text: '✅ Sudah MAX!' }, { quoted: msg }); return; }
        const cost = info.levels[lvl].cost;
        if (bp.coins < cost) { await sock.sendMessage(sender, { text: `❌ Butuh ${formatCoins(cost)}!` }, { quoted: msg }); return; }
        bp.coins -= cost; bp.rpg.base = bp.rpg.base || {}; bp.rpg.base[bid] = lvl + 1;
        const bonus = info.levels[lvl].bonus;
        for (const [k, v] of Object.entries(bonus)) { if (bp.rpg[k] !== undefined) bp.rpg[k] += v; }
        updatePlayer(participant, bp);
        await sock.sendMessage(sender, { text: `✅ ${info.emoji} *${info.name}* upgraded to Lv${lvl + 1}!\n📊 ${Object.entries(bonus).map(([k, v]) => `${k}+${v}`).join(', ')}` }, { quoted: msg });
    }
}

async function handleTitle(sock, sender, msg, participant, textMessage) {
    const tp = getPlayer(participant); if (!tp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    const tid = textMessage?.toLowerCase()?.replace(/\s+/g, '_');
    if (!tid) { await sock.sendMessage(sender, { text: '📌 *.title <id>*\nKetik *.ach* untuk lihat title yang sudah unlock.' }, { quoted: msg }); return; }
    if (!(tp.rpg.achievements || []).includes(tid)) { await sock.sendMessage(sender, { text: '❌ Title belum di-unlock!' }, { quoted: msg }); return; }
    tp.rpg.title = tid; updatePlayer(participant, tp);
    const ta = RPG_ACHIEVEMENTS[tid];
    await sock.sendMessage(sender, { text: `✅ Title diset: ${ta?.emoji || ''} *${ta?.name || tid}*\nTitle akan tampil di profile & battle!` }, { quoted: msg });
}

async function handleSkill(sock, sender, msg, participant, textMessage) {
    const sp = getPlayer(participant); if (!sp.rpg) { await sock.sendMessage(sender, { text: '❌ Belum punya class!' }, { quoted: msg }); return; }
    if (sp.rpg.skillCooldown > 0) { await sock.sendMessage(sender, { text: `⏰ Skill cooldown! ${sp.rpg.skillCooldown} battle lagi.` }, { quoted: msg }); return; }
    const skClass = RPG_CLASSES[sp.rpg.class]; sp.rpg.skillCooldown = 3;
    if (sp.rpg.class === 'warrior') sp.rpg.buffs.push({ name: 'Shield Bash', stat: 'def', value: 15, duration: 2 });
    else if (sp.rpg.class === 'archer') sp.rpg.buffs.push({ name: 'Rain of Arrows', stat: 'atk', value: 20, duration: 1 });
    else if (sp.rpg.class === 'mage') sp.rpg.buffs.push({ name: 'Fireball', stat: 'atk', value: 25, duration: 1 });
    else if (sp.rpg.class === 'assassin') sp.rpg.buffs.push({ name: 'Shadow Strike', stat: 'crit', value: 40, duration: 1 });
    else if (sp.rpg.class === 'necromancer') sp.rpg.buffs.push({ name: 'Soul Drain', stat: 'regen', value: 15, duration: 3 });
    else if (sp.rpg.class === 'paladin') sp.rpg.buffs.push({ name: 'Holy Shield', stat: 'def', value: 30, duration: 2 });
    else if (sp.rpg.class === 'samurai') sp.rpg.buffs.push({ name: 'Iaijutsu', stat: 'crit', value: 35, duration: 1 });
    else if (sp.rpg.class === 'berserker') sp.rpg.buffs.push({ name: 'Blood Rage', stat: 'atk', value: 40, duration: 2 });
    else if (sp.rpg.class === 'shaman') sp.rpg.buffs.push({ name: 'Hex', stat: 'atk', value: 20, duration: 3 });
    updatePlayer(participant, sp);
    await sock.sendMessage(sender, { text: `🌀 *${skClass.skill}* diaktifkan!\n${skClass.skillDesc}\n\n⏰ Cooldown: 3 battle` }, { quoted: msg });
}

module.exports = { handleRole, handleProfile, handleAchievement, handleQuest, handleEvolve, handleSkillTree, handleBase, handleTitle, handleSkill };
