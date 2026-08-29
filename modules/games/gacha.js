// ============================================================
// modules/games/gacha.js — Gacha System
// ============================================================

const { GACHA_PRICES } = require('../../config');
const { getPlayer, updatePlayer } = require('../utility/db');
const { formatCoins, addCoins, spendCoins } = require('../utility/currency');

// Gacha pool definition
const GACHA_POOL = {
    star1: { stars: 1, emoji: '⭐', label: '1 Star', chance: 35, color: '#78909C', price: 300, sellPrice: 10, chars: [
        { name: 'Sakura Haruno', anime: 'Naruto', desc: 'Ninja medis Konoha', pin: 'Sakura Haruno anime' },
        { name: 'Chopper', anime: 'One Piece', desc: 'Dokter bajak laut rusa', pin: 'Tony Tony Chopper anime' },
        { name: 'Usopp', anime: 'One Piece', desc: 'Penembak jitu Straw Hat', pin: 'Usopp anime' },
        { name: 'Krillin', anime: 'Dragon Ball', desc: 'Petarung bumi terkuat', pin: 'Krillin Dragon Ball anime' },
        { name: 'Mineta', anime: 'My Hero Academia', desc: 'Hero dengan pop-off', pin: 'Mineta MHA anime' },
        { name: 'Konohamaru', anime: 'Naruto', desc: 'Cucu Hokage ke-3', pin: 'Konohamaru anime' },
        { name: 'Happy', anime: 'Fairy Tail', desc: 'Kucing terbang biru', pin: 'Happy Fairy Tail anime' },
        { name: 'Yamcha', anime: 'Dragon Ball', desc: 'Petarung padang pasir', pin: 'Yamcha Dragon Ball anime' },
        { name: 'Magna Swing', anime: 'Black Clover', desc: 'Ksatria sihir api', pin: 'Magna Swing Black Clover anime' },
        { name: 'Charmy', anime: 'Black Clover', desc: 'Penyihir makanan', pin: 'Charmy Black Clover anime' }
    ]},
    star2: { stars: 2, emoji: '⭐⭐', label: '2 Star', chance: 25, color: '#66BB6A', price: 500, sellPrice: 20, chars: [
        { name: 'Hinata Hyuga', anime: 'Naruto', desc: 'Putri klan Hyuga, Byakugan', pin: 'Hinata Hyuga anime' },
        { name: 'Sanji', anime: 'One Piece', desc: 'Koki kaki hitam', pin: 'Sanji One Piece anime' },
        { name: 'Zenitsu Agatsuma', anime: 'Demon Slayer', desc: 'Thunder Breathing penakut', pin: 'Zenitsu Agatsuma anime' },
        { name: 'Gaara', anime: 'Naruto', desc: 'Kazekage pasir', pin: 'Gaara anime' },
        { name: 'Piccolo', anime: 'Dragon Ball', desc: 'Namekian pelindung bumi', pin: 'Piccolo Dragon Ball anime' },
        { name: 'Denki Kaminari', anime: 'My Hero Academia', desc: 'Hero listrik', pin: 'Kaminari MHA anime' },
        { name: 'Noelle Silva', anime: 'Black Clover', desc: 'Putri bangsawan, Water Magic', pin: 'Noelle Silva Black Clover anime' },
        { name: 'Gray Fullbuster', anime: 'Fairy Tail', desc: 'Penyihir es', pin: 'Gray Fullbuster anime' },
        { name: 'Aqua', anime: 'KonoSuba', desc: 'Dewi air tidak berguna', pin: 'Aqua KonoSuba anime' },
        { name: 'Gohan (Kid)', anime: 'Dragon Ball', desc: 'Anak Goku berpotensi', pin: 'Kid Gohan Dragon Ball anime' }
    ]},
    star3: { stars: 3, emoji: '⭐⭐⭐', label: '3 Star', chance: 20, color: '#42A5F5', price: 800, sellPrice: 40, chars: [
        { name: 'Sasuke Uchiha', anime: 'Naruto', desc: 'Sharingan, avenger Uchiha', pin: 'Sasuke Uchiha anime' },
        { name: 'Roronoa Zoro', anime: 'One Piece', desc: 'Pendekar tiga pedang', pin: 'Roronoa Zoro anime' },
        { name: 'Vegeta', anime: 'Dragon Ball', desc: 'Pangeran Saiyan', pin: 'Vegeta Dragon Ball anime' },
        { name: 'Todoroki Shoto', anime: 'My Hero Academia', desc: 'Half-cold half-hot', pin: 'Todoroki Shoto anime' },
        { name: 'Killua Zoldyck', anime: 'HunterxHunter', desc: 'Assassin listrik jenius', pin: 'Killua Zoldyck anime' },
        { name: 'Mikasa Ackerman', anime: 'Attack on Titan', desc: 'Prajurit terkuat', pin: 'Mikasa Ackerman anime' },
        { name: 'Levi Ackerman', anime: 'Attack on Titan', desc: 'Kapten terkuat umat manusia', pin: 'Levi Ackerman anime' },
        { name: 'Erza Scarlet', anime: 'Fairy Tail', desc: 'Titania, requip mage', pin: 'Erza Scarlet anime' },
        { name: 'Luck Voltia', anime: 'Black Clover', desc: 'Battle maniac, Lightning Magic', pin: 'Luck Voltia Black Clover anime' },
        { name: 'Inosuke Hashibira', anime: 'Demon Slayer', desc: 'Beast Breathing liar', pin: 'Inosuke Hashibira anime' }
    ]},
    star4: { stars: 4, emoji: '⭐⭐⭐⭐', label: '4 Star', chance: 12, color: '#AB47BC', price: 1200, sellPrice: 60, chars: [
        { name: 'Naruto Uzumaki', anime: 'Naruto', desc: 'Jinchuriki Kyuubi, Hokage ke-7', pin: 'Naruto Uzumaki anime' },
        { name: 'Monkey D. Luffy', anime: 'One Piece', desc: 'Gear 5, Raja Bajak Laut', pin: 'Monkey D Luffy Gear 5 anime' },
        { name: 'Tanjiro Kamado', anime: 'Demon Slayer', desc: 'Sun Breathing, pemburu iblis', pin: 'Tanjiro Kamado anime' },
        { name: 'Goku', anime: 'Dragon Ball', desc: 'Saiyan terkuat, Ultra Instinct', pin: 'Goku Ultra Instinct anime' },
        { name: 'Izuku Midoriya', anime: 'My Hero Academia', desc: 'One For All, Symbol of Peace', pin: 'Deku Midoriya anime' },
        { name: 'Asta', anime: 'Black Clover', desc: 'Anti-Magic, Wizard King candidate', pin: 'Asta Black Clover demon anime' },
        { name: 'Natsu Dragneel', anime: 'Fairy Tail', desc: 'Dragon Slayer api', pin: 'Natsu Dragneel anime' },
        { name: 'Ichigo Kurosaki', anime: 'Bleach', desc: 'Shinigami pengganti', pin: 'Ichigo Kurosaki Bankai anime' },
        { name: 'Kakashi Hatake', anime: 'Naruto', desc: 'Copy Ninja, Sharingan', pin: 'Kakashi Hatake anime' },
        { name: 'Yami Sukehiro', anime: 'Black Clover', desc: 'Dark Magic, kapten Black Bulls', pin: 'Yami Sukehiro Black Clover anime' }
    ]},
    star5: { stars: 5, emoji: '⭐⭐⭐⭐⭐', label: '5 Star', chance: 6, color: '#FFA726', price: 2000, sellPrice: 100, chars: [
        { name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', desc: 'Infinity + Six Eyes, terkuat', pin: 'Gojo Satoru anime' },
        { name: 'Madara Uchiha', anime: 'Naruto', desc: 'Eternal Mangekyou, Susanoo perfect', pin: 'Madara Uchiha anime' },
        { name: 'Itachi Uchiha', anime: 'Naruto', desc: 'Tsukuyomi, genius Uchiha', pin: 'Itachi Uchiha anime' },
        { name: 'Escanor', anime: 'Seven Deadly Sins', desc: 'Sin of Pride, The One', pin: 'Escanor Seven Deadly Sins anime' },
        { name: 'Whitebeard', anime: 'One Piece', desc: 'Gura-Gura no Mi, orang terkuat', pin: 'Whitebeard One Piece anime' },
        { name: 'Pain Nagato', anime: 'Naruto', desc: 'Rinnegan, Six Paths', pin: 'Pain Nagato anime' },
        { name: 'Sukuna', anime: 'Jujutsu Kaisen', desc: 'Raja kutukan, Malevolent Shrine', pin: 'Sukuna Jujutsu Kaisen anime' },
        { name: 'Julius Novachrono', anime: 'Black Clover', desc: 'Wizard King, Time Magic', pin: 'Julius Novachrono Black Clover anime' }
    ]},
    star6: { stars: 6, emoji: '⭐⭐⭐⭐⭐⭐', label: '6 Star', chance: 1.7, color: '#EF5350', price: 3500, sellPrice: 180, chars: [
        { name: 'Saitama', anime: 'One Punch Man', desc: 'Satu pukulan. Selesai.', pin: 'Saitama One Punch Man anime' },
        { name: 'Rimuru Tempest', anime: 'Tensura', desc: 'Slime Demon Lord, Predator', pin: 'Rimuru Tempest anime' },
        { name: 'Ainz Ooal Gown', anime: 'Overlord', desc: 'Supreme Being of Nazarick', pin: 'Ainz Ooal Gown anime' },
        { name: 'Aizen Sosuke', anime: 'Bleach', desc: 'Hogyoku, absolute hypnosis', pin: 'Aizen Sosuke Bleach anime' },
        { name: 'Meruem', anime: 'HunterxHunter', desc: 'Chimera Ant King, terkuat', pin: 'Meruem HunterxHunter anime' },
        { name: 'Lucius Zogratis', anime: 'Black Clover', desc: 'Soul Magic, final villain', pin: 'Lucius Zogratis Black Clover anime' }
    ]},
    star7: { stars: 7, emoji: '⭐⭐⭐⭐⭐⭐⭐', label: '7 Star', chance: 0.3, color: '#FFD700', price: 5000, sellPrice: 300, chars: [
        { name: 'Anos Voldigoad', anime: 'Maou Gakuin', desc: 'Demon King of Tyranny, tak terkalahkan', pin: 'Anos Voldigoad anime' },
        { name: 'Zeno', anime: 'Dragon Ball Super', desc: 'Omni-King, penghapus alam semesta', pin: 'Zeno Dragon Ball Super anime' },
        { name: 'Giorno Giovanna', anime: 'JoJo', desc: 'Gold Experience Requiem, infinite loop', pin: 'Giorno Giovanna anime' },
        { name: 'Anti-Spiral', anime: 'Gurren Lagann', desc: 'Penguasa anti-evolusi', pin: 'Anti-Spiral Gurren Lagann anime' }
    ]}
};

function rollGacha() {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [key, tier] of Object.entries(GACHA_POOL)) {
        cumulative += tier.chance;
        if (roll <= cumulative) {
            const charData = tier.chars[Math.floor(Math.random() * tier.chars.length)];
            return { rarity: key, stars: tier.stars, label: tier.label, emoji: tier.emoji, color: tier.color, sellPrice: tier.sellPrice, ...charData };
        }
    }
    const t = GACHA_POOL.star1;
    const c = t.chars[0];
    return { rarity: 'star1', stars: 1, label: t.label, emoji: t.emoji, color: t.color, sellPrice: t.sellPrice, ...c };
}

function buildCollectionCaption(koleksi) {
    const { FRAME } = require('../../config');
    const grouped = {};
    for (const char of koleksi) {
        const key = char.rarity || 'star1';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(char);
    }
    let kolText = `${FRAME.tl}${FRAME.h.repeat(3)}〔 *📦 KOLEKSI* 〕${FRAME.h.repeat(3)}\n${FRAME.v}\n${FRAME.v} Total: *${koleksi.length}* karakter\n${FRAME.v}\n`;
    const order = ['star7', 'star6', 'star5', 'star4', 'star3', 'star2', 'star1'];
    for (const r of order) {
        if (grouped[r]) {
            const tier = GACHA_POOL[r];
            kolText += `${FRAME.branch}${FRAME.h.repeat(2)} *${tier?.emoji || '⭐'} ${tier?.label || r}* (${grouped[r].length}) ${FRAME.h.repeat(2)}\n`;
            for (const c of grouped[r]) {
                kolText += `${FRAME.v}  ▸ ${c.name} _[${c.anime || '-'}]_ 💰${c.sellPrice || 1}\n`;
            }
            kolText += `${FRAME.v}\n`;
        }
    }
    kolText += `${FRAME.bl}${FRAME.h.repeat(19)}\n💡 Jual: *.sellchar <nama>*`;
    return kolText.trim();
}

function getGachaMenuText(playerCoins) {
    return `╭━━━━━━━━━━━━━━━━━━━━━╮
┃   🎰 *G A C H A   A N I M E*   🎰
╰━━━━━━━━━━━━━━━━━━━━━╯

┌─────── *🎲 Drop Rate* ───────
│ ⭐ 1 Star — 35% (Sell: 10 Bronze)
│ ⭐⭐ 2 Star — 25% (Sell: 20 Bronze)
│ ⭐⭐⭐ 3 Star — 20% (Sell: 40 Bronze)
│ ⭐⭐⭐⭐ 4 Star — 12% (Sell: 60 Bronze)
│ ⭐⭐⭐⭐⭐ 5 Star — 6% (Sell: 100 Bronze)
│ ⭐⭐⭐⭐⭐⭐ 6 Star — 1.7% (Sell: 180 Bronze)
│ ⭐⭐⭐⭐⭐⭐⭐ 7 Star — 0.3% (Sell: 300 Bronze)
└───────────────────────

┌─────── *💰 Harga* ───────
│ 🎰 *.gacha 1* — Single Pull (10 Silver)
│ 🎰 *.gacha 5* — Multi Pull 5x (40 Silver, hemat!)
│    _(hemat 10 Silver dari 5x single!)_
└───────────────────────

┌─────── *📦 Info* ───────
│ 🪙 Saldo Coin: *${formatCoins(playerCoins)}*
│ ♻️ Duplikat = auto refund 50% sell price
└───────────────────────`;
}

module.exports = { GACHA_POOL, rollGacha, buildCollectionCaption, getGachaMenuText, GACHA_PRICES };
