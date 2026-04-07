require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenAI } = require("@google/genai"); 
const cron = require('node-cron');

// 1. INITIALIZE GEMINI 3
// The new SDK handles the 2026 models natively
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

const SYSTEM_PROMPT = `You are Shreyas's personal AI coach. 
Context: 36yo developer, building a UPSC quiz app in Laravel, learning German, and focusing on fitness. 
Tone: Supportive, witty, and concise. Always start replies with 🤖.`;

// 2. WHATSAPP CLIENT (Hardened for Railway)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Railway provides the Chrome path via environment variables in the Dockerfile
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
 * 3. THE BRAIN (Gemini 3 Logic)
 */
async function generateCoachResponse(userMessage) {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: userMessage,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 1.0, // Recommended for Gemini 3
            },
        });
        return result.text;
    } catch (err) {
        console.error("❌ Gemini API Error:", err.message);
        return "My brain hit a snag. Check the logs!";
    }
}

/**
 * 4. WHATSAPP EVENT LISTENERS
 */
client.on('qr', qr => {
    // On Railway, you will view this in the "View Logs" tab
    console.log('--- SCAN THIS QR CODE IN YOUR RAILWAY LOGS ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ AGENT LIVE: Your coach is now running 24/7 on Railway.');
});

client.on('message_create', async (msg) => {
    // 1. Prevent the bot from replying to itself
    if (msg.body.startsWith("🤖")) return;

    // 2. Identification Logic for "Message Yourself" (LID & Phone Number)
    const myNumber = process.env.MY_NUMBER;
    const isMe = msg.from.includes(myNumber) || msg.to.includes(myNumber) || msg.to.includes('lid');

    if (isMe && !msg.from.includes('@g.us')) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            
            console.log(`💬 Processing request from Shreyas: "${msg.body}"`);
            const response = await generateCoachResponse(msg.body);
            
            // Ensure the persona prefix is there
            const finalReply = response.startsWith("🤖") ? response : "🤖 " + response;
            
            await client.sendMessage(msg.from, finalReply);
            console.log("✅ Response delivered.");
        }
    }
});

/**
 * 5. SCHEDULED CHECK-INS (10:00 AM IST)
 */
cron.schedule('0 10 * * *', async () => {
    try {
        const motivation = await generateCoachResponse("Give Shreyas a 1-sentence witty motivation for his Laravel and UPSC goals today.");
        const myChatId = `${process.env.MY_NUMBER}@c.us`;
        await client.sendMessage(myChatId, motivation.startsWith("🤖") ? motivation : "🤖 " + motivation);
        console.log("⏰ Morning motivation sent!");
    } catch (e) {
        console.error("Cron Error:", e.message);
    }
});

client.initialize();