// ============================================================
// modules/utility/menu.js — Menu & Help Command Handlers
// ============================================================

const fs = require('fs');
const { MENU_ALIAS } = require('../../config');
const { MENU_CATEGORIES } = require('./menu-categories');
const { isOwner, isPrivileged } = require('./db');
const { buildMainMenuText, buildSubMenuText, buildHelpListText, buildHelpTopicText, normalizeMenuCategory, getVisibleMenuOrder, frameTitle } = require('./help');

async function sendMenuImageOrText(sock, s, msg, text) {
    try { const img = fs.readFileSync('./download (8).jpg'); await sock.sendMessage(s, { image: img, caption: text }, { quoted: msg }); return true; } catch (e) { await sock.sendMessage(s, { text }, { quoted: msg }); return false; }
}

async function handleMenu(sock, sender, msg, participant, textMessage, command) {
    const cat = MENU_ALIAS[command] || normalizeMenuCategory(textMessage);
    if (cat === 'main') { await sendMenuImageOrText(sock, sender, msg, buildMainMenuText(participant)); return; }
    if (cat === 'owner' && !isOwner(participant)) { await sock.sendMessage(sender, { text: '⛔ Menu ini khusus *Owner* bot.' }, { quoted: msg }); return; }
    if (cat === 'admin' && !isPrivileged(participant)) { await sock.sendMessage(sender, { text: '⛔ Menu ini hanya untuk *Owner/Admin Bot*.' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: buildSubMenuText(cat, participant) }, { quoted: msg });
}

async function handleHelp(sock, sender, msg, participant, textMessage) {
    const ha = textMessage?.trim().toLowerCase();
    if (!ha) { await sendMenuImageOrText(sock, sender, msg, buildHelpListText()); return; }
    const ht = buildHelpTopicText(ha);
    if (ht) { await sock.sendMessage(sender, { text: ht }, { quoted: msg }); return; }
    const c = normalizeMenuCategory(ha);
    if (MENU_CATEGORIES[c]) { await handleMenu(sock, sender, msg, participant, '', ha); return; }
    await sock.sendMessage(sender, { text: `❌ Topik *${ha}* tidak ditemukan!\n\n${buildHelpListText()}` }, { quoted: msg });
}

async function handleGuide(sock, sender, msg) {
    const txt = `╭━━━〔 *📖 PANDUAN DASAR RPG* 〕━━━
┃
┃ 💰 *Sistem Mata Uang (Currency)*
┃ Game ini menggunakan 3 jenis koin:
┃ 🥉 1 Silver = 50 Bronze
┃ 🥈 1 Gold   = 100 Silver
┃ 🥇 1 Gold   = 5,000 Bronze
┃ _(Fitur shop, market, dan arena sudah otomatis menyesuaikan kurs ini)_
┃
┃ ⚔️ *Cara Bermain (Progression)*
┃ 1. Ketik *.role* untuk mendaftar class.
┃ 2. Gunakan *.hunt* setiap beberapa menit untuk grinding EXP & Coin.
┃ 3. Kalau HP habis, gunakan *.eat*, *.rest*, atau beli *.shop beli ramuan_hp*.
┃ 4. Upgrade senjatamu di *.shop*.
┃ 5. Ikuti *.dungeon* (bisa solo atau mabar dengan *.party*).
┃
┃ 🤝 *Interaksi Sosial*
┃ - Gunakan *.arena* untuk ranked battle PVP (sistem ELO).
┃ - Gabung *.guild* untuk dapat stat buff.
┃ - Trade item dengan player lain via *.market*.
┃
╰━━━━━━━━━━━━━━━━━━━`;
    await sock.sendMessage(sender, { text: txt }, { quoted: msg });
}

module.exports = { handleMenu, handleHelp, handleGuide };
