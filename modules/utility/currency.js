// ============================================================
// modules/utility/currency.js — Currency System
// 1 Gold = 100 Silver = 5,000 Bronze
// 1 Silver = 50 Bronze, 1 Gold = 100 Silver
// ============================================================

const { COIN_UNITS, COIN_EMOJI } = require('../../config');
const { getPlayer, updatePlayer, normalizePlayerCurrency } = require('./db');

function formatCoins(amount) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    if (remaining <= 0) return '0 🥉 Bronze';
    const parts = [];
    for (const unit of COIN_UNITS) {
        const count = Math.floor(remaining / unit.value);
        if (count > 0) {
            parts.push(COIN_EMOJI[unit.name] + ' ' + count + ' ' + unit.name);
            remaining -= count * unit.value;
        }
    }
    return parts.join(' ');
}

function parseCoins(amountStr) {
    const num = parseInt(amountStr, 10);
    return isNaN(num) ? 0 : num;
}

function getCoins(playerId) {
    const player = getPlayer(playerId);
    normalizePlayerCurrency(player);
    return player.coins;
}

function addCoins(playerId, amount) {
    const player = getPlayer(playerId);
    normalizePlayerCurrency(player);
    player.coins = Math.max(0, Math.floor(player.coins + (Number(amount) || 0)));
    updatePlayer(playerId, player);
    return player.coins;
}

function spendCoins(playerId, amount) {
    const player = getPlayer(playerId);
    normalizePlayerCurrency(player);
    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    if (player.coins < cost) return false;
    player.coins -= cost;
    updatePlayer(playerId, player);
    return true;
}

function getSellPrice(itemId) {
    const { RPG_WEAPONS, RPG_ARMORS, RPG_SHIELDS, RPG_ITEMS } = require('../../config');
    if (RPG_WEAPONS[itemId]) return Math.max(1, Math.floor(RPG_WEAPONS[itemId].price * 0.4));
    if (RPG_ARMORS[itemId]) return Math.max(1, Math.floor(RPG_ARMORS[itemId].price * 0.4));
    if (RPG_SHIELDS[itemId]) return Math.max(1, Math.floor(RPG_SHIELDS[itemId].price * 0.4));
    if (RPG_ITEMS[itemId]) return Math.max(1, Math.floor(RPG_ITEMS[itemId].price * 0.4));
    return 0;
}

module.exports = { formatCoins, parseCoins, getCoins, addCoins, spendCoins, getSellPrice };
