// ============================================================
// modules/ai/engine.js — AI Engine (Gemini + Pollinations fallback)
// ============================================================

const axios = require('axios');
const { BOT_CONFIG } = require('../../config');

async function callAI(prompt) {
    let result = null;
    if (BOT_CONFIG.GEMINI_API_KEY) {
        for (const model of ['gemini-2.0-flash-lite', 'gemini-2.0-flash']) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${BOT_CONFIG.GEMINI_API_KEY}`;
                const { data } = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 4096 } }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
                result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (result) return result.trim();
            } catch (e) { console.log(`Gemini ${model} gagal: ${e.response?.status || e.message}`); }
        }
    }
    if (!result) {
        try {
            const { data } = await axios.post('https://text.pollinations.ai/', { messages: [{ role: 'user', content: prompt }], model: 'openai', seed: Math.floor(Math.random() * 100000) }, { headers: { 'Content-Type': 'application/json' }, timeout: 45000 });
            const r = typeof data === 'string' ? data : data?.choices?.[0]?.message?.content;
            if (r?.trim()) return r.trim();
        } catch (e) { }
    }
    if (!result) {
        try {
            const { data } = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now()}`, { timeout: 45000 });
            if (data && typeof data === 'string' && data.trim()) return data.trim();
        } catch (e) { }
    }
    return null;
}

module.exports = { callAI };
