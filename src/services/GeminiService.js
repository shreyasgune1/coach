const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // Tactical fallback to stable model due to 3.0 Preview server load
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: systemPrompt, 
            });

            const result = await model.generateContent(userInput);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error("❌ Gemini Service Error:", error.message);
            throw new Error("AI_GENERATION_FAILED");
        }
    }
}

module.exports = GeminiService;