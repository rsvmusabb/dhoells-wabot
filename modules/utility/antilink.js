/**
 * @file antilink.js
 * @description Pure helpers for the group anti-link protection.
 *              Kept free of Baileys/socket access so the link decision
 *              can be unit tested without a live WhatsApp connection.
 */

// Matches http(s)://... and www.... links. No /g flag on purpose:
// a global regex keeps .lastIndex state between .test() calls.
const LINK_PATTERN = /(https?:\/\/|www\.)\S+/i;

/**
 * Returns true when the text contains a link.
 * @param {string} text
 */
function containsLink(text) {
    if (typeof text !== 'string' || !text) return false;
    return LINK_PATTERN.test(text);
}

/**
 * Pure link decision: should this message be deleted + warned?
 * Commands are never blocked here, they keep flowing to the router.
 * @param {object} opts
 * @param {boolean} opts.isGroup - message is from a group (@g.us)
 * @param {boolean} opts.isOwner - sender is the bot owner
 * @param {boolean} opts.isBotAdmin - sender is a bot admin
 * @param {boolean} opts.isGroupAdmin - sender is an admin of this group
 * @param {string} opts.text - message text
 * @param {boolean} opts.isCommand - message starts with the command prefix
 */
function shouldBlockLink({ isGroup, isOwner, isBotAdmin, isGroupAdmin, text, isCommand }) {
    if (!isGroup || isOwner || isBotAdmin || isGroupAdmin || isCommand) return false;
    return containsLink(text);
}

module.exports = { LINK_PATTERN, containsLink, shouldBlockLink };
