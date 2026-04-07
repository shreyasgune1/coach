require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    try {
        // This is the core command to see what you actually have access to
        const result = await genAI.listModels();
        console.log("--- YOUR AVAILABLE MODELS ---");
        result.models.forEach(m => console.log(m.name));
        console.log("-----------------------------");
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}
listModels();