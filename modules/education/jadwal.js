// ============================================================
// modules/education/jadwal.js — Jadwal Kuliah Command Handler
// Kirim file jadwal (gambar) berdasarkan kode jadwal
// ============================================================

const fs = require('fs');
const path = require('path');

// Mapping kode jadwal ke file gambar
const JADWAL_MAP = {
    'semester2': { file: 'jadwal semester 2.jpeg', title: 'Jadwal Semester 2' },
    'semester':  { file: 'jadwal semester 2.jpeg', title: 'Jadwal Semester 2' },
    's2':        { file: 'jadwal semester 2.jpeg', title: 'Jadwal Semester 2' },
    'lab':       { file: 'jadwal lab.jpeg',         title: 'Jadwal Lab' },
    'praktikum': { file: 'jadwal praktikum.jpeg',   title: 'Jadwal Praktikum' },
    'prak':      { file: 'jadwal praktikum.jpeg',   title: 'Jadwal Praktikum' },
    'uts':       { file: 'jadwal uts.jpeg',          title: 'Jadwal UTS' },
};

// Base directory: cari folder jadwal dari working directory
// Coba beberapa kemungkinan lokasi
function findJadwalDir() {
    const candidates = [
        path.join(process.cwd(), 'jadwal'),                          // cwd/jadwal
        path.join(path.dirname(process.argv[1]), 'jadwal'),           // lokasi index.js/jadwal
        path.resolve(__dirname, '../../jadwal'),                       // relative dari module
        '/mnt/c/Users/asus/OneDrive/Dokumen/botwa-push/jadwal',      // WSL path
        '/home/container/jadwal',                                     // Pterodactyl container
    ];
    for (const dir of candidates) {
        if (fs.existsSync(dir)) {
            return dir;
        }
    }
    // Fallback ke cwd
    return path.join(process.cwd(), 'jadwal');
}

const BASE_DIR = findJadwalDir();

function getAvailableList() {
    let text = '📅 *JADWAL KULIAH*\n\n';
    text += 'Ketik *.jadwal <kode>* untuk lihat jadwal\n\n';
    text += '  ▸ *.jadwal semester2* — Jadwal Semester 2\n';
    text += '  ▸ *.jadwal lab* — Jadwal Lab\n';
    text += '  ▸ *.jadwal praktikum* — Jadwal Praktikum\n';
    text += '  ▸ *.jadwal uts* — Jadwal UTS\n';
    return text;
}

async function handleJadwal(sock, sender, msg, participant, textMessage) {
    const input = textMessage.trim().toLowerCase();

    // Tanpa argumen → tampilkan daftar jadwal
    if (!input) {
        await sock.sendMessage(sender, { text: getAvailableList() }, { quoted: msg });
        return;
    }

    // Cari jadwal
    const jadwal = JADWAL_MAP[input];
    if (!jadwal) {
        await sock.sendMessage(sender, {
            text: `❌ Jadwal *${input}* tidak ditemukan!\n\nKetik *.jadwal* untuk lihat daftar jadwal tersedia.`
        }, { quoted: msg });
        return;
    }

    const filePath = path.join(BASE_DIR, jadwal.file);

    // Cek file ada
    if (!fs.existsSync(filePath)) {
        await sock.sendMessage(sender, {
            text: `❌ File jadwal *${jadwal.title}* tidak ditemukan.\nPath: ${filePath}\n\nPastikan file ada di folder jadwal/.`
        }, { quoted: msg });
        return;
    }

    // Kirim gambar
    try {
        const fileBuffer = fs.readFileSync(filePath);
        await sock.sendMessage(sender, {
            image: fileBuffer,
            caption: `📅 *${jadwal.title}*\n\nJadwal Kuliah Dhoells Bot`
        }, { quoted: msg });
    } catch (err) {
        console.error('[JADWAL ERROR]', err.message);
        await sock.sendMessage(sender, {
            text: `❌ Gagal mengirim jadwal *${jadwal.title}*.\nError: ${err.message}`
        }, { quoted: msg });
    }
}

module.exports = { handleJadwal };
