const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        
        // We define the system instruction HERE during model initialization
        // The SDK requires this specific object structure
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // Use 1.5-flash for the most stable 2026 performance
        });
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // Correctly formatting the system instruction as a Content object
            const modelWithSystem = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: {
                    parts: [{ text: systemPrompt }],
                },
            });

            const result = await modelWithSystem.generateContent(userInput);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("❌ Gemini API Error:", error.message);
            throw new Error("AI_GENERATION_FAILED");
        }
    }
}

module.exports = GeminiService;