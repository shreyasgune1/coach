require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai"); 
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3 (2026 SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 38yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT (Hardened for Railway 2026)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // WE ARE HARD-CODING THIS TO UNDEFINED
        // This forces Puppeteer to ignore Railway's variables and find its own Chrome
        executablePath: undefined, 
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--shm-size=3gb' // Gives the browser more "breathing room"
        ]
    }
});
/**
 * THE MESSAGE LISTENER
 */
client.on('message_create', async (msg) => {
    if (msg.body.startsWith("🤖")) return;

    // Detection logic for Shreyas (Supports both Number and LID)
    const myNumber = process.env.MY_NUMBER;
    const isMe = msg.from.includes(myNumber) || msg.to.includes(myNumber) || msg.from.includes('lid') || msg.to.includes('lid');
    
    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log(`[LOG] Thinking for Shreyas: "${msg.body}"`);
            
            try {
                // Official 2026 syntax: result.text is a property
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 1.0
                    },
                });

                await client.sendMessage(msg.from, "🤖 " + result.text);
                console.log("✅ Replied.");
                
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        }
    }
});

// 3. SYSTEM EVENTS
client.on('qr', qr => {
    console.log('--- SCAN THE QR CODE BELOW ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ AGENT ONLINE'));

// 4. DAILY MOTIVATION (10:00 AM IST)
cron.schedule('0 10 * * *', async () => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give Shreyas a 1-sentence witty motivation for his Laravel and UPSC goals.",
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        client.sendMessage(`${process.env.MY_NUMBER}@c.us`, "🤖 " + result.text);
    } catch (e) { console.error("Cron Error", e.message); }
});

client.initialize();