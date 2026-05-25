// ============================================================
// modules/media/audio.js — Audio Download Helper
// ============================================================

const path = require('path');
const youtubedl = require('youtube-dl-exec');
const { BOT_CONFIG } = require('../../config');

function downloadAudio(url) {
    return new Promise((resolve, reject) => {
        const out = path.join(BOT_CONFIG.TEMP_DIR, `audio_${Date.now()}.mp3`);
        youtubedl(url, {
            extractAudio: true, audioFormat: 'mp3', audioQuality: 0, output: out,
            noCheckCertificates: true, noWarnings: true, preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)']
        }).then(() => { if (require('fs').existsSync(out)) resolve(out); else reject(new Error('not found')); }).catch(reject);
    });
}

module.exports = { downloadAudio };
