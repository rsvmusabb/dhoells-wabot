// ============================================================
// modules/education/fisika.js — Modul Fisika Command Handler
// Kirim file PDF modul fisika berdasarkan kode modul
// ============================================================

const fs = require('fs');
const path = require('path');

// Mapping kode modul ke file PDF
const MODUL_MAP = {
    // M series - Mekanika
    'm1':  { file: 'M1.pdf',  title: 'M1 — Kinematika Gerak Lurus' },
    'm2':  { file: 'M2.pdf',  title: 'M2 — Gerak Lurus Beraturan & Berubah Beraturan' },
    'm3':  { file: 'M3.pdf',  title: 'M3 — Gerak Parabola & Gerak Melingkar' },
    'm11': { file: 'M11.pdf', title: 'M11 — Hukum Newton & Gaya Gesek' },
    'm12': { file: 'M12.pdf', title: 'M12 — Usaha, Energi, & Daya' },
    // L series - Listrik & Magnet
    'l1':  { file: 'L1 (2).pdf', title: 'L1 — Listrik Statis' },
    'l2':  { file: 'L2 (1).pdf', title: 'L2 — Listrik Dinamis' },
    'l3':  { file: 'L3.pdf',  title: 'L3 — Rangkaian Listrik' },
    'l4':  { file: 'L4.pdf',  title: 'L4 — Medan Magnet & Induksi Elektromagnetik' },
    'l5':  { file: 'L5.pdf',  title: 'L5 — Arus Bolak-balik & Rangkaian AC' },
    'l6':  { file: 'L6.pdf',  title: 'L6 — Gelombang Elektromagnetik' },
    // K series - Kalor & Termodinamika
    'k1':  { file: 'K1 (1).pdf', title: 'K1 — Suhu & Kalor' },
    'k2':  { file: 'K2.pdf',  title: 'K2 — Termodinamika' },
    // O series - Optika & Fisika Modern
    'o1':  { file: 'O1.pdf',  title: 'O1 — Optika Geometris' },
    'o7':  { file: 'O7.pdf',  title: 'O7 — Fisika Modern & Inti Atom' },
    // MO - Modul Overview / Misc
    'mo':  { file: 'MO.pdf',  title: 'MO — Modul Overview Fisika' },
};

// Base directory: cari folder Modul Fisika dari berbagai kemungkinan lokasi
function findFisikaDir() {
    const candidates = [
        path.join(process.cwd(), 'Modul Fisika'),                          // cwd/Modul Fisika
        path.join(path.dirname(process.argv[1]), 'Modul Fisika'),           // lokasi index.js/Modul Fisika
        path.resolve(__dirname, '../../Modul Fisika'),                       // relative dari module
        '/mnt/c/Users/asus/OneDrive/Dokumen/botwa-push/Modul Fisika',      // WSL path
        '/home/container/Modul Fisika',                                     // Pterodactyl container
    ];
    for (const dir of candidates) {
        if (fs.existsSync(dir)) {
            return dir;
        }
    }
    // Fallback ke cwd
    return path.join(process.cwd(), 'Modul Fisika');
}

const BASE_DIR = findFisikaDir();

function getAvailableList() {
    const entries = Object.entries(MODUL_MAP);
    let text = '📚 *MODUL FISIKA*\n\n';
    text += 'Ketik *.fisika <kode>* untuk download modul\n\n';

    // Group by prefix
    const groups = {};
    for (const [kode, info] of entries) {
        const prefix = kode.replace(/[0-9]/g, '').toUpperCase();
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push({ kode, ...info });
    }

    const groupNames = {
        'M': '⚙️ *MEKANIKA*',
        'L': '⚡ *LISTRIK & MAGNET*',
        'K': '🔥 *KALOR & TERMODINAMIKA*',
        'O': '🔬 *OPTIKA & FISIKA MODERN*',
        'MO': '📋 *OVERVIEW*',
    };

    for (const [prefix, items] of Object.entries(groups)) {
        text += `${groupNames[prefix] || prefix}\n`;
        for (const item of items) {
            text += `  ▸ *.fisika ${item.kode}* — ${item.title}\n`;
        }
        text += '\n';
    }

    text += 'Contoh: *.fisika m1*\n';
    return text;
}

async function handleFisika(sock, sender, msg, participant, textMessage) {
    const input = textMessage.trim().toLowerCase();

    // Tanpa argumen → tampilkan daftar modul
    if (!input) {
        await sock.sendMessage(sender, { text: getAvailableList() }, { quoted: msg });
        return;
    }

    // Cari modul
    const modul = MODUL_MAP[input];
    if (!modul) {
        await sock.sendMessage(sender, {
            text: `❌ Modul *${input}* tidak ditemukan!\n\nKetik *.fisika* untuk lihat daftar modul tersedia.`
        }, { quoted: msg });
        return;
    }

    const filePath = path.join(BASE_DIR, modul.file);

    // Cek file ada
    if (!fs.existsSync(filePath)) {
        await sock.sendMessage(sender, {
            text: `❌ File modul *${modul.title}* tidak ditemukan.\nPath: ${filePath}\n\nPastikan file ada di folder "Modul Fisika/".`
        }, { quoted: msg });
        return;
    }

    // Kirim PDF
    try {
        const fileBuffer = fs.readFileSync(filePath);
        await sock.sendMessage(sender, {
            document: fileBuffer,
            fileName: modul.file,
            mimetype: 'application/pdf',
            caption: `📚 *${modul.title}*\n\nModul Fisika Dhoells Bot`
        }, { quoted: msg });
    } catch (err) {
        console.error('[FISIKA ERROR]', err.message);
        await sock.sendMessage(sender, {
            text: `❌ Gagal mengirim modul *${modul.title}*.\nError: ${err.message}`
        }, { quoted: msg });
    }
}

module.exports = { handleFisika };
