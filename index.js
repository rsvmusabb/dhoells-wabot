require('dotenv').config();

/**
 * @file index.js
 * @description Master Application Router & Entry Point.
 *              Initializes the Baileys WhatsApp Socket, loads all configurations,
 *              and delegates incoming events to modular command handlers.
 * @author JUST BE
 * @version 3.0.0
 * @license MIT
 */

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const sharp = require('sharp');
const axios = require('axios');
const cheerio = require('cheerio');
const yts = require('yt-search');
const youtubedl = require('youtube-dl-exec');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLING
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const errorLog = fs.createWriteStream('error.log', {flags: 'a'});

/**
 * Logs errors to the file system and console to prevent silent failures.
 * @param {string} msg - The error context message.
 * @param {Error|string} err - The error object or string.
 */
function logError(msg, err) {
    const ts = new Date().toISOString();
    errorLog.write(`[${ts}] ${msg}: ${err?.message || err}\n${err?.stack || ''}\n`);
    console.error(`[ERROR] ${msg}: ${err?.message || err}`);
}

process.on('unhandledRejection', (err) => logError('Unhandled Rejection', err));
process.on('uncaughtException', (err) => {
    logError('Uncaught Exception', err);
    setTimeout(() => process.exit(1), 1000);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// CONNECTION & RATE LIMITING STATE
// ════════════════════════════════════════════════════════════════════════════════════════════════════
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

const rateLimiter = {};
const senderDelayer = {}; 
const RATE_LIMIT_WINDOW = 10000;
const RATE_LIMIT_MAX = 3; 
const SENDER_MIN_DELAY = 2000; 
const WHATSAPP_RATE_BACKOFF = {}; 

/**
 * Validates if an incoming request from a specific JID is violating rate limits.
 * Employs a sliding window algorithm and respects upstream WhatsApp backoffs.
 * 
 * @param {string} jid - The WhatsApp JID of the sender.
 * @returns {boolean} True if rate limited, False if allowed.
 */
function isRateLimited(jid) {
    const now = Date.now();

    // 1. Upstream WhatsApp rate limit backoff check
    if (WHATSAPP_RATE_BACKOFF[jid]) {
        const backoffUntil = WHATSAPP_RATE_BACKOFF[jid];
        if (now < backoffUntil) {
            console.warn(`[WA RATE LIMIT BACKOFF] ${jid} blocked until ${new Date(backoffUntil).toISOString()}`);
            return true;
        }
        delete WHATSAPP_RATE_BACKOFF[jid];
    }

    // 2. Sliding window limiter (Max 3 messages per 10s window)
    if (!rateLimiter[jid]) rateLimiter[jid] = [];
    rateLimiter[jid] = rateLimiter[jid].filter(t => now - t < RATE_LIMIT_WINDOW);
    if (rateLimiter[jid].length >= RATE_LIMIT_MAX) {
        console.warn(`[RATE LIMIT] ${jid} blocked (${rateLimiter[jid].length}/${RATE_LIMIT_MAX} in ${RATE_LIMIT_WINDOW}ms)`);
        return true;
    }

    // 3. Per-sender minimum delay (2s between messages)
    if (senderDelayer[jid]) {
        const lastSent = senderDelayer[jid];
        if (now - lastSent < SENDER_MIN_DELAY) {
            console.warn(`[SENDER DELAY] ${jid} needs ${SENDER_MIN_DELAY - (now - lastSent)}ms more`);
            return true;
        }
    }

    rateLimiter[jid].push(now);
    senderDelayer[jid] = now;
    return false;
}

/**
 * Triggers a 60-second strict backoff when upstream WhatsApp APIs block sending to a JID.
 * @param {string} jid - The WhatsApp JID that caused the upstream rate limit.
 */
function markWhatsAppRateLimited(jid) {
    const backoffMs = 60000; // 1 Minute backoff
    WHATSAPP_RATE_BACKOFF[jid] = Date.now() + backoffMs;
    console.warn(`[WA RATE LIMIT] Applied ${backoffMs}ms backoff to ${jid}`);
}

// Config
const { BOT_CONFIG, MENU_ALIAS, MENU_COMMANDS, FRAME, GACHA_PRICES, DUEL_BET, DUEL_TIMEOUT, DAILY_COOLDOWN, RPG_FOODS, MAX_STAMINA, STAMINA_COSTS, STAMINA_REGEN_PER_HOUR, MAX_DURABILITY, DURABILITY_LOSS_PER_BATTLE, REPAIR_COST_PER_POINT, RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_ITEMS, RPG_CLASSES, RPG_ACHIEVEMENTS, RPG_QUESTS, QUEST_COOLDOWN, RPG_EVOLUTIONS, RPG_SKILL_TREES, BASE_UPGRADES, ENCHANT_RATES, ENCHANT_ATK_BONUS, ARENA_RANKS, WORLD_BOSS_POOL, WORLD_BOSS_DURATION, DARK_MONSTERS, DARK_WORLD_DURATION, CURSES, VOID_EVENTS, STORY_CHAPTERS, STORY_TITLES, DEMON_INVASION_PHASES, WEAPON_AWAKENINGS, RPG_SUMMONS, NPC_ENCOUNTERS, RANDOM_EVENTS, KARMA_LEVELS, COOLDOWNS, MARKET_FEE } = require('./config');
const { MENU_CATEGORIES } = require('./modules/utility/menu-categories');

// Database
const { loadPlayerData, savePlayerData, getPlayer, updatePlayer, getDisplayName, normalizePlayerCurrency, loadBannedUsers, isBanned, banUser, unbanUser, loadAdmins, isBotAdmin, isOwner, isPrivileged, normalizeJid, jidKey, sameJid, loadGuildData, saveGuildData, getGuild, saveGuild, deleteGuild, findPlayerGuild, loadMarketData, saveMarketData, loadBountyData, saveBountyData, checkCooldown, formatCooldown, playerCooldowns, activeDuels, activeRaids, activeGambles, activeWorldBoss, activeDemonInvasion } = require('./modules/utility/db');

// Currency
const { formatCoins, parseCoins, getCoins, addCoins, spendCoins, getSellPrice } = require('./modules/utility/currency');

// Menu & Help
const { handleMenu, handleHelp, handleGuide } = require('./modules/utility/menu');

// Games
const { handleGacha, handleRps, handleDaily, handleCoins, handleKoleksi, handleTop, handleSetnama } = require('./modules/games/handler');

// RPG
const { handleHunt } = require('./modules/rpg/battle');
const { handleShop, handleBuy, handleSell, handleSellchar, handleInv, handleEquip, handleUse } = require('./modules/rpg/shop');
const { handleRole, handleProfile, handleAchievement, handleQuest, handleEvolve, handleSkillTree, handleBase, handleTitle, handleSkill } = require('./modules/rpg/progression');
const { handleDungeon, handleDungeonInfo, handleWorldBoss, handleWbAttack, handleDarkWorld, handleRespawn, handleInvasion, handleInvAttack, handleStory, handleSummon, handleAwaken, handleEnchant, handlePet, handleParty } = require('./modules/rpg/dungeon');
const { handleDuel, handleTerima, handleRaid, handleArena, handleGuild, handleBounty, handleWanted, handleMarket } = require('./modules/rpg/social');
const { handleEat, handleRest, handleCamp, handleRepair, handleWeatherCmd, handleKarma, handleStatus } = require('./modules/rpg/survival');

// Media
const { handleSticker, handleStickerText, handleGif, handleQc, handlePlay, handlePin, handlePin4, handleTiktok, handleCuaca } = require('./modules/media/handler');

// AI
const { handleAi, handleAiVn, handleRephrase } = require('./modules/ai/handler');

// Admin
const { handleAdminCommand } = require('./modules/admin/handler');

// Education
const { handleFisika } = require('./modules/education/fisika');
const { handleJadwal } = require('./modules/education/jadwal');
const { handleMatkul } = require('./modules/education/matkul');

// Kasino
const { handleSlot, handleCoinflip, handleDice, handleTebak, handleKasino, handleJudiDuel, handleJudiWar, handleJudiSlot, handleJudiTerima } = require('./modules/rpg/kasino');

// RPG Core (for initRPG, getBuffedStats, etc)
const { initRPG, getBuffedStats, getExpToLevel, checkLevelUp, checkAchievements, trackQuest, tickBuffs, getPetStats, getMonsterForLevel, getDungeonMonster, getRaidBoss, RPG_RAIDS, getArenaRank, getKarmaLevel, updateWeather, getTimeLabel, getTimeMultipliers, cleanOutgoingMessage, installOutgoingTextCleaner, chunkArray, generateBattleImage, renderCollectionPage, escapeSvgText } = require('./modules/rpg/core');

// Image scraper
const { scrapePinterest, downloadImage, sendImageSearchResults } = require('./modules/media/scraper');

// Question helper
const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => rl.question(text, (a) => { rl.close(); resolve(a); })); };

function unwrapMessageContent(message) {
    let content = message || {};
    for (let i = 0; i < 5; i++) {
        if (content.ephemeralMessage?.message) { content = content.ephemeralMessage.message; continue; }
        if (content.viewOnceMessage?.message) { content = content.viewOnceMessage.message; continue; }
        if (content.viewOnceMessageV2?.message) { content = content.viewOnceMessageV2.message; continue; }
        if (content.documentWithCaptionMessage?.message) { content = content.documentWithCaptionMessage.message; continue; }
        break;
    }
    return content;
}

function getInteractiveCommand(content) {
    const rawParams = content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
    if (!rawParams) return '';
    try {
        const params = JSON.parse(rawParams);
        return params.id || params.selectedId || '';
    } catch (error) {
        return '';
    }
}

function extractMessageText(message) {
    const content = unwrapMessageContent(message);
    return content.conversation
        || content.extendedTextMessage?.text
        || content.imageMessage?.caption
        || content.videoMessage?.caption
        || content.documentMessage?.caption
        || content.buttonsResponseMessage?.selectedButtonId
        || content.listResponseMessage?.singleSelectReply?.selectedRowId
        || content.templateButtonReplyMessage?.selectedId
        || getInteractiveCommand(content)
        || '';
}

function getMessageType(message) {
    const content = unwrapMessageContent(message);
    return Object.keys(content || {})[0] || 'unknown';
}

function getMessageSourceLabel(msg, participant) {
    if (msg.key.fromMe) return `${participant} (fromMe/self-chat)`;
    return participant;
}

// ============================================================
// CONNECT TO WHATSAPP
// ============================================================
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Menggunakan WA versi v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({ version, logger: pino({ level: 'silent' }), printQRInTerminal: false, auth: state, browser: ['Ubuntu', 'Chrome', '20.0.04'] });
    installOutgoingTextCleaner(sock);

    if (!sock.authState.creds.registered) {
        console.log('Bot belum login. Gunakan metode Pairing Code.');
        const phoneNumber = await question('Masukkan nomor WhatsApp bot (contoh: 628123456789): ');
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`\n=================================\nPAIRING CODE ANDA: ${code}\n=================================\n`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Reconnect:', shouldReconnect);
            if (shouldReconnect) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
                console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
                setTimeout(() => {
                    reconnectAttempts = 0;
                    connectToWhatsApp();
                }, delay);
            }
        } else if (connection === 'open') {
            reconnectAttempts = 0;
            console.log('Bot berhasil terhubung!');
            console.log('Bot siap menerima command. Tes dari nomor lain atau grup; self-chat nomor bot tidak reliable.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ============================================================
    // GROUP PARTICIPANTS UPDATE â€” Welcome Message
    // ============================================================
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            if (action === 'add') {
                const groupMetadata = await sock.groupMetadata(id);
                for (const participant of participants) {
                    // Delay antar welcome untuk avoid rate limit
                    await new Promise(r => setTimeout(r, 2500));
                    const welcomeText = `ðŸ‘‹ Selamat datang @${participant.split('@')[0]} di *${groupMetadata.subject}*!\n\nðŸ“œ ketik *.menu* untuk melihat command\nðŸŽ® ketik *.daftar* untuk bermain RPG\n\nSemoga betah ya~ ðŸŽ‰`;
                    await sock.sendMessage(id, { text: welcomeText, mentions: [participant] });
                }
            } else if (action === 'remove') {
                for (const participant of participants) {
                    await new Promise(r => setTimeout(r, 2500));
                    await sock.sendMessage(id, { text: `ðŸ‘‹ Selamat jalan @${participant.split('@')[0]}, semoga tenang disana~`, mentions: [participant] });
                }
            } else if (action === 'promote') {
                for (const participant of participants) {
                    await new Promise(r => setTimeout(r, 2500));
                    await sock.sendMessage(id, { text: `ðŸŽ‰ Selamat @${participant.split('@')[0]} sekarang jadi admin grup!`, mentions: [participant] });
                }
            } else if (action === 'demote') {
                for (const participant of participants) {
                    await new Promise(r => setTimeout(r, 2500));
                    await sock.sendMessage(id, { text: `ðŸ˜… @${participant.split('@')[0]} di-demote dari admin.`, mentions: [participant] });
                }
            }
        } catch (e) {
            logError('group-participants.update', e);
        }
    });

    // ============================================================
    // MESSAGE HANDLER â€” Command Router
    // ============================================================
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message) {
            if (BOT_CONFIG.DEBUG_INCOMING_MESSAGES) console.log('[MSG DEBUG] Pesan tanpa content diterima.');
            return;
        }

        const sender = msg.key.remoteJid;
        const participant = msg.key.participant || msg.key.remoteJid;

        // Anti-spam rate limiting â€” OWNER ABSOLUT BYPASSES ALL LIMITS
        if (!isOwner(participant)) {
            if (isRateLimited(participant)) {
                return; // silent drop, no reply to avoid compounding the problem
            }
        }

        const sourceLabel = getMessageSourceLabel(msg, participant);
        const messageContent = extractMessageText(msg.message).trim();
        if (msg.key.fromMe && !BOT_CONFIG.PROCESS_OWN_COMMANDS) {
            if (messageContent.startsWith('.')) console.log(`[SELF COMMAND IGNORED] ${messageContent} dari ${sourceLabel}. Tes dari nomor lain atau grup.`);
            return;
        }
        if (!messageContent.startsWith('.')) {
            if (BOT_CONFIG.DEBUG_INCOMING_MESSAGES) console.log(`[MSG DEBUG] Non-command ${getMessageType(msg.message)} dari ${sourceLabel}`);
            return;
        }

        const args = messageContent.substring(1).split(' ');
        const command = args.shift().toLowerCase();
        const textMessage = args.join(' ');
        console.log(`[CMD] ${command}${textMessage ? ' ' + textMessage : ''} dari ${sourceLabel}`);

        if (isBanned(participant) && !isOwner(participant)) return;

        // ============================================================
        // SECURITY: Auto-welcome for group join events
        // ============================================================
        if (sender.endsWith('@g.us') && !command && messageContent) {
            // Welcome message disabled for non-command messages to reduce spam
        }

        // ============================================================
        // SECURITY: Anti-link spam (group only, skip owner/admin)
        // ============================================================
        if (sender.endsWith('@g.us') && !isOwner(participant) && !isBotAdmin(participant)) {
            const linkPattern = /(https?:\/\/|www\.)\S+/gi;
            if (linkPattern.test(messageContent) && !command) {
                // Check if sender is bot admin (trusted)
                try {
                    const groupMetadata = await sock.groupMetadata(sender);
                    const groupAdmins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
                    if (!groupAdmins.includes(participant)) {
                        // Non-admin posting link â†’ delete + warn
                        await sock.sendMessage(sender, { delete: msg.key });
                        await sock.sendMessage(sender, { text: `âš ï¸ @${participant.split('@')[0]} dilarang share link tanpa izin admin!`, mentions: [participant] });
                        return;
                    }
                } catch (e) {
                    // Silently fail if can't get group info
                }
            }
        }

        try {
            switch (command) {
                // ==================== MENU & HELP ====================
                case 'menu': case 'menurpg': case 'menugame': case 'menugames': case 'menuai': case 'menuclaryn':
                case 'menupin': case 'menuimage': case 'menumedia': case 'menuutility': case 'menuutil':
                case 'menuadmin': case 'menuowner': case 'pinmenu': case 'imagemenu': case 'mediamenu':
                case 'utilitymenu': case 'adminmenu': case 'ownermenu':
                case 'menueducation': case 'educationmenu':
                    await handleMenu(sock, sender, msg, participant, textMessage, command); break;
                case 'help':
                    await handleHelp(sock, sender, msg, participant, textMessage); break;
                case 'guide': case 'panduan':
                    await handleGuide(sock, sender, msg); break;

                // ==================== STICKER / GIF / QC ====================
                case 's': case 'sticker':
                    await handleSticker(sock, sender, msg, participant, textMessage); break;
                case 'gif':
                    await handleGif(sock, sender, msg, participant, textMessage); break;
                case 'qc': case 'quote':
                    await handleQc(sock, sender, msg, participant, textMessage); break;
                case 'stxt': case 'stikerteks': case 'stext':
                    await handleStickerText(sock, sender, msg, participant, textMessage); break;

                // ==================== MEDIA ====================
                case 'play': case 'ytmp3': case 'ytmp4': case 'music':
                    await handlePlay(sock, sender, msg, participant, textMessage); break;
                case 'pin':
                    await handlePin(sock, sender, msg, participant, textMessage); break;
                case 'pin4':
                    await handlePin4(sock, sender, msg, participant, textMessage); break;
                case 'tt': case 'tiktok':
                    await handleTiktok(sock, sender, msg, participant, textMessage); break;
                case 'cuaca': case 'weather':
                    await handleCuaca(sock, sender, msg, participant, textMessage); break;

                // ==================== GAMES ====================
                case 'gacha':
                    await handleGacha(sock, sender, msg, participant, textMessage); break;
                case 'rps': case 'suit':
                    await handleRps(sock, sender, msg, participant, textMessage); break;
                case 'daily': case 'claim':
                    await handleDaily(sock, sender, msg, participant, textMessage); break;
                case 'coin': case 'coins': case 'saldo':
                    await handleCoins(sock, sender, msg, participant, textMessage); break;
                case 'koleksi': case 'collection':
                    await handleKoleksi(sock, sender, msg, participant, textMessage); break;
                case 'top': case 'leaderboard': case 'ranking':
                    await handleTop(sock, sender, msg, participant, textMessage); break;
                case 'setnama': case 'setname': case 'nick':
                    await handleSetnama(sock, sender, msg, participant, textMessage); break;

                // ==================== AI TOOLS ====================
                case 'ai': case 'ask': case 'chat': case 'claryn':
                    await handleAi(sock, sender, msg, participant, textMessage); break;
                case 'clarynvn': case 'cvn':
                    await handleAiVn(sock, sender, msg, participant, textMessage); break;
                
                case 'rephrase': case 'parafrase': case 'humanize': case 'rangkum': case 'summary':
                case 'puitis': case 'formal': case 'santai': case 'eli5': case 'terjemah': case 'translate':
                    await handleRephrase(sock, sender, msg, participant, textMessage, command); break;

                // ==================== RPG: ROLE & PROFILE ====================
                case 'role': case 'class':
                    await handleRole(sock, sender, msg, participant, textMessage); break;
                case 'rpg': case 'stats': case 'profile':
                    await handleProfile(sock, sender, msg, participant, textMessage); break;
                case 'achievement': case 'ach': case 'achievements':
                    await handleAchievement(sock, sender, msg, participant, textMessage); break;
                case 'title':
                    await handleTitle(sock, sender, msg, participant, textMessage); break;
                case 'quest':
                    await handleQuest(sock, sender, msg, participant, textMessage); break;
                case 'evolve': case 'evolusi':
                    await handleEvolve(sock, sender, msg, participant, textMessage); break;
                case 'skilltree': case 'st':
                    await handleSkillTree(sock, sender, msg, participant, textMessage); break;
                case 'skill':
                    await handleSkill(sock, sender, msg, participant, textMessage); break;

                // ==================== RPG: SHOP & INVENTORY ====================
                case 'shop': case 'toko':
                    await handleShop(sock, sender, msg, participant, textMessage); break;
                case 'buy': case 'beli':
                    await handleBuy(sock, sender, msg, participant, textMessage); break;
                case 'sell': case 'jual':
                    await handleSell(sock, sender, msg, participant, textMessage); break;
                case 'sellchar': case 'jualchar':
                    await handleSellchar(sock, sender, msg, participant, textMessage); break;
                case 'inv': case 'inventory':
                    await handleInv(sock, sender, msg, participant, textMessage); break;
                case 'equip': case 'pasang':
                    await handleEquip(sock, sender, msg, participant, textMessage); break;
                case 'use': case 'pakai':
                    await handleUse(sock, sender, msg, participant, textMessage); break;

                // ==================== RPG: BATTLE ====================
                case 'hunt': case 'berburu':
                    await handleHunt(sock, sender, msg, participant, textMessage); break;

                // ==================== RPG: DUNGEON & BOSS ====================
                case 'dungeon': case 'dg':
                    await handleDungeon(sock, sender, msg, participant, textMessage); break;
                case 'dungeoninfo': case 'dginfo':
                    await handleDungeonInfo(sock, sender, msg, participant, textMessage); break;
                case 'worldboss': case 'wb':
                    await handleWorldBoss(sock, sender, msg, participant, textMessage); break;
                case 'wbattack':
                    await handleWbAttack(sock, sender, msg, participant, textMessage); break;
                case 'darkworld': case 'dw':
                    await handleDarkWorld(sock, sender, msg, participant, textMessage); break;
                case 'respawn':
                    await handleRespawn(sock, sender, msg, participant, textMessage); break;
                case 'invasion':
                    await handleInvasion(sock, sender, msg, participant, textMessage); break;
                case 'invattack':
                    await handleInvAttack(sock, sender, msg, participant, textMessage); break;
                case 'story': case 'lore':
                    await handleStory(sock, sender, msg, participant, textMessage); break;

                // ==================== RPG: SOCIAL ====================
                case 'duel': case 'challenge':
                    await handleDuel(sock, sender, msg, participant, textMessage, args, null); break;
                case 'terima': case 'accept': case 'acc': case 'juditerima': case 'terimagamble':
                    // Cek judi duel dulu, kalau ga ada fallback ke RPG duel/raid
                    if (activeGambles[sender]) {
                        await handleJudiTerima(sock, sender, msg, participant, textMessage);
                    } else {
                        await handleTerima(sock, sender, msg, participant, textMessage);
                    }
                    break;
                case 'raid':
                    await handleRaid(sock, sender, msg, participant, textMessage); break;
                case 'arena': case 'pvp':
                    await handleArena(sock, sender, msg, participant, textMessage); break;
                case 'guild':
                    await handleGuild(sock, sender, msg, participant, textMessage); break;
                case 'bounty':
                    await handleBounty(sock, sender, msg, participant, textMessage); break;
                case 'wanted':
                    await handleWanted(sock, sender, msg, participant, textMessage); break;
                case 'market':
                    await handleMarket(sock, sender, msg, participant, textMessage); break;

                // ==================== RPG: SURVIVAL ====================
                case 'eat': case 'makan':
                    await handleEat(sock, sender, msg, participant, textMessage); break;
                case 'rest': case 'istirahat':
                    await handleRest(sock, sender, msg, participant, textMessage); break;
                case 'camp':
                    await handleCamp(sock, sender, msg, participant, textMessage); break;
                case 'repair': case 'perbaiki':
                    await handleRepair(sock, sender, msg, participant, textMessage); break;
                case 'karma':
                    await handleKarma(sock, sender, msg, participant, textMessage); break;
                case 'status':
                    await handleStatus(sock, sender, msg, participant, textMessage); break;

                // ==================== RPG: ADVANCED ====================
                case 'base':
                    await handleBase(sock, sender, msg, participant, textMessage); break;
                case 'summon':
                    await handleSummon(sock, sender, msg, participant, textMessage); break;
                case 'awaken':
                    await handleAwaken(sock, sender, msg, participant, textMessage); break;
                case 'enchant':
                    await handleEnchant(sock, sender, msg, participant, textMessage); break;
                case 'pet':
                    await handlePet(sock, sender, msg, participant, textMessage); break;
                case 'party':
                    await handleParty(sock, sender, msg, participant, textMessage); break;
                // ==================== SOCIAL & GUILD ====================
                case 'fisika': case 'modulfisika': case 'fisikamodul':
                    await handleFisika(sock, sender, msg, participant, textMessage); break;
                case 'jadwal': case 'schedule': case 'kuliah':
                    await handleJadwal(sock, sender, msg, participant, textMessage); break;
                case 'matkul': case 'materi': case 'kti':
                    await handleMatkul(sock, sender, msg, participant, textMessage); break;

                // ==================== KASINO ====================
                case 'kasino': case 'casino': case 'judi':
                    await handleKasino(sock, sender, msg, participant, textMessage); break;
                case 'slot': case 'slotmachine':
                    await handleSlot(sock, sender, msg, participant, textMessage); break;
                case 'coinflip': case 'cf': case 'koin':
                    await handleCoinflip(sock, sender, msg, participant, textMessage); break;
                case 'dice': case 'dadu':
                    await handleDice(sock, sender, msg, participant, textMessage); break;
                case 'tebak': case 'tebakangka':
                    await handleTebak(sock, sender, msg, participant, textMessage); break;
                case 'judiduel': case 'judicf': case 'judicoinflip':
                    await handleJudiDuel(sock, sender, msg, participant, textMessage); break;
                case 'judiwar': case 'judidice': case 'judidadu':
                    await handleJudiWar(sock, sender, msg, participant, textMessage); break;
                case 'judislot': case 'judirace': case 'slotrace':
                    await handleJudiSlot(sock, sender, msg, participant, textMessage); break;

                // ==================== ADMIN & OWNER ====================
                case 'addadmin': case 'tambahadmin':
                case 'deladmin': case 'hapusadmin': case 'removeadmin':
                case 'listadmin': case 'adminlist':
                case 'addcoin': case 'setlevel': case 'setlvl':
                case 'setcoin': case 'debuff': case 'mincoin': case 'createitem':
                case 'setexp': case 'addexp':
                case 'setstats': case 'setstat':
                case 'setkarma':
                case 'maxstamina': case 'maxstam': case 'staminafull':
                case 'maxdurability': case 'maxdur': case 'durfull':
                case 'fullheal': case 'heal':
                case 'giveitem': case 'giveweapon':
                case 'givearmor': case 'giveshield':
                case 'resetplayer': case 'allplayer': case 'alldata':
                case 'kick': case 'tendang':
                case 'mute': case 'mutegrup': case 'unmute': case 'unmutegrup':
                case 'promote': case 'demote':
                case 'setgroupname': case 'setnamagrup':
                case 'setgroupdesc': case 'setdescgrup':
                case 'ban': case 'unban': case 'banlist':
                case 'broadcast': case 'bc':
                case 'setwin': case 'menangterus': case 'alwayswin':
                case 'setlose': case 'kalahterus': case 'alwayslose':
                case 'setnormal': case 'normalmode': case 'resetmode':
                case 'checkmode': case 'cekmode': case 'modeplayer':
                case 'lacak': case 'track': case 'cekno':
                case 'lacakip': case 'iplookup':
                case 'getkontak': case 'getcontact': case 'listkontak':
                case 'savekontak': case 'savecontact': case 'exportkontak':
                case 'cariuser': case 'finduser': case 'stalker':
                case 'pushkontak':
                    await handleAdminCommand(sock, sender, msg, participant, textMessage, args, command); break;

                default:
                    break;
            }
        } catch (error) {
            logError(`[CMD ERROR] ${command}`, error);
        }
        } catch (error) {
            logError('messages.upsert', error);
        }
    });
}

connectToWhatsApp();




