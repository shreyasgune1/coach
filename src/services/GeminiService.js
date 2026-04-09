const { GoogleGenAI } = require("@google/genai");

class GeminiService {
    constructor(apiKey) {
        // Initialize the modern client
        this.client = new GoogleGenAI({ apiKey: apiKey });
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // Note the correct syntax: this.client.models.generateContent
            const response = await this.client.models.generateContent({
                model: "gemini-2.0-flash", // The highly stable, fast 2026 workhorse
                contents: userInput,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.7
                }
            });

            // In the new SDK, text is a property, not a function ()
            return response.text; 
            
        } catch (error) {
            console.error("❌ Gemini Service Error:", error.message);
            throw new Error("AI_GENERATION_FAILED");
        }
    }
}

module.exports = GeminiService;