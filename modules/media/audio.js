// ============================================================
// modules/media/audio.js — Audio download helper
// ============================================================

const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

async function downloadAudio(videoUrl) {
    const tmpDir = './temp_audio';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const outFile = path.join(tmpDir, `audio_${Date.now()}.mp3`);

    await youtubedl(videoUrl, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: outFile,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
            'referer:youtube.com',
            'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ]
    });

    return outFile;
}

module.exports = { downloadAudio };
