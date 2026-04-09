require("dotenv").config();
const GeminiService = require("./src/services/GeminiService");
const TelegramService = require("./src/services/TelegramService");

/**
 * PHASE 1: Infrastructure Foundation
 * ---------------------------------
 * Goal: Establish a clean, modular entry point that separates 
 * API handling (Services) from core application logic.
 */

// 1. SANITY CHECK: Ensure environment variables are loaded
if (!process.env.GEMINI_API_KEY || !process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ ERROR: Missing API keys in .env file!");
    console.error("Please ensure GEMINI_API_KEY and TELEGRAM_BOT_TOKEN are defined in your .env file.");
    process.exit(1); 
}

// 2. INITIALIZATION: Setup the Core Services
const gemini = new GeminiService(process.env.GEMINI_API_KEY);
const telegram = new TelegramService(process.env.TELEGRAM_BOT_TOKEN);

// 3. CONFIGURATION: Temporary "Discovery Mode" prompt
// This will be replaced by the Orchestrator in Phase 3.
const SYSTEM_PROMPT = `
You are a high-fidelity AI collaborator. 
Current State: Discovery Mode. 
Protocol: Do not assume user background (UPSC, German, etc. are cleared).
Tone: Witty, efficient, and grounded. 
Goal: Observe the user's current energy and priorities to recalibrate in real-time.
`;

console.log("🚀 Agentic System: Phase 1 Online...");

// 4. MAIN INTERACTION LOOP
telegram.onMessage(async (msg) => {
    const chatId = msg.chat.id;
    const userInput = msg.text;

    // Log interaction for local debugging
    console.log(`[USER]: ${userInput}`);

    // Show 'typing' status in Telegram for better UX
    telegram.sendTyping(chatId);

    try {
        // Generate AI response
        const response = await gemini.generateResponse(userInput, SYSTEM_PROMPT);
        
        // Send back to Telegram
        await telegram.sendMessage(chatId, response);
        
    } catch (error) {
        console.error("Critical Failure in Loop:", error.message);
        
        const errorMessage = "I've hit a minor processing glitch. Let's try that again.";
        await telegram.sendMessage(chatId, errorMessage);
    }
});