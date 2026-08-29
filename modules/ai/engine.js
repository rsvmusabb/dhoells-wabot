/**
 * @file engine.js
 * @description Core AI processing engine featuring Multi-Key Rotation and Fallback strategies.
 *              Integrates Google Gemini (Primary) and Pollinations (Fallback) endpoints.
 * @author OWL ABE
 * @version 3.0.0
 * @license MIT
 */

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const axios = require('axios');
const { BOT_CONFIG } = require('../../config');

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// CORE AI LOGIC
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Sends a prompt to the configured AI models using a multi-key rotation and multi-model fallback approach.
 * 
 * Strategy:
 * 1. Iterates through available Gemini API keys.
 * 2. Attempts inference with `gemini-2.5-flash-lite`, falls back to `gemini-2.5-flash`.
 * 3. If all Gemini endpoints fail (e.g., rate limits or quotas), degrades gracefully to Pollinations.ai.
 * 
 * @param {string} prompt - The crafted prompt text to be processed by the LLM.
 * @returns {Promise<string|null>} Resolves to the AI response string, or null if all engines fail.
 */
async function callAI(prompt) {
    let result = null;
    const { GEMINI_API_KEYS } = BOT_CONFIG;

    // --- PHASE 1: PRIMARY ENGINE (GOOGLE GEMINI) ---
    if (Array.isArray(GEMINI_API_KEYS) && GEMINI_API_KEYS.length > 0) {
        for (const apiKey of GEMINI_API_KEYS) {
            if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') continue;
            
            const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
            
            for (const model of models) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    const payload = {
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { 
                            temperature: 0.9, 
                            topP: 0.95, 
                            maxOutputTokens: 4096 
                        }
                    };

                    const { data } = await axios.post(url, payload, { 
                        headers: { 'Content-Type': 'application/json' }, 
                        timeout: 30000 
                    });

                    result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (result) return result.trim();
                } catch (error) {
                    const status = error.response?.status || error.message;
                    console.warn(`[AI Engine] Gemini ${model} (Key: ...${apiKey.slice(-4)}) execution failed: ${status}`);
                    
                    // Proceed to next model/key on failure
                    if (error.response?.status === 400) continue; 
                }
            }
        }
    }

    // --- PHASE 2: FALLBACK ENGINE (POLLINATIONS POST API) ---
    if (!result) {
        try {
            console.warn('[AI Engine] Primary engine failed. Triggering fallback: Pollinations (POST)');
            const payload = {
                messages: [{ role: 'user', content: prompt }],
                model: 'openai',
                seed: Math.floor(Math.random() * 100000)
            };

            const { data } = await axios.post('https://text.pollinations.ai/', payload, { 
                headers: { 'Content-Type': 'application/json' }, 
                timeout: 45000 
            });

            const responseText = typeof data === 'string' ? data : data?.choices?.[0]?.message?.content;
            if (responseText?.trim()) return responseText.trim();
        } catch (error) {
            console.error(`[AI Engine] Fallback POST failed: ${error.message}`);
        }
    }

    // --- PHASE 3: TERTIARY FALLBACK (POLLINATIONS GET API) ---
    if (!result) {
        try {
            console.warn('[AI Engine] Secondary engine failed. Triggering tertiary fallback: Pollinations (GET)');
            const encodedPrompt = encodeURIComponent(prompt);
            const { data } = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=${Date.now()}`, { 
                timeout: 45000 
            });

            if (data && typeof data === 'string' && data.trim()) return data.trim();
        } catch (error) {
            console.error(`[AI Engine] Tertiary GET failed: ${error.message}`);
        }
    }

    // All engines exhausted
    return null;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
module.exports = { 
    callAI 
};
