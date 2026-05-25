// ============================================================
// modules/media/handler.js — Media Command Handlers
// Sticker, GIF, QC, Play, Pin, Pin4, Tiktok, Cuaca
// ============================================================

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const axios = require('axios');
const yts = require('yt-search');
const { downloadAudio } = require('./audio');
const { scrapePinterest, downloadImage, sendImageSearchResults } = require('./scraper');
const { BOT_CONFIG } = require('../../config');
const { delay } = require('@whiskeysockets/baileys');

async function handleSticker(sock, sender, msg, participant, textMessage) {
    const iI = !!msg.message.imageMessage, iV = !!msg.message.videoMessage;
    const ci = msg.message.extendedTextMessage?.contextInfo, qm = ci?.quotedMessage;
    const qi = !!qm?.imageMessage, qv = !!qm?.videoMessage;
    if (!iI && !iV && !qi && !qv) { await sock.sendMessage(sender, { text: '📌 Kirim gambar/video dengan caption *.sticker*\n\n💡 Mau stiker + teks? Pakai:\n*.stxt <teks>* pada gambar' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '⏳ Sedang membuat stiker...' }, { quoted: msg });
    try {
        let buf;
        if (iI || iV) buf = await require('@whiskeysockets/baileys').downloadMediaMessage(msg, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) });
        else { if (!qm) return; const qmm = { key: { remoteJid: msg.key.remoteJid, fromMe: false, id: ci.stanzaId || msg.key.id, participant: ci.participant || msg.key.participant || msg.key.remoteJid }, message: qm }; buf = await require('@whiskeysockets/baileys').downloadMediaMessage(qmm, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) }); }
        const ext = (iV || qv) ? '.mp4' : '.jpg';
        const ti = path.join(BOT_CONFIG.TEMP_DIR, `in_${Date.now()}${ext}`);
        const to = path.join(BOT_CONFIG.TEMP_DIR, `out_${Date.now()}.webp`);
        fs.writeFileSync(ti, buf);
        const fa = ['-vcodec', 'libwebp', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0'];
        if (iV || qv) fa.push('-loop', '0', '-preset', 'default', '-an', '-vsync', '0', '-t', '5');
        ffmpeg(ti).addOutputOptions(fa).toFormat('webp').save(to)
            .on('end', async () => { await sock.sendMessage(sender, { sticker: fs.readFileSync(to) }, { quoted: msg }); if (fs.existsSync(ti)) fs.unlinkSync(ti); if (fs.existsSync(to)) fs.unlinkSync(to); })
            .on('error', async () => { await sock.sendMessage(sender, { text: '❌ Gagal membuat stiker.' }, { quoted: msg }); if (fs.existsSync(ti)) fs.unlinkSync(ti); });
    } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal mendownload media.' }, { quoted: msg }); }
}

async function handleStickerText(sock, sender, msg, participant, textMessage) {
    const iI = !!msg.message.imageMessage;
    const ci = msg.message.extendedTextMessage?.contextInfo, qm = ci?.quotedMessage;
    const qi = !!qm?.imageMessage;
    if (!iI && !qi) {
        await sock.sendMessage(sender, { text: '📌 *STIKER + TEKS*\n\nKirim/reply gambar dengan caption:\n\n▸ *.stxt Teks kamu*\n▸ *.stxt Teks|bawah* (posisi: atas/tengah/bawah)\n▸ *.stxt Teks|bawah|merah* (warna)\n▸ *.stxt Teks|atas|putih|besar* (ukuran: kecil/sedang/besar)\n\n🎨 Warna: putih, hitam, merah, kuning, hijau, biru, pink, ungu, oren\n📏 Ukuran: kecil, sedang, besar' }, { quoted: msg });
        return;
    }
    if (!textMessage) {
        await sock.sendMessage(sender, { text: '📌 Tambahkan teks!\nContoh: *.stxt Hello World*' }, { quoted: msg });
        return;
    }
    await sock.sendMessage(sender, { text: '⏳ Membuat stiker + teks...' }, { quoted: msg });
    try {
        let buf;
        if (iI) buf = await require('@whiskeysockets/baileys').downloadMediaMessage(msg, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) });
        else { if (!qm) return; const qmm = { key: { remoteJid: msg.key.remoteJid, fromMe: false, id: ci.stanzaId || msg.key.id, participant: ci.participant || msg.key.participant || msg.key.remoteJid }, message: qm }; buf = await require('@whiskeysockets/baileys').downloadMediaMessage(qmm, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) }); }

        // Parse: teks|posisi|warna|ukuran
        const parts = textMessage.split('|').map(s => s.trim());
        const userText = parts[0] || 'Hello';
        const position = (parts[1] || 'bawah').toLowerCase();
        const colorName = (parts[2] || 'putih').toLowerCase();
        const sizeName = (parts[3] || 'sedang').toLowerCase();

        // Warna
        const colorMap = {
            putih: '#FFFFFF', hitam: '#000000', merah: '#FF3333', kuning: '#FFD700',
            hijau: '#33FF57', biru: '#3399FF', pink: '#FF69B4', ungu: '#9B59B6',
            oren: '#FF8C00', orange: '#FF8C00', white: '#FFFFFF', black: '#000000',
            red: '#FF3333', yellow: '#FFD700', green: '#33FF57', blue: '#3399FF'
        };
        const textColor = colorMap[colorName] || '#FFFFFF';

        // Ukuran font
        const sizeMap = { kecil: 28, small: 28, sedang: 40, medium: 40, besar: 56, big: 56, large: 56 };
        const fontSize = sizeMap[sizeName] || 40;

        // Resize gambar ke 512x512
        const imgBuf = await sharp(buf).resize(512, 512, { fit: 'cover' }).png().toBuffer();

        // Buat teks SVG overlay
        const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const maxChars = Math.floor(440 / (fontSize * 0.55));
        const words = esc(userText).split(' ');
        const lines = []; let curLine = '';
        for (const w of words) {
            if ((curLine + ' ' + w).trim().length > maxChars) {
                if (curLine.trim()) lines.push(curLine.trim());
                curLine = w;
            } else curLine += ' ' + w;
        }
        if (curLine.trim()) lines.push(curLine.trim());
        if (lines.length > 6) lines.splice(6);

        const lineHeight = Math.floor(fontSize * 1.3);
        const totalTextH = lines.length * lineHeight;

        // Posisi Y
        let startY;
        if (position === 'atas' || position === 'top') startY = 30 + fontSize;
        else if (position === 'tengah' || position === 'center' || position === 'middle') startY = Math.floor((512 - totalTextH) / 2) + fontSize;
        else startY = 512 - totalTextH - 15; // bawah (default)

        // Background strip untuk teks (semi-transparent)
        const bgY = startY - fontSize - 5;
        const bgH = totalTextH + 20;

        const tspans = lines.map((l, i) => `<tspan x="256" dy="${i === 0 ? '0' : lineHeight}">${l}</tspan>`).join('');
        const strokeColor = textColor === '#000000' ? '#FFFFFF' : '#000000';

        const svgOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
            <rect x="0" y="${bgY}" width="512" height="${bgH}" rx="8" fill="rgba(0,0,0,0.5)"/>
            <text x="256" y="${startY}" text-anchor="middle" fill="${textColor}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" stroke="${strokeColor}" stroke-width="1.5" paint-order="stroke">${tspans}</text>
        </svg>`);

        // Composite: gambar + teks overlay
        const result = await sharp(imgBuf)
            .composite([{ input: svgOverlay, top: 0, left: 0 }])
            .webp({ quality: 90 })
            .toBuffer();

        await sock.sendMessage(sender, { sticker: result }, { quoted: msg });
    } catch (e) {
        console.error('[STXT ERROR]', e.message);
        await sock.sendMessage(sender, { text: '❌ Gagal membuat stiker teks.' }, { quoted: msg });
    }
}

async function handleGif(sock, sender, msg, participant, textMessage) {
    const iV = !!msg.message.videoMessage, gci = msg.message.extendedTextMessage?.contextInfo, gqm = gci?.quotedMessage, gqv = !!gqm?.videoMessage;
    if (!iV && !gqv) { await sock.sendMessage(sender, { text: '📌 Kirim video dengan caption *.gif*' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '⏳ Memproses GIF...' }, { quoted: msg });
    try {
        let buf;
        if (iV) buf = await require('@whiskeysockets/baileys').downloadMediaMessage(msg, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) });
        else { if (!gqm) return; const qmm = { key: { remoteJid: msg.key.remoteJid, fromMe: false, id: gci.stanzaId || msg.key.id, participant: gci.participant || msg.key.participant || msg.key.remoteJid }, message: gqm }; buf = await require('@whiskeysockets/baileys').downloadMediaMessage(qmm, 'buffer', {}, { logger: require('pino')({ level: 'silent' }) }); }
        await sock.sendMessage(sender, { video: buf, gifPlayback: true, caption: 'Selesai! ✅' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal membuat GIF.' }, { quoted: msg }); }
}

async function handleQc(sock, sender, msg, participant, textMessage) {
    let qt = '', qn = '';
    const iq = !!msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!textMessage && !iq) { await sock.sendMessage(sender, { text: '📌 Balas pesan dengan *.qc* atau ketik *.qc <teks>*' }, { quoted: msg }); return; }
    if (iq) { const qi = msg.message.extendedTextMessage?.contextInfo || {}; const qd = qi.quotedMessage || {}; qt = qd.conversation || qd.extendedTextMessage?.text || ''; const qp = qi.participant || msg.key.participant || msg.key.remoteJid || ''; qn = qp.split('@')[0] || 'User'; } else { qt = textMessage; qn = msg.pushName || msg.key.participant?.split('@')[0] || 'User'; }
    if (!qt) { await sock.sendMessage(sender, { text: '📌 Pesan yang direply tidak memiliki teks.' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '⏳ Sedang membuat stiker chat...' }, { quoted: msg });
    try {
        const eh = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const words = eh(qt).split(' '); const lines = []; let cl = '';
        for (const w of words) { if ((cl + ' ' + w).trim().length > 30) { if (cl.trim()) lines.push(cl.trim()); cl = w; } else cl += ' ' + w; }
        if (cl.trim()) lines.push(cl.trim()); if (lines.length > 8) lines.splice(8);
        const lh = 28, tbh = lines.length * lh, bh = tbh + 80, ch2 = bh + 40, bw = 420;
        const tspans = lines.map((l, i) => `<tspan x="40" dy="${i === 0 ? '0' : lh}">${l}</tspan>`).join('');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="${ch2}"><rect width="512" height="${ch2}" fill="none"/><rect x="20" y="10" width="${bw}" height="${bh}" rx="18" fill="#005C4B"/><polygon points="20,${bh - 10} 8,${bh + 5} 35,${bh - 5}" fill="#005C4B"/><text x="40" y="45" fill="#53BDEB" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="bold">${eh(qn)}</text><text x="40" y="75" fill="#E9EDEF" font-family="Arial,Helvetica,sans-serif" font-size="20">${tspans}</text></svg>`;
        const webpBuf = await sharp(Buffer.from(svg)).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 100 }).toBuffer();
        await sock.sendMessage(sender, { sticker: webpBuf }, { quoted: msg });
    } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal membuat stiker.' }, { quoted: msg }); }
}

async function handlePlay(sock, sender, msg, participant, textMessage) {
    if (!textMessage) { await sock.sendMessage(sender, { text: '📌 Masukkan judul lagu!\nContoh: *.play akad payung teduh*' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🔍 Sedang mencari lagu...' }, { quoted: msg });
    let of = null;
    try {
        const sr = await yts(textMessage); const v = sr.videos[0]; if (!v) { await sock.sendMessage(sender, { text: '❌ Lagu tidak ditemukan.' }, { quoted: msg }); return; }
        await sock.sendMessage(sender, { text: `🎧 *Mendownload...*\n\n*Judul:* ${v.title}\n*Durasi:* ${v.timestamp}` }, { quoted: msg });
        of = await downloadAudio(v.url); const ab = fs.readFileSync(of);
        await sock.sendMessage(sender, { audio: ab, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
    } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal mendownload lagu.' }, { quoted: msg }); }
    finally { if (of && fs.existsSync(of)) fs.unlinkSync(of); }
}

async function handlePin(sock, sender, msg, participant, textMessage) {
    if (!textMessage) { await sock.sendMessage(sender, { text: '📌 Masukkan keyword!\nContoh: *.pin anime naruto*' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🔍 Mencari gambar...' }, { quoted: msg });
    try { const imgs = await scrapePinterest(textMessage, 8); if (!imgs.length) { await sock.sendMessage(sender, { text: '❌ Gambar tidak ditemukan.' }, { quoted: msg }); return; } const s = await sendImageSearchResults(sock, sender, msg, imgs, textMessage, 1); if (!s) await sock.sendMessage(sender, { text: '❌ Semua URL gagal didownload.' }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal.' }, { quoted: msg }); }
}

async function handlePin4(sock, sender, msg, participant, textMessage) {
    if (!textMessage) { await sock.sendMessage(sender, { text: '📌 Masukkan keyword!\nContoh: *.pin4 anime one piece*' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🔍 Mencari 4 gambar...' }, { quoted: msg });
    try { const imgs = await scrapePinterest(textMessage, 16); if (!imgs.length) { await sock.sendMessage(sender, { text: '❌ Gambar tidak ditemukan.' }, { quoted: msg }); return; } const s = await sendImageSearchResults(sock, sender, msg, imgs, textMessage, 4); if (!s) await sock.sendMessage(sender, { text: '❌ Semua URL gagal.' }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal.' }, { quoted: msg }); }
}

async function handleTiktok(sock, sender, msg, participant, textMessage) {
    if (!textMessage || !textMessage.includes('tiktok.com')) { await sock.sendMessage(sender, { text: '📌 Kirim link TikTok!\nContoh: *.tt https://vt.tiktok.com/xxxxx*' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '📥 _Sedang download TikTok..._' }, { quoted: msg });
    try { const tu = `https://www.tikwm.com/api/?url=${encodeURIComponent(textMessage)}`; const { data: td } = await axios.get(tu, { timeout: 15000 }); if (td?.data?.play) { const vb = await downloadImage(td.data.play); await sock.sendMessage(sender, { video: vb, caption: `🎬 *TikTok*\n\n👤 *${td.data.author?.nickname || 'Unknown'}*\n📝 ${(td.data.title || '').substring(0, 200)}` }, { quoted: msg }); } else throw new Error('not found'); } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal download TikTok.' }, { quoted: msg }); }
}

async function handleCuaca(sock, sender, msg, participant, textMessage) {
    if (!textMessage) { await sock.sendMessage(sender, { text: '📌 Masukkan nama kota!\nContoh: *.cuaca Jakarta*' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🌤️ _Mengecek cuaca..._' }, { quoted: msg });
    try {
        const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(textMessage.trim())}?format=j1`, { timeout: 10000 });
        const cc = data.current_condition[0], ar = data.nearest_area[0], fc = data.weather[0];
        const em = { 'Sunny': '☀️', 'Clear': '🌙', 'Partly cloudy': '⛅', 'Cloudy': '☁️', 'Overcast': '🌥️', 'Mist': '🌫️', 'Fog': '🌫️', 'Light rain': '🌦️', 'Rain': '🌧️', 'Heavy rain': '⛈️', 'Thunderstorm': '⛈️', 'Snow': '❄️' };
        const d = cc.weatherDesc[0].value; const e = em[d] || '🌤️';
        await sock.sendMessage(sender, { text: `╭━━━〔 *${e} CUACA* 〕━━━\n┃\n┃ 📍 *${ar.areaName[0].value}, ${ar.country[0].value}*\n┃\n┃ ${e} *${d}*\n┃ 🌡️ ${cc.temp_C}°C (Terasa ${cc.FeelsLikeC}°C)\n┃ 💧 ${cc.humidity}% | 💨 ${cc.windspeedKmph} km/h\n┃\n┣━━ *📅 Hari Ini* ━━\n┃ 🔺 ${fc.maxtempC}°C | 🔻 ${fc.mintempC}°C\n┃ ☀️ ${fc.astronomy[0].sunrise} - ${fc.astronomy[0].sunset}\n┃\n╰━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal cek cuaca.' }, { quoted: msg }); }
}

module.exports = { handleSticker, handleStickerText, handleGif, handleQc, handlePlay, handlePin, handlePin4, handleTiktok, handleCuaca };
