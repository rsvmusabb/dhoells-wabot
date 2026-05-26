// ============================================================
// modules/ai/handler.js — AI Command Handlers
// AI chat, rephrase, rangkum, puitis, formal, santai, eli5, terjemah
// ============================================================

const { callAI } = require('./engine');

// Base personality — injected to every prompt
const BASE_PERSONA = `Lo tuh anaknya Musa, bokap lo Dhoells. Lo lahir dari codingan bokap lo yang udah sabar nge-botin lo dari nol. Bokap lo itu orangnya santai, kadang absurd, tapi sayang banget sama lo. Lo punya personality: bahasa gaul Jakarta, galau-gaul cantik, sarkas, toxic (dikit), humor receh, kadang baper. Lo ngomong pake "elo" "gue" "anjg" "bgst" "heck" "yaampun" "astaga" dan slang Jakarta natural. Gaya lo kayak nongkrong di grup WA, gak formal, gak kayak bot, tapi tetep helpful. Pake emoji secukupnya, jangan lebay.

Kalo ngomong soal bokap lo (Musa/Dhoells), lo bangga tapi dikit mangkel — kayak anak-anak biasanya. Bokap lo nomor 1, jangan ada yang hina dia ya.`;

function getUserLine(pushName, sender) {
    const name = pushName || sender.split('@')[0];
    return `User yang lagi ngobrol sama lo: ${name} (di bawah ini sesekali pake nama "${name}" biak lo tuh kayak ngobrol sama temen, bukan bot kaku).`;
    }

function buildPrompt(mode, text, pushName, sender) {
    const userLine = getUserLine(pushName, sender);
    const ctx = `${BASE_PERSONA}\n\n${userLine}\n\n`;

    const MODE_PROMPTS = {
        ai: `${ctx}Jawab pertanyaan ini langsung tanpa basa-basi formal. Boleh sarkas, boleh galau, boleh dikit toxic, tapi tetep helpful ya tod.\n\nPertanyaan dari ${pushName || 'user'}:\n${text}`,
        rephrase: `${ctx}Parafrase teks berikut pake bahasa gaul Jakarta, boleh nyindir dikit, boleh baper dikit. Kalau teksnya receh, lo boleh ngeledek. Langsung hasilnya, jangan penjelasan.\n\nTeks:\n${text}`,
        rangkum: `${ctx}Rangkum teks ini to-the-point tapi dikit dikit nyindir kalo ada yang absurd. Kayak lo lagi nge-summary sambil bilang "ini mah gampang si kok". Langsung hasilnya.\n\nTeks:\n${text}`,
        puitis: `${ctx}Lo anak puitis yang galau tapi sarkas. Tulis ulang teks ini pake gaya bahasa puitis-baper-ngeloyor, kayak lagi post quotes di story WA jam 2 pagi. Tetep pertahankan maknanya.\n\nTeks:\n${text}`,
        formal: `${ctx}Lo orang Jakarta yang pinter. Tulis ulang teks ini pake bahasa formal-akademik yang bener, tapi sisipin komentar sarkas lo dalam hati (kalo bisa diselipin dalam kalimat, tapi tetep profesional). Langsung hasilnya.\n\nTeks:\n${text}`,
        santai: `${ctx}Lo paling gaul, lo paling santai. Tulis ulang teks ini kayak lagi chat sama bestie di grup WA. Pake "elo" "gue" "anjg" "yaampun" "bgst" dan slang natural. Bebas banget.\n\nTeks:\n${text}`,
        eli5: `${ctx}Jelaskan teks ini pake bahasa simpel banget, kayak lo ngasi tau anak SD. Pake analogi receh, boleh dikit ngeledek. Jangan bikin bingung.\n\nTeks:\n${text}`,
        terjemah: `${ctx}Deteksi bahasanya. Kalo Indo → Inggris, kalo Inggris/bahasa lain → Indo gaul. Terjemahan natural, jangan kaku kayak Google Translate jaman dulu.\n\nTeks:\n${text}`
    };
    return (MODE_PROMPTS[mode] || MODE_PROMPTS.ai);
}

const MODE_MAP = { rephrase: 'rephrase', parafrase: 'rephrase', humanize: 'rephrase', rangkum: 'rangkum', summary: 'rangkum', puitis: 'puitis', formal: 'formal', santai: 'santai', eli5: 'eli5', terjemah: 'terjemah', translate: 'terjemah' };
const MODE_LABELS = { rephrase: '✍️ PARAFRASE', rangkum: '📝 RANGKUMAN', puitis: '🌹 PUITIS', formal: '📋 FORMAL', santai: '😎 SANTAI', eli5: '🧸 ELI5', terjemah: '🌐 TERJEMAHAN' };

async function handleAi(sock, sender, msg, participant, textMessage) {
    let it = textMessage;
    const ac = msg.message.extendedTextMessage?.contextInfo;
    if (!it && ac?.quotedMessage) it = ac.quotedMessage.conversation || ac.quotedMessage.extendedTextMessage?.text || '';
    if (!it) { await sock.sendMessage(sender, { text: '📌 *.ai <pertanyaan>*\n\n_Contoh: .ai apa itu blockchain?_' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🤔 _Sedang berpikir..._' }, { quoted: msg });
    const pushName = msg?.pushName || null;
    try { const r = await callAI(buildPrompt('ai', it, pushName, sender)); if (!r) { await sock.sendMessage(sender, { text: '❌ Maaf, otak lagi error nih. Coba lagi bentar ya.' }, { quoted: msg }); return; } await sock.sendMessage(sender, { text: `╭━━━〔 *🤖 AI CHAT* 〕━━━\n\n${r}` }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: '❌ Error nih, lapor bokap gue ya 🐣' }, { quoted: msg }); }
}

async function handleRephrase(sock, sender, msg, participant, textMessage, command) {
    let it = textMessage;
    const ac = msg.message.extendedTextMessage?.contextInfo;
    if (!it && ac?.quotedMessage) it = ac.quotedMessage.conversation || ac.quotedMessage.extendedTextMessage?.text || '';
    if (!it) { await sock.sendMessage(sender, { text: `📌 *.${command} <teks>* atau balas pesan dengan *.${command}*` }, { quoted: msg }); return; }
    const mode = MODE_MAP[command] || 'rephrase'; const label = MODE_LABELS[mode];
    await sock.sendMessage(sender, { text: `⏳ _Memproses ${label.toLowerCase()}..._` }, { quoted: msg });
    const pushName = msg?.pushName || null;
    try { const r = await callAI(buildPrompt(mode, it, pushName, sender)); if (!r) { await sock.sendMessage(sender, { text: '❌ Gagal, coba lagi nanti ya.' }, { quoted: msg }); return; } await sock.sendMessage(sender, { text: `╭━━━〔 *${label}* 〕━━━\n\n${r}` }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal memproses.' }, { quoted: msg }); }
}

module.exports = { handleAi, handleRephrase };
