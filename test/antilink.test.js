// Unit test: keputusan anti-link murni, tanpa socket WhatsApp.
// Dijalankan di direktori kerja sementara, mengikuti pola test/ yang lain.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'wabot-test-')));

const test = require('node:test');
const assert = require('node:assert/strict');
const { containsLink, shouldBlockLink } = require('../modules/utility/antilink');

test('containsLink mengenali http, https, dan www', () => {
    assert.equal(containsLink('cek https://example.com ini'), true);
    assert.equal(containsLink('kunjungi www.example.com ya'), true);
    assert.equal(containsLink('http://x.co/a?b=1'), true);
    assert.equal(containsLink('halo semua, apa kabar'), false);
    assert.equal(containsLink(''), false);
    assert.equal(containsLink(null), false);
    assert.equal(containsLink(undefined), false);
});

test('containsLink tidak menyimpan state antar panggilan', () => {
    assert.equal(containsLink('https://a.com'), true);
    assert.equal(containsLink('halo'), false);
    assert.equal(containsLink('https://b.com'), true);
});

test('shouldBlockLink memblokir link biasa di grup', () => {
    assert.equal(shouldBlockLink({
        isGroup: true, isOwner: false, isBotAdmin: false,
        isGroupAdmin: false, text: 'cek https://example.com', isCommand: false,
    }), true);
});

test('shouldBlockLink mengizinkan owner, bot admin, dan group admin', () => {
    const base = {
        isGroup: true, isOwner: false, isBotAdmin: false,
        isGroupAdmin: false, text: 'https://example.com', isCommand: false,
    };
    assert.equal(shouldBlockLink({ ...base, isOwner: true }), false);
    assert.equal(shouldBlockLink({ ...base, isBotAdmin: true }), false);
    assert.equal(shouldBlockLink({ ...base, isGroupAdmin: true }), false);
});

test('shouldBlockLink tidak memblokir command dan chat non-link', () => {
    const base = {
        isGroup: true, isOwner: false, isBotAdmin: false, isGroupAdmin: false,
    };
    assert.equal(shouldBlockLink({ ...base, text: '.menu https://example.com', isCommand: true }), false);
    assert.equal(shouldBlockLink({ ...base, text: 'halo semua', isCommand: false }), false);
    assert.equal(shouldBlockLink({ ...base, isGroup: false, text: 'https://example.com', isCommand: false }), false);
});

test('pesan "." saja tidak crash dan tidak diblokir', () => {
    assert.equal(containsLink('.'), false);
    assert.equal(shouldBlockLink({
        isGroup: true, isOwner: false, isBotAdmin: false,
        isGroupAdmin: false, text: '.', isCommand: true,
    }), false);
});
