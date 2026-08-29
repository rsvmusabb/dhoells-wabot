// ============================================================
// modules/media/scraper.js — Image Scraper & Downloader
// Pinterest, Google, Bing scraper + image download
// ============================================================

const axios = require('axios');

function buildImageSearchQueries(query) {
    const cq = String(query || '').trim().replace(/\s+/g, ' ');
    if (!cq) return [];
    const hasStyle = /\b(anime|manga|cosplay|fanart|fantasy|character|realistic|wallpaper|aesthetic|portrait|girl|boy|woman|man|3d|live action)\b/i.test(cq);
    const v = hasStyle ? [cq, `${cq} pinterest`, `${cq} high quality`] : [`${cq} anime character`, `${cq} cosplay`, `${cq} fantasy character`, `${cq} realistic cosplay`, `${cq} fanart`, cq];
    return [...new Set(v)];
}

function addUniqueImages(t, u, l = Infinity) { for (const url of u) { if (!url || t.includes(url)) continue; t.push(url); if (t.length >= l) break; } }

async function scrapePinterest(query, count = 1) {
    let images = [];
    const sq = buildImageSearchQueries(query);
    const cl = Math.max(count * 4, count);
    const pql = Math.max(count, Math.ceil(cl / Math.max(sq.length, 1)));
    for (const sq2 of sq) {
        if (images.length >= cl) break;
        try {
            const { data } = await axios.get(`https://id.pinterest.com/search/pins/?q=${encodeURIComponent(sq2)}&rs=typed`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36' },
                timeout: 15000, maxRedirects: 5
            });
            const matches = data.match(/https:\/\/i\.pinimg\.com\/[^\s"'\\]+\.(?:jpg|png|webp)/gi) || [];
            const good = matches.filter(u => (u.includes('/originals/') || u.includes('/736x/') || u.includes('/564x/')) && !u.includes('75x75'));
            addUniqueImages(images, [...new Set(good)].sort(() => Math.random() - 0.5).slice(0, pql), cl);
        } catch (e) { }
    }
    return [...new Set(images)].sort(() => Math.random() - 0.5).slice(0, count);
}

async function downloadImage(url) {
    const r = await axios.get(url, {
        responseType: 'arraybuffer', timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url.includes('pinimg.com') ? 'https://id.pinterest.com/' : 'https://www.google.com/' }
    });
    return Buffer.from(r.data);
}

async function sendImageSearchResults(sock, s, msg, images, query, maxSend) {
    let sent = 0;
    for (let i = 0; i < images.length && sent < maxSend; i++) {
        try {
            const buf = await downloadImage(images[i]); sent++;
            await sock.sendMessage(s, { image: buf, caption: `📌 *Image Search*${maxSend > 1 ? ` (${sent}/${maxSend})` : ''}\n🔎 _${query}_` }, { quoted: msg });
            if (sent < maxSend) await new Promise(r => setTimeout(r, 1000));
        } catch (e) { }
    }
    return sent;
}

module.exports = { buildImageSearchQueries, addUniqueImages, scrapePinterest, downloadImage, sendImageSearchResults };
