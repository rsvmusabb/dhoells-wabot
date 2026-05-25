// ============================================================
// modules/rpg/battle-image.js — Battle Result Image Generator
// ============================================================

const sharp = require('sharp');
const { RPG_CLASSES } = require('../../config');
const { scrapePinterest, downloadImage } = require('../media/scraper');

async function generateBattleImage(pName, pClass, eName, won, pinQuery) {
    const cls = RPG_CLASSES[pClass];
    const bc = won ? '#00E676' : '#FF1744';
    const rt = won ? '🏆 VICTORY!' : '💀 DEFEATED';
    const sn = (pName || 'Player').replace(/&/g, '&amp;').replace(/</g, '&lt;').substring(0, 14);
    const se = (eName || 'Enemy').replace(/&/g, '&amp;').replace(/</g, '&lt;').substring(0, 14);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0a0a1a"/><stop offset="50%" style="stop-color:#1a0a3a"/><stop offset="100%" style="stop-color:#0a1a2a"/></linearGradient><linearGradient id="rb" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:${won ? '#004d1a' : '#4d0010'}"/><stop offset="100%" style="stop-color:${won ? '#007a2a' : '#7a0020'}"/></linearGradient></defs><rect width="600" height="340" fill="url(#bg)" rx="20"/><text x="300" y="33" fill="#FFD700" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle">⚔️ BATTLE RESULT ⚔️</text><rect x="15" y="60" width="240" height="195" rx="14" fill="#1a1a3e" stroke="${bc}" stroke-width="2"/><text x="135" y="240" fill="#FFF" font-family="Arial" font-size="13" font-weight="bold" text-anchor="middle">${cls?.emoji || '⚔️'} ${sn}</text><text x="135" y="255" fill="${bc}" font-family="Arial" font-size="11" text-anchor="middle">${cls?.name || 'Fighter'}</text><text x="300" y="165" fill="#FFD700" font-family="Arial" font-size="30" font-weight="bold" text-anchor="middle">VS</text><rect x="345" y="60" width="240" height="195" rx="14" fill="#3e1a1a" stroke="#FF5722" stroke-width="2"/><text x="465" y="240" fill="#FFF" font-family="Arial" font-size="13" font-weight="bold" text-anchor="middle">👹 ${se}</text><text x="465" y="255" fill="#FF7043" font-family="Arial" font-size="11" text-anchor="middle">Monster</text><rect x="80" y="278" width="440" height="50" rx="25" fill="url(#rb)" stroke="${bc}" stroke-width="2"/><text x="300" y="310" fill="#FFF" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle">${rt}</text></svg>`;
    let canvas = await sharp(Buffer.from(svg)).png().toBuffer();
    const composites = [];
    try { const ci = await scrapePinterest(`${cls?.name || pClass} warrior anime character fantasy`, 1); if (ci.length > 0) { const b = await downloadImage(ci[0]); composites.push({ input: await sharp(b).resize(236, 156, { fit: 'cover' }).png().toBuffer(), left: 19, top: 64 }); } } catch (e) { }
    try { const ci = await scrapePinterest(pinQuery || `${eName} monster anime fantasy`, 1); if (ci.length > 0) { const b = await downloadImage(ci[0]); composites.push({ input: await sharp(b).resize(236, 156, { fit: 'cover' }).png().toBuffer(), left: 349, top: 64 }); } } catch (e) { }
    if (composites.length > 0) canvas = await sharp(canvas).composite(composites).png().toBuffer();
    return await sharp(canvas). jpeg({ quality: 88 }).toBuffer();
}

module.exports = { generateBattleImage };
