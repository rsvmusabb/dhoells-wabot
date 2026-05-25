<div align="center">

# 🤖 Dhoells Bot

**WhatsApp Bot — RPG • AI • Media • Games • Education**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-6.x-25D366?logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/dullstudnt/dhoells-wabot?style=social)](https://github.com/dullstudnt/dhoells-wabot)

<img src="https://img.shields.io/badge/100%2B-Commands-1e293b?style=for-the-badge" alt="100+ Commands"/>

</div>

---

## ✨ Fitur Utama

| Kategori | Deskripsi | Commands |
|----------|-----------|:---:|
| ⚔️ **RPG Adventure** | Battle, Dungeon, Guild, Shop, Quest, Pet, Arena, World Boss, Dark World, Story | 40+ |
| 🎮 **Mini Games** | Gacha anime, Suit, Daily Claim, Leaderboard | 10+ |
| 🎰 **Casino** | Slot, Coinflip, Dice, Tebak Angka, Judi Duel PvP | 7+ |
| 🎨 **Media Tools** | Sticker, GIF, YouTube Play, TikTok DL, Image Search | 6+ |
| 🧠 **AI Tools** | Chat AI, Parafrase, Rangkum, Translate, Gaya Bahasa | 8+ |
| 📚 **Education** | Modul PDF, Jadwal Kuliah, Materi per Kelas | 5+ |
| 🛡️ **Admin Panel** | Ban/Unban, Kick, Mute, Push Kontak, Broadcast | 10+ |
| 👑 **Owner Panel** | God Mode, Cheat, Group Management, Tracking | 25+ |

---

## 🏗️ Arsitektur

```
index.js (Entry Point)
│
├── config.js          ← Konstanta, RPG data, currency, game config
│
├── modules/
│   ├── rpg/           ← Battle, Shop, Dungeon, Social, Survival, Core
│   ├── games/         ← Gacha, RPS, Daily, Handler
│   ├── media/         ← Sticker, Audio, Scraper, Handler
│   ├── ai/            ← AI Engine, Handler
│   ├── admin/         ← Admin commands
│   ├── education/     ← Fisika, Jadwal, Matkul
│   └── utility/       ← DB, Currency, Menu, Help
```

**Design Pattern:** Modular Router — setiap kategori fitur dipisah ke folder sendiri, di-import oleh `index.js` sebagai handler. Config terpusat di `config.js`.

---

## 🚀 QuickStart

### Prerequisites

| Tool | Min. Version |
|------|:---:|
| [Node.js](https://nodejs.org/) | v18+ |
| [npm](https://www.npmjs.com/) | v9+ |
| [FFmpeg](https://ffmpeg.org/) | v4+ (auto-install) |
| [Git](https://git-scm.com/) | v2+ |

### Installation

```bash
# Clone repo
git clone https://github.com/dullstudnt/dhoells-wabot.git
cd dhoells-wabot

# Install dependencies
npm install

# Run
node index.js
```

### Configuration

Edit `config.js`:

```javascript
const BOT_CONFIG = {
    OWNER_NUMBER: '628xxxx@s.whatsapp.net',  // Ganti nomor kamu
    OWNER_LID: 'YOUR_LID_NUMBER@lid',
    DELAY_PER_MESSAGE: 5000,
};
```

Untuk fitur AI, buat file `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Dapatkan API key gratis di [Google AI Studio](https://aistudio.google.com/apikey)

### 📱 Connect

Scan QR code di terminal dengan WhatsApp:
`WhatsApp → Settings → Linked Devices → Link a Device`

Jika berhasil:
```
✅ Bot terhubung ke WhatsApp!
📱 Nomor: 628xxxx@s.whatsapp.net
🔢 Total command: 100+
```

---

## 🎮 RPG System

### 9 Classes

| Class | HP | ATK | DEF | SPD | CRIT | Passive | Skill |
|-------|:--:|:---:|:---:|:---:|------|---------|-------|
| ⚔️ Warrior | 120 | 12 | 10 | 5 | 10% | +15% DEF | Shield Bash |
| 🏹 Archer | 90 | 15 | 5 | 12 | 25% | +20% CRIT | Rain of Arrows |
| 🔮 Mage | 80 | 18 | 4 | 8 | 15% | +25% ATK | Fireball |
| 🗡️ Assassin | 85 | 16 | 3 | 15 | 30% | +20% SPD | Shadow Strike |
| 💀 Necromancer | 100 | 14 | 6 | 7 | 12% | Lifesteal 15% | Soul Drain |
| 🛡️ Paladin | 140 | 10 | 12 | 4 | 8% | Regen 5/turn | Holy Shield |
| ⚔️ Samurai | 95 | 17 | 7 | 10 | 20% | Counter 20% | Iaijutsu |
| 🪓 Berserker | 110 | 14 | 5 | 8 | 18% | Rage +ATK | Blood Rage |
| 🌿 Shaman | 95 | 13 | 8 | 6 | 10% | Poison 10% | Hex |

### Weapon Tiers

```
Tier 1 → Kayu      (starter, gratis)
Tier 2 → Besi      (1,500 Bronze)
Tier 3 → Perak     (3,000 Bronze)
Tier 4 → Api       (6,000 Bronze)
Tier 5 → Legendary (15,000 Bronze)
Tier 6 → Mythic    (30,000 Bronze)
Tier 7 → Divine    (60,000 Bronze)
Tier 8 → Godly     (150,000 Bronze)
```

### Currency System

```
🪙 Gold   = 100 Silver = 5,000 Bronze
🥈 Silver = 50 Bronze
🥉 Bronze = 1 (base unit)
```

### Arena Ranks

```
Bronze → Silver → Gold → Diamond → Mythic
```

---

## 🗂️ Command List

<details>
<summary><b>⚔️ RPG Commands</b></summary>

```
.role <class>       → Pilih class RPG
.hunt               → Hunt monster
.battle             → Battle system
.duel @orang        → PvP duel 1v1
.raid @orang        → Co-op raid boss
.arena              → Ranked PvP
.dungeon            → Dungeon (Floor 1-100)
.worldboss           → World Boss event
.guild              → Guild system
.shop               → Buka toko
.buy / .sell        → Beli/jual item
.inv                → Inventory
.equip              → Pasang senjata/armor
.quest              → Quest harian
.evolve             → Evolusi class (Lv20+)
.skilltree          → Skill tree
.darkworld          → Dark World (Lv10+)
.story              → Story quest chain
.pet                → Pet system
.eat / .rest        → Survival
```
</details>

<details>
<summary><b>🎮 Mini Games</b></summary>

```
.gacha              → Gacha anime character
.gacha 5            → Multi pull 5x
.koleksi            → Lihat koleksi
.rps <batu/gunting/kertas> → Suit vs AI
.daily              → Daily claim 50 Bronze
.coins              → Cek saldo
.top                → Leaderboard
```
</details>

<details>
<summary><b>🎰 Casino</b></summary>

```
.slot <bet>         → Slot Machine
.coinflip <gj/gp> <bet> → Coin Flip 2x
.dice <1-6> <bet>   → Dice Roll 6x
.tebak <1-10> <bet> → Tebak Angka 10x
.judiduel @orang <bet> → Coinflip PvP
```
</details>

<details>
<summary><b>🎨 Media Tools</b></summary>

```
.sticker / .s       → Buat stiker dari gambar/video
.play <judul>       → Download musik YouTube
.tt <link>          → Download TikTok no watermark
.pin <keyword>      → Cari gambar Pinterest
.qc <teks>          → Quote bubble stiker
```
</details>

<details>
<summary><b>🧠 AI Tools</b></summary>

```
.ai <pertanyaan>    → Chat dengan AI
.rephrase <teks>    → Parafrase
.rangkum <teks>     → Ringkas teks
.puitis <teks>      → Gaya puitis
.formal <teks>      → Gaya formal
.santai <teks>      → Gaya santai
.eli5 <teks>        → Jelaskan super sederhana
.terjemah <teks>    → Translate otomatis
```
</details>

<details>
<summary><b>🛡️ Admin</b></summary>

```
.ban @tag           → Ban user
.unban @tag         → Unban user
.kick @tag          → Kick member
.mute / .unmute     → Mute/unmute grup
.pushkontak <pesan> → Broadcast ke member grup
```
</details>

---

## 🤝 Contributing

Kontribusi sangat diterima!

1. **Fork** repository ini
2. **Buat branch** fitur: `git checkout -b fitur-baru`
3. **Commit** perubahan: `git commit -m "Tambah fitur X"`
4. **Push** ke branch: `git push origin fitur-baru`
5. **Buka Pull Request**

### Roadmap

- [ ] Tambah class RPG baru (Monk, Druid, etc)
- [ ] Sistem crafting yang lebih kompleks
- [ ] Trading antar player real-time
- [ ] Mini-game baru (Trivia, Quiz)
- [ ] Dashboard web untuk monitoring
- [ ] Multi-language support
- [ ] Database SQLite yang lebih robust

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<div align="center">

**⭐ Star repo ini kalau membantu!**

Made with ❤️ by [musabb](https://github.com/rsvmusabb)

</div>
