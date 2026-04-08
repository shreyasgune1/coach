require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai");
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3 (2026 SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 38yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT (Optimized for Railway Nixpacks)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            // ADD THIS LINE BELOW: It tells WhatsApp "I am a normal Chrome user"
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

    // Detection logic for Shreyas (Supports Phone Number and LID)
    const myNumber = process.env.MY_NUMBER;
    const isMe = msg.from.includes(myNumber) || msg.to.includes(myNumber) || msg.from.includes('lid') || msg.to.includes('lid');
    
    // Process only if it's a private chat with yourself containing a trigger
    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log(`[LOG] Thinking for Shreyas: "${msg.body}"`);
            
            try {
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 1.0
                    },
                });

                // Prepend persona emoji
                const responseText = result.text.startsWith("🤖") ? result.text : "🤖 " + result.text;
                
                await client.sendMessage(msg.from, responseText);
                console.log("✅ Replied successfully.");
                
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        }
    }
});

// 3. WHATSAPP SYSTEM EVENTS
client.on('qr', (qr) => {
    console.log('\n--------------------------------------------------');
    console.log('--- SCAN THE QR CODE BELOW ---');
    console.log('--------------------------------------------------\n');
    
    // 1. GENERATE A CLEAN LINK (Click this in Railway Logs!)
    const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log("👉 CLICK THIS LINK FOR A CLEAN QR CODE TO SCAN:");
    console.log(qrLink);
    console.log('\n--------------------------------------------------');

    // 2. ALSO GENERATE THE TERMINAL VERSION
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ AGENT ONLINE: Your 24/7 Coach is standing by.');
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
        console.log("⏰ Morning motivation delivered.");
    } catch (e) { 
        console.error("Cron Error:", e.message); 
    }
});

client.initialize();