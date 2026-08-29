// ============================================================
// modules/utility/menu-categories.js — Menu Category Definitions
// ============================================================

const MENU_CATEGORIES = {
    rpg: {
        icon: '\uD83C\uDFF0', title: 'RPG Adventure',
        hint: '\u2694\uFE0F RPG lengkap: battle, dungeon, guild, shop, quest, pet & 30+ fitur!',
        sections: [
            { header: '\uD83D\uDCCB DAFTAR & PROFIL', commands: [
                ['.guide / .panduan', '\uD83D\uDCD6 Panduan dasar bermain & info kurs mata uang'],
                ['.role <class>', '\uD83C\uDFAD Daftar & pilih class (warrior/archer/mage/assassin/necromancer/paladin/samurai/berserker/shaman)'],
                ['.rpg', '\uD83D\uDCCA Lihat profil, stats, & equipment'],
                ['.status', '\uD83D\uDCC8 Dashboard: stamina, durability, karma, cuaca'],
                ['.nick <nama>', '\u270F\uFE0F Set display name RPG kamu'],
            ]},
            { header: '\u2694\uFE0F BATTLE & HUNT', commands: [
                ['.hunt', '\uD83D\uDDE1\uFE0F Solo hunt monster, dapat EXP + loot + coin'],
                ['.duel @orang', '\u2694\uFE0F PvP duel 1v1 (bet 5 Silver)'],
                ['.raid @orang', '\uD83D\uDC65 Co-op 2v1 lawan raid boss'],
                ['.arena', '\uD83C\uDFC6 Ranked PvP (Bronze \u2192 Mythic)'],
                ['.arena rank', '\uD83D\uDCCA Lihat ELO & peringkat kamu'],
                ['.skill', '\uD83C\uDF00 Pakai skill class (cooldown 3 battle)'],
            ]},
            { header: '\uD83C\uDFDA\uFE0F DUNGEON & BOSS', commands: [
                ['.dungeon / .dg', '\uD83D\uDDFA\uFE0F Masuk dungeon (Floor 1\u2192100)'],
                ['.dungeoninfo', '\u2139\uFE0F Info floor & monster berikutnya'],
                ['.worldboss / .wb', '\uD83D\uDC79 Lihat World Boss event'],
                ['.wbattack', '\u2694\uFE0F Serang World Boss'],
            ]},
            { header: '\uD83D\uDCC8 PROGRESSION', commands: [
                ['.quest', '\uD83C\uDFAF Ambil/lihat quest harian (reset 24 jam)'],
                ['.evolve', '\uD83D\uDD04 Evolusi class (butuh Level 20+)'],
                ['.skilltree / .st', '\uD83C\uDF33 Lihat & unlock skill tree'],
                ['.achievement / .ach', '\uD83C\uDFC5 Lihat achievements'],
                ['.title <id>', '\uD83C\uDF96\uFE0F Set title dari achievement'],
            ]},
            { header: '\uD83D\uDED2 SHOP & INVENTORY', commands: [
                ['.shop', '\uD83C\uDFEA Buka toko RPG'],
                ['.buy <item>', '\uD83D\uDED2 Beli item dari toko'],
                ['.sell <item>', '\uD83D\uDCB0 Jual item (40% harga beli)'],
                ['.inv', '\uD83D\uDCE6 Lihat inventory'],
                ['.use <item>', '\uD83E\uDDEA Pakai potion/scroll'],
            ]},
            { header: '\uD83D\uDD28 EQUIPMENT & CRAFTING', commands: [
                ['.equip <id>', '\u2694\uFE0F Pasang weapon/armor/shield'],
                ['.craft', '\uD83D\uDD28 Lihat recipe & craft item'],
                ['.enchant', '\u2728 Enchant senjata (+1 s/d +7)'],
                ['.awaken', '\uD83C\uDF1F Awaken senjata tier 5'],
                ['.repair', '\uD83D\uDD27 Repair senjata rusak'],
            ]},
            { header: '\uD83C\uDFE0 GUILD & SOCIAL', commands: [
                ['.guild', '\u2139\uFE0F Info guild kamu'],
                ['.guild create <nama>', '\u2795 Buat guild (50 Silver)'],
                ['.guild join <nama>', '\uD83D\uDD17 Gabung guild'],
                ['.guild leave', '\uD83D\uDEAA Keluar guild'],
                ['.guild donate <jml>', '\uD83D\uDC8E Donasi ke guild bank'],
                ['.guild buff', '\u2B06\uFE0F Aktifkan guild buff (50 Silver)'],
                ['.guild members', '\uD83D\uDC65 List member guild'],
                ['.party create', '\uD83D\uDEA9 Buat party dungeon (Max 5 orang)'],
                ['.party join @host', '\uD83E\uDD1D Gabung party'],
                ['.party leave', '\uD83D\uDEAA Keluar dari party'],
                ['.party info', '\u2139\uFE0F Lihat member party'],
                ['.party dungeon', '\u2694\uFE0F (Host) Masuk dungeon bareng party'],
                ['.bounty @target <jml>', '\uD83C\uDFAF Pasang bounty (min 5 Silver)'],
                ['.wanted', '\uD83D\uDCCB Lihat daftar bounty aktif'],
                ['.market', '\uD83C\uDFEA Marketplace antar player'],
            ]},
            { header: '\uD83C\uDF19 ISEKAI DARK WORLD', commands: [
                ['.darkworld / .dw', '\uD83C\uDF11 Masuk Dark World (Lv10+, 2x monster, 3x reward)'],
                ['.story / .lore', '\uD83D\uDCD6 Story quest chain (10 chapter)'],
                ['.base', '\uD83C\uDFF0 Lihat & upgrade base'],
                ['.summon', '\uD83E\uDDEC Lihat/roll familiar (15 Silver)'],
                ['.respawn', '\uD83D\uDC80 Keluar dari Void (20 Silver)'],
                ['.invasion', '\uD83D\uDC79 Demon King event info'],
                ['.invattack', '\u2694\uFE0F Serang Demon King'],
            ]},
            { header: '\uD83E\uDD1D SOCIAL & PVP', commands: [
                ['.arena', '\uD83C\uDFDF\uFE0F PvP Arena \u2014 Cari lawan acak (Ranked)'],
                ['.duel @orang', '\u2694\uFE0F PvP duel 1v1 (bet 5 Silver)'],
                ['.acc / .terima', '\u2705 Terima tantangan duel/guild'],
                ['.raid', '\uD83D\uDC32 Raid Boss bareng satu grup'],
                ['.guild', '\uD83D\uDEE1\uFE0F Buat & kelola guild'],
                ['.market', '\uD83D\uDED2 Pasar antar player'],
                ['.bounty', '\uD83C\uDFAF Papan buronan (Bounty Hunter)'],
            ]},
            { header: '\uD83C\uDF56 SURVIVAL & PET', commands: [
                ['.eat / .makan', '\uD83C\uDF7D\uFE0F Makan food (recover stamina)'],
                ['.rest', '\uD83C\uDFE8 Inn \u2014 full HP + stamina (10 Silver)'],
                ['.camp', '\u26FA Camp \u2014 50% restore (gratis)'],
                ['.weather / .cuaca', '\uD83C\uDF24\uFE0F Cek cuaca & waktu'],
                ['.karma', '\u262F\uFE0F Lihat karma & reputasi'],
                ['.pet', '\uD83D\uDC3E Info pet'],
                ['.pet feed', '\uD83C\uDF56 Feed pet (10 Silver, +50 EXP)'],
                ['.pet rename <nama>', '\u270F\uFE0F Ganti nama pet'],
            ]},
            { header: '\uD83C\uDFB0 KASINO & JUDI', commands: [
                ['.kasino', '\uD83C\uDFB0 Menu kasino & statistik'],
                ['.slot <bet>', '\uD83C\uDFB0 Slot Machine (min 10 Bronze)'],
                ['.coinflip <gj/gp> <bet>', '\uD83E\uDE99 Coin Flip - 2x (min 10 Bronze)'],
                ['.dice <1-6> <bet>', '\uD83C\uDFB2 Dice Roll - 6x (min 10 Bronze)'],
                ['.tebak <1-10> <bet>', '\uD83D\uDD22 Tebak Angka - 10x (min 10 Bronze)'],
            ]},
            { header: '\uD83C\uDFB2 JUDI DUEL (PvP)', commands: [
                ['.judiduel @orang <bet>', '\uD83E\uDE99 Coinflip PvP \u2014 flip koin, menang ambil pot!'],
                ['.judiwar @orang <bet>', '\uD83C\uDFB2 Dice War PvP \u2014 lempar 3 dadu, total tertinggi menang!'],
                ['.judislot @orang <bet>', '\uD83C\uDFB0 Slot Race PvP \u2014 spin slot, multiplier tertinggi menang!'],
                ['.acc / .juditerima', '\u2705 Terima tantangan judi duel'],
            ]},
        ]
    },
    games: {
        icon: '\uD83C\uDFAE', title: 'Mini Games',
        hint: '\uD83C\uDFB0 Gacha, suit, daily claim, koleksi karakter & leaderboard.',
        sections: [
            { header: '\uD83C\uDFB0 GACHA ANIME', commands: [
                ['.gacha', '\uD83D\uDCCB Lihat menu gacha & drop rate'],
                ['.gacha 1', '\uD83C\uDFB2 Single pull (5 Silver)'],
                ['.gacha 5', '\uD83C\uDFB2 Multi pull 5x (20 Silver, hemat!)'],
                ['.koleksi', '\uD83D\uDCE6 Lihat koleksi karakter (sorted by star)'],
                ['.sellchar <nama>', '\uD83D\uDCB0 Jual karakter gacha'],
            ]},
            { header: '\uD83C\uDFB2 GAMES & DAILY', commands: [
                ['.rps <batu/gunting/kertas>', '\u270A Suit lawan AI (menang +30 Bronze)'],
                ['.daily', '\uD83C\uDF81 Klaim 50 Bronze gratis per hari'],
                ['.coins', '\uD83D\uDCB0 Cek saldo Coin'],
                ['.top', '\uD83C\uDFC6 Leaderboard Coin, RPG, dan duel'],
            ]},
        ]
    },
    image: {
        icon: '\uD83D\uDD0D', title: 'Image Search',
        hint: '\uD83D\uDDBC\uFE0F Cari gambar dari Pinterest/Google/Bing.',
        commands: [
            ['.pin <keyword>', '\uD83D\uDCF7 Cari & kirim 1 gambar'],
            ['.pin4 <keyword>', '\uD83D\uDCF7 Cari & kirim 4 gambar'],
        ]
    },
    media: {
        icon: '\uD83C\uDFA7', title: 'Media Tools',
        hint: '\uD83C\uDFB5 Download musik/video dan bikin stiker.',
        commands: [
            ['.play / .ytmp3 <judul/url>', '\uD83C\uDFB6 Download lagu MP3 dari YouTube (Bisa pakai URL)'],
            ['.sticker / .s', '\uD83D\uDDBC\uFE0F Ubah gambar/video jadi stiker'],
            ['.stxt <teks>', '\uD83D\uDDBC\uFE0F\u2728 Stiker + teks custom (gambar jadi stiker bertulisan)'],
            ['.gif', '\uD83C\uDFAC Ubah video jadi GIF WhatsApp'],
            ['.qc <teks>', '\uD83D\uDCAC Ubah pesan jadi stiker bubble'],
            ['.tt <link tiktok>', '\uD83D\uDCF1 Download TikTok no watermark'],
        ]
    },
    ai: {
        icon: '\uD83C\uDF38', title: 'Claryn AI',
        hint: '\uD83D\uDC95 Ngobrol sama Claryn, rephrase, rangkum, dll.',
        commands: [
            ['.claryn <pesan>', '\uD83D\uDCAC Chat manis sama Claryn'],
            ['.clarynvn <pesan>', '\uD83C\uDFA4 Claryn balas pakai Voice Note! (Suara asli)'],
            ['.rephrase <teks>', '\uD83D\uDD04 Parafrase biar lebih natural'],
            ['.rangkum <teks>', '\uD83D\uDCDD Ringkas teks panjang'],
            ['.puitis <teks>', '\uD83C\uDF38 Ubah ke gaya puitis'],
            ['.formal <teks>', '\uD83D\uDC54 Ubah ke gaya formal'],
            ['.santai <teks>', '\uD83D\uDE0E Ubah ke gaya santai'],
            ['.eli5 <teks>', '\uD83E\uDDD2 Jelaskan super sederhana'],
            ['.terjemah <teks>', '\uD83C\uDF0D Translate otomatis'],
        ]
    },
    utility: {
        icon: '\uD83D\uDEE0\uFE0F', title: 'Utility',
        hint: '\uD83D\uDD27 Info praktis dan pengaturan.',
        commands: [
            ['.cuaca <kota>', '\uD83C\uDF24\uFE0F Cek cuaca realtime'],
            ['.setnama <nama>', '\u270F\uFE0F Set nama tampilan leaderboard/battle'],
        ]
    },
    admin: {
        icon: '\uD83D\uDD10', title: 'Admin Panel',
        hint: '\uD83D\uDEE1\uFE0F Panel untuk Admin Bot dan Owner.',
        commands: [
            ['.pushkontak <pesan>', '\uD83D\uDCE2 Kirim pesan massal ke member grup'],
            ['.ban @tag', '\uD83D\uDEAB Ban user dari pakai bot'],
            ['.unban @tag', '\u2705 Unban user'],
            ['.banlist', '\uD83D\uDCCB Lihat daftar user yang diban'],
            ['.kick @tag', '\uD83D\uDCA2 Kick member dari grup'],
            ['.mute', '\uD83D\uDD07 Mute grup'],
            ['.unmute', '\uD83D\uDD0A Unmute grup'],
        ]
    },
    education: {
        icon: '\uD83D\uDCDA', title: 'Education & Jadwal',
        hint: '\uD83D\uDCD6 Modul fisika, jadwal kuliah, & materi per kelas (KTI-A/B/C).',
        sections: [
            { header: '\uD83D\uDCDA MATERI MATKUL', commands: [
                ['.matkul', '\uD83D\uDCCB Lihat daftar kelas & jumlah materi'],
                ['.matkul <kelas>', '\uD83D\uDCC2 Lihat daftar materi per kelas (contoh: .matkul kti-a)'],
                ['.matkul <kelas> <nomor>', '\uD83D\uDCE5 Kirim file/gambar/link pilihan (contoh: .matkul kti-a 1)'],
            ]},
            { header: '\uD83D\uDCDA MODUL FISIKA', commands: [
                ['.fisika', '\uD83D\uDCCB Lihat daftar modul fisika tersedia'],
                ['.fisika <kode>', '\uD83D\uDCE5 Download modul PDF (contoh: .fisika m1)'],
            ]},
            { header: '\uD83D\uDCC5 JADWAL KULIAH', commands: [
                ['.jadwal', '\uD83D\uDCCB Lihat daftar jadwal tersedia'],
                ['.jadwal <kode>', '\uD83D\uDDBC\uFE0F Kirim jadwal (contoh: .jadwal uts)'],
            ]},
        ]
    },
    owner: {
        icon: '\uD83D\uDC51', title: 'Owner Panel',
        hint: '\uD83D\uDD12 Panel absolut khusus Owner bot.',
        sections: [
            { header: '\uD83D\uDC51 ADMIN MANAGEMENT', commands: [
                ['.addadmin @tag/nomor', '\u2795 Tambah Admin Bot global'],
                ['.deladmin @tag/nomor', '\u2796 Hapus Admin Bot global'],
                ['.listadmin', '\uD83D\uDCCB Lihat daftar Admin Bot'],
            ]},
            { header: '\uD83D\uDC51 GOD MODE \u2014 CHEAT', commands: [
                ['.addcoin <jml> <g/s/b> @tag', '\uD83D\uDCB0 Tambah coin (Gold/Silver/Bronze)'],
                ['.setcoin / .debuff <jml> @tag', '\uD83D\uDCC9 Set spesifik coin / Bikin miskin'],
                ['.createitem <format>', '\uD83D\uDEE0\uFE0F Create item kustom & pasarkan permanen'],
                ['.setlevel <1-999> @tag', '\u2B50 Set level RPG player'],
                ['.setexp <jumlah> @tag', '\uD83D\uDD17 Tambah EXP player'],
                ['.setstats <stat> <nilai> @tag', '\u2699\uFE0F Set stat (atk/def/spd/hp/crit)'],
                ['.setkarma <nilai> @tag', '\u262F\uFE0F Set karma player'],
                ['.maxstamina @tag', '\uD83C\uDF56 Isi penuh stamina'],
                ['.maxdurability @tag', '\uD83D\uDDE1\uFE0F Isi penuh durability'],
                ['.fullheal @tag', '\u2764\uFE0F Full heal + reset cooldown'],
                ['.giveitem <id> @tag', '\uD83C\uDF81 Beri item ke player'],
                ['.giveweapon <id> @tag', '\uD83D\uDDE1\uFE0F Beri weapon ke player'],
                ['.givearmor <id> @tag', '\uD83E\uDD4B Beri armor ke player'],
                ['.giveshield <id> @tag', '\uD83D\uDEE1\uFE0F Beri shield ke player'],
                ['.resetplayer @tag', '\uD83D\uDD04 Reset data RPG player'],
                ['.allplayer', '\uD83D\uDC65 Lihat semua data player'],
            ]},
            { header: '\uD83D\uDC51 FITUR DEWA \u2014 KASINO CONTROL', commands: [
                ['.setwin @tag', '\uD83C\uDFC6 Player selalu MENANG kasino'],
                ['.setlose @tag', '\uD83D\uDC80 Player selalu KALAH kasino'],
                ['.setnormal @tag', '\u2696\uFE0F Reset ke mode NORMAL'],
                ['.checkmode @tag', '\uD83D\uDD0D Cek mode kasino player'],
            ]},
            { header: '\uD83D\uDC51 GROUP MANAGEMENT', commands: [
                ['.broadcast <pesan>', '\uD83D\uDCE2 Broadcast ke semua grup'],
                ['.pushkontak <pesan>', '\uD83D\uDCE4 Kirim pesan ke semua member grup'],
                ['.getkontak', '\uD83D\uDCC7 Ambil kontak member grup'],
                ['.savekontak', '\uD83D\uDCBE Export kontak grup ke .txt'],
                ['.cariuser <nomor/@tag>', '\uD83D\uDD0E Cari target di semua grup'],
                ['.promote @tag', '\u2B06\uFE0F Promote admin grup'],
                ['.demote @tag', '\u2B07\uFE0F Demote admin grup'],
                ['.setgroupname <nama>', '\u270F\uFE0F Ubah nama grup'],
                ['.setgroupdesc <deskripsi>', '\uD83D\uDCDD Ubah deskripsi grup'],
            ]},
            { header: '\uD83D\uDC51 TRACKING & INTEL', commands: [
                ['.lacak <nomor/IP/domain>', '\uD83D\uDD0D Lacak nomor, IP, atau domain'],
                ['.lacakip <IP/domain>', '\uD83D\uDD0D Shortcut lacak IP/domain'],
            ]},
        ]
    }
};

module.exports = { MENU_CATEGORIES };
