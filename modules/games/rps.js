// ============================================================
// modules/games/rps.js — Rock Paper Scissors
// Reward: menang +30 Bronze, kalah -10 Bronze, seri 0
// ============================================================

const RPS_CHOICES = ['batu', 'gunting', 'kertas'];
const RPS_EMOJI = { batu: '🪨', gunting: '✂️', kertas: '📄' };

// Win/lose rewards in Bronze
const RPS_REWARD_WIN = 30;
const RPS_REWARD_LOSE = -10;
const RPS_REWARD_DRAW = 0;

function playRPS(playerChoice) {
    const botChoice = RPS_CHOICES[Math.floor(Math.random() * 3)];
    let result, coinChange;
    if (playerChoice === botChoice) {
        result = 'seri'; coinChange = RPS_REWARD_DRAW;
    } else if (
        (playerChoice === 'batu' && botChoice === 'gunting') ||
        (playerChoice === 'gunting' && botChoice === 'kertas') ||
        (playerChoice === 'kertas' && botChoice === 'batu')
    ) {
        result = 'menang'; coinChange = RPS_REWARD_WIN;
    } else {
        result = 'kalah'; coinChange = RPS_REWARD_LOSE;
    }
    return { botChoice, result, coinChange };
}

module.exports = { RPS_CHOICES, RPS_EMOJI, playRPS, RPS_REWARD_WIN, RPS_REWARD_LOSE, RPS_REWARD_DRAW };
