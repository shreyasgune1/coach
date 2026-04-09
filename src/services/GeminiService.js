const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // Powered by Gemini 3 Flash Preview
            const model = this.genAI.getGenerativeModel(
                { 
                    model: "gemini-3-flash-preview",
                    systemInstruction: systemPrompt, 
                },
                { apiVersion: "v1beta" } 
            );

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