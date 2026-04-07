require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai"); // Official 2026 SDK
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3
// The SDK automatically looks for GEMINI_API_KEY in your environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 36yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT SETUP (Server-Optimized)
const client = new Client({
    authStrategy: new LocalAuth(), // Persistent session
    puppeteer: {
        // Use the path provided in Railway variables, fallback to null for local
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        headless: true,
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
    // Log for Railway terminal debugging
    console.log(`[EVENT] From: ${msg.from} | To: ${msg.to} | Body: ${msg.body} | fromMe: ${msg.fromMe}`);

    // 1. LOOP GUARD: Ignore messages starting with our bot emoji
    if (msg.body.startsWith("🤖")) return;

    // 2. SELF-CHAT DETECTION: Target your number or LID
    const myNumber = process.env.MY_NUMBER;
    const isMe = msg.from.includes(myNumber) || msg.to.includes(myNumber) || msg.to.includes('lid') || msg.from.includes('lid');
    
    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log(`🎯 Trigger Detected! Calling Gemini 3...`);
            
            try {
                // --- OFFICIAL 2026 SYNTAX ---
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 1.0
                    },
                });

                // Get result text directly from the response object
                const responseText = result.text;
                
                await client.sendMessage(msg.from, "🤖 " + responseText);
                console.log("✅ Replied successfully.");
                
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        }
    }
});

// 3. WHATSAPP SYSTEM EVENTS
client.on('qr', qr => {
    console.log('--- SCAN THE QR CODE IN RAILWAY LOGS ---');
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
            contents: "Give Shreyas a 1-sentence witty motivation for his Laravel coding.",
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        const myChatId = `${process.env.MY_NUMBER}@c.us`;
        await client.sendMessage(myChatId, "🤖 " + result.text);
    } catch (e) { console.error("