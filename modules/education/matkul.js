// ============================================================
// modules/education/matkul.js - Materi Matkul Command Handler
// Baca file dari subfolder FILE/ dan IMAGE/ di setiap folder kelas.
// ============================================================

const fs = require('fs');
const path = require('path');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']);
const TEXT_EXTS = new Set(['.txt', '.md']);
const DOCUMENT_MIMES = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pps': 'application/vnd.ms-powerpoint',
    '.ppsx': 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
};

// Subfolder yang di-scan (urutan = prioritas tampilan)
const SCAN_SUBDIRS = ['FILE', 'IMAGE'];

function findMatkulDir() {
    const candidates = [
        path.join(process.cwd(), 'MATKUL'),
        path.join(path.dirname(process.argv[1] || process.cwd()), 'MATKUL'),
        path.resolve(__dirname, '../../MATKUL'),
        '/mnt/c/Users/asus/OneDrive/Dokumen/botwa-push/MATKUL',
        '/home/container/MATKUL',
    ];

    for (const dir of candidates) {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
    }
    return path.join(process.cwd(), 'MATKUL');
}

function naturalSort(a, b) {
    return a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });
}

function getClassDirs(baseDir = findMatkulDir()) {
    if (!fs.existsSync(baseDir)) return [];
    return fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort(naturalSort);
}

function normalizeClassKey(value) {
    return String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function resolveClassDir(input, baseDir = findMatkulDir()) {
    const classes = getClassDirs(baseDir);
    const key = normalizeClassKey(input);
    if (!key) return null;

    const aliases = new Map();
    for (const className of classes) {
        const classKey = normalizeClassKey(className);
        aliases.set(classKey, className);
        aliases.set(classKey.replace(/-/g, ''), className);
        const letter = classKey.match(/^kti-?([a-z])$/);
        if (letter) aliases.set(letter[1], className);
    }

    return aliases.get(key) || aliases.get(key.replace(/-/g, '')) || null;
}

/**
 * Scan semua file dari subfolder (FILE/, IMAGE/) di dalam folder kelas.
 * Return array of { name, path, ext, subdir, isImage, isText, isDoc }
 */
function getClassFiles(className, baseDir = findMatkulDir()) {
    const classDir = path.join(baseDir, className);
    if (!fs.existsSync(classDir)) return [];

    const files = [];

    // Scan subfolder FILE/ dan IMAGE/
    for (const subdir of SCAN_SUBDIRS) {
        const subDir = path.join(classDir, subdir);
        if (!fs.existsSync(subDir) || !fs.statSync(subDir).isDirectory()) continue;

        const entries = fs.readdirSync(subDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const ext = path.extname(entry.name).toLowerCase();
            files.push({
                name: entry.name,
                path: path.join(subDir, entry.name),
                ext,
                subdir,
                isImage: IMAGE_EXTS.has(ext),
                isText: TEXT_EXTS.has(ext),
                isDoc: !IMAGE_EXTS.has(ext) && !TEXT_EXTS.has(ext),
            });
        }
    }

    // Juga scan file langsung di root folder kelas (misal: LINK MATERI.txt)
    const rootEntries = fs.readdirSync(classDir, { withFileTypes: true });
    for (const entry of rootEntries) {
        if (!entry.isFile()) continue;
        const ext = path.extname(entry.name).toLowerCase();
        files.push({
            name: entry.name,
            path: path.join(classDir, entry.name),
            ext,
            subdir: '.',
            isImage: IMAGE_EXTS.has(ext),
            isText: TEXT_EXTS.has(ext),
            isDoc: !IMAGE_EXTS.has(ext) && !TEXT_EXTS.has(ext),
        });
    }

    files.sort((a, b) => naturalSort(a.name, b.name));
    return files;
}

/**
 * Hitung jumlah file per subfolder untuk info
 */
function getFileCounts(className, baseDir = findMatkulDir()) {
    const classDir = path.join(baseDir, className);
    const counts = { total: 0, file: 0, image: 0, root: 0 };

    for (const subdir of SCAN_SUBDIRS) {
        const subDir = path.join(classDir, subdir);
        if (!fs.existsSync(subDir) || !fs.statSync(subDir).isDirectory()) continue;
        const entries = fs.readdirSync(subDir, { withFileTypes: true }).filter(e => e.isFile());
        counts.total += entries.length;
        if (subdir === 'FILE') counts.file = entries.length;
        if (subdir === 'IMAGE') counts.image = entries.length;
    }

    // Root files
    const rootEntries = fs.readdirSync(classDir, { withFileTypes: true }).filter(e => e.isFile());
    counts.root = rootEntries.length;
    counts.total += rootEntries.length;

    return counts;
}

function formatClassList(baseDir = findMatkulDir()) {
    const classes = getClassDirs(baseDir);

    let text = '╔══════════════════════════╗\n';
    text +=   '║   📚 MATERI KULIAH KTI   ║\n';
    text +=   '╚══════════════════════════╝\n\n';

    if (!classes.length) {
        text += '❌ Folder MATKUL belum berisi kelas.\n';
        text += `📂 Path: ${baseDir}`;
        return text;
    }

    text += 'Ketik *.matkul <kelas>* untuk lihat isi materi.\n\n';

    for (const className of classes) {
        const counts = getFileCounts(className, baseDir);
        const subInfo = [];
        if (counts.file) subInfo.push(`📄 ${counts.file} file`);
        if (counts.image) subInfo.push('🖼️ ' + counts.image + ' gambar');
        if (counts.root) subInfo.push('🔗 ' + counts.root + ' link');
        const info = subInfo.length ? `  (${subInfo.join(', ')})` : '';
        text += `  📁 *.matkul ${className.toLowerCase()}* — ${counts.total} materi${info}\n`;
    }

    text += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    text += '📌 Contoh:\n';
    text += '  .matkul kti-a\n';
    text += '  .matkul kti-a 1';
    return text;
}

function formatMaterialList(className, baseDir = findMatkulDir(), intro) {
    const files = getClassFiles(className, baseDir);
    const counts = getFileCounts(className, baseDir);

    let text = '';
    if (intro) text = `${intro}\n\n`;

    text += `╔══════════════════════════╗\n`;
    text += `║  📚 MATERI ${className.toUpperCase().padEnd(10)} ║\n`;
    text += `╚══════════════════════════╝\n\n`;

    // Info ringkasan
    const subInfo = [];
    if (counts.file) subInfo.push(`📄 ${counts.file} file`);
    if (counts.image) subInfo.push(`🖼️ ${counts.image} gambar`);
    if (counts.root) subInfo.push(`🔗 ${counts.root} link`);
    if (subInfo.length) text += `${subInfo.join('  |  ')}\n`;
    text += `Total: ${files.length} materi\n`;
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    if (!files.length) {
        text += '❌ Belum ada file materi di kelas ini.\n\n';
        text += '📂 Struktur folder yang dibaca:\n';
        text += `  MATKUL/${className}/FILE/\n`;
        text += `  MATKUL/${className}/IMAGE/\n`;
        return text;
    }

    text += 'Pilih nomor untuk kirim file/link:\n\n';

    files.forEach((file, index) => {
        const num = `${index + 1}.`.padStart(3);
        let icon = '📄';
        if (file.isImage) icon = '🖼️';
        else if (file.ext === '.pdf') icon = '📕';
        else if (['.ppt', '.pptx', '.pps', '.ppsx'].includes(file.ext)) icon = '📊';
        else if (file.ext === '.docx' || file.ext === '.doc') icon = '📝';
        else if (file.ext === '.xlsx' || file.ext === '.xls') icon = '📈';
        else if (file.ext === '.txt') icon = '🔗';
        else if (file.ext === '.zip' || file.ext === '.rar') icon = '📦';

        const subLabel = file.subdir !== '.' ? ` [${file.subdir}]` : '';
        text += `  ${num} ${icon} ${file.name}${subLabel}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 Ketik: *.matkul ${className.toLowerCase()} <nomor>*\n`;
    text += `   Contoh: .matkul ${className.toLowerCase()} 1`;
    return text;
}

function parseInput(textMessage) {
    const parts = String(textMessage || '').trim().split(/\s+/).filter(Boolean);
    return {
        classInput: parts[0] || '',
        itemNumber: parts[1] || '',
    };
}

async function handleMatkul(sock, sender, msg, participant, textMessage) {
    const baseDir = findMatkulDir();
    const { classInput, itemNumber } = parseInput(textMessage);

    // Tanpa argumen = tampilkan daftar kelas
    if (!classInput) {
        await sock.sendMessage(sender, { text: formatClassList(baseDir) }, { quoted: msg });
        return;
    }

    // Resolve nama kelas
    const className = resolveClassDir(classInput, baseDir);
    if (!className) {
        const intro = `❌ Kelas *${classInput}* tidak ditemukan.`;
        await sock.sendMessage(sender, { text: `${intro}\n\n${formatClassList(baseDir)}` }, { quoted: msg });
        return;
    }

    const files = getClassFiles(className, baseDir);
    const index = Number.parseInt(itemNumber, 10) - 1;

    // Tanpa nomor / nomor tidak valid = tampilkan daftar materi
    if (!itemNumber || Number.isNaN(index) || index < 0 || index >= files.length) {
        const intro = itemNumber ? `❌ Nomor materi *${itemNumber}* tidak valid.` : '';
        await sock.sendMessage(sender, { text: formatMaterialList(className, baseDir, intro) }, { quoted: msg });
        return;
    }

    // Kirim file yang dipilih
    const file = files[index];
    if (!fs.existsSync(file.path)) {
        await sock.sendMessage(sender, {
            text: `❌ File materi *${file.name}* tidak ditemukan.\n📂 Path: ${file.path}`,
        }, { quoted: msg });
        return;
    }

    try {
        // File teks (.txt, .md) = kirim isi teksnya
        if (file.isText) {
            const content = fs.readFileSync(file.path, 'utf8').trim();
            await sock.sendMessage(sender, {
                text: `🔗 *${className.toUpperCase()} — ${file.name}*\n\n${content || '(file teks kosong)'}`,
            }, { quoted: msg });
            return;
        }

        const fileBuffer = fs.readFileSync(file.path);
        const caption = `📚 *${className.toUpperCase()}*\n📄 ${file.name}`;

        // Gambar = kirim sebagai image
        if (file.isImage) {
            await sock.sendMessage(sender, { image: fileBuffer, caption }, { quoted: msg });
            return;
        }

        // Selain itu = kirim sebagai document
        await sock.sendMessage(sender, {
            document: fileBuffer,
            fileName: file.name,
            mimetype: DOCUMENT_MIMES[file.ext] || 'application/octet-stream',
            caption,
        }, { quoted: msg });
    } catch (err) {
        console.error('[MATKUL ERROR]', err.message);
        await sock.sendMessage(sender, {
            text: `❌ Gagal mengirim materi *${file.name}*.\nError: ${err.message}`,
        }, { quoted: msg });
    }
}

module.exports = {
    handleMatkul,
    findMatkulDir,
    getClassDirs,
    getClassFiles,
    formatClassList,
    formatMaterialList,
    resolveClassDir,
};
