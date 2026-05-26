// ============================================================
// modules/rpg/kasino.js — Kasino & Judi Games
// Games: Slot Machine, Coin Flip, Dice Roll, Tebak Angka
// ============================================================

const { getPlayer, updatePlayer, getDisplayName, activeGambles } = require('../utility/db');
const { formatCoins } = require('../utility/currency');
const { FRAME } = require('../../config');
const { delay } = require('@whiskeysockets/baileys');

// ============================================================
// KASINO MODE CHECK (Fitur Dewa)
// ============================================================
function getKasinoMode(playerId) {
    const player = getPlayer(playerId);
    return player.kasinoStats?.mode || 'normal';
}

function isAlwaysWin(playerId) {
    return getKasinoMode(playerId) === 'always_win';
}

function isAlwaysLose(playerId) {
    return getKasinoMode(playerId) === 'always_lose';
}

// ============================================================
// SLOT MACHINE
// ============================================================
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const SLOT_WEIGHTS = [30, 25, 20, 12, 8, 3, 2]; // probability weights

const SLOT_PAYOUTS = {
    '7️⃣7️⃣7️⃣': { multiplier: 50, label: 'JACKPOT! 🎰' },
    '💎💎💎': { multiplier: 25, label: 'DIAMOND! 💎' },
    '⭐⭐⭐': { multiplier: 15, label: 'STAR! ⭐' },
    '🍇🍇🍇': { multiplier: 10, label: 'GRAPE! 🍇' },
    '🍊🍊🍊': { multiplier: 8, label: 'ORANGE! 🍊' },
    '🍋🍋🍋': { multiplier: 5, label: 'LEMON! 🍋' },
    '🍒🍒🍒': { multiplier: 3, label: 'CHERRY! 🍒' },
};

function spinSlot() {
    const totalWeight = SLOT_WEIGHTS.reduce((a, b) => a + b, 0);
    const result = [];
    for (let i = 0; i < 3; i++) {
        let rand = Math.random() * totalWeight;
        for (let j = 0; j < SLOT_SYMBOLS.length; j++) {
            rand -= SLOT_WEIGHTS[j];
            if (rand <= 0) { result.push(SLOT_SYMBOLS[j]); break; }
        }
    }
    return result;
}

function getSlotResult(symbols) {
    const key = symbols.join('');
    if (SLOT_PAYOUTS[key]) {
        return { ...SLOT_PAYOUTS[key], symbols: key };
    }
    // Check 2 matching
    if (symbols[0] === symbols[1] || symbols[1] === symbols[2]) {
        return { multiplier: 1, label: '2 Match (balik modal)', symbols: key };
    }
    if (symbols[0] === symbols[2]) {
        return { multiplier: 1, label: '2 Match (balik modal)', symbols: key };
    }
    return { multiplier: 0, label: 'LOSE', symbols: key };
}

async function handleSlot(sock, sender, msg, participant, textMessage) {
    const player = getPlayer(participant);
    const args = textMessage.trim().split(/\s+/);
    const betStr = args[0];

    if (!betStr || betStr === 'menu') {
        await sock.sendMessage(sender, {
            text: `╭━━━〔 *🎰 SLOT MACHINE* 〕━━━\n┃\n┃ 🎰 *.slot <jumlah>*\n┃   Contoh: *.slot 100*\n┃\n┃ 💰 *Payout:*\n┃  7️⃣7️⃣7️⃣ = 50x (JACKPOT!)\n┃  💎💎💎 = 25x\n┃  ⭐⭐⭐ = 15x\n┃  🍇🍇🍇 = 10x\n┃  🍊🍊🍊 = 8x\n┃  🍋🍋🍋 = 5x\n┃  🍒🍒🍒 = 3x\n┃  2 Match = 1x (balik modal)\n┃\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
        }, { quoted: msg });
        return;
    }

    const bet = parseInt(betStr);
    if (isNaN(bet) || bet <= 0) {
        await sock.sendMessage(sender, { text: '❌ Masukkan jumlah bet yang valid!\nContoh: *.slot 100*' }, { quoted: msg });
        return;
    }
    if (bet < 10) {
        await sock.sendMessage(sender, { text: '❌ Minimal bet *10 Bronze*!' }, { quoted: msg });
        return;
    }
    if (player.coins < bet) {
        await sock.sendMessage(sender, { text: `❌ Coin tidak cukup!\nPunya: *${formatCoins(player.coins)}*, butuh: *${formatCoins(bet)}*` }, { quoted: msg });
        return;
    }

    // Fitur Dewa: always_win / always_lose
    let symbols, result;
    if (isAlwaysWin(participant)) {
        symbols = ['7️⃣', '7️⃣', '7️⃣'];
        result = { ...SLOT_PAYOUTS['7️⃣7️⃣7️⃣'], symbols: '7️⃣7️⃣7️⃣' };
    } else if (isAlwaysLose(participant)) {
        symbols = ['🍒', '🍋', '🍊'];
        result = { multiplier: 0, label: 'LOSE', symbols: '🍒🍋🍊' };
    } else {
        symbols = spinSlot();
        result = getSlotResult(symbols);
    }
    const winAmount = bet * result.multiplier;
    const netChange = winAmount - bet;

    player.coins -= bet;
    player.coins += winAmount;
    if (player.coins < 0) player.coins = 0;

    // Update kasino stats
    if (!player.kasinoStats) player.kasinoStats = { slotWins: 0, slotLosses: 0, slotTotal: 0, totalWagered: 0, totalWon: 0 };
    player.kasinoStats.slotTotal++;
    player.kasinoStats.totalWagered += bet;
    if (netChange > 0) { player.kasinoStats.slotWins++; player.kasinoStats.totalWon += winAmount; }
    else if (netChange < 0) player.kasinoStats.slotLosses++;

    updatePlayer(participant, player);

    const display = `┃  [ ${symbols[0]} | ${symbols[1]} | ${symbols[2]} ]`;
    const netText = netChange >= 0 ? `+${formatCoins(netChange)}` : formatCoins(netChange);

    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🎰 SLOT MACHINE* 〕━━━\n┃\n${display}\n┃\n┃ 🎯 *${result.label}*\n┃ 💰 Bet: ${formatCoins(bet)}\n┃ 🏆 Win: ${formatCoins(winAmount)}\n┃ 📊 Net: *${netText}*\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });
}

// ============================================================
// COIN FLIP (Koin Ganjil/Genap)
// ============================================================
async function handleCoinflip(sock, sender, msg, participant, textMessage) {
    const player = getPlayer(participant);
    const args = textMessage.trim().split(/\s+/);

    if (!args[0] || args[0] === 'menu') {
        await sock.sendMessage(sender, {
            text: `╭━━━〔 *🪙 COIN FLIP* 〕━━━\n┃\n┃ 🪙 *.coinflip <ganjil/genap> <jumlah>*\n┃   Contoh: *.coinflip ganjil 200*\n┃\n┃ 💰 Menang = 1.95x bet (house edge 2.5%)\n┃ 💀 Kalah = hilang semua bet\n┃\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
        }, { quoted: msg });
        return;
    }

    const choice = args[0].toLowerCase();
    const bet = parseInt(args[1]);

    if (choice !== 'ganjil' && choice !== 'genap') {
        await sock.sendMessage(sender, { text: '❌ Pilih *ganjil* atau *genap*!\nContoh: *.coinflip ganjil 200*' }, { quoted: msg });
        return;
    }
    if (isNaN(bet) || bet <= 0) {
        await sock.sendMessage(sender, { text: '❌ Masukkan jumlah bet yang valid!' }, { quoted: msg });
        return;
    }
    if (bet < 10) {
        await sock.sendMessage(sender, { text: '❌ Minimal bet *10 Bronze*!' }, { quoted: msg });
        return;
    }
    if (player.coins < bet) {
        await sock.sendMessage(sender, { text: `❌ Coin tidak cukup!\nPunya: *${formatCoins(player.coins)}*` }, { quoted: msg });
        return;
    }

    // Fitur Dewa: always_win / always_lose
    let result, won;
    if (isAlwaysWin(participant)) {
        result = choice; // hasil = pilihan player (menang)
        won = true;
    } else if (isAlwaysLose(participant)) {
        result = choice === 'ganjil' ? 'genap' : 'ganjil'; // hasil berlawanan (kalah)
        won = false;
    } else {
        result = Math.random() < 0.5 ? 'ganjil' : 'genap';
        won = choice === result;
    }

    player.coins -= bet;
    if (won) player.coins += Math.floor(bet * 1.95);

    // Update stats
    if (!player.kasinoStats) player.kasinoStats = { cfWins: 0, cfLosses: 0, cfTotal: 0, totalWagered: 0, totalWon: 0 };
    player.kasinoStats.cfTotal++;
    player.kasinoStats.totalWagered += bet;
    if (won) { player.kasinoStats.cfWins++; player.kasinoStats.totalWon += bet * 2; }
    else player.kasinoStats.cfLosses++;

    updatePlayer(participant, player);

    const emoji = result === 'ganjil' ? '🔴' : '🔵';
    const resultText = won ? '🏆 MENANG!' : '💀 KALAH!';
    const netText = won ? `+${formatCoins(bet)}` : `-${formatCoins(bet)}`;

    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🪙 COIN FLIP* 〕━━━\n┃\n┃ Kamu pilih: *${choice.toUpperCase()}*\n┃ Hasil: ${emoji} *${result.toUpperCase()}*\n┃\n┃ ${resultText}\n┃ 💰 Bet: ${formatCoins(bet)}\n┃ 📊 Net: *${netText}*\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });
}

// ============================================================
// DICE ROLL (Dadu)
// ============================================================
async function handleDice(sock, sender, msg, participant, textMessage) {
    const player = getPlayer(participant);
    const args = textMessage.trim().split(/\s+/);

    if (!args[0] || args[0] === 'menu') {
        await sock.sendMessage(sender, {
            text: `╭━━━〔 *🎲 DICE ROLL* 〕━━━\n┃\n┃ 🎲 *.dice <angka 1-6> <jumlah>*\n┃   Contoh: *.dice 6 300*\n┃\n┃ 💰 Menang = 5x bet (house edge 16.7%)\n┃ 💀 Kalah = hilang semua bet\n┃\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
        }, { quoted: msg });
        return;
    }

    const guess = parseInt(args[0]);
    const bet = parseInt(args[1]);

    if (isNaN(guess) || guess < 1 || guess > 6) {
        await sock.sendMessage(sender, { text: '❌ Pilih angka 1-6!\nContoh: *.dice 6 300*' }, { quoted: msg });
        return;
    }
    if (isNaN(bet) || bet <= 0) {
        await sock.sendMessage(sender, { text: '❌ Masukkan jumlah bet yang valid!' }, { quoted: msg });
        return;
    }
    if (bet < 10) {
        await sock.sendMessage(sender, { text: '❌ Minimal bet *10 Bronze*!' }, { quoted: msg });
        return;
    }
    if (player.coins < bet) {
        await sock.sendMessage(sender, { text: `❌ Coin tidak cukup!\nPunya: *${formatCoins(player.coins)}*` }, { quoted: msg });
        return;
    }

    // Fitur Dewa: always_win / always_lose
    let roll, won;
    if (isAlwaysWin(participant)) {
        roll = guess; // dadu = tebakan player (menang)
        won = true;
    } else if (isAlwaysLose(participant)) {
        roll = guess === 6 ? 1 : guess + 1; // dadu selalu salah
        won = false;
    } else {
        roll = Math.floor(Math.random() * 6) + 1;
        won = guess === roll;
    }

    player.coins -= bet;
    if (won) player.coins += bet * 5;

    // Update stats
    if (!player.kasinoStats) player.kasinoStats = { diceWins: 0, diceLosses: 0, diceTotal: 0, totalWagered: 0, totalWon: 0 };
    player.kasinoStats.diceTotal++;
    player.kasinoStats.totalWagered += bet;
    if (won) { player.kasinoStats.diceWins++; player.kasinoStats.totalWon += bet * 5; }
    else player.kasinoStats.diceLosses++;

    updatePlayer(participant, player);

    const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][roll - 1];
    const resultText = won ? '🏆 MENANG!' : '💀 KALAH!';
    const netText = won ? `+${formatCoins(bet * 5)}` : `-${formatCoins(bet)}`;

    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🎲 DICE ROLL* 〕━━━\n┃\n┃ Kamu nebak: *${guess}*\n┃ Dadu keluar: ${diceEmoji} *${roll}*\n┃\n┃ ${resultText}\n┃ 💰 Bet: ${formatCoins(bet)}\n┃ 📊 Net: *${netText}*\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });
}

// ============================================================
// TEBAK ANGKA (1-10)
// ============================================================
async function handleTebak(sock, sender, msg, participant, textMessage) {
    const player = getPlayer(participant);
    const args = textMessage.trim().split(/\s+/);

    if (!args[0] || args[0] === 'menu') {
        await sock.sendMessage(sender, {
            text: `╭━━━〔 *🔢 TEBAK ANGKA* 〕━━━\n┃\n┃ 🔢 *.tebak <angka 1-10> <jumlah>*\n┃   Contoh: *.tebak 7 500*\n┃\n┃ 💰 Menang = 9x bet (house edge 10%)\n┃ 💀 Kalah = hilang semua bet\n┃\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
        }, { quoted: msg });
        return;
    }

    const guess = parseInt(args[0]);
    const bet = parseInt(args[1]);

    if (isNaN(guess) || guess < 1 || guess > 10) {
        await sock.sendMessage(sender, { text: '❌ Pilih angka 1-10!\nContoh: *.tebak 7 500*' }, { quoted: msg });
        return;
    }
    if (isNaN(bet) || bet <= 0) {
        await sock.sendMessage(sender, { text: '❌ Masukkan jumlah bet yang valid!' }, { quoted: msg });
        return;
    }
    if (bet < 10) {
        await sock.sendMessage(sender, { text: '❌ Minimal bet *10 Bronze*!' }, { quoted: msg });
        return;
    }
    if (player.coins < bet) {
        await sock.sendMessage(sender, { text: `❌ Coin tidak cukup!\nPunya: *${formatCoins(player.coins)}*` }, { quoted: msg });
        return;
    }

    // Fitur Dewa: always_win / always_lose
    let answer, won;
    if (isAlwaysWin(participant)) {
        answer = guess; // jawaban = tebakan player (menang)
        won = true;
    } else if (isAlwaysLose(participant)) {
        answer = guess === 10 ? 1 : guess + 1; // jawaban selalu salah
        won = false;
    } else {
        answer = Math.floor(Math.random() * 10) + 1;
        won = guess === answer;
    }

    player.coins -= bet;
    if (won) player.coins += bet * 9;

    // Update stats
    if (!player.kasinoStats) player.kasinoStats = { tebakWins: 0, tebakLosses: 0, tebakTotal: 0, totalWagered: 0, totalWon: 0 };
    player.kasinoStats.tebakTotal++;
    player.kasinoStats.totalWagered += bet;
    if (won) { player.kasinoStats.tebakWins++; player.kasinoStats.totalWon += bet * 9; }
    else player.kasinoStats.tebakLosses++;

    updatePlayer(participant, player);

    const resultText = won ? '🏆 MENANG!' : '💀 KALAH!';
    const netText = won ? `+${formatCoins(bet * 9)}` : `-${formatCoins(bet)}`;

    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🔢 TEBAK ANGKA* 〕━━━\n┃\n┃ Kamu nebak: *${guess}*\n┃ Jawaban: *${answer}*\n┃\n┃ ${resultText}\n┃ 💰 Bet: ${formatCoins(bet)}\n┃ 📊 Net: *${netText}*\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n╰━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });
}

// ============================================================
// KASINO MENU & STATS
// ============================================================
async function handleKasino(sock, sender, msg, participant, textMessage) {
    const player = getPlayer(participant);
    const stats = player.kasinoStats || { slotWins: 0, slotLosses: 0, slotTotal: 0, cfWins: 0, cfLosses: 0, cfTotal: 0, diceWins: 0, diceLosses: 0, diceTotal: 0, tebakWins: 0, tebakLosses: 0, tebakTotal: 0, totalWagered: 0, totalWon: 0, gambleDuelWins: 0, gambleDuelLosses: 0 };

    const totalGames = (stats.slotTotal || 0) + (stats.cfTotal || 0) + (stats.diceTotal || 0) + (stats.tebakTotal || 0);
    const totalWins = (stats.slotWins || 0) + (stats.cfWins || 0) + (stats.diceWins || 0) + (stats.tebakWins || 0);
    const totalLosses = (stats.slotLosses || 0) + (stats.cfLosses || 0) + (stats.diceLosses || 0) + (stats.tebakLosses || 0);
    const netProfit = (stats.totalWon || 0) - (stats.totalWagered || 0);
    const gdW = stats.gambleDuelWins || 0;
    const gdL = stats.gambleDuelLosses || 0;

    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🎰 KASINO DHOELLS* 〕━━━\n┃\n┃ 🪙 Saldo: *${formatCoins(player.coins)}*\n┃\n┣━━ *🎰 Solo Games* ━━\n┃ 🎰 *.slot <bet>* — Slot Machine\n┃ 🪙 *.coinflip <gj/gp> <bet>* — Coin Flip\n┃ 🎲 *.dice <1-6> <bet>* — Dice Roll\n┃ 🔢 *.tebak <1-10> <bet>* — Tebak Angka\n┃\n┣━━ *🎲 Judi Duel (PvP)* ━━\n┃ 🪙 *.judiduel @orang <bet>* — Coinflip PvP\n┃ 🎲 *.judiwar @orang <bet>* — Dice War PvP\n┃ 🎰 *.judislot @orang <bet>* — Slot Race PvP\n┃ ✅ *.acc / .juditerima* — Terima tantangan\n┃\n┣━━ *📊 Stats* ━━\n┃ 🎮 Solo: *${totalGames}* game | W:*${totalWins}* L:*${totalLosses}*\n┃ 🎲 Judi Duel: W:*${gdW}* L:*${gdL}*\n┃ 💰 Wagered: ${formatCoins(stats.totalWagered || 0)}\n┃ 📈 Net: *${netProfit >= 0 ? '+' : ''}${formatCoins(Math.abs(netProfit))}*\n┃\n┃ 💡 Min bet solo: 10 Bronze\n┃ 💡 Min bet duel: ${formatCoins(50)}\n╰━━━━━━━━━━━━━━━━━━━`
    }, { quoted: msg });
}

// ============================================================
// JUDI DUEL — COINFLIP PVP
// ============================================================
async function handleJudiDuel(sock, sender, msg, participant, textMessage) {
    if (!sender.includes('@g.us')) { await sock.sendMessage(sender, { text: '❌ Judi duel hanya bisa di grup!' }, { quoted: msg }); return; }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) {
        await sock.sendMessage(sender, { text: '📌 *JUDI DUEL — COINFLIP*\n\nTag lawan + bet:\n*.judiduel @orang 500*\n\n🪙 Kalian berdua taruhan, lalu flip coin!\n🏆 Menang = ambil semua pot\n💡 Min bet: ' + formatCoins(50) }, { quoted: msg });
        return;
    }
    const bet = parseInt(textMessage.replace(/@\S+/g, '').trim());
    if (isNaN(bet) || bet < 50) { await sock.sendMessage(sender, { text: `❌ Min bet: *${formatCoins(50)}*!\nContoh: *.judiduel @orang 500*` }, { quoted: msg }); return; }
    const p1 = getPlayer(participant);
    if (p1.coins < bet) { await sock.sendMessage(sender, { text: `❌ Coin kamu kurang! Punya: ${formatCoins(p1.coins)}` }, { quoted: msg }); return; }
    const opp = mentioned[0];
    if (opp === participant) { await sock.sendMessage(sender, { text: '❌ Ga bisa judi sama diri sendiri lur!' }, { quoted: msg }); return; }
    if (activeGambles[sender]) { await sock.sendMessage(sender, { text: '⚠️ Masih ada judi duel aktif! Tunggu selesai atau expired.' }, { quoted: msg }); return; }
    const startTs = Date.now();
    activeGambles[sender] = { type: 'coinflip', challenger: participant, opponent: opp, bet, timestamp: startTs };
    setTimeout(() => { if (activeGambles[sender]?.timestamp === startTs) { delete activeGambles[sender]; sock.sendMessage(sender, { text: '⏰ Judi duel expired! (90 detik)' }); } }, 90000);
    const n1 = getDisplayName(participant);
    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🪙 JUDI DUEL — COINFLIP* 〕━━━\n┃\n┃ 🎭 *${n1}* menantang\n┃ 🎯 @${opp.split('@')[0]}\n┃\n┃ 💰 Taruhan: *${formatCoins(bet)}* masing-masing\n┃ 🏆 Pemenang ambil: *${formatCoins(bet * 2)}*\n┃\n┃ ⏰ 90 detik untuk terima\n╰ @${opp.split('@')[0]} ketik *.acc* atau *.juditerima*`,
        mentions: [opp]
    }, { quoted: msg });
}

// ============================================================
// JUDI DUEL — DICE WAR PVP
// ============================================================
async function handleJudiWar(sock, sender, msg, participant, textMessage) {
    if (!sender.includes('@g.us')) { await sock.sendMessage(sender, { text: '❌ Judi duel hanya bisa di grup!' }, { quoted: msg }); return; }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) {
        await sock.sendMessage(sender, { text: '📌 *JUDI DUEL — DICE WAR*\n\nTag lawan + bet:\n*.judiwar @orang 500*\n\n🎲 Kalian berdua lempar 3 dadu!\n🏆 Total tertinggi menang!\n💡 Min bet: ' + formatCoins(50) }, { quoted: msg });
        return;
    }
    const bet = parseInt(textMessage.replace(/@\S+/g, '').trim());
    if (isNaN(bet) || bet < 50) { await sock.sendMessage(sender, { text: `❌ Min bet: *${formatCoins(50)}*!` }, { quoted: msg }); return; }
    const p1 = getPlayer(participant);
    if (p1.coins < bet) { await sock.sendMessage(sender, { text: `❌ Coin kamu kurang! Punya: ${formatCoins(p1.coins)}` }, { quoted: msg }); return; }
    const opp = mentioned[0];
    if (opp === participant) { await sock.sendMessage(sender, { text: '❌ Ga bisa judi sama diri sendiri lur!' }, { quoted: msg }); return; }
    if (activeGambles[sender]) { await sock.sendMessage(sender, { text: '⚠️ Masih ada judi duel aktif!' }, { quoted: msg }); return; }
    const startTs = Date.now();
    activeGambles[sender] = { type: 'dicewar', challenger: participant, opponent: opp, bet, timestamp: startTs };
    setTimeout(() => { if (activeGambles[sender]?.timestamp === startTs) { delete activeGambles[sender]; sock.sendMessage(sender, { text: '⏰ Judi duel expired!' }); } }, 90000);
    const n1 = getDisplayName(participant);
    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🎲 JUDI DUEL — DICE WAR* 〕━━━\n┃\n┃ 🎭 *${n1}* menantang\n┃ 🎯 @${opp.split('@')[0]}\n┃\n┃ 💰 Taruhan: *${formatCoins(bet)}* masing-masing\n┃ 🎲 Masing-masing lempar 3 dadu\n┃ 🏆 Total tertinggi menang: *${formatCoins(bet * 2)}*\n┃\n┃ ⏰ 90 detik\n╰ @${opp.split('@')[0]} ketik *.acc*`,
        mentions: [opp]
    }, { quoted: msg });
}

// ============================================================
// JUDI DUEL — SLOT RACE PVP
// ============================================================
async function handleJudiSlot(sock, sender, msg, participant, textMessage) {
    if (!sender.includes('@g.us')) { await sock.sendMessage(sender, { text: '❌ Judi duel hanya bisa di grup!' }, { quoted: msg }); return; }
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) {
        await sock.sendMessage(sender, { text: '📌 *JUDI DUEL — SLOT RACE*\n\nTag lawan + bet:\n*.judislot @orang 500*\n\n🎰 Kalian berdua spin slot!\n🏆 Multiplier tertinggi menang!\n💡 Min bet: ' + formatCoins(50) }, { quoted: msg });
        return;
    }
    const bet = parseInt(textMessage.replace(/@\S+/g, '').trim());
    if (isNaN(bet) || bet < 50) { await sock.sendMessage(sender, { text: `❌ Min bet: *${formatCoins(50)}*!` }, { quoted: msg }); return; }
    const p1 = getPlayer(participant);
    if (p1.coins < bet) { await sock.sendMessage(sender, { text: `❌ Coin kamu kurang! Punya: ${formatCoins(p1.coins)}` }, { quoted: msg }); return; }
    const opp = mentioned[0];
    if (opp === participant) { await sock.sendMessage(sender, { text: '❌ Ga bisa judi sama diri sendiri lur!' }, { quoted: msg }); return; }
    if (activeGambles[sender]) { await sock.sendMessage(sender, { text: '⚠️ Masih ada judi duel aktif!' }, { quoted: msg }); return; }
    const startTs = Date.now();
    activeGambles[sender] = { type: 'slotrace', challenger: participant, opponent: opp, bet, timestamp: startTs };
    setTimeout(() => { if (activeGambles[sender]?.timestamp === startTs) { delete activeGambles[sender]; sock.sendMessage(sender, { text: '⏰ Judi duel expired!' }); } }, 90000);
    const n1 = getDisplayName(participant);
    await sock.sendMessage(sender, {
        text: `╭━━━〔 *🎰 JUDI DUEL — SLOT RACE* 〕━━━\n┃\n┃ 🎭 *${n1}* menantang\n┃ 🎯 @${opp.split('@')[0]}\n┃\n┃ 💰 Taruhan: *${formatCoins(bet)}* masing-masing\n┃ 🎰 Dua-duanya spin slot\n┃ 🏆 Multiplier tertinggi menang: *${formatCoins(bet * 2)}*\n┃\n┃ ⏰ 90 detik\n╰ @${opp.split('@')[0]} ketik *.acc*`,
        mentions: [opp]
    }, { quoted: msg });
}

// ============================================================
// JUDI TERIMA (Accept gambling duel)
// ============================================================
async function handleJudiTerima(sock, sender, msg, participant, textMessage) {
    const gamble = activeGambles[sender];
    if (!gamble) { await sock.sendMessage(sender, { text: '❌ Tidak ada judi duel aktif di grup ini!' }, { quoted: msg }); return; }
    if (participant !== gamble.opponent) { await sock.sendMessage(sender, { text: '❌ Tantangan judi ini bukan untuk kamu!' }, { quoted: msg }); return; }

    const p2 = getPlayer(participant);
    if (p2.coins < gamble.bet) { await sock.sendMessage(sender, { text: `❌ Coin kamu kurang! Butuh: ${formatCoins(gamble.bet)}` }, { quoted: msg }); delete activeGambles[sender]; return; }

    const p1 = getPlayer(gamble.challenger);
    if (p1.coins < gamble.bet) { await sock.sendMessage(sender, { text: `❌ Coin penantang sudah kurang! Duel dibatalkan.` }, { quoted: msg }); delete activeGambles[sender]; return; }

    const n1 = getDisplayName(gamble.challenger);
    const n2 = getDisplayName(participant);
    const bet = gamble.bet;

    // Potong coin dua-duanya dan simpan
    p1.coins -= bet;
    p2.coins -= bet;
    updatePlayer(gamble.challenger, p1);
    updatePlayer(participant, p2);

    if (gamble.type === 'coinflip') {
        // ---- COINFLIP PVP ----
        await sock.sendMessage(sender, { text: `🪙 *JUDI DUEL DITERIMA!*\n\n${n1} 🆚 ${n2}\n💰 Pot: *${formatCoins(bet * 2)}*\n\n🪙 _Melempar koin..._` }, { quoted: msg });
        await delay(2000);

        const winnerIs = Math.random() < 0.5 ? 'p1' : 'p2';
        const winnerId = winnerIs === 'p1' ? gamble.challenger : participant;
        const loserId = winnerIs === 'p1' ? participant : gamble.challenger;
        const wName = winnerIs === 'p1' ? n1 : n2;
        const lName = winnerIs === 'p1' ? n2 : n1;
        const wP = winnerId === gamble.challenger ? p1 : p2;
        const lP = loserId === gamble.challenger ? p1 : p2;

        wP.coins += bet * 2;
        if (!wP.kasinoStats) wP.kasinoStats = {};
        wP.kasinoStats.gambleDuelWins = (wP.kasinoStats.gambleDuelWins || 0) + 1;
        wP.kasinoStats.totalWon = (wP.kasinoStats.totalWon || 0) + bet * 2;
        wP.kasinoStats.totalWagered = (wP.kasinoStats.totalWagered || 0) + bet;
        if (!lP.kasinoStats) lP.kasinoStats = {};
        lP.kasinoStats.gambleDuelLosses = (lP.kasinoStats.gambleDuelLosses || 0) + 1;
        lP.kasinoStats.totalWagered = (lP.kasinoStats.totalWagered || 0) + bet;

        updatePlayer(winnerId, wP);
        updatePlayer(loserId, lP);

        const side = Math.random() < 0.5 ? '🔴 GANJIL' : '🔵 GENAP';
        await sock.sendMessage(sender, {
            text: `╭━━━〔 *🪙 COINFLIP RESULT* 〕━━━\n┃\n┃ 🪙 Koin mendarat: *${side}*\n┃\n┃ 🏆 *${wName}* MENANG!\n┃ 💀 *${lName}* kalah\n┃\n┃ 💰 *${wName}* +${formatCoins(bet)} (${formatCoins(wP.coins)})\n┃ 💸 *${lName}* -${formatCoins(bet)} (${formatCoins(lP.coins)})\n╰━━━━━━━━━━━━━━━━━━━`,
            mentions: [gamble.challenger, participant]
        }, { quoted: msg });

    } else if (gamble.type === 'dicewar') {
        // ---- DICE WAR PVP ----
        await sock.sendMessage(sender, { text: `🎲 *DICE WAR DIMULAI!*\n\n${n1} 🆚 ${n2}\n💰 Pot: *${formatCoins(bet * 2)}*\n\n🎲 _Melempar 3 dadu..._` }, { quoted: msg });
        await delay(1500);

        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const d1 = [1,2,3].map(() => Math.floor(Math.random() * 6) + 1);
        const d2 = [1,2,3].map(() => Math.floor(Math.random() * 6) + 1);
        const t1 = d1.reduce((a, b) => a + b, 0);
        const t2 = d2.reduce((a, b) => a + b, 0);

        const d1e = d1.map(d => diceEmojis[d - 1]).join(' ');
        const d2e = d2.map(d => diceEmojis[d - 1]).join(' ');

        await sock.sendMessage(sender, {
            text: `🎲 *${n1}* melempar...\n${d1e} = *${t1}*\n\n🎲 *${n2}* melempar...\n${d2e} = *${t2}*`
        });
        await delay(2000);

        let winnerId, loserId, wName, lName, isDraw = false;
        if (t1 > t2) { winnerId = gamble.challenger; loserId = participant; wName = n1; lName = n2; }
        else if (t2 > t1) { winnerId = participant; loserId = gamble.challenger; wName = n2; lName = n1; }
        else { isDraw = true; }

        if (isDraw) {
            // Seri — kembalikan coin
            p1.coins += bet;
            p2.coins += bet;
            updatePlayer(gamble.challenger, p1);
            updatePlayer(participant, p2);
            await sock.sendMessage(sender, {
                text: `╭━━━〔 *🎲 DICE WAR — SERI!* 〕━━━\n┃\n┃ 🤝 *SERI! ${t1} vs ${t2}*\n┃ 💰 Coin dikembalikan\n┃\n┃ 🪙 ${n1}: ${formatCoins(p1.coins)}\n┃ 🪙 ${n2}: ${formatCoins(p2.coins)}\n╰━━━━━━━━━━━━━━━━━━━`
            });
        } else {
            const wP = winnerId === gamble.challenger ? p1 : p2;
            const lP = loserId === gamble.challenger ? p1 : p2;
            wP.coins += bet * 2;
            if (!wP.kasinoStats) wP.kasinoStats = {};
            wP.kasinoStats.gambleDuelWins = (wP.kasinoStats.gambleDuelWins || 0) + 1;
            wP.kasinoStats.totalWon = (wP.kasinoStats.totalWon || 0) + bet * 2;
            wP.kasinoStats.totalWagered = (wP.kasinoStats.totalWagered || 0) + bet;
            if (!lP.kasinoStats) lP.kasinoStats = {};
            lP.kasinoStats.gambleDuelLosses = (lP.kasinoStats.gambleDuelLosses || 0) + 1;
            lP.kasinoStats.totalWagered = (lP.kasinoStats.totalWagered || 0) + bet;
            updatePlayer(winnerId, wP);
            updatePlayer(loserId, lP);
            await sock.sendMessage(sender, {
                text: `╭━━━〔 *🎲 DICE WAR — ${wName.toUpperCase()} MENANG!* 〕━━━\n┃\n┃ 🏆 *${wName}* (${winnerId === gamble.challenger ? t1 : t2}) vs 💀 *${lName}* (${loserId === gamble.challenger ? t1 : t2})\n┃\n┃ 💰 *${wName}* +${formatCoins(bet)} (${formatCoins(wP.coins)})\n┃ 💸 *${lName}* -${formatCoins(bet)} (${formatCoins(lP.coins)})\n╰━━━━━━━━━━━━━━━━━━━`,
                mentions: [gamble.challenger, participant]
            });
        }

    } else if (gamble.type === 'slotrace') {
        // ---- SLOT RACE PVP ----
        await sock.sendMessage(sender, { text: `🎰 *SLOT RACE DIMULAI!*\n\n${n1} 🆚 ${n2}\n💰 Pot: *${formatCoins(bet * 2)}*\n\n🎰 _Spinning..._` }, { quoted: msg });
        await delay(1500);

        const s1 = spinSlot();
        const s2 = spinSlot();
        const r1 = getSlotResult(s1);
        const r2 = getSlotResult(s2);

        await sock.sendMessage(sender, {
            text: `🎰 *${n1}*:\n[ ${s1[0]} | ${s1[1]} | ${s1[2]} ] — *${r1.label}* (${r1.multiplier}x)\n\n🎰 *${n2}*:\n[ ${s2[0]} | ${s2[1]} | ${s2[2]} ] — *${r2.label}* (${r2.multiplier}x)`
        });
        await delay(2000);

        let winnerId, loserId, wName, lName, isDraw = false;
        if (r1.multiplier > r2.multiplier) { winnerId = gamble.challenger; loserId = participant; wName = n1; lName = n2; }
        else if (r2.multiplier > r1.multiplier) { winnerId = participant; loserId = gamble.challenger; wName = n2; lName = n1; }
        else { isDraw = true; }

        if (isDraw) {
            p1.coins += bet;
            p2.coins += bet;
            updatePlayer(gamble.challenger, p1);
            updatePlayer(participant, p2);
            await sock.sendMessage(sender, {
                text: `╭━━━〔 *🎰 SLOT RACE — SERI!* 〕━━━\n┃\n┃ 🤝 *SERI! ${r1.multiplier}x vs ${r2.multiplier}x*\n┃ 💰 Coin dikembalikan\n╰━━━━━━━━━━━━━━━━━━━`
            });
        } else {
            const wP = winnerId === gamble.challenger ? p1 : p2;
            const lP = loserId === gamble.challenger ? p1 : p2;
            wP.coins += bet * 2;
            if (!wP.kasinoStats) wP.kasinoStats = {};
            wP.kasinoStats.gambleDuelWins = (wP.kasinoStats.gambleDuelWins || 0) + 1;
            wP.kasinoStats.totalWon = (wP.kasinoStats.totalWon || 0) + bet * 2;
            wP.kasinoStats.totalWagered = (wP.kasinoStats.totalWagered || 0) + bet;
            if (!lP.kasinoStats) lP.kasinoStats = {};
            lP.kasinoStats.gambleDuelLosses = (lP.kasinoStats.gambleDuelLosses || 0) + 1;
            lP.kasinoStats.totalWagered = (lP.kasinoStats.totalWagered || 0) + bet;
            updatePlayer(winnerId, wP);
            updatePlayer(loserId, lP);
            await sock.sendMessage(sender, {
                text: `╭━━━〔 *🎰 SLOT RACE — ${wName.toUpperCase()} MENANG!* 〕━━━\n┃\n┃ 🏆 *${wName}* (${winnerId === gamble.challenger ? r1.multiplier : r2.multiplier}x)\n┃ 💀 *${lName}* (${loserId === gamble.challenger ? r1.multiplier : r2.multiplier}x)\n┃\n┃ 💰 *${wName}* +${formatCoins(bet)} (${formatCoins(wP.coins)})\n┃ 💸 *${lName}* -${formatCoins(bet)} (${formatCoins(lP.coins)})\n╰━━━━━━━━━━━━━━━━━━━`,
                mentions: [gamble.challenger, participant]
            });
        }
    }

    delete activeGambles[sender];
}

module.exports = { handleSlot, handleCoinflip, handleDice, handleTebak, handleKasino, handleJudiDuel, handleJudiWar, handleJudiSlot, handleJudiTerima };
