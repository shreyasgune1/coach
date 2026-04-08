require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai"); 
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3 (2026 SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are Shreyas's personal AI coach. 38yo, Laravel/React dev, UPSC aspirant, German learner. Keep it supportive, witty, and always start your reply with 🤖.";

// 2. WHATSAPP CLIENT (Hardened for Railway + WhatsApp Security)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // No executablePath: Nixpacks will find Chrome automatically
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--shm-size=3gb',
            // USER-AGENT: Prevents "Can't link device" errors by masking as a real PC
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ]
    }
});

/**
 * THE MESSAGE LISTENER (Diagnostic Mode)
 */
client.on('message_create', async (msg) => {
    // A. LOG ALL ACTIVITY: This helps us see your ID in Railway logs
    console.log(`[DEBUG] Incoming -> From: ${msg.from} | To: ${msg.to} | fromMe: ${msg.fromMe} | Body: ${msg.body}`);

    // B. STOP LOOP: Don't reply to the bot's own responses
    if (msg.body.startsWith("🤖")) return;

    // C. IDENTITY DETECTION
    const myNumber = process.env.MY_NUMBER; // e.g., 919958337125
    
    // We check if it's from you, to you, or contains the special 'lid' identifier
    const isMe = msg.fromMe || 
                 msg.from.includes(myNumber) || 
                 msg.to.includes(myNumber) || 
                 msg.from.includes('lid') || 
                 msg.to.includes('lid');

    if (isMe && !msg.from.includes('@g.us')) {
        // Trigger words (keep it lowercase for matching)
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke", "test"];
        
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log(`🎯 IDENTITY MATCHED: Thinking for Shreyas...`);
            
            try {
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 1.0
                    },
                });

                const responseText = result.text.startsWith("🤖") ? result.text : "🤖 " + result.text;
                
                // For self-messages, sending to msg.from or msg.to usually works
                await client.sendMessage(msg.from, responseText);
                console.log("✅ Response delivered.");
                
            } catch (err) {
                console.error("❌ Gemini API Error:", err.message);
            }
        } else {
            console.log("ℹ️ Message detected, but no trigger word found.");
        }
    }
});

// 3. WHATSAPP SYSTEM EVENTS
client.on('qr', (qr) => {
    console.log('\n--------------------------------------------------');
    const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
    console.log("👉 SCAN THIS LINK FOR A CLEAN QR CODE:");
    console.log(qrLink);
    console.log('--------------------------------------------------\n');
    
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
    } catch (e) { 
        console.error("Cron Error:", e.message); 
    }
});

client.initialize();