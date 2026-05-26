// ============================================================
// config/index.js — Central config re-export
// ============================================================

const bot = require('./bot');
const rpg = require('./rpg');
const dungeon = require('./dungeon');
const game = require('./game');

module.exports = {
    ...bot,
    ...rpg,
    ...dungeon,
    ...game
};
