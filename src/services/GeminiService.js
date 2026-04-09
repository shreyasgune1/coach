const { GoogleGenAI } = require("@google/genai");

class GeminiService {
    constructor(apiKey) {
        // Initialize the modern client
        this.client = new GoogleGenAI({ apiKey: apiKey });
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // Using the active 2026 model and the correct modern syntax
            const response = await this.client.models.generateContent({
                model: "gemini-2.5-flash", 
                contents: userInput,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.7
                }
            });

            // In the modern SDK, text is a property, not a function
            return response.text; 
            
        } catch (error) {
            console.error("❌ Gemini Service Error:", error.message);
            throw new Error("AI_GENERATION_FAILED");
        }
    }
}

module.exports = GeminiService;