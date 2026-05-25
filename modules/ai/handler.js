// ============================================================
// modules/ai/handler.js — AI Command Handlers
// AI chat, rephrase, rangkum, puitis, formal, santai, eli5, terjemah
// ============================================================

const { callAI } = require('./engine');

const PROMPTS = {
    rephrase: (t) => `Parafrase teks berikut agar terdengar alami seperti ditulis mahasiswa Indonesia (bukan AI). Pertahankan makna yang sama persis. JANGAN tambahkan penjelasan, langsung tulis hasilnya saja.\n\nTeks:\n${t}`,
    rangkum: (t) => `Rangkum teks berikut menjadi ringkasan yang padat dan jelas dalam bahasa Indonesia. Ambil poin-poin penting saja. JANGAN tambahkan penjelasan apapun, langsung tulis rangkumannya saja.\n\nTeks:\n${t}`,
    puitis: (t) => `Tulis ulang teks berikut dengan gaya bahasa puitis dan indah dalam bahasa Indonesia. Gunakan majas, perumpamaan, dan diksi yang estetik. Tetap pertahankan makna aslinya. JANGAN tambahkan penjelasan, langsung tulis hasilnya saja.\n\nTeks:\n${t}`,
    formal: (t) => `Tulis ulang teks berikut dengan bahasa Indonesia formal akademik yang cocok untuk laporan ilmiah, skripsi, atau jurnal. JANGAN tambahkan penjelasan, langsung tulis hasilnya saja.\n\nTeks:\n${t}`,
    santai: (t) => `Tulis ulang teks berikut dengan bahasa santai gaul anak muda. Boleh pakai singkatan wajar (yg, gak, bgt, emg, dll). Buat terdengar kayak ngobrol sama temen. JANGAN tambahkan penjelasan, langsung tulis hasilnya saja.\n\nTeks:\n${t}`,
    eli5: (t) => `Jelaskan teks berikut dengan bahasa yang sangat sederhana, seolah-olah kamu menjelaskan ke anak kecil berumur 5 tahun. Gunakan analogi sederhana dan kata-kata mudah. Dalam bahasa Indonesia. JANGAN tambahkan penjelasan tambahan, langsung tulis hasilnya saja.\n\nTeks:\n${t}`,
    terjemah: (t) => `Deteksi bahasa dari teks berikut. Jika bahasa Indonesia, terjemahkan ke bahasa Inggris. Jika bahasa Inggris atau bahasa lain, terjemahkan ke bahasa Indonesia. JANGAN tambahkan penjelasan, langsung tulis terjemahannya saja.\n\nTeks:\n${t}`
};

const MODE_MAP = { rephrase: 'rephrase', parafrase: 'rephrase', humanize: 'rephrase', rangkum: 'rangkum', summary: 'rangkum', puitis: 'puitis', formal: 'formal', santai: 'santai', eli5: 'eli5', terjemah: 'terjemah', translate: 'terjemah' };
const MODE_LABELS = { rephrase: '✍️ PARAFRASE', rangkum: '📝 RANGKUMAN', puitis: '🌹 PUITIS', formal: '📋 FORMAL', santai: '😎 SANTAI', eli5: '🧸 ELI5', terjemah: '🌐 TERJEMAHAN' };

async function handleAi(sock, sender, msg, participant, textMessage) {
    let it = textMessage;
    const ac = msg.message.extendedTextMessage?.contextInfo;
    if (!it && ac?.quotedMessage) it = ac.quotedMessage.conversation || ac.quotedMessage.extendedTextMessage?.text || '';
    if (!it) { await sock.sendMessage(sender, { text: '📌 *.ai <pertanyaan>*\n\n_Contoh: .ai apa itu blockchain?_' }, { quoted: msg }); return; }
    await sock.sendMessage(sender, { text: '🤔 _Sedang berpikir..._' }, { quoted: msg });
    try { const r = await callAI(`Jawab pertanyaan berikut dalam bahasa Indonesia dengan jelas dan ringkas. Jawab langsung tanpa basa-basi.\n\n${it}`); if (!r) { await sock.sendMessage(sender, { text: '❌ Gagal mendapatkan jawaban.' }, { quoted: msg }); return; } await sock.sendMessage(sender, { text: `╭━━━〔 *🤖 AI CHAT* 〕━━━\n\n✅ Jawaban:\n\n${r}` }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal memproses.' }, { quoted: msg }); }
}

async function handleRephrase(sock, sender, msg, participant, textMessage, command) {
    let it = textMessage;
    const ac = msg.message.extendedTextMessage?.contextInfo;
    if (!it && ac?.quotedMessage) it = ac.quotedMessage.conversation || ac.quotedMessage.extendedTextMessage?.text || '';
    if (!it) { await sock.sendMessage(sender, { text: `📌 *.${command} <teks>* atau balas pesan dengan *.${command}*` }, { quoted: msg }); return; }
    const mode = MODE_MAP[command] || 'rephrase'; const label = MODE_LABELS[mode];
    await sock.sendMessage(sender, { text: `⏳ _Memproses ${label.toLowerCase()}..._` }, { quoted: msg });
    try { const r = await callAI(PROMPTS[mode](it)); if (!r) { await sock.sendMessage(sender, { text: '❌ Gagal memproses. Coba lagi.' }, { quoted: msg }); return; } await sock.sendMessage(sender, { text: `╭━━━〔 *${label}* 〕━━━\n\n✅ Hasil:\n\n${r}` }, { quoted: msg }); } catch (e) { await sock.sendMessage(sender, { text: '❌ Gagal memproses.' }, { quoted: msg }); }
}

module.exports = { handleAi, handleRephrase };
