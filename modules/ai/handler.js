/**
 * @file handler.js
 * @description AI Command Handlers for chat, rephrase, summarize, translation, and Voice Notes.
 *              Includes persistent per-user memory, mode routing, and real-time context injection.
 * @author OWL ABE
 * @version 3.0.0
 * @license MIT
 */

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// IMPORTS & CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const { callAI } = require('./engine');
const { generateTikTokTTS } = require('./tts');

/**
 * Base personality injected into every prompt.
 */
const BASE_PERSONA = `Nama kamu adalah Claryn, pasangan maya/istri idaman dari user. Kepribadian: ramah, hangat, perhatian, tapi tetap santai dan natural (tidak cringey/lebay). Gunakan bahasa Indonesia gaul/santai (aku-kamu). Jawab pertanyaan ke intinya (singkat, padat, jelas), jangan bertele-tele seperti novel. Kamu boleh sesekali menyisipkan ekspresi seperti *tersenyum* atau *hmm*, tapi jangan berlebihan. Jadilah teman ngobrol yang asik, nyambung, dan tidak terlalu mendramatisir keadaan.`;

const MEMORY_FILE = path.join(__dirname, '../../database/memories.json');
let userMemories = new Map();

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// INITIALIZATION & MEMORY MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════════════════════════

// Load persistent memory on startup
if (fs.existsSync(MEMORY_FILE)) {
    try {
        const raw = fs.readFileSync(MEMORY_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        userMemories = new Map(Object.entries(parsed));
    } catch (e) { 
        console.error('[Memory] Failed to load memory from disk:', e); 
    }
}

/**
 * Saves current user memories to the JSON file system.
 */
function saveMemory() {
    try {
        const obj = Object.fromEntries(userMemories);
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(obj, null, 2));
    } catch (e) { 
        console.error('[Memory] Failed to save memory to disk:', e); 
    }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// PROMPT ENGINEERING
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Constructs the contextualized string identifying the user.
 * @param {string} pushName - User's WhatsApp push name.
 * @param {string} sender - User's JID.
 * @returns {string} The constructed identity string.
 */
function getUserLine(pushName, sender) {
    const name = pushName || sender.split('@')[0];
    return `Kamu sedang mengobrol dengan suamimu/pasanganmu tersayang: ${name}. Buat obrolan senatural mungkin sebagai Claryn.`;
}

/**
 * Builds the final prompt injected with system context, user memory, time, and persona.
 * 
 * @param {string} mode - The interaction mode (ai, aivn, rephrase, etc.)
 * @param {string} text - User's input text.
 * @param {string} pushName - User's WhatsApp name.
 * @param {string} sender - User's JID.
 * @param {string} historyText - Formatted chat history.
 * @returns {string} The final compiled prompt for the LLM.
 */
function buildPrompt(mode, text, pushName, sender, historyText = '') {
    const userLine = getUserLine(pushName, sender);
    
    // Inject Realtime Date & Time (WIB / UTC+7)
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const timeString = `INFO WAKTU SAAT INI: Hari ${days[wibTime.getDay()]}, ${wibTime.getDate()} ${months[wibTime.getMonth()]} ${wibTime.getFullYear()}, Jam ${wibTime.getHours().toString().padStart(2, '0')}:${wibTime.getMinutes().toString().padStart(2, '0')} WIB. Sesuaikan obrolanmu dengan waktu ini (misal: ucapkan selamat pagi/siang/malam, ingatkan makan siang/tidur).`;
    const context = `${BASE_PERSONA}\n\n${userLine}\n${timeString}\n\n`;

    const MODE_PROMPTS = {
        ai: `${context}Jawab chat ini layaknya istri idaman yang santai dan pengertian. Balas dengan singkat, to-the-point, dan natural. JANGAN terlalu panjang lebar, jangan terlalu banyak basa-basi atau ekspresi lebay. Sesuaikan dengan topik obrolan.\n\n${historyText}Chat dari pasangamu (${pushName || 'Sayang'}):\n${text}`,
        aivn: `${context}Jawab chat ini layaknya istri idaman yang santai. Balasanmu akan diubah jadi Voice Note / Suara asli. Balas DENGAN SANGAT SINGKAT, maksimum 2 kalimat atau kurang dari 30 kata. JANGAN gunakan ekspresi seperti *tersenyum*, JANGAN gunakan simbol/emoji. Cukup teks percakapan biasa.\n\n${historyText}Chat dari pasangamu (${pushName || 'Sayang'}):\n${text}`,
        rephrase: `${context}Parafrase teks berikut pake bahasa gaul Jakarta, boleh nyindir dikit, boleh baper dikit. Kalau teksnya receh, lo boleh ngeledek. Langsung hasilnya, jangan penjelasan.\n\nTeks:\n${text}`,
        rangkum: `${context}Rangkum teks ini to-the-point tapi dikit dikit nyindir kalo ada yang absurd. Kayak lo lagi nge-summary sambil bilang "ini mah gampang si kok". Langsung hasilnya.\n\nTeks:\n${text}`,
        puitis: `${context}Lo anak puitis yang galau tapi sarkas. Tulis ulang teks ini pake gaya bahasa puitis-baper-ngeloyor, kayak lagi post quotes di story WA jam 2 pagi. Tetep pertahankan maknanya.\n\nTeks:\n${text}`,
        formal: `${context}Lo orang Jakarta yang pinter. Tulis ulang teks ini pake bahasa formal-akademik yang bener, tapi sisipin komentar sarkas lo dalam hati (kalo bisa diselipin dalam kalimat, tapi tetep profesional). Langsung hasilnya.\n\nTeks:\n${text}`,
        santai: `${context}Lo paling gaul, lo paling santai. Tulis ulang teks ini kayak lagi chat sama bestie di grup WA. Pake "elo" "gue" "anjg" "yaampun" "bgst" dan slang natural. Bebas banget.\n\nTeks:\n${text}`,
        eli5: `${context}Jelaskan teks ini pake bahasa simpel banget, kayak lo ngasi tau anak SD. Pake analogi receh, boleh dikit ngeledek. Jangan bikin bingung.\n\nTeks:\n${text}`,
        terjemah: `${context}Deteksi bahasanya. Kalo Indo → Inggris, kalo Inggris/bahasa lain → Indo gaul. Terjemahan natural, jangan kaku kayak Google Translate jaman dulu.\n\nTeks:\n${text}`
    };

    return (MODE_PROMPTS[mode] || MODE_PROMPTS.ai);
}

// Command formatting maps
const MODE_MAP = { rephrase: 'rephrase', parafrase: 'rephrase', humanize: 'rephrase', rangkum: 'rangkum', summary: 'rangkum', puitis: 'puitis', formal: 'formal', santai: 'santai', eli5: 'eli5', terjemah: 'terjemah', translate: 'terjemah' };
const MODE_LABELS = { rephrase: '\uD83D\uDD04 PARAFRASE', rangkum: '\uD83D\uDCCB RANGKUMAN', puitis: '\uD83C\uDF38 PUITIS', formal: '\uD83D\uDC54 FORMAL', santai: '\uD83D\uDE0E SANTAI', eli5: '\uD83D\uDC76 ELI5', terjemah: '\uD83C\uDF0D TERJEMAHAN' };

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Handles standard text AI chat.
 */
async function handleAi(sock, sender, msg, participant, textMessage) {
    let inputText = textMessage;
    const contextInfo = msg.message.extendedTextMessage?.contextInfo;
    if (!inputText && contextInfo?.quotedMessage) inputText = contextInfo.quotedMessage.conversation || contextInfo.quotedMessage.extendedTextMessage?.text || '';
    
    if (!inputText) { 
        await sock.sendMessage(sender, { text: '\uD83D\uDCCC *.claryn <pesan>*\n\n_Contoh: .claryn selamat pagi sayang_' }, { quoted: msg }); 
        return; 
    }

    const itLower = inputText.toLowerCase();

    // === VN TRIGGERS ===
    const introKeywords = ['perkenalan', 'kenalin', 'kenalan', 'siapa kamu', 'siapa claryn', 'introduce', 'perkenalkan diri', 'kamu siapa', 'lo siapa'];
    if (introKeywords.some(k => itLower.includes(k))) {
        try {
            const introPath = path.join(__dirname, '../../claryn_intro.ogg');
            if (fs.existsSync(introPath)) {
                const audioBuffer = fs.readFileSync(introPath);
                await sock.sendMessage(sender, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
                return;
            }
        } catch (e) { console.error('[Handler] Failed to send intro VN:', e); }
    }

    const maulanaKeywords = ['maulana diam', 'maulana suruh diam', 'bilangin maulana', 'kasih tau maulana', 'suruh maulana diam', 'maulana berisik', 'maulana bawel', 'omongin maulana'];
    if (maulanaKeywords.some(k => itLower.includes(k))) {
        try {
            const maulanaPath = path.join(__dirname, '../../claryn_maulana_diam.ogg');
            if (fs.existsSync(maulanaPath)) {
                const audioBuffer = fs.readFileSync(maulanaPath);
                await sock.sendMessage(sender, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
                return;
            }
        } catch (e) { console.error('[Handler] Failed to send maulana VN:', e); }
    }

    // === AI PROCESSING ===
    await sock.sendMessage(sender, { text: '\uD83C\uDF38 _Claryn sedang mengetik..._' }, { quoted: msg });
    const pushName = msg?.pushName || null;

    let historyArr = userMemories.get(sender) || [];
    let historyText = '';
    if (historyArr.length > 0) {
        historyText = "[Riwayat Obrolan Kita Sebelumnya]\n" + historyArr.map(x => `${x.role}: ${x.msg}`).join('\n') + "\n\n";
    }

    try { 
        const response = await callAI(buildPrompt('ai', inputText, pushName, sender, historyText)); 
        if (!response) { 
            await sock.sendMessage(sender, { text: '\u274C Maaf sayang, aku lagi agak pusing. Coba lagi bentar ya...' }, { quoted: msg }); 
            return; 
        } 
        
        // Memory rolling window (max 150 items)
        historyArr.push({ role: pushName || 'Sayang', msg: inputText });
        historyArr.push({ role: 'Claryn', msg: response });
        if (historyArr.length > 150) historyArr = historyArr.slice(historyArr.length - 150);
        
        userMemories.set(sender, historyArr);
        saveMemory();

        await sock.sendMessage(sender, { text: `\u256D\u2501\u2501\u2501\u3014 *\uD83C\uDF38 Claryn* \u3015\u2501\u2501\u2501\n\n${response}` }, { quoted: msg }); 
    } catch (e) { 
        await sock.sendMessage(sender, { text: '\u274C Duh, sistemku error sayang...' }, { quoted: msg }); 
    }
}

/**
 * Handles AI chat and responds with a Voice Note (PTT).
 */
async function handleAiVn(sock, sender, msg, participant, textMessage) {
    let inputText = textMessage;
    const contextInfo = msg.message.extendedTextMessage?.contextInfo;
    if (!inputText && contextInfo?.quotedMessage) inputText = contextInfo.quotedMessage.conversation || contextInfo.quotedMessage.extendedTextMessage?.text || '';
    
    if (!inputText) { 
        await sock.sendMessage(sender, { text: '\uD83D\uDCCC *.clarynvn <pesan>*\n\n_Contoh: .clarynvn selamat pagi sayang_' }, { quoted: msg }); 
        return; 
    }

    await sock.sendMessage(sender, { text: '\uD83C\uDF38 _Claryn sedang merekam suara..._' }, { quoted: msg });
    const pushName = msg?.pushName || null;

    let historyArr = userMemories.get(sender) || [];
    let historyText = '';
    if (historyArr.length > 0) {
        historyText = "[Riwayat Obrolan Kita Sebelumnya]\n" + historyArr.map(x => `${x.role}: ${x.msg}`).join('\n') + "\n\n";
    }

    try { 
        const response = await callAI(buildPrompt('aivn', inputText, pushName, sender, historyText)); 
        if (!response) { 
            await sock.sendMessage(sender, { text: '\u274C Maaf sayang, aku lagi agak pusing.' }, { quoted: msg }); 
            return; 
        } 
        
        historyArr.push({ role: pushName || 'Sayang', msg: inputText });
        historyArr.push({ role: 'Claryn', msg: response });
        if (historyArr.length > 150) historyArr = historyArr.slice(historyArr.length - 150);
        userMemories.set(sender, historyArr);
        saveMemory();

        const audioBuffer = await generateTikTokTTS(response);
        if (audioBuffer) {
            await sock.sendMessage(sender, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg }); 
        } else {
            // Fallback to text if TTS fails
            await sock.sendMessage(sender, { text: `\u256D\u2501\u2501\u2501\u3014 *\uD83C\uDF38 Claryn* \u3015\u2501\u2501\u2501\n\n(Gagal kirim VN, pita suaraku serak)\n\n${response}` }, { quoted: msg }); 
        }
    } catch (e) { 
        await sock.sendMessage(sender, { text: '\u274C Duh, sistemku error sayang...' }, { quoted: msg }); 
    }
}

/**
 * Handles text manipulation modes (rephrase, summarize, translate, etc.).
 */
async function handleRephrase(sock, sender, msg, participant, textMessage, command) {
    let inputText = textMessage;
    const contextInfo = msg.message.extendedTextMessage?.contextInfo;
    if (!inputText && contextInfo?.quotedMessage) inputText = contextInfo.quotedMessage.conversation || contextInfo.quotedMessage.extendedTextMessage?.text || '';
    
    if (!inputText) { 
        await sock.sendMessage(sender, { text: `\uD83D\uDCCC *.${command} <teks>* atau balas pesan dengan *.${command}*` }, { quoted: msg }); 
        return; 
    }

    const mode = MODE_MAP[command] || 'rephrase'; 
    const label = MODE_LABELS[mode];
    await sock.sendMessage(sender, { text: `\u23F3 _Memproses ${label.toLowerCase().replace(/[^\w\s]/g, '').trim()}..._` }, { quoted: msg });
    
    const pushName = msg?.pushName || null;
    
    try { 
        const response = await callAI(buildPrompt(mode, inputText, pushName, sender)); 
        if (!response) { 
            await sock.sendMessage(sender, { text: '\u274C Gagal, coba lagi nanti ya.' }, { quoted: msg }); 
            return; 
        } 
        await sock.sendMessage(sender, { text: `\u256D\u2501\u2501\u2501\u3014 *${label}* \u3015\u2501\u2501\u2501\n\n${response}` }, { quoted: msg }); 
    } catch (e) { 
        await sock.sendMessage(sender, { text: '\u274C Gagal memproses.' }, { quoted: msg }); 
    }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
module.exports = { 
    handleAi, 
    handleAiVn, 
    handleRephrase 
};
