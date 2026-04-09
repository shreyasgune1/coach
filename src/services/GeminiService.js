const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor(apiKey) {
        // Use the official class name
        this.genAI = new GoogleGenerativeAI(apiKey);
        
        // Use the Gemini 3 Flash model as per our 2026 specs
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-3-flash" 
        });
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // We include the system instructions as part of the model configuration
            // or pass them in the content. For 2026 SDK, we can use generateContent.
            const chat = this.model.startChat({
                history: [],
                systemInstruction: systemPrompt,
            });

            const result = await chat.sendMessage(userInput);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("❌ Gemini API Error:", error.message);
            throw new Error("AI_GENERATION_FAILED");
        }
    }
}

module.exports = GeminiService;