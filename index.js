require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { GoogleGenAI } = require("@google/genai"); 
const cron = require("node-cron");

// 1. INITIALIZE GEMINI 3 (2026 SDK)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = "You are a personal AI coach. Context: 38yo dev, UPSC aspirant, learning German. Tone: Witty and supportive. Always start with 🤖.";

// 2. WHATSAPP CLIENT (Memory-Optimized)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--shm-size=3gb",
            "--disable-blink-features=AutomationControlled",
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ]
    }
});

// 3. MESSAGE LISTENER
client.on("message_create", async (msg) => {
    if (msg.body.startsWith("🤖")) return;

    const myNumber = process.env.MY_NUMBER; 
    const isMe = msg.fromMe || 
                 msg.from.includes(myNumber) || 
                 msg.to.includes(myNumber) || 
                 msg.from.includes("lid") || 
                 msg.to.includes("lid");

    if (isMe && !msg.from.includes("@g.us")) {
        const triggers = ["laravel", "hey", "hi", "coach", "german", "upsc", "fitness", "joke", "test"];
        if (triggers.some(t => msg.body.toLowerCase().includes(t))) {
            console.log("🎯 Trigger matched.");
            try {
                const result = await ai.models.generateContent({
                    model: "gemini-3-flash-preview", 
                    contents: msg.body,
                    config: { systemInstruction: SYSTEM_PROMPT, temperature: 1.0 },
                });
                const responseText = result.text.startsWith("🤖") ? result.text : "🤖 " + result.text;
                await client.sendMessage(msg.from, responseText);
                console.log("✅ Sent.");
            } catch (err) {
                console.error("❌ Gemini Error:", err.message);
            }
        }
    }
});

// 4. CONNECTION LOGIC (Line 70 and below - Rewritten for safety)
client.on("qr", async (qr) => {
    console.log("--- CONNECTION NEEDED ---");
    
    // Fallback QR in terminal
    qrcode.generate(qr, { small: true });

    // Clean QR Link
    const qrLink = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(qr);
    console.log("👉 SCAN THIS QR LINK: " + qrLink);

    // Pairing Code Request
    const myNumber = process.env.MY_NUMBER;
    if (myNumber) {
        try {
            console.log("👉 Requesting Pairing Code for: " + myNumber);
            const code = await client.requestPairingCode(myNumber);
            console.log("**************************************");
            console.log("PAIRED CODE: " + code);
            console.log("**************************************");
        } catch (err) {
            console.log("Pairing request failed. Use the QR link instead.");
        }
    }
});

client.on("ready", () => {
    console.log("✅ AGENT ONLINE");
});

// 5. CRON JOB
cron.schedule("0 10 * * *", async () => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give a 1-sentence witty motivation for a UPSC aspirant today.",
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        const myChatId = process.env.MY_NUMBER + "@c.us";
        await client.sendMessage(myChatId, "🤖 " + result.text);
    } catch (e) { console.error("Cron Error:", e.message); }
});

client.initialize();