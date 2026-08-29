<div align="center">
  
  <h1>🪐 CLARYN AI (Enterprise Build)</h1>
  <p><b>Massive Multiplayer RPG & AI-Driven WhatsApp Architecture</b></p>

  <p>
    <img src="https://img.shields.io/badge/Version-3.0.0-blue.svg?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/Engine-Node.js-339933.svg?style=for-the-badge&logo=nodedotjs" alt="Node" />
    <img src="https://img.shields.io/badge/Library-Baileys-ff69b4.svg?style=for-the-badge&logo=whatsapp" alt="Baileys" />
    <img src="https://img.shields.io/badge/AI-Gemini%202.5-orange.svg?style=for-the-badge&logo=google" alt="Gemini" />
  </p>
</div>

---

## 🚀 Overview

**Claryn AI** is not just a standard WhatsApp bot; it is a highly modular, enterprise-grade architecture designed to handle thousands of concurrent users. Built on top of the `@whiskeysockets/baileys` library, it seamlessly integrates conversational AI (Google Gemini 2.5 Pro) with neural text-to-speech (ElevenLabs) and a fully-fledged massive multiplayer RPG ecosystem.

Developed with clean code principles, extensive JSDoc typing, and strict separation of concerns, this repository serves as a blueprint for advanced WhatsApp automation.

---

## 📂 Architecture & Directory Structure

The codebase is organized using a strict Modular / MVC-like pattern to ensure scalability and maintainability.

```text
📦 CLARYN-AI
 ┣ 📂 config/           # Core configuration files (Rates, Limits, Game Tuning)
 ┣ 📂 database/         # Persistent JSON storage (Memory, Users, Guilds)
 ┣ 📂 modules/          # Core logic separated by domain
 ┃ ┣ 📂 admin/          # Owner-level execution, bans, and evaluation commands
 ┃ ┣ 📂 ai/             # Gemini Brain, Context Windows, and ElevenLabs Opus TTS
 ┃ ┣ 📂 education/      # Utility modules for academic scheduling and formulas
 ┃ ┣ 📂 games/          # Casino, Gacha, and interactive mini-games
 ┃ ┣ 📂 media/          # Web scraping, image manipulation (Sharp), and FFmpeg
 ┃ ┣ 📂 rpg/            # Complex RPG ecosystem (Dungeons, Raids, Economy, Stats)
 ┃ ┗ 📂 utility/        # Rate limiters, custom routers, UI/Menu generators
 ┣ 📜 index.js          # Master Entry Point & WebSocket Connection Manager
 ┣ 📜 setup-folders.sh  # Auto-initialization script for production environments
 ┗ 📜 .env.example      # Blueprint for required environment variables
```

---

## 🛡️ Security & Performance

- **Sliding Window Rate-Limiter:** Built-in protection against spam and DDoS attempts. Tracks requests per JID with exponential backoff.
- **Upstream Failover:** Graceful error handling for API timeouts (Gemini/ElevenLabs) to prevent process crashes.
- **No-Secret Policy:** `.gitignore` is strictly configured. **Never commit your `.env` file**. Keep your API keys and Baileys `auth_info` strictly local.

---

## ⚙️ Quick Start

### 1. Requirements
- **Node.js** v18 or higher
- **FFmpeg** (Required for Audio/Opus conversion)
- **Git**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/rsvmusabb/dhoells-wabot.git
cd dhoells-wabot

# Install dependencies
npm install

# Initialize required database folders
bash setup-folders.sh
```

### 3. Environment Setup
Copy the blueprint environment file and fill in your API credentials:
```bash
cp .env.example .env
```
Ensure you populate `GEMINI_API_KEYS` and `ELEVENLABS_API_KEY`.

### 4. Deployment
```bash
# Start the system
node index.js
```
Scan the QR code printed in your terminal using your WhatsApp application (Linked Devices).

---

## ⚔️ RPG System Highlights
This bot features a deep, persistent RPG system:
- **World Bosses & Raids:** Co-op PvE battles with dynamic health scaling.
- **Guilds & Bounties:** Social economy, taxes, and player bounties.
- **Dynamic Equipment:** Enchanting, repairing, and elemental stats.
- **Survival Mechanics:** Stamina, Durability, and Karma alignment.

---

<div align="center">
  <p><i>Developed with ❤️ by OWL ABE STUDIO</i></p>
</div>
