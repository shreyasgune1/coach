require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");
const cron = require("node-cron");

// 1. INITIALIZE GEMINI & TELEGRAM
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const SYSTEM_PROMPT = "You are a personal AI coach. Context: 38yo dev, UPSC aspirant, learning German. Tone: Witty and supportive. Always start with 🤖.";

// We will store your Chat ID here once you send the first message, 
// so the Cron job knows where to send the morning motivation.
let myChatId = null; 

// 2. MESSAGE LISTENER
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Save your chat ID automatically on the first message
    if (!myChatId) {
        myChatId = chatId;
        console.log(`[LOG] Registered owner Chat ID: ${myChatId}`);
    }

    if (!text) return; // Ignore stickers/photos for now

    console.log(`[LOG] Received: "${text}"`);

    // Telegram shows "typing..." status while Gemini thinks!
    bot.sendChatAction(chatId, "typing");

    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: text,
            config: { systemInstruction: SYSTEM_PROMPT, temperature: 1.0 },
        });

        const responseText = result.text.startsWith("🤖") ? result.text : "🤖 " + result.text;
        await bot.sendMessage(chatId, responseText);
        
    } catch (err) {
        console.error("❌ Gemini Error:", err.message);
        bot.sendMessage(chatId, "🤖 Oops, my brain glitched. Try again!");
    }
});

// 3. DAILY CRON JOB
cron.schedule("0 10 * * *", async () => {
    if (!myChatId) return; // Don't run if you haven't messaged the bot yet
    
    try {
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give a 1-sentence witty motivation for a UPSC aspirant today.",
            config: { systemInstruction: SYSTEM_PROMPT }
        });
        await bot.sendMessage(myChatId, "🤖 " + result.text);
    } catch (e) { 
        console.error("Cron Error:", e.message); 
    }
});

console.log("✅ TELEGRAM AGENT ONLINE");