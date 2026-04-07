require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai");
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 36yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT SETUP
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
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

// 3. THE MESSAGE LISTENER
client.on('message_create', async (msg) => {
    if (msg.body.startsWith("🤖")) return;

    const myNumber = process.env.MY_NUMBER;
    const isMe = msg.from.includes(myNumber) || msg.to.includes(myNumber) || msg.to.includes('lid') || msg.from.includes('lid');
    
    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log("🎯 Trigger Detected: " + msg.body);
            
            try {
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 1.0
                    },
                });

                const responseText = result.text;
                await client.sendMessage(msg.from, "🤖 " + responseText);
                console.log("✅ Replied.");
                
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        }
    }
});

// 4. SYSTEM EVENTS
client.on('qr', qr => {
    console.log('--- SCAN THE QR CODE ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ AGENT ONLINE');
});

// 5. DAILY MOTIVATION
cron.schedule('0 10 * * *', async () => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give Shreyas a 1-sentence witty motivation for his Laravel coding.",
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        const myChatId = process.env.MY_NUMBER + "@c.us";
        await client.sendMessage(myChatId, "🤖 " + result.text);
    } catch (e) { console.error("Cron Error", e.message); }
});

client.initialize();