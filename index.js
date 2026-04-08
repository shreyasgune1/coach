require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai"); 
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3 (2026 SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 38yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT (Hardened to bypass "Can't link" errors)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--shm-size=3gb',
            // This hides the fact that a bot is controlling the browser
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

/**
 * THE MESSAGE LISTENER
 */
client.on('message_create', async (msg) => {
    // Prevent the bot from replying to its own messages
    if (msg.body.startsWith("🤖")) return;

    const myNumber = process.env.MY_NUMBER; // Ensure this is 91XXXXXXXXXX
    const isMe = msg.fromMe || 
                 msg.from.includes(myNumber) || 
                 msg.to.includes(myNumber) || 
                 msg.from.includes('lid') || 
                 msg.to.includes('lid');

    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke", "test"];
        
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            console.log(`[LOG] Thinking for Shreyas: "${msg.body}"`);
            try {
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: { systemInstruction: SYSTEM_PROMPT, temperature: 1.0 },
                });

                const responseText = result.text.startsWith("🤖") ? result.text : "🤖 " + result.text;
                await client.sendMessage(msg.from, responseText);
                console.log("✅ Response delivered.");
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        }
    }
});

/**
 * 3. PAIRING & QR SYSTEM
 */
client.on('qr', async (qr) => {
    console.log('\n---