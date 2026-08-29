/**
 * @file tts.js
 * @description Text-to-Speech (TTS) Engine providing neural voice capabilities.
 *              Uses ElevenLabs as the primary provider with Microsoft Edge Neural TTS as a reliable fallback.
 *              Includes automated formatting and Opus codec conversion for WhatsApp Voice Note (PTT) compatibility.
 * @author OWL ABE
 * @version 3.0.0
 * @license MIT
 */

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// IMPORTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

// Initialize FFmpeg path for audio processing
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Cleans the input text for optimal TTS reading.
 * Removes markdown formatting, action asterisks, emojis, and unsupported symbols.
 * 
 * @param {string} text - The raw text from the AI response.
 * @returns {string} The cleaned string ready for the TTS engine.
 */
function cleanTextForTTS(text) {
    return text
        .replace(/\*[^*]*\*/g, '')               // Remove *action statements*
        .replace(/[_~`]/g, '')                   // Remove markdown symbols
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')  // Remove emojis
        .replace(/[^\w\s,.!?';:()\-]/gu, '')      // Remove weird symbols, keep basic punctuation
        .replace(/\s+/g, ' ')                    // Normalize spacing
        .trim();
}

/**
 * Converts an MP3 buffer to an OGG buffer (Opus codec).
 * Required for WhatsApp Voice Notes (PTT) which only accept Opus-encoded audio.
 * 
 * @param {Buffer} mp3Buffer - The raw MP3 buffer from the TTS provider.
 * @returns {Promise<Buffer>} Resolves to the OGG-encoded buffer, or raw MP3 on fallback.
 */
async function convertToOgg(mp3Buffer) {
    const tempId = Date.now();
    const tempDirectory = path.join(__dirname, '../../temp_audio');
    
    // Ensure temporary directory exists
    if (!fs.existsSync(tempDirectory)) {
        fs.mkdirSync(tempDirectory, { recursive: true });
    }

    const inputPath = path.join(tempDirectory, `tts_in_${tempId}.mp3`);
    const outputPath = path.join(tempDirectory, `tts_out_${tempId}.ogg`);

    // Write temp MP3
    fs.writeFileSync(inputPath, mp3Buffer);

    return new Promise((resolve) => {
        ffmpeg(inputPath)
            .audioCodec('libopus')
            .toFormat('ogg')
            .on('end', () => {
                const oggBuffer = fs.readFileSync(outputPath);
                // Cleanup temp files
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                resolve(oggBuffer);
            })
            .on('error', (err) => {
                console.warn(`[FFmpeg] Conversion to Opus failed: ${err.message}. Falling back to MP3.`);
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                resolve(mp3Buffer); // Fallback to raw MP3 on failure
            })
            .save(outputPath);
    });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// TTS PROVIDERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Primary Engine: ElevenLabs (High Quality Neural Voice).
 * Default Voice: Nesah Paramitha (Indonesian Female).
 * 
 * @param {string} text - The cleaned text to synthesize.
 * @returns {Promise<Buffer|null>} The audio buffer or null on failure.
 */
async function generateElevenLabsTTS(text) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'fUesUKVrbYRcEnWoLXet';
    
    if (!apiKey) return null;

    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { 
                    stability: 0.5, 
                    similarity_boost: 0.75 
                }
            },
            {
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                responseType: 'arraybuffer',
                timeout: 20000
            }
        );

        const mp3Buffer = Buffer.from(response.data);
        return await convertToOgg(mp3Buffer);

    } catch (error) {
        const status = error.response?.status;
        if (status === 401) {
            console.warn('[ElevenLabs] API key invalid or unauthorized.');
        } else if (status === 429 || status === 402) {
            console.warn('[ElevenLabs] Quota exceeded or free-tier limitation hit.');
        } else {
            console.error(`[ElevenLabs] API Error: ${error.message}`);
        }
        return null;
    }
}

/**
 * Fallback Engine: Microsoft Edge Neural TTS.
 * Default Voice: id-ID-GadisNeural.
 * Free, unlimited, fast, and high availability.
 * 
 * @param {string} text - The cleaned text to synthesize.
 * @returns {Promise<Buffer|null>} The audio buffer or null on failure.
 */
async function generateEdgeTTS(text) {
    try {
        const edgeTTS = new MsEdgeTTS();
        await edgeTTS.setMetadata('id-ID-GadisNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        
        const { audioStream } = await edgeTTS.toStream(text);
        
        const mp3Buffer = await new Promise((resolve, reject) => {
            const chunks = [];
            audioStream.on('data', chunk => chunks.push(chunk));
            audioStream.on('end', () => resolve(Buffer.concat(chunks)));
            audioStream.on('error', reject);
        });

        if (!mp3Buffer || mp3Buffer.length < 100) return null;
        return await convertToOgg(mp3Buffer);

    } catch (error) {
        console.error(`[Edge TTS] Processing Error: ${error.message}`);
        return null;
    }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Master TTS generation function. 
 * Orchestrates the pipeline: Text Cleaning -> Primary Provider -> Fallback Provider -> Codec Conversion.
 * 
 * @param {string} text - The input text.
 * @returns {Promise<Buffer|null>} The final Opus-encoded OGG audio buffer ready for WA broadcast.
 */
async function generateTTS(text) {
    const cleanText = cleanTextForTTS(text);
    if (!cleanText || cleanText.length < 2) return null;

    // Phase 1: Primary Provider (ElevenLabs)
    const primaryAudio = await generateElevenLabsTTS(cleanText);
    if (primaryAudio) {
        console.info('[TTS Pipeline] Success via ElevenLabs (Neural Engine)');
        return primaryAudio;
    }

    // Phase 2: Fallback Provider (Edge TTS)
    console.info('[TTS Pipeline] Falling back to Edge Neural TTS');
    return await generateEdgeTTS(cleanText);
}

module.exports = { 
    generateTTS, 
    generateTikTokTTS: generateTTS // Alias for backward compatibility
};
