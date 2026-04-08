require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai");
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3 (2026 Edition)
// Railway will provide GEMINI_API_KEY from your Variables tab
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 38yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT (Optimized for Railway Nixpacks)
const client = new Client({
    authStrategy: new LocalAuth(), // Keeps you logged in across restarts
    puppeteer: {
        headless: true,
        // We leave out executablePath so Railway/Nixpacks can find it automatically
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

/**
 * THE MESSAGE LISTENER
 */
client.on('message_create', async (msg) => {
    // 1. Guard: Don't reply to the bot's own messages
    if (msg.body.startsWith("🤖")) return;

    // 2. Detection: Responds to your number or the LID (Message Yourself feature)
    const myNumber = process.env.MY_NUMBER;
    const isMe = msg.from.includes(myNumber) || msg.to.includes(myNumber) || msg.from.includes('lid') || msg.to.includes('lid');
    
    // Only process if it's a private chat with yourself and has a trigger word
    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log(`[LOG] Processing: "${msg.body}"`);
            
            try {
                // Calling the 2026 Gemini 3 Flash model
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 1.0
                    },
                });

                const responseText = result.text;
                
                // Prepend emoji if not present (persona check)
                const finalReply = responseText.startsWith("🤖") ? responseText : "🤖 " + responseText;
                
                await client.sendMessage(msg.from, finalReply);
                console.log("✅ Replied successfully.");
                
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        }
    }
});

// 3. WHATSAPP SYSTEM EVENTS
client.on('qr', qr => {
    console.log('--- SCAN THE QR CODE BELOW IN YOUR RAILWAY LOGS ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ AGENT ONLINE: Standing by for Shreyas.');
});

// 4. DAILY MOTIVATION (10:00 AM IST)
cron.schedule('0 10 * * *', async () => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give Shreyas a 1-sentence witty motivation for his Laravel coding and UPSC prep.",
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        const myChatId = `${process.env.MY_NUMBER}@c.us`;
        await client.sendMessage(myChatId, "🤖 " + result.text);
        console.log("⏰ Daily motivation sent.");
    } catch (e) { console.error("Cron Error", e.message); }
});

client.initialize();