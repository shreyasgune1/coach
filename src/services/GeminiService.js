const { GoogleGenAI } = require("@google/genai");

class GeminiService {
    constructor(apiKey) {
        // The new SDK initializes with an object
        this.client = new GoogleGenAI({ apiKey });
    }

    async generateResponse(userInput, systemPrompt) {
        try {
            // The new generateContent method combines model and config
            const response = await this.client.generateContent({
                model: "gemini-2.0-flash", // Using the 2026 stable workhorse
                contents: [{ role: "user", parts: [{ text: userInput }] }],
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.8,
                },
            });

            return response.text();
        } catch (error) {
            console.error("❌ Gemini Service Error:", error.message);
            throw new Error("AI_GENERATION_FAILED");
        }
    }
}

module.exports = GeminiService;