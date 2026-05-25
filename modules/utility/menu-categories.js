// ============================================================
// modules/utility/menu-categories.js — Menu Category Definitions
// ============================================================

const MENU_CATEGORIES = {
    rpg: {
        icon: '🏰', title: 'RPG Adventure',
        hint: '⚔️ RPG lengkap: battle, dungeon, guild, shop, quest, pet & 30+ fitur!',
        sections: [
            { header: '📋 DAFTAR & PROFIL', commands: [
                ['.guide / .panduan', '📖 Panduan dasar bermain & info kurs mata uang'],
                ['.role <class>', '🎭 Daftar & pilih class (warrior/archer/mage/assassin/necromancer/paladin/samurai/berserker/shaman)'],
                ['.rpg', '📊 Lihat profil, stats, & equipment'],
                ['.status', '📈 Dashboard: stamina, durability, karma, cuaca'],
                ['.nick <nama>', '✏️ Set display name RPG kamu'],
            ]},
            { header: '⚔️ BATTLE & HUNT', commands: [
                ['.hunt', '🗡️ Solo hunt monster, dapat EXP + loot + coin'],
                ['.duel @orang', '⚔️ PvP duel 1v1 (bet 5 Silver)'],
                ['.raid @orang', '👥 Co-op 2v1 lawan raid boss'],
                ['.arena', '🏆 Ranked PvP (Bronze → Mythic)'],
                ['.arena rank', '📊 Lihat ELO & peringkat kamu'],
                ['.skill', '🌀 Pakai skill class (cooldown 3 battle)'],
            ]},
            { header: '🏚️ DUNGEON & BOSS', commands: [
                ['.dungeon / .dg', '🗺️ Masuk dungeon (Floor 1→100)'],
                ['.dungeoninfo', 'ℹ️ Info floor & monster berikutnya'],
                ['.worldboss / .wb', '👹 Lihat World Boss event'],
                ['.wbattack', '⚔️ Serang World Boss'],
            ]},
            { header: '📈 PROGRESSION', commands: [
                ['.quest', '🎯 Ambil/lihat quest harian (reset 24 jam)'],
                ['.evolve', '🔄 Evolusi class (butuh Level 20+)'],
                ['.skilltree / .st', '🌳 Lihat & unlock skill tree'],
                ['.achievement / .ach', '🏅 Lihat achievements'],
                ['.title <id>', '🎖️ Set title dari achievement'],
            ]},
            { header: '🛒 SHOP & INVENTORY', commands: [
                ['.shop', '🏪 Buka toko RPG'],
                ['.buy <item>', '🛍️ Beli item dari toko'],
                ['.sell <item>', '💰 Jual item (40% harga beli)'],
                ['.inv', '📦 Lihat inventory'],
                ['.use <item>', '🧪 Pakai potion/scroll'],
            ]},
            { header: '🔨 EQUIPMENT & CRAFTING', commands: [
                ['.equip <id>', '⚔️ Pasang weapon/armor/shield'],
                ['.craft', '🔨 Lihat recipe & craft item'],
                ['.enchant', '✨ Enchant senjata (+1 s/d +7)'],
                ['.awaken', '🌟 Awaken senjata tier 5'],
                ['.repair', '🔧 Repair senjata rusak'],
            ]},
            { header: '🏠 GUILD & SOCIAL', commands: [
                ['.guild', 'ℹ️ Info guild kamu'],
                ['.guild create <nama>', '➕ Buat guild (50 Silver)'],
                ['.guild join <nama>', '🔗 Gabung guild'],
                ['.guild leave', '🚪 Keluar guild'],
                ['.guild donate <jml>', '💎 Donasi ke guild bank'],
                ['.guild buff', '⬆️ Aktifkan guild buff (50 Silver)'],
                ['.guild members', '👥 List member guild'],
                ['.party create', '🚩 Buat party dungeon (Max 5 orang)'],
                ['.party join @host', '🤝 Gabung party'],
                ['.party leave', '🚪 Keluar dari party'],
                ['.party info', 'ℹ️ Lihat member party'],
                ['.party dungeon', '⚔️ (Host) Masuk dungeon bareng party'],
                ['.bounty @target <jml>', '🎯 Pasang bounty (min 5 Silver)'],
                ['.wanted', '📋 Lihat daftar bounty aktif'],
                ['.market', '🏪 Marketplace antar player'],
            ]},
            { header: '🌙 ISEKAI DARK WORLD', commands: [
                ['.darkworld / .dw', '🌑 Masuk Dark World (Lv10+, 2x monster, 3x reward)'],
                ['.story / .lore', '📖 Story quest chain (10 chapter)'],
                ['.base', '🏰 Lihat & upgrade base'],
                ['.summon', '🧬 Lihat/roll familiar (15 Silver)'],
                ['.respawn', '💀 Keluar dari Void (20 Silver)'],
                ['.invasion', '👹 Demon King event info'],
                ['.invattack', '⚔️ Serang Demon King'],
            ]},
            { header: '🤝 SOCIAL & PVP', commands: [
                ['.arena', '🏟️ PvP Arena — Cari lawan acak (Ranked)'],
                ['.duel @orang', '⚔️ PvP duel 1v1 (bet 5 Silver)'],
                ['.acc / .terima', '✅ Terima tantangan duel/guild'],
                ['.raid', '🐲 Raid Boss bareng satu grup'],
                ['.guild', '🛡️ Buat & kelola guild'],
                ['.market', '🛒 Pasar antar player'],
                ['.bounty', '🎯 Papan buronan (Bounty Hunter)'],
            ]},
            { header: '🍖 SURVIVAL & PET', commands: [
                ['.eat / .makan', '🍽️ Makan food (recover stamina)'],
                ['.rest', '🏨 Inn — full HP + stamina (10 Silver)'],
                ['.camp', '⛺ Camp — 50% restore (gratis)'],
                ['.weather / .cuaca', '🌤️ Cek cuaca & waktu'],
                ['.karma', '☯️ Lihat karma & reputasi'],
                ['.pet', '🐾 Info pet'],
                ['.pet feed', '🍖 Feed pet (10 Silver, +50 EXP)'],
                ['.pet rename <nama>', '✏️ Ganti nama pet'],
            ]},
            { header: '🎰 KASINO & JUDI', commands: [
                ['.kasino', '🎰 Menu kasino & statistik'],
                ['.slot <bet>', '🎰 Slot Machine (min 10 Bronze)'],
                ['.coinflip <gj/gp> <bet>', '🪙 Coin Flip - 2x (min 10 Bronze)'],
                ['.dice <1-6> <bet>', '🎲 Dice Roll - 6x (min 10 Bronze)'],
                ['.tebak <1-10> <bet>', '🔢 Tebak Angka - 10x (min 10 Bronze)'],
            ]},
            { header: '🎲 JUDI DUEL (PvP)', commands: [
                ['.judiduel @orang <bet>', '🪙 Coinflip PvP — flip koin, menang ambil pot!'],
                ['.judiwar @orang <bet>', '🎲 Dice War PvP — lempar 3 dadu, total tertinggi menang!'],
                ['.judislot @orang <bet>', '🎰 Slot Race PvP — spin slot, multiplier tertinggi menang!'],
                ['.acc / .juditerima', '✅ Terima tantangan judi duel'],
            ]},
        ]
    },
    games: {
        icon: '🎮', title: 'Mini Games',
        hint: '🎰 Gacha, suit, daily claim, koleksi karakter & leaderboard.',
        sections: [
            { header: '🎰 GACHA ANIME', commands: [
                ['.gacha', '📋 Lihat menu gacha & drop rate'],
                ['.gacha 1', '🎲 Single pull (5 Silver)'],
                ['.gacha 5', '🎲 Multi pull 5x (20 Silver, hemat!)'],
                ['.koleksi', '📦 Lihat koleksi karakter (sorted by star)'],
                ['.sellchar <nama>', '💰 Jual karakter gacha'],
            ]},
            { header: '🎲 GAMES & DAILY', commands: [
                ['.rps <batu/gunting/kertas>', '✊ Suit lawan AI (menang +30 Bronze)'],
                ['.daily', '🎁 Klaim 50 Bronze gratis per hari'],
                ['.coins', '💰 Cek saldo Coin'],
                ['.top', '🏆 Leaderboard Coin, RPG, dan duel'],
            ]},
        ]
    },
    image: {
        icon: '🔍', title: 'Image Search',
        hint: '🖼️ Cari gambar dari Pinterest/Google/Bing.',
        commands: [
            ['.pin <keyword>', '📷 Cari & kirim 1 gambar'],
            ['.pin4 <keyword>', '📷 Cari & kirim 4 gambar'],
        ]
    },
    media: {
        icon: '🎧', title: 'Media Tools',
        hint: '🎵 Download musik/video dan bikin stiker.',
        commands: [
            ['.play <judul lagu>', '🎶 Download & kirim musik dari YouTube'],
            ['.sticker / .s', '🖼️ Ubah gambar/video jadi stiker'],
            ['.stxt <teks>', '🖼️✨ Stiker + teks custom (gambar jadi stiker bertulisan)'],
            ['.gif', '🎬 Ubah video jadi GIF WhatsApp'],
            ['.qc <teks>', '💬 Ubah pesan jadi stiker bubble'],
            ['.tt <link tiktok>', '📱 Download TikTok no watermark'],
        ]
    },
    ai: {
        icon: '✍️', title: 'AI Tools',
        hint: '🤖 Chat, rewrite, rangkum, translate, dan gaya bahasa.',
        commands: [
            ['.ai <pertanyaan>', '💬 Chat/tanya apa aja ke AI'],
            ['.rephrase <teks>', '🔄 Parafrase biar lebih natural'],
            ['.rangkum <teks>', '📝 Ringkas teks panjang'],
            ['.puitis <teks>', '🌸 Ubah ke gaya puitis'],
            ['.formal <teks>', '👔 Ubah ke gaya formal'],
            ['.santai <teks>', '😎 Ubah ke gaya santai'],
            ['.eli5 <teks>', '🧒 Jelaskan super sederhana'],
            ['.terjemah <teks>', '🌐 Translate otomatis'],
        ]
    },
    utility: {
        icon: '🛠️', title: 'Utility',
        hint: '🔧 Info praktis dan pengaturan.',
        commands: [
            ['.cuaca <kota>', '🌤️ Cek cuaca realtime'],
            ['.setnama <nama>', '✏️ Set nama tampilan leaderboard/battle'],
        ]
    },
    admin: {
        icon: '🔐', title: 'Admin Panel',
        hint: '🛡️ Panel untuk Admin Bot dan Owner.',
        commands: [
            ['.pushkontak <pesan>', '📢 Kirim pesan massal ke member grup'],
            ['.ban @tag', '🚫 Ban user dari pakai bot'],
            ['.unban @tag', '✅ Unban user'],
            ['.banlist', '📋 Lihat daftar user yang diban'],
            ['.kick @tag', '👢 Kick member dari grup'],
            ['.mute', '🔇 Mute grup'],
            ['.unmute', '🔊 Unmute grup'],
        ]
    },
    education: {
        icon: '📚', title: 'Education & Jadwal',
        hint: '📖 Modul fisika, jadwal kuliah, & materi per kelas (KTI-A/B/C).',
        sections: [
            { header: '📚 MATERI MATKUL', commands: [
                ['.matkul', '📋 Lihat daftar kelas & jumlah materi'],
                ['.matkul <kelas>', '📂 Lihat daftar materi per kelas (contoh: .matkul kti-a)'],
                ['.matkul <kelas> <nomor>', '📥 Kirim file/gambar/link pilihan (contoh: .matkul kti-a 1)'],
            ]},
            { header: '📚 MODUL FISIKA', commands: [
                ['.fisika', '📋 Lihat daftar modul fisika tersedia'],
                ['.fisika <kode>', '📥 Download modul PDF (contoh: .fisika m1)'],
            ]},
            { header: '📅 JADWAL KULIAH', commands: [
                ['.jadwal', '📋 Lihat daftar jadwal tersedia'],
                ['.jadwal <kode>', '🖼️ Kirim jadwal (contoh: .jadwal uts)'],
            ]},
        ]
    },
    owner: {
        icon: '👑', title: 'Owner Panel',
        hint: '🔑 Panel absolut khusus Owner bot.',
        sections: [
            { header: '👑 ADMIN MANAGEMENT', commands: [
                ['.addadmin @tag/nomor', '➕ Tambah Admin Bot global'],
                ['.deladmin @tag/nomor', '➖ Hapus Admin Bot global'],
                ['.listadmin', '📋 Lihat daftar Admin Bot'],
            ]},
            { header: '👑 GOD MODE — CHEAT', commands: [
                ['.addcoin <jml> <g/s/b> @tag', '💰 Tambah coin (Gold/Silver/Bronze)'],
                ['.setcoin / .debuff <jml> @tag', '📉 Set spesifik coin / Bikin miskin'],
                ['.createitem <format>', '🛠️ Create item kustom & pasarkan permanen'],
                ['.setlevel <1-999> @tag', '⭐ Set level RPG player'],
                ['.setexp <jumlah> @tag', '📗 Tambah EXP player'],
                ['.setstats <stat> <nilai> @tag', '⚙️ Set stat (atk/def/spd/hp/crit)'],
                ['.setkarma <nilai> @tag', '☯️ Set karma player'],
                ['.maxstamina @tag', '🍖 Isi penuh stamina'],
                ['.maxdurability @tag', '🗡️ Isi penuh durability'],
                ['.fullheal @tag', '❤️ Full heal + reset cooldown'],
                ['.giveitem <id> @tag', '🎁 Beri item ke player'],
                ['.giveweapon <id> @tag', '🗡️ Beri weapon ke player'],
                ['.givearmor <id> @tag', '🥋 Beri armor ke player'],
                ['.giveshield <id> @tag', '🔰 Beri shield ke player'],
                ['.resetplayer @tag', '🔄 Reset data RPG player'],
                ['.allplayer', '👥 Lihat semua data player'],
            ]},
            { header: '👑 FITUR DEWA — KASINO CONTROL', commands: [
                ['.setwin @tag', '🏆 Player selalu MENANG kasino'],
                ['.setlose @tag', '💀 Player selalu KALAH kasino'],
                ['.setnormal @tag', '⚖️ Reset ke mode NORMAL'],
                ['.checkmode @tag', '🔍 Cek mode kasino player'],
            ]},
            { header: '👑 GROUP MANAGEMENT', commands: [
                ['.broadcast <pesan>', '📢 Broadcast ke semua grup'],
                ['.pushkontak <pesan>', '📤 Kirim pesan ke semua member grup'],
                ['.getkontak', '📇 Ambil kontak member grup'],
                ['.savekontak', '💾 Export kontak grup ke .txt'],
                ['.cariuser <nomor/@tag>', '🔎 Cari target di semua grup'],
                ['.promote @tag', '⬆️ Promote admin grup'],
                ['.demote @tag', '⬇️ Demote admin grup'],
                ['.setgroupname <nama>', '✏️ Ubah nama grup'],
                ['.setgroupdesc <deskripsi>', '📝 Ubah deskripsi grup'],
            ]},
            { header: '👑 TRACKING & INTEL', commands: [
                ['.lacak <nomor/IP/domain>', '🔍 Lacak nomor, IP, atau domain'],
                ['.lacakip <IP/domain>', '🔍 Shortcut lacak IP/domain'],
            ]},
        ]
    }
};

module.exports = { MENU_CATEGORIES };
